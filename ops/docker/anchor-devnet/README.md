# Anchor Devnet Docker Image

Pinned toolchain image for RAXION Q2 deploy tasks.

## Versions

- Rust: 1.88
- Solana/Agave CLI: `v2.3.8`
- Anchor CLI: `v0.30.1`

## Build

```bash
docker build -f ops/docker/anchor-devnet/Dockerfile -t raxion/anchor-devnet:0.1 .
```

On Apple Silicon, wrappers force `linux/amd64` by default for better Solana/Anchor compatibility.
Override if needed:

```bash
DOCKER_PLATFORM=linux/amd64 ./scripts/docker_anchor_shell.sh
```

## Shell

```bash
./scripts/docker_anchor_shell.sh
```

## Deploy

```bash
./scripts/docker_deploy_poiq_devnet.sh
```
