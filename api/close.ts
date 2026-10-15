// Exact totals are computed in code. The optional model only writes the prose.
export type Line = { amount: string; symbol: string; coinType?: string; sender: string; timestamp: string; recovered?: boolean };
export function factsFor(payments: Line[]) {
  const groups = new Map<string, { units: bigint; decimals: number; symbol: string }>();
  for (const p of payments) {
    const [whole, fraction = ''] = p.amount.split('.'); const key = p.coinType ?? p.symbol;
    const old = groups.get(key) ?? { units: 0n, decimals: 0, symbol: p.symbol };
    const decimals = Math.max(old.decimals, fraction.length);
    groups.set(key, { symbol: p.symbol, decimals, units: old.units * 10n ** BigInt(decimals - old.decimals) + BigInt(whole + fraction) * 10n ** BigInt(decimals - fraction.length) });
  }
  const totals = [...groups.values()].map(v => {
    const base = 10n ** BigInt(v.decimals); const frac = (v.units % base).toString().padStart(v.decimals, '0').replace(/0+$/, '');
    return `${v.units / base}${frac ? '.' + frac : ''} ${v.symbol}`;
  }).join(', ') || '0 SUI';
  return `${payments.length} tracked payments today (UTC), totalling ${totals}. ${payments.filter(p => p.recovered).length} recovered after reconnecting. This summary covers the browser's tracked session, not the shop's complete history.`;
}
export async function POST(request: Request) {
  const body = await request.json().catch(() => null); const payments = body?.payments;
  if (!Array.isArray(payments) || payments.length > 500 || payments.some(p => !p || typeof p.amount !== 'string' || !/^\d{1,80}(\.\d{1,30})?$/.test(p.amount) || typeof p.symbol !== 'string' || p.symbol.length > 200 || typeof p.sender !== 'string' || typeof p.timestamp !== 'string' || (p.coinType !== undefined && typeof p.coinType !== 'string'))) return Response.json({ error: 'Provide up to 500 valid payment records.' }, { status: 400 });
  const report = factsFor(payments);
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key || !payments.length) return Response.json({ report, source: 'exact-summary' });
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(18_000),
      body: JSON.stringify({ model: 'deepseek-flash', temperature: 0.2, max_tokens: 180, thinking: { type: 'disabled' }, messages: [
        { role: 'system', content: 'Write a friendly shop session note in at most two sentences. No markdown or em dashes. Describe only these supplied facts. Never claim these are all onchain payments.' },
        { role: 'user', content: report },
      ] }),
    });
    if (!res.ok) return Response.json({ report, source: 'exact-summary' });
    const json = await res.json(); const note = json.choices?.[0]?.message?.content?.trim();
    return Response.json({ report: note ? `${report}\n\nAI note: ${note}` : report, source: note ? 'exact-summary-and-ai-note' : 'exact-summary' });
  } catch { return Response.json({ report, source: 'exact-summary' }); }
}
