
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import idl from "../../../target/idl/minter.json";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Minter } from "../../../target/types/minter";

export function useMinterProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    return new Program<Minter>(idl as Minter, provider);
  }, [connection, wallet]);
}
