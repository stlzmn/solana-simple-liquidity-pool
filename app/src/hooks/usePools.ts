import { useCallback, useEffect, useState } from "react";
import type { Program } from "@coral-xyz/anchor";
import type { Lp } from "../../../target/types/lp";

export function usePools(program: Program<Lp> | null) {
  const [pools, setPools] = useState<any[]>([]);

  const refresh_pools = useCallback(async () => {
    if (!program) return;
    const all = await program.account.poolState.all();
    setPools(all);
  }, [program]);

  useEffect(() => { refresh_pools(); }, [refresh_pools]);
  return { pools, refresh_pools };
}
