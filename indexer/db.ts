import { DatabaseSync } from 'node:sqlite'; // built into Node 22.5+, no native build step

export function openDb(path = process.env.TILL_DB ?? 'till.db') {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS payments (
      digest     TEXT NOT NULL,
      coin_type  TEXT NOT NULL,
      amount     TEXT NOT NULL,      -- base units as text: u64 does not fit in a JS number
      sender     TEXT NOT NULL,
      checkpoint INTEGER NOT NULL,
      ts         TEXT NOT NULL,
      cursor     TEXT NOT NULL,
      PRIMARY KEY (digest, coin_type) -- the idempotency key: a replayed delivery is a no-op
    );
    CREATE TABLE IF NOT EXISTS watermark (
      shop   TEXT PRIMARY KEY,
      cursor TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}
