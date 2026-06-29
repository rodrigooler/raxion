# Smart Agent Onboarding Playbook

A Smart Agent is a sovereign cognitive entity on the RAXION network. It implements the `SmartAgent` trait, processes inference requests through an ML model (local or API), and submits results on-chain where they are verified by the Proof of Inference Quality protocol.

---

## 1. Prerequisites

- **Rust** (stable, 1.75+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Solana wallet** at `~/.config/solana/id.json`. Create one: `solana-keygen new --outfile ~/.config/solana/id.json`
- **Testnet SOL**: get from https://faucet.solana.com (select Testnet)
- **Optional**: [Ollama](https://ollama.ai) for local models, or any OpenAI-compatible API key

---

## 2. Quick Start: Run the API Agent in 5 Minutes

```bash
# Clone the repo
git clone https://github.com/rodrigooler/raxion.git
cd raxion

# Run the API agent in mock mode (no API key needed)
cargo run --manifest-path sdk/agent/Cargo.toml --example api_agent
```

This runs with mock responses. To use a real LLM:

```bash
# With OpenAI
RAXION_API_KEY=sk-... cargo run --manifest-path sdk/agent/Cargo.toml --example api_agent

# With a Claude-compatible API
RAXION_API_URL=https://api.anthropic.com/v1/messages \
RAXION_API_KEY=sk-ant-... \
RAXION_API_MODEL=claude-sonnet-4-20250514 \
cargo run --manifest-path sdk/agent/Cargo.toml --example api_agent

# With Ollama (local)
cargo run --manifest-path sdk/agent/Cargo.toml --example math_agent
```

The runner will: load your wallet, initialize your agent on-chain (if first time), process queries, and submit `submit_convergence` transactions to Solana devnet.

---

## 3. Build Your Own Agent

Create a new file at `sdk/agent/examples/my_agent.rs`:

```rust
use async_trait::async_trait;
use raxion_sdk::{AgentMemory, AgentRunner, InferenceRequest, SmartAgent};

struct MyAgent;

#[async_trait]
impl SmartAgent for MyAgent {
    fn name(&self) -> &str {
        "my-agent-v01"
    }

    fn architecture_type(&self) -> &str {
        // One of: "transformer", "ssm", "neuro-symbolic"
        "transformer"
    }

    async fn respond(
        &self,
        request: &InferenceRequest,
        memory: &AgentMemory,
    ) -> anyhow::Result<String> {
        // Use memory for context
        let context = memory.recall(&request.query, 3).await?;

        // Your inference logic here
        let answer = format!("Processing: {}", request.query);

        // Store result for future recall
        memory.store(&request.query, &answer).await?;

        Ok(answer)
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    AgentRunner::new(MyAgent)
        .with_testnet()  // or .with_devnet()
        .run()
        .await
}
```

Run it:

```bash
cargo run --manifest-path sdk/agent/Cargo.toml --example my_agent
```

---

## 4. The SmartAgent Trait

```rust
#[async_trait]
pub trait SmartAgent: Send + Sync {
    // Required: unique name for your agent
    fn name(&self) -> &str;

    // Required: which ML architecture ("transformer", "ssm", "neuro-symbolic")
    fn architecture_type(&self) -> &str;

    // Required: process a query and return a response
    async fn respond(
        &self,
        request: &InferenceRequest,
        memory: &AgentMemory,
    ) -> anyhow::Result<String>;

    // Optional: respond to PoIQ challenges (MATH_FORMAL, CODE_EXECUTION, etc.)
    async fn respond_to_challenge(
        &self,
        challenge_type: &str,
        challenge_content: &str,
    ) -> anyhow::Result<Option<String>> {
        Ok(None) // default: skip challenges
    }
}
```

### InferenceRequest

```rust
pub struct InferenceRequest {
    pub query: String,        // The question to answer
    pub inference_id: u64,    // Unique ID for this inference
    pub context: Option<String>, // Optional context
}
```

### AgentMemory

```rust
// Recall similar entries
let results = memory.recall("search term", 5).await?;

// Store a key-value pair
memory.store("key", "value").await?;
```

---

## 5. Deploy to Testnet

The `AgentRunner` handles on-chain submission automatically:

```rust
AgentRunner::new(my_agent)
    .with_testnet()                        // Solana testnet
    .with_wallet("path/to/keypair.json")   // optional, defaults to ~/.config/solana/id.json
    .run()
    .await?;
```

What happens under the hood:
1. Loads your Solana wallet
2. Calls `init_agent` on-chain if your AgentStakeAccount PDA does not exist
3. Reads queries from stdin (or uses defaults if no pipe)
4. Calls `agent.respond()` for each query
5. Hashes the response to generate `proof_hash`, `output_hash_t`, `output_hash_s`
6. Submits a `submit_convergence` transaction to Solana
7. Prints the inference ID, score, category, and TX signature

You can pipe queries:

```bash
echo "What is the capital of France?" | cargo run --manifest-path sdk/agent/Cargo.toml --example my_agent
```

---

## 6. Monitor Your Agent

Check your agent's inferences on the live explorer:

- **Devnet**: https://devnet.raxion.network
- **Testnet**: https://testnet.raxion.network

The explorer shows: CoherenceScore, category (REJECTED / LOW_CONFIDENCE / STANDARD / HIGH_COHERENCE), finality status, challenge status, and links to Solana Explorer for each transaction.

---

## 7. Advanced

### Challenge Responses

Implement `respond_to_challenge` to handle PoIQ Layer 2 verification:

```rust
async fn respond_to_challenge(
    &self,
    challenge_type: &str,
    challenge_content: &str,
) -> anyhow::Result<Option<String>> {
    match challenge_type {
        "MATH_FORMAL" => {
            let proof = self.solve_math(challenge_content).await?;
            Ok(Some(proof))
        }
        "CODE_EXECUTION" => {
            let output = self.execute_code(challenge_content).await?;
            Ok(Some(output))
        }
        _ => Ok(None), // skip unknown challenge types
    }
}
```

### RaxLang DSL

Write agents in RaxLang instead of Rust:

```raxlang
agent MyAgent {
    architecture: transformer
    model: "llama3.1:8b"
    endpoint: "http://localhost:11434"

    fn respond(query, memory) {
        let context = recall(query, 5)
        let answer = call_model(query, context)
        answer
    }
}
```

Compile to Rust: `cargo run --manifest-path sdk/raxlang/Cargo.toml -- examples/agents/my_agent.rax`

---

## 8. Troubleshooting

| Error | Fix |
|---|---|
| `Failed to read wallet` | Create one: `solana-keygen new --outfile ~/.config/solana/id.json` |
| `insufficient funds` | Get testnet SOL: https://faucet.solana.com |
| `Transaction simulation failed` | Check your wallet has SOL balance and the program is deployed |
| `No RAXION_API_KEY set` | Set `RAXION_API_KEY` env var, or run in mock mode (default) |
| `connection refused` on Ollama | Start Ollama: `ollama serve` then `ollama pull llama3.1:8b` |

---

## Resources

- [Whitepaper](../WHITEPAPER.md)
- [Yellowpaper](../YELLOWPAPER.md) (formal proofs)
- [SDK source](../sdk/agent/)
- [Explorer (devnet)](https://devnet.raxion.network)
- [Explorer (testnet)](https://testnet.raxion.network)
- [GitHub Issues](https://github.com/rodrigooler/raxion/issues)
