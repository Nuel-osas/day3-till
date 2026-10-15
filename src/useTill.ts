import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from './lib/sse.ts';
import { GRAPHQL_URL, PAYMENTS_SUBSCRIPTION, SUBSCRIPTIONS_URL, normalize, type Delivery, type Payment } from './lib/till.ts';
import { applyDelivery, emptySnapshot, snapshotKey, type Snapshot } from './lib/session.ts';
export type Status = 'idle' | 'connecting' | 'live' | 'offline' | 'retrying';
function load(shop: string): Snapshot {
  try { const raw = JSON.parse(localStorage.getItem(snapshotKey(shop)) ?? 'null');
    if (raw && (raw.startCheckpoint === null || Number.isSafeInteger(raw.startCheckpoint)) && Array.isArray(raw.payments) && (raw.cursor === null || typeof raw.cursor === 'string')) return raw;
  } catch { /* Start fresh if browser storage is unavailable or corrupt. */ }
  return emptySnapshot();
}
export function useTill(shopRaw: string, onPayment: (p: Payment) => void) {
  const shop = normalize(shopRaw);
  const [snapshot, setSnapshot] = useState(() => load(shop));
  const snapshotRef = useRef(snapshot);
  const [status, setStatus] = useState<Status>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [storageWarning, setStorageWarning] = useState('');
  const abort = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const callback = useRef(onPayment); callback.current = onPayment;
  const note = useCallback((m: string) => setLog(l => [`${new Date().toLocaleTimeString()} ${m}`, ...l].slice(0, 30)), []);
  const stop = useCallback(() => { generation.current++; abort.current?.abort(); if (timer.current) clearTimeout(timer.current); }, []);
  const persist = useCallback((next: Snapshot) => {
    // One atomic browser write: never advance the cursor without its payments.
    try { localStorage.setItem(snapshotKey(shop), JSON.stringify(next)); }
    catch { setStorageWarning('Browser storage is unavailable. Keep this tab open to retain the cursor.'); }
    snapshotRef.current = next; setSnapshot(next);
  }, [shop]);
  const start = useCallback(() => {
    stop(); const token = generation.current; const recoverBefore = Date.now();
    let attempts = 0;
    const run = async () => {
      const ac = new AbortController(); abort.current = ac;
      const active = () => token === generation.current && !ac.signal.aborted;
      setStatus(attempts ? 'retrying' : 'connecting');
      try {
        // A first-run checkpoint also recovers a payment missed before any cursor exists.
        if (snapshotRef.current.startCheckpoint === null && !snapshotRef.current.cursor) {
          const r = await fetch(GRAPHQL_URL, { method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ query: '{ checkpoint { sequenceNumber } }' }), signal: ac.signal });
          const json = await r.json(); const n = Number(json.data?.checkpoint?.sequenceNumber);
          if (!r.ok || !Number.isSafeInteger(n)) throw new Error(json.errors?.[0]?.message ?? 'Cannot read opening checkpoint');
          if (!active()) return;
          persist({ ...snapshotRef.current, startCheckpoint: n });
        }
        if (!active()) return;
        const { cursor: after, startCheckpoint } = snapshotRef.current;
        note(after ? 'Resuming after saved cursor' : `Starting after checkpoint ${startCheckpoint}`);
        await subscribe<Delivery>(SUBSCRIPTIONS_URL, PAYMENTS_SUBSCRIPTION,
          { shop, after, afterCheckpoint: after ? undefined : startCheckpoint }, {
          onOpen: () => { if (active()) { setStatus('live'); attempts = 0; note('Stream connected'); } },
          onNext: d => {
            if (!active()) return;
            const { snapshot: next, added } = applyDelivery(snapshotRef.current, d, shop, recoverBefore);
            persist(next);
            added.forEach(p => callback.current(p));
          },
        }, ac.signal);
        if (!active()) return;
        throw new Error('Server closed the stream');
      } catch (e) {
        if (!active()) return;
        const delay = Math.min(30_000, 1500 * 2 ** attempts++);
        note(`${(e as Error).message}. Retry in ${delay / 1000}s`); setStatus('retrying');
        timer.current = setTimeout(() => { if (token === generation.current) void run(); }, delay);
      }
    };
    void run();
  }, [shop, stop, persist, note]);
  const kill = useCallback(() => { stop(); setStatus('offline'); note('Listener paused. Chain and payments keep running.'); }, [stop, note]);
  const reset = useCallback(() => { stop(); persist(emptySnapshot()); setStatus('idle'); note('New tracking session. Existing funds are unchanged.'); }, [stop, persist, note]);
  useEffect(() => { const next = load(shop); snapshotRef.current = next; setSnapshot(next); setStatus('idle'); setLog([]); return stop; }, [shop, stop]);
  return { shop, status, ...snapshot, log, storageWarning, start, kill, reset };
}
