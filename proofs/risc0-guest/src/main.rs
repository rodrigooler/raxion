#![no_main]
#![no_std]

extern crate alloc;

use risc0_types::{
    categorize, compute_cs_semantic, CoherenceCommitment, EmbeddingInput, ALPHA, BETA,
};
use risc0_zkvm::guest::env;
use sha2::{Digest, Sha256};

risc0_zkvm::guest::entry!(main);

fn hash_embeddings(emb: &[f32]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    for value in emb {
        hasher.update(value.to_le_bytes());
    }
    hasher.finalize().into()
}

fn main() {
    let input: EmbeddingInput = env::read();

    assert_eq!(
        input.embedding_t.len(),
        input.embedding_s.len(),
        "embedding dimensions must match"
    );

    if let Some(ref emb_n) = input.embedding_n {
        assert_eq!(
            input.embedding_t.len(),
            emb_n.len(),
            "embedding_n dimensions must match"
        );
    }

    let cs_semantic = compute_cs_semantic(
        &input.embedding_t,
        &input.embedding_s,
        input.embedding_n.as_deref(),
    );

    // Phase-1 approximation for CC while logical circuits are not in zkVM yet.
    let cc_approximate = (0.8 * cs_semantic + 0.14).clamp(0.0, 1.0);
    let coherence_score = (ALPHA * cs_semantic + BETA * cc_approximate).clamp(0.0, 1.0);

    let embedding_t_hash = hash_embeddings(&input.embedding_t);
    let embedding_s_hash = hash_embeddings(&input.embedding_s);
    let embedding_n_hash = input
        .embedding_n
        .as_ref()
        .map(|n| hash_embeddings(n))
        .unwrap_or([0u8; 32]);

    env::commit(&CoherenceCommitment {
        coherence_score,
        cs_semantic,
        embedding_t_hash,
        embedding_s_hash,
        embedding_n_hash,
        category: categorize(coherence_score),
    });
}
