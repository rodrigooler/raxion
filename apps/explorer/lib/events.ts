import { Connection, PublicKey } from "@solana/web3.js";

// ponytail: pre-computed sha256("event:<Name>")[0..8] for each Anchor event
const DISC_CONVERGENCE = new Uint8Array([0x8c, 0xbb, 0x6b, 0xd1, 0x73, 0x2e, 0x62, 0x87]);
const DISC_SLASH       = new Uint8Array([0x72, 0xcb, 0xd9, 0x82, 0x6a, 0x41, 0x2d, 0x46]);
const DISC_CHALLENGE   = new Uint8Array([0x35, 0x1e, 0x46, 0xd2, 0x6c, 0x52, 0x69, 0x2b]);
const DISC_DISSENT     = new Uint8Array([0xd1, 0xf1, 0xf3, 0xd1, 0xfb, 0x44, 0x78, 0xab]);

export type EventType = "convergence" | "slash" | "challenge" | "dissent";

export type PoiqEvent = {
  type: EventType;
  txSig: string;
  slot: number;
  agent: string;
  inferenceId: bigint;
  data: Record<string, unknown>;
};

function matchDisc(data: Uint8Array, disc: Uint8Array): boolean {
  for (let i = 0; i < 8; i++) if (data[i] !== disc[i]) return false;
  return true;
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function parseEventData(data: Uint8Array): PoiqEvent | null {
  if (data.length < 8) return null;
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (matchDisc(data, DISC_CONVERGENCE) && data.length >= 8 + 32 + 8 + 4 + 1 + 1 + 8 + 8) {
    let o = 8;
    const agent = new PublicKey(data.slice(o, o + 32)).toBase58(); o += 32;
    const inferenceId = dv.getBigUint64(o, true); o += 8;
    const coherenceScore = dv.getFloat32(o, true); o += 4;
    const isFinal = dv.getUint8(o) === 1; o += 1;
    const challenged = dv.getUint8(o) === 1; o += 1;
    const slot = dv.getBigUint64(o, true); o += 8;
    const timestamp = dv.getBigInt64(o, true);
    return {
      type: "convergence", txSig: "", slot: Number(slot), agent, inferenceId,
      data: { coherenceScore, isFinal, challenged, timestamp: Number(timestamp) },
    };
  }

  if (matchDisc(data, DISC_SLASH) && data.length >= 8 + 32 + 8 + 1 + 8) {
    let o = 8;
    const agent = new PublicKey(data.slice(o, o + 32)).toBase58(); o += 32;
    const slashAmount = dv.getBigUint64(o, true); o += 8;
    const trigger = dv.getUint8(o); o += 1;
    const inferenceId = dv.getBigUint64(o, true);
    return {
      type: "slash", txSig: "", slot: 0, agent, inferenceId,
      data: { slashAmount: Number(slashAmount), trigger },
    };
  }

  if (matchDisc(data, DISC_CHALLENGE) && data.length >= 8 + 32 + 8 + 1 + 32) {
    let o = 8;
    const agent = new PublicKey(data.slice(o, o + 32)).toBase58(); o += 32;
    const inferenceId = dv.getBigUint64(o, true); o += 8;
    const passed = dv.getUint8(o) === 1; o += 1;
    const responseHash = `0x${hex(data.slice(o, o + 32))}`;
    return {
      type: "challenge", txSig: "", slot: 0, agent, inferenceId,
      data: { passed, responseHash },
    };
  }

  if (matchDisc(data, DISC_DISSENT) && data.length >= 8 + 32 + 8 + 4 + 4 + 1 + 8) {
    let o = 8;
    const agent = new PublicKey(data.slice(o, o + 32)).toBase58(); o += 32;
    const inferenceId = dv.getBigUint64(o, true); o += 8;
    const coherenceScore = dv.getFloat32(o, true); o += 4;
    const internalConfidence = dv.getFloat32(o, true); o += 4;
    const dissentingArch = dv.getUint8(o); o += 1;
    const timestamp = dv.getBigInt64(o, true);
    return {
      type: "dissent", txSig: "", slot: 0, agent, inferenceId,
      data: { coherenceScore, internalConfidence, dissentingArch, timestamp: Number(timestamp) },
    };
  }

  return null;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function fetchRecentEvents(
  programId: string,
  rpcUrl: string,
  limit = 20,
): Promise<PoiqEvent[]> {
  const connection = new Connection(rpcUrl, "confirmed");
  const program = new PublicKey(programId);

  const sigs = await connection.getSignaturesForAddress(program, { limit });
  const events: PoiqEvent[] = [];

  for (const sigInfo of sigs) {
    try {
      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (!tx?.meta?.logMessages) continue;

      for (const log of tx.meta.logMessages) {
        if (!log.startsWith("Program data: ")) continue;
        const b64 = log.slice("Program data: ".length);
        try {
          const data = base64ToBytes(b64);
          const event = parseEventData(data);
          if (event) {
            event.txSig = sigInfo.signature;
            event.slot = sigInfo.slot;
            events.push(event);
          }
        } catch { /* skip malformed */ }
      }
    } catch { /* skip failed tx fetch */ }
  }

  return events.sort((a, b) => b.slot - a.slot);
}

export function summarizeEvents(events: PoiqEvent[]) {
  const convergence = events.filter(e => e.type === "convergence");
  const slashes = events.filter(e => e.type === "slash");
  const challenges = events.filter(e => e.type === "challenge");
  const dissents = events.filter(e => e.type === "dissent");
  const totalSlashAmount = slashes.reduce((s, e) => s + ((e.data.slashAmount as number) || 0), 0);

  return {
    total: events.length,
    convergence: convergence.length,
    slashes: slashes.length,
    challenges: challenges.length,
    dissents: dissents.length,
    totalSlashAmount,
    challengePassRate: challenges.length === 0 ? 0
      : (challenges.filter(e => e.data.passed).length / challenges.length) * 100,
  };
}
