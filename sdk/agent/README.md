# RAXION SDK v0.1 (Devnet)

Rust SDK for building Smart Agents compatible with RAXION Devnet.

## Requirements

- Rust 1.75+
- Local Ollama (for reference agents)

## Quickstart

```bash
cd sdk/agent
cargo check
cargo build --example math_agent
cargo run --example math_agent
```

## Minimal Agent (<50 lines)

Implement `SmartAgent` with `name`, `architecture_type`, and `respond`:

```rust
use async_trait::async_trait;
use raxion_sdk::{SmartAgent, InferenceRequest, AgentMemory};

struct MinimalAgent;

#[async_trait]
impl SmartAgent for MinimalAgent {
    fn name(&self) -> &str { "minimal-agent" }
    fn architecture_type(&self) -> &str { "transformer" }

    async fn respond(
        &self,
        request: &InferenceRequest,
        _memory: &AgentMemory,
    ) -> anyhow::Result<String> {
        Ok(format!("echo: {}", request.query))
    }
}
```

## Reference Agents

- `math_agent` (formal reasoning prompt)
- `code_agent` (code analysis prompt)
- `text_agent` (general text reasoning prompt)
