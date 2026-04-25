## Overview

Implement comprehensive observability: metrics, logging, tracing, and alerting for testnet operations.

## Requirements

### Metrics
- [ ] Infrastructure metrics (CPU, memory, disk, network)
- [ ] RPC endpoint metrics (requests/sec, latency p50/p95/p99, error rate)
- [ ] PoIQ protocol metrics (inferences/day, challenge rate, slash rate)
- [ ] Agent metrics (active agents, avg coherence score)

### Logging
- [ ] Structured JSON logs (machine-parseable)
- [ ] Log levels: DEBUG, INFO, WARN, ERROR
- [ ] Correlation IDs for request tracing
- [ ] Retention: 30 days hot, 90 days cold

### Alerting
- [ ] Alert on RPC downtime
- [ ] Alert on abnormal slash rate (>10/hour)
- [ ] Alert on challenge rate deviation (>2% from baseline)
- [ ] Alert on >5% failed inferences in 1 hour

## Technical Details

**Recommended Stack**:
- Metrics: Prometheus + Grafana
- Logs: Loki or Elasticsearch
- Alerts: Alertmanager + PagerDuty/Slack

**References**:
- Solana validator monitoring: https://docs.solanalabs.com/validator/monitoring
- 90-day stability plan: `docs/runbooks/testnet-stability-plan.md`

## Acceptance Criteria

1. Grafana dashboard showing real-time health
2. Alerts firing for defined conditions
3. On-call runbook accessible
4. Weekly reliability report automated

---
*Part of M1: Public Testnet Bootstrap*
