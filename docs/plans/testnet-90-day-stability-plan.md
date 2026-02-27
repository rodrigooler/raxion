# Testnet 90-Day Stability Plan

## Objective

Define the operational clock and gates for Testnet stability prior to Mainnet readiness claims.

## Clock Start Rule

The 90-day clock starts only when all are true:

1. Public Testnet endpoint and explorer URL are reachable.
2. At least one state-root commitment is visible on-chain.
3. At least one non-foundation external agent has submitted successful inference flow.
4. Incident response rota and rollback runbook are published internally.

## Stability SLOs (90 Days)

- Chain availability: >= 99.5%
- Proof pipeline success (RISC0/Jolt): >= 98%
- Inference submission success: >= 99%
- No unresolved critical severity incidents > 24h
- No protocol-invariant violation (deterministic challenge seed, threshold constants, stake derivation)

## Weekly Gates

- Week 1-2: burn-in and performance baselining
- Week 3-6: adversarial testing + slashing behavior verification
- Week 7-10: ecosystem onboarding and external load checks
- Week 11-13: hardening freeze + audit integration fixes

## Exit Criteria

- 90 consecutive days with SLO compliance
- two independent audits completed (or one complete + one in final remediation)
- no unresolved P0/P1 security findings
- state-root commitments are continuous and deterministic across restarts
