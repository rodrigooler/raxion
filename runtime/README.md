# Runtime Layout (Q2 Devnet)

- `runtime/agave/`: upstream Agave imported via `git subtree` (v2.1 branch)
- `runtime/cognitive/`: RAXION cognitive extensions (`raxion-cognitive` crate)

This keeps upstream history isolated while allowing incremental integration of the cognitive runtime.
In this stage, no direct modifications were applied inside `runtime/agave/`.
