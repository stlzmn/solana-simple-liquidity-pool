use anchor_lang::prelude::*;

#[constant]
pub const LP_MINT_SEED: &[u8] = b"lp_mint";

#[constant]
pub const VAULT_A_SEED: &[u8] = b"vault_a";

#[constant]
pub const VAULT_B_SEED: &[u8] = b"vault_b";

#[constant]
pub const POOL_STATE_SEED: &[u8] = b"pool_state";

#[constant]
pub const MINIMUM_LIQUIDITY: u64 = 1000;

#[constant]
pub const FEE_BPS: u64 = 30;

#[constant]
pub const BPS_DENOMINATOR: u64 = 10000;
