import { SuiGrpcClient } from '@mysten/sui/grpc';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { requestSuiFromFaucetV3, FaucetError, FaucetRateLimitError } from '@mysten/sui/faucet';
const grpcOptions = { network: 'testnet' as const, baseUrl: 'https://fullnode.testnet.sui.io:443' };
const client = new SuiGrpcClient(grpcOptions);
export async function POST(request: Request) {
  const { address } = await request.json().catch(() => ({}));
  if (typeof address !== 'string' || !isValidSuiAddress(address)) return Response.json({ error: 'A valid testnet address is required.' }, { status: 400 });
  try {
    const { balance } = await client.getBalance({ owner: address, coinType: '0x2::sui::SUI' });
    if (BigInt(balance.balance) >= 100_000_000n) return Response.json({ ok: true, alreadyFunded: true });
    const data = await requestSuiFromFaucetV3({ host: 'https://faucet.testnet.sui.io', recipient: address, timeout: 150_000 });
    return Response.json({ ok: true, digest: data.digest });
  } catch (e) {
    if (e instanceof FaucetError && e.digest) return Response.json({ ok: true, digest: e.digest }, { status: 202 });
    return Response.json({ error: e instanceof FaucetRateLimitError ? 'The faucet is busy. Try the public faucet link.' : 'Funding is not confirmed. Refresh balances before retrying.' }, { status: 503 });
  }
}
