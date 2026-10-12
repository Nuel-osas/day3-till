// AFTER (gRPC): same three reads with SuiGrpcClient. Default choice for app code.
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { normalizeStructTag } from '@mysten/sui/utils';
import { SHOP, DIGEST, EVENT_TYPE } from './config.ts';

const client = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' });

// suix_getBalance -> getBalance (now splits coin objects vs address balance)
const { balance } = await client.getBalance({ owner: SHOP });
console.log('getBalance     ', balance);

// sui_getTransactionBlock -> getTransaction (result is a Transaction | FailedTransaction union)
const tx = await client.getTransaction({ digest: DIGEST, include: { effects: true, balanceChanges: true } });
const t = tx.Transaction ?? tx.FailedTransaction;
console.log('getTransaction ', t?.digest, t?.effects?.status, t?.balanceChanges);

// suix_queryEvents -> listEvents. Gotcha: gRPC rejects the short form '0x3::...' with
// INVALID_ARGUMENT "invalid address". JSON-RPC and GraphQL accepted it. Normalize first.
const events = await client.listEvents({ filter: { eventType: normalizeStructTag(EVENT_TYPE) }, limit: 3 });
console.log('listEvents     ', events.events.length, 'events, endCursor', events.endCursor, 'hasNextPage', events.hasNextPage);
