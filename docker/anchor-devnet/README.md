# Anchor Devnet Docker Image

Pinned toolchain image for RAXION Q2 deploy tasks.

## Versions

- Rust: 1.82
- Solana/Agave CLI: `v2.1.21`
- Anchor CLI: `v0.30.1`

## Build

```bash
docker build -f docker/anchor-devnet/Dockerfile -t raxion/anchor-devnet:0.1 .
```

## Shell

```bash
./scripts/docker_anchor_shell.sh
```

## Deploy

```bash
./scripts/docker_deploy_poiq_devnet.sh
```
