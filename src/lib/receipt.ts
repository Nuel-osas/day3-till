// Look up any receipt by digest through GraphQL. GraphQL RPC is backed by the archival store,
// so it answers for transactions that full nodes (and therefore gRPC) have already pruned.
import { GRAPHQL_URL } from './till.ts';

export const RECEIPT_QUERY = /* GraphQL */ `
query Receipt($digest: String!) {
  transaction(digest: $digest) {
    digest
    sender { address }
    effects {
      status
      timestamp
      checkpoint { sequenceNumber }
      gasEffects { gasSummary { computationCost storageCost storageRebate } }
      balanceChanges(first: 50) {
        nodes { owner { address } coinType { repr } amount }
      }
    }
  }
}`;

export type Receipt = {
  digest: string;
  sender: { address: string } | null;
  effects: {
    status: string;
    timestamp: string;
    checkpoint: { sequenceNumber: number };
    gasEffects: { gasSummary: { computationCost: string; storageCost: string; storageRebate: string } } | null;
    balanceChanges: { nodes: { owner: { address: string } | null; coinType: { repr: string }; amount: string }[] };
  };
};

export async function lookupReceipt(digest: string, url = GRAPHQL_URL): Promise<Receipt | null> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: RECEIPT_QUERY, variables: { digest } }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data.transaction;
}
