"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchInferences, summarize, type Category, type InferenceRow } from "../lib/poiq";

const PROGRAM_ID = "5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT";
const REFRESH_MS = 30_000;
const CATEGORIES: (Category | "ALL")[] = ["ALL", "REJECTED", "LOW_CONFIDENCE", "STANDARD", "HIGH_COHERENCE"];
const CAT_COLOR: Record<Category, string> = {
  REJECTED: "var(--critical)",
  LOW_CONFIDENCE: "var(--warn)",
  STANDARD: "var(--ok)",
  HIGH_COHERENCE: "var(--strong)",
};

function getNetwork(): { rpc: string; label: string } {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (host.startsWith("testnet")) return { rpc: "https://api.testnet.solana.com", label: "Testnet" };
  return { rpc: "https://api.devnet.solana.com", label: "Devnet" };
}

function scoreColor(score: number) {
  if (score < 0.3) return "var(--critical)";
  if (score < 0.6) return "var(--warn)";
  if (score < 0.85) return "var(--ok)";
  return "var(--strong)";
}

function categoryStyle(category: Category) {
  return { color: CAT_COLOR[category], borderColor: CAT_COLOR[category] };
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

function DistributionChart({ categories }: { categories: Record<Category, number> }) {
  const max = Math.max(1, ...Object.values(categories));
  const entries: [Category, number][] = [
    ["REJECTED", categories.REJECTED],
    ["LOW_CONFIDENCE", categories.LOW_CONFIDENCE],
    ["STANDARD", categories.STANDARD],
    ["HIGH_COHERENCE", categories.HIGH_COHERENCE],
  ];
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 48, marginTop: 8 }}>
      {entries.map(([cat, count]) => (
        <div key={cat} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: "100%",
              height: `${Math.max(4, (count / max) * 40)}px`,
              backgroundColor: CAT_COLOR[cat],
              borderRadius: 3,
              opacity: count === 0 ? 0.2 : 1,
            }}
          />
          <span className="small" style={{ fontSize: 10 }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

export default function ExplorerPage() {
  const [rows, setRows] = useState<InferenceRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category | "ALL">("ALL");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const net = getNetwork();

  const load = useCallback(() => {
    fetchInferences(50, PROGRAM_ID, net.rpc)
      .then((r) => { setRows(r); setLoadError(""); setLastRefresh(new Date()); })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Unknown RPC error"))
      .finally(() => setLoading(false));
  }, [net.rpc]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const stats = summarize(rows);
  const filtered = filter === "ALL" ? rows : rows.filter((r) => r.category === filter);

  let content: React.ReactNode;
  if (loading) {
    content = <div className="small">Loading from Solana {net.label}...</div>;
  } else if (loadError) {
    content = (
      <div className="small" style={{ color: "var(--critical)" }}>
        Failed to load {net.label} records: {loadError}
      </div>
    );
  } else if (filtered.length === 0) {
    content = <div className="small">{filter === "ALL" ? "No records found." : `No ${filter} records.`}</div>;
  } else {
    content = (
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
            {filtered.map((row) => (
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
    );
  }

  return (
    <main className="container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="small" style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}>
            RAXION {net.label} Explorer
          </div>
          <h1 style={{ margin: "8px 0 4px", fontSize: 42, lineHeight: 1.05 }}>Live Inferences</h1>
          <p className="small" style={{ margin: 0 }}>
            Program: {PROGRAM_ID} | RPC: {net.rpc}
            {lastRefresh && <> | Refreshed: {lastRefresh.toLocaleTimeString()}</>}
          </p>
        </div>
        <div className="card" style={{ minWidth: 260 }}>
          <div className="small">Status</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>Phase {net.label === "Testnet" ? "2" : "1"} - {net.label}</div>
          <div className="small" style={{ marginTop: 6 }}>
            Auto-refresh every 30s.
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
          <div className="small">Distribution</div>
          <DistributionChart categories={stats.categories} />
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            Inferences {filter !== "ALL" && <span className="small">({filter})</span>}
          </h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  background: filter === cat ? (cat === "ALL" ? "var(--line)" : CAT_COLOR[cat as Category]) : "transparent",
                  color: filter === cat ? (cat === "ALL" ? "var(--ink)" : "#000") : "var(--muted)",
                  border: `1px solid ${cat === "ALL" ? "var(--line)" : CAT_COLOR[cat as Category]}`,
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 11,
                  fontFamily: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: filter === cat ? 1 : 0.6,
                }}
              >
                {cat === "ALL" ? "ALL" : cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {content}
      </section>
    </main>
  );
}
