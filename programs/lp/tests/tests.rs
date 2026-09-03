use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{
            instruction::Instruction, program_pack::Pack, system_instruction, system_program,
        },
        InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

use anchor_lang::AccountDeserialize;
use anchor_spl::{
    associated_token::{
        get_associated_token_address,
        spl_associated_token_account::instruction::create_associated_token_account,
        ID as associated_token_id,
    },
    token::spl_token::{self, state::Account, ID as token_program_id}, // token_2022::spl_token_2022::{extension::StateWithExtensions, state::Account},
};
use litesvm::types::TransactionResult;
use lp::{LP_MINT_SEED, POOL_STATE_SEED, VAULT_A_SEED, VAULT_B_SEED};

fn create_ata(svm: &mut LiteSVM, payer: &Keypair, owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    let ata = get_associated_token_address(owner, mint);
    let ix = create_associated_token_account(&payer.pubkey(), owner, mint, &spl_token::ID);

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&payer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[payer]).unwrap();
    svm.send_transaction(tx).unwrap();

    ata
}

fn create_mint(svm: &mut LiteSVM, payer: &Keypair, decimals: u8) -> Pubkey {
    let mint = Keypair::new();
    let rent = svm.minimum_balance_for_rent_exemption(spl_token::state::Mint::LEN);

    let create_ix = system_instruction::create_account(
        &payer.pubkey(),
        &mint.pubkey(),
        rent,
        spl_token::state::Mint::LEN as u64,
        &spl_token::ID,
    );
    let init_ix = spl_token::instruction::initialize_mint2(
        &spl_token::ID,
        &mint.pubkey(),
        &payer.pubkey(),
        None,
        decimals,
    )
    .unwrap();

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[create_ix, init_ix], Some(&payer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[payer, &mint]).unwrap();
    svm.send_transaction(tx).unwrap();

    mint.pubkey()
}

fn mint_to(
    svm: &mut LiteSVM,
    signer: &Keypair,
    owner: &Pubkey,
    to: &Pubkey,
    mint: &Pubkey,
    amount: u64,
) {
    let mint_ix = spl_token::instruction::mint_to(
        &spl_token::ID,
        mint,
        to,
        owner,
        &[&signer.pubkey()],
        amount,
    )
    .unwrap();
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[mint_ix], Some(&signer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&signer]).unwrap();
    svm.send_transaction(tx).unwrap();
}

struct TestCtx {
    svm: LiteSVM,
    program_id: Pubkey,
    user: Keypair,
    mint_a: Pubkey,
    mint_b: Pubkey,
    lp_mint: Pubkey,
    user_lp_token_ata: Pubkey,
    vault_a: Pubkey,
    vault_b: Pubkey,
    pool_state: Pubkey,
}

fn send(
    svm: &mut LiteSVM,
    ix: Instruction,
    payer: &Keypair,
    signers: &[&Keypair],
) -> TransactionResult {
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&payer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers).unwrap();
    svm.send_transaction(tx)
}

fn token_balance(svm: &LiteSVM, ata: &Pubkey) -> u64 {
    let acc = svm.get_account(ata).unwrap();
    Account::unpack(&acc.data).unwrap().amount
}

fn setup() -> TestCtx {
    let program_id = lp::id();
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(env!("CARGO_TARGET_TMPDIR"), "/../deploy/lp.so"));
    svm.add_program(program_id, bytes).unwrap();
    let user = Keypair::new();
    svm.airdrop(&user.pubkey(), 1000000000).unwrap();
    let mint_a = create_mint(&mut svm, &user, 6);
    let mint_b = create_mint(&mut svm, &user, 6);
    let pool_state = Pubkey::find_program_address(
        &[POOL_STATE_SEED, mint_a.as_ref(), mint_b.as_ref()],
        &program_id,
    )
    .0;

    let lp_mint = Pubkey::find_program_address(&[LP_MINT_SEED, pool_state.as_ref()], &program_id).0;
    let user_lp_token_ata = get_associated_token_address(&user.pubkey(), &lp_mint);
    let vault_a = Pubkey::find_program_address(&[VAULT_A_SEED, pool_state.as_ref()], &program_id).0;
    let vault_b = Pubkey::find_program_address(&[VAULT_B_SEED, pool_state.as_ref()], &program_id).0;
    let instruction = Instruction::new_with_bytes(
        program_id,
        &lp::instruction::Initialize {}.data(),
        lp::accounts::Initialize {
            signer: user.pubkey(),
            mint_a,
            mint_b,
            lp_mint,
            pool_state,
            vault_a,
            vault_b,
            system_program: system_program::ID,
            token_program: token_program_id,
        }
        .to_account_metas(None),
    );
    let _ = send(&mut svm, instruction, &user, &[&user]).unwrap();

    TestCtx {
        svm,
        program_id,
        user,
        mint_a,
        mint_b,
        user_lp_token_ata,
        lp_mint,
        vault_a,
        vault_b,
        pool_state,
    }
}

#[test]
fn test_initialize() {
    let ctx = setup();

    assert_eq!(token_balance(&ctx.svm, &ctx.vault_a), 0);
    assert_eq!(token_balance(&ctx.svm, &ctx.vault_b), 0);

    let pool_acc = ctx.svm.get_account(&ctx.pool_state).unwrap();
    let mut data: &[u8] = &pool_acc.data;
    let pool_state = lp::state::PoolState::try_deserialize(&mut data).unwrap();
    assert_eq!(pool_state.reserve_a, 0);
    assert_eq!(pool_state.reserve_b, 0);
    assert_eq!(pool_state.lp_tokens_supply, 0);
}

#[test]
fn test_mint_to_ata() {
    let mut ctx = setup();

    let amount_a: u64 = 1000000;
    let amount_b: u64 = 1000000;

    let ata_a = create_ata(&mut ctx.svm, &ctx.user, &ctx.user.pubkey(), &ctx.mint_a);
    let ata_b = create_ata(&mut ctx.svm, &ctx.user, &ctx.user.pubkey(), &ctx.mint_b);

    mint_to(
        &mut ctx.svm,
        &ctx.user,
        &ctx.user.pubkey(),
        &ata_a,
        &ctx.mint_a,
        amount_a,
    );
    mint_to(
        &mut ctx.svm,
        &ctx.user,
        &ctx.user.pubkey(),
        &ata_b,
        &ctx.mint_b,
        amount_b,
    );

    assert_eq!(token_balance(&ctx.svm, &ata_a), 1000000);
    assert_eq!(token_balance(&ctx.svm, &ata_b), 1000000);
}

#[test]
fn test_add_liquidity() {
    let mut ctx = setup();

    let amount_a: u64 = 1000000;
    let amount_b: u64 = 1000000;
    let min_lp_tokens: u64 = 1;

    let ata_a = create_ata(&mut ctx.svm, &ctx.user, &ctx.user.pubkey(), &ctx.mint_a);
    let ata_b = create_ata(&mut ctx.svm, &ctx.user, &ctx.user.pubkey(), &ctx.mint_b);
    let lp_token_ata = get_associated_token_address(&ctx.user.pubkey(), &ctx.lp_mint);

    mint_to(
        &mut ctx.svm,
        &ctx.user,
        &ctx.user.pubkey(),
        &ata_a,
        &ctx.mint_a,
        amount_a,
    );
    mint_to(
        &mut ctx.svm,
        &ctx.user,
        &ctx.user.pubkey(),
        &ata_b,
        &ctx.mint_b,
        amount_a,
    );

    assert_eq!(token_balance(&ctx.svm, &ata_a), amount_a);
    assert_eq!(token_balance(&ctx.svm, &ata_b), amount_b);

    let instruction = Instruction::new_with_bytes(
        ctx.program_id,
        &lp::instruction::AddLiquidity {
            amount_a,
            amount_b,
            min_lp_tokens,
        }
        .data(),
        lp::accounts::AddLiquidity {
            signer: ctx.user.pubkey(),
            mint_a: ctx.mint_a,
            mint_b: ctx.mint_b,
            lp_mint: ctx.lp_mint,
            pool_state: ctx.pool_state,
            ata_a,
            ata_b,
            vault_a: ctx.vault_a,
            vault_b: ctx.vault_b,
            lp_token_account: ctx.user_lp_token_ata,
            system_program: system_program::ID,
            token_program: token_program_id,
            associated_token_program: associated_token_id,
        }
        .to_account_metas(None),
    );
    let _ = send(&mut ctx.svm, instruction, &ctx.user, &[&ctx.user]).unwrap();

    assert_eq!(token_balance(&ctx.svm, &ata_a), 0);
    assert_eq!(token_balance(&ctx.svm, &ata_b), 0);
    assert_eq!(token_balance(&ctx.svm, &ctx.vault_a), amount_a);
    assert_eq!(token_balance(&ctx.svm, &ctx.vault_b), amount_b);

    let pool_acc = ctx.svm.get_account(&ctx.pool_state).unwrap();
    let mut data: &[u8] = &pool_acc.data;
    let pool_state = lp::state::PoolState::try_deserialize(&mut data).unwrap();
    assert_eq!(pool_state.reserve_a, amount_a);
    assert_eq!(pool_state.reserve_b, amount_b);
    // assert_eq!(pool_state.lp_tokens_supply, 1000000);
    // assert_eq!(token_balance(&ctx.svm, &lp_token_ata), 999000);
}
