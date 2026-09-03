use crate::{state::PoolState, LP_MINT_SEED, POOL_STATE_SEED, VAULT_A_SEED, VAULT_B_SEED};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.pool_state.reserve_a = 0;
    ctx.accounts.pool_state.reserve_b = 0;
    ctx.accounts.pool_state.lp_tokens_supply = 0;
    ctx.accounts.pool_state.mint_a = ctx.accounts.mint_a.key();
    ctx.accounts.pool_state.mint_b = ctx.accounts.mint_b.key();
    ctx.accounts.pool_state.lp_mint = ctx.accounts.lp_mint.key();
    ctx.accounts.pool_state.bump = ctx.bumps.pool_state;
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init, 
        payer = signer, 
        space = 8 + PoolState::INIT_SPACE, 
        seeds = [POOL_STATE_SEED, mint_a.key().as_ref(), mint_b.key().as_ref()], 
        bump
    )]
    pub pool_state: Account<'info, PoolState>,

    pub mint_a: InterfaceAccount<'info, Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = signer,
        token::authority = pool_state,
        token::mint = mint_a,
        seeds = [VAULT_A_SEED, pool_state.key().as_ref()],
        bump
    )]
    pub vault_a: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init,
        payer = signer,
        token::authority = pool_state,
        token::mint = mint_b,
        seeds = [VAULT_B_SEED, pool_state.key().as_ref()],
        bump
    )]
    pub vault_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = signer,
        mint::decimals = 6,
        mint::authority = pool_state,
        mint::freeze_authority = pool_state,
        seeds = [LP_MINT_SEED, pool_state.key().as_ref()],
        bump
    )]
    pub lp_mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}
