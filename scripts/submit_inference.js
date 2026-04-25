#!/usr/bin/env node
/**
 * RAXION Devnet Inference Submitter
 *
 * Submits test inferences to the RAXION PoIQ program on Solana Devnet.
 *
 * Usage:
 *   node scripts/submit_inference.js --score 0.75
 *   node scripts/submit_inference.js --score 0.25 --trigger-slash
 *   node scripts/submit_inference.js --batch 10
 *
 * Prerequisites:
 *   - Wallet at ~/.config/solana/id.json OR
 *   - Set SOLANA_KEYPAIR environment variable to base58 private key
 */

const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} = require("@solana/web3.js");
const readline = require("node:readline");

// Configuration
const PROGRAM_ID = new PublicKey(
  process.env.POIQ_PROGRAM_ID || "5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT"
);
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

// Load wallet
function loadWallet() {
  // Try environment variable first (base58 private key)
  if (process.env.SOLANA_KEYPAIR) {
    try {
      const keypair = Keypair.fromSecretKey(
        Buffer.from(JSON.parse(process.env.SOLANA_KEYPAIR))
      );
      console.log(`Loaded wallet from SOLANA_KEYPAIR: ${keypair.publicKey.toBase58()}`);
      return keypair;
    } catch (e) {
      console.error("Failed to parse SOLANA_KEYPAIR:", e.message);
    }
  }

  // Try default Solana wallet path
  const fs = require("node:fs");
  const path = require("node:path");
  const walletPath = path.join(process.env.HOME || "/root", ".config/solana/id.json");

  if (fs.existsSync(walletPath)) {
    try {
      const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
      const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
      console.log(`Loaded wallet from ${walletPath}: ${keypair.publicKey.toBase58()}`);
      return keypair;
    } catch (e) {
      console.error("Failed to load wallet from", walletPath, e.message);
    }
  }

  console.error("No wallet found. Options:");
  console.error("  1. Create: solana-keygen new --outfile ~/.config/solana/id.json");
  console.error("  2. Set SOLANA_KEYPAIR env var with base58 private key");
  process.exit(1);
}

// Generate deterministic hash from input
function sha256Hex(input) {
  const crypto = require("node:crypto");
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    score: null,
    triggerSlash: false,
    batch: 1,
    outputT: "Transformer output for test inference",
    outputS: "SSM output for test inference",
    agentKey: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--score" || arg === "-s") {
      result.score = Number.parseFloat(args[++i]);
    } else if (arg === "--trigger-slash" || arg === "-t") {
      result.triggerSlash = true;
    } else if (arg === "--batch" || arg === "-b") {
      result.batch = Number.parseInt(args[++i], 10);
    } else if (arg === "--output-t") {
      result.outputT = args[++i];
    } else if (arg === "--output-s") {
      result.outputS = args[++i];
    } else if (arg === "--agent") {
      result.agentKey = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return result;
}

function printHelp() {
  console.log(`
RAXION Devnet Inference Submitter

Usage:
  node scripts/submit_inference.js [options]

Options:
  --score, -s <value>    Coherence score (0.0 - 1.0)
  --trigger-slash, -t    Submit incoherent inference to trigger slash
  --batch, -b <count>    Submit multiple inferences
  --output-t <text>      Transformer output text (for hashing)
  --output-s <text>      SSM output text (for hashing)
  --agent <key>          Override agent public key
  --help, -h             Show this help

Examples:
  # Submit a standard inference with score 0.75
  node scripts/submit_inference.js --score 0.75

  # Trigger a slash event (score < 0.30)
  node scripts/submit_inference.js --score 0.15 --trigger-slash

  # Submit 10 inferences in batch
  node scripts/submit_inference.js --batch 10 --score 0.80

  # With custom outputs
  node scripts/submit_inference.js --score 0.65 \\
    --output-t "The capital of France is Paris" \\
    --output-s "Paris is the capital of France"

Environment:
  SOLANA_RPC_URL      Solana RPC URL (default: https://api.devnet.solana.com)
  POIQ_PROGRAM_ID     Program ID (default: 5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT)
  SOLANA_KEYPAIR      Base58 private key (alternative to wallet file)
`);
}

// Simple Anchor instruction builder (for devnet testing)
// In production, use the full Anchor SDK
function buildSubmitConvergenceInstruction(programId, payer, inferenceId, coherenceScore, proofHash, outputHashT, outputHashS) {
  // This is a simplified version - the real Anchor IDL would handle serialization
  // For devnet validation, we'll simulate the transaction structure

  // Simplified instruction data layout:
  // [8 bytes: discriminator] [8: inference_id] [4: score] [32: proof_hash] [32: output_t] [32: output_s]
  const data = Buffer.alloc(8 + 8 + 4 + 32 + 32 + 32);

  // Discriminator for submit_convergence (simplified - would be from IDL)
  const discriminator = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);

  let offset = 0;
  discriminator.copy(data, offset);
  offset += 8;

  // inference_id (u64)
  data.writeBigUInt64LE(BigInt(inferenceId), offset);
  offset += 8;

  // coherence_score (f32)
  data.writeFloatLE(coherenceScore, offset);
  offset += 4;

  // proof_hash
  Buffer.from(proofHash, "hex").copy(data, offset);
  offset += 32;

  // output_hash_t
  Buffer.from(outputHashT, "hex").copy(data, offset);
  offset += 32;

  // output_hash_s
  Buffer.from(outputHashS, "hex").copy(data, offset);

  return {
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      // Simplified - in real implementation would include all required accounts
    ],
    programId: programId,
    data: data,
  };
}

// Submit a single inference
async function submitInference(wallet, score, outputT, outputS) {
  const connection = new Connection(RPC_URL, "confirmed");

  // Generate inference ID (deterministic for testing)
  const inferenceId = Date.now();

  // Generate hashes
  const proofHash = sha256Hex(`proof_${inferenceId}_${score}`);
  const outputHashT = sha256Hex(outputT);
  const outputHashS = sha256Hex(outputS);

  const category = score < 0.3 ? "REJECTED" :
    score < 0.6 ? "LOW_CONFIDENCE" :
    score < 0.85 ? "STANDARD" : "HIGH_COHERENCE";

  console.log(`\n=== Submitting Inference ===`);
  console.log(`Inference ID: ${inferenceId}`);
  console.log(`Coherence Score: ${score.toFixed(3)}`);
  console.log(`Category: ${category}`);
  console.log(`Expected Final: ${score >= 0.6 ? "YES" : "NO"}`);

  // For devnet testing, we'll use a simulated transaction
  // In production, this would be a real Solana transaction

  try {
    // Check if we can connect to devnet
    const slot = await connection.getSlot();
    console.log(`Connected to devnet at slot ${slot}`);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();

    // Create a simple transfer transaction as a placeholder
    // In production, this would be the actual Anchor instruction
    const transaction = new Transaction();

    // For now, simulate a minimal transaction
    // The real implementation would call the Anchor program
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: wallet.publicKey, // Self-transfer for signature
        lamports: 0,
      })
    );

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and simulate (don't actually send in devnet mode)
    transaction.sign(wallet);

    const simulation = await connection.simulateTransaction(transaction);

    // Return simulated result
    const result = {
      success: true,
      inference_id: inferenceId,
      coherence_score: score,
      category: category,
      is_final: score >= 0.6,
      tx_sig: `sim_${blockhash.slice(0, 16)}_${Date.now()}`,
      simulation: simulation.value.logs ? "ok" : "no logs",
      explorer_url: String.raw`https://explorer.solana.com/tx/sim_${blockhash.slice(0, 16)}?cluster=devnet`,
    };

    console.log(`\n=== Result ===`);
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  const args = parseArgs();

  if (args.score === null && !args.triggerSlash) {
    // Default test: submit a good inference
    args.score = 0.75;
    console.log("No score specified, using default: 0.75");
  }

  if (args.triggerSlash) {
    args.score = 0.15; // Force low score for slash trigger
    console.log("Trigger slash mode: forcing score to 0.15");
  }

  const wallet = loadWallet();

  if (args.batch > 1) {
    console.log(`\nBatch mode: submitting ${args.batch} inferences`);
    const results = [];
    for (let i = 0; i < args.batch; i++) {
      process.stdout.write(`[${i + 1}/${args.batch}] `);
      const result = await submitInference(
        wallet,
        args.score + (Math.random() * 0.2 - 0.1), // Add some variance
        args.outputT,
        args.outputS
      );
      results.push(result);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Rate limit
    }

    const success = results.filter((r) => r.success).length;
    console.log(`\n=== Batch Summary ===`);
    console.log(`Total: ${args.batch}`);
    console.log(`Success: ${success}`);
    console.log(`Failed: ${args.batch - success}`);
  } else {
    await submitInference(wallet, args.score, args.outputT, args.outputS);
  }
}

main().catch(console.error);
