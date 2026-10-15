# Till Lab · Day 3

A personal live payments lab for SuiHub Lagos. Send real testnet SUI, pause the listener, resume missed payments, and inspect an archived receipt.

**Live:** https://day3-till.vercel.app

**Code:** https://github.com/Nuel-osas/day3-till

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
- Public endpoints have provider-specific limits. Observed `Query.transactions` defaults: page 20, maximum 50; query timeout 40 seconds, depth 20 and nodes 300. Read current service configuration instead of hard-coding these as universal limits.

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

- [Editable PowerPoint](teaching/Day3_Till_Live_Data_Seedless_Style.pptx)
- [PDF deck](teaching/Day3_Till_Live_Data_Seedless_Style.pdf)
- [Speaker notes](teaching/Day3-speaker-notes.md)
- [Verification evidence](teaching/VERIFICATION.md)

`pnpm slides` regenerates the 30-slide PowerPoint and notes from `teaching/generate-slides.cjs`. Screenshots are in `teaching/assets/`. PDF export uses the presentation rendering workflow described in `teaching/RENDERING.md`.

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
