import { PublicKey } from "@solana/web3.js";
import idlLp from "../../target/idl/lp.json";
import idlMinter from "../../target/idl/minter.json";


export const MINT_A_SEED = "mint_a";
export const MINT_B_SEED = "mint_b";
export const LP_MINT = "lp_mint";
export const ORDERBOOK_SEED = "orderbook";
export const POOL_STATE_SEED = "pool_state";
export const VAULT_A_SEED = "vault_a";
export const VAULT_B_SEED = "vault_b";
export const LP_PROGRAM_ID = new PublicKey(idlLp.address);
export const MINTER_PROGRAM_ID = new PublicKey(idlMinter.address);
