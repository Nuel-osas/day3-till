// Old clients must reload. Each student now signs in their own browser or wallet.
export async function POST() {
  return Response.json({ error: 'Reload Till to pay from your personal demo payer or connected testnet wallet.' }, { status: 410 });
}
