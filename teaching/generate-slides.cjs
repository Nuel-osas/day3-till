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
// Presenter detail keeps the 15-slide lesson concise on screen.
const NOTE_EXTRAS = {
  "1": "Today’s route: choose a data layer, subscribe, send a payment, pause and recover, persist receipts, find history and migrate a legacy call. The demo is observation, not an allowance or a recurring-payment scheduler.",
  "2": "Class setup: choose Demo payer or My wallet, get test SUI for the payer, and open the till before sending. Browser keys stay local and each payer has a separate receiving shop. The shop needs no gas to receive. A connected wallet signs on sui:testnet. Keep the app open while teaching; the next screenshots refer to these same controls.",
  "3": "Choose by workload: wallets use gRPC plus GraphQL activity history; shops use subscriptions plus a small writer; games execute through gRPC and stream domain events; analytics use a checkpoint indexer. SQLite or Postgres can keep a focused feed. Use the Rust indexing framework for checkpoint backfills, parallel transformations, schema ownership and reprocessing at chain scale. Source: https://docs.sui.io/concepts/custom-indexing-framework",
  "6": "Live demo: wait for Live, send 0.01 test SUI, then inspect the feed and View receipt. Confirmation can precede GraphQL indexing. The receipt requires SUCCESS and a positive net balance change to the shop; sum each coin with BigInt before formatting. Outgoing transfers and failures are not sales. The class screenshot payment is 9dc36To1WB6PxSqHFyzbsYGSMtJ7JBVDSfuxkxnNUksv on testnet.",
  "7": "Live exercise: click Pause feed, send another payment, then Resume feed. This aborts only the subscription; chain activity and independent balance reads continue. After recovery, refresh the page and reopen the till. Ask the class to check that the digest appears once and the total is unchanged.",
  "8": "Persist each cursor together with its receipts in one versioned per-shop snapshot. Advancing the cursor first could lose a receipt on a crash. Deduplicate by digest plus normalized coin type. The browser list retains at most 500 records, so it is not a complete ledger. Ordering follows checkpoint, transaction position and, for events, event position. Treat cursors as opaque. Reconnect with backoff; cancel old retries when the account or shop changes.",
  "9": "Terminal walkthrough: use Node 24, run pnpm install, copy .env.example to .env, set SHOP_ADDRESS and FROM_CHECKPOINT from the UI, then run pnpm indexer. Stop the writer, send a payment, restart, and run pnpm totals in another terminal. Use one TILL_DB per shop. The tested writer backfilled three receipts totalling 0.03 SUI and resumed its watermark without duplicates. Amounts are stored as text and summed with BigInt. SQLite runs locally; the Vercel app does not host this long-running process.",
  "12": "Dates for context: GraphQL subscriptions were announced for mainnet and testnet on 21 September 2026. Foundation mainnet JSON-RPC disablement began the week of 27 July; source removal was planned for mid-October. The public testnet endpoint returned -32601 inside HTTP 200 on 15 October. Other providers may differ. Sources: https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions and https://docs.sui.io/develop/accessing-data/json-rpc-migration",
  "15": "Verified production testnet receipts: live coin transfer H1fQ22Q5V6yt37GaiySNqGhUJR7ki4b35Te9Qcja9Bqn; paused then recovered 66XRjyGEKngFwGZntzULDr6v4hrwFPnR8ZmY9fmPW6Zh; address-balance catch-up 5crvrKsvQGU3emZvNCEJgKjpAwENtCHHxfY4UMy11Dcc. See teaching/VERIFICATION.md for explorer links and the exact test scope."
};
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
{const s=base('','ACCOUNT LAYER WEEK / DAY 03','Today we build Till: a live payments screen. Days 1 and 2 dealt with identity and permission. Day 3 makes the resulting activity visible. Start by opening the live app; everyone will get a personal payer and a personal shop. All payments in this class use Sui testnet. No Move deployment is required for Till.',C.dark);rect(s,8.65,0,4.69,H,'101E69');rect(s,11.6,0,1.74,H,C.blue);txt(s,'Real-time\nSui.',M,1.75,9.8,2.95,72,C.white);txt(s,'A payment happens.\nYour app should know.',M,4.8,9.5,1.15,29,C.dim);txt(s,'GRAPHQL SUBSCRIPTIONS / THE NEW DATA STACK',M,6.38,11,.3,12,'9BAFFF',{fontFace:'JetBrains Mono'});}
// 02
screen('Meet your live till.','TODAY’S DEMO','overview.png','Open '+LIVE+'. Explain the visual hierarchy: personal payer and shop, money flow, stream status, payment feed, test payment controls. The app uses real testnet transactions. A green receipt is created from an indexed successful positive net balance change to the watched shop. The balance cards read gRPC independently of the subscription.','Live app: day3-till.vercel.app   /   Real testnet transactions. Personal student wallets.');
// 03
cards('Four layers. Four different jobs.','THE DATA STACK',[
{label:'01 / gRPC',title:'Read and act now.',body:'Balances, objects, execution and checkpoints.'},
{label:'02 / GRAPHQL',title:'Ask for a screen.',body:'Filtered history, selected fields and subscriptions.',blue:true},
{label:'03 / ARCHIVE',title:'Keep the past.',body:'History beyond a full node’s retention.'},
{label:'04 / YOUR INDEXER',title:'Own the data model.',body:'Durable aggregates, joins and reprocessing.'}], 'gRPC serves the full node interface, including transaction execution. GraphQL is an indexed service with expressive selections and subscriptions. Archival storage keeps history beyond a node retention window; an arbitrary gRPC endpoint does not automatically query it. A custom indexer owns a derived model in your database. Source: '+SOURCES.graphql);
// 04
{const query=file('src/lib/till.ts').split('/* GraphQL */ `')[1].split('`;')[0].trim();code('One document. Any shop.','src/lib/till.ts',query,'Read the actual subscription in the repository. affectedAddress narrows candidates to this shop. after is a stream cursor; afterCheckpoint establishes an opening boundary when there is no cursor yet. The payload includes only the fields used to derive receipts. Balance changes are bounded to 50 here, sufficient for the small demo transactions but not a universal accounting guarantee. Source: live schema introspection, 15 October 2026; '+SOURCES.schema,'Select a small payload. Every matching transaction carries a cursor.');}
// 05
cards('Choose a filter. Open the stream.','SUBSCRIPTIONS + TRANSPORT',[
{label:'TRANSACTIONS',title:'Who or what?',body:'affectedAddress · affectedObject · sentAddress'},
{label:'EVENTS',title:'Which event?',body:'sender · module · type + checkpoint bounds.'},
{label:'CHECKPOINTS',title:'Follow chain progress.',body:'Ordered delivery with a saved resume position.'},
{label:'SSE OVER POST',title:'Use fetch to listen.',body:'EventSource cannot send the GraphQL query body.',blue:true}], 'Transactions, events and checkpoints are the subscription roots. Transaction filters also include function, kind, afterCheckpoint, atCheckpoint and beforeCheckpoint. Events accept sender, module, type and checkpoint boundaries. POST { query, variables } to /graphql/subscriptions with Accept: text/event-stream. This is not a websocket. The shared src/lib/sse.ts parser handles keepalive comments, split CRLF frames, multiline data and empty complete events. GraphQL errors can arrive inside HTTP 200 and must trigger failure/retry, not a false Live state. Sources: live schema checked 15 October 2026; '+SOURCES.schema);
// 06
screen('Watch the money move.','RED OUT / GREEN IN','balances.png','Read both balances before and after a transfer. The payer’s net debit includes gas; it need not equal exactly the payment. The shop receives the payment amount. Both cards include coin-object balances and address balances. Their latest change is measured between gRPC reads, so concurrent activity can affect it. The app labels the delta as latest change, not exact transaction accounting.','Payer ↓ payment + gas   /   Shop ↑ received value   /   Balances refresh independently of the feed');
// 07
screen('It catches up from where you stopped.','LIVE DEMO / RECOVERY','recovery.png','The recovered tag is assigned to a payment whose chain timestamp predates the connection start. It is an instructional approximation using browser time, not a protocol flag. The important assertions are the transaction digest appearing once and the totals remaining correct. Refresh the page, click Open till again, and show that replay does not duplicate the already stored payment.','Saved position → historical catch-up → live delivery on the same connection');
// 08
flow('No cursor yet? Keep a checkpoint.','RESUME STRATEGY',[
['First open','Capture an opening checkpoint'],['First delivery','Save the cursor with its payment'],['Reconnect','Use after, or the opening checkpoint'],['Continue','Replay first. Then follow live.']], 'The old app could miss a payment if it disconnected before its first matching delivery: no cursor had been saved. The upgraded app captures the latest indexed checkpoint before opening the stream and persists it. When there is no cursor, it sends afterCheckpoint. Once a cursor exists, after takes over. Do not parse or manufacture a cursor; treat it as opaque and keep it scoped to the shop and query.');
// 09
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
}`, 'This is the writer excerpt with log lines omitted and arguments wrapped. INSERT OR IGNORE handles the primary key on digest and coin_type. Save the watermark even when a matching transaction produces no incoming receipt. Demonstrate stopping and restarting the indexer. Its stored cursor resumes the same feed. A failure between insert and watermark must roll both back. The code is for one shop per database file.','pnpm indexer → pnpm totals   /   PRIMARY KEY (digest, coin_type)   /   One commit');
// 10
screen('A full node can forget. History remains.','04 / ARCHIVED RECEIPT','receipt.png','This default testnet digest is ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a. Rechecked on 15 October 2026: the public full node gRPC lookup returned not found; GraphQL returned SUCCESS at checkpoint 250000000, timestamp 2025-10-07T22:04:44.571Z. The scripts/receipt.ts command demonstrates both responses. Not-found alone does not prove the cause for an arbitrary digest; this known old example has corroborating history.','Verified 15 October 2026   /   Transaction dated 7 October 2025   /   Checkpoint 250,000,000');
// 11
cards('Plan for limits and real-world gaps.','GOTCHAS / OBSERVED 15 OCTOBER 2026',[
{label:'PAGINATION',title:'20 default / 50 max',body:'Observed for Query.transactions. Page longer history.'},
{label:'QUERY TIMEOUT',title:'40 seconds',body:'Keep selections small. Provider settings can change.'},
{label:'LIVE FILTER GAP',title:'Confirmed, but missing?',body:'Address-balance deposits appeared after catch-up.',blue:true},
{label:'PRODUCTION',title:'Check your provider.',body:'Throttling, retention, quotas, auth and uptime matter.'}], 'These are observed public testnet settings, not protocol constants: Query.transactions default page 20 and maximum 50, query timeout 40000 ms, maximum depth 20 and nodes 300. Page nested connections for complete accounting; Till selects the first 50 balance changes per transaction. Per-subscriber throttling applies, but its threshold was not measured. In both local and production tests, balance::send_funds deposits changed onchain balances but appeared in the affectedAddress feed only after Catch up now. Present this as measured provider behaviour and re-test before class. HTTP 200 may contain a GraphQL or JSON-RPC error. The faucet can be slow or rate-limited; refresh balances before retrying. Browser storage can be blocked or cleared, which affects persistence and demo keys. The app labels these boundaries rather than fabricating receipts. Source: '+SOURCES.graphql);
// 12
code('Migrate the intention, not just the method.','migration/ / THREE RUNNABLE EXAMPLES',`pnpm migrate:legacy   # inspect the JSON-RPC error body
pnpm migrate:grpc     # current balance through gRPC
pnpm migrate:graphql  # structured indexed query

// gRPC SDK shape used by the app:
const { balance } = await client.getBalance({
  owner: address, coinType: '0x2::sui::SUI'
});
// balance.balance includes coin and address balances.`, 'Run the three scripts in migration/. They show the old call and two replacements. Do not assume only renaming a method will migrate response types, pagination and error handling. In this SDK the unified balance includes address balance, which matters because faucet v3 and balance::send_funds can use that storage. Review every response shape against the installed SDK types. JSON-RPC availability depends on the provider. Source: '+SOURCES.migration+'; installed @mysten/sui 2.36.0.','Execute and read current state with gRPC. Query indexed history with GraphQL.');
// 13
cards('The lifecycle is part of the demo.','REFRESH / SWITCH / RESET / UPGRADE',[
{label:'REFRESH',title:'Resume explicitly.',body:'Open till restores the saved per-shop position.'},
{label:'SWITCH ACCOUNT',title:'Switch the shop too.',body:'A connected payer gets its own personal receiving address.',blue:true},
{label:'RESET SESSION',title:'Clear tracking only.',body:'Existing onchain funds and wallet keys stay in place.'},
{label:'UPGRADE',title:'Treat cursors carefully.',body:'Version local state. Rebuild if query semantics change.'}], 'Demo keys are local to this browser profile. Clearing site storage loses access to demo funds; the UI reset only clears receipts and cursor. If changing subscriptions, filters or storage formats, version snapshots and select an intentional historical opening checkpoint. Cursor compatibility is not guaranteed across arbitrary query changes. Rotating a payer or shop means funding and sharing a new address; keep old data for reconciliation. Shared server signing has been retired with HTTP 410.');
// 14
flow('Your turn: prove all four.','STUDENT CHALLENGE',[
['Isolation','Two browsers show different shops'],['Payment','A receipt matches a real digest'],['Recovery','Pause, pay, resume and reload'],['History','Find the October 2025 receipt']], 'Give students several minutes. Ask them to report their own shop address and one transaction digest, not any private key. Bonus: test an address-balance deposit and compare live versus catch-up. Bonus: run the SQLite writer and restart it. If the faucet is rate-limited, use the linked public testnet faucet and refresh the balances. Do not silently substitute fake values.','day3-till.vercel.app   /   Pay, pause, recover, reload. Then inspect an old receipt.');
// 15
{const s=base('','TAKE IT WITH YOU','Close by asking students to explain the separation between sending a payment, receiving a live delivery and storing it durably. Live app: '+LIVE+'. Repository: '+REPO+'. The deck source, screenshots and test evidence are included under teaching/. Primary references: '+Object.values(SOURCES).join(' ; ')+'. Checked 15 October 2026. The connected-wallet boundary is checked with a Wallet Standard fixture; a physical wallet extension approval remains a manual classroom check.',C.dark);txt(s,'Make it live.\nMake it recover.',M,1.65,11.5,2.5,62,C.white);txt(s,'day3-till.vercel.app',M,4.7,11.5,.6,29,'9DADFF',{hyperlink:{url:LIVE}});txt(s,'github.com/Nuel-osas/day3-till',M,5.48,11.5,.42,19,C.dim,{hyperlink:{url:REPO}});txt(s,'YOUR NEXT BUILD / A LIVE FEED WITH A MEMORY',M,6.38,11.5,.25,11,C.dim,{fontFace:'JetBrains Mono'});}
if(p._slides.length!==15)throw Error('Expected 15 slides');
fs.mkdirSync(path.dirname(OUT),{recursive:true});
p.writeFile({fileName:OUT}).then(()=>{fs.writeFileSync(path.join(path.dirname(OUT),'Day3-speaker-notes.md'),notes.map((n,i)=>`## ${String(i+1).padStart(2,'0')}. ${n.title}\n\n${n.note}\n`).join('\n'));console.log(OUT);});
