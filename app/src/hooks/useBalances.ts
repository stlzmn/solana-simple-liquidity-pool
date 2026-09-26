import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export interface TokenBalance {
  mint: string;
  amount: string;
}

export function useBalances() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);

  const refresh_bals = useCallback(async () => {
    if (!publicKey) return;

    const lamports = await connection.getBalance(publicKey);
    setSolBalance(lamports / 1e9);

    const my_atas = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_2022_PROGRAM_ID,
    });

    const tokenBalances: TokenBalance[] = my_atas.value.map(({ account }) => {
      const info = account.data.parsed.info;
      return {
        mint: info.mint as string,
        amount: info.tokenAmount.uiAmountString,
      };
    });

    setBalances(tokenBalances);
  }, [publicKey, connection]);

  useEffect(() => { refresh_bals(); }, [refresh_bals]);

  return { solBalance, balances, refresh_bals };
}
