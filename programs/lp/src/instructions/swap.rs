use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};
use ra_solana_math::FixedPoint;

use crate::{
    constants::{BPS_DENOMINATOR, FEE_BPS},
    POOL_STATE_SEED,
};
use crate::{error::LpError, PoolState};

pub fn handle_swap(
    ctx: Context<Swap>,
    amount_in: u64,
    min_amount_out: u64,
    a_to_b: bool,
) -> Result<()> {
    let reserve_a = ctx.accounts.pool_state.reserve_a;
    let reserve_b = ctx.accounts.pool_state.reserve_b;
    let old_k = FixedPoint::from_int(reserve_a)
        .mul(&FixedPoint::from_int(reserve_b))?
        .to_u128()?;

    let (reserve_in, reserve_out) = if a_to_b {
        (reserve_a, reserve_b)
    } else {
        (reserve_b, reserve_a)
    };
    let (vault_in, vault_out) = if a_to_b {
        (&ctx.accounts.vault_a, &ctx.accounts.vault_b)
    } else {
        (&ctx.accounts.vault_b, &ctx.accounts.vault_a)
    };
    let (ata_in, ata_out) = if a_to_b {
        (&ctx.accounts.ata_a, &ctx.accounts.ata_b)
    } else {
        (&ctx.accounts.ata_b, &ctx.accounts.ata_a)
    };
    let (mint_in, mint_out) = if a_to_b {
        (&ctx.accounts.mint_a, &ctx.accounts.mint_b)
    } else {
        (&ctx.accounts.mint_b, &ctx.accounts.mint_a)
    };

    let fee_num = FixedPoint::from_int(BPS_DENOMINATOR - FEE_BPS);
    let fee_bps = FixedPoint::from_int(BPS_DENOMINATOR);
    let effective_amount_in = FixedPoint::from_int(amount_in)
        .mul(&fee_num)?
        .div(&fee_bps)?;

    let amount_out = FixedPoint::from_int(reserve_out)
        .mul(&effective_amount_in)?
        .div(&FixedPoint::from_int(reserve_in).add(&effective_amount_in)?)?
        .to_u64()?;

    require!(
        amount_out >= min_amount_out,
        LpError::MinTokenAmountNotSatisfied
    );

    let new_reserve_in = reserve_in
        .checked_add(amount_in)
        .ok_or(LpError::TokenOverflow)?;
    let new_reserve_out = reserve_out
        .checked_sub(amount_out)
        .ok_or(LpError::UnderflowError)?;

    if a_to_b {
        ctx.accounts.pool_state.reserve_a = new_reserve_in;
        ctx.accounts.pool_state.reserve_b = new_reserve_out;
    } else {
        ctx.accounts.pool_state.reserve_a = new_reserve_out;
        ctx.accounts.pool_state.reserve_b = new_reserve_in;
    }

    let new_k = FixedPoint::from_int(new_reserve_in)
        .mul(&FixedPoint::from_int(new_reserve_out))?
        .to_u128()?;

    require!(new_k >= old_k, LpError::LpLossPrevented);

    let cpi_program_id = ctx.accounts.token_program.key();
    let cpi_accounts = TransferChecked {
        from: ata_in.to_account_info(),
        to: vault_in.to_account_info(),
        mint: mint_in.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    let cpi_context = CpiContext::new(cpi_program_id, cpi_accounts);
    transfer_checked(cpi_context, amount_in, mint_in.decimals)?;

    let cpi_accounts = TransferChecked {
        from: vault_out.to_account_info(),
        to: ata_out.to_account_info(),
        mint: mint_out.to_account_info(),
        authority: ctx.accounts.pool_state.to_account_info(),
    };

    let mint_a = ctx.accounts.mint_a.key();
    let mint_b = ctx.accounts.mint_b.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"pool_state",
        mint_a.as_ref(),
        mint_b.as_ref(),
        &[ctx.accounts.pool_state.bump],
    ]];
    let cpi_context = CpiContext::new_with_signer(cpi_program_id, cpi_accounts, signer_seeds);
    transfer_checked(cpi_context, amount_out, mint_out.decimals)?;

    Ok(())
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub mint_a: Box<InterfaceAccount<'info, Mint>>,
    pub mint_b: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [POOL_STATE_SEED, mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        mut,
        token::authority = pool_state,
        token::mint = mint_a,
        seeds = [b"vault_a", pool_state.key().as_ref()],
        bump
    )]
    pub vault_a: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        token::authority = pool_state,
        token::mint = mint_b,
        seeds = [b"vault_b", pool_state.key().as_ref()],
        bump
    )]
    pub vault_b: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = signer,
        associated_token::mint = mint_a,
        associated_token::token_program = associated_token_program,
    )]
    pub ata_a: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = signer,
        associated_token::mint = mint_b,
        associated_token::token_program = associated_token_program,
    )]
    pub ata_b: Box<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
