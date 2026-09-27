import { useState } from "react";
import type { Lp } from "../../../target/types/lp";
import { PublicKey } from "@solana/web3.js";
import { BN, type Program } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Buffer } from "buffer";
import { LP_PROGRAM_ID } from "../constants";

interface AddLiquidityProps {
  program: Program<Lp> | null,
  publicKey: PublicKey | null,
  mintA: string | null,
  mintB: string | null,
  refresh_bals: () => Promise<void>,
  refresh_pools: () => Promise<void>,
}

function AddLiquidity({ program, publicKey, mintA, mintB, refresh_bals, refresh_pools }: AddLiquidityProps) {
  const [loading, setLoading] = useState(false);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [minLpTokens, setMinLpTokens] = useState("");

  async function handleAddLiquidity() {
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
        .addLiquidity(
          new BN(amountA),
          new BN(amountB),
          new BN(minLpTokens),
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

      await refresh_bals();
      await refresh_pools();
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
        <label>Amount A</label>
        <input
          className="input"
          type="number"
          value={amountA}
          onChange={(e) => setAmountA(e.target.value)}
          placeholder="ile dajesz A"
        />
      </div>
      <div className="field">
        <label>Amount B</label>
        <input
          className="input"
          type="number"
          value={amountB}
          onChange={(e) => setAmountB(e.target.value)}
          placeholder="ile dajesz B"
        />
      </div>
      <div className="field">
        <label>Min Lp tokens received</label>
        <input
          className="input"
          type="number"
          value={minLpTokens}
          onChange={(e) => setMinLpTokens(e.target.value)}
          placeholder="ile chcesz min lp tokens"
        />
      </div>
      <div className="field" style={{ flex: "0 0 auto", justifyContent: "flex-end" }}>
        <label style={{ visibility: "hidden" }}>Dodaj</label>
        <button className="btn btn-primary" onClick={() => handleAddLiquidity()} disabled={loading || !publicKey}>
          {loading ? "Przetwarzanie..." : "Dodaj Plynnosc"}
        </button>
      </div>
    </div>
  )
}

export default AddLiquidity;
