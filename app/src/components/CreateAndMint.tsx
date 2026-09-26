import { BN, type Program } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import type { Minter } from "../../../target/types/minter";
import { Buffer } from "buffer";
import { MINTER_PROGRAM_ID } from "../constants";

interface CreateAndMintProps {
  program: Program<Minter> | null,
  publicKey: PublicKey | null,
  refresh: () => Promise<void>,
}

function CreateAndMint({ program, publicKey, refresh }: CreateAndMintProps) {
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState("");
  const [amount, setAmount] = useState("");

  async function handleCreateAndMint() {
    if (!program || !publicKey || !seed || !amount) return;
    setLoading(true);
    try {
      const [mint] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed)],
        MINTER_PROGRAM_ID,
      );

      const ata = getAssociatedTokenAddressSync(
        mint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
      );

      const sig = await program.methods
        .createAndMint(seed, new BN(amount))
        .accountsStrict({
          signer: publicKey,
          mint: mint,
          ata: ata,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .rpc();

      console.log("tx:", sig);
      await refresh();
    } catch (e) {
      console.error("initialize failed", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="minter-panel">
      {publicKey && (
        <>
          <h4 className="minter-panel-title">Stwórz testowy mint</h4>
          <input
            type="text"
            className="minter-input"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="seed"
          />
          <input
            type="number"
            className="minter-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="amount"
          />
          <button className="minter-button" onClick={handleCreateAndMint} disabled={loading}>
            {loading ? "Loading..." : "Mint"}
          </button>
        </>
      )}
    </div>
  );
}


export default CreateAndMint;
