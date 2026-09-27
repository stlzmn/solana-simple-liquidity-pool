import { useState } from "react";
import type { Lp } from "../../../target/types/lp";
import { PublicKey } from "@solana/web3.js";
import { BN, type Program } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Buffer } from "buffer";
import { LP_PROGRAM_ID } from "../constants";

interface SwapProps {
  program: Program<Lp> | null,
  publicKey: PublicKey | null,
  mintA: string | null,
  mintB: string | null,
  refresh_bals: () => Promise<void>,
  refresh_pools: () => Promise<void>,
}

function Swap({ program, publicKey, mintA, mintB, refresh_bals, refresh_pools }: SwapProps) {
  const [loading, setLoading] = useState(false);
  const [amountIn, setAmountIn] = useState("");
  const [minAmountOut, setMinAmountOut] = useState("");
  const [aToB, setAtoB] = useState<boolean>(false);

  async function handleSwap() {
    if (!program || !publicKey || !mintA || !mintB) return;
    setLoading(true);

    try {

      const mintAKey = new PublicKey(mintA);
      const mintBKey = new PublicKey(mintB);

      const [poolState] = PublicKey.findProgramAddressSync([Buffer.from("pool_state"), mintAKey.toBuffer(), mintBKey.toBuffer()], LP_PROGRAM_ID);
      const [vaultA] = PublicKey.findProgramAddressSync([Buffer.from("vault_a"), poolState.toBuffer()], LP_PROGRAM_ID);
      const [vaultB] = PublicKey.findProgramAddressSync([Buffer.from("vault_b"), poolState.toBuffer()], LP_PROGRAM_ID);

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

      const sig = await program.methods
        .swap(
          new BN(amountIn),
          new BN(minAmountOut),
          aToB
        )
        .accountsStrict({
          signer: publicKey,
          vaultA: vaultA,
          vaultB: vaultB,
          mintA: mintAKey,
          mintB: mintBKey,
          ataA: ataA,
          ataB: ataB,
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
        <label>Amount In</label>
        <input
          className="input"
          type="number"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          placeholder="ile dajesz A"
        />
      </div>
      <div className="field">
        <label>Min Amount Out</label>
        <input
          className="input"
          type="number"
          value={minAmountOut}
          onChange={(e) => setMinAmountOut(e.target.value)}
          placeholder="ile dajesz B"
        />
      </div>
      <div className="field">
        <label>A to B</label>
        <input
          className="input"
          type="checkbox"
          checked={aToB}
          onChange={(e) => setAtoB(e.target.checked)}
        />
      </div>
      <div className="field" style={{ flex: "0 0 auto", justifyContent: "flex-end" }}>
        <label style={{ visibility: "hidden" }}>Swap</label>
        <button className="btn btn-primary" onClick={() => handleSwap()} disabled={loading || !publicKey}>
          {loading ? "Przetwarzanie..." : "Swap"}
        </button>
      </div>
    </div>
  )
}

export default Swap;
