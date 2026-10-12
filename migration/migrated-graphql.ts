// AFTER (GraphQL): the same reads, either through the shared client API or as one custom query
// that selects exactly the fields the screen needs. GraphQL also reaches archived history.
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { SHOP, DIGEST, EVENT_TYPE } from './config.ts';

const client = new SuiGraphQLClient({ url: 'https://graphql.testnet.sui.io/graphql', network: 'testnet' });

// 1. Shared API: identical call shapes to the gRPC client.
const { balance } = await client.getBalance({ owner: SHOP });
console.log('getBalance     ', balance);

// 2. One round trip for all three, with only the fields we use.
const res = await client.query({
  query: `query Migrated($shop: SuiAddress!, $digest: String!, $type: String!) {
    address(address: $shop) { balance(coinType: "0x2::sui::SUI") { totalBalance addressBalance coinBalance } }
    transaction(digest: $digest) {
      digest
      effects { status balanceChanges { nodes { owner { address } amount coinType { repr } } } }
    }
    events(last: 3, filter: { type: $type }) { nodes { timestamp contents { json } } }
  }`,
  variables: { shop: SHOP, digest: DIGEST, type: EVENT_TYPE },
});
if (res.errors?.length) throw new Error(res.errors[0].message);
console.log(JSON.stringify(res.data, null, 2).slice(0, 1200));
