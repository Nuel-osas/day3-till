// Shared Till logic: the subscription document, how a delivery becomes a payment,
// and money formatting. Used by the browser screen and by the Node indexer.

export const NETWORK = 'testnet';
export const GRAPHQL_URL = `https://graphql.${NETWORK}.sui.io/graphql`;
export const SUBSCRIPTIONS_URL = `https://graphql.${NETWORK}.sui.io/graphql/subscriptions`;
export const SUI_TYPE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';

// Select only what the screen needs. Every edge carries a cursor for resumption.
export const PAYMENTS_SUBSCRIPTION = /* GraphQL */ `
subscription Till($shop: SuiAddress!, $after: String, $afterCheckpoint: UInt53) {
  transactions(
    filter: { affectedAddress: $shop, afterCheckpoint: $afterCheckpoint }, after: $after
  ) {
    cursor
    node {
      digest sender { address }
      effects {
        status timestamp checkpoint { sequenceNumber }
        balanceChanges(first: 50) { nodes { owner { address } coinType { repr } amount } }
      }
    }
  }
}`;

export type BalanceChange = { owner: { address: string } | null; coinType: { repr: string }; amount: string };
export type TxNode = {
  digest: string;
  sender: { address: string } | null;
  effects: {
    status: string;
    timestamp: string;
    checkpoint: { sequenceNumber: number };
    balanceChanges: { nodes: BalanceChange[] };
  };
};
export type Delivery = { transactions: { cursor: string; node: TxNode } };

export type Payment = {
  digest: string;
  cursor: string;
  coinType: string;
  amount: string; // base units, positive
  sender: string;
  checkpoint: number;
  timestamp: string;
  recovered?: boolean;
};

export function normalize(addr: string): string {
  return '0x' + addr.replace(/^0x/, '').toLowerCase().padStart(64, '0');
}

// A transaction that touches the shop is a payment only if the shop's balance went UP.
// The shop sending money out (a refund, a sweep) also matches affectedAddress, so filter here.
export function paymentsFrom(delivery: Delivery, shop: string): Payment[] {
  const { cursor, node } = delivery.transactions;
  if (node.effects.status !== 'SUCCESS') return [];
  const me = normalize(shop);
  const net = new Map<string, bigint>();
  for (const c of node.effects.balanceChanges.nodes) {
    if (c.owner && normalize(c.owner.address) === me) {
      const [address, ...rest] = c.coinType.repr.split('::');
      const type = [normalize(address), ...rest].join('::');
      net.set(type, (net.get(type) ?? 0n) + BigInt(c.amount));
    }
  }
  return [...net].filter(([, amount]) => amount > 0n).map(([coinType, amount]) => ({
    digest: node.digest, cursor, coinType, amount: String(amount),
    sender: node.sender?.address ?? 'system',
    checkpoint: Number(node.effects.checkpoint.sequenceNumber), timestamp: node.effects.timestamp,
  }));
}

export type CoinMeta = { decimals: number; symbol: string };
const metaCache = new Map<string, CoinMeta>([[SUI_TYPE, { decimals: 9, symbol: 'SUI' }]]);

export async function coinMeta(coinType: string): Promise<CoinMeta> {
  const hit = metaCache.get(coinType);
  if (hit) return hit;
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: 'query($t: String!) { coinMetadata(coinType: $t) { decimals symbol } }',
      variables: { t: coinType },
    }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) throw new Error('Coin metadata unavailable');
  const m = json.data?.coinMetadata;
  const meta = m ? { decimals: m.decimals, symbol: m.symbol } : { decimals: 0, symbol: coinType.split('::').pop() ?? '?' };
  metaCache.set(coinType, meta);
  return meta;
}

export function formatAmount(amount: string | bigint, decimals: number, max = 4): string {
  const v = BigInt(amount);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  let frac = (abs % base).toString().padStart(decimals, '0').slice(0, max).replace(/0+$/, '');
  return (neg ? '-' : '') + whole.toString() + (frac ? '.' + frac : '');
}

export function short(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}..${addr.slice(-4)}` : addr;
}
