// Editable 11-slide lesson. Run pnpm slides; render with teaching/RENDERING.md.
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
p.subject='Day 3 / 11-slide teaching edition / 16 October 2026';
const TOTAL=11;
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
 mono(s,String(p._slides.length).padStart(2,'0')+' / '+TOTAL,11.7,7.04,.9,.25,9,dark?C.dim:C.muted);
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
// Post-Basecamp release strip. Facts from MystenLabs/sui release notes and the SDK docs.
function fresh(s,label,t,x,y,w,h=.55,dark=false){box(s,x,y,w,h,dark?'1A2350':C.pale);mono(s,label,x+.16,y+.09,w-.32,.2,9,dark?'A3B2FF':C.blue);text(s,t,x+.16,y+.29,w-.32,h-.36,12.5,dark?C.white:C.ink,{valign:'top'});}
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
 answer:'Collect one example from a wallet, game, payments screen or backend. Return to it on the final slide.',
 next:'Start with the whole Sui stack as it stands after Basecamp.'},true);
 text(s,'GraphQL Subscriptions\nand the Data Stack After JSON-RPC',M,2.05,11.8,1.5,37,C.dim);
 [['01 / CHOOSE','Map the data stack'],['02 / BUILD','A feed that survives a drop'],['03 / MIGRATE','One call in your own app']].forEach((a,i)=>{const x=M+i*4.04;box(s,x,4.52,3.75,1.6,i===1?C.blue:'141B32');mono(s,a[0],x+.2,4.74,3.3,.25,11,C.dim);text(s,a[1],x+.2,5.08,3.3,.85,23,C.white);});
 text(s,'A payment screen is the worked example for the whole lesson.',M,6.46,11.8,.35,19,C.dim);
}
// 01b: the whole Sui stack as it stands after Basecamp, so the data lesson has context.
{
 const s=base('The Sui stack, after Basecamp.','0 / WHERE WE ARE / 16 OCTOBER 2026',{
 explain:'Sui Basecamp ran in Singapore on 7 and 8 October. The theme was the agentic economy. Before we zoom into data, this is the whole stack as it stands today, layer by layer, with what a builder can actually touch. Days 1 and 2 of this week sit in the accounts and money row. Today sits in the data row, which every other row depends on.',
 show:'Walk top to bottom. Apps and agents: Samsung Wallet brings gasless USDC on Sui to 82 million US Galaxy phones from the last week of October, with Bastion custody; Slush added deposits from 25 chains and yield; DeepBook App exposes an API for agents. Agent payments: Sui Agent Payments lets agents pay per call in stablecoins over HTTP 402 (x402 and MPP), with Alibaba Cloud as the first big partner; the gateway is on testnet and paid calls are invite only. Payment Kit and an open x402 facilitator are public. Sui Agent Pass (policies limiting what an agent can spend, enforced with Seal) was announced with no docs yet. Accounts and money: passkeys and address aliases (Day 1), native allowances (Day 2, testnet), address balances, and Circle CCTP V2 live for native USDC across 29 chains. Throughput: a 40.6M TPS peak inside 10,000+ programmable tunnels, offchain and settled to mainnet; no tunnels SDK yet. Data: JSON-RPC is off on Foundation nodes; gRPC, GraphQL with subscriptions (mainnet 21 September), the archive and the custom indexer replace it. Storage and privacy: Walrus, the new managed Walrus Console with an API and an MCP server, and Seal encryption. Infra and tools: AWS, Google Cloud and Alibaba Cloud for nodes, MystenLabs/skills and the Sui docs MCP.',
 ask:'Which rows does your current app touch?',
 answer:'Almost every app touches accounts and data. Agent apps add agent payments; media and AI apps add Walrus.',
 next:'What does all this change for the way an app reads the chain?',
 refs:'https://sui.io/basecamp ; https://sui.io/agentpayments ; https://www.sui.io/blog/graphql-on-sui-now-supports-real-time-subscriptions ; agentic-week/basecamp-2026-readout.md'});
 rows(s,[
  ['LAYER','WHAT IS THERE NOW','STATUS'],
  ['Apps + agents','Samsung Wallet USDC (82M phones) · Slush · DeepBook App API','Live · Samsung late Oct'],
  ['Agent payments','Agent Payments (x402, MPP, Alibaba Cloud) · Payment Kit · Agent Pass','Testnet · Pass announced'],
  ['Accounts + money','Passkeys + aliases · allowances · address balances · USDC + CCTP V2','Live · allowances testnet'],
  ['Throughput','Programmable Tunnels: 40.6M TPS offchain, settled to mainnet','Live · no SDK yet'],
  ['Data  ← TODAY','gRPC · GraphQL + subscriptions · archive · indexer. JSON-RPC off','Live'],
  ['Storage + privacy','Walrus · Walrus Console (API + MCP) · Seal encryption','Live'],
  ['Infra + tools','AWS · Google Cloud · Alibaba Cloud nodes · Sui skills + docs MCP','Live'],
 ],{y:2.12,height:.56,first:2.35,second:6.95,font:14});
 text(s,'Day 1 and Day 2 built the accounts + money row. Today: the data row every other row reads from.',M,6.72,11.8,.25,12,C.muted);
}
// 01c: what Basecamp changes for an app's data layer.
{
 const s=base('What Basecamp changes for your data layer.','0 / WHY TODAY MATTERS MORE NOW',{
 explain:'Basecamp did not ship a new data API; the data stack landed in July (JSON-RPC off) and September (subscriptions). What Basecamp changed is who reads the chain and how much. Six consequences for anyone building an app now.',
 show:'One: agents are now clients. With Agent Payments an agent pays per call and acts on what it sees, so it needs a live feed instead of polling every few seconds. Two: Samsung Wallet puts gasless USDC on 82 million phones. A shop screen fed by those payments has to survive a Wi-Fi drop without losing a sale, which is the cursor lesson. Three: address balances and allowances move funds without a coin object. Watch balance changes in transaction effects, not coin objects. In our own tests an address-balance deposit appeared only after catch-up, so always backfill. Four: the 40.6M TPS run happened inside tunnels offchain; only settlements reach mainnet, so your feed sees the settlement, not every tunnel message. Five: Walrus Console and the Google Cloud Arbiter put files, agent memory and proofs on Walrus; index the pointer on Sui and fetch the blob from Walrus. Six: Sui named AWS, Google Cloud and Alibaba Cloud for nodes. Public endpoints are for development; production runs on a provider or your own node, with quotas you check.',
 ask:'Which of the six hits your app first?',
 answer:'For most of the room: live feeds and cursors (one and two). Payment apps also need three.',
 next:'Map each kind of read to the service that should answer it.',
 refs:'https://sui.io/agentpayments ; https://console.walrus.xyz ; agentic-week/basecamp-2026-readout.md ; teaching/VERIFICATION.md'});
 [
  ['AGENTS ARE CLIENTS','Agents read and pay per call','x402 + MPP. They need live feeds, not polling.'],
  ['PHONE-SCALE PAYMENTS','82M wallets, gasless USDC','Receipts must survive drops: cursors.'],
  ['MONEY WITHOUT COINS','Watch balance changes','Address balances and allowances skip coin objects.'],
  ['TUNNELS','40.6M TPS stayed offchain','Your feed sees settlements, not each message.'],
  ['DATA OFF CHAIN','Files, memory, proofs on Walrus','Index the pointer on Sui. Fetch from Walrus.'],
  ['PRODUCTION','Public endpoints are for dev','Use a provider or cloud node. Check quotas.'],
 ].forEach((a,i)=>{const x=M+(i%3)*4.02,y=2.12+Math.floor(i/3)*2.12,w=3.79,blue=i===0;
  box(s,x,y,w,1.98,blue?C.blue:C.white);
  mono(s,a[0],x+.22,y+.18,w-.44,.24,10,blue?'C4CEFF':C.blue);
  text(s,a[1],x+.22,y+.5,w-.44,.74,20,blue?C.white:C.ink,{valign:'top'});
  text(s,a[2],x+.22,y+1.3,w-.44,.56,15,blue?'E4E9FF':C.muted,{valign:'top'});});
 bar(s,'Same lesson today: pick the right read path, stream it, never miss a payment.',6.42);
}
// 01d: who actually serves Sui data now.
{
 const s=base('Who serves Sui data now.','0 / DATA PROVIDERS / 16 OCTOBER 2026',{
 explain:'The public Sui Foundation endpoints (fullnode, graphql and archive.mainnet.sui.io) are rate limited and meant for development and public-good access. The migration guide says not to point a production wallet, exchange or indexer at them: run your own full node or contract a provider. Providers now fall into three groups. Full stack: gRPC, GraphQL RPC and the Archival Store as a managed service. gRPC nodes: full-node gRPC only. Indexed data and streams: ready-made APIs and pipelines on top of the chain.',
 show:'Full stack, per the docs table: QuickNode, Ankr, BlockPI, ZAN, Inodra and Triton One offer gRPC, GraphQL and archive on mainnet; ZAN lists all three on testnet too. NodeInfra and 01.ro offer gRPC and GraphQL without archive. The Sui blog named QuickNode, Ankr, BlockPI and ZAN as the four launch partners for the full stack. gRPC only: Alchemy, Dwellir, BlockVision, Natsai, GetBlock. Indexed data and streams, from the Sui Foundation awesome-sui list: Sentio (custom processors), Surflux (APIs and real-time streams), BlockVision (token, NFT and DeFi APIs), Blockberry (Suiscan API), Space and Time (verifiable warehouse), ZettaBlock (SQL to GraphQL or REST), Birdeye (market data), Dubhe Indexer (config-driven events). Honesty points: most providers list GraphQL on mainnet only; the docs still say GraphQL does not support subscriptions, which is out of date (we stream them live on testnet and mainnet), and we have not tested subscriptions on any provider, so ask each one. Archive: full-node gRPC never falls back to the archive, so gRPC clients call an archival endpoint directly.',
 ask:'Your app needs live payments plus a two-year-old receipt. What do you ask a provider?',
 answer:'Do you serve GraphQL subscriptions over SSE, on which networks, and is the archive connected to your GraphQL or a separate gRPC endpoint? Then quotas and price.',
 next:'With the providers in view, map each kind of read to the right service.',
 refs:'https://docs.sui.io/develop/accessing-data/rpc-providers ; https://github.com/sui-foundation/awesome-sui ; https://www.sui.io/blog/graphql-archival-store-sui-data-stack ; '+S.migration});
 const cols=[
  ['FULL STACK','gRPC, GraphQL, archive','QuickNode · Ankr · BlockPI\nZAN · Inodra · Triton One','gRPC + GraphQL, no archive:\nNodeInfra · 01.ro'],
  ['gRPC NODES','Full-node gRPC only','Alchemy · Dwellir\nBlockVision · GetBlock\nNatsai','Pair with GraphQL or an archive\nfrom someone else'],
  ['INDEXED DATA + STREAMS','Ready-made APIs','Sentio · Surflux (streams)\nBlockVision · Blockberry\nSpace and Time · ZettaBlock\nBirdeye · Dubhe Indexer','When you want answers,\nnot raw checkpoints'],
 ];
 cols.forEach((c,i)=>{const x=M+i*4.02,y=2.1,w=3.79,h=3.62,blue=i===0;
  box(s,x,y,w,h,blue?C.blue:C.white);
  mono(s,c[0],x+.22,y+.2,w-.44,.24,10,blue?'C4CEFF':C.blue);
  text(s,c[1],x+.22,y+.52,w-.44,.45,19,blue?C.white:C.ink,{valign:'top'});
  text(s,c[2],x+.22,y+1.1,w-.44,1.45,17,blue?C.white:C.ink,{valign:'top'});
  text(s,c[3],x+.22,y+2.72,w-.44,.7,13,blue?'E4E9FF':C.muted,{valign:'top'});});
 text(s,'Sui Foundation endpoints (fullnode · graphql · archive.mainnet.sui.io): rate limited, for development only.',M,5.86,11.8,.3,13,C.muted);
 bar(s,'Before launch, ask: gRPC? GraphQL? Subscriptions over SSE? Archive? Networks? Quotas?',6.38);
}
// 02
{
 const s=base('Replace the data path your app depends on.','1 / CHOOSE THE STACK',{
 explain:'Foundation mainnet JSON-RPC was disabled in the week of 27 July 2026; source removal was scheduled for mid-October. Availability at other providers can differ. The 21 September announcement adds GraphQL subscriptions. Application responsibilities remain, but can now use different interfaces. NEW SINCE BASECAMP: testnet-v1.82.1 (13 October, protocol 139) removes the JSON-RPC service from the full node and deletes its old database on startup (PR 27907), the code-removal step the migration guide scheduled for mid-October. mainnet-v1.81.1 (7 October, protocol 138) added GraphQL Query.multiGetDynamicFields, derivedObject and multiGetDerivedObjects, and a nullable Balance.coinMetadata field. We have not seen v1.82 on mainnet yet; say testnet first.',
 show:'Classify a screen: read the balance, observe a new payment, retrieve an old receipt. The same app can use more than one interface.',
 ask:'Would replacing every JSON-RPC URL with one GraphQL URL complete a migration?',
 answer:'No. Request types, selected fields, response shapes, errors, pagination and streaming transport must be adapted.',
 next:'The newest piece of that map: subscribe to exactly the activity you need.',refs:S.migration+' ; '+S.launch});
 fresh(s,'NEW SINCE BASECAMP','v1.82 removes JSON-RPC from full nodes (testnet 13 Oct).  GraphQL v1.81 (mainnet 7 Oct): multiGetDynamicFields · Balance.coinMetadata.',M,2.1,11.83,.62);
 rows(s,[['APP NEED','REPLACEMENT PATH','TILL EXAMPLE'],['State + execution','gRPC','Read balances; submit a payment'],['Filtered activity','GraphQL query + subscription','Load receipts; receive new ones'],['Pruned history','Archive / backed GraphQL','Find an old transaction by digest']],{y:2.95,height:.78,first:2.8,second:4.15,font:19});
 bar(s,'July: JSON-RPC off  →  21 Sep: subscriptions  →  7 Oct: v1.81 mainnet  →  13 Oct: JSON-RPC code removed (testnet)',6.42);
}
// 03 (cut from the 11-slide edition; flip to { to restore)
if(0){
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
// 04 (cut from the 11-slide edition; flip to { to restore)
if(0){
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
// 05 (cut from the 11-slide edition; flip to { to restore)
if(0){
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
 explain:'This is the full repository subscription, with whitespace adjusted. Cursor is delivery progress. Digest identifies the transaction. Status rejects failures. Owner, coin type and signed amount let the client calculate the shop credit. Checkpoint and timestamp place the receipt in history. NEW SINCE BASECAMP: mainnet-v1.81.1 added a nullable Balance.coinMetadata field to GraphQL, so a balance query can return the coin’s metadata (decimals, symbol) with the amount. Use it to format USDC (6 decimals) instead of hard-coding. The Till subscription still reads balanceChanges, whose nodes carry coinType, so look metadata up once per coin type.',
 show:'Trace paymentsFrom in src/lib/till.ts: SUCCESS, normalize owner, sum signed changes per normalized coin type with BigInt, retain only positive net credits. The writer groups receipts by digest and coin. Illustrative USDC case: 1000000 base units with six decimals means 1 USDC, after confirming metadata. An accepted-USDC-only rule is a further application requirement; the generic parser currently accepts all coins.',
 ask:'Why sum all changes for a coin instead of selecting the first positive row?',
 answer:'One transaction can contain debits and credits. Net change tells whether the shop gained the asset.',
 next:'The query describes what we want. Open a connection that keeps delivering it.',refs:'src/lib/till.ts'});
 code(s,query,M,2.25,7.75,4.58,14.5);
 [['CURSOR','Where to resume delivery'],['DIGEST + STATUS','Transaction + outcome'],['OWNER + COIN + AMOUNT','Net credit to this shop'],['TIMESTAMP + CHECKPOINT','When the receipt belongs']].forEach((a,i)=>{const y=2.3+i*.8;mono(s,a[0],8.83,y,3.73,.24,10);text(s,a[1],8.83,y+.32,3.73,.5,20);});
 text(s,'SUCCESS + positive net credit\n→ receipt → render + chime',8.83,5.5,3.73,.57,15,C.green);
 fresh(s,'NEW / v1.81 MAINNET 7 OCT','Balance.coinMetadata: a balance can bring its coin decimals (USDC = 6).',8.83,6.1,3.73,.78);
}
// 07
{
 const s=base('One POST request. Many SSE deliveries.','2 / THE TRANSPORT',{
 explain:'The request sends the GraphQL document and variables as JSON. The response stays open and sends SSE frames over POST /graphql/subscriptions. Native EventSource cannot send this POST body; websocket clients use a different protocol. Fetch exposes a readable stream. NEW SINCE BASECAMP: the official Data Access page still says GraphQL does not support subscriptions and points to gRPC for streaming. That is out of date: we receive GraphQL subscriptions over SSE on testnet and mainnet. Agents, the Basecamp theme, are exactly the clients that should consume these streams instead of polling. For backends, SuiGrpcClient also offers checkpoint subscriptions.',
 show:'Open src/lib/sse.ts. The shown fetch is a real excerpt, reformatted. Continue into the parser: chunks can split an SSE frame, blank lines end frames, comments can be keepalives, and errors can arrive inside HTTP 200. onNext is awaited before advancing. Seven existing tests include framing and error cases.',
 ask:'Can each reader.read() be treated as one complete GraphQL message?',
 answer:'No. Network chunks and SSE message boundaries differ. Buffer and parse complete frames.',
 next:'A stream can end. Keep the position from which we can safely resume.',refs:'src/lib/sse.ts; tests/'});
 const source=snippet(file('src/lib/sse.ts'),'const res = await fetch','  if (!res.ok')
  .replace("headers: { 'content-type': 'application/json', accept: 'text/event-stream' },","headers: {\n      'content-type': 'application/json',\n      accept: 'text/event-stream',\n    },")
  .replace('body: JSON.stringify({ query, variables }), signal,','body: JSON.stringify({ query, variables }),\n    signal,');
 code(s,source.replace(/^  /gm,''),M,2.4,7.3,3.3,16);
 mono(s,'REQUEST',8.42,2.42,3.8,.25,11);text(s,'POST /graphql/subscriptions\nquery + variables',8.42,2.85,4.1,.85,20);
 mono(s,'RESPONSE STAYS OPEN',8.42,3.9,3.8,.25,11);text(s,'text/event-stream\nreceipt A → B → C → …',8.42,4.25,4.1,.85,20);
 fresh(s,'DOCS LAG THE CHAIN','Docs still say GraphQL has no subscriptions. They are live on mainnet: trust deliveries.',8.42,5.2,4.15,.8);
 bar(s,'fetch → decode text → buffer complete SSE frames → inspect errors → await the handler',6.15);
 text(s,'EventSource cannot send this POST body. A network chunk is not a complete SSE message.',M,6.75,11.8,.25,13,C.muted);
}
// 08
{
 const s=base('The connection drops. The payments do not.','2 / CURSORS, BACKFILL AND ORDER',{
 explain:'A, B, C and D are illustrative teaching labels, not real digests or cursor encodings. Save A and cursor cA. Disconnect while B and C finalize. Reconnect with after cA. The service delivers B and C, then D live. With no cursor yet, a saved opening checkpoint supplies the first boundary through filter.afterCheckpoint, which is exclusive. NEW SINCE BASECAMP: testnet-v1.82.1 fixed subscription resumes: with after or afterCheckpoint the service no longer re-sends checkpoints at or below the resume point when a replica lags (PR 28162). Keep deduplicating by digest anyway: providers and mainnet may run older versions. The same release adds an optional x-sui-consistent-read-checkpoint header on kv-rpc so a gRPC read can wait for a checkpoint, useful for read-your-own-write after a payment (PR 27981).',
 show:'Chain progress continues while the listener is offline. Use Pause feed for the controlled demo. Save the opening checkpoint before the first stream and first payment. Never decode or invent cursors. Scope state to network, shop and query. Within a checkpoint, transactions follow their position; events follow transaction position then event position.',
 ask:'B reaches the browser but its database commit fails. Which cursor is safe to save?',
 answer:'Keep cA. Replay B on reconnect. The cursor must describe durably processed data, not merely received bytes. Replays are safe because each receipt is stored once by its digest (plus coin type), and in the SQLite writer the rows and the cursor commit in one transaction.',
 next:'Now run the whole journey yourself in the lab.',refs:S.schema+' ; src/useTill.ts; indexer/indexer.ts'});
 [['A / cp 100','Delivered + saved'],['B / cp 101','Finalizes offline'],['C / cp 101','Finalizes offline'],['D / cp 102','Continues live']].forEach((a,i)=>{const x=M+i*3.02,blue=i===0||i===3;box(s,x,2.5,2.76,1.1,blue?C.blue:C.white);mono(s,a[0],x+.18,2.7,2.4,.25,14,blue?C.white:C.blue);text(s,a[1],x+.18,3.09,2.4,.3,16,blue?C.dim:C.muted);if(i<3)arrow(s,x+2.79,3.0,.2);});
 box(s,3.77,3.84,5.78,.5,C.cream);text(s,'LISTENER OFFLINE',3.77,3.92,5.78,.3,15,C.amber,{align:'center'});
 text(s,'Saved cA',M,4.77,2.5,.45,23);text(s,'Reconnect: after = cA',3.77,4.77,5.78,.45,23);text(s,'B → C → D',10.0,4.77,2.6,.45,23,C.blue);
 text(s,'No cursor yet? Save the opening checkpoint, then use filter.afterCheckpoint.',M,5.3,11.8,.36,18);
 fresh(s,'NEW / v1.82.1 TESTNET 13 OCT','Resuming with after / afterCheckpoint no longer replays checkpoints at or below the resume point (PR 28162).',M,5.76,11.83,.6);
 bar(s,'Order: checkpoint → transaction position → event position. Persist before advancing.',6.45);
}
// 09 (cut from the 11-slide edition; flip to { to restore)
if(0){
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
// 10 (cut from the 11-slide edition; flip to { to restore)
if(0){
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

// 11 (cut from the 11-slide edition; flip to { to restore)
if(0){
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
// 12 (cut from the 11-slide edition; flip to { to restore)
if(0){
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
 explain:'Use the verified test-SUI fallback explicitly. The event target remains USDC. A funded USDC run, physical wallet approval and audible chime are not yet verified. This runbook does not claim those checks passed. Every student has a separate payer and shop. NEW SINCE BASECAMP: from v1.82 the CLI command sui client faucet supports testnet as well as devnet, using the faucet proof-of-work API (PR 28213). Students with the CLI can fund their payer that way if the in-app faucet is slow. Also new in v1.81: sui client ptb accepts withdrawal(amount) inputs for address balances (PR 27351).',
 show:'1. Clone the repo; use Node 24, pnpm install and pnpm dev, or open the live app. Copy your shop. Request test SUI. Enable sound with a click.\n2. Open till and send 0.01 SUI. Match digest, receipt and red/green balance movement; payer pays gas. Check the chime audibly.\n3. Pause feed, pay again, Resume. This stops only the listener. For real Wi-Fi loss, use a second device to pay while the till device is offline. The disconnected device cannot submit a network transaction.\n4. Reload and reopen; expect no duplicate.\n5. Copy .env.example, set SHOP_ADDRESS, FROM_CHECKPOINT to the opening boundary, and separate TILL_DB. Run pnpm indexer. Stop, pay, restart, run pnpm totals. Never share a database across shops.\n6. Use the Receipt archive panel with digest ArCwXsZUTywBuM4GbNX4CVMERmBBgeYY2mgmJJjdHa3a (7 October 2025, checkpoint 250000000): the public full node says not found, GraphQL finds it, because full-node gRPC does not fall back to the archive. Record each result. Browser totals alone do not validate the database writer.',
 ask:'Why does the Wi-Fi-drop test need a second device?',
 answer:'Only the listener is offline; the payer still needs network access.',
 next:'Apply these data decisions to an existing JSON-RPC integration.',refs:'README.md; teaching/VERIFICATION.md'});
 rows(s,[['ACTION','EXPECTED EVIDENCE','PART OF THE STACK'],['Open + pay','One receipt + chime; shop credit','gRPC execution + GraphQL feed'],['Pause → pay → resume','Missed digest appears','Cursor backfill → live'],['Reload / restart writer','Same receipt counted once','Deduplication + durable cursor'],['pnpm totals','DB total for the chosen UTC day','SQLite writer + BigInt'],['Find old receipt','Date + checkpoint + SUCCESS','Archive-backed lookup']],{y:2.28,height:.64,first:3.18,second:4.43,font:17});
 mono(s,'TESTNET / VERIFIED PAYMENT PATH: SUI / USDC RUN STILL PENDING',M,6.35,5.9,.24,10,C.amber);
 text(s,'day3-till.vercel.app',M,6.77,5.5,.25,14,C.blue,{hyperlink:{url:LIVE}});
 fresh(s,'NEW / v1.82 CLI','sui client faucet now works on testnet (proof-of-work).',6.85,6.28,5.73,.56);
}
// 14
{
 const s=base('Migrate the client, then check the response.','3 / ONE REAL JSON-RPC MIGRATION',{
 explain:'The old client calls getBalance over JSON-RPC. SuiGrpcClient exposes a typed balance wrapper. Adapt the response; do not reuse the old object shape blindly. Inspect totalBalance, coinBalance and addressBalance. The GraphQL alternative selects Address.balance and joins receipt and event data. NEW SINCE BASECAMP: the frontend side matters as much as the node side. The SDK docs say the legacy @mysten/dapp-kit only supports the deprecated JSON-RPC API and will not receive further updates; migrate to @mysten/dapp-kit-react (with @mysten/dapp-kit-core underneath) and pass a SuiGrpcClient to createDAppKit. With v1.82 removing JSON-RPC from full nodes, an old dApp Kit app will stop reading once its provider upgrades. Also check result shape, total balance, errors and pagination, and obtain fresh API cursors.',
 show:'Open migration/legacy-jsonrpc.ts and migration/migrated-grpc.ts. Panels use their imports, construction and calls, reformatted. Run pnpm migrate:legacy, pnpm migrate:grpc and pnpm migrate:graphql. The old public endpoint previously returned -32601 inside HTTP 200; provider behaviour varies. Other examples replace getTransactionBlock with getTransaction and queryEvents with listEvents. Normalize event type addresses in the gRPC example.',
 ask:'What changes besides the imported client class?',
 answer:'Result shape, errors, selected fields, pagination and fresh API cursors.',
 next:'Each student migrates one call from a project they brought.',refs:'migration/; '+S.migration});
 mono(s,'BEFORE / migration/legacy-jsonrpc.ts',M,2.25,5.76,.25,10);
 mono(s,'AFTER / migration/migrated-grpc.ts',6.8,2.25,5.76,.25,10);
 const oldCode=['import { SuiJsonRpcClient,','  getJsonRpcFullnodeUrl',"} from '@mysten/sui/jsonRpc';",'','const client = new SuiJsonRpcClient({',"  url: getJsonRpcFullnodeUrl('testnet'),","  network: 'testnet'",'});','','client.getBalance({ owner: SHOP })'].join('\n');
 const newCode=['import { SuiGrpcClient }',"  from '@mysten/sui/grpc';",'','const client = new SuiGrpcClient({',"  network: 'testnet',",'  baseUrl:',"    'https://fullnode.testnet.sui.io:443'",'});','','const { balance } =','  await client.getBalance({ owner: SHOP });'].join('\n');
 code(s,oldCode,M,2.77,5.78,3.17,13.7);code(s,newCode,6.8,2.77,5.78,3.17,13.7);
 fresh(s,'WHY IT MATTERS NOW','v1.82 removed JSON-RPC from full nodes, and legacy @mysten/dapp-kit is JSON-RPC only. Move to @mysten/dapp-kit-react + SuiGrpcClient.',M,6.12,11.83,.62);
}
// 15
{
 const s=base('Your app: replace one call and prove it works.','3 / THE ROOM’S MIGRATION WORKSHOP',{
 explain:'The final workshop is on students’ own projects. Give students without a project Till’s migration folder. The deliverable is a working change, not a verbal claim of migration. NEW SINCE BASECAMP: at Basecamp, Sui showed Sui Evals, an open benchmark of AI model knowledge of Sui; loading the Sui skills files reportedly raised median scores by about 35 points. MystenLabs/skills and the Sui docs MCP at sui.mcp.kapa.ai are public. Encourage students to point their coding agent at them for the migration, then verify the result themselves.',
 show:'Allow 25 to 35 minutes. Find one JSON-RPC read or polling loop. State the screen’s need, choose the replacement and edit the code. Verify a known balance or transaction. For a feed, demonstrate disconnect and replay. For history, test an old digest and retention path. Name the production provider and quotas. Ask two students to show the diff and explain their choice.',
 ask:'Show the changed call, its new result, and the failure case you tested.',
 answer:'A reviewable diff, a known-data check and a relevant failure or recovery check. The data-service choice is part of the answer.',
 next:'Return to the examples collected on slide 1. Each student should be able to explain which service handles each app responsibility.',refs:REPO+' ; '+LIVE},true);
 [['01','Find one call','What does its screen need?'],['02','Choose + replace','gRPC, GraphQL or a subscription'],['03','Verify the behaviour','Known data + one failure case']].forEach((a,i)=>{const y=2.25+i*1.02;mono(s,a[0],M,y+.12,.55,.3,18,C.dim);text(s,a[1],1.6,y,4.7,.6,27,C.white);text(s,a[2],6.6,y+.05,5.95,.55,21,C.dim);});
 fresh(s,'BASECAMP TOOLS FOR THIS','Sui skills + Sui docs MCP (sui.mcp.kapa.ai) help your AI agent do the migration. Sui Evals: skills reportedly add ~35 points.',M,4.98,11.83,.6,true);
 box(s,M,5.67,11.83,.69,C.blue);
 text(s,'Leave with a working diff, its evidence, and a reason for your data-stack choice.',M+.18,5.82,11.45,.38,20,C.white);
 text(s,'github.com/Nuel-osas/day3-till',M,6.64,7,.3,17,C.dim,{hyperlink:{url:REPO}});
 text(s,'day3-till.vercel.app',8.65,6.64,3.93,.3,17,C.dim,{hyperlink:{url:LIVE}});
}
if(p._slides.length!==TOTAL)throw Error('Expected exactly '+TOTAL+' slides');
const preface=[
 '# Day 3: Real-Time Sui','',
 'Teaching edition: 16 October 2026. Exactly 11 slides.','',
 '## Before class','',
 '- The event target is USDC. The browser form sends SUI; a funded USDC end-to-end run has not passed. Disclose the test-SUI fallback. The target diagram is not verified USDC behaviour.',
 '- Use Day3_Real_Time_Sui.pptx, not the original October 12 Day3_Till_Live_Data.pptx. The lesson follows: choose the stack, build a reliable feed, then migrate an existing app.',
 '- Open the app, repo, GraphQL IDE and two terminals. Use Node 24 and Sui testnet. Each student has their own payer and shop.',
 '- Run the SQLite writer separately. Save the opening checkpoint before payments. The writer is not a long-running Vercel worker.',
 '- For real Wi-Fi loss, pay from a second device while the listening device is offline. Pause feed is the controlled listener-only equivalent.',
 '- Check chime through a user gesture and physical wallet approval. These remain manual checks.',
 '- Slide 1: the promise. Slides 2-3: the Sui stack after Basecamp (7 to 8 October). Slide 4: who serves Sui data now. Slide 5: which service answers which read. Slides 6-8: subscriptions, the SSE transport and cursors. Slide 9: lab. Slides 10-11: migration.','',
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
