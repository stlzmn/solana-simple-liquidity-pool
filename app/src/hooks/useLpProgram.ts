import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import idl from "../../../target/idl/lp.json";
import type { Lp } from "../../../target/types/lp";
import { AnchorProvider, Program } from "@coral-xyz/anchor";

export function useLpProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    return new Program<Lp>(idl as Lp, provider);
  }, [connection, wallet]);
}
