// POST /api/pay  { amount: "0.05", coinType?: string, mode?: "coin" | "address-balance" }
// The projector demo's customer: signs server-side with DEMO_CUSTOMER_KEY and pays SHOP_ADDRESS.
// The key never leaves the function. The destination is fixed by env, not by the request body.
import { payShop, SUI, type PayMode } from '../src/lib/pay.ts';
import { SuiGrpcClient } from '@mysten/sui/grpc';

const MAX_SUI = 100_000_000n; // 0.1 SUI per click keeps the demo wallet alive
let lastPay = 0;

export async function POST(request: Request) {
  const shop = process.env.SHOP_ADDRESS;
  if (!shop) return Response.json({ error: 'SHOP_ADDRESS not set' }, { status: 500 });
  if (Date.now() - lastPay < 3000) return Response.json({ error: 'slow down: one payment every 3s' }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { amount?: string; coinType?: string; mode?: PayMode };
  const coinType = body.coinType || SUI;
  const mode: PayMode = body.mode === 'address-balance' ? 'address-balance' : 'coin';
  const client = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' });

  const { coinMetadata } = await client.getCoinMetadata({ coinType });
  const decimals = coinMetadata?.decimals ?? 9;
  const [w, f = ''] = String(body.amount ?? '0.05').split('.');
  const amount = BigInt(w || '0') * 10n ** BigInt(decimals) + BigInt((f + '0'.repeat(decimals)).slice(0, decimals) || '0');
  if (amount <= 0n) return Response.json({ error: 'amount must be positive' }, { status: 400 });
  if (coinType.endsWith('::sui::SUI') && amount > MAX_SUI) return Response.json({ error: 'max 0.1 SUI per demo payment' }, { status: 400 });

  lastPay = Date.now();
  try {
    const r = await payShop({ shop, amount, coinType, mode, client });
    return Response.json({ digest: r.digest, from: r.from, mode });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
