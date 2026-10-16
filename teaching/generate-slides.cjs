// Editable 15-slide lesson. Run pnpm slides; render with teaching/RENDERING.md.
const pptxgen = require('pptxgenjs'), fs = require('node:fs'), path = require('node:path');
const ROOT=path.resolve(__dirname,'..');
const OUT=process.env.SLIDES_OUT||path.join(__dirname,'Day3_Real_Time_Sui.pptx');
const LIVE='https://day3-till.vercel.app', REPO='https://github.com/Nuel-osas/day3-till';
const S={
 launch:'https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions',
 migration:'https://docs.sui.io/develop/accessing-data/json-rpc-migration',
 schema:'https://github.com/MystenLabs/sui/blob/main/crates/sui-indexer-alt-graphql/schema.graphql',
 queries:'https://docs.sui.io/develop/accessing-data/graphql/query-with-graphql',
 indexer:'https://docs.sui.io/develop/accessing-data/custom-indexer',
};
const p=new pptxgen();p.layout='LAYOUT_WIDE';
p.author='Ruru | SuiHub Lagos';p.company='SuiHub Lagos';p.lang='en-GB';
p.title='Real-Time Sui: GraphQL Subscriptions and the Data Stack After JSON-RPC';
p.subject='Day 3 / 15-slide teaching edition / 16 October 2026';
p.theme={headFontFace:'DM Sans',bodyFontFace:'DM Sans',lang:'en-GB'};
const C={dark:'07080F',blue:'2338FF',paper:'F4F5F8',white:'FFFFFF',ink:'131725',muted:'65708B',pale:'E8ECFF',dim:'B7C3E2',green:'078256',red:'B93A4B',amber:'89551C',cream:'FFF0DA'};
const W=13.333333,M=.75,notes=[];
const text=(s,t,x,y,w,h,size=20,color=C.ink,more={})=>s.addText(t,{x,y,w,h,fontFace:'DM Sans',fontSize:size,color,margin:0,breakLine:false,valign:'mid',...more});
const box=(s,x,y,w,h,color)=>s.addShape('rect',{x,y,w,h,fill:{color},line:{color,transparency:100}});
const mono=(s,t,x,y,w,h=.24,size=10,color=C.blue)=>text(s,t,x,y,w,h,size,color,{fontFace:'JetBrains Mono'});
function arrow(s,x,y,w,color=C.blue){text(s,'→',x+(w-.35)/2,y-.2,.35,.4,20,color,{align:'center'});}
function bar(s,t,y=6.38,color=C.blue,bg=C.pale){box(s,M,y,W-M*2,.46,bg);text(s,t,M+.16,y+.06,W-M*2-.32,.34,15,color);}
function base(title,part,note,dark=false){
 const s=p.addSlide();s.background={color:dark?C.dark:C.paper};
 mono(s,'[ '+part.toUpperCase()+' ]',M,.48,11.8,.25,10,dark?C.dim:C.muted);
 text(s,title,M,.96,11.85,1.04,p._slides.length===1?56:35,dark?C.white:C.ink);
 mono(s,'ACCOUNT LAYER WEEK / SUIHUB LAGOS',M,7.08,8,.18,8,dark?C.dim:C.muted);
 mono(s,String(p._slides.length).padStart(2,'0')+' / 15',11.7,7.04,.9,.25,9,dark?C.dim:C.muted);
 const noteText=['EXPLAIN\n'+note.explain,'SHOW / DO\n'+note.show,'ASK THE ROOM\n'+note.ask,'EXPECTED ANSWER\n'+note.answer,'TRANSITION\n'+note.next,note.refs?'REFERENCES\n'+note.refs:''].filter(Boolean).join('\n\n');
 s.addNotes(noteText);notes.push({title,note:noteText});return s;
}
function panel(s,{x,y,w,h,tag,title,body,blue=false}){
 box(s,x,y,w,h,blue?C.blue:C.white);
 if(tag)mono(s,tag,x+.22,y+.2,w-.44,.25,10,blue?'C4CEFF':C.blue);
 const compact=h<2.5;
 text(s,title,x+.22,y+(compact?.58:.64),w-.44,compact?.62:.92,compact?22:24,blue?C.white:C.ink);
 if(body)text(s,body,x+.22,y+(compact?1.24:1.69),w-.44,h-(compact?1.4:1.89),18,blue?'E4E9FF':C.muted,{valign:'top'});
}
function code(s,source,x,y,w,h,size=16){box(s,x,y,w,h,'111529');text(s,source,x+.22,y+.2,w-.44,h-.4,size,'E1E7FF',{fontFace:'JetBrains Mono',valign:'top'});}
function rows(s,items,{x=M,y=2.35,width=11.83,height=.68,first=2.5,second=3.5,font=17}={}){
 items.forEach((row,i)=>{const ry=y+i*height;box(s,x,ry,width,height-.06,i===0?C.blue:(i%2?C.white:C.pale));const color=i===0?C.white:C.ink;
 text(s,row[0],x+.16,ry+.08,first-.25,height-.20,font,color);
 text(s,row[1],x+first,ry+.08,second-.2,height-.20,font,color);
 text(s,row[2],x+first+second,ry+.08,width-first-second-.2,height-.20,font,i===0?C.white:C.muted);});
}
const file=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const snippet=(source,start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a);if(a<0||b<0)throw Error('Missing source excerpt: '+start);return source.slice(a,b).trim();};

// 01: The event's promise, in its own order.
{
 const s=base('Real-Time Sui','DAY 03 / THE CLASS PROMISE',{
 explain:'Today has three connected outcomes: choose the right Sui data interface, build a reliable live feed through Till, and migrate a read in your own app. This is the advertised GraphQL subscriptions and post-JSON-RPC data-stack session. Till supplies a concrete problem for the architecture.',
 show:'Open the live app and repository before class. Ask students to keep a project with a JSON-RPC read ready. Use Node 24 for the supplied repository, pnpm and testnet funds. No Move code is required.',
 ask:'Which part of your app still polls or uses JSON-RPC?',
 answer:'Collect one example from a wallet, game, payments screen or backend. Return to it on slide 15.',
 next:'Separate the data responsibilities that used to sit behind one familiar API.'},true);
 text(s,'GraphQL Subscriptions\nand the Data Stack After JSON-RPC',M,2.05,11.8,1.5,37,C.dim);
 [['01 / CHOOSE','Map the data stack'],['02 / BUILD','A feed that survives a drop'],['03 / MIGRATE','One call in your own app']].forEach((a,i)=>{const x=M+i*4.04;box(s,x,4.52,3.75,1.6,i===1?C.blue:'141B32');mono(s,a[0],x+.2,4.74,3.3,.25,11,C.dim);text(s,a[1],x+.2,5.08,3.3,.85,23,C.white);});
 text(s,'A payment screen is the worked example for the whole lesson.',M,6.46,11.8,.35,19,C.dim);
}
// 02
{
 const s=base('Replace the data path your app depends on.','1 / CHOOSE THE STACK',{
 explain:'Foundation mainnet JSON-RPC was disabled in the week of 27 July 2026; source removal was scheduled for mid-October. Availability at other providers can differ. The 21 September announcement adds GraphQL subscriptions. Application responsibilities remain, but can now use different interfaces.',
 show:'Classify a screen: read the balance, observe a new payment, retrieve an old receipt. The same app can use more than one interface.',
 ask:'Would replacing every JSON-RPC URL with one GraphQL URL complete a migration?',
 answer:'No. Request types, selected fields, response shapes, errors, pagination and streaming transport must be adapted.',
 next:'Place those interfaces on a map, including the services behind them.',refs:S.migration+' ; '+S.launch});
 text(s,'Start with what the screen or worker needs to do.',M,2.13,11.8,.45,23,C.muted);
 rows(s,[['APP NEED','REPLACEMENT PATH','TILL EXAMPLE'],['State + execution','gRPC','Read balances; submit a payment'],['Filtered activity','GraphQL query + subscription','Load receipts; receive new ones'],['Pruned history','Archive / backed GraphQL','Find an old transaction by digest']],{y:2.95,height:.78,first:2.8,second:4.15,font:19});
 bar(s,'July: Foundation mainnet shutoff   →   September: GraphQL subscriptions   →   Migrate each call',6.42);
}
// 03
{
 const s=base('Where each piece sits in the data stack.','1 / ARCHITECTURE + WORKLOAD CHOICES',{
 explain:'Read the upper path left to right: finalized Sui data reaches services; GraphQL selects and resolves the app view. The archive supplies retained history when configured. A custom indexer is an alternative owned processing path, not a mandatory layer for every frontend. A wallet can combine direct gRPC operations and GraphQL activity. These boxes describe our chosen architecture, not exclusive capabilities of each protocol.',
 show:'Trace a live payment through gRPC checkpoint data to the GraphQL subscription and browser. Trace a historical point lookup through the archive. Point to the lower custom-indexer path for owned analytics.',
 ask:'Does a hosted GraphQL subscription mean there is no indexing infrastructure?',
 answer:'The provider runs the data service. The app avoids operating a full indexing pipeline merely to consume a feed.',
 next:'Apply the map to the shop workflow promised in the announcement.',refs:S.launch+' ; '+S.indexer});
 panel(s,{x:M,y:2.27,w:2.25,h:2.1,tag:'SOURCE',title:'Sui',body:'Finalized\ncheckpoints'});
 panel(s,{x:3.48,y:2.27,w:3.05,h:2.1,tag:'DATA SERVICES',title:'gRPC + archive',body:'Live data + retained history'});
 panel(s,{x:7.0,y:2.27,w:2.6,h:2.1,tag:'APP DATA VIEW',title:'GraphQL',body:'Filter · select · stream',blue:true});
 panel(s,{x:10.07,y:2.27,w:2.5,h:2.1,tag:'CONSUMER',title:'Your app',body:'Screen or small DB writer'});
 arrow(s,3.04,3.25,.4);arrow(s,6.57,3.25,.39);arrow(s,9.64,3.25,.39);
 mono(s,'OWNED PIPELINE',M,4.67,2.1,.24,10);
 text(s,'Checkpoint data   →   Rust indexing framework   →   Your schema + database',3.02,4.57,9.54,.5,18);
 box(s,M,5.34,11.83,.98,C.white);
 text(s,'Wallet: state + activity     Shop: filtered receipts\nGame: actions + domain events     Analytics: custom checkpoint processing',M+.2,5.45,11.4,.76,20);
}
// 04
{
 const s=base('Till: follow one payment all the way through.','2 / THE ANNOUNCED BUILD',{
 explain:'The event promises a USDC shop screen. Use an illustrative 1 USDC sale: customer authorizes transfer, shop receives it, subscription delivers the receipt, durable writer records it for totals. Gas is in SUI. These are target behaviours, not a claim that the existing browser form sends USDC.',
 show:'Open the live app. Its built-in payment form and balance cards are SUI-only. Verified SUI paths cover live delivery, recovery, deduplication and the ledger. A funded USDC acceptance run remains unfinished. State this before using the SUI fallback. The receiver and writer accept generic coin types, but a USDC till should restrict accepted coin type and use metadata decimals.',
 ask:'Which proves the shop was paid: the send button, a balance refresh, or the confirmed receipt?',
 answer:'Use the successful onchain transaction and positive shop balance change. The submit result and balance card alone do not identify a sale.',
 next:'Choose the subscription that provides the receipt evidence.'});
 [['CUSTOMER','Send 1 USDC','Pays SUI gas'],['CHAIN','Payment finalizes','Shop gains 1 USDC'],['LIVE SCREEN','Receipt + chime','Receives the delivery'],['DURABLE LEDGER','Save + total','Keep the receipt']].forEach((a,i)=>{const x=M+i*3.02;panel(s,{x,y:2.4,w:2.76,h:2.72,tag:a[0],title:a[1],body:a[2],blue:i===2});if(i<3)arrow(s,x+2.8,3.57,.18);});
 text(s,'Then disconnect, recover, total the day and look up an old receipt.',M,5.55,11.8,.65,22);
 bar(s,'Target: USDC. Current live app: SUI verified; a funded USDC walkthrough is still pending.',6.42,C.amber,C.cream);
}
// 05
{
 const s=base('Filter for the activity your app needs.','2 / TRANSACTIONS VS EVENTS',{
 explain:'A transaction subscription gives effects such as balance changes. An event subscription gives emitted application data, when a contract emits that event. Till requires no new payment event or Move contract. Affected address is broad: sender, sponsor or recipient may match. Exact field names below were checked against testnet on 16 October.',
 show:'Open PAYMENTS_SUBSCRIPTION in src/lib/till.ts and compare EventFilter in the live IDE. The current schema rejects module and type together in one event filter. The transaction sender field is sentAddress; the event sender field is sender.',
 ask:'The shop refunds a customer. Does affectedAddress still match?',
 answer:'Yes. A match is a candidate. Receipt logic must check success and balance-change direction.',
 next:'Select enough fields to validate the candidate and render a receipt.',refs:S.schema+' ; teaching/evidence/graphql-schema-2026-10-16.json'});
 rows(s,[['STREAM','FILTER','EXAMPLE USE'],['transactions','affectedAddress','Any transaction touching this shop'],['transactions','affectedObject','Activity involving a game object'],['transactions','function','Calls to a Move package / module / function'],['events','sender','Events from transactions sent by an address'],['events','module','Events emitted by a particular module'],['events','type','One domain event, such as a sale event']],{y:2.25,height:.53,first:2.35,second:2.9,font:17});
 bar(s,'Till uses transactions + affectedAddress. A match still needs payment validation.',6.28);
 text(s,'Current schema: choose module or type for an event filter; combining them returns an error.',M,6.82,11.8,.2,10,C.muted);
}

// 06
{
 const original=file('src/lib/till.ts').split('/* GraphQL */ \x60')[1].split('\x60;')[0].trim();
 const query=[
  'subscription Till($shop: SuiAddress!,',
  '  $after: String, $afterCheckpoint: UInt53) {',
  '  transactions(filter: { affectedAddress: $shop,',
  '    afterCheckpoint: $afterCheckpoint }, after: $after) {',
  '    cursor',
  '    node { digest sender { address }',
  '      effects { status timestamp',
  '        checkpoint { sequenceNumber }',
  '        balanceChanges(first: 50) { nodes {',
  '          owner { address } coinType { repr } amount',
  '        }}',
  '      }',
  '    }',
  '  }',
  '}',
 ].join('\n');
 if(query.replace(/\s+/g,'')!==original.replace(/\s+/g,''))throw Error('Slide query differs from repository source');
 const s=base('A matching transaction becomes a receipt.','2 / THE ACTUAL TILL QUERY',{
 explain:'This is the full repository subscription, with whitespace adjusted. Cursor is delivery progress. Digest identifies the transaction. Status rejects failures. Owner, coin type and signed amount let the client calculate the shop credit. Checkpoint and timestamp place the receipt in history.',
 show:'Trace paymentsFrom in src/lib/till.ts: SUCCESS, normalize owner, sum signed changes per normalized coin type with BigInt, retain only positive net credits. The writer groups receipts by digest and coin. Illustrative USDC case: 1000000 base units with six decimals means 1 USDC, after confirming metadata. An accepted-USDC-only rule is a further application requirement; the generic parser currently accepts all coins.',
 ask:'Why sum all changes for a coin instead of selecting the first positive row?',
 answer:'One transaction can contain debits and credits. Net change tells whether the shop gained the asset.',
 next:'The query describes what we want. Open a connection that keeps delivering it.',refs:'src/lib/till.ts'});
 code(s,query,M,2.25,7.75,4.58,14.5);
 [['CURSOR','Where to resume delivery'],['DIGEST + STATUS','Transaction + outcome'],['OWNER + COIN + AMOUNT','Net credit to this shop'],['TIMESTAMP + CHECKPOINT','When the receipt belongs']].forEach((a,i)=>{const y=2.47+i*.94;mono(s,a[0],8.83,y,3.73,.24,10);text(s,a[1],8.83,y+.32,3.73,.5,20);});
 text(s,'SUCCESS + positive net credit\n→ receipt → render + chime',8.83,6.28,3.73,.57,16,C.green);
}
// 07
{
 const s=base('One POST request. Many SSE deliveries.','2 / THE TRANSPORT',{
 explain:'The request sends the GraphQL document and variables as JSON. The response stays open and sends SSE frames over POST /graphql/subscriptions. Native EventSource cannot send this POST body; websocket clients use a different protocol. Fetch exposes a readable stream.',
 show:'Open src/lib/sse.ts. The shown fetch is a real excerpt, reformatted. Continue into the parser: chunks can split an SSE frame, blank lines end frames, comments can be keepalives, and errors can arrive inside HTTP 200. onNext is awaited before advancing. Seven existing tests include framing and error cases.',
 ask:'Can each reader.read() be treated as one complete GraphQL message?',
 answer:'No. Network chunks and SSE message boundaries differ. Buffer and parse complete frames.',
 next:'A stream can end. Keep the position from which we can safely resume.',refs:'src/lib/sse.ts; tests/'});
 const source=snippet(file('src/lib/sse.ts'),'const res = await fetch','  if (!res.ok')
  .replace("headers: { 'content-type': 'application/json', accept: 'text/event-stream' },","headers: {\n      'content-type': 'application/json',\n      accept: 'text/event-stream',\n    },")
  .replace('body: JSON.stringify({ query, variables }), signal,','body: JSON.stringify({ query, variables }),\n    signal,');
 code(s,source.replace(/^  /gm,''),M,2.4,7.3,3.3,16);
 mono(s,'REQUEST',8.42,2.42,3.8,.25,11);text(s,'POST /graphql/subscriptions\nquery + variables',8.42,2.85,4.1,.85,20);
 mono(s,'RESPONSE STAYS OPEN',8.42,4.06,3.8,.25,11);text(s,'text/event-stream\nreceipt A → B → C → …',8.42,4.48,4.1,.9,20);
 bar(s,'fetch → decode text → buffer complete SSE frames → inspect errors → await the handler',6.15);
 text(s,'EventSource cannot send this POST body. A network chunk is not a complete SSE message.',M,6.75,11.8,.25,13,C.muted);
}
// 08
{
 const s=base('The connection drops. The payments do not.','2 / CURSORS, BACKFILL AND ORDER',{
 explain:'A, B, C and D are illustrative teaching labels, not real digests or cursor encodings. Save A and cursor cA. Disconnect while B and C finalize. Reconnect with after cA. The service delivers B and C, then D live. With no cursor yet, a saved opening checkpoint supplies the first boundary through filter.afterCheckpoint, which is exclusive.',
 show:'Chain progress continues while the listener is offline. Use Pause feed for the controlled demo. Save the opening checkpoint before the first stream and first payment. Never decode or invent cursors. Scope state to network, shop and query. Within a checkpoint, transactions follow their position; events follow transaction position then event position.',
 ask:'B reaches the browser but its database commit fails. Which cursor is safe to save?',
 answer:'Keep cA. Replay B on reconnect. The cursor must describe durably processed data, not merely received bytes.',
 next:'Make the database commit and cursor update one operation.',refs:S.schema+' ; src/useTill.ts; indexer/indexer.ts'});
 [['A / cp 100','Delivered + saved'],['B / cp 101','Finalizes offline'],['C / cp 101','Finalizes offline'],['D / cp 102','Continues live']].forEach((a,i)=>{const x=M+i*3.02,blue=i===0||i===3;box(s,x,2.5,2.76,1.1,blue?C.blue:C.white);mono(s,a[0],x+.18,2.7,2.4,.25,14,blue?C.white:C.blue);text(s,a[1],x+.18,3.09,2.4,.3,16,blue?C.dim:C.muted);if(i<3)arrow(s,x+2.79,3.0,.2);});
 box(s,3.77,3.84,5.78,.5,C.cream);text(s,'LISTENER OFFLINE',3.77,3.92,5.78,.3,15,C.amber,{align:'center'});
 text(s,'Saved cA',M,4.77,2.5,.45,23);text(s,'Reconnect: after = cA',3.77,4.77,5.78,.45,23);text(s,'B → C → D',10.0,4.77,2.6,.45,23,C.blue);
 text(s,'No cursor yet? Save the opening checkpoint, then use filter.afterCheckpoint.',M,5.6,11.8,.42,20);
 bar(s,'Order: checkpoint → transaction position → event position. Persist before advancing.',6.27);
}
// 09
{
 const s=base('Replay safely. Count each receipt once.','2 / A TYPESCRIPT WRITER + SQLITE OR POSTGRES',{
 explain:'Two guarantees matter. A unique receipt key prevents duplicate counting. One database transaction commits rows and progress together. The repo uses PRIMARY KEY (digest, coin_type) and INSERT OR IGNORE; a cursor-only receipt key is insufficient when one transaction credits several coins. The cursor is a progress watermark. Postgres needs the same atomicity and uniqueness.',
 show:'Open indexer/db.ts and indexer/indexer.ts. The real source rolls back on failure, and saves the cursor even if a matching transaction has no incoming payment. The displayed code is the transaction body; catch/ROLLBACK follows it. Run pnpm indexer, stop it, pay, restart, then pnpm totals with the UTC date. The verified SUI ledger kept three receipts totalling 0.03 SUI without duplication.',
 ask:'The process crashes after COMMIT but before logging success. What happens?',
 answer:'Rows and cursor are durable. Replaying cannot add the same digest and coin again.',
 next:'Decide when this writer is enough and when to own a checkpoint pipeline.',refs:'indexer/db.ts; indexer/indexer.ts; indexer/totals.ts'});
 const source=snippet(file('indexer/indexer.ts'),"db.exec('BEGIN');","    for (const p of payments) {\n      console.log")
  .replace('const r = insert.run(p.digest, p.coinType, p.amount, p.sender, p.checkpoint, p.timestamp, p.cursor);','const r = insert.run(p.digest, p.coinType,\n        p.amount, p.sender, p.checkpoint,\n        p.timestamp, p.cursor);')
  .replace('    // Advance the watermark even for non-payment transactions (shop sending out), or a restart\n    // would re-scan them forever.\n','')
  .replace('saveCursor.run(shop, d.transactions.cursor, new Date().toISOString());','saveCursor.run(shop, d.transactions.cursor,\n      new Date().toISOString());');
 const body=source.replace('  try {\n','').replace('    let fresh = 0;\n','').replace('      fresh += Number(r.changes);\n','').replace(/^    /gm,'');
 code(s,body,M,2.3,7.3,3.58,15);
 mono(s,'TRANSACTION BODY EXCERPT / ERROR PATH IN indexer/indexer.ts',M,5.98,7.3,.18,8,C.muted);
 [['DEDUPLICATE','Unique (digest, coin_type)'],['COMMIT ATOMICALLY','Receipt rows + saved cursor'],['ON FAILURE','Roll back both; reconnect']].forEach((a,i)=>{const y=2.53+i*1.02;mono(s,a[0],8.42,y,4.1,.24,10);text(s,a[1],8.42,y+.34,4.1,.52,21);});
 bar(s,'pnpm indexer  →  stop  →  pay  →  restart  →  pnpm totals 2026-10-16',6.2);
 text(s,'Totals come from durable rows, grouped by coin and UTC day, using BigInt base units.',M,6.77,11.8,.22,13,C.muted);
}
// 10
{
 const s=base('When does a small writer stop being enough?','2 / THE CUSTOM INDEXING DECISION',{
 explain:'The announcement offers subscriptions as a lighter path for apps that do not need a full pipeline. Choose by workload. A selected feed can use TypeScript and SQLite or Postgres. Broad checkpoint processing, controlled reprocessing and owned models can justify the Rust framework. There is no universal throughput threshold.',
 show:'Compare the paths. In the custom framework, process transforms checkpoint data, commit stores results, and prune can enforce retention. This class does not implement Rust. The supplied TypeScript writer is a long-running local process, separate from the Vercel browser app.',
 ask:'You need all swaps across many packages and a year of recomputed aggregates. Which path fits?',
 answer:'Investigate an owned checkpoint pipeline and a database designed for the aggregates; benchmark processing and recovery.',
 next:'Even a small app needs a path beyond full-node retention.',refs:S.indexer});
 panel(s,{x:M,y:2.3,w:5.78,h:3.55,tag:'TILL / SMALL APPLICATION FEED',title:'GraphQL → TypeScript → DB',body:'One shop or selected event types\nA few derived tables and totals\nRestart from a committed cursor'});
 panel(s,{x:6.8,y:2.3,w:5.78,h:3.55,tag:'ANALYTICS / OWNED PIPELINE',title:'Checkpoints → Rust → DB',body:'Broad backfills and reprocessing\nCustom schemas and joins\nControl throughput and retention',blue:true});
 bar(s,'Decide from coverage, processing cost and operational ownership; measure before scaling.',6.32);
}

// 11
{
 const digest='ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a';
 const s=base('An old receipt needs retained history.','2 / ARCHIVE LOOKUP',{
 explain:'Full nodes may prune history. A full-node gRPC endpoint does not automatically route every old lookup to the archive. The separate archival service supports retained point lookups; a GraphQL operator can configure an archive-backed path. Finding one digest differs from scanning every historical payment.',
 show:'Run pnpm receipt or use Receipt archive. On 15 October this exact testnet digest returned not found from the public full node, while GraphQL returned SUCCESS at 2025-10-07T22:04:44.571Z and checkpoint 250000000. The app retains the digest and labels the source. A random not-found response cannot establish pruning; compare network, digest and a known alternate result.',
 ask:'Does an archive lookup prove your local daily ledger is complete?',
 answer:'No. Completeness requires a starting boundary and successful processing over the needed range.',
 next:'Account for service limits and failures before production.',refs:S.migration+' ; src/lib/receipt.ts; scripts/receipt.ts; teaching/VERIFICATION.md'});
 mono(s,'ONE KNOWN TESTNET TRANSACTION',M,2.26,11.8,.25,11);
 mono(s,digest,M,2.74,11.8,.4,18,C.ink);
 panel(s,{x:M,y:3.49,w:5.4,h:2.35,tag:'PUBLIC FULL NODE / VERIFIED 15 OCT',title:'Not found',body:'This endpoint did not return the old record.'});
 panel(s,{x:6.62,y:3.49,w:5.95,h:2.35,tag:'GRAPHQL / VERIFIED 15 OCT',title:'SUCCESS · 7 October 2025',body:'Checkpoint 250,000,000\nArchive-backed history path',blue:true});
 arrow(s,6.2,4.66,.35);
 bar(s,'pnpm receipt   /   Full node retention and archival history serve different needs.',6.3);
}
// 12
{
 const s=base('Build for limits, reconnects and changes.','2 / PRODUCTION + REAL GOTCHAS',{
 explain:'Limits belong to a service. Testnet serviceConfig was rechecked on 16 October: query payload 5000 bytes, query timeout 40 seconds, Query.transactions default page 20 and max 50. These are query settings, not stream lifetime. Per-subscriber throttling can slow or end a stream; it does not follow a fixed threshold inferred from those numbers.',
 show:'Read serviceConfig in the IDE. Ask a production provider about POST SSE, auth, quotas, retention and downtime. Bound consumer work and retry with backoff from committed progress. In Till, a shop change cancels the old connection and switches stored state. Reset clears tracking, not onchain funds. A query version change needs a deliberate replay boundary.',
 ask:'A balance rises but no receipt appears. What do you check?',
 answer:'Digest, success, network, shop, filter semantics, index lag and catch-up. A balance delta is not a receipt. The tested address-balance deposit appeared only after catch-up.',
 next:'Run the lab with an observable pass criterion for each step.',refs:'teaching/evidence/graphql-schema-2026-10-16.json; teaching/VERIFICATION.md; '+S.migration+' ; '+S.queries});
 rows(s,[['WHAT CAN FAIL','FAILURE / LIMIT','WHAT TO DO'],['Query limits','5,000 B / 40 s; pages 20 / 50','Select less; page nested collections'],['Subscriber pressure','Throttling / stream disconnects','Bound work; back off; resume cursor'],['Account / query','Old cursor may no longer fit','Scope state; stop stale connections'],['Address deposits','Credit arrived after catch-up','Verify digest; reconcile missed data'],['Prototype persistence','Browser has only 500 receipts','Keep a durable writer + database']],{y:2.23,height:.62,first:2.7,second:4.07,font:16});
 bar(s,'Before launch: use a provider or operate the service; verify quotas, retention and stream support.',6.28);
 text(s,'Also: HTTP 200 can contain errors; public faucets can delay; clearing site data loses demo keys.',M,6.81,11.8,.23,11,C.muted);
}
// 13
{
 const s=base('Lab: prove each part of the payment journey.','2 / BUILD TILL AND TRY TO BREAK IT',{
 explain:'Use the verified test-SUI fallback explicitly. The event target remains USDC. A funded USDC run, physical wallet approval and audible chime are not yet verified. This runbook does not claim those checks passed. Every student has a separate payer and shop.',
 show:'1. Clone the repo; use Node 24, pnpm install and pnpm dev, or open the live app. Copy your shop. Request test SUI. Enable sound with a click.\n2. Open till and send 0.01 SUI. Match digest, receipt and red/green balance movement; payer pays gas. Check the chime audibly.\n3. Pause feed, pay again, Resume. This stops only the listener. For real Wi-Fi loss, use a second device to pay while the till device is offline. The disconnected device cannot submit a network transaction.\n4. Reload and reopen; expect no duplicate.\n5. Copy .env.example, set SHOP_ADDRESS, FROM_CHECKPOINT to the opening boundary, and separate TILL_DB. Run pnpm indexer. Stop, pay, restart, run pnpm totals. Never share a database across shops.\n6. Use slide 11’s old receipt. Record each result. Browser totals alone do not validate the database writer.',
 ask:'Why does the Wi-Fi-drop test need a second device?',
 answer:'Only the listener is offline; the payer still needs network access.',
 next:'Apply these data decisions to an existing JSON-RPC integration.',refs:'README.md; teaching/VERIFICATION.md'});
 rows(s,[['ACTION','EXPECTED EVIDENCE','PART OF THE STACK'],['Open + pay','One receipt + chime; shop credit','gRPC execution + GraphQL feed'],['Pause → pay → resume','Missed digest appears','Cursor backfill → live'],['Reload / restart writer','Same receipt counted once','Deduplication + durable cursor'],['pnpm totals','DB total for the chosen UTC day','SQLite writer + BigInt'],['Find old receipt','Date + checkpoint + SUCCESS','Archive-backed lookup']],{y:2.28,height:.64,first:3.18,second:4.43,font:17});
 mono(s,'TESTNET / VERIFIED PAYMENT PATH: SUI / USDC RUN STILL PENDING',M,6.35,11.8,.24,10,C.amber);
 text(s,'day3-till.vercel.app',M,6.77,5.5,.25,14,C.blue,{hyperlink:{url:LIVE}});
 text(s,'Repo: github.com/Nuel-osas/day3-till',6.1,6.77,6.47,.25,13,C.blue,{hyperlink:{url:REPO}});
}
// 14
{
 const s=base('Migrate the client, then check the response.','3 / ONE REAL JSON-RPC MIGRATION',{
 explain:'The old client calls getBalance over JSON-RPC. SuiGrpcClient exposes a typed balance wrapper. Adapt the response; do not reuse the old object shape blindly. Inspect totalBalance, coinBalance and addressBalance. The GraphQL alternative selects Address.balance and joins receipt and event data.',
 show:'Open migration/legacy-jsonrpc.ts and migration/migrated-grpc.ts. Panels use their imports, construction and calls, reformatted. Run pnpm migrate:legacy, pnpm migrate:grpc and pnpm migrate:graphql. The old public endpoint previously returned -32601 inside HTTP 200; provider behaviour varies. Other examples replace getTransactionBlock with getTransaction and queryEvents with listEvents. Normalize event type addresses in the gRPC example.',
 ask:'What changes besides the imported client class?',
 answer:'Result shape, errors, selected fields, pagination and fresh API cursors.',
 next:'Each student migrates one call from a project they brought.',refs:'migration/; '+S.migration});
 mono(s,'BEFORE / migration/legacy-jsonrpc.ts',M,2.25,5.76,.25,10);
 mono(s,'AFTER / migration/migrated-grpc.ts',6.8,2.25,5.76,.25,10);
 const oldCode=['import { SuiJsonRpcClient,','  getJsonRpcFullnodeUrl',"} from '@mysten/sui/jsonRpc';",'','const client = new SuiJsonRpcClient({',"  url: getJsonRpcFullnodeUrl('testnet'),","  network: 'testnet'",'});','','client.getBalance({ owner: SHOP })'].join('\n');
 const newCode=['import { SuiGrpcClient }',"  from '@mysten/sui/grpc';",'','const client = new SuiGrpcClient({',"  network: 'testnet',",'  baseUrl:',"    'https://fullnode.testnet.sui.io:443'",'});','','const { balance } =','  await client.getBalance({ owner: SHOP });'].join('\n');
 code(s,oldCode,M,2.77,5.78,3.17,13.7);code(s,newCode,6.8,2.77,5.78,3.17,13.7);
 bar(s,'Check: result shape + total balance + errors + pagination. Obtain fresh API cursors.',6.32);
}
// 15
{
 const s=base('Your app: replace one call and prove it works.','3 / THE ROOM’S MIGRATION WORKSHOP',{
 explain:'The final workshop is on students’ own projects. Give students without a project Till’s migration folder. The deliverable is a working change, not a verbal claim of migration.',
 show:'Allow 25 to 35 minutes. Find one JSON-RPC read or polling loop. State the screen’s need, choose the replacement and edit the code. Verify a known balance or transaction. For a feed, demonstrate disconnect and replay. For history, test an old digest and retention path. Name the production provider and quotas. Ask two students to show the diff and explain their choice.',
 ask:'Show the changed call, its new result, and the failure case you tested.',
 answer:'A reviewable diff, a known-data check and a relevant failure or recovery check. The data-service choice is part of the answer.',
 next:'Return to the examples collected on slide 1. Each student should be able to explain which service handles each app responsibility.',refs:REPO+' ; '+LIVE},true);
 [['01','Find one call','What does its screen need?'],['02','Choose + replace','gRPC, GraphQL or a subscription'],['03','Verify the behaviour','Known data + one failure case']].forEach((a,i)=>{const y=2.25+i*1.02;mono(s,a[0],M,y+.12,.55,.3,18,C.dim);text(s,a[1],1.6,y,4.7,.6,27,C.white);text(s,a[2],6.6,y+.05,5.95,.55,21,C.dim);});
 box(s,M,5.67,11.83,.69,C.blue);
 text(s,'Leave with a working diff, its evidence, and a reason for your data-stack choice.',M+.18,5.82,11.45,.38,20,C.white);
 text(s,'github.com/Nuel-osas/day3-till',M,6.64,7,.3,17,C.dim,{hyperlink:{url:REPO}});
 text(s,'day3-till.vercel.app',8.65,6.64,3.93,.3,17,C.dim,{hyperlink:{url:LIVE}});
}
if(p._slides.length!==15)throw Error('Expected exactly 15 slides');
const preface=[
 '# Day 3: Real-Time Sui','',
 'Teaching edition: 16 October 2026. Exactly 15 slides.','',
 '## Before class','',
 '- The event target is USDC. The browser form sends SUI; a funded USDC end-to-end run has not passed. Disclose the test-SUI fallback. The target diagram is not verified USDC behaviour.',
 '- Use Day3_Real_Time_Sui.pptx, not the original October 12 Day3_Till_Live_Data.pptx. The lesson follows: choose the stack, build a reliable feed, then migrate an existing app.',
 '- Open the app, repo, GraphQL IDE and two terminals. Use Node 24 and Sui testnet. Each student has their own payer and shop.',
 '- Run the SQLite writer separately. Save the opening checkpoint before payments. The writer is not a long-running Vercel worker.',
 '- For real Wi-Fi loss, pay from a second device while the listening device is offline. Pause feed is the controlled listener-only equivalent.',
 '- Check chime through a user gesture and physical wallet approval. These remain manual checks.',
 '- Slides 1-3: choose the stack. Slides 4-12: explain and build the data path. Slide 13: full lab. Slides 14-15: migration.','',
 '## Additional gotchas to explain during the lab','',
 '- HTTP 200 can contain GraphQL or JSON-RPC errors. Inspect the body.',
 '- Coin transfers arrived live; an address-balance deposit arrived after catch-up. Retest provider behaviour; this is not a permanent protocol rule.',
 '- Faucets can delay or rate-limit. Node 24 and a sufficient function timeout fixed the deployed funding path.',
 '- The browser retains 500 receipts, selects the first 50 balance changes per transaction and refreshes balances separately every five seconds. It is not complete accounting.',
 '- Scope cursor/query state per network and shop. Stop stale streams on account changes. Reset clears tracking, not funds. Clearing site data loses demo keys.',
 '- Generic coin receipts do not make the SUI form a USDC demo. Verify funding, decimals, accepted type, payment, stream, database and totals for USDC end to end.',
 '- Full-node gRPC does not automatically reach pruned history. Use the archive or archive-backed GraphQL.',
 '- Some official docs and schema availability descriptions lag the 21 September launch and recorded live tests. Use current field names while checking availability with actual deliveries.',
 '- Event filters reject module and type together. The gRPC migration example needs normalized type addresses.',
 '- Throttle thresholds, production load and a Rust pipeline have not been tested. Bound work and use reconnect backoff.','',
 '## Verified testnet evidence','',
 '- Live payment: H1fQ22Q5V6yt37GaiySNqGhUJR7ki4b35Te9Qcja9Bqn',
 '- Paused then recovered: 66XRjyGEKngFwGZntzULDr6v4hrwFPnR8ZmY9fmPW6Zh',
 '- Address-balance catch-up: 5crvrKsvQGU3emZvNCEJgKjpAwENtCHHxfY4UMy11Dcc',
 '- Old receipt: ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a, 7 October 2025, checkpoint 250000000.',
 '- These payment proofs are SUI, not USDC. Details: teaching/VERIFICATION.md.','','---','',
].join('\n');
fs.mkdirSync(path.dirname(OUT),{recursive:true});
p.writeFile({fileName:OUT}).then(()=>{
 if(path.resolve(OUT)===path.join(__dirname,'Day3_Real_Time_Sui.pptx'))fs.copyFileSync(OUT,path.join(__dirname,'Day3_Till_Live_Data_Seedless_Style.pptx'));
 fs.writeFileSync(path.join(path.dirname(OUT),'Day3-speaker-notes.md'),preface+notes.map((n,i)=>'## '+String(i+1).padStart(2,'0')+'. '+n.title+'\n\n'+n.note+'\n').join('\n'));
 console.log(OUT);
});
