import { Connection, PublicKey } from "@solana/web3.js";

export type Category = "REJECTED" | "LOW_CONFIDENCE" | "STANDARD" | "HIGH_COHERENCE";

export type InferenceRow = {
  pubkey: string;
  agent: string;
  inferenceId: bigint;
  slot: bigint;
  coherenceScore: number;
  category: Category;
  isFinal: boolean;
  proofHash: string;
  timestamp: bigint;
  challenged: boolean;
  challengePassed: boolean | null;
};

const DEFAULT_RPC = "https://api.devnet.solana.com";
const DEFAULT_PROGRAM_ID = "11111111111111111111111111111111";

const CATEGORY_MAP: Record<number, Category> = {
  0: "REJECTED",
  1: "LOW_CONFIDENCE",
  2: "STANDARD",
  3: "HIGH_COHERENCE",
};

function readU64LE(buf: Buffer, offset: number): bigint {
  return buf.readBigUInt64LE(offset);
}

function readI64LE(buf: Buffer, offset: number): bigint {
  return buf.readBigInt64LE(offset);
}

function safeCategory(value: number): Category {
  return CATEGORY_MAP[value] ?? "LOW_CONFIDENCE";
}

function parseInferenceRecord(data: Buffer, pubkey: string): InferenceRow | null {
  // Anchor account discriminator + InferenceRecord fields
  if (data.length < 8 + 32 + 8 + 8 + 4 + 1 + 1 + 32 + 32 + 32 + 8 + 1 + 1 + 1) {
    return null;
  }

  let o = 8;

  const agent = new PublicKey(data.subarray(o, o + 32)).toBase58();
  o += 32;

  const inferenceId = readU64LE(data, o);
  o += 8;

  const slot = readU64LE(data, o);
  o += 8;

  const coherenceScore = data.readFloatLE(o);
  o += 4;

  const categoryRaw = data.readUInt8(o);
  o += 1;

  const isFinal = data.readUInt8(o) === 1;
  o += 1;

  const proofHash = `0x${data.subarray(o, o + 32).toString("hex")}`;
  o += 32;

  // output_hash_t + output_hash_s
  o += 32;
  o += 32;

  const timestamp = readI64LE(data, o);
  o += 8;

  const challenged = data.readUInt8(o) === 1;
  o += 1;

  const optionTag = data.readUInt8(o);
  o += 1;
  let challengePassed: boolean | null = null;
  if (optionTag === 1) {
    challengePassed = data.readUInt8(o) === 1;
    o += 1;
  }

  return {
    pubkey,
    agent,
    inferenceId,
    slot,
    coherenceScore,
    category: safeCategory(categoryRaw),
    isFinal,
    proofHash,
    timestamp,
    challenged,
    challengePassed,
  };
}

export async function fetchInferences(limit = 20): Promise<InferenceRow[]> {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? DEFAULT_RPC;
  const programId = process.env.NEXT_PUBLIC_POIQ_PROGRAM_ID ?? DEFAULT_PROGRAM_ID;

  const connection = new Connection(rpcUrl, "confirmed");
  const program = new PublicKey(programId);

  const accounts = await connection.getProgramAccounts(program, {
    commitment: "confirmed",
  });

  const rows: InferenceRow[] = [];
  for (const acc of accounts) {
    const parsed = parseInferenceRecord(Buffer.from(acc.account.data), acc.pubkey.toBase58());
    if (parsed) {
      rows.push(parsed);
    }
  }

  return rows
    .sort((a, b) => Number(b.timestamp - a.timestamp))
    .slice(0, limit);
}

export function summarize(rows: InferenceRow[]) {
  const total = rows.length;
  const avg = total === 0 ? 0 : rows.reduce((sum, r) => sum + r.coherenceScore, 0) / total;
  const challengeRate =
    total === 0
      ? 0
      : (rows.reduce((sum, r) => sum + (r.challenged ? 1 : 0), 0) / total) * 100;

  return {
    total,
    avg,
    challengeRate,
    categories: {
      REJECTED: rows.filter((r) => r.category === "REJECTED").length,
      LOW_CONFIDENCE: rows.filter((r) => r.category === "LOW_CONFIDENCE").length,
      STANDARD: rows.filter((r) => r.category === "STANDARD").length,
      HIGH_COHERENCE: rows.filter((r) => r.category === "HIGH_COHERENCE").length,
    },
  };
}
