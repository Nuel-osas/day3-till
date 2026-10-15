import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { QRCodeSVG } from 'qrcode.react';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { useTill } from './useTill.ts';
import { chime, unlockAudio } from './chime.ts';
import { coinMeta, formatAmount, short, SUI_TYPE, normalize, type CoinMeta } from './lib/till.ts';
import { lookupReceipt, type Receipt } from './lib/receipt.ts';
import { browserKey, client, paymentTransaction, usePayer } from './lib/wallet.ts';
import { parseSui } from './lib/session.ts';
const OLD_RECEIPT = 'ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a';
const explorer = (d: string) => `https://suiscan.xyz/testnet/tx/${d}`;
const units = (v: string | bigint) => formatAmount(v, 9, 9);
function useMeta(types: string[]) {
  const [meta, setMeta] = useState<Record<string, CoinMeta>>({ [SUI_TYPE]: { decimals: 9, symbol: 'SUI' } });
  useEffect(() => { let active = true;
    types.forEach(t => { if (!meta[t]) void coinMeta(t).then(m => { if (active) setMeta(x => ({ ...x, [t]: m })); }).catch(() => {}); });
    return () => { active = false; };
  }, [types.join('|')]);
  return meta;
}
function useBalances(payer: string | null, shop: string) {
  const [values, setValues] = useState<{ payer: string | null; shop: string | null }>({ payer: null, shop: null });
  const [delta, setDelta] = useState({ payer: '0', shop: '0' });
  const [error, setError] = useState(''); const active = useRef(true); const request = useRef(0);
  const previous = useRef(values);
  const refresh = useCallback(async () => {
    const id = ++request.current;
    try {
      const [a, b] = await Promise.all([payer ? client.getBalance({ owner: payer, coinType: SUI_TYPE }) : null, client.getBalance({ owner: shop, coinType: SUI_TYPE })]);
      if (!active.current || id !== request.current) return;
      const next = { payer: a?.balance.balance ?? null, shop: b.balance.balance };
      const prev = previous.current;
      setDelta(old => ({ payer: prev.payer !== null && next.payer !== null && prev.payer !== next.payer ? String(BigInt(next.payer) - BigInt(prev.payer)) : old.payer,
          shop: prev.shop !== null && prev.shop !== next.shop ? String(BigInt(next.shop) - BigInt(prev.shop)) : old.shop }));
      previous.current = next; setValues(next); setError('');
    } catch { if (active.current) setError('Balance refresh failed. Last known balances are shown.'); }
  }, [payer, shop]);
  useEffect(() => { active.current = true; void refresh(); const t = setInterval(() => void refresh(), 5000); return () => { active.current = false; request.current++; clearInterval(t); }; }, [refresh]);
  return { values, delta, error, refresh };
}
function Address({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="address" title={address} onClick={() => void navigator.clipboard.writeText(address).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}>{copied ? 'Copied ✓' : short(address)} <span aria-hidden="true">⧉</span></button>;
}
export function App() {
  const payer = usePayer();
  const ownShop = useMemo(() => payer.address ? browserKey(`shop:${payer.address}`).toSuiAddress() : null, [payer.address]);
  const [custom, setCustom] = useState(() => { const q = new URLSearchParams(location.search).get('shop'); return q && isValidSuiAddress(q) ? normalize(q) : ''; });
  const [input, setInput] = useState(custom); const [watchError, setWatchError] = useState('');
  const shop = custom || ownShop;
  const receipt = location.pathname === '/receipt';
  const query = custom ? `?shop=${custom}` : '';
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href={`/${query}`}><span className="brand-mark">t.</span>till<span className="lab">LAB</span></a>
      <nav aria-label="Main navigation"><a className={!receipt ? 'selected' : ''} href={`/${query}`}>Live till</a><a className={receipt ? 'selected' : ''} href={`/receipt${query}`}>Receipt archive</a></nav>
      <span className="network"><i /> Sui testnet</span></header>
    {receipt ? <ReceiptPage /> : <>
      <section className="hero"><div><p className="eyebrow">SUIHUB LAGOS / DAY 03</p><h1>Every payment.<br /><span>Seen, live.</span></h1><p className="hero-copy">Your own shop. Real testnet payments.<br />A live feed that picks up where you left off.</p></div>
        <div className="hero-diagram" aria-hidden="true"><div className="diagram-label">THE PATH OF A PAYMENT</div><div className="diagram-route"><span>01<br /><b>Pay</b></span><i>→</i><span>02<br /><b>Stream</b></span><i>→</i><span>03<br /><b>Recover</b></span></div><div className="diagram-bottom"><i /> ONCHAIN, INTO VIEW</div></div></section>
      <section className="setup-panel"><div><p className="eyebrow">01 / YOUR WORKSPACE</p><h2>A till of your own.</h2><p className="muted">Each payer gets a personal shop. Students never share the default wallets.</p></div>
        <div className="payer-options"><div className="segmented"><button className={payer.demo ? 'active' : ''} onClick={() => payer.setDemo(true)}>Demo payer</button><button className={!payer.demo ? 'active' : ''} onClick={() => payer.setDemo(false)}>My wallet</button></div>{!payer.demo && <ConnectButton />}<p className="micro">{payer.demo ? 'Demo keys stay in this browser. Test funds only.' : 'Connect your Sui wallet. Payments request a testnet signature.'}</p></div>
        <details className="watch"><summary>Watch another shop</summary><form onSubmit={e => { e.preventDefault(); if (!isValidSuiAddress(input)) { setWatchError('Paste a full 0x shop address.'); return; } setCustom(normalize(input)); setWatchError(''); history.replaceState(null, '', `/?shop=${normalize(input)}`); }}><label htmlFor="shop-address">Shop address</label><div className="input-row"><input id="shop-address" value={input} onChange={e => setInput(e.target.value)} placeholder="0x…" /><button className="secondary">Watch</button></div></form>{custom && <button className="text-button" onClick={() => { setCustom(''); setInput(''); history.replaceState(null, '', '/'); }}>Return to my personal shop</button>}{watchError && <p className="error">{watchError}</p>}</details>
      </section>
      {shop ? <Workspace key={`${shop}:${payer.address}`} shop={shop} custom={!!custom} payer={payer} /> : <section className="empty card"><h2>Connect a wallet to open your workspace.</h2><p>Your personal shop appears when your payer is connected.</p></section>}
    </>}
    <footer><span>TILL LAB <span className="muted">/ Built for learning on Sui</span></span><a href="https://github.com/Nuel-osas/day3-till" target="_blank" rel="noreferrer">Explore the code ↗</a></footer>
  </div>;
}
function Workspace({ shop, custom, payer }: { shop: string; custom: boolean; payer: ReturnType<typeof usePayer> }) {
  const balances = useBalances(payer.address, shop);
  const [flash, setFlash] = useState('');
  const till = useTill(shop, p => { chime(); setFlash(p.digest); void balances.refresh(); });
  const meta = useMeta([...new Set(till.payments.map(p => p.coinType))]);
  const [amount, setAmount] = useState('0.01'); const [mode, setMode] = useState<'coin' | 'address-balance'>('coin');
  const [busy, setBusy] = useState(''); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  const [lastDigest, setLastDigest] = useState(''); const [report, setReport] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const todays = till.payments.filter(p => p.timestamp.startsWith(today));
  const total = todays.filter(p => p.coinType === SUI_TYPE).reduce((n, p) => n + BigInt(p.amount), 0n);
  const recovered = till.payments.filter(p => p.recovered).length;
  const connected = till.status === 'live' || till.status === 'connecting' || till.status === 'retrying';
  async function fund() {
    setBusy('fund'); setError(''); setNotice('Requesting test SUI. The public faucet can take a minute.');
    try { const r = await fetch('/api/test-funds', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: payer.address }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setNotice(j.alreadyFunded ? 'Your payer already has enough test SUI.' : 'Test funds requested. Refresh balances if they have not arrived yet.'); await balances.refresh(); }
    catch (e) { setError((e as Error).message); setNotice(''); } finally { setBusy(''); }
  }
  async function pay() {
    setError(''); setNotice(''); setBusy('pay');
    try { const n = parseSui(amount); if (payer.address && normalize(payer.address) === normalize(shop)) throw new Error('Choose a shop different from your payer.');
      const digest = await payer.execute(paymentTransaction(shop, n, mode)); setLastDigest(digest);
      setNotice(till.status === 'offline' ? 'Payment confirmed. The feed is paused. Resume to recover it.' : 'Payment confirmed on Sui. The stream updates when indexed.'); await balances.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }
  async function close() {
    setBusy('close'); setError('');
    try { const payments = todays.map(p => ({ amount: formatAmount(p.amount, meta[p.coinType]?.decimals ?? 0, 30), symbol: meta[p.coinType]?.symbol ?? p.coinType, coinType: p.coinType, sender: p.sender, timestamp: p.timestamp, recovered: p.recovered }));
      const r = await fetch('/api/close', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ payments }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setReport(j.report);
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }
  return <>
    <div className="section-label"><span>02 / FOLLOW THE MONEY</span><button className="text-button" onClick={() => void balances.refresh()}>Refresh balances ↻</button></div>
    <section className="balance-grid" aria-label="Payer and shop balances">
      <BalanceCard role="Payer" address={payer.address} value={balances.values.payer} delta={balances.delta.payer} detail={payer.demo ? 'Your browser demo wallet' : 'Your connected wallet'} />
      <div className="flow-arrow" aria-hidden="true">→</div>
      <BalanceCard role="Shop" address={shop} value={balances.values.shop} delta={balances.delta.shop} detail={custom ? 'The address you are watching' : 'Your personal receiving wallet'} />
    </section>
    <p className="balance-caption">Balances include coin objects and address balances. The payer also covers gas. Live balances refresh separately from the payment stream.</p>
    {balances.error && <p className="error">{balances.error}</p>}
    <div className="work-grid">
      <section className="card stream-panel"><div className="panel-heading"><div><p className="eyebrow">03 / LISTEN TO SUI</p><h2>The live till</h2></div><span className={`status ${till.status}`}><i />{till.status === 'offline' ? 'Paused' : till.status}</span></div>
        <div className="stream-controls"><button className={connected ? 'secondary' : 'primary'} onClick={() => { unlockAudio(); if (connected) till.kill(); else till.start(); }}>{connected ? 'Pause feed' : till.status === 'idle' ? 'Open till' : 'Resume feed'} <span>{connected ? 'Ⅱ' : '→'}</span></button><button className="text-button" onClick={till.start} disabled={!till.startCheckpoint}>Catch up now ↻</button></div>
        <div className="metrics"><div><span>Tracked today · UTC</span><strong>{units(total)} <small>SUI</small></strong></div><div><span>Payments today</span><strong>{todays.length.toString().padStart(2, '0')}</strong></div><div><span>Recovered</span><strong className="blue">{recovered.toString().padStart(2, '0')}</strong></div></div>
        {till.status === 'offline' && <div className="paused-note">Your listener is paused. Send a payment, then resume to see it recovered.</div>}
        <div className="feed" aria-live="polite">{!till.payments.length ? <div className="empty"><div className="empty-icon">↙</div><h3>{till.status === 'idle' ? 'Ready when you are.' : 'Waiting for your first payment.'}</h3><p>Open the till, then send test SUI.<br />Each incoming payment gets a receipt here.</p></div> : till.payments.map(p => <article className={`payment-row ${p.digest === flash ? 'fresh' : ''}`} key={`${p.digest}:${p.coinType}`}><div className="payment-icon">↙</div><div className="payment-info"><strong>Payment received {p.recovered && <span className="recovered">Recovered</span>}</strong><span>From <code>{short(p.sender)}</code> · {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div><div className="payment-value"><strong>+{formatAmount(p.amount, meta[p.coinType]?.decimals ?? 0, meta[p.coinType]?.decimals ?? 0)} <small>{meta[p.coinType]?.symbol ?? 'units'}</small></strong><a href={`/receipt?digest=${p.digest}`}>View receipt ↗</a></div></article>)}</div>
        <div className="feed-footer"><span>Latest 500 tracked payments · Positive net receipts only</span><button className="text-button" disabled={!todays.length || !!busy} onClick={close}>{busy === 'close' ? 'Summarising…' : 'Summarise session ↗'}</button></div>
        {report && <div className="report"><p className="eyebrow">SESSION SUMMARY</p><p>{report}</p></div>}
        <details className="internals"><summary>Under the hood <span>GraphQL · SSE · saved cursor</span></summary><p>Opening checkpoint: <code>{till.startCheckpoint ?? 'Not captured yet'}</code></p><p className="cursor">Cursor: <code>{till.cursor ?? 'No delivery yet. Opening checkpoint protects the first resume.'}</code></p><p>“Recovered” means the payment timestamp predates this connection. Browser time is an approximation.</p><ul>{till.log.map((l, i) => <li key={i}>{l}</li>)}</ul><button className="secondary" onClick={till.reset}>Start a new tracking session</button><p>Clears this shop’s local feed and cursor. Existing onchain funds stay in place.</p></details>
        {till.storageWarning && <p className="error">{till.storageWarning}</p>}
      </section>
      <aside className="right-column"><section className="card pay-panel"><p className="eyebrow">04 / MAKE IT MOVE</p><h2>Send a test payment.</h2><p className="muted">From your payer to {custom ? 'this' : 'your personal'} shop.</p>
        <button className="fund-button" disabled={!!busy || !payer.address} onClick={fund}>{busy === 'fund' ? 'Requesting test SUI…' : '↓ Get test SUI for my payer'}</button>
        <label className="field-label" htmlFor="payment-amount">Payment amount</label><div className="amount-input"><input id="payment-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /><span>SUI</span></div>
        <div className="presets">{['0.001', '0.01', '0.05'].map(a => <button className={amount === a ? 'chosen' : ''} key={a} onClick={() => setAmount(a)}>{a} SUI</button>)}</div>
        <button className="primary pay-button" disabled={!!busy || !payer.address} onClick={pay}>{busy === 'pay' ? 'Confirming on Sui…' : 'Send payment'} <span>↗</span></button>
        {till.status === 'idle' && <p className="micro">Open the till before paying to capture this payment.</p>}
        <details className="advanced"><summary>Payment options</summary><label className="field-label" htmlFor="payment-mode">Transfer method</label><select id="payment-mode" value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="coin">Coin object transfer</option><option value="address-balance">Address balance deposit</option></select><p className="micro">Compare both methods. If a deposit is confirmed but missing from the live feed, choose “Catch up now”. Live filtering and historical replay can differ.</p><a href="https://faucet.sui.io/?network=testnet" target="_blank" rel="noreferrer">Open public faucet ↗</a></details>
        <div aria-live="polite">{notice && <p className="notice">{notice}</p>}{error && <p role="alert" className="error">{error}</p>}{lastDigest && <a className="tx-link" href={explorer(lastDigest)} target="_blank" rel="noreferrer">Confirmed transaction {short(lastDigest)} ↗</a>}</div>
      </section>
      <section className="challenge"><span className="challenge-tag">TRY THIS IN CLASS</span><h3>Make a payment<br />while nobody’s listening.</h3><ol><li>Open the till and send a payment.</li><li>Pause the feed. Send another.</li><li>Resume. Find the “Recovered” tag.</li><li>Refresh the page. Resume again.</li></ol><p>The payment continues onchain.<br />Your saved cursor catches the screen up.</p></section>
      <details className="card qr-panel"><summary>Share this shop’s address ↗</summary><QRCodeSVG value={shop} size={160} /><p className="mono break">{shop}</p><button className="secondary" onClick={() => void navigator.clipboard.writeText(`${location.origin}/?shop=${shop}`)}>Copy shop link</button></details></aside>
    </div>
  </>;
}
function BalanceCard({ role, address, value, delta, detail }: { role: 'Payer' | 'Shop'; address: string | null; value: string | null; delta: string; detail: string }) {
  const change = BigInt(delta); const positive = change > 0n;
  return <article className={`balance-card ${role.toLowerCase()}`}><div className="balance-top"><span className="wallet-icon">{role === 'Payer' ? '↗' : '↙'}</span><div><h3>{role}</h3><p>{detail}</p></div>{address && <Address address={address} />}</div><div className="balance-number" data-testid={`${role.toLowerCase()}-balance`}>{value === null ? '…' : units(value)} <span>SUI</span></div><div className={`balance-change ${change === 0n ? 'muted' : positive ? 'received' : 'sent'}`}>{change === 0n ? 'Waiting for a balance change' : `${positive ? '↑ +' : '↓ '}${units(delta)} SUI · latest change`}</div></article>;
}
function ReceiptPage() {
  const [digest, setDigest] = useState(new URLSearchParams(location.search).get('digest') ?? OLD_RECEIPT);
  const [r, setR] = useState<Receipt | null>(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const meta = useMeta(r ? [...new Set(r.effects.balanceChanges.nodes.map(c => c.coinType.repr))] : []);
  async function go() { setBusy(true); setError(''); setR(undefined); try { setR(await lookupReceipt(digest.trim())); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  return <main className="receipt-page"><p className="eyebrow">DAY 03 / LOOK BACK</p><h1>A payment leaves<br /><span>a paper trail.</span></h1><p className="hero-copy">Find a transaction by its digest, including history that a full node may have pruned.</p><section className="card receipt-search"><label className="field-label" htmlFor="digest">Transaction digest · Sui testnet</label><form className="input-row" onSubmit={e => { e.preventDefault(); void go(); }}><input id="digest" value={digest} onChange={e => setDigest(e.target.value)} /><button className="primary" disabled={busy}>{busy ? 'Looking…' : 'Look up receipt ↗'}</button></form><button className="text-button" onClick={() => setDigest(OLD_RECEIPT)}>Use the October 2025 archive example</button>{error && <p className="error">{error}</p>}{r === null && <p>No transaction found for that digest.</p>}</section>
    {r && <section className="card receipt-result"><div className="panel-heading"><h2>Payment record</h2><span className="status live">{r.effects.status}</span></div><dl><div><dt>Digest</dt><dd><a className="mono break" href={explorer(r.digest)} target="_blank" rel="noreferrer">{r.digest} ↗</a></dd></div><div><dt>Recorded</dt><dd>{new Date(r.effects.timestamp).toUTCString()}</dd></div><div><dt>Checkpoint</dt><dd>{r.effects.checkpoint.sequenceNumber.toLocaleString()}</dd></div></dl><h3>Balance changes</h3>{r.effects.balanceChanges.nodes.map((c, i) => <div className="receipt-change" key={i}><code>{c.owner?.address ? short(c.owner.address) : 'System'}</code><strong className={BigInt(c.amount) > 0n ? 'received' : 'sent'}>{BigInt(c.amount) > 0n ? '+' : ''}{formatAmount(c.amount, meta[c.coinType.repr]?.decimals ?? 0, 30)} {meta[c.coinType.repr]?.symbol ?? 'units'}</strong></div>)}<p className="micro">Source: Sui GraphQL. A sender’s net change can include gas.</p></section>}
    <div className="archive-note"><span>THEN + NOW</span><p>gRPC reads current state and executes payments.<br />GraphQL brings structured history and live subscriptions into your app.</p></div></main>;
}
