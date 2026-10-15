// Generate the editable Day 3 deck. Run with pnpm slides.
const pptxgen = require('pptxgenjs');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.SLIDES_OUT || path.join(__dirname, 'Day3_Till_Live_Data_Seedless_Style.pptx');
const p = new pptxgen(); p.layout = 'LAYOUT_WIDE';
p.author = 'Ruru | SuiHub Lagos'; p.subject = 'Account Layer Week, Day 3'; p.title = 'Real-Time Sui: GraphQL Subscriptions and the Data Stack After JSON-RPC'; p.company = 'SuiHub Lagos'; p.lang = 'en-GB';
p.theme = { headFontFace: 'DM Sans', bodyFontFace: 'DM Sans', lang: 'en-GB' };
const C = { dark:'07080F', blue:'2338FF', light:'F4F5F8', white:'FFFFFF', ink:'131725', muted:'69738B', pale:'E8ECFF', dim:'ACB8DB', green:'078256', red:'C5424E' };
const W=13.333333,H=7.5,M=.85;
const notes=[];
const NOTE_EXTRAS = {};
const LIVE='https://day3-till.vercel.app';
const REPO='https://github.com/Nuel-osas/day3-till';
const SOURCES={launch:'https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions',graphql:'https://docs.sui.io/develop/accessing-data/graphql/graphql-rpc',migration:'https://docs.sui.io/develop/accessing-data/json-rpc-migration',schema:'https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql',indexer:'https://docs.sui.io/concepts/custom-indexing-framework'};
function txt(s,t,x,y,w,h,size=22,color=C.ink,extra={}){s.addText(t,{x,y,w,h,fontFace:'DM Sans',fontSize:size,color,margin:0,breakLine:false,vertAnchor:'mid',valign:'mid',...extra});}
function rect(s,x,y,w,h,color,r=0){s.addShape(r?'roundRect':'rect',{x,y,w,h,rectRadius:r,fill:{color},line:{color,transparency:100},radius:r});}
function label(s,t,y=.55,color=C.muted){txt(s,`[ ${t.toUpperCase()} ]`,M,y,W-M*2,.3,10,color,{fontFace:'JetBrains Mono',charSpacing:1.5});}
function base(title,eyebrow,note,bg=C.light){const s=p.addSlide();note = [note, NOTE_EXTRAS[p._slides.length]].filter(Boolean).join('\n\n');s.background={color:bg};const dark=bg!==C.light;label(s,eyebrow,.55,dark?C.dim:C.muted);if(title)txt(s,title,M,1.02,W-M*2,1.25,37,dark?C.white:C.ink,{breakLine:false});txt(s,'SUIHUB LAGOS / ACCOUNT LAYER WEEK',M,7.04,8,.2,8,dark?C.dim:C.muted,{fontFace:'JetBrains Mono',charSpacing:1});txt(s,String(p._slides.length).padStart(2,'0'),11.7,7.02,.75,.23,10,dark?C.dim:C.muted,{align:'right',fontFace:'JetBrains Mono'});s.addNotes(note);notes.push({title:title||eyebrow,note});return s;}
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
{
 const s=base('','SUIHUB LAGOS / DAY 03',
 'This session is about choosing and using the Sui data stack after JSON-RPC. Till is the practical case study that makes subscriptions, recovery, persistence and history visible. The final workshop applies the same migration to a project each student brings. No Move is required. Keep the distinction from Day 2 clear: this is data access and application architecture, not recurring-payment permission.',C.dark);
 rect(s,9.15,0,4.19,H,'101E69');rect(s,11.6,0,1.74,H,C.blue);
 txt(s,'Real-Time Sui',M,1.65,10.7,1.1,62,C.white);
 txt(s,'GraphQL Subscriptions\nand the Data Stack\nAfter JSON-RPC',M,3.05,8.3,2.25,34,C.dim);
 txt(s,'MAP THE STACK / BUILD TILL / MIGRATE YOUR APP',M,6.3,11,.35,11,'9BAFFF',{fontFace:'JetBrains Mono'});
}
// 02
cards('Why this session, now?','THE MIGRATION CONTEXT',[
 {label:'JULY 2026',title:'JSON-RPC shutoff',body:'Foundation mainnet disablement began the week of 27 July.'},
 {label:'21 SEPTEMBER',title:'Subscriptions live',body:'GraphQL subscriptions announced for mainnet and testnet.',blue:true},
 {label:'YOUR APP',title:'Choose its data path.',body:'Read current state, stream activity, retrieve history and migrate.'}],
 'The official migration page reports Foundation mainnet JSON-RPC disablement in the week of 27 July 2026 and plans source removal for mid-October. Avoid claiming that every provider has already removed it. The public testnet endpoint returned -32601 inside HTTP 200 in our 15 October checks. The GraphQL subscription announcement is dated 21 September. Today we build the replacement path and migrate one real call. Sources: '+SOURCES.migration+' ; '+SOURCES.launch);
// 03
cards('Four layers. Choose for your workload.','THE DATA STACK',[
 {label:'gRPC / WALLET + GAME',title:'Current state and actions',body:'Balances, execution and live checkpoint streams.'},
 {label:'GRAPHQL / APP + SHOP',title:'Filtered reads and feeds',body:'Select fields, join history and subscribe to activity.',blue:true},
 {label:'ARCHIVE / OLD RECEIPTS',title:'History past retention',body:'Retrieve records a full node has pruned.'},
 {label:'CUSTOM INDEXER / ANALYTICS',title:'Your own data model',body:'Backfill checkpoints, transform data and own aggregates.'}],
 'The workload determines the combination. A wallet uses gRPC for state and execution, with GraphQL for activity. A shop can use a GraphQL subscription plus a small database writer. A game executes actions through gRPC and streams domain events. An analytics backend often needs a custom checkpoint pipeline. Archival access is a separate data service; full node gRPC does not silently fall back to old history. A GraphQL operator can configure archive-backed point lookups. Sources: '+SOURCES.graphql+' ; '+SOURCES.indexer);
// 04
{
 const s=cards('Subscribe to what your screen needs.','TRANSACTIONS + EVENTS',[
 {label:'TRANSACTIONS',title:'Address, object or call',body:'affectedAddress · affectedObject\nfunction · kind · sentAddress\nCheckpoint bounds + cursor'},
 {label:'EVENTS',title:'Sender, module or type',body:'sender · module · type\nCheckpoint bounds + cursor\nSelect only the fields you need.',blue:true}],
 'These field names come from the live testnet schema. Transactions support affectedAddress, affectedObject, function, kind and sentAddress. Event filters support sender, module and type. Both support afterCheckpoint, atCheckpoint and beforeCheckpoint. checkpoints is also a subscription root. A subscription returns edges with cursor and node. Use an affectedAddress transaction feed for Till; use typed events when your Move application emits a domain event. No custom indexer deployment is needed just to consume this hosted service. Indexing still happens behind the service. Source: '+SOURCES.schema);
 txt(s,'Till selects digest, sender, status, timestamp, checkpoint and balance changes.',M,6.55,11.6,.35,16,C.muted);
}
// 05
{
 const query=file('src/lib/till.ts').split('/* GraphQL */ `')[1].split('`;')[0].trim();
 code('The actual Till subscription.','src/lib/till.ts',query,
 'This is the actual repository document. Point out the affectedAddress filter and how the selection set is limited to receipt data. A match is only a candidate payment: the client also checks SUCCESS and keeps positive net changes for the shop, grouped by normalized coin type using BigInt. Outgoing transfers and failed transactions must not become sales. The first 50 balance changes are enough for the small demo transfers, not a complete accounting guarantee for arbitrary complex transactions.',
 'A matching transaction becomes a receipt only after success and balance-change checks.');
}
// 06
code('POST + SSE. Stream with fetch.','src/lib/sse.ts',
 file('src/lib/sse.ts').slice(file('src/lib/sse.ts').indexOf('  const res = await fetch'),file('src/lib/sse.ts').indexOf('  let buf')).trim(),
 'POST the GraphQL query and variables to /graphql/subscriptions. The response is text/event-stream. Browser EventSource cannot send the POST body, and a websocket client uses the wrong transport. The shared browser/Node parser handles comments, split CRLF frames, multiline data and complete events. GraphQL errors may be inside HTTP 200, so the caller must treat them as errors and reconnect appropriately. The seven automated tests include these parser cases.',
 'POST /graphql/subscriptions   /   text/event-stream   /   EventSource cannot POST the query');
// 07
flow('Resume from a durable position.','CURSOR → BACKFILL → LIVE',[
 ['First start','afterCheckpoint sets the opening boundary'],
 ['Every delivery','Persist the cursor with processed data'],
 ['Reconnect','after resumes from the last saved cursor'],
 ['Catch up','Replay missed activity, then switch to live']],
 'Capture an opening checkpoint before the first subscription so a disconnect before any delivery can still recover. Once a cursor exists, resume with after. Treat cursors as opaque and scoped to the shop and query. Persist progress for every matching delivery, even one that is not a sale. Checkpoint order comes first, then transaction position, with event position within a transaction for events. Per-subscriber throttling and server disconnects require bounded processing, backoff and retry. Our client cancels stale streams and retries when a shop changes. A successful reconnect alone is not proof that your app stored every payment.',
 'Checkpoint order → transaction order → event order. Respect subscriber throttling.');
// 08
code('A small indexer: commit data and cursor.','indexer/indexer.ts / EXCERPT',`db.exec('BEGIN');
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
}`,
 'A TypeScript subscriber can write to SQLite or Postgres. The cursor is the progress watermark; this receipt writer uses PRIMARY KEY (digest, coin_type) as its unique business-record key, rather than assuming that a cursor itself identifies one payment. INSERT OR IGNORE makes replay idempotent. Commit rows and watermark together, or roll back both. Amounts are base-unit text and totals use BigInt. Local exercise: copy .env.example, set SHOP_ADDRESS and FROM_CHECKPOINT, run pnpm indexer, stop it, pay, restart, then pnpm totals. The tested restart retained three receipts totalling 0.03 SUI without duplication. Use one database per shop. Vercel does not run this long-lived writer.',
 'pnpm indexer → stop → pay → restart → pnpm totals   /   Atomic writes + unique receipt keys');
// 09
cards('When should you use the Rust framework?','SUBSCRIPTION WRITER → CUSTOM PIPELINE',[
 {label:'SQLITE / POSTGRES WRITER',title:'A focused application feed',body:'One shop, selected activity,\na small derived table\nand straightforward totals.'},
 {label:'RUST INDEXING FRAMEWORK',title:'A checkpoint pipeline',body:'Large backfills, parallel work,\ncustom schemas, complex joins\nand controlled reprocessing.',blue:true}],
 'The subscription writer is the lighter path for an application that does not need a full indexing pipeline. The custom framework becomes useful when throughput, backfill, transformations and recovery belong under your control. It brings operational work: database migrations, checkpoint watermarks, monitoring and reprocessing. This session explains that decision boundary; it does not build a new Rust indexer. Source: '+SOURCES.indexer);
// 10
screen('Find history beyond the full node.','ARCHIVAL STORE + GRAPHQL','receipt.png',
 'Use the receipt page or pnpm receipt. Verified on 15 October 2026: the public gRPC full node returned not found for ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a, while GraphQL returned SUCCESS at checkpoint 250000000 on 7 October 2025. Full-node retention is different from archival history. A random not-found response alone does not prove pruning; this known old receipt has corroborating data. The app labels its result source and keeps the full digest available.',
 'Known receipt: 7 October 2025   /   Checkpoint 250,000,000   /   GraphQL found it');
// 11
cards('Public endpoints are for development.','LIMITS + PROVIDERS + GOTCHAS',[
 {label:'QUERY BUDGET / OBSERVED',title:'5,000 bytes · 40 seconds',body:'Query payload and timeout limits vary by service.'},
 {label:'PAGINATION / OBSERVED',title:'20 default · 50 maximum',body:'Page Query.transactions and nested collections.'},
 {label:'BEFORE LAUNCH',title:'Choose a production endpoint.',body:'Check quotas, throttling, retention, auth and uptime.',blue:true},
 {label:'REAL DEMO GOTCHA',title:'Confirmed, but missing live?',body:'Address-balance deposits appeared after catch-up.'}],
 'Read the service configuration, not a guessed universal limit. Today the testnet service reports maxQueryPayloadSize 5000, queryTimeoutMs 40000, Query.transactions defaultPageSize 20, maxPageSize 50, maxQueryDepth 20 and maxQueryNodes 300. Foundation public load balancers are rate-limited development/public-good endpoints; arrange a dedicated provider or your own service before a production launch. Check subscription support and archival retention explicitly. Tested send_funds address-balance deposits changed balances but appeared in the affectedAddress subscription only after catch-up. Other traps: HTTP 200 may contain errors; the faucet may delay or rate-limit; clearing browser storage loses local demo keys; a changed query may need a fresh historical boundary. Sources: live serviceConfig; '+SOURCES.migration+' ; '+SOURCES.graphql);
// 12
screen('Build Till on the stack we just mapped.','HANDS-ON / YOUR OWN SHOP','overview.png',
 'Till is the case study, not the whole subject. It executes through gRPC, subscribes through GraphQL, saves receipt progress, writes a separate SQLite ledger and looks up archived history. Each student gets a separate browser payer and shop, or connects a testnet wallet. Open till, fund the payer and send a payment. Compare the red debit with the green credit; gas is paid in SUI. Wait for the actual indexed receipt and enable the chime through a user gesture. The advertised event names USDC. Readiness gap: the built-in form currently sends SUI, and no funded USDC payment has been verified. The receipt and local database paths handle coin types generically, but that is not proof of a successful USDC run. Say this before class rather than presenting the SUI screenshot as USDC. Do not use mainnet funds for this testnet lab.',
 'Current verified walkthrough: test SUI. The advertised USDC payment still needs verification.');
// 13
screen('Pause mid-sale. Recover. Reconcile.','HANDS-ON / DELIVERY + LIFECYCLE','recovery.png',
 'Pause the feed, send another payment, then Resume. This aborts only the listener, so payments and independent gRPC balance refreshes keep working. The recovered label is a browser-time approximation; verify the actual digest and total. Then reload and reopen the till to check deduplication. Start the local indexer and compare pnpm totals with the tracked receipts. The browser keeps only 500 records and is not a complete ledger. Switch connected payer to show its own shop, return to restore the prior shop, and explain that Reset clears tracking but not keys or onchain funds. Query/version changes need intentionally chosen resume boundaries. Actual production proofs: live H1fQ22Q5V6yt37GaiySNqGhUJR7ki4b35Te9Qcja9Bqn; paused then recovered 66XRjyGEKngFwGZntzULDr6v4hrwFPnR8ZmY9fmPW6Zh. Physical wallet approval and audible playback remain manual checks.',
 'Reload → resume   /   Switch payer → personal shop   /   Reset tracking → funds stay onchain');
// 14
code('Migrate a JSON-RPC call.','migration/ / RUNNABLE EXAMPLES',`pnpm migrate:legacy   # inspect the JSON-RPC error body
pnpm migrate:grpc     # current balance through gRPC
pnpm migrate:graphql  # structured indexed query

// From migration/migrated-grpc.ts:
const { balance } = await client.getBalance({ owner: SHOP });
console.log('getBalance     ', balance);`,
 'Open the three files in migration/. The legacy SuiJsonRpcClient calls getBalance, getTransactionBlock and queryEvents. The gRPC replacement uses SuiGrpcClient and typed results. The GraphQL version shows both a shared client API and one query joining the selected balance, transaction and events data. Migrate the response shape, errors and pagination too. Do not reuse a legacy API cursor in the new API. Include both coin and address balances. Our gRPC event example normalizes the event type because short-form addresses were rejected. Use the installed SDK types, as older examples and individual documentation tables may lag new releases. Source: '+SOURCES.migration,
 'suix_getBalance → getBalance or Address.balance   /   Transaction and event examples included');
// 15
{
 const s=flow('Now migrate one call in your own app.','THE ROOM’S PROJECTS / WORKSHOP',[
 ['Find','Locate one JSON-RPC read or polling loop'],
 ['Choose','gRPC, GraphQL, subscription or indexer'],
 ['Replace','Port fields, response shape and pagination'],
 ['Prove','Check results, reconnect and old-history behaviour']],
 'This is the advertised final workshop. Ask students to open a project they brought. If they have none, use Till’s migration folder. Choose one existing read, map it to the right data service, run both available paths against known data, inspect failure behaviour and record what changed. For polling screens, determine whether a subscription fits. For production, name the endpoint provider and quotas. The class deliverable is a working migrated call plus an explanation of the chosen data path. References are in the README, and verified testnet receipts are in teaching/VERIFICATION.md. Live app: '+LIVE+'. Repository: '+REPO+'.',
 'Deliverable: one working migrated call, with a clear reason for the chosen data service.');
 txt(s,'day3-till.vercel.app',M,6.63,4.7,.25,12,C.blue,{hyperlink:{url:LIVE}});
 txt(s,'github.com/Nuel-osas/day3-till',6.25,6.63,6.2,.25,12,C.blue,{hyperlink:{url:REPO}});
}
if(p._slides.length!==15)throw Error('Expected 15 slides');
fs.mkdirSync(path.dirname(OUT),{recursive:true});
p.writeFile({fileName:OUT}).then(()=>{fs.writeFileSync(path.join(path.dirname(OUT),'Day3-speaker-notes.md'),notes.map((n,i)=>`## ${String(i+1).padStart(2,'0')}. ${n.title}\n\n${n.note}\n`).join('\n'));console.log(OUT);});
