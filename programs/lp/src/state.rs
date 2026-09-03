use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PoolState {
    pub reserve_a: u64,
    pub reserve_b: u64,
    pub lp_tokens_supply: u64,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub lp_mint: Pubkey,
    pub bump: u8,
}
