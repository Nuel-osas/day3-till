## 01. ACCOUNT LAYER WEEK / DAY 03

Today we build Till: a live payments screen. Days 1 and 2 dealt with identity and permission. Day 3 makes the resulting activity visible. Start by opening the live app; everyone will get a personal payer and a personal shop. All payments in this class use Sui testnet. No Move deployment is required for Till.

Today’s route: choose a data layer, subscribe, send a payment, pause and recover, persist receipts, find history and migrate a legacy call. The demo is observation, not an allowance or a recurring-payment scheduler.

## 02. Meet your live till.

Open https://day3-till.vercel.app. Explain the visual hierarchy: personal payer and shop, money flow, stream status, payment feed, test payment controls. The app uses real testnet transactions. A green receipt is created from an indexed successful positive net balance change to the watched shop. The balance cards read gRPC independently of the subscription.

Class setup: choose Demo payer or My wallet, get test SUI for the payer, and open the till before sending. Browser keys stay local and each payer has a separate receiving shop. The shop needs no gas to receive. A connected wallet signs on sui:testnet. Keep the app open while teaching; the next screenshots refer to these same controls.

## 03. Four layers. Four different jobs.

gRPC serves the full node interface, including transaction execution. GraphQL is an indexed service with expressive selections and subscriptions. Archival storage keeps history beyond a node retention window; an arbitrary gRPC endpoint does not automatically query it. A custom indexer owns a derived model in your database. Source: https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc

Choose by workload: wallets use gRPC plus GraphQL activity history; shops use subscriptions plus a small writer; games execute through gRPC and stream domain events; analytics use a checkpoint indexer. SQLite or Postgres can keep a focused feed. Use the Rust indexing framework for checkpoint backfills, parallel transformations, schema ownership and reprocessing at chain scale. Source: https://docs.sui.io/concepts/custom-indexing-framework

## 04. One document. Any shop.

Read the actual subscription in the repository. affectedAddress narrows candidates to this shop. after is a stream cursor; afterCheckpoint establishes an opening boundary when there is no cursor yet. The payload includes only the fields used to derive receipts. Balance changes are bounded to 50 here, sufficient for the small demo transactions but not a universal accounting guarantee. Source: live schema introspection, 15 October 2026; https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql

## 05. Choose a filter. Open the stream.

Transactions, events and checkpoints are the subscription roots. Transaction filters also include function, kind, afterCheckpoint, atCheckpoint and beforeCheckpoint. Events accept sender, module, type and checkpoint boundaries. POST { query, variables } to /graphql/subscriptions with Accept: text/event-stream. This is not a websocket. The shared src/lib/sse.ts parser handles keepalive comments, split CRLF frames, multiline data and empty complete events. GraphQL errors can arrive inside HTTP 200 and must trigger failure/retry, not a false Live state. Sources: live schema checked 15 October 2026; https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql

## 06. Watch the money move.

Read both balances before and after a transfer. The payer’s net debit includes gas; it need not equal exactly the payment. The shop receives the payment amount. Both cards include coin-object balances and address balances. Their latest change is measured between gRPC reads, so concurrent activity can affect it. The app labels the delta as latest change, not exact transaction accounting.

Live demo: wait for Live, send 0.01 test SUI, then inspect the feed and View receipt. Confirmation can precede GraphQL indexing. The receipt requires SUCCESS and a positive net balance change to the shop; sum each coin with BigInt before formatting. Outgoing transfers and failures are not sales. The class screenshot payment is 9dc36To1WB6PxSqHFyzbsYGSMtJ7JBVDSfuxkxnNUksv on testnet.

## 07. It catches up from where you stopped.

The recovered tag is assigned to a payment whose chain timestamp predates the connection start. It is an instructional approximation using browser time, not a protocol flag. The important assertions are the transaction digest appearing once and the totals remaining correct. Refresh the page, click Open till again, and show that replay does not duplicate the already stored payment.

Live exercise: click Pause feed, send another payment, then Resume feed. This aborts only the subscription; chain activity and independent balance reads continue. After recovery, refresh the page and reopen the till. Ask the class to check that the digest appears once and the total is unchanged.

## 08. No cursor yet? Keep a checkpoint.

The old app could miss a payment if it disconnected before its first matching delivery: no cursor had been saved. The upgraded app captures the latest indexed checkpoint before opening the stream and persists it. When there is no cursor, it sends afterCheckpoint. Once a cursor exists, after takes over. Do not parse or manufacture a cursor; treat it as opaque and keep it scoped to the shop and query.

Persist each cursor together with its receipts in one versioned per-shop snapshot. Advancing the cursor first could lose a receipt on a crash. Deduplicate by digest plus normalized coin type. The browser list retains at most 500 records, so it is not a complete ledger. Ordering follows checkpoint, transaction position and, for events, event position. Treat cursors as opaque. Reconnect with backoff; cancel old retries when the account or shop changes.

## 09. The cursor belongs in the same commit.

This is the writer excerpt with log lines omitted and arguments wrapped. INSERT OR IGNORE handles the primary key on digest and coin_type. Save the watermark even when a matching transaction produces no incoming receipt. Demonstrate stopping and restarting the indexer. Its stored cursor resumes the same feed. A failure between insert and watermark must roll both back. The code is for one shop per database file.

Terminal walkthrough: use Node 24, run pnpm install, copy .env.example to .env, set SHOP_ADDRESS and FROM_CHECKPOINT from the UI, then run pnpm indexer. Stop the writer, send a payment, restart, and run pnpm totals in another terminal. Use one TILL_DB per shop. The tested writer backfilled three receipts totalling 0.03 SUI and resumed its watermark without duplicates. Amounts are stored as text and summed with BigInt. SQLite runs locally; the Vercel app does not host this long-running process.

## 10. A full node can forget. History remains.

This default testnet digest is ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a. Rechecked on 15 October 2026: the public full node gRPC lookup returned not found; GraphQL returned SUCCESS at checkpoint 250000000, timestamp 2025-10-07T22:04:44.571Z. The scripts/receipt.ts command demonstrates both responses. Not-found alone does not prove the cause for an arbitrary digest; this known old example has corroborating history.

## 11. Plan for limits and real-world gaps.

These are observed public testnet settings, not protocol constants: Query.transactions default page 20 and maximum 50, query timeout 40000 ms, maximum depth 20 and nodes 300. Page nested connections for complete accounting; Till selects the first 50 balance changes per transaction. Per-subscriber throttling applies, but its threshold was not measured. In both local and production tests, balance::send_funds deposits changed onchain balances but appeared in the affectedAddress feed only after Catch up now. Present this as measured provider behaviour and re-test before class. HTTP 200 may contain a GraphQL or JSON-RPC error. The faucet can be slow or rate-limited; refresh balances before retrying. Browser storage can be blocked or cleared, which affects persistence and demo keys. The app labels these boundaries rather than fabricating receipts. Source: https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc

## 12. Migrate the intention, not just the method.

Run the three scripts in migration/. They show the old call and two replacements. Do not assume only renaming a method will migrate response types, pagination and error handling. In this SDK the unified balance includes address balance, which matters because faucet v3 and balance::send_funds can use that storage. Review every response shape against the installed SDK types. JSON-RPC availability depends on the provider. Source: https://docs.sui.io/develop/accessing-data/json-rpc-migration; installed @mysten/sui 2.36.0.

Dates for context: GraphQL subscriptions were announced for mainnet and testnet on 21 September 2026. Foundation mainnet JSON-RPC disablement began the week of 27 July; source removal was planned for mid-October. The public testnet endpoint returned -32601 inside HTTP 200 on 15 October. Other providers may differ. Sources: https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions and https://docs.sui.io/develop/accessing-data/json-rpc-migration

## 13. The lifecycle is part of the demo.

Demo keys are local to this browser profile. Clearing site storage loses access to demo funds; the UI reset only clears receipts and cursor. If changing subscriptions, filters or storage formats, version snapshots and select an intentional historical opening checkpoint. Cursor compatibility is not guaranteed across arbitrary query changes. Rotating a payer or shop means funding and sharing a new address; keep old data for reconciliation. Shared server signing has been retired with HTTP 410.

## 14. Your turn: prove all four.

Give students several minutes. Ask them to report their own shop address and one transaction digest, not any private key. Bonus: test an address-balance deposit and compare live versus catch-up. Bonus: run the SQLite writer and restart it. If the faucet is rate-limited, use the linked public testnet faucet and refresh the balances. Do not silently substitute fake values.

## 15. TAKE IT WITH YOU

Close by asking students to explain the separation between sending a payment, receiving a live delivery and storing it durably. Live app: https://day3-till.vercel.app. Repository: https://github.com/Nuel-osas/day3-till. The deck source, screenshots and test evidence are included under teaching/. Primary references: https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions ; https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc ; https://docs.sui.io/develop/accessing-data/json-rpc-migration ; https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql ; https://docs.sui.io/concepts/custom-indexing-framework. Checked 15 October 2026. The connected-wallet boundary is checked with a Wallet Standard fixture; a physical wallet extension approval remains a manual classroom check.

Verified production testnet receipts: live coin transfer H1fQ22Q5V6yt37GaiySNqGhUJR7ki4b35Te9Qcja9Bqn; paused then recovered 66XRjyGEKngFwGZntzULDr6v4hrwFPnR8ZmY9fmPW6Zh; address-balance catch-up 5crvrKsvQGU3emZvNCEJgKjpAwENtCHHxfY4UMy11Dcc. See teaching/VERIFICATION.md for explorer links and the exact test scope.
