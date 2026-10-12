// pnpm close [YYYY-MM-DD]: "Close the till" from the indexer's database instead of the browser.
// Posts today's rows to the deployed /api/close (DeepSeek runs server-side; no key here).
import { openDb } from './db.ts';
import { coinMeta, formatAmount } from '../src/lib/till.ts';

const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const url = process.env.TILL_URL ?? 'https://day3-till.vercel.app';
const rows = openDb().prepare('SELECT coin_type, amount, sender, ts FROM payments WHERE substr(ts, 1, 10) = ? ORDER BY ts').all(day) as
  { coin_type: string; amount: string; sender: string; ts: string }[];

const payments = [];
for (const r of rows) {
  const m = await coinMeta(r.coin_type);
  payments.push({ amount: formatAmount(r.amount, m.decimals, m.decimals), symbol: m.symbol, sender: r.sender, timestamp: r.ts });
}
const res = await fetch(`${url}/api/close`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ payments }) });
console.log((await res.json()).report);
