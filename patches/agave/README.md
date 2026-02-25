# Agave Patches

This directory stores local RAXION patches to be applied on top of the pinned Agave commit fetched by:

```bash
./scripts/fetch_agave.sh
```

Guidelines:
- Keep patches small and focused.
- Name files with ordering prefix, e.g. `0001-cognitive-hooks.patch`.
- Regenerate patches with `git format-patch` from a clean Agave working tree.

