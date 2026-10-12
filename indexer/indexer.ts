// pnpm indexer: a lightweight indexer built on one GraphQL subscription.
// Each delivery is written to SQLite together with its cursor in ONE transaction, so a crash
// can never record a payment without its cursor or a cursor without its payment.
// On restart it resumes from the stored cursor: the service backfills, then goes live.
import { subscribe } from '../src/lib/sse.ts';
import { PAYMENTS_SUBSCRIPTION, SUBSCRIPTIONS_URL, paymentsFrom, normalize, type Delivery } from '../src/lib/till.ts';
import { openDb } from './db.ts';

const shop = normalize(process.env.SHOP_ADDRESS ?? process.env.VITE_SHOP_ADDRESS ?? '');
if (shop === normalize('')) throw new Error('set SHOP_ADDRESS');

const db = openDb();
const insert = db.prepare(`INSERT OR IGNORE INTO payments (digest, coin_type, amount, sender, checkpoint, ts, cursor)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`);
const saveCursor = db.prepare(`INSERT INTO watermark (shop, cursor, updated_at) VALUES (?, ?, ?)
                               ON CONFLICT(shop) DO UPDATE SET cursor = excluded.cursor, updated_at = excluded.updated_at`);
const loadCursor = db.prepare(`SELECT cursor FROM watermark WHERE shop = ?`);

function write(d: Delivery) {
  const payments = paymentsFrom(d, shop);
  db.exec('BEGIN');
  try {
    let fresh = 0;
    for (const p of payments) {
      const r = insert.run(p.digest, p.coinType, p.amount, p.sender, p.checkpoint, p.timestamp, p.cursor);
      fresh += Number(r.changes);
    }
    // Advance the watermark even for non-payment transactions (shop sending out), or a restart
    // would re-scan them forever.
    saveCursor.run(shop, d.transactions.cursor, new Date().toISOString());
    db.exec('COMMIT');
    for (const p of payments) {
      console.log(`${fresh ? 'stored ' : 'dup    '} ${p.digest} +${p.amount} ${p.coinType.split('::').pop()} cp ${p.checkpoint}`);
    }
    if (!payments.length) console.log(`skip    ${d.transactions.node.digest} (not an incoming payment)`);
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

let backoff = 1000;
while (true) {
  const row = loadCursor.get(shop) as { cursor: string } | undefined;
  const after = row?.cursor ?? null;
  // First run only: optionally backfill from a checkpoint (e.g. this morning's opening).
  const afterCheckpoint = after ? null : (process.env.FROM_CHECKPOINT ? Number(process.env.FROM_CHECKPOINT) : null);
  console.log(after ? `resume  after ${after}` : afterCheckpoint ? `start   backfill after checkpoint ${afterCheckpoint}` : 'start   live (no stored cursor)');
  try {
    await subscribe<Delivery>(SUBSCRIPTIONS_URL, PAYMENTS_SUBSCRIPTION, { shop, after, afterCheckpoint }, {
      onOpen: () => { backoff = 1000; console.log('open    streaming'); },
      onNext: write,
      onError: (e) => console.error('graphql error', JSON.stringify(e)),
    });
    console.log('closed  server ended the stream, reconnecting');
  } catch (e) {
    console.error('dropped', (e as Error).message);
  }
  await new Promise((r) => setTimeout(r, backoff));
  backoff = Math.min(backoff * 2, 30_000);
}
