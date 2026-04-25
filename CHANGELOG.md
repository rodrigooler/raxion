# Changelog

All notable changes to the RAXION protocol are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] - Q4 Testnet Phase

### Active Development
- **Milestone M1**: Public Testnet Bootstrap (In Progress)
  - Infrastructure: Production RPC, PoIQ Indexer, Observability Stack
  - Protocol: Testnet Deployment, Challenge/Slash Monitoring, ZK Proof Infrastructure

### Added
- GitHub Q4 Roadmap with 4 milestones and 19 detailed issues
- Branch protection on `main` (Q2 Validate + Python Tests required)
- CodeRabbit integration for automated code review

---

## [2026-04-25] - Q3 Testnet Readiness

### Fixed (Critical CodeRabbit Issues)
- ESM/CommonJS mix in `api/server.ts` - Converted to consistent ESM imports
- Express methods on native `http.ServerResponse` - Created Response wrapper
- CC formula not normalized in `proofs/jolt-circuits` - Added [0,1] normalization
- `is_final` returns Option instead of bool - Fixed to return Option with proper handling
- Merkle root without domain separation - Added `DOMAIN_STATE_ROOT` constant
- Makefile `$(pwd)` variable expansion - Fixed to `$(shell pwd)`
- Program ID collision: `raxion-rollup` and `raxion-poiq` - New ID for raxion-rollup: `7R2iZ8qL3mN5pQ9vT6wX1yA4sK8eHjFgDcB0kMmNnOo`

### Fixed (SonarCloud Code Smells)
- 21 duplicate imports consolidated across 10 locale files (blog, announcements)
- Nested template literals in `apps/site/lib/site.ts`
- Return values of `sqrt`/`sin` not used in `scripts/gpu_benchmark.js`
- Cognitive complexity > 15 in `scripts/devnet_stress_test.py`
- Unused imports and assignments across `apps/explorer`, `api/server.ts`, scripts
- Zero fractions (`.0` → `0`) and parseInt/parseFloat standardization
- Node.js module imports with `node:` prefix

### CI/CD
- Regenerated `package-lock.json` for explorer app
- Changed `npm ci` to `npm install` for compatibility
- Removed npm cache to resolve lock file mismatch

---

## [2026-04-24] - Q2 Devnet Launch

### Added
- Devnet explorer (Next.js) at `apps/explorer/`
- Devnet API routes at `api/`
- Network loadgen example
- Pre-audit validation scripts

### Programs Deployed to Devnet
| Program | Program ID | Status |
|---------|------------|--------|
| `raxion-poiq` | `5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT` | ✅ Active |
| `raxion-token` | `RaxToKen11111111111111111111111111111111111` | ✅ Active |
| `raxion-rollup` | `7R2iZ8qL3mN5pQ9vT6wX1yA4sK8eHjFgDcB0kMmNnOo` | ✅ Active |

---

## [2026-04-23] - Q2 Core Implementation

### Added
- `programs/raxion-poiq` - Core PoIQ protocol with convergence, challenges, slashing
- `programs/raxion-rollup` - State root management
- `programs/raxion-governance` - On-chain parameter governance
- `runtime/cognitive` - Cognitive scheduler and memory management
- `runtime/zk` - RISC Zero and Jolt proof integration
- `proofs/risc0-guest` - RISC Zero guest programs for π_exec
- `proofs/jolt-circuits` - Jolt circuits for π_quality

### Implemented
- Three PoIQ Layers:
  - Layer 1: Statistical Convergence (CoherenceScore)
  - Layer 2: Stochastic Verification (1.5% challenge rate)
  - Layer 3: Chronic Divergence Detection
- Three Architecture Convergence:
  - Transformer (frequency biases)
  - SSM (recency biases)
  - Neuro-Symbolic (formalization biases)
- Slashing mechanism with caps (0.1% total stake/hour)

---

## [2026-03-31] - Q1 Genesis Complete

### Added
- Whitepaper v0.4 (English and Portuguese)
- Python PoC (`poc/`) with:
  - Transformer, SSM, Neuro-Symbolic model wrappers
  - CoherenceScore implementation
  - Convergence analysis
- `sdk/agent` - Rust SDK for Smart Agent development
- Initial project structure following SVM/Anchor conventions

### Documentation
- `AGENTS.md` - Agent context and coding standards
- `MEMORY.md` - Project state and decisions
- `RUNBOOK.md` - Operational procedures
- `DEPLOY.md` - Deployment guide
- `SECURITY.md` - Security policy and contacts
- `CONTRIBUTING.md` - Contribution guidelines

### Protocol Design
- Proof of Inference Quality (PoIQ) concept formalized
- Cognitive Finality definition: VERIFY(π_exec × 3) = ACCEPT ∧ VERIFY(π_quality) = ACCEPT ∧ CoherenceScore ≥ 0.60
- $RAX tokenomics: 1,000,000,000 fixed supply
- Stake-based parallelism: `floor(log₂(stake/1000) × 8) + 1` threads

---

## [2026-01-15] - Project Inception

- Repository initialized
- License decided: BUSL 1.1 → MIT (2030-02-20)
- Core team alignment on SVM over EVM
- Solana ecosystem choice for ZK/AI integration

---

## Legend

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features that will be removed
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
- **Infrastructure**: CI/CD, deployment, tooling

---

## Migration Notes

### v0.4 → v0.5 (Planned)

- RaxLang v0.1 DSL compiler for agent definition
- GPU-accelerated proof generation
- Full three-layer PoIQ implementation
- Testnet with external agents

### Pre-Mainnet Checklist

- [ ] 90-day stability clock completed
- [ ] External security audit passed
- [ ] All Critical/High findings remediated
- [ ] Bug bounty program active
- [ ] Multi-sig governance operational
