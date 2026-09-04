use crate::{error::LpError, POOL_STATE_SEED};
use crate::{PoolState, LP_MINT_SEED, VAULT_A_SEED, VAULT_B_SEED};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        burn, transfer_checked, Burn, Mint, TokenAccount, TokenInterface, TransferChecked,
    },
};
use ra_solana_math::FixedPoint;

pub fn handle_remove_liquidity(
    ctx: Context<RemoveLiquidity>,
    lp_tokens: u64,
    min_amount_a: u64,
    min_amount_b: u64,
) -> Result<()> {
    let reserve_a = ctx.accounts.pool_state.reserve_a;
    let reserve_b = ctx.accounts.pool_state.reserve_b;
    let lp_supply = ctx.accounts.pool_state.lp_tokens_supply;

    let amount_a = FixedPoint::from_int(lp_tokens)
        .mul(&FixedPoint::from_int(reserve_a))?
        .div(&FixedPoint::from_int(lp_supply))?
        .to_u64()?;
    let amount_b = FixedPoint::from_int(lp_tokens)
        .mul(&FixedPoint::from_int(reserve_b))?
        .div(&FixedPoint::from_int(lp_supply))?
        .to_u64()?;
    require!(
        amount_a >= min_amount_a,
        LpError::MinTokenAmountNotSatisfied
    );
    require!(
        amount_b >= min_amount_b,
        LpError::MinTokenAmountNotSatisfied
    );

    ctx.accounts.pool_state.reserve_a = ctx
        .accounts
        .pool_state
        .reserve_a
        .checked_sub(amount_a)
        .ok_or(LpError::UnderflowError)?;
    ctx.accounts.pool_state.reserve_b = ctx
        .accounts
        .pool_state
        .reserve_b
        .checked_sub(amount_b)
        .ok_or(LpError::UnderflowError)?;
    ctx.accounts.pool_state.lp_tokens_supply = ctx
        .accounts
        .pool_state
        .lp_tokens_supply
        .checked_sub(lp_tokens)
        .ok_or(LpError::UnderflowError)?;

    let cpi_accounts = Burn {
        from: ctx.accounts.lp_token_account.to_account_info(),
        mint: ctx.accounts.lp_mint.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    let cpi_program_id = ctx.accounts.token_program.key();
    let cpi_context = CpiContext::new(cpi_program_id, cpi_accounts);
    burn(cpi_context, lp_tokens)?;

    let mint_a = ctx.accounts.mint_a.key();
    let mint_b = ctx.accounts.mint_b.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"pool_state",
        mint_a.as_ref(),
        mint_b.as_ref(),
        &[ctx.accounts.pool_state.bump],
    ]];

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.vault_a.to_account_info(),
        to: ctx.accounts.ata_a.to_account_info(),
        mint: ctx.accounts.mint_a.to_account_info(),
        authority: ctx.accounts.pool_state.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program_id, cpi_accounts, signer_seeds);
    transfer_checked(cpi_context, amount_a, ctx.accounts.mint_a.decimals)?;

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.vault_b.to_account_info(),
        to: ctx.accounts.ata_b.to_account_info(),
        mint: ctx.accounts.mint_b.to_account_info(),
        authority: ctx.accounts.pool_state.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(cpi_program_id, cpi_accounts, signer_seeds);
    transfer_checked(cpi_context, amount_b, ctx.accounts.mint_b.decimals)?;

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
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
        seeds = [VAULT_B_SEED, pool_state.key().as_ref()],
        bump
    )]
    pub vault_b: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::authority = signer,
        associated_token::mint = lp_mint,
        associated_token::token_program = token_program,
    )]
    pub lp_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

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

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
