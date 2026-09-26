pub mod constants;
pub mod error;
pub mod instructions;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;

declare_id!("6uzbawPJTrdoLae6r85FtLbusbFS7EVwugV8V9KmUgwQ");

#[program]
pub mod minter {
    use super::*;

    pub fn create_and_mint(ctx: Context<Initialize>, mint_seed: String, amount: u64) -> Result<()> {
        handle_create_and_mint(ctx, mint_seed, amount)
    }
}
