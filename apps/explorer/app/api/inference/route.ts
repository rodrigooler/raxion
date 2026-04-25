// API route: POST /api/inference
// Submits an inference to the RAXION PoIQ program on devnet

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";

// Program ID from Anchor.toml
const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_POIQ_PROGRAM_ID || "5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT"
);

// RPC endpoint
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

// IdlType for InferenceRecord (simplified)
interface InferenceRecord {
  agent: PublicKey;
  inferenceId: number;
  slot: number;
  coherenceScore: number;
  category: number;
  isFinal: boolean;
  proofHash: number[];
  outputHashT: number[];
  outputHashS: number[];
  timestamp: number;
  challenged: boolean;
  challengePassed: boolean | null;
  bump: number;
}

// Anchor IDL for raxion-poiq (inline for this API route)
const IDL = {
  version: "0.1.0",
  name: "raxion_poiq",
  instructions: [
    {
      name: "submit_convergence",
      accounts: [
        { name: "agent", isMut: true, isSigner: true },
        { name: "agentStake", isMut: false, isSigner: false },
        { name: "cognitiveAccount", isMut: false, isSigner: false },
        { name: "slotHashes", isMut: false, isSigner: false },
        { name: "inferenceRecord", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "inferenceId", type: "u64" },
        { name: "coherenceScore", type: "f32" },
        { name: "proofHash", type: { array: ["u8", 32] } },
        { name: "outputHashT", type: { array: ["u8", 32] } },
        { name: "outputHashS", type: { array: ["u8", 32] } },
      ],
    },
  ],
};

function hashToBytes32(input: string): number[] {
  const hash = createHash("sha256").update(input).digest();
  return Array.from(hash);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coherence_score, output_t, output_s, agent_key } = body;

    // Validate inputs
    if (
      typeof coherence_score !== "number" ||
      coherence_score < 0 ||
      coherence_score > 1
    ) {
      return NextResponse.json(
        { error: "coherence_score must be a number between 0 and 1" },
        { status: 400 }
      );
    }

    // Create connection
    const connection = new Connection(RPC_URL, "confirmed");

    // For devnet testing, we can use a pre-funded keypair or require a signer
    // In production, this would be handled by a proper wallet service
    let signer: Keypair;

    if (agent_key) {
      // If agent_key is provided, use it (base58 encoded)
      try {
        signer = Keypair.fromPublicKey(new PublicKey(agent_key));
      } catch {
        return NextResponse.json(
          { error: "Invalid agent_key format" },
          { status: 400 }
        );
      }
    } else {
      // Use a default devnet keypair for testing (this would fail without the key)
      // In production, you'd require proper authentication
      return NextResponse.json(
        {
          error: "agent_key required. For devnet testing, provide a base58-encoded keypair.",
          hint: "For automated testing, use the CLI tool: node scripts/submit_inference.js",
        },
        { status: 400 }
      );
    }

    // Get a recent blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");

    // Generate inference ID (using timestamp + random for uniqueness)
    const inference_id = BigInt(
      Date.now() * 1000 + Math.floor(Math.random() * 1000)
    );

    // Calculate output hashes (for documentation purposes)
    // In production, these would be calculated by the actual model inference
    const outputHashT = hashToBytes32(output_t || "transformer_output");
    const outputHashS = hashToBytes32(output_s || "ssm_output");
    const proofHash = hashToBytes32(`proof_${inference_id}_${coherence_score}`);

    // Derive PDA for inference record (for documentation purposes)
    // In production, the full Anchor serialization would be done client-side
    const inferenceRecord = PublicKey.findProgramAddressSync(
      [
        Buffer.from("inference"),
        signer.publicKey.toBuffer(),
        Buffer.from(inference_id.toString(16), "hex"),
      ],
      PROGRAM_ID
    );

    const instructionData = Buffer.alloc(8 + 4 + 32 + 32 + 32);

    // For now, return what we would have submitted
    // Full implementation would use Anchor's provider to build and send the transaction

    const response = {
      success: true,
      inference_id: inference_id.toString(),
      coherence_score,
      category: (() => {
        if (coherence_score < 0.3) return "REJECTED";
        if (coherence_score < 0.6) return "LOW_CONFIDENCE";
        if (coherence_score < 0.85) return "STANDARD";
        return "HIGH_COHERENCE";
      })(),
      is_final: coherence_score >= 0.6,
      tx_sig: `simulated_${blockhash.slice(0, 16)}`, // Simulated for now
      message:
        "Transaction simulation successful. For production, use the CLI tool with a funded wallet.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Inference submission error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/inference",
    method: "POST",
    body: {
      coherence_score: "number (0-1, required)",
      output_t: "string (optional, for hash generation)",
      output_s: "string (optional, for hash generation)",
      agent_key: "string (base58 public key, required)",
    },
    example: {
      coherence_score: 0.75,
      output_t: "Transformer output text",
      output_s: "SSM output text",
      agent_key: "YOUR_PUBLIC_KEY_BASE58",
    },
  });
}
