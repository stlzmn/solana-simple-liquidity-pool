import { useState } from "react";
import type { Lp } from "../../../target/types/lp";
import { PublicKey } from "@solana/web3.js";
import { BN, type Program } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Buffer } from "buffer";
import { LP_PROGRAM_ID } from "../constants";

interface RemoveLiquidityProps {
  program: Program<Lp> | null,
  publicKey: PublicKey | null,
  mintA: string | null,
  mintB: string | null,
}

function RemoveLiquidity({ program, publicKey, mintA, mintB }: RemoveLiquidityProps) {
  const [loading, setLoading] = useState(false);
  const [minAmountA, setMinAmountA] = useState("");
  const [minAmountB, setMinAmountB] = useState("");
  const [lpTokens, setLpTokens] = useState("");

  async function handleRemoveLiquidity() {
    if (!program || !publicKey || !mintA || !mintB) return;
    setLoading(true);

    try {

      const mintAKey = new PublicKey(mintA);
      const mintBKey = new PublicKey(mintB);

      const [poolState] = PublicKey.findProgramAddressSync([Buffer.from("pool_state"), mintAKey.toBuffer(), mintBKey.toBuffer()], LP_PROGRAM_ID);
      const [vaultA] = PublicKey.findProgramAddressSync([Buffer.from("vault_a"), poolState.toBuffer()], LP_PROGRAM_ID);
      const [vaultB] = PublicKey.findProgramAddressSync([Buffer.from("vault_b"), poolState.toBuffer()], LP_PROGRAM_ID);
      const [lpMint] = PublicKey.findProgramAddressSync([Buffer.from("lp_mint"), poolState.toBuffer()], LP_PROGRAM_ID);

      const ataA = getAssociatedTokenAddressSync(
        mintAKey,
        publicKey,
        true,
        TOKEN_2022_PROGRAM_ID,
      );
      const ataB = getAssociatedTokenAddressSync(
        mintBKey,
        publicKey,
        true,
        TOKEN_2022_PROGRAM_ID,
      );
      const lpAta = getAssociatedTokenAddressSync(
        lpMint,
        publicKey,
        true,
        TOKEN_2022_PROGRAM_ID,
      );

      const sig = await program.methods
        .removeLiquidity(
          new BN(lpTokens),
          new BN(minAmountA),
          new BN(minAmountB),
        )
        .accountsStrict({
          signer: publicKey,
          vaultA: vaultA,
          vaultB: vaultB,
          mintA: mintAKey,
          mintB: mintBKey,
          lpMint: lpMint,
          ataA: ataA,
          ataB: ataB,
          lpTokenAccount: lpAta,
          poolState: poolState,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .rpc();

      console.log("tx:", sig);

      // await refresh_bals();
      // await refresh_ords();
    } catch (e: any) {
      console.error("Add Liquidity failed", e);
      console.error("logs:", e?.transactionLogs);
      console.error("programError:", e?.programError);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="form-row">
      <div className="field">
        <label>Lp tokens</label>
        <input
          className="input"
          type="number"
          value={lpTokens}
          onChange={(e) => setLpTokens(e.target.value)}
          placeholder="ile dajesz lp tokens"
        />
      </div>
      <div className="field">
        <label>Min Amount A</label>
        <input
          className="input"
          type="number"
          value={minAmountA}
          onChange={(e) => setMinAmountA(e.target.value)}
          placeholder="ile chcesz min A"
        />
      </div>
      <div className="field">
        <label>Min Amount B</label>
        <input
          className="input"
          type="number"
          value={minAmountB}
          onChange={(e) => setMinAmountB(e.target.value)}
          placeholder="ile chcesz min B"
        />
      </div>
      <div className="field" style={{ flex: "0 0 auto", justifyContent: "flex-end" }}>
        <label style={{ visibility: "hidden" }}>Dodaj</label>
        <button className="btn btn-primary" onClick={() => handleRemoveLiquidity()} disabled={loading || !publicKey}>
          {loading ? "Przetwarzanie..." : "Usun Plynnosc"}
        </button>
      </div>
    </div>
  )
}

export default RemoveLiquidity;
