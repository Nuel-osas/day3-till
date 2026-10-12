// pnpm totals [YYYY-MM-DD]: end of day totals per coin from the indexer's SQLite file.
import { openDb } from './db.ts';
import { coinMeta, formatAmount } from '../src/lib/till.ts';

const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const db = openDb();
const rows = db.prepare(`SELECT coin_type, amount, sender FROM payments WHERE substr(ts, 1, 10) = ?`).all(day) as
  { coin_type: string; amount: string; sender: string }[];

// Sum in BigInt in JS: SQLite SUM() would go through 64-bit signed ints/floats.
const byCoin = new Map<string, { total: bigint; count: number; customers: Set<string> }>();
for (const r of rows) {
  const t = byCoin.get(r.coin_type) ?? { total: 0n, count: 0, customers: new Set() };
  t.total += BigInt(r.amount); t.count++; t.customers.add(r.sender);
  byCoin.set(r.coin_type, t);
}
console.log(`Till totals for ${day} (UTC)`);
if (!byCoin.size) console.log('  no payments');
for (const [coinType, t] of byCoin) {
  const m = await coinMeta(coinType);
  console.log(`  ${formatAmount(t.total, m.decimals, m.decimals).padStart(14)} ${m.symbol.padEnd(6)} ${t.count} payments from ${t.customers.size} customers`);
}
for (const w of db.prepare('SELECT shop, cursor, updated_at FROM watermark').all() as { shop: string; cursor: string; updated_at: string }[]) {
  console.log(`watermark ${w.shop.slice(0, 10)}.. cursor ${w.cursor} at ${w.updated_at}`);
}
