// pnpm receipt <digest>: fetch an old receipt from GraphQL (archival) and show that the
// full node's gRPC API may no longer have it.
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { lookupReceipt } from '../src/lib/receipt.ts';

const digest = process.argv[2] ?? 'ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a'; // testnet, Oct 2025

const grpc = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' });
try {
  const r = await grpc.getTransaction({ digest, include: { balanceChanges: true } });
  console.log('gRPC full node: found', (r.Transaction ?? r.FailedTransaction)?.digest);
} catch (e) {
  console.log('gRPC full node:', (e as Error).message, '(pruned from the full node)');
}

const receipt = await lookupReceipt(digest);
if (!receipt) { console.log('GraphQL: not found'); process.exit(1); }
console.log('GraphQL (archival):', JSON.stringify(receipt, null, 2));
