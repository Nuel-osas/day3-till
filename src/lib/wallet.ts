import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';
import { useMemo, useState } from 'react';
export const GRPC_URL = 'https://fullnode.testnet.sui.io:443';
export const client = new SuiGrpcClient({ network: 'testnet', baseUrl: GRPC_URL });
const memory = new Map<string, Ed25519Keypair>();
export function browserKey(name: string) {
  if (memory.has(name)) return memory.get(name)!;
  let secret: string | null = null;
  try { secret = localStorage.getItem(`till:v2:key:${name}`); } catch { /* Memory-only when storage is blocked. */ }
  const key = secret ? Ed25519Keypair.fromSecretKey(secret) : new Ed25519Keypair();
  try { localStorage.setItem(`till:v2:key:${name}`, key.getSecretKey()); } catch { /* Keep this tab open. */ }
  memory.set(name, key); return key;
}
export function usePayer() {
  const account = useCurrentAccount(); const kit = useDAppKit();
  const [demo, setDemo] = useState(true);
  const key = useMemo(() => browserKey('payer'), []);
  const address = demo ? key.toSuiAddress() : account?.address ?? null;
  async function execute(transaction: Transaction) {
    if (!address) throw new Error('Connect a testnet wallet first.');
    transaction.setSender(address);
    const result = demo ? await client.signAndExecuteTransaction({ transaction, signer: key })
      : await kit.signAndExecuteTransaction({ transaction, account: account! });
    if (result.$kind === 'FailedTransaction') throw new Error(result.FailedTransaction.status.error?.message ?? 'Payment failed');
    await client.waitForTransaction({ digest: result.Transaction.digest });
    return result.Transaction.digest;
  }
  return { address, demo, setDemo, execute };
}
export function paymentTransaction(shop: string, amount: bigint, mode: 'coin' | 'address-balance') {
  const tx = new Transaction();
  if (mode === 'coin') tx.transferObjects([tx.coin({ balance: amount, type: '0x2::sui::SUI' })], shop);
  else tx.moveCall({ target: '0x2::balance::send_funds', typeArguments: ['0x2::sui::SUI'],
    arguments: [tx.balance({ balance: amount, type: '0x2::sui::SUI' }), tx.pure.address(shop)] });
  return tx;
}
