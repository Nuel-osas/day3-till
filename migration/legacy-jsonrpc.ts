// BEFORE: the kind of code most Sui apps shipped with. Three JSON-RPC calls.
// Run: pnpm migrate:legacy   (it fails now: the Foundation full nodes no longer serve JSON-RPC)
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { SHOP, DIGEST, EVENT_TYPE } from './config.ts';

const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' });

async function run(label: string, fn: () => Promise<unknown>) {
  try {
    console.log(label, JSON.stringify(await fn()).slice(0, 200));
  } catch (e) {
    console.log(label, 'FAILED:', (e as Error).message);
  }
}

await run('suix_getBalance        ', () => client.getBalance({ owner: SHOP }));
await run('sui_getTransactionBlock', () => client.getTransactionBlock({ digest: DIGEST, options: { showBalanceChanges: true } }));
await run('suix_queryEvents       ', () => client.queryEvents({ query: { MoveEventType: EVENT_TYPE }, limit: 3, order: 'descending' }));

// The same call without the SDK, to see the raw error body the node returns.
const raw = await fetch(getJsonRpcFullnodeUrl('testnet'), {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'suix_getBalance', params: [SHOP] }),
});
console.log('raw HTTP', raw.status, await raw.text());
