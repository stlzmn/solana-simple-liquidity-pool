use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked},
};
use ra_solana_math::FixedPoint;

use crate::{error::LpError, LP_MINT_SEED, POOL_STATE_SEED};
use crate::{PoolState, VAULT_A_SEED, VAULT_B_SEED};

const MINIMUM_LIQUIDITY: u64 = 1000;

pub fn handle_add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_a: u64,
    amount_b: u64,
    min_lp_tokens: u64,
) -> Result<()> {
    let mint_a = ctx.accounts.mint_a.key();
    let mint_b = ctx.accounts.mint_b.key();
    require!(mint_a == ctx.accounts.pool_state.mint_a, LpError::WrongMint);
    require!(mint_b == ctx.accounts.pool_state.mint_b, LpError::WrongMint);

    let cpi_program_id = ctx.accounts.token_program.key();

    let reserve_a = ctx.accounts.pool_state.reserve_a;
    let reserve_b = ctx.accounts.pool_state.reserve_b;

    let (lp_tokens_out, supply_increase) = if reserve_a == 0 && reserve_b == 0 {
        let a = FixedPoint::from_int(amount_a);
        let b = FixedPoint::from_int(amount_b);
        let ab = a.mul(&b)?.sqrt()?.to_u64()?;
        require!(ab > MINIMUM_LIQUIDITY, LpError::LowInitialLiquidity);
        let ab_locked = ab - MINIMUM_LIQUIDITY;
        (ab_locked, ab)
    } else {
        let a = FixedPoint::from_int(amount_a);
        let b = FixedPoint::from_int(amount_b);
        let supp = FixedPoint::from_int(ctx.accounts.pool_state.lp_tokens_supply);
        let ra = FixedPoint::from_int(reserve_a);
        let rb = FixedPoint::from_int(reserve_b);
        let f1 = a.mul(&supp.div(&ra)?)?;
        let f2 = b.mul(&supp.div(&rb)?)?;
        let ab = f1.min(&f2).to_u64()?;
        (ab, ab)
    };

    require!(lp_tokens_out >= min_lp_tokens, LpError::TooLittleLpTokens);

    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.mint_a.to_account_info(),
        from: ctx.accounts.ata_a.to_account_info(),
        to: ctx.accounts.vault_a.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    let cpi_context = CpiContext::new(cpi_program_id, cpi_accounts);
    token_interface::transfer_checked(cpi_context, amount_a, ctx.accounts.mint_a.decimals)?;

    ctx.accounts.pool_state.reserve_a = ctx
        .accounts
        .pool_state
        .reserve_a
        .checked_add(amount_a)
        .ok_or(LpError::TokenOverflow)?;

    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.mint_b.to_account_info(),
        from: ctx.accounts.ata_b.to_account_info(),
        to: ctx.accounts.vault_b.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    let cpi_context = CpiContext::new(cpi_program_id, cpi_accounts);
    token_interface::transfer_checked(cpi_context, amount_b, ctx.accounts.mint_b.decimals)?;

    ctx.accounts.pool_state.reserve_b = ctx
        .accounts
        .pool_state
        .reserve_b
        .checked_add(amount_b)
        .ok_or(LpError::TokenOverflow)?;

    ctx.accounts.pool_state.lp_tokens_supply = ctx
        .accounts
        .pool_state
        .lp_tokens_supply
        .checked_add(supply_increase)
        .ok_or(LpError::TokenOverflow)?;

    let signer_seeds: &[&[&[u8]]] = &[&[
        b"pool_state",
        mint_a.as_ref(),
        mint_b.as_ref(),
        &[ctx.accounts.pool_state.bump],
    ]];
    let cpi_accounts = MintTo {
        mint: ctx.accounts.lp_mint.to_account_info(),
        to: ctx.accounts.lp_token_account.to_account_info(),
        authority: ctx.accounts.pool_state.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program_id, cpi_accounts, signer_seeds);
    token_interface::mint_to(cpi_context, lp_tokens_out)?;

    Ok(())
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub mint_a: Box<InterfaceAccount<'info, Mint>>,
    pub mint_b: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [LP_MINT_SEED, pool_state.key().as_ref()],
        bump
    )]
    pub lp_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [POOL_STATE_SEED, mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump,
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        mut,
        token::authority = pool_state,
        token::mint = mint_a,
        seeds = [VAULT_A_SEED, pool_state.key().as_ref()],
        bump
    )]
    pub vault_a: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        token::authority = pool_state,
        token::mint = mint_b,
        seeds =  [VAULT_B_SEED, pool_state.key().as_ref()],
        bump
    )]
    pub vault_b: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = signer,
        associated_token::mint = mint_a,
        associated_token::token_program = token_program,
    )]
    pub ata_a: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = signer,
        associated_token::mint = mint_b,
        associated_token::token_program = token_program,
    )]
    pub ata_b: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::authority = signer,
        associated_token::mint = lp_mint,
        associated_token::token_program = token_program,
    )]
    pub lp_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
