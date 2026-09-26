//
// import { useState } from "react";
// import type { Lp } from "../../../target/types/lp";
// import { type PublicKey } from "@solana/web3.js";
// import { BN, type Program } from "@coral-xyz/anchor";
// import { getMintPda, getUserAta } from "../lib/addresses";
// import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
// import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
//
// interface AddLiquidityProps {
//   program: Program<Lp> | null,
//   publicKey: PublicKey | null,
//   refresh_bals: () => Promise<void>,
//   refresh_ords: () => Promise<void>,
// }
//
// function AddLiquidity({ program, publicKey, refresh_bals, refresh_ords }: AddLiquidityProps) {
//   const [kindGiven, setKindGiven] = useState<"A" | "B">("A");
//   const [amount, setAmount] = useState("");
//   const [price, setPrice] = useState("");
//   const [loading, setLoading] = useState(false);
//
//   async function handleAddLiquidity(kindGiven: "A" | "B", amount: number, price: number) {
//     if (!program || !publicKey) return;
//     setLoading(true);
//
//     const kindRequired = kindGiven === "A" ? "B" : "A";
//     try {
//       const [mintGiven] = getMintPda(kindGiven);
//       const [mintRequired] = getMintPda(kindRequired);
//       const [orderbookPda] = getOrderbookPda();
//
//       const orderbook = await program.account.orderBook.fetch(orderbookPda);
//       const orderId = orderbook.id.toNumber();
//
//       const [orderPda] = getOrderPda(orderId);
//       const [vaultPda] = getVaultPda(orderId, kindGiven);
//       const tokenAccountMaker = getUserAta(publicKey, kindGiven);
//
//       const sig = await program.methods
//         .addLiquidity(
//           kindGiven === "A" ? { a: {} } : { b: {} },
//           kindRequired === "A" ? { a: {} } : { b: {} },
//           new BN(amount),
//           new BN(price),
//         )
//         .accountsStrict({
//           signer: publicKey,
//           mintGiven: mintGiven,
//           mintRequired: mintRequired,
//           orderbook: orderbookPda,
//           makerAccount: tokenAccountMaker,
//           vault: vaultPda,
//           order: orderPda,
//           tokenProgram: TOKEN_2022_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SYSTEM_PROGRAM_ID,
//         })
//         .rpc();
//
//       console.log("tx:", sig);
//
//       await refresh_bals();
//       await refresh_ords();
//     } catch (e: any) {
//       console.error("Make order failed:", e);
//       console.error("logs:", e?.transactionLogs);
//       console.error("programError:", e?.programError);
//     } finally {
//       setLoading(false);
//     }
//     const [orderbookPda] = getOrderbookPda();
//     const orderbook = await program.account.orderBook.fetch(orderbookPda);
//     console.log(orderbook.id.toNumber());
//   }
//   return (
//     <div className="form-row">
//       <div className="field">
//         <label>Kierunek</label>
//         <select className="select" value={kindGiven} onChange={(e) => setKindGiven(e.target.value as "A" | "B")}>
//           <option value="A">Daje A, chce B</option>
//           <option value="B">Daje B, chce A</option>
//         </select>
//       </div>
//       <div className="field">
//         <label>Ile dajesz</label>
//         <input
//           className="input"
//           type="number"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           placeholder="ile dajesz?"
//         />
//       </div>
//       <div className="field">
//         <label>Ile chcesz</label>
//         <input
//           className="input"
//           type="number"
//           value={price}
//           onChange={(e) => setPrice(e.target.value)}
//           placeholder="ile chcesz?"
//         />
//       </div>
//       <div className="field" style={{ flex: "0 0 auto", justifyContent: "flex-end" }}>
//         <label style={{ visibility: "hidden" }}>Złóż</label>
//         <button className="btn btn-primary" onClick={() => handleMake(kindGiven, Number(amount), Number(price))} disabled={loading || !publicKey}>
//           {loading ? "Przetwarzanie..." : "Zloz zamowienie"}
//         </button>
//       </div>
//     </div>
//   )
// }
//
// export default MakeOrder;
