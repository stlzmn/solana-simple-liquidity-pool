
import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN, type Program } from "@coral-xyz/anchor";
import { getMintPda, getUserAta } from "../lib/addresses";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import type { Lp } from "../../../target/types/lp";
import { Buffer } from "buffer";
import { LP_PROGRAM_ID } from "../constants";

interface InitializePoolProps {
  program: Program<Lp> | null,
  publicKey: PublicKey | null,
}

function InitializePool({ program, publicKey }: InitializePoolProps) {
  const [loading, setLoading] = useState(false);
  const [mintA, setMintA] = useState("");
  const [mintB, setMintB] = useState("");

  async function handleInitialize() {
    if (!program || !publicKey) return;
    if (mintA.length === 0 || mintB.length === 0) return;

    setLoading(true);

    const mintAKey = new PublicKey(mintA);
    const mintBKey = new PublicKey(mintB);

    const [poolState] = PublicKey.findProgramAddressSync([Buffer.from("pool_state"), mintAKey.toBuffer(), mintBKey.toBuffer()], LP_PROGRAM_ID);
    const [vaultA] = PublicKey.findProgramAddressSync([Buffer.from("vault_a"), poolState.toBuffer()], LP_PROGRAM_ID);
    const [vaultB] = PublicKey.findProgramAddressSync([Buffer.from("vault_b"), poolState.toBuffer()], LP_PROGRAM_ID);
    const [lpMint] = PublicKey.findProgramAddressSync([Buffer.from("lp_mint"), poolState.toBuffer()], LP_PROGRAM_ID);

    try {
      const sig = await program.methods
        .initialize()
        .accountsStrict({
          signer: publicKey,
          poolState: poolState,
          mintA: mintA,
          mintB: mintB,
          vaultA: vaultA,
          vaultB: vaultB,
          lpMint: lpMint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .rpc();
    } catch (e) {
      console.error("Failed to send initialize pool tx: ", e);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && !!publicKey && mintA.length > 0 && mintB.length > 0;

  return (
    <div className="init-pool">
      <h3 className="init-pool-title">Zainicjuj pulę płynności</h3>
      <div className="init-pool-fields">
        <div className="field">
          <label className="field-label">Pierwszy mint</label>
          <input
            className="input"
            type="text"
            value={mintA}
            onChange={(e) => setMintA(e.target.value)}
            placeholder="Adres mintu A"
          />
        </div>
        <div className="field">
          <label className="field-label">Drugi mint</label>
          <input
            className="input"
            type="text"
            value={mintB}
            onChange={(e) => setMintB(e.target.value)}
            placeholder="Adres mintu B"
          />
        </div>
      </div>
      <button className="btn btn-primary" onClick={handleInitialize} disabled={!canSubmit}>
        {loading ? "Przetwarzanie..." : "Stwórz pulę płynności"}
      </button>
    </div>
  )
}

export default InitializePool;
