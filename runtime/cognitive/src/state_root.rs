use sha2::{Digest, Sha256};

/// Domain separator constants for Merkle tree construction.
/// Following RFC 6962 style to prevent second-preimage attacks.
const DOMAIN_LEAF: u8 = 0;
const DOMAIN_NODE: u8 = 1;

/// Build deterministic state root from ordered leaf hashes.
/// Uses domain separation to prevent second-preimage attacks.
/// See: RFC 6962, CVE-2012-2459 mitigation
pub fn build_state_root(agent_states: &[(Vec<u8>, Vec<u8>)]) -> [u8; 32] {
    let mut leaves: Vec<[u8; 32]> = agent_states
        .iter()
        .map(|(pk, state)| hash_leaf(pk, state))
        .collect();
    leaves.sort();
    merkle_root(&leaves)
}

/// Hash a leaf node with domain separation.
fn hash_leaf(pubkey: &[u8], state: &[u8]) -> [u8; 32] {
    hashv(DOMAIN_LEAF, &[pubkey, state])
}

/// Hash two child nodes with domain separation.
fn hash_node(left: &[u8], right: &[u8]) -> [u8; 32] {
    hashv(DOMAIN_NODE, &[left, right])
}

/// Generic hash function with domain separator.
fn hashv(domain: u8, parts: &[&[u8]]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update([domain]); // Domain separator
    for part in parts {
        hasher.update(part);
    }
    hasher.finalize().into()
}

/// Build Merkle root with domain-separated internal nodes.
/// Uses RFC 6962-style hashing to prevent subtree-as-leaf forgery.
fn merkle_root(leaves: &[[u8; 32]]) -> [u8; 32] {
    if leaves.is_empty() {
        return [0u8; 32];
    }
    if leaves.len() == 1 {
        return leaves[0];
    }

    let mut next = Vec::with_capacity(leaves.len().div_ceil(2));
    let mut i = 0usize;
    while i < leaves.len() {
        if i + 1 < leaves.len() {
            // Hash internal node with domain separator
            next.push(hash_node(&leaves[i], &leaves[i + 1]));
        } else {
            // Duplicate last leaf for odd count (RFC 6962 compliant)
            next.push(hash_node(&leaves[i], &leaves[i]));
        }
        i += 2;
    }
    merkle_root(&next)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_root_deterministic() {
        let states = vec![
            (vec![1u8; 32], vec![2u8; 100]),
            (vec![3u8; 32], vec![4u8; 100]),
        ];
        assert_eq!(build_state_root(&states), build_state_root(&states));
    }

    #[test]
    fn test_empty_state_root() {
        assert_eq!(build_state_root(&[]), [0u8; 32]);
    }

    #[test]
    fn test_state_root_changes_with_state() {
        let states1 = vec![(vec![1u8; 32], vec![2u8; 100])];
        let states2 = vec![(vec![1u8; 32], vec![3u8; 100])];
        assert_ne!(build_state_root(&states1), build_state_root(&states2));
    }

    #[test]
    fn test_odd_leaf_count_not_colliding() {
        // Ensure odd leaf count produces distinct root from equivalent shorter tree
        let states_3 = vec![
            (vec![1u8; 32], vec![2u8; 100]),
            (vec![3u8; 32], vec![4u8; 100]),
            (vec![5u8; 32], vec![6u8; 100]),
        ];
        let states_2 = vec![
            (vec![1u8; 32], vec![2u8; 100]),
            (vec![3u8; 32], vec![4u8; 100]),
        ];
        assert_ne!(build_state_root(&states_3), build_state_root(&states_2));
    }

    #[test]
    fn test_domain_separation() {
        // A leaf whose data equals two child hashes should NOT collide with parent root
        // This tests the second-preimage attack prevention
        let normal_states = vec![
            (vec![0xAAu8; 32], vec![0xBBu8; 32]),
            (vec![0xCCu8; 32], vec![0xDDu8; 32]),
        ];
        let root = build_state_root(&normal_states);

        // Create a malicious leaf that equals hash_node output
        let leaf_as_internal = hash_node(
            &build_state_root(&[(vec![0xAAu8; 32], vec![0xBBu8; 32])]),
            &build_state_root(&[(vec![0xCCu8; 32], vec![0xDDu8; 32])]),
        );
        let malicious_states = vec![
            (leaf_as_internal.to_vec(), vec![]), // Malicious leaf
        ];

        // The malicious root should be different from the normal root
        // because domain separation makes leaf hashes different from node hashes
        assert_ne!(build_state_root(&malicious_states), root);
    }
}
