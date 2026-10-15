// Generate the editable Day 3 deck. Run with pnpm slides.
const pptxgen = require('pptxgenjs');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.SLIDES_OUT || path.join(__dirname, 'Day3_Till_Live_Data_Seedless_Style.pptx');
const p = new pptxgen(); p.layout = 'LAYOUT_WIDE';
p.author = 'Ruru | SuiHub Lagos'; p.subject = 'Account Layer Week, Day 3'; p.title = 'Real-time Sui | Till Lab'; p.company = 'SuiHub Lagos'; p.lang = 'en-GB';
p.theme = { headFontFace: 'DM Sans', bodyFontFace: 'DM Sans', lang: 'en-GB' };
const C = { dark:'07080F', blue:'2338FF', light:'F4F5F8', white:'FFFFFF', ink:'131725', muted:'69738B', pale:'E8ECFF', dim:'ACB8DB', green:'078256', red:'C5424E' };
const W=13.333333,H=7.5,M=.85;
const notes=[];
const LIVE='https://day3-till.vercel.app';
const REPO='https://github.com/Nuel-osas/day3-till';
const SOURCES={launch:'https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions',graphql:'https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc',migration:'https://docs.sui.io/develop/accessing-data/json-rpc-migration',schema:'https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql',indexer:'https://docs.sui.io/concepts/custom-indexing-framework'};
function txt(s,t,x,y,w,h,size=22,color=C.ink,extra={}){s.addText(t,{x,y,w,h,fontFace:'DM Sans',fontSize:size,color,margin:0,breakLine:false,vertAnchor:'mid',valign:'mid',...extra});}
function rect(s,x,y,w,h,color,r=0){s.addShape(r?'roundRect':'rect',{x,y,w,h,rectRadius:r,fill:{color},line:{color,transparency:100},radius:r});}
function label(s,t,y=.55,color=C.muted){txt(s,`[ ${t.toUpperCase()} ]`,M,y,W-M*2,.3,10,color,{fontFace:'JetBrains Mono',charSpacing:1.5});}
function base(title,eyebrow,note,bg=C.light){const s=p.addSlide();s.background={color:bg};const dark=bg!==C.light;label(s,eyebrow,.55,dark?C.dim:C.muted);if(title)txt(s,title,M,1.02,W-M*2,1.25,37,dark?C.white:C.ink,{breakLine:false});txt(s,'SUIHUB LAGOS / ACCOUNT LAYER WEEK',M,7.04,8,.2,8,dark?C.dim:C.muted,{fontFace:'JetBrains Mono',charSpacing:1});txt(s,String(p._slides.length).padStart(2,'0'),11.7,7.02,.75,.23,10,dark?C.dim:C.muted,{align:'right',fontFace:'JetBrains Mono'});s.addNotes(note);notes.push({title:title||eyebrow,note});return s;}
function cards(title,eyebrow,items,note){const s=base(title,eyebrow,note);const gap=.25;const cols=items.length===4?2:items.length;const width=(W-2*M-gap*(cols-1))/cols;const rows=Math.ceil(items.length/cols);items.forEach((it,i)=>{const x=M+(i%cols)*(width+gap),y=2.5+Math.floor(i/cols)*(rows===2?2.0:3.7);const height=rows===2?1.82:3.65;const blue=it.blue;rect(s,x,y,width,height,blue?C.blue:C.white);txt(s,it.label,x+.25,y+.23,width-.5,.3,11,blue?'BFC9FF':C.blue,{fontFace:'JetBrains Mono'});txt(s,it.title,x+.25,y+.66,width-.5,rows===2?.4:1.05,rows===2?23:25,blue?C.white:C.ink);txt(s,it.body,x+.25,y+(rows===2?1.12:1.88),width-.5,rows===2?.58:1.5,rows===2?15:19,blue?'DFE4FF':C.muted);});return s;}
function statement(eyebrow,title,sub,note){const s=base('',eyebrow,note,C.blue);txt(s,title,M,2.0,11.7,2.4,57,C.white,{breakLine:false});txt(s,sub,M,5.2,10.8,1.05,23,'D4DCFF');return s;}
function code(title,eyebrow,source,note,caption=''){const s=base(title,eyebrow,note,C.dark);rect(s,M,2.48,W-M*2,4.15,'111529');const lines=source.split('\n');const longest=Math.max(...lines.map(x=>x.length));const font=Math.min(20,275/(lines.length*1.35),810/(longest*.62));txt(s,source,M+.28,2.66,W-M*2-.56,3.85,font,'D9E1FF',{fontFace:'JetBrains Mono',valign:'top',breakLine:false});if(caption)txt(s,caption,M,6.62,11.5,.25,11,C.dim);return s;}
function flow(title,eyebrow,steps,note,caption=''){const s=base(title,eyebrow,note);const n=steps.length,gap=.27,width=(W-M*2-gap*(n-1))/n;steps.forEach((it,i)=>{const x=M+i*(width+gap);rect(s,x,2.85,width,2.7,i===n-1?C.blue:C.white);txt(s,String(i+1).padStart(2,'0'),x+.22,3.08,width-.44,.35,13,i===n-1?'C4CEFF':C.blue,{fontFace:'JetBrains Mono'});txt(s,it[0],x+.22,3.75,width-.44,.65,25,i===n-1?C.white:C.ink);txt(s,it[1],x+.22,4.50,width-.44,.84,16,i===n-1?'D4DCFF':C.muted);});txt(s,caption,M,5.98,11.5,.55,20,C.muted);return s;}
function contain(file,x,y,w,h){const data=fs.readFileSync(file);const iw=data.readUInt32BE(16),ih=data.readUInt32BE(20);const ratio=Math.min(w/iw,h/ih);return {x:x+(w-iw*ratio)/2,y:y+(h-ih*ratio)/2,w:iw*ratio,h:ih*ratio};}
function screen(title,eyebrow,file,note,caption){
 const s=base(title,eyebrow,note);const asset=path.join(__dirname,'assets',file);
 if(!fs.existsSync(asset))throw Error('Missing screenshot '+asset);
 if(file==='balances.png'){
  s.addImage({path:asset,...contain(asset,M,2.8,11.64,2.6)});
  txt(s,'PAYER / MONEY OUT',M,2.55,5.5,.3,12,C.red,{fontFace:'JetBrains Mono'});
  txt(s,'SHOP / MONEY IN',7.0,2.55,5.5,.3,12,C.green,{fontFace:'JetBrains Mono'});
  txt(s,'Payment + gas',M,5.65,5.5,.5,28,C.red);
  txt(s,'Payment received',7.0,5.65,5.5,.5,28,C.green);
 }else{
  s.addImage({path:asset,...contain(asset,M,2.4,7.2,4.05)});
  const items=file==='overview.png'?[['PERSONAL','Your payer. Your shop.'],['LIVE','A receipt from the stream.'],['RECOVERABLE','A saved place to resume.']]:file==='recovery.png'?[['01 / PAUSE','The listener stops.'],['02 / PAY','The chain keeps going.'],['03 / RESUME','Missed receipts return.']]:[['DATE','7 October 2025'],['CHECKPOINT','250,000,000'],['RESULT','GraphQL found the receipt.']];
  items.forEach((it,i)=>{const y=2.65+i*1.24;labelAt(s,it[0],8.55,y,3.8,C.blue);txt(s,it[1],8.55,y+.35,3.8,.8,20,C.ink);});
 }
 txt(s,caption,M,6.65,11.6,.22,10,C.muted);return s;
}
function labelAt(s,t,x,y,w,color){txt(s,t,x,y,w,.25,10,color,{fontFace:'JetBrains Mono',charSpacing:1});}

const file=relative=>fs.readFileSync(path.join(ROOT,relative),'utf8');
// 01
{const s=base('','ACCOUNT LAYER WEEK / DAY 03','Today we build Till: a live payments screen. Days 1 and 2 dealt with identity and permission. Day 3 makes the resulting activity visible. Start by opening the live app; everyone will get a personal payer and a personal shop. All payments in this class use Sui testnet. No Move deployment is required for Till.',C.dark);rect(s,8.65,0,4.69,H,'101E69');rect(s,11.6,0,1.74,H,C.blue);txt(s,'Real-time\nSui.',M,1.75,9.8,2.95,72,C.white);txt(s,'A payment happens.\nYour app should know.',M,4.8,9.5,1.15,29,C.dim);txt(s,'GRAPHQL SUBSCRIPTIONS / THE NEW DATA STACK',M,6.38,11,.3,12,'9BAFFF',{fontFace:'JetBrains Mono'});}
// 02
cards('An account becomes an experience.','THE WEEK SO FAR',[
{label:'DAY 01',title:'Identity',body:'Who can access\nthe account?'},{label:'DAY 02',title:'Permission',body:'What may a spender\ndo with it?'},{label:'DAY 03',title:'Visibility',body:'How does your app\nsee what happened?',blue:true}], 'Connect the sessions without conflating them. Till does not create an allowance or execute a recurring payment. It listens for payment transactions, whether a wallet or another app initiates them. A UI subscription also does not schedule anything onchain. The lesson is dependable observation.');
// 03
screen('Meet your live till.','TODAY’S DEMO','overview.png','Open '+LIVE+'. Explain the visual hierarchy: personal payer and shop, money flow, stream status, payment feed, test payment controls. The app uses real testnet transactions. A green receipt is created from an indexed successful positive net balance change to the watched shop. The balance cards read gRPC independently of the subscription.','Live app: day3-till.vercel.app   /   Real testnet transactions. Personal student wallets.');
// 04
flow('Build it. Break the connection. Recover.','WHAT YOU WILL LEARN',[
['Choose','gRPC, GraphQL, archive or indexer'],['Listen','Filtered subscriptions over POST'],['Recover','Cursors, ordering and replay'],['Keep','SQLite totals and old receipts']], 'By the end students should explain the four data layers, use transaction and event filters, consume SSE over POST, resume from a cursor or checkpoint, write idempotently to SQLite or Postgres, find an archived transaction, respect service limits and migrate a JSON-RPC call. We will also discuss when a Rust checkpoint indexer is the better tool.','The final test: refresh the page without counting a payment twice.');
// 05
cards('Four layers. Four different jobs.','THE DATA STACK',[
{label:'01 / gRPC',title:'Read and act now.',body:'Balances, objects, execution and checkpoints.'},
{label:'02 / GRAPHQL',title:'Ask for a screen.',body:'Filtered history, selected fields and subscriptions.',blue:true},
{label:'03 / ARCHIVE',title:'Keep the past.',body:'History beyond a full node’s retention.'},
{label:'04 / YOUR INDEXER',title:'Own the data model.',body:'Durable aggregates, joins and reprocessing.'}], 'gRPC serves the full node interface, including transaction execution. GraphQL is an indexed service with expressive selections and subscriptions. Archival storage keeps history beyond a node retention window; an arbitrary gRPC endpoint does not automatically query it. A custom indexer owns a derived model in your database. Source: '+SOURCES.graphql);
// 06
cards('Choose for the job you are doing.','FOUR APP SHAPES',[
{label:'WALLET',title:'gRPC + history',body:'Execute now. Page activity with GraphQL.'},
{label:'SHOP',title:'Subscription + writer',body:'Receive payments. Keep a durable ledger.',blue:true},
{label:'GAME',title:'Actions + event feed',body:'Execute with gRPC. Stream game events.'},
{label:'ANALYTICS',title:'Checkpoint indexer',body:'Backfill, transform and own the database.'}], 'These are architectural choices, not exclusive product categories. A wallet can use both gRPC and GraphQL. Till is a narrow address feed, so a lightweight subscription writer is a reasonable teaching example. An analytics backend that needs every checkpoint and complex aggregates benefits from a custom pipeline. Source: '+SOURCES.indexer);
// 07
cards('The migration is already real.','DATES THAT MATTER',[
{label:'JULY 2026',title:'JSON-RPC disabled',body:'Foundation mainnet rollout began the week of 27 July.'},
{label:'21 SEPTEMBER 2026',title:'Subscriptions live',body:'GraphQL subscriptions announced for mainnet and testnet.',blue:true},
{label:'15 OCTOBER / TESTED',title:'Check the body.',body:'Public testnet JSON-RPC returns an error inside HTTP 200.'}], 'Do not say every provider has removed JSON-RPC. The official migration page says Foundation mainnet disablement began the week of July 27 and source-code removal was planned for mid-October. Today we independently called the public testnet endpoint and received -32601 even though HTTP status was 200. Subscriptions were announced September 21 for both networks. Sources: '+SOURCES.migration+' and '+SOURCES.launch);
// 08
statement('01 / LISTEN','Push updates.\nKeep a place to resume.','A live feed is only useful if it can survive a disconnect.','Pause to ask the room what happens when a cashier loses Wi-Fi. A successful payment does not depend on the cashier’s browser hearing it. We need to separate chain finality from delivery to an app and from local durable storage.');
// 09
{const query=file('src/lib/till.ts').split('/* GraphQL */ `')[1].split('`;')[0].trim();code('One document. Any shop.','src/lib/till.ts',query,'Read the actual subscription in the repository. affectedAddress narrows candidates to this shop. after is a stream cursor; afterCheckpoint establishes an opening boundary when there is no cursor yet. The payload includes only the fields used to derive receipts. Balance changes are bounded to 50 here, sufficient for the small demo transactions but not a universal accounting guarantee. Source: live schema introspection, 15 October 2026; '+SOURCES.schema,'Select a small payload. Every matching transaction carries a cursor.');}
// 10
cards('Filter the activity you care about.','LIVE SCHEMA / TESTNET',[
{label:'TRANSACTIONS',title:'Who or what?',body:'affectedAddress · affectedObject\nfunction · kind · sentAddress'},
{label:'EVENTS',title:'Which event?',body:'sender · module · type\nplus checkpoint boundaries'},
{label:'CHECKPOINTS',title:'Progress through Sui.',body:'Follow checkpoint progress.\nResume with a saved position.',blue:true}], 'The current schema exposes transactions, events and checkpoints subscription fields. TransactionFilter fields observed today are affectedAddress, affectedObject, function, kind, sentAddress, afterCheckpoint, atCheckpoint and beforeCheckpoint. EventFilter exposes sender, module, type and the same checkpoint bounds. Not every filter combination was load-tested. Choose event types for application-specific semantic events, while Till derives receipts from transaction balance changes. Source: live schema introspection and '+SOURCES.schema);
// 11
code('The transport is an HTTP POST.','src/lib/sse.ts',file('src/lib/sse.ts').slice(file('src/lib/sse.ts').indexOf('  const res = await fetch'),file('src/lib/sse.ts').indexOf('  let buf')).trim(),'This is the repository code that opens the stream. The response is text/event-stream. EventSource cannot send the GraphQL POST body, so Till uses fetch and a stream reader. The shared parser handles keepalive comments, split CRLF frames, multi-line data and complete events. It treats GraphQL errors inside HTTP 200 as failures, then the caller retries. Tests exercise these cases.','POST /graphql/subscriptions   /   Content-Type: text/event-stream   /   Browser and Node');
// 12
code('An address match is not yet a sale.','src/lib/till.ts / EXCERPTS',`if (node.effects.status !== 'SUCCESS') return [];
const me = normalize(shop);
const net = new Map<string, bigint>();
for (const c of node.effects.balanceChanges.nodes) {
  if (c.owner && normalize(c.owner.address) === me) {
    const [address, ...rest] = c.coinType.repr.split('::');
    const type = [normalize(address), ...rest].join('::');
    net.set(type, (net.get(type) ?? 0n) + BigInt(c.amount));
  }
}`, 'This excerpt is from paymentsFrom. The return statement keeps only coins whose net change is positive. A refund or a shop sending funds out can match affectedAddress too. Failed transactions are not sales. Sum base units using BigInt, group by normalized coin type, and only then format for display. The unit tests check outgoing transfers, failure and mixed positive and negative changes.','Success → net changes for this shop → positive receipts → format for display');
// 13
flow('Every student gets their own workspace.','LIVE DEMO / SETUP',[
['Choose','Demo payer or a connected testnet wallet'],['Fund','Get test SUI for the payer'],['Open','Start listening before sending'],['Pay','Send 0.01 SUI to your own shop']], 'Open the demo in a normal browser tab. Demo payer creates a browser-local key; the shop key is separate and stored per payer address. They are not shared class wallets. The receiving shop needs no gas for this transfer. Connected mode asks the selected wallet account to sign on sui:testnet. Clearing browser storage loses browser demo keys. Use test funds only. The app supports watching another address without possessing its key.');
// 14
screen('Watch the money move.','RED OUT / GREEN IN','balances.png','Read both balances before and after a transfer. The payer’s net debit includes gas; it need not equal exactly the payment. The shop receives the payment amount. Both cards include coin-object balances and address balances. Their latest change is measured between gRPC reads, so concurrent activity can affect it. The app labels the delta as latest change, not exact transaction accounting.','Payer ↓ payment + gas   /   Shop ↑ received value   /   Balances refresh independently of the feed');
// 15
flow('First, prove the normal path.','LIVE DEMO / PAYMENT 01',[
['Open till','Wait for the Live badge'],['Send','Pay 0.01 test SUI'],['Observe','Balance change + incoming receipt'],['Inspect','Open the transaction receipt']], 'Do this slowly. Wait for the Live badge before paying. Confirm the transaction link, then the feed delivery. The gRPC confirmation can arrive before GraphQL indexes the transaction. A listener is not a guarantee of zero latency. Click View receipt to inspect status, timestamp, checkpoint and all returned balance changes. The browser chime is enabled by the first user action.');
// 16
statement('02 / THE DISCONNECT TEST','Pause the feed.\nSend another payment.','The chain keeps going. Only your listener stops.','Ask students to predict the balances and feed. Pause feed aborts the subscription, not the wallet and not the whole browser network. Therefore the gRPC balance cards still refresh and a payment can still be submitted. This separation is intentional and visible in the UI. After the payment is confirmed, resume the feed.');
// 17
screen('It catches up from where you stopped.','LIVE DEMO / RECOVERY','recovery.png','The recovered tag is assigned to a payment whose chain timestamp predates the connection start. It is an instructional approximation using browser time, not a protocol flag. The important assertions are the transaction digest appearing once and the totals remaining correct. Refresh the page, click Open till again, and show that replay does not duplicate the already stored payment.','Saved position → historical catch-up → live delivery on the same connection');
// 18
flow('No cursor yet? Keep a checkpoint.','RESUME STRATEGY',[
['First open','Capture an opening checkpoint'],['First delivery','Save the cursor with its payment'],['Reconnect','Use after, or the opening checkpoint'],['Continue','Replay first. Then follow live.']], 'The old app could miss a payment if it disconnected before its first matching delivery: no cursor had been saved. The upgraded app captures the latest indexed checkpoint before opening the stream and persists it. When there is no cursor, it sends afterCheckpoint. Once a cursor exists, after takes over. Do not parse or manufacture a cursor; treat it as opaque and keep it scoped to the shop and query.');
// 19
code('Save a receipt and its position together.','src/lib/session.ts + src/useTill.ts / EXCERPTS',file('src/lib/session.ts').split('  const seen = ')[1].split('  return { snapshot:')[0].replace(/^/, 'const seen = ') + '\n// Save the cursor and payments in one write.\nlocalStorage.setItem(snapshotKey(shop), JSON.stringify(next));', 'The displayed excerpts preserve the logic in the repository, with line wrapping for readability. applyDelivery creates a new snapshot containing the advanced cursor and merged bounded list. persist saves that one snapshot with one localStorage call. If storage is blocked, the app reports that persistence is unavailable and continues only in memory. Deduplication uses digest plus coin type. For long-term accounts, use the database writer rather than the bounded browser list.','A replay is allowed. Double counting is not.');
// 20
cards('Delivery has edges. Design for them.','FAILURE MODES',[
{label:'ORDER',title:'Use chain order.',body:'Checkpoint, then transaction position. Events add event position.'},
{label:'RETRY',title:'Back off and resume.',body:'Cancel old timers and streams when the shop changes.',blue:true},
{label:'FILTERING',title:'Check both paths.',body:'A live filter and historical replay can behave differently.'},
{label:'CAPACITY',title:'Expect throttling.',body:'Per-subscriber limits apply. Do not assume infinite throughput.'}], 'Explain order as checkpoint position, then transaction position; an event adds its position within a transaction. The client uses exponential backoff capped at 30 seconds and generation guards to stop stale callbacks. In this demo, send_funds address-balance deposits were confirmed onchain but appeared after catch-up rather than on the live affectedAddress stream. Present that as an observed provider behaviour, not a universal permanent Sui rule. Re-test before class. Never fabricate a feed row from the pay button.');
// 21
flow('A live feed can become a small indexer.','03 / DURABLE STORAGE',[
['Subscribe','The same document and parser'],['Begin','Start a database transaction'],['Write','Insert receipts + save watermark'],['Commit','Advance both, or neither']], 'The Node indexer uses the same SSE parser and paymentsFrom function as the browser. It stores amounts as base-unit text, not JavaScript floats. SQLite is enough for a local class demo. In Postgres the same idea uses a unique key and a transaction. Keep one shop per supplied database file; this demo schema is not a multi-tenant accounting product. Source: indexer/indexer.ts and indexer/db.ts.');
// 22
code('The cursor belongs in the same commit.','indexer/indexer.ts / EXCERPT',`db.exec('BEGIN');
try {
  for (const p of payments) {
    insert.run(p.digest, p.coinType, p.amount,
      p.sender, p.checkpoint, p.timestamp, p.cursor);
  }
  saveCursor.run(shop, d.transactions.cursor,
    new Date().toISOString());
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}`, 'This is the writer excerpt with log lines omitted and arguments wrapped. INSERT OR IGNORE handles the primary key on digest and coin_type. Save the watermark even when a matching transaction produces no incoming receipt. Demonstrate stopping and restarting the indexer. Its stored cursor resumes the same feed. A failure between insert and watermark must roll both back. The code is for one shop per database file.','PRIMARY KEY (digest, coin_type)   /   Amounts as TEXT   /   Watermark per shop');
// 23
code('Run the writer. Restart it. Compare totals.','CLASSROOM TERMINAL',`pnpm install
cp .env.example .env
# Set SHOP_ADDRESS to the address shown in your Till.
# Set FROM_CHECKPOINT to its opening checkpoint.
pnpm indexer

# Stop and restart the writer. Then, in another terminal:
pnpm totals
pnpm receipt`, 'For local development use Node 24 and pnpm. The optional DeepSeek key is not needed for paying or subscribing. SHOP_ADDRESS is used only by the local indexer and CLI demo. FROM_CHECKPOINT is used only when the database has no watermark. Use a separate TILL_DB for each shop. The totals script sums BigInt values by coin type and UTC date. Stop and restart the writer, send a payment while it is stopped, then compare database totals and unique digests.','SQLite runs locally. The Vercel app does not host this long-running writer.');
// 24
cards('Know when the small writer is too small.','THE RUST BOUNDARY',[
{label:'LIGHTWEIGHT WRITER',title:'One focused feed.',body:'A shop address, modest volume and a simple derived table.'},
{label:'CUSTOM INDEXER',title:'A chain-scale pipeline.',body:'Checkpoint backfills, parallel work, schema ownership and reprocessing.',blue:true}], 'Do not use a browser subscription as a data warehouse. A Rust checkpoint indexing framework becomes useful for sustained throughput, custom joins, precise watermarks and checkpoint processing at scale. It introduces a real service, database operations and monitoring. Till demonstrates the smaller alternative, not a claim that a subscription replaces every indexer. Source: '+SOURCES.indexer);
// 25
screen('A full node can forget. History remains.','04 / ARCHIVED RECEIPT','receipt.png','This default testnet digest is ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a. Rechecked on 15 October 2026: the public full node gRPC lookup returned not found; GraphQL returned SUCCESS at checkpoint 250000000, timestamp 2025-10-07T22:04:44.571Z. The scripts/receipt.ts command demonstrates both responses. Not-found alone does not prove the cause for an arbitrary digest; this known old example has corroborating history.','Verified 15 October 2026   /   Transaction dated 7 October 2025   /   Checkpoint 250,000,000');
// 26
cards('Design inside the service limits.','TESTNET / OBSERVED 15 OCTOBER 2026',[
{label:'PAGINATION',title:'20 default / 50 max',body:'Observed for Query.transactions. Page through longer history.'},
{label:'QUERY BUDGET',title:'40 seconds',body:'Observed query timeout. Use small field selections.'},
{label:'PRODUCTION',title:'Choose a provider.',body:'Check quotas, retention, auth, uptime and subscription support.',blue:true}], 'The live serviceConfig reported defaultPageSize 20, maxPageSize 50 for type Query and field transactions, maxQueryDepth 20, maxQueryNodes 300 and queryTimeoutMs 40000. These are observed endpoint settings, not eternal protocol constants. Page nested connections as well as top-level queries for complete accounting. Till asks for the first 50 balance changes because its demo payments are small. Production requires provider-specific limits, reconnection monitoring and retention assumptions. Source: live introspection and '+SOURCES.graphql);
// 27
code('Migrate the intention, not just the method.','migration/ / THREE RUNNABLE EXAMPLES',`pnpm migrate:legacy   # inspect the JSON-RPC error body
pnpm migrate:grpc     # current balance through gRPC
pnpm migrate:graphql  # structured indexed query

// gRPC SDK shape used by the app:
const { balance } = await client.getBalance({
  owner: address, coinType: '0x2::sui::SUI'
});
// balance.balance includes coin and address balances.`, 'Run the three scripts in migration/. They show the old call and two replacements. Do not assume only renaming a method will migrate response types, pagination and error handling. In this SDK the unified balance includes address balance, which matters because faucet v3 and balance::send_funds can use that storage. Review every response shape against the installed SDK types. JSON-RPC availability depends on the provider. Source: '+SOURCES.migration+'; installed @mysten/sui 2.36.0.','Execute and read current state with gRPC. Query indexed history with GraphQL.');
// 28
cards('The lifecycle is part of the demo.','REFRESH / SWITCH / RESET / UPGRADE',[
{label:'REFRESH',title:'Resume explicitly.',body:'Open till restores the saved per-shop position.'},
{label:'SWITCH ACCOUNT',title:'Switch the shop too.',body:'A connected payer gets its own personal receiving address.',blue:true},
{label:'RESET SESSION',title:'Clear tracking only.',body:'Existing onchain funds and wallet keys stay in place.'},
{label:'UPGRADE',title:'Treat cursors carefully.',body:'Version local state. Rebuild if query semantics change.'}], 'Demo keys are local to this browser profile. Clearing site storage loses access to demo funds; the UI reset only clears receipts and cursor. If changing subscriptions, filters or storage formats, version snapshots and select an intentional historical opening checkpoint. Cursor compatibility is not guaranteed across arbitrary query changes. Rotating a payer or shop means funding and sharing a new address; keep old data for reconciliation. Shared server signing has been retired with HTTP 410.');
// 29
flow('Your turn: prove all four.','STUDENT CHALLENGE',[
['Isolation','Two browsers show different shops'],['Payment','A receipt matches a real digest'],['Recovery','Pause, pay, resume and reload'],['History','Find the October 2025 receipt']], 'Give students several minutes. Ask them to report their own shop address and one transaction digest, not any private key. Bonus: test an address-balance deposit and compare live versus catch-up. Bonus: run the SQLite writer and restart it. If the faucet is rate-limited, use the linked public testnet faucet and refresh the balances. Do not silently substitute fake values.','Explain why the payer can lose slightly more SUI than the shop receives.');
// 30
{const s=base('','TAKE IT WITH YOU','Close by asking students to explain the separation between sending a payment, receiving a live delivery and storing it durably. Live app: '+LIVE+'. Repository: '+REPO+'. The deck source, screenshots and test evidence are included under teaching/. Primary references: '+Object.values(SOURCES).join(' ; ')+'. Checked 15 October 2026. The connected-wallet boundary is checked with a Wallet Standard fixture; a physical wallet extension approval remains a manual classroom check.',C.dark);txt(s,'Make it live.\nMake it recover.',M,1.65,11.5,2.5,62,C.white);txt(s,'day3-till.vercel.app',M,4.7,11.5,.6,29,'9DADFF',{hyperlink:{url:LIVE}});txt(s,'github.com/Nuel-osas/day3-till',M,5.48,11.5,.42,19,C.dim,{hyperlink:{url:REPO}});txt(s,'YOUR NEXT BUILD / A LIVE FEED WITH A MEMORY',M,6.38,11.5,.25,11,C.dim,{fontFace:'JetBrains Mono'});}
if(p._slides.length!==30)throw Error('Expected 30 slides');
fs.mkdirSync(path.dirname(OUT),{recursive:true});
p.writeFile({fileName:OUT}).then(()=>{fs.writeFileSync(path.join(path.dirname(OUT),'Day3-speaker-notes.md'),notes.map((n,i)=>`## ${String(i+1).padStart(2,'0')}. ${n.title}\n\n${n.note}\n`).join('\n'));console.log(OUT);});
