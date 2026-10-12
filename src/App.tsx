import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTill } from './useTill.ts';
import { chime, unlockAudio } from './chime.ts';
import { coinMeta, formatAmount, short, SUI_TYPE, normalize, type CoinMeta, type Payment } from './lib/till.ts';
import { lookupReceipt, type Receipt } from './lib/receipt.ts';

const DEFAULT_SHOP = import.meta.env.VITE_SHOP_ADDRESS as string;
const USDC = '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC';
const OLD_RECEIPT = 'ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a';
const explorer = (d: string) => `https://suiscan.xyz/testnet/tx/${d}`;

function shopFromUrl() {
  const q = new URLSearchParams(location.search).get('shop');
  return q && /^0x[0-9a-fA-F]{1,64}$/.test(q) ? q : DEFAULT_SHOP;
}

function useMeta(types: string[]) {
  const [meta, setMeta] = useState<Record<string, CoinMeta>>({ [SUI_TYPE]: { decimals: 9, symbol: 'SUI' } });
  useEffect(() => {
    types.filter((t) => !meta[t]).forEach((t) => coinMeta(t).then((m) => setMeta((x) => ({ ...x, [t]: m }))));
  }, [types.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return meta;
}

export function App() {
  const path = location.pathname;
  const shop = shopFromUrl();
  return (
    <div className="shell">
      <nav className="nav">
        <a href={`/${location.search}`} className={path === '/' ? 'on' : ''}>Till</a>
        <a href={`/pay${location.search}`} className={path === '/pay' ? 'on' : ''}>Pay</a>
        <a href={`/receipt${location.search}`} className={path === '/receipt' ? 'on' : ''}>Receipt</a>
        <span className="net">testnet</span>
      </nav>
      {path === '/pay' ? <Pay shop={shop} /> : path === '/receipt' ? <ReceiptPage /> : <Till shop={shop} />}
    </div>
  );
}

function Till({ shop }: { shop: string }) {
  const [flash, setFlash] = useState<string | null>(null);
  const till = useTill(shop, (p) => {
    chime();
    setFlash(`${p.digest}:${p.coinType}`);
    setTimeout(() => setFlash(null), 2500);
  });
  const meta = useMeta([...new Set(till.payments.map((p) => p.coinType))]);
  const today = new Date().toISOString().slice(0, 10);
  const totals = useMemo(() => {
    const m = new Map<string, bigint>();
    for (const p of till.payments) if (p.timestamp.startsWith(today)) m.set(p.coinType, (m.get(p.coinType) ?? 0n) + BigInt(p.amount));
    return [...m.entries()];
  }, [till.payments, today]);
  const [report, setReport] = useState<string>('');
  const [closing, setClosing] = useState(false);

  const fmt = (p: Payment) => {
    const m = meta[p.coinType] ?? { decimals: 0, symbol: '...' };
    return `+${formatAmount(p.amount, m.decimals)} ${m.symbol}`;
  };

  async function closeTill() {
    setClosing(true);
    setReport('');
    const payments = till.payments.filter((p) => p.timestamp.startsWith(today)).map((p) => {
      const m = meta[p.coinType] ?? { decimals: 0, symbol: '?' };
      return { amount: formatAmount(p.amount, m.decimals, m.decimals), symbol: m.symbol, sender: p.sender, timestamp: p.timestamp, recovered: p.recovered };
    });
    const r = await fetch('/api/close', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ payments }) });
    const j = await r.json();
    setReport(j.report ?? j.error);
    setClosing(false);
  }

  const started = till.status !== 'idle';
  return (
    <main className="till">
      <header className="till-head">
        <div>
          <h1>Till</h1>
          <div className="mono dim">shop {short(normalize(shop))}</div>
        </div>
        <div className={`pill ${till.status}`}>{till.status}</div>
      </header>

      {!started ? (
        <button className="primary big" onClick={() => { unlockAudio(); till.start(); }}>
          Open till {till.cursor ? '(resume from saved cursor)' : ''}
        </button>
      ) : (
        <div className="controls">
          <label className="switch">
            <input type="checkbox" checked={till.killed} onChange={(e) => (e.target.checked ? till.kill() : till.start())} />
            <span>Kill network</span>
          </label>
          <button className="ghost" onClick={till.reset}>Reset cursor</button>
          <a className="ghost" href={`/pay${location.search}`} target="_blank">Open /pay</a>
        </div>
      )}

      <section className="totals">
        {totals.length === 0 && <div className="total"><span className="amt">0</span><span className="dim">no sales today yet</span></div>}
        {totals.map(([t, v]) => (
          <div className="total" key={t}>
            <span className="amt">{formatAmount(v, meta[t]?.decimals ?? 0)}</span>
            <span className="sym">{meta[t]?.symbol ?? '...'}</span>
            <span className="dim">today</span>
          </div>
        ))}
      </section>

      <section className="feed">
        {till.payments.length === 0 && <p className="dim empty">Payments into this address appear here within a couple of seconds of finality.</p>}
        {till.payments.map((p) => (
          <div key={`${p.digest}:${p.coinType}`} className={`row ${flash === `${p.digest}:${p.coinType}` ? 'flash' : ''}`}>
            <div className="amount">{fmt(p)}</div>
            <div className="from">from <span className="mono">{short(p.sender)}</span></div>
            {p.recovered && <span className="tag">recovered</span>}
            <a className="mono digest" href={explorer(p.digest)} target="_blank">{p.digest.slice(0, 8)}</a>
            <div className="time dim">{new Date(p.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-row">
          <button className="primary" disabled={closing || !till.payments.length} onClick={closeTill}>{closing ? 'Closing...' : 'Close the till'}</button>
          <span className="dim small">DeepSeek writes the day report from today's list. Only amounts, short senders and times are sent.</span>
        </div>
        {report && <p className="report">{report}</p>}
      </section>

      <details className="panel">
        <summary>Stream internals</summary>
        <div className="mono small">last cursor: {till.cursor ?? 'none'}</div>
        <ul className="log mono small">{till.log.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </details>
    </main>
  );
}

function Pay({ shop }: { shop: string }) {
  const [amount, setAmount] = useState('0.05');
  const [coinType, setCoinType] = useState(SUI_TYPE);
  const [mode, setMode] = useState<'coin' | 'address-balance'>('coin');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ digest?: string; error?: string; mode?: string }[]>([]);
  const isDefaultShop = normalize(shop) === normalize(DEFAULT_SHOP);

  async function pay() {
    setBusy(true);
    const r = await fetch('/api/pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount, coinType, mode }) });
    const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    setResults((x) => [j, ...x]);
    setBusy(false);
  }

  return (
    <main className="pay">
      <h1>Pay the shop</h1>
      <div className="pay-grid">
        <div className="qr-card">
          <QRCodeSVG value={normalize(shop)} size={220} bgColor="#ffffff" fgColor="#1c1917" />
          <div className="mono small addr">{normalize(shop)}</div>
        </div>
        <div className="pay-form">
          <h2>Demo customer</h2>
          <p className="dim small">A server function signs with the demo customer key and pays this shop, so the projector demo needs no phone. {isDefaultShop ? '' : 'It always pays the default class shop, not the ?shop= address.'}</p>
          <div className="amounts">
            {['0.01', '0.05', '0.1'].map((a) => (
              <button key={a} className={amount === a ? 'chip on' : 'chip'} onClick={() => setAmount(a)}>{a}</button>
            ))}
          </div>
          <label className="field">Coin
            <select value={coinType} onChange={(e) => { setCoinType(e.target.value); setAmount(e.target.value === USDC ? '0.5' : '0.05'); }}>
              <option value={SUI_TYPE}>SUI</option>
              <option value={USDC}>USDC (needs testnet USDC in the demo wallet)</option>
            </select>
          </label>
          <label className="field">How the money moves
            <select value={mode} onChange={(e) => setMode(e.target.value as 'coin' | 'address-balance')}>
              <option value="coin">Coin object transfer (what wallets send)</option>
              <option value="address-balance">send_funds to address balance (see gotcha)</option>
            </select>
          </label>
          <input className="field-input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className="primary big" disabled={busy} onClick={pay}>{busy ? 'Paying...' : 'Pay from demo customer'}</button>
          <ul className="results">
            {results.map((r, i) => (
              <li key={i} className="mono small">
                {r.digest ? <a href={explorer(r.digest)} target="_blank">{r.digest}</a> : <span className="err">{r.error}</span>} {r.mode && <span className="dim">({r.mode})</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <section className="panel">
        <h2>Pay from your own wallet</h2>
        <ol className="small">
          <li>Switch your wallet (Slush or any Sui wallet) to Testnet. Get test SUI from faucet.sui.io, test USDC from faucet.circle.com (Sui Testnet).</li>
          <li>Scan the QR or paste the address above, send any amount of any coin.</li>
          <li>Watch the Till. It chimes within a couple of seconds of finality. Coin transfers show live; a send_funds deposit shows when the Till next resumes from its cursor (a gotcha we found while building this).</li>
          <li>Run your own Till: open <span className="mono">/?shop=0xYOUR_ADDRESS</span>.</li>
        </ol>
      </section>
    </main>
  );
}

function ReceiptPage() {
  const [digest, setDigest] = useState(new URLSearchParams(location.search).get('digest') ?? OLD_RECEIPT);
  const [r, setR] = useState<Receipt | null | undefined>(undefined);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const meta = useMeta(r ? [...new Set(r.effects.balanceChanges.nodes.map((c) => c.coinType.repr))] : []);

  async function go() {
    setBusy(true); setErr(''); setR(undefined);
    try { setR(await lookupReceipt(digest.trim())); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  return (
    <main className="receipt">
      <h1>Receipt lookup</h1>
      <p className="dim small">GraphQL RPC answers from the archival store, so it finds transactions that full nodes have pruned. The default digest is from October 2025; the testnet full node's gRPC API returns "not found" for it.</p>
      <div className="panel-row">
        <input className="field-input mono grow" value={digest} onChange={(e) => setDigest(e.target.value)} />
        <button className="primary" onClick={go} disabled={busy}>{busy ? 'Looking...' : 'Look up'}</button>
      </div>
      {err && <p className="err">{err}</p>}
      {r === null && <p className="err">Not found.</p>}
      {r && (
        <div className="slip">
          <div className="slip-row"><span>Digest</span><a className="mono" href={explorer(r.digest)} target="_blank">{short(r.digest)}</a></div>
          <div className="slip-row"><span>Status</span><span>{r.effects.status}</span></div>
          <div className="slip-row"><span>When</span><span>{new Date(r.effects.timestamp).toLocaleString()}</span></div>
          <div className="slip-row"><span>Checkpoint</span><span className="mono">{r.effects.checkpoint.sequenceNumber}</span></div>
          <div className="slip-row"><span>Sender</span><span className="mono">{short(r.sender?.address ?? 'system')}</span></div>
          <hr />
          {r.effects.balanceChanges.nodes.map((c, i) => {
            const m = meta[c.coinType.repr] ?? { decimals: 0, symbol: '...' };
            return (
              <div className="slip-row" key={i}>
                <span className="mono">{short(c.owner?.address ?? '?')}</span>
                <span className={BigInt(c.amount) > 0n ? 'pos' : 'neg'}>{BigInt(c.amount) > 0n ? '+' : ''}{formatAmount(c.amount, m.decimals, m.decimals)} {m.symbol}</span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
