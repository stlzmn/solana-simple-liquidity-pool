export function create_ata() {

}

export function create_mint() {

}

export function mint_to() {

}
// fn create_ata(svm: &mut LiteSVM, payer: &Keypair, owner: &Pubkey, mint: &Pubkey) -> Pubkey {
//     let ata = get_associated_token_address(owner, mint);
//     let ix = create_associated_token_account(&payer.pubkey(), owner, mint, &spl_token::ID);
//
//     let blockhash = svm.latest_blockhash();
//     let msg = Message::new_with_blockhash(&[ix], Some(&payer.pubkey()), &blockhash);
//     let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[payer]).unwrap();
//     svm.send_transaction(tx).unwrap();
//
//     ata
// }
//
// fn create_mint(svm: &mut LiteSVM, payer: &Keypair, decimals: u8) -> Pubkey {
//     let mint = Keypair::new();
//     let rent = svm.minimum_balance_for_rent_exemption(spl_token::state::Mint::LEN);
//
//     let create_ix = system_instruction::create_account(
//         &payer.pubkey(),
//         &mint.pubkey(),
//         rent,
//         spl_token::state::Mint::LEN as u64,
//         &spl_token::ID,
//     );
//     let init_ix = spl_token::instruction::initialize_mint2(
//         &spl_token::ID,
//         &mint.pubkey(),
//         &payer.pubkey(),
//         None,
//         decimals,
//     )
//     .unwrap();
//
//     let blockhash = svm.latest_blockhash();
//     let msg = Message::new_with_blockhash(&[create_ix, init_ix], Some(&payer.pubkey()), &blockhash);
//     let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[payer, &mint]).unwrap();
//     svm.send_transaction(tx).unwrap();
//
//     mint.pubkey()
// }
//
// fn mint_to(
//     svm: &mut LiteSVM,
//     signer: &Keypair,
//     owner: &Pubkey,
//     to: &Pubkey,
//     mint: &Pubkey,
//     amount: u64,
// ) {
//     let mint_ix = spl_token::instruction::mint_to(
//         &spl_token::ID,
//         mint,
//         to,
//         owner,
//         &[&signer.pubkey()],
//         amount,
//     )
//     .unwrap();
//     let blockhash = svm.latest_blockhash();
//     let msg = Message::new_with_blockhash(&[mint_ix], Some(&signer.pubkey()), &blockhash);
//     let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&signer]).unwrap();
//     svm.send_transaction(tx).unwrap();
// }
