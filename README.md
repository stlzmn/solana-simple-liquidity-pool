# solana-simple-liquidity-pool

A simple constant-product AMM (like Uniswap v2) built as a Solana program with Anchor.

## What's in here

- `programs/lp` - the liquidity pool program: initialize a pool, add/remove liquidity, swap
  tokens. Uses the x*y=k formula with a swap fee, slippage checks (`min_amount_out`,
  `min_lp_tokens`) and checked arithmetic to avoid overflow.
- `programs/minter` - a small helper program to create a token mint and mint tokens to
  yourself, useful for testing the pool with your own test tokens.
- `app/` - a React + Vite frontend (wallet-adapter) for interacting with the programs.

## Why

Wanted to understand how an AMM actually works under the hood - the math, the slippage
protection, the account structure - by building one instead of just reading about it.

## Status

Local/devnet only. Not audited, not meant for mainnet/production use.

## Running

```bash
anchor build
anchor test
```

Frontend:

```bash
cd app
npm install
npm run dev
```
