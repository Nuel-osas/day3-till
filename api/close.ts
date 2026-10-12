// POST /api/close  { payments: [{ amount, symbol, sender, timestamp, recovered }] }
// "Close the till": DeepSeek turns the day's payments into a short shopkeeper report.
// Only the payment list is sent. No keys, no addresses beyond the short sender label.
type Line = { amount: string; symbol: string; sender: string; timestamp: string; recovered?: boolean };

export async function POST(request: Request) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return Response.json({ error: 'DEEPSEEK_API_KEY not set' }, { status: 500 });
  const { payments = [] } = (await request.json().catch(() => ({}))) as { payments?: Line[] };
  const lines = payments.slice(0, 200).map((p) =>
    `${p.timestamp} ${p.amount} ${p.symbol} from ${p.sender.slice(0, 6)}..${p.sender.slice(-4)}${p.recovered ? ' (recovered after a disconnect)' : ''}`);

  // Do the arithmetic in code and hand the model facts; models miscount lists.
  const totals = new Map<string, number>();
  for (const p of payments) totals.set(p.symbol, (totals.get(p.symbol) ?? 0) + Number(p.amount));
  const facts = `Facts (exact, use these numbers): ${payments.length} payments; ${payments.filter((p) => p.recovered).length} recovered after a disconnect; totals ${[...totals].map(([s, v]) => `${Number(v.toFixed(9))} ${s}`).join(', ') || 'none'}.`;

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-flash',
      temperature: 0.3,
      max_tokens: 400,
      // deepseek-flash reasons by default and the reasoning eats max_tokens, leaving content empty.
      thinking: { type: 'disabled' },
      messages: [
        { role: 'system', content: 'You write end of day reports for a small shop owner in Lagos. Plain sentences, no markdown, no em dashes, under 90 words. Give totals per coin, number of payments, busiest time, repeat customers, and mention any payments recovered after a network drop. Use only the data given.' },
        { role: 'user', content: lines.length ? `${facts}\n\n${lines.join('\n')}` : 'No payments today.' },
      ],
    }),
  });
  if (!res.ok) return Response.json({ error: `deepseek ${res.status}` }, { status: 502 });
  const json = await res.json();
  return Response.json({ report: json.choices?.[0]?.message?.content?.trim() ?? '' });
}
