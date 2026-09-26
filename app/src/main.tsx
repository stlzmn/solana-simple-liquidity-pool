import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.tsx'
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const endpoint = "http://localhost:8899";
const wallets: any[] = [];

createRoot(document.getElementById('root')!).render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <StrictMode>
          <App />
        </StrictMode>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)
