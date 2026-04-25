#!/usr/bin/env node
const fs = require("node:fs");
const RESULTS_DIR = "poc/benchmarks/devnet_results";
fs.mkdirSync(RESULTS_DIR, { recursive: true });
const TEST_QUERIES = [
  { text: "What is the capital of France?", expectedCoherence: 0.85 },
  { text: "Compare PoW and PoS consensus mechanisms", expectedCoherence: 0.70 },
  { text: "Analyze quantum computing impact on blockchain", expectedCoherence: 0.55 },
];
function simulateCoherenceScore(query) {
  const variance = 0.15;
  const score = query.expectedCoherence + (Math.random() * variance * 2 - variance);
  return Math.max(0, Math.min(1, score));
}
function getCategory(score) {
  if (score < 0.3) return "REJECTED";
  if (score < 0.6) return "LOW_CONFIDENCE";
  if (score < 0.85) return "STANDARD";
  return "HIGH_COHERENCE";
}
async function runSimulation(agents = 100, queriesPerAgent = 10) {
  const startTime = Date.now();
  const results = [];
  console.log("Running simulation: " + agents + " agents x " + queriesPerAgent + " queries\n");
  for (let agentId = 0; agentId < agents; agentId++) {
    for (let queryId = 0; queryId < queriesPerAgent; queryId++) {
      const query = TEST_QUERIES[queryId % TEST_QUERIES.length];
      const score = simulateCoherenceScore(query);
      const isChallenged = Math.random() < 0.015;
      results.push({
        agentId, queryId, query: query.text, coherenceScore: score,
        category: getCategory(score), isFinal: score >= 0.6 && !isChallenged,
        isChallenged, latencyMs: Math.random() * 100 + 50,
        timestamp: new Date().toISOString(),
      });
    }
  }
  console.log("\n" + "=".repeat(60) + "\n  Results\n" + "=".repeat(60));
  const avgScore = results.reduce((s, r) => s + r.coherenceScore, 0) / results.length;
  const finalRate = (results.filter(r => r.isFinal).length / results.length) * 100;
  const challengeRate = (results.filter(r => r.isChallenged).length / results.length) * 100;
  const cats = { REJECTED: 0, LOW_CONFIDENCE: 0, STANDARD: 0, HIGH_COHERENCE: 0 };
  results.forEach(r => cats[r.category]++);
  console.log("  Total Queries: " + results.length);
  console.log("  Avg Coherence: " + avgScore.toFixed(3));
  console.log("  Finality Rate: " + finalRate.toFixed(1) + "%");
  console.log("  Challenge Rate: " + challengeRate.toFixed(2) + "%");
  console.log("  Categories: REJ=" + cats.REJECTED + " LOW=" + cats.LOW_CONFIDENCE + " STD=" + cats.STANDARD + " HIGH=" + cats.HIGH_COHERENCE);
  const report = { timestamp: new Date().toISOString(), agents, queriesPerAgent, totalQueries: results.length, avgCoherenceScore: avgScore, finalRate, challengeRate, categories: cats };
  const outputFile = RESULTS_DIR + "/simulation_" + Date.now() + ".json";
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log("\nSaved: " + outputFile);
  return report;
}
const args = process.argv.slice(2);
let agents = 100, queries = 10;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--agents" || args[i] === "-a") agents = Number.parseInt(args[++i], 10);
  if (args[i] === "--queries" || args[i] === "-q") queries = Number.parseInt(args[++i], 10);
}
runSimulation(agents, queries).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
