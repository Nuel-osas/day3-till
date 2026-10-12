# Till: a live payments screen on Sui GraphQL subscriptions

Day 3 of Account Layer Week, SuiHub Lagos. Real-Time Sui: GraphQL Subscriptions and the Data Stack After JSON-RPC.

Live: https://day3-till.vercel.app (Till), https://day3-till.vercel.app/pay (customer), https://day3-till.vercel.app/receipt (archive lookup)

Till is a shop's payments screen. It subscribes to every transaction that touches the shop address, renders `+0.05 SUI from 0xbf50..60ad` with a chime, survives a network drop by resuming from its last cursor (the missed payment comes back flagged `recovered`), writes every payment to SQLite through a small indexer, looks up a year-old receipt from the archive, and closes the day with a short DeepSeek report. A `migration/` folder moves three JSON-RPC calls to gRPC and GraphQL.

No Move in this repo. Network: Sui testnet. SDK: `@mysten/sui` 2.35.

## The data stack after JSON-RPC

| Layer | What it is | Reach for it when |
| --- | --- | --- |
| gRPC (full node) | `SuiGrpcClient`, the default for app reads, execution, simulation, checkpoint streams | Wallet balances, building and sending transactions, anything "now" |
| GraphQL RPC | Indexed reads over the full history plus `subscription` over SSE | Custom selections in one round trip, filtered history, live feeds, old receipts |
| Archival store | Long-term history behind GraphQL (and providers) that full nodes have pruned | Any lookup older than the full node's retention |
| Custom indexer (Rust `sui-indexer-alt-framework`) | Your own pipeline from checkpoints into your own Postgres schema | Analytics, aggregates across many addresses, joins, guaranteed throughput |

Rule of thumb: wallet = gRPC; shop = GraphQL subscription plus a small writer (this repo); game = gRPC for moves, subscriptions for the lobby feed; analytics backend = custom Rust indexer.

## Setup from a fresh clone

Requires Node 22.6+ (uses built-in `node:sqlite` and TypeScript type stripping) and pnpm.

```bash
git clone https://github.com/Nuel-osas/day3-till && cd day3-till
pnpm install
cp .env.example .env   # fill in the four values
pnpm dev               # http://localhost:5173, serves /api/* too (see vite.config.ts)
```

`.env`:

| Var | Where it is used |
| --- | --- |
| `VITE_SHOP_ADDRESS` | Browser: the address the Till subscribes to. Override any time with `/?shop=0x...` |
| `SHOP_ADDRESS` | Server: where `/api/pay` sends the demo payment. Fixed by env, never by the request |
| `DEMO_CUSTOMER_KEY` | Server: `suiprivkey1...` of a testnet wallet with a little SUI. Never shipped to the browser |
| `DEEPSEEK_API_KEY` | Server: the Close the till report |

Deploy: `vercel deploy --prod --yes --cwd /absolute/path/to/day3-till`, with the same four vars set in Vercel.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Till, /pay, /receipt and the two API functions locally |
| `pnpm pay [mist] [coinType] [coin\|address-balance]` | Demo customer pays the shop from the terminal |
| `pnpm indexer` | Subscription to SQLite writer, resumes from the stored cursor. `FROM_CHECKPOINT=n` backfills on the first run |
| `pnpm totals [YYYY-MM-DD]` | End of day totals per coin from `till.db` |
| `pnpm close [YYYY-MM-DD]` | Close the till from the database (posts to `/api/close`) |
| `pnpm receipt [digest]` | Archive lookup: gRPC says not found, GraphQL returns the receipt |
| `pnpm migrate:legacy` / `migrate:grpc` / `migrate:graphql` | JSON-RPC before, gRPC and GraphQL after |

## How it works

### The subscription (src/lib/till.ts)

```graphql
subscription Till($shop: SuiAddress!, $after: String, $afterCheckpoint: UInt53) {
  transactions(filter: { affectedAddress: $shop, afterCheckpoint: $afterCheckpoint }, after: $after) {
    cursor
    node {
      digest
      sender { address }
      effects {
        status timestamp checkpoint { sequenceNumber }
        balanceChanges(first: 50) { nodes { owner { address } coinType { repr } amount } }
      }
    }
  }
}
```

A transaction is a payment only when the shop's balance change is positive, so a refund or sweep out of the shop is skipped. Any coin type works; decimals and symbol come from `coinMetadata(coinType:)`.

### The transport (src/lib/sse.ts)

Subscriptions are Server-Sent Events over `POST https://graphql.testnet.sui.io/graphql/subscriptions`, not websockets. `EventSource` can only GET, so it cannot open them. We `fetch` with a JSON body and parse `event: next` / `data: {...}` frames from the `ReadableStream`. The same 50 line file runs in the browser and in Node. The endpoint sends `access-control-allow-origin: *` and answers the preflight, so the browser connects directly with no proxy. The server sends `: keep-alive` comments about every 15 seconds.

### Never missing a payment (src/useTill.ts)

Every delivery carries an opaque cursor. The Till stores it in `localStorage` after every delivery (payment or not). On reconnect it passes `after: cursor`: the service backfills everything after that point through the scanning API, then hands over to the live stream. `after` is exclusive. Ordering is by checkpoint, then position in the checkpoint. Payments whose timestamp is older than the reconnect moment are flagged `recovered`. Dedupe is on `digest + coinType`, so a replay never double counts.

### The lightweight indexer (indexer/)

One subscription, one SQLite file (`node:sqlite`, no native build). Each delivery's payments and the new cursor are written in a single transaction, `INSERT OR IGNORE` on primary key `(digest, coin_type)`. Restart resumes from the stored cursor. Rewinding the cursor replays deliveries as no-ops (`dup` in the log). Amounts are stored as text and summed as BigInt.

When you have outgrown it: many addresses or the whole chain, aggregates and joins, reprocessing history with new logic, or a throughput SLA. Then move to the Rust custom indexing framework (`sui-indexer-alt-framework`), which reads checkpoints directly and writes to Postgres with its own watermarks and pipelines. Subscriptions are per-subscriber throttled and served by a shared public service; your indexer should not depend on one stream for money you must account for.

### Archive lookup (src/lib/receipt.ts)

`transaction(digest:)` with effects and balance changes. Default digest `ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a` is from checkpoint 250000000 (7 Oct 2025). The testnet full node over gRPC returns `Transaction ... not found` because it has pruned it; GraphQL returns it from the archival store.

### Close the till (api/close.ts)

The browser (or `pnpm close` from the database) sends amounts, symbols, short senders and times. The function computes the totals in code, hands them to `deepseek-flash` with `thinking: { type: 'disabled' }`, and returns a short report. No keys or full addresses leave the server.

## Demo script for class

1. Open https://day3-till.vercel.app on the projector, press Open till (unlocks audio). Pill goes LIVE.
2. Open /pay in a second window. Pay from demo customer, 0.05 SUI. Till chimes within about a second of the transaction finalising.
3. Tick Kill network. Pill goes OFFLINE. Pay again from /pay. Nothing appears.
4. Untick. The Till resumes with the stored cursor, the missed payment lands with a `recovered` tag.
5. Switch /pay to "send_funds to address balance" and pay while LIVE: it does not appear (gotcha below). Kill and resume: it comes back from backfill.
6. Terminal: `pnpm indexer` (resumes, stores the new payments), Ctrl-C, pay twice, `pnpm indexer` again (catches up), `pnpm totals`.
7. /receipt: look up the October 2025 digest. Then `pnpm receipt` to show gRPC not found vs GraphQL found.
8. Close the till.
9. `pnpm migrate:legacy` (real error from the Foundation node), then `migrate:grpc` and `migrate:graphql`.
10. Students: open `/?shop=0xTHEIR_ADDRESS` and pay themselves from a wallet.

## JSON-RPC migration

The Foundation full nodes now answer every JSON-RPC method with this (captured 2026-10-12, mainnet and testnet, HTTP 200):

```json
{"jsonrpc":"2.0","error":{"code":-32601,"message":"Method not found. JSON-RPC on public fullnodes has been deprecated. Please migrate to gRPC or GraphQL endpoints. See https://docs.sui.io/develop/accessing-data/json-rpc-migration for more information."},"id":null}
```

Note the HTTP 200: a health check that only looks at status codes will say the node is fine.

| JSON-RPC | gRPC (`SuiGrpcClient`) | GraphQL (`SuiGraphQLClient` or raw query) |
| --- | --- | --- |
| `suix_getBalance` | `getBalance({ owner })` returns `balance`, `coinBalance`, `addressBalance` | `address(address:) { balance(coinType:) { totalBalance coinBalance addressBalance } }` |
| `suix_getAllBalances` | `listBalances` (paginate) | `address { balances { nodes { ... } } }` |
| `sui_getObject` / `sui_multiGetObjects` | `getObject` / `getObjects` | `object(address:)` / `multiGetObjects` |
| `sui_getTransactionBlock` | `getTransaction({ digest, include })`, result is `Transaction \| FailedTransaction` | `transaction(digest:) { effects { ... } }` (reaches archived history) |
| `suix_queryTransactionBlocks` | `listTransactions` | `transactions(filter:)` |
| `suix_queryEvents` | `listEvents({ filter: { eventType } })` (normalize the type first) | `events(filter: { type })` |
| `sui_executeTransactionBlock` | `executeTransaction` / `signAndExecuteTransaction` | same methods on `SuiGraphQLClient` |
| `sui_dryRunTransactionBlock` | `simulateTransaction` | `simulateTransaction` |
| `suix_subscribeEvent` (websocket, long dead) | `subscriptionService` checkpoint stream | `subscription { events(filter:) }` over SSE |

## Limits (from `Query.serviceConfig` on testnet, 2026-10-12)

`maxQueryPayloadSize` 5000 bytes, `maxTransactionPayloadSize` 174763, `defaultPageSize` 20, `maxPageSize` 50, `maxMultiGetSize` 200, `queryTimeoutMs` 40000, `mutationTimeoutMs` 74000, `maxQueryDepth` 20, `maxQueryNodes` 300.

The public endpoints are for development. Before launch move to a provider (QuickNode, BlockPi, Ankr, ZAN, Inodra, NodeInfra, 01.ro, Triton One for GraphQL). Keep the endpoint in config: SUBSCRIPTIONS_URL and GRAPHQL_URL in `src/lib/till.ts`.

## Gotchas we hit building this

1. Live `affectedAddress` subscriptions do not deliver `balance::send_funds` deposits to the receiver. Verified 3 times on testnet (Hpj1A1.., F3nkoa.., 4brXid..): the same transactions show up in the query `transactions(filter: { affectedAddress })` and in the subscription backfill after a resume, but never on the live stream. Coin object transfers are delivered live. The `sentAddress` live filter does see the send_funds transaction from the payer side. If your payers use address balances, resume periodically or reconcile with the indexer.
2. Schema docstrings still say every subscription "is not yet available for use". `transactions`, `events` and `checkpoints` all stream on testnet.
3. Errors arrive inside the stream as an `event: next` with `{"data":null,"errors":[...]}` and HTTP 200, not as an HTTP error.
4. `EventSource` cannot POST. Use `fetch` and parse frames; normalise CRLF; skip `:` keep-alive comments.
5. gRPC `listEvents` rejects short addresses in type names (`0x3::validator::...` gives `INVALID_ARGUMENT invalid address`). Use `normalizeStructTag`. JSON-RPC and GraphQL accepted the short form.
6. The full node gRPC API returns "not found" for old transactions (pruned). GraphQL found them through the archival store.
7. `deepseek-flash` reasons by default; reasoning tokens count against `max_tokens` and content came back empty until `thinking: { type: 'disabled' }`. It also miscounted recovered payments until the totals were computed in code.
8. Browsers block audio until a user gesture, hence the Open till button.
9. `serviceConfig.defaultPageSize` and `maxPageSize` now take `type` and `field` arguments.
10. Store the cursor after every delivery, not only payments, or a restart rescans non-payment transactions.

## Verified on testnet (2026-10-12)

Shop `0xe0669d8fdb7e6cb69e0efb2bb4138803a9e47bf68846664335e40360d366941c`, demo customer `0xbf5048665f0dcdc31bd6a41945716b5b930c7e734b2e9d2b4a492dd8e46060ad`.

| What | Digest |
| --- | --- |
| Live payment on production Till (coin) | `cB7274mamoSpYpavnf9bXU2a74aFCLGir6b3rxCWcRQ` |
| Paid while network killed, recovered by backfill | `62U88xCGoSHNR1McfA5y1JuQFDM6RL7SLVDWTYm6w7tr` |
| send_funds, missed live, recovered by backfill | `4brXidXqJxusxqU4SbBbdQ4WANbXcQKd5LGQ2QKVxYiz` |
| Local run: live / recovered | `Ppdui9P387WZwFEsWDJL1t9pF4qhvNKD71Hr7kPV1ji` / `ASrznVdgu5Ey32gvsokpK9mu3fcRfzKj6kbXGBL645Yv` |
| Indexer resume after restart (paid while stopped) | `DtgVH1Lj6vAzxc9XT1HMpHwYDaqQJLyGj4W2W7sU8Y8E`, `AcVWqoVLqENMMQy47tARhR7K1xGe1dxQoBsV3CnBEhg5` |
| First payment (send_funds) | `Hpj1A1BzoXVGtYJowz2raEVo1gxz8oHGvARNNXdUmDkG` |
| Archived receipt (Oct 2025) | `ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a` |

Not verified: USDC payments (the demo wallet has no testnet USDC; the code path is coin-type generic and the receipt page renders a non-SUI coin), per-subscriber throttling limits (not hit), the `function` transaction filter delivering live (validated, no matching traffic observed in 10 s).

## Links

- GraphQL RPC: https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc
- Subscriptions announcement: https://sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions
- JSON-RPC migration: https://docs.sui.io/develop/accessing-data/json-rpc-migration
- Archival store: https://docs.sui.io/develop/accessing-data/archival-store
- RPC providers: https://docs.sui.io/develop/accessing-data/rpc-providers
- Schema source: `crates/sui-indexer-alt-graphql/schema.graphql` in MystenLabs/sui
