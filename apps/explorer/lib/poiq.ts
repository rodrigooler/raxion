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
const DEFAULT_PROGRAM_ID = "5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT";
// ponytail: pre-computed sha256("account:InferenceRecord")[0..8]
const DISC = new Uint8Array([0xf0, 0x89, 0x46, 0x9a, 0xf3, 0x0e, 0xc9, 0x42]);

const CATEGORY_MAP: Record<number, Category> = {
  0: "REJECTED",
  1: "LOW_CONFIDENCE",
  2: "STANDARD",
  3: "HIGH_COHERENCE",
};

function u8(dv: DataView, o: number) { return dv.getUint8(o); }
function f32(dv: DataView, o: number) { return dv.getFloat32(o, true); }
function u64(dv: DataView, o: number) { return dv.getBigUint64(o, true); }
function i64(dv: DataView, o: number) { return dv.getBigInt64(o, true); }

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function matchDisc(data: Uint8Array): boolean {
  for (let i = 0; i < 8; i++) if (data[i] !== DISC[i]) return false;
  return true;
}

function parseInferenceRecord(data: Uint8Array, pubkey: string): InferenceRow | null {
  const MIN = 8 + 32 + 8 + 8 + 4 + 1 + 1 + 32 + 32 + 32 + 8 + 1 + 1;
  if (data.length < MIN) return null;
  if (!matchDisc(data)) return null;

  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let o = 8;

  const agent = new PublicKey(data.slice(o, o + 32)).toBase58();
  o += 32;

  const inferenceId = u64(dv, o); o += 8;
  const slot = u64(dv, o); o += 8;
  const coherenceScore = f32(dv, o); o += 4;
  const categoryRaw = u8(dv, o); o += 1;
  const isFinal = u8(dv, o) === 1; o += 1;
  const proofHash = `0x${hex(data.slice(o, o + 32))}`; o += 32;
  o += 64; // output_hash_t + output_hash_s
  const timestamp = i64(dv, o); o += 8;
  const challenged = u8(dv, o) === 1; o += 1;
  const optionTag = u8(dv, o); o += 1;
  let challengePassed: boolean | null = null;
  if (optionTag === 1 && data.length >= o + 1) {
    challengePassed = u8(dv, o) === 1;
  }

  return {
    pubkey, agent, inferenceId, slot, coherenceScore,
    category: CATEGORY_MAP[categoryRaw] ?? "LOW_CONFIDENCE",
    isFinal, proofHash, timestamp, challenged, challengePassed,
  };
}

export async function fetchInferences(limit = 20, programId?: string, rpcUrl?: string): Promise<InferenceRow[]> {
  const rpc = rpcUrl ?? DEFAULT_RPC;
  const pid = programId ?? DEFAULT_PROGRAM_ID;

  const connection = new Connection(rpc, "confirmed");
  const program = new PublicKey(pid);
  const accounts = await connection.getProgramAccounts(program, { commitment: "confirmed" });

  const rows: InferenceRow[] = [];
  for (const acc of accounts) {
    const data = new Uint8Array(acc.account.data);
    const parsed = parseInferenceRecord(data, acc.pubkey.toBase58());
    if (parsed) rows.push(parsed);
  }

  return rows.sort((a, b) => Number(b.timestamp - a.timestamp)).slice(0, limit);
}

export function summarize(rows: InferenceRow[]) {
  const total = rows.length;
  const avg = total === 0 ? 0 : rows.reduce((sum, r) => sum + r.coherenceScore, 0) / total;
  const challengeRate = total === 0 ? 0 : (rows.filter(r => r.challenged).length / total) * 100;

  return {
    total, avg, challengeRate,
    categories: {
      REJECTED: rows.filter(r => r.category === "REJECTED").length,
      LOW_CONFIDENCE: rows.filter(r => r.category === "LOW_CONFIDENCE").length,
      STANDARD: rows.filter(r => r.category === "STANDARD").length,
      HIGH_COHERENCE: rows.filter(r => r.category === "HIGH_COHERENCE").length,
    },
  };
}
