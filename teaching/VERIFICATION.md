# Verification · 15 October 2026

## App and tests

- `pnpm build`: TypeScript and production bundle passed.
- `pnpm test`: 7 tests passed. Cases cover SSE chunk boundaries, multiline data, empty complete events, in-stream GraphQL errors, exact amounts, net receipt filtering, atomic snapshot advancement, deduplication and invalid summary input.
- Local and production Chrome: faucet funding, live payment, pause/pay/resume, one recovered receipt, reload/resume without duplicates, address-balance catch-up, exact session summary and disconnected-wallet empty state passed. No page errors.
- Separate browsers generated separate payer/shop identities. A second tab in the same browser retained identity.
- A payment made while paused before the first delivery recovered from the saved opening checkpoint.
- Reset cleared only the local feed and cursor. Returning to a personal shop restored its own saved feed.
- Wallet Standard fixture: signing selected the requested account and `sui:testnet`; deliberate rejection showed an error without submitting. Switching accounts selected different personal shops and cleared previous account UI; returning restored the correct shop.
- Desktop 1440 px, mobile 390 px and narrow mobile 320 px passed overflow checks. Payer and shop cards remain side by side.
- SQLite writer backfilled the first three local receipts (0.03 SUI), saved a watermark, and restarted without duplicates.
- Archive example: public gRPC returned not found; GraphQL returned SUCCESS at checkpoint 250000000, 7 October 2025.
- Public testnet JSON-RPC: HTTP 200 with error -32601. Current GraphQL schema and service limits were introspected.

## Real transaction evidence

All transactions below are Sui testnet. Values were not simulated in the UI.

| Check | Transaction | Checkpoint |
| --- | --- | --- |
| Local: Coin transfer, live | [H1BToXWsWgKuYR76i1oyz7FYRpQ7FSjMMWJ7G3HVY8Ai](https://suiscan.xyz/testnet/tx/H1BToXWsWgKuYR76i1oyz7FYRpQ7FSjMMWJ7G3HVY8Ai) | 395255980 |
| Local: Coin transfer, paused then recovered | [CFUMuNtEsBz6PCPK7yWfT2Ubfd1tBpQmnMVWM2usDqx](https://suiscan.xyz/testnet/tx/CFUMuNtEsBz6PCPK7yWfT2Ubfd1tBpQmnMVWM2usDqx) | 395255987 |
| Local: Address balance, recovered after catch-up | [H7GPfTyBaeeo3sQZn3qeNBVi5CoQUWDc2zG3oMWf1bAR](https://suiscan.xyz/testnet/tx/H7GPfTyBaeeo3sQZn3qeNBVi5CoQUWDc2zG3oMWf1bAR) | 395256016 |
| Production: Coin transfer, live | [H1fQ22Q5V6yt37GaiySNqGhUJR7ki4b35Te9Qcja9Bqn](https://suiscan.xyz/testnet/tx/H1fQ22Q5V6yt37GaiySNqGhUJR7ki4b35Te9Qcja9Bqn) | 395259305 |
| Production: Coin transfer, paused then recovered | [66XRjyGEKngFwGZntzULDr6v4hrwFPnR8ZmY9fmPW6Zh](https://suiscan.xyz/testnet/tx/66XRjyGEKngFwGZntzULDr6v4hrwFPnR8ZmY9fmPW6Zh) | 395259318 |
| Production: Address balance, recovered after catch-up | [5crvrKsvQGU3emZvNCEJgKjpAwENtCHHxfY4UMy11Dcc](https://suiscan.xyz/testnet/tx/5crvrKsvQGU3emZvNCEJgKjpAwENtCHHxfY4UMy11Dcc) | 395259355 |

Additional screenshot payment: [9dc36To1WB6PxSqHFyzbsYGSMtJ7JBVDSfuxkxnNUksv](https://suiscan.xyz/testnet/tx/9dc36To1WB6PxSqHFyzbsYGSMtJ7JBVDSfuxkxnNUksv). The shop reached 0.031 SUI after this payment; the SQLite restart assertion above was performed earlier at 0.03 SUI.

Archived receipt: [ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a](https://suiscan.xyz/testnet/tx/ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a).

## Slide checks

15 editable slides, 15 speaker-note entries and a 15-page PDF. Rendered through Quick Look and Chrome with the supplied DM Sans and JetBrains Mono fonts. All slides were inspected through contact sheets, with detailed checks of screenshots and code slides. Final text overflow check: zero candidates.

## Limits of these checks

- A physical wallet extension's approval UI and real audio playback were not manually exercised. The account/network signing boundary was tested with a Wallet Standard fixture; real payments used the browser test payer.
- The live affected-address filter missed tested address-balance deposits; catch-up returned them. This is a measured public endpoint behaviour, not a universal protocol promise.
- No load test, throttle threshold measurement, production-money accounting, USDC funding or new Rust indexer was attempted. This is a SUI-only testnet teaching lab with a bounded browser history.
- Browser storage can be cleared or blocked. Keys and history then cannot be assumed recoverable.
