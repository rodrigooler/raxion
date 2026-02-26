# Runtime Layout (Q2 Devnet)

- `runtime/agave/`: upstream Agave fetched on demand via `./scripts/fetch_agave.sh` (pinned commit)
- `runtime/cognitive/`: RAXION cognitive extensions (`raxion-cognitive` crate)

This keeps the repository lean while preserving deterministic runtime bootstrap.
Local runtime patches should live under `patches/agave/*.patch`.
