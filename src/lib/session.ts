import { paymentsFrom, type Delivery, type Payment } from './till.ts';
export type Snapshot = { cursor: string | null; startCheckpoint: number | null; payments: Payment[] };
export const emptySnapshot = (): Snapshot => ({ cursor: null, startCheckpoint: null, payments: [] });
export const snapshotKey = (shop: string) => `till:v2:feed:${shop}`;
export function applyDelivery(previous: Snapshot, delivery: Delivery, shop: string, recoverBefore: number) {
  const seen = new Set(previous.payments.map(p =>
    `${p.digest}:${p.coinType}`));
  const added = paymentsFrom(delivery, shop)
    .filter(p => !seen.has(`${p.digest}:${p.coinType}`))
    .map(p => ({ ...p,
      recovered: Date.parse(p.timestamp) < recoverBefore }));
  return { snapshot: { ...previous, cursor: delivery.transactions.cursor, payments: [...added, ...previous.payments].slice(0, 500) }, added };
}
export function parseSui(value: string): bigint {
  if (!/^\d+(\.\d{1,9})?$/.test(value.trim())) throw new Error('Enter a positive SUI amount with up to 9 decimal places.');
  const [whole, fraction = ''] = value.trim().split('.');
  const amount = BigInt(whole) * 1_000_000_000n + BigInt(fraction.padEnd(9, '0'));
  if (amount <= 0n || amount > 100_000_000n) throw new Error('Use more than 0 and at most 0.1 test SUI per payment.');
  return amount;
}
