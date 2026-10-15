import { createDAppKit, DAppKitProvider } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { GRPC_URL } from './lib/wallet.ts';
import './styles.css';
const dAppKit = createDAppKit({ networks: ['testnet'], createClient: network => new SuiGrpcClient({ network, baseUrl: GRPC_URL }) });
declare module '@mysten/dapp-kit-react' { interface Register { dAppKit: typeof dAppKit } }
createRoot(document.getElementById('root')!).render(<StrictMode><DAppKitProvider dAppKit={dAppKit}><App /></DAppKitProvider></StrictMode>);
