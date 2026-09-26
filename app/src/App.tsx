import { useWallet } from "@solana/wallet-adapter-react";
import WalletPanel from "./components/WalletPanel";
import { useBalances } from "./hooks/useBalances";
import { useLpProgram } from "./hooks/useLpProgram";
import { useMinterProgram } from "./hooks/useMinterProgram";
import CreateAndMint from "./components/CreateAndMint";
import InitializePool from "./components/InitializePool";
import { usePools } from "./hooks/usePools";
import PoolList from "./components/PoolList";

function App() {
  const lpProgram = useLpProgram();
  const minterProgram = useMinterProgram();
  const { publicKey } = useWallet();
  const { solBalance, balances, refresh_bals } = useBalances();
  const { pools, refresh_ords } = usePools(lpProgram);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-text">
          <h1 className="app-title">Liquidity Pool</h1>
          <span className="app-subtitle">Liquidity Pool - Swap and Provide Liquidity</span>
        </div>
        <div className="app-header-actions">
          <CreateAndMint program={minterProgram} publicKey={publicKey} refresh={refresh_bals} />
        </div>
      </header>

      <section className="card">
        <WalletPanel
          publicKey={publicKey}
          solBalance={solBalance}
          balances={balances}
        />
      </section>

      <section className="card">
        <InitializePool
          program={lpProgram!}
          publicKey={publicKey!}
        />
      </section>
      <section className="card">
        <PoolList
          program={lpProgram!}
          publicKey={publicKey!}
          pools={pools}
        />
      </section>
    </div>
  );
}


export default App
