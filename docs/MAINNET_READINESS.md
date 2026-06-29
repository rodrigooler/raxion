# RAXION Mainnet Readiness Assessment

**Date**: 2026-06-29
**Target**: Mainnet v1 (2027)

## Protocol Completeness

| Requirement | Status | Blocker |
|---|---|---|
| PoIQ Layer 1 (CoherenceScore) | Done | -- |
| PoIQ Layer 2 (Stochastic Verification) | Done | SlotHashes uses Clock fallback (predictable) |
| PoIQ Layer 3 (Slashing) | Done (event-only) | No actual token transfers yet |
| submit_convergence instruction | Done | -- |
| submit_challenge_response instruction | Done | -- |
| resolve_challenge instruction | Done | No access control (devnet-only) |
| expire_challenge instruction | Done | -- |
| submit_dissent instruction | Done | -- |
| init_agent instruction | Done | Devnet convenience, remove for mainnet |
| Cognitive Finality composite proof | Not started | Needs ZK proof aggregation |

## Security

| Requirement | Status | Blocker |
|---|---|---|
| Anchor constraints on all accounts | Done | -- |
| PDA derivation prevents injection | Done | Verified in tests |
| Integer-safe slashing arithmetic | Done | Basis-point path, no float truncation |
| Audit package prepared | Done | docs/AUDIT_PACKAGE.md |
| External security audit | Not started | Need to select and engage auditor ($) |
| resolve_challenge access control | Not started | Add authority PDA before mainnet |
| Multi-sig for upgrades | Not started | Need multi-sig wallet ($) |
| Emergency pause functionality | Not started | Add pause_protocol instruction |
| Bug bounty program | Not started | Need platform + funds ($) |

## Infrastructure

| Requirement | Status | Blocker |
|---|---|---|
| Program deployed (devnet) | Done | -- |
| Program deployed (testnet) | Done | -- |
| Explorer (devnet + testnet) | Done | Cloudflare Workers |
| Site (raxion.network) | Done | Cloudflare Pages |
| Event indexer | Done | In-explorer, no separate DB |
| Production RPC endpoints | Not started | Need Helius/QuickNode account ($) |
| Observability stack | Not started | Need Grafana/Prometheus server ($) |
| CI pipeline | Done | 3 jobs, 74 tests |

## Economic

| Requirement | Status | Blocker |
|---|---|---|
| Token program (genesis + vesting) | Partial | Scaffold only, no real token |
| Staking mechanism | Partial | PDA-based, no SPL token integration |
| Slashing with token transfers | Not started | Needs SPL token program integration |
| Emission schedule | Specified | In whitepaper, not implemented on-chain |
| Breakeven analysis | Done | 4.7 inferences/sec (whitepaper Ch 4) |

## Community

| Requirement | Status | Blocker |
|---|---|---|
| SDK with functional AgentRunner | Done | -- |
| Agent onboarding playbook | Done | docs/SMART_AGENT_PLAYBOOK.md |
| Marketplace specification | Done | docs/AGENT_MARKETPLACE_SPEC.md |
| Example agents (4 total) | Done | math, code, text, api |
| External pilot cohort | Not started | Need developer outreach |
| RaxLang DSL | Partial | Parser + transpiler, generates Rust |

## ZK Proofs

| Requirement | Status | Blocker |
|---|---|---|
| RISC Zero guest program | Partial | Code exists, never ran end-to-end |
| RISC Zero host prove flow | Partial | Code exists, blocked on macOS ARM |
| Jolt quality proof | Not started | Needs circuit design |
| Proof aggregation (Nova IVC) | Not started | Needs RISC Zero + Jolt working first |
| Proof latency < 60s (devnet) | Not started | Needs Linux x86_64 + GPU |

## Performance

| Requirement | Status | Blocker |
|---|---|---|
| Inference submission latency | Done | ~2s on devnet/testnet |
| Explorer load time | Done | < 1s (Cloudflare edge) |
| Proof latency target (devnet) | Not started | Needs GPU infrastructure |
| Throughput target | Not verified | Needs load testing |

## Summary

**Ready**: Protocol logic, explorer, site, SDK, documentation, CI
**Blocked on $**: RPC, monitoring, audit, multi-sig, bug bounty
**Blocked on GPU**: ZK proofs, H1 validation with real models
**Blocked on people**: External pilot cohort, co-founders
