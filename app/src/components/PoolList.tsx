import { PublicKey } from "@solana/web3.js";
import type { IdlTypes, Program } from "@coral-xyz/anchor";
import type { Lp } from "../../../target/types/lp";
import AddLiquidity from "../components/AddLiquidity";
import RemoveLiquidity from "./RemoveLiquidityButton";
import Swap from "./SwapButton";

type LiquidityPool = IdlTypes<Lp>["poolState"];

function shortAddress(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function formatAmount(value: string) {
  const [int, dec] = value.split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return dec ? `${withSep}.${dec}` : withSep;
}

interface PoolListProps {
  program: Program<Lp>,
  publicKey: PublicKey,
  pools: any[],
  refresh_bals: () => Promise<void>,
  refresh_pools: () => Promise<void>,
}

function PoolList({ pools, program, publicKey, refresh_bals, refresh_pools }: PoolListProps) {
  return (
    <div className="pool-list-wrap">
      <h3 className="pool-list-title">Available Liquidity Pools</h3>
      {pools.length === 0 && (
        <p className="empty-state">No pools yet. Create one above to get started.</p>
      )}
      <div className="pool-list">
        {pools.map(({ publicKey: poolAddress, account }: { publicKey: PublicKey, account: LiquidityPool }) => (
          <article className="pool-card" key={poolAddress.toString()}>
            <header className="pool-card-header">
              <span className="pool-pair">
                <AddLiquidity
                  program={program}
                  publicKey={publicKey}
                  mintA={account.mintA.toString()}
                  mintB={account.mintB.toString()}
                  refresh_bals={refresh_bals}
                  refresh_pools={refresh_pools}
                />
              </span>
              <span className="pool-pair">
                <RemoveLiquidity
                  program={program}
                  publicKey={publicKey}
                  mintA={account.mintA.toString()}
                  mintB={account.mintB.toString()}
                  refresh_bals={refresh_bals}
                  refresh_pools={refresh_pools}
                />
              </span>
              <span className="pool-pair">
                <Swap
                  program={program}
                  publicKey={publicKey}
                  mintA={account.mintA.toString()}
                  mintB={account.mintB.toString()}
                  refresh_bals={refresh_bals}
                  refresh_pools={refresh_pools}
                />
              </span>
              <span className="pool-address" title={poolAddress.toString()}>
                {shortAddress(poolAddress.toString())}
              </span>
            </header>

            <div className="pool-stats">
              <div className="pool-stat">
                <span className="pool-stat-label">Reserve A</span>
                <span className="pool-stat-value">{formatAmount(account.reserveA.toString())}</span>
              </div>
              <div className="pool-stat">
                <span className="pool-stat-label">Reserve B</span>
                <span className="pool-stat-value">{formatAmount(account.reserveB.toString())}</span>
              </div>
              <div className="pool-stat">
                <span className="pool-stat-label">LP Supply</span>
                <span className="pool-stat-value">{formatAmount(account.lpTokensSupply.toString())}</span>
              </div>
            </div>

            <div className="pool-mints">
              <span className="pool-mint" title={account.mintA.toString()}>A · {shortAddress(account.mintA.toString())}</span>
              <span className="pool-mint" title={account.mintB.toString()}>B · {shortAddress(account.mintB.toString())}</span>
              <span className="pool-mint" title={account.lpMint.toString()}>LP · {shortAddress(account.lpMint.toString())}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default PoolList;
