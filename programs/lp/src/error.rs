use anchor_lang::prelude::*;

#[error_code]
pub enum LpError {
    #[msg("Token amount overflow")]
    TokenOverflow,
    #[msg("Too low amount of initial liquidity")]
    LowInitialLiquidity,
    #[msg("Too little lp tokens out")]
    TooLittleLpTokens,
    #[msg("Underflow error")]
    UnderflowError,
    #[msg("Wrong mint")]
    WrongMint,
    #[msg("Minimumt token amount not satisfied")]
    MinTokenAmountNotSatisfied,
    #[msg("Lp loss prevented due to k_new < k_old")]
    LpLossPrevented,
}
