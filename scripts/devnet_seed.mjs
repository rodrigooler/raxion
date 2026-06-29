#!/usr/bin/env node
/**
 * Seed devnet with test inferences.
 * Usage: node scripts/devnet_seed.mjs [count]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  SYSVAR_SLOT_HASHES_PUBKEY,
} from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT");
const RPC_URL = "https://api.devnet.solana.com";
const COUNT = parseInt(process.argv[2] || "5", 10);

function loadWallet() {
  const p = join(process.env.HOME, ".config/solana/id.json");
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(readFileSync(p, "utf-8"))));
}

function disc(name) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function pda(seeds) {
  return PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
}

function encodeInitAgent(stakeAmount) {
  const d = disc("init_agent");
  const buf = Buffer.alloc(8 + 8);
  d.copy(buf);
  buf.writeBigUInt64LE(BigInt(stakeAmount), 8);
  return buf;
}

function encodeSubmitConvergence(inferenceId, score, proofHash, hashT, hashS) {
  const d = disc("submit_convergence");
  const buf = Buffer.alloc(8 + 8 + 4 + 32 + 32 + 32);
  let o = 0;
  d.copy(buf, o); o += 8;
  buf.writeBigUInt64LE(BigInt(inferenceId), o); o += 8;
  buf.writeFloatLE(score, o); o += 4;
  proofHash.copy(buf, o); o += 32;
  hashT.copy(buf, o); o += 32;
  hashS.copy(buf, o);
  return buf;
}

function randomHash(label) {
  return createHash("sha256").update(`${label}_${Date.now()}_${Math.random()}`).digest();
}

async function main() {
  const conn = new Connection(RPC_URL, "confirmed");
  const wallet = loadWallet();
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

  const stakePda = pda([Buffer.from("stake"), wallet.publicKey.toBuffer()]);
  const cognitivePda = pda([Buffer.from("cognitive"), wallet.publicKey.toBuffer()]);

  // Check if agent already initialized
  const stakeInfo = await conn.getAccountInfo(stakePda);
  if (!stakeInfo) {
    console.log("Initializing agent...");
    const ix = {
      programId: PROGRAM_ID,
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: stakePda, isSigner: false, isWritable: true },
        { pubkey: cognitivePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: encodeInitAgent(100_000_000),
    };
    const { blockhash } = await conn.getLatestBlockhash("confirmed");
    const msg = new TransactionMessage({ payerKey: wallet.publicKey, recentBlockhash: blockhash, instructions: [ix] }).compileToV0Message();
    const tx = new VersionedTransaction(msg);
    tx.sign([wallet]);
    const sig = await conn.sendTransaction(tx, { skipPreflight: false });
    console.log(`  init_agent TX: ${sig}`);
    await conn.confirmTransaction(sig, "confirmed");
    console.log("  Agent initialized.");
  } else {
    console.log("Agent already initialized.");
  }

  // Submit inferences
  const scores = [];
  for (let i = 0; i < COUNT; i++) {
    const score = Math.round((0.3 + Math.random() * 0.65) * 1000) / 1000;
    scores.push(score);
  }

  for (let i = 0; i < COUNT; i++) {
    const inferenceId = Date.now() * 1000 + i;
    const score = scores[i];
    const inferencePda = pda([
      Buffer.from("inference"),
      wallet.publicKey.toBuffer(),
      Buffer.from(new BigUint64Array([BigInt(inferenceId)]).buffer),
    ]);

    const ix = {
      programId: PROGRAM_ID,
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: stakePda, isSigner: false, isWritable: false },
        { pubkey: cognitivePda, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_SLOT_HASHES_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: inferencePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: encodeSubmitConvergence(inferenceId, score, randomHash("proof"), randomHash("T"), randomHash("S")),
    };

    const { blockhash } = await conn.getLatestBlockhash("confirmed");
    const msg = new TransactionMessage({ payerKey: wallet.publicKey, recentBlockhash: blockhash, instructions: [ix] }).compileToV0Message();
    const tx = new VersionedTransaction(msg);
    tx.sign([wallet]);

    try {
      const sig = await conn.sendTransaction(tx, { skipPreflight: false });
      const cat = score < 0.3 ? "REJECTED" : score < 0.6 ? "LOW_CONF" : score < 0.85 ? "STANDARD" : "HIGH";
      console.log(`[${i + 1}/${COUNT}] score=${score.toFixed(3)} cat=${cat} tx=${sig.slice(0, 20)}...`);
      await conn.confirmTransaction(sig, "confirmed");
    } catch (e) {
      console.log(`[${i + 1}/${COUNT}] FAILED: ${e.message.slice(0, 100)}`);
    }
  }

  console.log("\nDone! Check https://devnet.raxion.network");
}

main().catch(console.error);
