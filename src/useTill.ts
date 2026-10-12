import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from './lib/sse.ts';
import { PAYMENTS_SUBSCRIPTION, SUBSCRIPTIONS_URL, paymentsFrom, normalize, type Delivery, type Payment } from './lib/till.ts';

export type Status = 'idle' | 'connecting' | 'live' | 'offline' | 'retrying';

// localStorage keys are per shop, so pointing the Till at another address starts clean.
const cursorKey = (shop: string) => `till.cursor.${shop}`;
const listKey = (shop: string) => `till.payments.${shop}`;

function load<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function save(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: run without persistence */ }
}

export function useTill(shopRaw: string, onPayment: (p: Payment) => void) {
  const shop = normalize(shopRaw);
  const [status, setStatus] = useState<Status>('idle');
  const [payments, setPayments] = useState<Payment[]>(() => load(listKey(shop), []));
  const [cursor, setCursor] = useState<string | null>(() => load(cursorKey(shop), null));
  const [killed, setKilled] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const killedRef = useRef(false);
  const cursorRef = useRef(cursor);
  const seen = useRef(new Set(payments.map((p) => `${p.digest}:${p.coinType}`)));
  const onPaymentRef = useRef(onPayment);
  onPaymentRef.current = onPayment;

  const note = useCallback((m: string) => setLog((l) => [`${new Date().toLocaleTimeString()} ${m}`, ...l].slice(0, 30)), []);

  const connect = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const after = cursorRef.current;
    // Anything older than the moment we reconnected came from backfill: flag it "recovered".
    const resumedAt = Date.now() - 1500;
    setStatus('connecting');
    note(after ? `resume after ${after}` : 'subscribe live (no cursor yet)');
    try {
      await subscribe<Delivery>(SUBSCRIPTIONS_URL, PAYMENTS_SUBSCRIPTION, { shop, after }, {
        onOpen: () => { setStatus('live'); note('stream open'); },
        onError: (e) => note(`graphql error ${JSON.stringify(e).slice(0, 120)}`),
        onNext: (d) => {
          // Persist the cursor for EVERY delivery, payments or not, so resume never re-scans.
          cursorRef.current = d.transactions.cursor;
          setCursor(d.transactions.cursor);
          save(cursorKey(shop), d.transactions.cursor);
          for (const p of paymentsFrom(d, shop)) {
            const id = `${p.digest}:${p.coinType}`;
            if (seen.current.has(id)) continue; // idempotent on digest + coin
            seen.current.add(id);
            const fresh = { ...p, recovered: after !== null && Date.parse(p.timestamp) < resumedAt };
            setPayments((ps) => { const next = [fresh, ...ps].slice(0, 500); save(listKey(shop), next); return next; });
            onPaymentRef.current(fresh);
          }
        },
      }, ac.signal);
      if (!ac.signal.aborted) { setStatus('retrying'); note('server closed stream, reconnecting'); setTimeout(() => !killedRef.current && connect(), 1000); }
    } catch (e) {
      if (ac.signal.aborted) return;
      setStatus('retrying');
      note(`dropped: ${(e as Error).message}, retry in 3s`);
      setTimeout(() => !killedRef.current && connect(), 3000);
    }
  }, [shop, note]);

  const start = useCallback(() => { killedRef.current = false; setKilled(false); connect(); }, [connect]);

  // "Kill network": abort the stream only. The chain keeps going; we just stop listening.
  const kill = useCallback(() => {
    killedRef.current = true;
    setKilled(true);
    abortRef.current?.abort();
    setStatus('offline');
    note('network killed: stream aborted, cursor kept');
  }, [note]);

  const reset = useCallback(() => {
    killedRef.current = true;
    abortRef.current?.abort();
    try { localStorage.removeItem(cursorKey(shop)); localStorage.removeItem(listKey(shop)); } catch { /* ignore */ }
    seen.current.clear(); cursorRef.current = null;
    setCursor(null); setPayments([]); setStatus('idle'); note('reset: cursor and list cleared');
  }, [shop, note]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { shop, status, payments, cursor, killed, log, start, kill, reset };
}
