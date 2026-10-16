# Till Lab · Day 3

The case-study app for **Real-Time Sui: GraphQL Subscriptions and the Data Stack After JSON-RPC** at SuiHub Lagos. The class teaches data-stack selection, filtered subscriptions, reliable delivery, indexing, historical access and migration. Till makes those concepts visible through real testnet payments.

**Live:** https://day3-till.vercel.app

**Code:** https://github.com/Nuel-osas/day3-till

## Class agenda and readiness

The 11-slide teaching edition follows one lesson: choose the data stack, follow a payment through a reliable subscription and ledger, then migrate a call in an existing app. Each slide has presenter notes with an explanation, demonstration, classroom question, expected answer and transition.

| Advertised learning outcome | Slides | What students see or do |
| --- | --- | --- |
| gRPC, GraphQL, archive, indexing framework and workload choices | 2–5 | Trace the services and choose paths for a wallet, shop, game and analytics worker. |
| Transaction/event filters and selected fields | 6 | Compare concrete filter uses; turn a successful net shop credit into a receipt. |
| SSE over POST and streaming with fetch | 7 | Read the real request and explain why chunks need SSE framing. |
| Cursors, backfill, ordering and subscriber throttling | 8 | Follow A/B/C/D across a disconnect; choose the last durably committed position. |
| SQLite/Postgres, idempotency and when to use Rust | 8–9 (notes) | Commit rows and cursor together, restart, total the DB, and compare pipeline requirements. |
| Old receipts, query/page/time limits and production providers | 4–5, 9 | Retrieve a known old digest; inspect limits and production endpoint requirements. |
| Build Till and migrate an app | 9–11 | Run the payment/recovery/ledger lab, inspect a real before/after migration, then change an own-app call. |

**USDC readiness gap:** the event advertises USDC payments, but the built-in payment form currently sends SUI. The feed and SQLite writer process coin types generically; no funded USDC transfer has been verified. Slide 9 labels the verified lab path as test SUI. The target diagram is not evidence of a USDC run.

For the actual Wi-Fi-drop exercise, disconnect the listening device and pay from another device. **Pause feed** provides the controlled listener-only equivalent. A fully offline payer cannot submit a payment. The local SQLite writer runs separately from the Vercel app; verify its totals separately from browser totals.

## Try it

1. Choose **Demo payer** or **My wallet**. Each payer gets a personal receiving shop; there is no shared class wallet.
2. Request test SUI for the payer. The public faucet may take a minute or rate-limit requests. The shop does not need gas to receive funds.
3. Click **Open till**, wait for **Live**, then send 0.01 SUI.
4. Compare the red payer debit and green shop credit. Payer gas means the two net changes can differ.
5. **Pause feed**, send again, then **Resume feed**. The missing receipt appears with a **Recovered** tag.
6. Refresh the page and open the till again. Stored receipts should not duplicate.
7. Open **Receipt archive** and look up the supplied October 2025 transaction.

Demo keys stay in browser localStorage and are for test funds only. Clearing site data loses access to these demo keys. Connected-wallet mode explicitly signs with the selected account on `sui:testnet`. The old shared `/api/pay` signer is retired with HTTP 410. The UI reset clears tracking, not keys or onchain funds.

Use **Watch another shop** or `/?shop=0xFULL_ADDRESS` to observe or pay a specific address. Sharing the URL shares only a public address. `/pay` opens the same complete workspace.

## Local development

Node 24 and pnpm:

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
```

Vite also serves the Web Request/Response API functions in `api/`. No environment variables are needed for the browser demo, wallet connection, faucet or receipts. An optional server-only `DEEPSEEK_API_KEY` adds a short prose note to the exact session summary; the deterministic summary remains available without it.

## How it works

- gRPC reads combined coin-object and address balances and executes payments.
- GraphQL `transactions(affectedAddress)` delivers matching transactions over SSE POST.
- Successful positive net balance changes to the shop become receipts. Amounts use `BigInt` base units.
- Before the first connection, Till saves the latest indexed checkpoint. This protects recovery even if the listener disconnects before it has a cursor.
- A single versioned, per-shop snapshot stores the cursor, opening checkpoint and latest 500 receipts atomically. Reconnect uses `after`, or `afterCheckpoint` when there is no cursor.
- Digest plus normalized coin type deduplicates replay. Retries are cancelled when the shop changes or the component unmounts.
- The parser handles chunked CRLF, multiline data, keepalives, completion and GraphQL errors inside HTTP 200.
- Balance cards refresh independently every five seconds. Their deltas are changes between reads, which can include concurrent activity and gas. Pausing the feed pauses only the subscription.

“Recovered” is a UI label based on a transaction timestamp predating the connection. Browser clock differences can affect this label. The cursor and digest are the actual recovery and identity mechanisms.

## Observed limitations

Verified on public testnet on **15 October 2026**:

- A coin-object transfer arrived on the live affected-address feed.
- An address-balance `balance::send_funds` deposit confirmed onchain and changed balances, but appeared in the feed after **Catch up now**. Live filtering and historical replay differed for this tested route. Re-test this provider behaviour before teaching; it is not a permanent protocol guarantee.
- The archived digest `ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a` returned not found from the public full node, while GraphQL returned its 7 October 2025 receipt at checkpoint 250000000.
- The browser feed is bounded to 500 records and totals only the tracked UTC-day session. It is not a complete merchant ledger.
- Each transaction selection asks for the first 50 balance changes. Complex transactions with more changes need nested pagination for complete accounting.
- Public endpoints have provider-specific limits. Observed `Query.transactions` defaults: page 20, maximum 50; query payload 5,000 bytes, query timeout 40 seconds, depth 20 and nodes 300. Read current service configuration instead of hard-coding these as universal limits.

## SQLite writer

The long-running writer runs locally, separately from Vercel:

```sh
cp .env.example .env
# Set SHOP_ADDRESS to your own shop and FROM_CHECKPOINT to its opening checkpoint.
pnpm indexer
# Stop and restart it, then inspect:
pnpm totals
pnpm receipt
```

Each delivery inserts receipts and its watermark in one SQLite transaction. `PRIMARY KEY (digest, coin_type)` makes replay idempotent. Amounts are stored as text and summed using `BigInt`. Use a separate `TILL_DB` file for each shop; the writer rejects a different shop if the database already has a watermark.

The legacy `pnpm pay` CLI is optional and needs a dedicated testnet `DEMO_CUSTOMER_KEY`. This key is used only by the local CLI, never by the public app. Do not use personal or mainnet keys.

## Migration examples

```sh
pnpm migrate:legacy
pnpm migrate:grpc
pnpm migrate:graphql
```

Check JSON response bodies, not just HTTP status. On 15 October 2026 the public testnet JSON-RPC endpoint returned `-32601` inside HTTP 200. Provider availability can differ.

## Teaching assets

- [Editable PowerPoint: Real-Time Sui](teaching/Day3_Real_Time_Sui.pptx)
- [PDF deck](teaching/Day3_Real_Time_Sui.pdf)
- [Speaker notes](teaching/Day3-speaker-notes.md)
- [Verification evidence](teaching/VERIFICATION.md)

`pnpm slides` regenerates the 11-slide PowerPoint and notes from `teaching/generate-slides.cjs`. Screenshots are in `teaching/assets/`. PDF export uses the presentation rendering workflow described in `teaching/RENDERING.md`.

The older `Day3_Till_Live_Data_Seedless_Style` filenames are compatibility copies of this same teaching edition, so earlier file links also open the updated lesson.

## Deploy

```sh
vercel deploy --prod --yes --cwd /absolute/path/to/day3-till
```

The project uses Node 24. API functions allow 180 seconds for the faucet proof-of-work; the optional AI request has its own 18-second timeout. `.env*`, `.secrets`, private keys and local databases are excluded from Git and Vercel. Teaching sources are excluded from deployment, but remain in the repository.

## Primary references

- [GraphQL subscriptions announcement](https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions)
- [GraphQL RPC](https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc)
- [JSON-RPC migration](https://docs.sui.io/develop/accessing-data/json-rpc-migration)
- [Live GraphQL schema source](https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql)
- [Custom indexing framework](https://docs.sui.io/concepts/custom-indexing-framework)
