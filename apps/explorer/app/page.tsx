import { fetchInferences, summarize, type Category } from "../lib/poiq";

function scoreColor(score: number) {
  if (score < 0.30) return "var(--critical)";
  if (score < 0.60) return "var(--warn)";
  if (score < 0.85) return "var(--ok)";
  return "var(--strong)";
}

function categoryStyle(category: Category) {
  switch (category) {
    case "REJECTED":
      return { color: "var(--critical)", borderColor: "var(--critical)" };
    case "LOW_CONFIDENCE":
      return { color: "var(--warn)", borderColor: "var(--warn)" };
    case "STANDARD":
      return { color: "var(--ok)", borderColor: "var(--ok)" };
    case "HIGH_COHERENCE":
      return { color: "var(--strong)", borderColor: "var(--strong)" };
  }
}

function formatTimestamp(unixSeconds: bigint) {
  const n = Number(unixSeconds);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return new Date(n * 1000).toLocaleString();
}

function shortHash(value: string) {
  if (value.length < 16) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
  let rows = [] as Awaited<ReturnType<typeof fetchInferences>>;
  let loadError = "";

  try {
    rows = await fetchInferences(20);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unknown RPC error";
  }

  const stats = summarize(rows);
  const programId = process.env.NEXT_PUBLIC_POIQ_PROGRAM_ID ?? "11111111111111111111111111111111";
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

  return (
    <main className="container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="small" style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}>
            RAXION Devnet Explorer
          </div>
          <h1 style={{ margin: "8px 0 4px", fontSize: 42, lineHeight: 1.05 }}>Live Inferences</h1>
          <p className="small" style={{ margin: 0 }}>
            Program: {programId} | RPC: {rpcUrl}
          </p>
        </div>
        <div className="card" style={{ minWidth: 260 }}>
          <div className="small">Status</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>Phase 1 - Devnet</div>
          <div className="small" style={{ marginTop: 6 }}>
            Scores are read from on-chain InferenceRecord accounts.
          </div>
        </div>
      </div>

      <section style={{ marginTop: 16 }} className="grid">
        <div className="card">
          <div className="small">Total Inferences</div>
          <div style={{ fontSize: 30, marginTop: 8 }}>{stats.total}</div>
        </div>
        <div className="card">
          <div className="small">Avg CoherenceScore</div>
          <div style={{ fontSize: 30, marginTop: 8 }}>{stats.avg.toFixed(3)}</div>
        </div>
        <div className="card">
          <div className="small">Challenge Rate</div>
          <div style={{ fontSize: 30, marginTop: 8 }}>{stats.challengeRate.toFixed(1)}%</div>
        </div>
        <div className="card">
          <div className="small">Category Split</div>
          <div className="small" style={{ marginTop: 8 }}>
            R:{stats.categories.REJECTED} L:{stats.categories.LOW_CONFIDENCE} S:{stats.categories.STANDARD} H:{stats.categories.HIGH_COHERENCE}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Recent 20 Inferences</h2>
          <div className="small">Color mapping: red &lt;0.30, yellow 0.30-0.60, green 0.60-0.85, blue &gt;0.85</div>
        </div>

        {loadError ? (
          <div className="small" style={{ color: "var(--critical)" }}>
            Failed to load devnet records: {loadError}
          </div>
        ) : rows.length === 0 ? (
          <div className="small">No records found for current program id on devnet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Inference</th>
                  <th>Agent</th>
                  <th>Score</th>
                  <th>Category</th>
                  <th>Slot</th>
                  <th>Timestamp</th>
                  <th>Proof</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.pubkey}>
                    <td>#{row.inferenceId.toString()}</td>
                    <td>{shortHash(row.agent)}</td>
                    <td style={{ minWidth: 170 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>{row.coherenceScore.toFixed(3)}</span>
                        <span className="small">{row.isFinal ? "final" : "pending"}</span>
                      </div>
                      <div className="score-track">
                        <div
                          className="score-fill"
                          style={{
                            width: `${Math.max(0, Math.min(100, row.coherenceScore * 100))}%`,
                            backgroundColor: scoreColor(row.coherenceScore),
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={categoryStyle(row.category)}>
                        {row.category}
                      </span>
                    </td>
                    <td>{row.slot.toString()}</td>
                    <td>{formatTimestamp(row.timestamp)}</td>
                    <td>
                      <a
                        className="small"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://explorer.solana.com/address/${row.pubkey}?cluster=devnet`}
                      >
                        {shortHash(row.proofHash)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
