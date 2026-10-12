// Server-side only: the demo customer pays the shop. Imported by api/pay.ts and scripts/pay.ts.
// Never import this from browser code: it reads a private key from the environment.
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

export const SUI = '0x2::sui::SUI';

export function customerKeypair(secret = process.env.DEMO_CUSTOMER_KEY): Ed25519Keypair {
  if (!secret) throw new Error('DEMO_CUSTOMER_KEY is not set');
  return Ed25519Keypair.fromSecretKey(secret); // suiprivkey1... bech32 string
}

// 'coin': transfer a Coin<T> object to the shop. This is what most wallets send today.
// 'address-balance': balance::send_funds into the shop's address balance. Gotcha verified on
// testnet 2026-10-12: the LIVE subscription with affectedAddress does not deliver these to the
// receiver, but the backfill (resume with a cursor) does. See README "Gotchas".
export type PayMode = 'coin' | 'address-balance';

export async function payShop(opts: { shop: string; amount: bigint; coinType?: string; mode?: PayMode; client?: SuiGrpcClient }) {
  const client = opts.client ?? new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' });
  const signer = customerKeypair();
  const coinType = opts.coinType ?? SUI;

  // tx.coin() / tx.balance() draw from the customer's address balance or coin objects,
  // whichever it holds. The SDK resolves the withdrawal at build time.
  const tx = new Transaction();
  if (opts.mode === 'address-balance') {
    tx.moveCall({
      target: '0x2::balance::send_funds',
      typeArguments: [coinType],
      arguments: [tx.balance({ balance: opts.amount, type: coinType }), tx.pure.address(opts.shop)],
    });
  } else {
    tx.transferObjects([tx.coin({ balance: opts.amount, type: coinType })], opts.shop);
  }

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer,
    include: { effects: true, balanceChanges: true },
  });
  const t = result.Transaction ?? result.FailedTransaction;
  if (!t || result.FailedTransaction) throw new Error(`payment failed: ${JSON.stringify(t?.effects?.status)}`);
  await client.waitForTransaction({ digest: t.digest });
  return { digest: t.digest, from: signer.toSuiAddress(), balanceChanges: t.balanceChanges };
}
