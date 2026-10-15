## 01. ACCOUNT LAYER WEEK / DAY 03

Today we build Till: a live payments screen. Days 1 and 2 dealt with identity and permission. Day 3 makes the resulting activity visible. Start by opening the live app; everyone will get a personal payer and a personal shop. All payments in this class use Sui testnet. No Move deployment is required for Till.

## 02. An account becomes an experience.

Connect the sessions without conflating them. Till does not create an allowance or execute a recurring payment. It listens for payment transactions, whether a wallet or another app initiates them. A UI subscription also does not schedule anything onchain. The lesson is dependable observation.

## 03. Meet your live till.

Open https://day3-till.vercel.app. Explain the visual hierarchy: personal payer and shop, money flow, stream status, payment feed, test payment controls. The app uses real testnet transactions. A green receipt is created from an indexed successful positive net balance change to the watched shop. The balance cards read gRPC independently of the subscription.

## 04. Build it. Break the connection. Recover.

By the end students should explain the four data layers, use transaction and event filters, consume SSE over POST, resume from a cursor or checkpoint, write idempotently to SQLite or Postgres, find an archived transaction, respect service limits and migrate a JSON-RPC call. We will also discuss when a Rust checkpoint indexer is the better tool.

## 05. Four layers. Four different jobs.

gRPC serves the full node interface, including transaction execution. GraphQL is an indexed service with expressive selections and subscriptions. Archival storage keeps history beyond a node retention window; an arbitrary gRPC endpoint does not automatically query it. A custom indexer owns a derived model in your database. Source: https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc

## 06. Choose for the job you are doing.

These are architectural choices, not exclusive product categories. A wallet can use both gRPC and GraphQL. Till is a narrow address feed, so a lightweight subscription writer is a reasonable teaching example. An analytics backend that needs every checkpoint and complex aggregates benefits from a custom pipeline. Source: https://docs.sui.io/concepts/custom-indexing-framework

## 07. The migration is already real.

Do not say every provider has removed JSON-RPC. The official migration page says Foundation mainnet disablement began the week of July 27 and source-code removal was planned for mid-October. Today we independently called the public testnet endpoint and received -32601 even though HTTP status was 200. Subscriptions were announced September 21 for both networks. Sources: https://docs.sui.io/develop/accessing-data/json-rpc-migration and https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions

## 08. 01 / LISTEN

Pause to ask the room what happens when a cashier loses Wi-Fi. A successful payment does not depend on the cashier’s browser hearing it. We need to separate chain finality from delivery to an app and from local durable storage.

## 09. One document. Any shop.

Read the actual subscription in the repository. affectedAddress narrows candidates to this shop. after is a stream cursor; afterCheckpoint establishes an opening boundary when there is no cursor yet. The payload includes only the fields used to derive receipts. Balance changes are bounded to 50 here, sufficient for the small demo transactions but not a universal accounting guarantee. Source: live schema introspection, 15 October 2026; https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql

## 10. Filter the activity you care about.

The current schema exposes transactions, events and checkpoints subscription fields. TransactionFilter fields observed today are affectedAddress, affectedObject, function, kind, sentAddress, afterCheckpoint, atCheckpoint and beforeCheckpoint. EventFilter exposes sender, module, type and the same checkpoint bounds. Not every filter combination was load-tested. Choose event types for application-specific semantic events, while Till derives receipts from transaction balance changes. Source: live schema introspection and https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql

## 11. The transport is an HTTP POST.

This is the repository code that opens the stream. The response is text/event-stream. EventSource cannot send the GraphQL POST body, so Till uses fetch and a stream reader. The shared parser handles keepalive comments, split CRLF frames, multi-line data and complete events. It treats GraphQL errors inside HTTP 200 as failures, then the caller retries. Tests exercise these cases.

## 12. An address match is not yet a sale.

This excerpt is from paymentsFrom. The return statement keeps only coins whose net change is positive. A refund or a shop sending funds out can match affectedAddress too. Failed transactions are not sales. Sum base units using BigInt, group by normalized coin type, and only then format for display. The unit tests check outgoing transfers, failure and mixed positive and negative changes.

## 13. Every student gets their own workspace.

Open the demo in a normal browser tab. Demo payer creates a browser-local key; the shop key is separate and stored per payer address. They are not shared class wallets. The receiving shop needs no gas for this transfer. Connected mode asks the selected wallet account to sign on sui:testnet. Clearing browser storage loses browser demo keys. Use test funds only. The app supports watching another address without possessing its key.

## 14. Watch the money move.

Read both balances before and after a transfer. The payer’s net debit includes gas; it need not equal exactly the payment. The shop receives the payment amount. Both cards include coin-object balances and address balances. Their latest change is measured between gRPC reads, so concurrent activity can affect it. The app labels the delta as latest change, not exact transaction accounting.

## 15. First, prove the normal path.

Do this slowly. Wait for the Live badge before paying. Confirm the transaction link, then the feed delivery. The gRPC confirmation can arrive before GraphQL indexes the transaction. A listener is not a guarantee of zero latency. Click View receipt to inspect status, timestamp, checkpoint and all returned balance changes. The browser chime is enabled by the first user action.

## 16. 02 / THE DISCONNECT TEST

Ask students to predict the balances and feed. Pause feed aborts the subscription, not the wallet and not the whole browser network. Therefore the gRPC balance cards still refresh and a payment can still be submitted. This separation is intentional and visible in the UI. After the payment is confirmed, resume the feed.

## 17. It catches up from where you stopped.

The recovered tag is assigned to a payment whose chain timestamp predates the connection start. It is an instructional approximation using browser time, not a protocol flag. The important assertions are the transaction digest appearing once and the totals remaining correct. Refresh the page, click Open till again, and show that replay does not duplicate the already stored payment.

## 18. No cursor yet? Keep a checkpoint.

The old app could miss a payment if it disconnected before its first matching delivery: no cursor had been saved. The upgraded app captures the latest indexed checkpoint before opening the stream and persists it. When there is no cursor, it sends afterCheckpoint. Once a cursor exists, after takes over. Do not parse or manufacture a cursor; treat it as opaque and keep it scoped to the shop and query.

## 19. Save a receipt and its position together.

The displayed excerpts preserve the logic in the repository, with line wrapping for readability. applyDelivery creates a new snapshot containing the advanced cursor and merged bounded list. persist saves that one snapshot with one localStorage call. If storage is blocked, the app reports that persistence is unavailable and continues only in memory. Deduplication uses digest plus coin type. For long-term accounts, use the database writer rather than the bounded browser list.

## 20. Delivery has edges. Design for them.

Explain order as checkpoint position, then transaction position; an event adds its position within a transaction. The client uses exponential backoff capped at 30 seconds and generation guards to stop stale callbacks. In this demo, send_funds address-balance deposits were confirmed onchain but appeared after catch-up rather than on the live affectedAddress stream. Present that as an observed provider behaviour, not a universal permanent Sui rule. Re-test before class. Never fabricate a feed row from the pay button.

## 21. A live feed can become a small indexer.

The Node indexer uses the same SSE parser and paymentsFrom function as the browser. It stores amounts as base-unit text, not JavaScript floats. SQLite is enough for a local class demo. In Postgres the same idea uses a unique key and a transaction. Keep one shop per supplied database file; this demo schema is not a multi-tenant accounting product. Source: indexer/indexer.ts and indexer/db.ts.

## 22. The cursor belongs in the same commit.

This is the writer excerpt with log lines omitted and arguments wrapped. INSERT OR IGNORE handles the primary key on digest and coin_type. Save the watermark even when a matching transaction produces no incoming receipt. Demonstrate stopping and restarting the indexer. Its stored cursor resumes the same feed. A failure between insert and watermark must roll both back. The code is for one shop per database file.

## 23. Run the writer. Restart it. Compare totals.

For local development use Node 24 and pnpm. The optional DeepSeek key is not needed for paying or subscribing. SHOP_ADDRESS is used only by the local indexer and CLI demo. FROM_CHECKPOINT is used only when the database has no watermark. Use a separate TILL_DB for each shop. The totals script sums BigInt values by coin type and UTC date. Stop and restart the writer, send a payment while it is stopped, then compare database totals and unique digests.

## 24. Know when the small writer is too small.

Do not use a browser subscription as a data warehouse. A Rust checkpoint indexing framework becomes useful for sustained throughput, custom joins, precise watermarks and checkpoint processing at scale. It introduces a real service, database operations and monitoring. Till demonstrates the smaller alternative, not a claim that a subscription replaces every indexer. Source: https://docs.sui.io/concepts/custom-indexing-framework

## 25. A full node can forget. History remains.

This default testnet digest is ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a. Rechecked on 15 October 2026: the public full node gRPC lookup returned not found; GraphQL returned SUCCESS at checkpoint 250000000, timestamp 2025-10-07T22:04:44.571Z. The scripts/receipt.ts command demonstrates both responses. Not-found alone does not prove the cause for an arbitrary digest; this known old example has corroborating history.

## 26. Design inside the service limits.

The live serviceConfig reported defaultPageSize 20, maxPageSize 50 for type Query and field transactions, maxQueryDepth 20, maxQueryNodes 300 and queryTimeoutMs 40000. These are observed endpoint settings, not eternal protocol constants. Page nested connections as well as top-level queries for complete accounting. Till asks for the first 50 balance changes because its demo payments are small. Production requires provider-specific limits, reconnection monitoring and retention assumptions. Source: live introspection and https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc

## 27. Migrate the intention, not just the method.

Run the three scripts in migration/. They show the old call and two replacements. Do not assume only renaming a method will migrate response types, pagination and error handling. In this SDK the unified balance includes address balance, which matters because faucet v3 and balance::send_funds can use that storage. Review every response shape against the installed SDK types. JSON-RPC availability depends on the provider. Source: https://docs.sui.io/develop/accessing-data/json-rpc-migration; installed @mysten/sui 2.36.0.

## 28. The lifecycle is part of the demo.

Demo keys are local to this browser profile. Clearing site storage loses access to demo funds; the UI reset only clears receipts and cursor. If changing subscriptions, filters or storage formats, version snapshots and select an intentional historical opening checkpoint. Cursor compatibility is not guaranteed across arbitrary query changes. Rotating a payer or shop means funding and sharing a new address; keep old data for reconciliation. Shared server signing has been retired with HTTP 410.

## 29. Your turn: prove all four.

Give students several minutes. Ask them to report their own shop address and one transaction digest, not any private key. Bonus: test an address-balance deposit and compare live versus catch-up. Bonus: run the SQLite writer and restart it. If the faucet is rate-limited, use the linked public testnet faucet and refresh the balances. Do not silently substitute fake values.

## 30. TAKE IT WITH YOU

Close by asking students to explain the separation between sending a payment, receiving a live delivery and storing it durably. Live app: https://day3-till.vercel.app. Repository: https://github.com/Nuel-osas/day3-till. The deck source, screenshots and test evidence are included under teaching/. Primary references: https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions ; https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc ; https://docs.sui.io/develop/accessing-data/json-rpc-migration ; https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql ; https://docs.sui.io/concepts/custom-indexing-framework. Checked 15 October 2026. The connected-wallet boundary is checked with a Wallet Standard fixture; a physical wallet extension approval remains a manual classroom check.
