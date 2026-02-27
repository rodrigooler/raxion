use sha2::{Digest, Sha256};

/// Build deterministic state root from ordered leaf hashes.
pub fn build_state_root(agent_states: &[(Vec<u8>, Vec<u8>)]) -> [u8; 32] {
    let mut leaves: Vec<[u8; 32]> = agent_states
        .iter()
        .map(|(pk, state)| hashv(&[pk, state]))
        .collect();
    leaves.sort();
    merkle_root(&leaves)
}

fn hashv(parts: &[&[u8]]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    for part in parts {
        hasher.update(part);
    }
    hasher.finalize().into()
}

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
            next.push(hashv(&[&leaves[i], &leaves[i + 1]]));
        } else {
            next.push(leaves[i]);
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
}
