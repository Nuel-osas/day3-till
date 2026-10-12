// pnpm pay [amountInBaseUnits] [coinType] [coin|address-balance]  -> the demo customer pays the shop from the terminal.
import { payShop, SUI, type PayMode } from '../src/lib/pay.ts';

const shop = process.env.SHOP_ADDRESS ?? process.env.VITE_SHOP_ADDRESS;
if (!shop) throw new Error('set SHOP_ADDRESS');
const amount = BigInt(process.argv[2] ?? '50000000'); // 0.05 SUI
const coinType = process.argv[3] ?? SUI;
const mode = (process.argv[4] ?? 'coin') as PayMode;
const r = await payShop({ shop, amount, coinType, mode });
console.log(JSON.stringify({ digest: r.digest, from: r.from, balanceChanges: r.balanceChanges }, null, 2));
