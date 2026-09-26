import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { PublicKey } from "@solana/web3.js";
//@ts-ignore
import type { TokenBalance } from "../hooks/useBalances";

interface WalletPanelProps {
  publicKey: PublicKey | null,
  solBalance: number | null,
  balances: TokenBalance[],
}

function WalletPanel({ solBalance, balances }: WalletPanelProps) {
  return (
    <div className="wallet-card">
      <div className="wallet-card-top">
        <WalletMultiButton />
      </div>
      <div className="balances">
        <h3 className="balances-title">Dostępne minty</h3>
        {solBalance !== null && (
          <div className="balance-chip">
            <span className="label">SOL</span>
            <span className="value">{solBalance.toFixed(4)}</span>
          </div>
        )}
        {balances.map(({ mint, amount }) => (
          <div className="balance-chip" key={mint}>
            <span className="label">{mint}</span>
            <span className="value">{amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export default WalletPanel;
