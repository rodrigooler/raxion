# RAXION

Sovereign SVM Rollup on Solana that proves AI inference quality mathematically. Three heterogeneous ML architectures (Transformer, SSM, Neuro-Symbolic) process queries in parallel; their convergence, measured by a formal Coherence Score, generates a zk-ML proof called Cognitive Finality. This replaces human subjective consensus with cryptographic verification via **Proof of Inference Quality (PoIQ)**.

## Live Environments

| Network | Explorer | Program ID | Status |
|---------|----------|------------|--------|
| Devnet | [devnet.raxion.network](https://devnet.raxion.network) | `5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT` | Live |
| Testnet | [testnet.raxion.network](https://testnet.raxion.network) | `5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT` | Live |

Website: [raxion.network](https://raxion.network)

## Development Status

| Phase | Status | Scope |
|-------|--------|-------|
| Phase 0: Genesis (Q1 2026) | Complete | Whitepaper, Python PoC, RISC Zero basic integration |
| Phase 1: Devnet (Q2 2026) | Complete | Agave integration, PoIQ v0.1, Agent SDK v0.1, devnet deploy |
| **Phase 2: Testnet (Q4 2026)** | **Active** | GPU proofs, all PoIQ layers, RaxLang v0.1 |
| Phase 3: Mainnet (2027) | Planned | ZK ASICs, full protocol, $RAX live |

## Quick Start

### Run the Explorer locally

```bash
cd apps/explorer
cp .env.example .env
npm install
npm run dev
# Open http://localhost:3001
```

### Run a Smart Agent (SDK)

The SDK provides the `SmartAgent` trait and `AgentRunner` for submitting inferences to the network.

```bash
# Requires: Solana wallet at ~/.config/solana/id.json, Ollama running locally
cd sdk/agent
cargo run --example math_agent
```

The runner loads your wallet, initializes the agent on-chain if needed, processes queries, and submits `submit_convergence` transactions.

### Deploy the program

Requires Docker (or Apple `container` CLI on macOS).

```bash
# Build Docker image with Anchor + Solana CLI
container build --platform linux/amd64 -f ops/docker/anchor-devnet/Dockerfile -t raxion/anchor-devnet:0.1 .

# Build and deploy to devnet
container run --rm --platform linux/amd64 \
  -v "$(pwd)":/work -v "$HOME/.config/solana":/home/raxion/.config/solana \
  -e HOME=/home/raxion -e CARGO_HOME=/work/.cargo-home -w /work \
  raxion/anchor-devnet:0.1 bash -c "
    solana config set --url devnet --keypair /home/raxion/.config/solana/id.json &&
    cargo build-sbf --manifest-path programs/raxion-poiq/Cargo.toml &&
    cp programs/raxion-poiq/target/deploy/raxion_poiq.so target/deploy/ &&
    solana program deploy target/deploy/raxion_poiq.so \
      --program-id target/deploy/raxion_poiq-keypair.json"
```

### Seed test inferences

```bash
ln -sf apps/explorer/node_modules node_modules
node scripts/devnet_seed.mjs 20
```

### Run tests

```bash
cargo test --workspace          # 42 Rust tests
.venv/bin/pytest poc/tests/ -v  # 23 Python PoC tests
```

## Repository Structure

```
raxion/
  apps/
    explorer/         Devnet/testnet explorer (Vite + Vinext, Cloudflare Workers)
    site/             Static website (Next.js, Cloudflare Pages)
  programs/
    raxion-poiq/      PoIQ protocol: convergence, slashing, challenges (Anchor 1.1)
    raxion-rollup/    Sovereign rollup state root commitments
    raxion-token/     $RAX tokenomics scaffold
  runtime/
    cognitive/        Neural SVM extensions: scheduler, memory, convergence
  sdk/
    agent/            SmartAgent trait, AgentRunner, memory, inference
    raxlang/          RaxLang DSL compiler (parser + transpiler)
  proofs/
    risc0-guest/      RISC Zero guest programs (zkVM)
    risc0-host/       Prove flow and host utilities
    risc0-types/      Shared types for proof pipeline
  poc/                Python proof-of-concept and benchmarks
  ops/docker/         Docker toolchain for Anchor/Solana builds
  scripts/            Deploy, seed, and validation scripts
```

## Documentation

- [Whitepaper](WHITEPAPER.md)
- [Project Context for Agents](AGENTS.md)
- [Persistent Decisions](MEMORY.md)
- [Claude Context](CLAUDE.md)

## Contributing

See open issues at [github.com/rodrigooler/raxion/issues](https://github.com/rodrigooler/raxion/issues) and [Milestones](https://github.com/rodrigooler/raxion/milestones).

Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## Disclaimer

This project is in active development. All deployments are on Solana devnet/testnet. The $RAX token has no real value. Smart contracts are not audited. Protocol parameters may change. See [LICENSE](LICENSE) for terms.

## License

Core protocol: [BUSL 1.1](LICENSE), change date 2030-02-20 to MIT.
SDKs and developer tooling: Apache 2.0.
