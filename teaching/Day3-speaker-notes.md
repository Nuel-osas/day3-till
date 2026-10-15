## 01. SUIHUB LAGOS / DAY 03

This session is about choosing and using the Sui data stack after JSON-RPC. Till is the practical case study that makes subscriptions, recovery, persistence and history visible. The final workshop applies the same migration to a project each student brings. No Move is required. Keep the distinction from Day 2 clear: this is data access and application architecture, not recurring-payment permission.

## 02. Why this session, now?

The official migration page reports Foundation mainnet JSON-RPC disablement in the week of 27 July 2026 and plans source removal for mid-October. Avoid claiming that every provider has already removed it. The public testnet endpoint returned -32601 inside HTTP 200 in our 15 October checks. The GraphQL subscription announcement is dated 21 September. Today we build the replacement path and migrate one real call. Sources: https://docs.sui.io/develop/accessing-data/json-rpc-migration ; https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions

## 03. Four layers. Choose for your workload.

The workload determines the combination. A wallet uses gRPC for state and execution, with GraphQL for activity. A shop can use a GraphQL subscription plus a small database writer. A game executes actions through gRPC and streams domain events. An analytics backend often needs a custom checkpoint pipeline. Archival access is a separate data service; full node gRPC does not silently fall back to old history. A GraphQL operator can configure archive-backed point lookups. Sources: https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc ; https://docs.sui.io/concepts/custom-indexing-framework

## 04. Subscribe to what your screen needs.

These field names come from the live testnet schema. Transactions support affectedAddress, affectedObject, function, kind and sentAddress. Event filters support sender, module and type. Both support afterCheckpoint, atCheckpoint and beforeCheckpoint. checkpoints is also a subscription root. A subscription returns edges with cursor and node. Use an affectedAddress transaction feed for Till; use typed events when your Move application emits a domain event. No custom indexer deployment is needed just to consume this hosted service. Indexing still happens behind the service. Source: https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql

## 05. The actual Till subscription.

This is the actual repository document. Point out the affectedAddress filter and how the selection set is limited to receipt data. A match is only a candidate payment: the client also checks SUCCESS and keeps positive net changes for the shop, grouped by normalized coin type using BigInt. Outgoing transfers and failed transactions must not become sales. The first 50 balance changes are enough for the small demo transfers, not a complete accounting guarantee for arbitrary complex transactions.

## 06. POST + SSE. Stream with fetch.

POST the GraphQL query and variables to /graphql/subscriptions. The response is text/event-stream. Browser EventSource cannot send the POST body, and a websocket client uses the wrong transport. The shared browser/Node parser handles comments, split CRLF frames, multiline data and complete events. GraphQL errors may be inside HTTP 200, so the caller must treat them as errors and reconnect appropriately. The seven automated tests include these parser cases.

## 07. Resume from a durable position.

Capture an opening checkpoint before the first subscription so a disconnect before any delivery can still recover. Once a cursor exists, resume with after. Treat cursors as opaque and scoped to the shop and query. Persist progress for every matching delivery, even one that is not a sale. Checkpoint order comes first, then transaction position, with event position within a transaction for events. Per-subscriber throttling and server disconnects require bounded processing, backoff and retry. Our client cancels stale streams and retries when a shop changes. A successful reconnect alone is not proof that your app stored every payment.

## 08. A small indexer: commit data and cursor.

A TypeScript subscriber can write to SQLite or Postgres. The cursor is the progress watermark; this receipt writer uses PRIMARY KEY (digest, coin_type) as its unique business-record key, rather than assuming that a cursor itself identifies one payment. INSERT OR IGNORE makes replay idempotent. Commit rows and watermark together, or roll back both. Amounts are base-unit text and totals use BigInt. Local exercise: copy .env.example, set SHOP_ADDRESS and FROM_CHECKPOINT, run pnpm indexer, stop it, pay, restart, then pnpm totals. The tested restart retained three receipts totalling 0.03 SUI without duplication. Use one database per shop. Vercel does not run this long-lived writer.

## 09. When should you use the Rust framework?

The subscription writer is the lighter path for an application that does not need a full indexing pipeline. The custom framework becomes useful when throughput, backfill, transformations and recovery belong under your control. It brings operational work: database migrations, checkpoint watermarks, monitoring and reprocessing. This session explains that decision boundary; it does not build a new Rust indexer. Source: https://docs.sui.io/concepts/custom-indexing-framework

## 10. Find history beyond the full node.

Use the receipt page or pnpm receipt. Verified on 15 October 2026: the public gRPC full node returned not found for ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a, while GraphQL returned SUCCESS at checkpoint 250000000 on 7 October 2025. Full-node retention is different from archival history. A random not-found response alone does not prove pruning; this known old receipt has corroborating data. The app labels its result source and keeps the full digest available.

## 11. Public endpoints are for development.

Read the service configuration, not a guessed universal limit. Today the testnet service reports maxQueryPayloadSize 5000, queryTimeoutMs 40000, Query.transactions defaultPageSize 20, maxPageSize 50, maxQueryDepth 20 and maxQueryNodes 300. Foundation public load balancers are rate-limited development/public-good endpoints; arrange a dedicated provider or your own service before a production launch. Check subscription support and archival retention explicitly. Tested send_funds address-balance deposits changed balances but appeared in the affectedAddress subscription only after catch-up. Other traps: HTTP 200 may contain errors; the faucet may delay or rate-limit; clearing browser storage loses local demo keys; a changed query may need a fresh historical boundary. Sources: live serviceConfig; https://docs.sui.io/develop/accessing-data/json-rpc-migration ; https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc

## 12. Build Till on the stack we just mapped.

Till is the case study, not the whole subject. It executes through gRPC, subscribes through GraphQL, saves receipt progress, writes a separate SQLite ledger and looks up archived history. Each student gets a separate browser payer and shop, or connects a testnet wallet. Open till, fund the payer and send a payment. Compare the red debit with the green credit; gas is paid in SUI. Wait for the actual indexed receipt and enable the chime through a user gesture. The advertised event names USDC. Readiness gap: the built-in form currently sends SUI, and no funded USDC payment has been verified. The receipt and local database paths handle coin types generically, but that is not proof of a successful USDC run. Say this before class rather than presenting the SUI screenshot as USDC. Do not use mainnet funds for this testnet lab.

## 13. Pause mid-sale. Recover. Reconcile.

Pause the feed, send another payment, then Resume. This aborts only the listener, so payments and independent gRPC balance refreshes keep working. The recovered label is a browser-time approximation; verify the actual digest and total. Then reload and reopen the till to check deduplication. Start the local indexer and compare pnpm totals with the tracked receipts. The browser keeps only 500 records and is not a complete ledger. Switch connected payer to show its own shop, return to restore the prior shop, and explain that Reset clears tracking but not keys or onchain funds. Query/version changes need intentionally chosen resume boundaries. Actual production proofs: live H1fQ22Q5V6yt37GaiySNqGhUJR7ki4b35Te9Qcja9Bqn; paused then recovered 66XRjyGEKngFwGZntzULDr6v4hrwFPnR8ZmY9fmPW6Zh. Physical wallet approval and audible playback remain manual checks.

## 14. Migrate a JSON-RPC call.

Open the three files in migration/. The legacy SuiJsonRpcClient calls getBalance, getTransactionBlock and queryEvents. The gRPC replacement uses SuiGrpcClient and typed results. The GraphQL version shows both a shared client API and one query joining the selected balance, transaction and events data. Migrate the response shape, errors and pagination too. Do not reuse a legacy API cursor in the new API. Include both coin and address balances. Our gRPC event example normalizes the event type because short-form addresses were rejected. Use the installed SDK types, as older examples and individual documentation tables may lag new releases. Source: https://docs.sui.io/develop/accessing-data/json-rpc-migration

## 15. Now migrate one call in your own app.

This is the advertised final workshop. Ask students to open a project they brought. If they have none, use Till’s migration folder. Choose one existing read, map it to the right data service, run both available paths against known data, inspect failure behaviour and record what changed. For polling screens, determine whether a subscription fits. For production, name the endpoint provider and quotas. The class deliverable is a working migrated call plus an explanation of the chosen data path. References are in the README, and verified testnet receipts are in teaching/VERIFICATION.md. Live app: https://day3-till.vercel.app. Repository: https://github.com/Nuel-osas/day3-till.
