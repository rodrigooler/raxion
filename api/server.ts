/**
 * RAXION Devnet API Server
 *
 * REST API for submitting inferences to the RAXION Devnet.
 * Uses Solana RPC directly for on-chain state verification.
 */

import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

// Configuration
const CONFIG = {
  // Solana Devnet RPC
  RPC_URL: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",

  // RAXION Program ID on Devnet
  RAXION_PROGRAM_ID: process.env.RAXION_PROGRAM_ID || "5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT",

  // Server
  PORT: Number.parseInt(process.env.PORT || "3001", 10),
  HOST: process.env.HOST || "0.0.0.0",
};

// Coherence Score thresholds
const THRESHOLDS = {
  REJECTED: 0.30,
  LOW_CONFIDENCE: 0.60,
  STANDARD: 0.85,
};

/**
 * Calculate coherence score category
 */
function getCategory(score) {
  if (score < THRESHOLDS.REJECTED) return "REJECTED";
  if (score < THRESHOLDS.LOW_CONFIDENCE) return "LOW_CONFIDENCE";
  if (score < THRESHOLDS.STANDARD) return "STANDARD";
  return "HIGH_COHERENCE";
}

/**
 * Create inference submission transaction
 * Note: This is a placeholder - actual implementation depends on
 * the on-chain program structure
 */
async function createInferenceTransaction(
  payer,
  agentPubkey,
  coherenceScore,
  inferenceData
) {
  // For demo purposes, we create a simple transfer transaction
  // In production, this would call the actual RAXION program
  const transaction = new Transaction();

  // Add a simple memo instruction to simulate on-chain call
  const inferenceId = `inf_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  // Log the inference submission
  console.log(`[API] Submitting inference ${inferenceId}`);
  console.log(`  Agent: ${agentPubkey}`);
  console.log(`  Score: ${coherenceScore}`);
  console.log(`  Category: ${getCategory(coherenceScore)}`);

  return {
    inferenceId,
    transaction,
    slot: await new Connection(CONFIG.RPC_URL).getSlot(),
  };
}

/**
 * Submit inference endpoint
 */
async function submitInference(req, res) {
  try {
    const { agentPubkey, coherenceScore, query, response } = req.body;

    // Validate inputs
    if (!agentPubkey) {
      return res.status(400).json({ error: "Missing agentPubkey" });
    }

    if (coherenceScore === undefined || coherenceScore < 0 || coherenceScore > 1) {
      return res.status(400).json({ error: "Invalid coherenceScore (must be 0-1)" });
    }

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    // Validate agent pubkey format
    try {
      new PublicKey(agentPubkey);
    } catch (error) {
      console.error(`[API] Invalid agentPubkey format:`, error);
      return res.status(400).json({ error: "Invalid agentPubkey format" });
    }

    // Create and submit transaction
    const connection = new Connection(CONFIG.RPC_URL);

    // Simulate transaction submission
    const result = await createInferenceTransaction(
      null,
      agentPubkey,
      coherenceScore,
      { query, response }
    );

    const response_ = {
      success: true,
      inferenceId: result.inferenceId,
      slot: result.slot,
      coherenceScore,
      category: getCategory(coherenceScore),
      isFinal: coherenceScore >= THRESHOLDS.LOW_CONFIDENCE,
      message: coherenceScore >= THRESHOLDS.LOW_CONFIDENCE
        ? "Inference accepted with cognitive finality"
        : "Inference accepted but not final (may be challenged)",
    };

    console.log(`[API] Inference ${result.inferenceId} submitted successfully`);

    res.json(response_);
  } catch (error) {
    console.error(`[API] Error submitting inference:`, error);
    res.status(500).json({
      success: false,
      error: "Failed to submit inference",
      message: error.message,
    });
  }
}

/**
 * Get inference status endpoint
 */
async function getInference(req, res) {
  try {
    const { inferenceId } = req.params;

    if (!inferenceId) {
      return res.status(400).json({ error: "Missing inferenceId" });
    }

    // For demo, we return mock data
    // In production, this would query the on-chain program
    const connection = new Connection(CONFIG.RPC_URL);
    const slot = await connection.getSlot();

    res.json({
      inferenceId,
      slot,
      status: "confirmed",
      coherenceScore: 0.75,
      category: "STANDARD",
      isFinal: true,
      finalitySlot: slot - 1,
    });
  } catch (error) {
    console.error(`[API] Error getting inference:`, error);
    res.status(500).json({
      success: false,
      error: "Failed to get inference",
    });
  }
}

/**
 * Health check endpoint
 */
async function healthCheck(req, res) {
  try {
    const connection = new Connection(CONFIG.RPC_URL);

    const [slot, programAccounts] = await Promise.all([
      connection.getSlot(),
      connection.getProgramAccounts(new PublicKey(CONFIG.RAXION_PROGRAM_ID)),
    ]);

    res.json({
      status: "healthy",
      rpc: "connected",
      slot,
      programDeployed: programAccounts.length > 0,
      programAccounts: programAccounts.length,
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
}

/**
 * Get network stats endpoint
 */
async function getStats(req, res) {
  try {
    const connection = new Connection(CONFIG.RPC_URL);
    const slot = await connection.getSlot();

    res.json({
      network: "devnet",
      slot,
      programId: CONFIG.RAXION_PROGRAM_ID,
      thresholds: THRESHOLDS,
      stats: {
        totalInferences: 0, // Would query program accounts
        averageCoherence: 0,
        finalityRate: 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Simple HTTP server implementation (no external deps)
function startServer() {
  const http = require("node:http");

  const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // Parse URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    // Set JSON content type
    res.setHeader("Content-Type", "application/json");

    // Route handlers
    if (path === "/health" && req.method === "GET") {
      healthCheck(req, res);
    } else if (path === "/stats" && req.method === "GET") {
      getStats(req, res);
    } else if (path === "/api/inference" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => body += chunk);
      req.on("end", () => {
        try {
          req.body = JSON.parse(body);
          submitInference(req, res);
        } catch {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
    } else if (path.startsWith("/api/inference/") && req.method === "GET") {
      req.params = { inferenceId: path.split("/").pop() };
      getInference(req, res);
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(CONFIG.PORT, CONFIG.HOST, () => {
    console.log(`\n🚀 RAXION Devnet API Server`);
    console.log(`   URL: http://${CONFIG.HOST}:${CONFIG.PORT}`);
    console.log(`   Network: Solana Devnet`);
    console.log(`   Program: ${CONFIG.RAXION_PROGRAM_ID}\n`);
  });
}

// Export for testing
export { submitInference, getInference, healthCheck, getStats, getCategory };

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
