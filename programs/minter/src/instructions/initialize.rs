use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, Mint, MintTo, TokenAccount, TokenInterface},
};

use crate::constants::MINT_SEED;

pub fn handle_create_and_mint(
    ctx: Context<Initialize>,
    mint_seed: String,
    amount: u64,
) -> Result<()> {
    let signer_seeds: &[&[&[u8]]] = &[&[mint_seed.as_bytes(), &[ctx.bumps.mint]]];
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.ata.to_account_info(),
        authority: ctx.accounts.mint.to_account_info(),
    };
    let cpi_program_id = ctx.accounts.token_program.key();
    let cpi_context = CpiContext::new_with_signer(cpi_program_id, cpi_accounts, signer_seeds);
    token_interface::mint_to(cpi_context, amount)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(mint_seed: String, amount: u64)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        mint::decimals = 6,
        mint::authority = mint,
        mint::freeze_authority = mint,
        seeds = [mint_seed.as_bytes()],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program,
    )]
    pub ata: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
