# Day 3: Real-Time Sui

Teaching edition: 16 October 2026. Exactly 18 slides.

## Before class

- The event target is USDC. The browser form sends SUI; a funded USDC end-to-end run has not passed. Disclose the test-SUI fallback. The target diagram is not verified USDC behaviour.
- Use Day3_Real_Time_Sui.pptx, not the original October 12 Day3_Till_Live_Data.pptx. The lesson follows: choose the stack, build a reliable feed, then migrate an existing app.
- Open the app, repo, GraphQL IDE and two terminals. Use Node 24 and Sui testnet. Each student has their own payer and shop.
- Run the SQLite writer separately. Save the opening checkpoint before payments. The writer is not a long-running Vercel worker.
- For real Wi-Fi loss, pay from a second device while the listening device is offline. Pause feed is the controlled listener-only equivalent.
- Check chime through a user gesture and physical wallet approval. These remain manual checks.
- Slide 1: the promise. Slides 2-3: the Sui stack after Basecamp (7 to 8 October). Slide 4: who serves Sui data now. Slides 5-6: choose the data stack. Slides 7-15: explain and build the data path. Slide 16: full lab. Slides 17-18: migration.

## Additional gotchas to explain during the lab

- HTTP 200 can contain GraphQL or JSON-RPC errors. Inspect the body.
- Coin transfers arrived live; an address-balance deposit arrived after catch-up. Retest provider behaviour; this is not a permanent protocol rule.
- Faucets can delay or rate-limit. Node 24 and a sufficient function timeout fixed the deployed funding path.
- The browser retains 500 receipts, selects the first 50 balance changes per transaction and refreshes balances separately every five seconds. It is not complete accounting.
- Scope cursor/query state per network and shop. Stop stale streams on account changes. Reset clears tracking, not funds. Clearing site data loses demo keys.
- Generic coin receipts do not make the SUI form a USDC demo. Verify funding, decimals, accepted type, payment, stream, database and totals for USDC end to end.
- Full-node gRPC does not automatically reach pruned history. Use the archive or archive-backed GraphQL.
- Some official docs and schema availability descriptions lag the 21 September launch and recorded live tests. Use current field names while checking availability with actual deliveries.
- Event filters reject module and type together. The gRPC migration example needs normalized type addresses.
- Throttle thresholds, production load and a Rust pipeline have not been tested. Bound work and use reconnect backoff.

## Verified testnet evidence

- Live payment: H1fQ22Q5V6yt37GaiySNqGhUJR7ki4b35Te9Qcja9Bqn
- Paused then recovered: 66XRjyGEKngFwGZntzULDr6v4hrwFPnR8ZmY9fmPW6Zh
- Address-balance catch-up: 5crvrKsvQGU3emZvNCEJgKjpAwENtCHHxfY4UMy11Dcc
- Old receipt: ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a, 7 October 2025, checkpoint 250000000.
- These payment proofs are SUI, not USDC. Details: teaching/VERIFICATION.md.

---
## 01. Real-Time Sui

EXPLAIN
Today has three connected outcomes: choose the right Sui data interface, build a reliable live feed through Till, and migrate a read in your own app. This is the advertised GraphQL subscriptions and post-JSON-RPC data-stack session. Till supplies a concrete problem for the architecture.

SHOW / DO
Open the live app and repository before class. Ask students to keep a project with a JSON-RPC read ready. Use Node 24 for the supplied repository, pnpm and testnet funds. No Move code is required.

ASK THE ROOM
Which part of your app still polls or uses JSON-RPC?

EXPECTED ANSWER
Collect one example from a wallet, game, payments screen or backend. Return to it on the final slide.

TRANSITION
Separate the data responsibilities that used to sit behind one familiar API.

## 02. The Sui stack, after Basecamp.

EXPLAIN
Sui Basecamp ran in Singapore on 7 and 8 October. The theme was the agentic economy. Before we zoom into data, this is the whole stack as it stands today, layer by layer, with what a builder can actually touch. Days 1 and 2 of this week sit in the accounts and money row. Today sits in the data row, which every other row depends on.

SHOW / DO
Walk top to bottom. Apps and agents: Samsung Wallet brings gasless USDC on Sui to 82 million US Galaxy phones from the last week of October, with Bastion custody; Slush added deposits from 25 chains and yield; DeepBook App exposes an API for agents. Agent payments: Sui Agent Payments lets agents pay per call in stablecoins over HTTP 402 (x402 and MPP), with Alibaba Cloud as the first big partner; the gateway is on testnet and paid calls are invite only. Payment Kit and an open x402 facilitator are public. Sui Agent Pass (policies limiting what an agent can spend, enforced with Seal) was announced with no docs yet. Accounts and money: passkeys and address aliases (Day 1), native allowances (Day 2, testnet), address balances, and Circle CCTP V2 live for native USDC across 29 chains. Throughput: a 40.6M TPS peak inside 10,000+ programmable tunnels, offchain and settled to mainnet; no tunnels SDK yet. Data: JSON-RPC is off on Foundation nodes; gRPC, GraphQL with subscriptions (mainnet 21 September), the archive and the custom indexer replace it. Storage and privacy: Walrus, the new managed Walrus Console with an API and an MCP server, and Seal encryption. Infra and tools: AWS, Google Cloud and Alibaba Cloud for nodes, MystenLabs/skills and the Sui docs MCP.

ASK THE ROOM
Which rows does your current app touch?

EXPECTED ANSWER
Almost every app touches accounts and data. Agent apps add agent payments; media and AI apps add Walrus.

TRANSITION
What does all this change for the way an app reads the chain?

REFERENCES
https://sui.io/basecamp ; https://sui.io/agentpayments ; https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions ; agentic-week/basecamp-2026-readout.md

## 03. What Basecamp changes for your data layer.

EXPLAIN
Basecamp did not ship a new data API; the data stack landed in July (JSON-RPC off) and September (subscriptions). What Basecamp changed is who reads the chain and how much. Six consequences for anyone building an app now.

SHOW / DO
One: agents are now clients. With Agent Payments an agent pays per call and acts on what it sees, so it needs a live feed instead of polling every few seconds. Two: Samsung Wallet puts gasless USDC on 82 million phones. A shop screen fed by those payments has to survive a Wi-Fi drop without losing a sale, which is the cursor lesson. Three: address balances and allowances move funds without a coin object. Watch balance changes in transaction effects, not coin objects. In our own tests an address-balance deposit appeared only after catch-up, so always backfill. Four: the 40.6M TPS run happened inside tunnels offchain; only settlements reach mainnet, so your feed sees the settlement, not every tunnel message. Five: Walrus Console and the Google Cloud Arbiter put files, agent memory and proofs on Walrus; index the pointer on Sui and fetch the blob from Walrus. Six: Sui named AWS, Google Cloud and Alibaba Cloud for nodes. Public endpoints are for development; production runs on a provider or your own node, with quotas you check.

ASK THE ROOM
Which of the six hits your app first?

EXPECTED ANSWER
For most of the room: live feeds and cursors (one and two). Payment apps also need three.

TRANSITION
Map each kind of read to the service that should answer it.

REFERENCES
https://sui.io/agentpayments ; https://console.walrus.xyz ; agentic-week/basecamp-2026-readout.md ; teaching/VERIFICATION.md

## 04. Who serves Sui data now.

EXPLAIN
The public Sui Foundation endpoints (fullnode, graphql and archive.mainnet.sui.io) are rate limited and meant for development and public-good access. The migration guide says not to point a production wallet, exchange or indexer at them: run your own full node or contract a provider. Providers now fall into three groups. Full stack: gRPC, GraphQL RPC and the Archival Store as a managed service. gRPC nodes: full-node gRPC only. Indexed data and streams: ready-made APIs and pipelines on top of the chain.

SHOW / DO
Full stack, per the docs table: QuickNode, Ankr, BlockPI, ZAN, Inodra and Triton One offer gRPC, GraphQL and archive on mainnet; ZAN lists all three on testnet too. NodeInfra and 01.ro offer gRPC and GraphQL without archive. The Sui blog named QuickNode, Ankr, BlockPI and ZAN as the four launch partners for the full stack. gRPC only: Alchemy, Dwellir, BlockVision, Natsai, GetBlock. Indexed data and streams, from the Sui Foundation awesome-sui list: Sentio (custom processors), Surflux (APIs and real-time streams), BlockVision (token, NFT and DeFi APIs), Blockberry (Suiscan API), Space and Time (verifiable warehouse), ZettaBlock (SQL to GraphQL or REST), Birdeye (market data), Dubhe Indexer (config-driven events). Honesty points: most providers list GraphQL on mainnet only; the docs still say GraphQL does not support subscriptions, which is out of date (we stream them live on testnet and mainnet), and we have not tested subscriptions on any provider, so ask each one. Archive: full-node gRPC never falls back to the archive, so gRPC clients call an archival endpoint directly.

ASK THE ROOM
Your app needs live payments plus a two-year-old receipt. What do you ask a provider?

EXPECTED ANSWER
Do you serve GraphQL subscriptions over SSE, on which networks, and is the archive connected to your GraphQL or a separate gRPC endpoint? Then quotas and price.

TRANSITION
With the providers in view, map each kind of read to the right service.

REFERENCES
https://docs.sui.io/develop/accessing-data/rpc-providers ; https://github.com/sui-foundation/awesome-sui ; https://www.sui.io/blog/graphql-archival-store-sui-data-stack ; https://docs.sui.io/develop/accessing-data/json-rpc-migration

## 05. Replace the data path your app depends on.

EXPLAIN
Foundation mainnet JSON-RPC was disabled in the week of 27 July 2026; source removal was scheduled for mid-October. Availability at other providers can differ. The 21 September announcement adds GraphQL subscriptions. Application responsibilities remain, but can now use different interfaces.

SHOW / DO
Classify a screen: read the balance, observe a new payment, retrieve an old receipt. The same app can use more than one interface.

ASK THE ROOM
Would replacing every JSON-RPC URL with one GraphQL URL complete a migration?

EXPECTED ANSWER
No. Request types, selected fields, response shapes, errors, pagination and streaming transport must be adapted.

TRANSITION
Place those interfaces on a map, including the services behind them.

REFERENCES
https://docs.sui.io/develop/accessing-data/json-rpc-migration ; https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions

## 06. Where each piece sits in the data stack.

EXPLAIN
Read the upper path left to right: finalized Sui data reaches services; GraphQL selects and resolves the app view. The archive supplies retained history when configured. A custom indexer is an alternative owned processing path, not a mandatory layer for every frontend. A wallet can combine direct gRPC operations and GraphQL activity. These boxes describe our chosen architecture, not exclusive capabilities of each protocol.

SHOW / DO
Trace a live payment through gRPC checkpoint data to the GraphQL subscription and browser. Trace a historical point lookup through the archive. Point to the lower custom-indexer path for owned analytics.

ASK THE ROOM
Does a hosted GraphQL subscription mean there is no indexing infrastructure?

EXPECTED ANSWER
The provider runs the data service. The app avoids operating a full indexing pipeline merely to consume a feed.

TRANSITION
Apply the map to the shop workflow promised in the announcement.

REFERENCES
https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions ; https://docs.sui.io/develop/accessing-data/custom-indexer

## 07. Till: follow one payment all the way through.

EXPLAIN
The event promises a USDC shop screen. Use an illustrative 1 USDC sale: customer authorizes transfer, shop receives it, subscription delivers the receipt, durable writer records it for totals. Gas is in SUI. These are target behaviours, not a claim that the existing browser form sends USDC.

SHOW / DO
Open the live app. Its built-in payment form and balance cards are SUI-only. Verified SUI paths cover live delivery, recovery, deduplication and the ledger. A funded USDC acceptance run remains unfinished. State this before using the SUI fallback. The receiver and writer accept generic coin types, but a USDC till should restrict accepted coin type and use metadata decimals.

ASK THE ROOM
Which proves the shop was paid: the send button, a balance refresh, or the confirmed receipt?

EXPECTED ANSWER
Use the successful onchain transaction and positive shop balance change. The submit result and balance card alone do not identify a sale.

TRANSITION
Choose the subscription that provides the receipt evidence.

## 08. Filter for the activity your app needs.

EXPLAIN
A transaction subscription gives effects such as balance changes. An event subscription gives emitted application data, when a contract emits that event. Till requires no new payment event or Move contract. Affected address is broad: sender, sponsor or recipient may match. Exact field names below were checked against testnet on 16 October.

SHOW / DO
Open PAYMENTS_SUBSCRIPTION in src/lib/till.ts and compare EventFilter in the live IDE. The current schema rejects module and type together in one event filter. The transaction sender field is sentAddress; the event sender field is sender.

ASK THE ROOM
The shop refunds a customer. Does affectedAddress still match?

EXPECTED ANSWER
Yes. A match is a candidate. Receipt logic must check success and balance-change direction.

TRANSITION
Select enough fields to validate the candidate and render a receipt.

REFERENCES
https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql ; teaching/evidence/graphql-schema-2026-10-16.json

## 09. A matching transaction becomes a receipt.

EXPLAIN
This is the full repository subscription, with whitespace adjusted. Cursor is delivery progress. Digest identifies the transaction. Status rejects failures. Owner, coin type and signed amount let the client calculate the shop credit. Checkpoint and timestamp place the receipt in history.

SHOW / DO
Trace paymentsFrom in src/lib/till.ts: SUCCESS, normalize owner, sum signed changes per normalized coin type with BigInt, retain only positive net credits. The writer groups receipts by digest and coin. Illustrative USDC case: 1000000 base units with six decimals means 1 USDC, after confirming metadata. An accepted-USDC-only rule is a further application requirement; the generic parser currently accepts all coins.

ASK THE ROOM
Why sum all changes for a coin instead of selecting the first positive row?

EXPECTED ANSWER
One transaction can contain debits and credits. Net change tells whether the shop gained the asset.

TRANSITION
The query describes what we want. Open a connection that keeps delivering it.

REFERENCES
src/lib/till.ts

## 10. One POST request. Many SSE deliveries.

EXPLAIN
The request sends the GraphQL document and variables as JSON. The response stays open and sends SSE frames over POST /graphql/subscriptions. Native EventSource cannot send this POST body; websocket clients use a different protocol. Fetch exposes a readable stream.

SHOW / DO
Open src/lib/sse.ts. The shown fetch is a real excerpt, reformatted. Continue into the parser: chunks can split an SSE frame, blank lines end frames, comments can be keepalives, and errors can arrive inside HTTP 200. onNext is awaited before advancing. Seven existing tests include framing and error cases.

ASK THE ROOM
Can each reader.read() be treated as one complete GraphQL message?

EXPECTED ANSWER
No. Network chunks and SSE message boundaries differ. Buffer and parse complete frames.

TRANSITION
A stream can end. Keep the position from which we can safely resume.

REFERENCES
src/lib/sse.ts; tests/

## 11. The connection drops. The payments do not.

EXPLAIN
A, B, C and D are illustrative teaching labels, not real digests or cursor encodings. Save A and cursor cA. Disconnect while B and C finalize. Reconnect with after cA. The service delivers B and C, then D live. With no cursor yet, a saved opening checkpoint supplies the first boundary through filter.afterCheckpoint, which is exclusive.

SHOW / DO
Chain progress continues while the listener is offline. Use Pause feed for the controlled demo. Save the opening checkpoint before the first stream and first payment. Never decode or invent cursors. Scope state to network, shop and query. Within a checkpoint, transactions follow their position; events follow transaction position then event position.

ASK THE ROOM
B reaches the browser but its database commit fails. Which cursor is safe to save?

EXPECTED ANSWER
Keep cA. Replay B on reconnect. The cursor must describe durably processed data, not merely received bytes.

TRANSITION
Make the database commit and cursor update one operation.

REFERENCES
https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql ; src/useTill.ts; indexer/indexer.ts

## 12. Replay safely. Count each receipt once.

EXPLAIN
Two guarantees matter. A unique receipt key prevents duplicate counting. One database transaction commits rows and progress together. The repo uses PRIMARY KEY (digest, coin_type) and INSERT OR IGNORE; a cursor-only receipt key is insufficient when one transaction credits several coins. The cursor is a progress watermark. Postgres needs the same atomicity and uniqueness.

SHOW / DO
Open indexer/db.ts and indexer/indexer.ts. The real source rolls back on failure, and saves the cursor even if a matching transaction has no incoming payment. The displayed code is the transaction body; catch/ROLLBACK follows it. Run pnpm indexer, stop it, pay, restart, then pnpm totals with the UTC date. The verified SUI ledger kept three receipts totalling 0.03 SUI without duplication.

ASK THE ROOM
The process crashes after COMMIT but before logging success. What happens?

EXPECTED ANSWER
Rows and cursor are durable. Replaying cannot add the same digest and coin again.

TRANSITION
Decide when this writer is enough and when to own a checkpoint pipeline.

REFERENCES
indexer/db.ts; indexer/indexer.ts; indexer/totals.ts

## 13. When does a small writer stop being enough?

EXPLAIN
The announcement offers subscriptions as a lighter path for apps that do not need a full pipeline. Choose by workload. A selected feed can use TypeScript and SQLite or Postgres. Broad checkpoint processing, controlled reprocessing and owned models can justify the Rust framework. There is no universal throughput threshold.

SHOW / DO
Compare the paths. In the custom framework, process transforms checkpoint data, commit stores results, and prune can enforce retention. This class does not implement Rust. The supplied TypeScript writer is a long-running local process, separate from the Vercel browser app.

ASK THE ROOM
You need all swaps across many packages and a year of recomputed aggregates. Which path fits?

EXPECTED ANSWER
Investigate an owned checkpoint pipeline and a database designed for the aggregates; benchmark processing and recovery.

TRANSITION
Even a small app needs a path beyond full-node retention.

REFERENCES
https://docs.sui.io/develop/accessing-data/custom-indexer

## 14. An old receipt needs retained history.

EXPLAIN
Full nodes may prune history. A full-node gRPC endpoint does not automatically route every old lookup to the archive. The separate archival service supports retained point lookups; a GraphQL operator can configure an archive-backed path. Finding one digest differs from scanning every historical payment.

SHOW / DO
Run pnpm receipt or use Receipt archive. On 15 October this exact testnet digest returned not found from the public full node, while GraphQL returned SUCCESS at 2025-10-07T22:04:44.571Z and checkpoint 250000000. The app retains the digest and labels the source. A random not-found response cannot establish pruning; compare network, digest and a known alternate result.

ASK THE ROOM
Does an archive lookup prove your local daily ledger is complete?

EXPECTED ANSWER
No. Completeness requires a starting boundary and successful processing over the needed range.

TRANSITION
Account for service limits and failures before production.

REFERENCES
https://docs.sui.io/develop/accessing-data/json-rpc-migration ; src/lib/receipt.ts; scripts/receipt.ts; teaching/VERIFICATION.md

## 15. Build for limits, reconnects and changes.

EXPLAIN
Limits belong to a service. Testnet serviceConfig was rechecked on 16 October: query payload 5000 bytes, query timeout 40 seconds, Query.transactions default page 20 and max 50. These are query settings, not stream lifetime. Per-subscriber throttling can slow or end a stream; it does not follow a fixed threshold inferred from those numbers.

SHOW / DO
Read serviceConfig in the IDE. Ask a production provider about POST SSE, auth, quotas, retention and downtime. Bound consumer work and retry with backoff from committed progress. In Till, a shop change cancels the old connection and switches stored state. Reset clears tracking, not onchain funds. A query version change needs a deliberate replay boundary.

ASK THE ROOM
A balance rises but no receipt appears. What do you check?

EXPECTED ANSWER
Digest, success, network, shop, filter semantics, index lag and catch-up. A balance delta is not a receipt. The tested address-balance deposit appeared only after catch-up.

TRANSITION
Run the lab with an observable pass criterion for each step.

REFERENCES
teaching/evidence/graphql-schema-2026-10-16.json; teaching/VERIFICATION.md; https://docs.sui.io/develop/accessing-data/json-rpc-migration ; https://docs.sui.io/develop/accessing-data/graphql/query-with-graphql

## 16. Lab: prove each part of the payment journey.

EXPLAIN
Use the verified test-SUI fallback explicitly. The event target remains USDC. A funded USDC run, physical wallet approval and audible chime are not yet verified. This runbook does not claim those checks passed. Every student has a separate payer and shop.

SHOW / DO
1. Clone the repo; use Node 24, pnpm install and pnpm dev, or open the live app. Copy your shop. Request test SUI. Enable sound with a click.
2. Open till and send 0.01 SUI. Match digest, receipt and red/green balance movement; payer pays gas. Check the chime audibly.
3. Pause feed, pay again, Resume. This stops only the listener. For real Wi-Fi loss, use a second device to pay while the till device is offline. The disconnected device cannot submit a network transaction.
4. Reload and reopen; expect no duplicate.
5. Copy .env.example, set SHOP_ADDRESS, FROM_CHECKPOINT to the opening boundary, and separate TILL_DB. Run pnpm indexer. Stop, pay, restart, run pnpm totals. Never share a database across shops.
6. Use slide 14’s old receipt. Record each result. Browser totals alone do not validate the database writer.

ASK THE ROOM
Why does the Wi-Fi-drop test need a second device?

EXPECTED ANSWER
Only the listener is offline; the payer still needs network access.

TRANSITION
Apply these data decisions to an existing JSON-RPC integration.

REFERENCES
README.md; teaching/VERIFICATION.md

## 17. Migrate the client, then check the response.

EXPLAIN
The old client calls getBalance over JSON-RPC. SuiGrpcClient exposes a typed balance wrapper. Adapt the response; do not reuse the old object shape blindly. Inspect totalBalance, coinBalance and addressBalance. The GraphQL alternative selects Address.balance and joins receipt and event data.

SHOW / DO
Open migration/legacy-jsonrpc.ts and migration/migrated-grpc.ts. Panels use their imports, construction and calls, reformatted. Run pnpm migrate:legacy, pnpm migrate:grpc and pnpm migrate:graphql. The old public endpoint previously returned -32601 inside HTTP 200; provider behaviour varies. Other examples replace getTransactionBlock with getTransaction and queryEvents with listEvents. Normalize event type addresses in the gRPC example.

ASK THE ROOM
What changes besides the imported client class?

EXPECTED ANSWER
Result shape, errors, selected fields, pagination and fresh API cursors.

TRANSITION
Each student migrates one call from a project they brought.

REFERENCES
migration/; https://docs.sui.io/develop/accessing-data/json-rpc-migration

## 18. Your app: replace one call and prove it works.

EXPLAIN
The final workshop is on students’ own projects. Give students without a project Till’s migration folder. The deliverable is a working change, not a verbal claim of migration.

SHOW / DO
Allow 25 to 35 minutes. Find one JSON-RPC read or polling loop. State the screen’s need, choose the replacement and edit the code. Verify a known balance or transaction. For a feed, demonstrate disconnect and replay. For history, test an old digest and retention path. Name the production provider and quotas. Ask two students to show the diff and explain their choice.

ASK THE ROOM
Show the changed call, its new result, and the failure case you tested.

EXPECTED ANSWER
A reviewable diff, a known-data check and a relevant failure or recovery check. The data-service choice is part of the answer.

TRANSITION
Return to the examples collected on slide 1. Each student should be able to explain which service handles each app responsibility.

REFERENCES
https://github.com/Nuel-osas/day3-till ; https://day3-till.vercel.app
