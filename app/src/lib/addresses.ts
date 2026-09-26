import { PublicKey } from "@solana/web3.js";
import { MINT_A_SEED, MINT_B_SEED, ORDERBOOK_SEED, POOL_STATE_SEED, LP_PROGRAM_ID, MINTER_PROGRAM_ID } from "../constants";
import { Buffer } from "buffer";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

export function getMintPda(kind: "A" | "B") {
  const seed = kind === "A" ? MINT_A_SEED : MINT_B_SEED;
  return PublicKey.findProgramAddressSync([Buffer.from(seed)], LP_PROGRAM_ID);
}

export function getLpMintPda() {
  return PublicKey.findProgramAddressSync([Buffer.from("lp_mint")], LP_PROGRAM_ID);
}


export function getUserAta(user: PublicKey, mint: "A" | "B") {
  const [_mint] = getMintPda(mint);
  return getAssociatedTokenAddressSync(
    _mint,
    user,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
}

