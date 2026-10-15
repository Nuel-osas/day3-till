import { test } from 'node:test';
import assert from 'node:assert/strict';
import { subscribe } from '../src/lib/sse.ts';
import { paymentsFrom, SUI_TYPE, type Delivery } from '../src/lib/till.ts';
import { applyDelivery, emptySnapshot, parseSui } from '../src/lib/session.ts';
import { factsFor, POST } from '../api/close.ts';
const delivery: Delivery = { transactions: { cursor: 'c1', node: { digest: 'd1', sender: { address: '0x2' }, effects: { status: 'SUCCESS', timestamp: '2026-10-15T09:00:00Z', checkpoint: { sequenceNumber: 123 }, balanceChanges: { nodes: [ { owner: { address: '0x1' }, coinType: { repr: '0x2::sui::SUI' }, amount: '10000000' }, { owner: { address: '0x1' }, coinType: { repr: SUI_TYPE }, amount: '-1000' } ] } } } } };
test('net receipts aggregate each coin, exclude failed payments and outgoing balances', () => {
  assert.equal(paymentsFrom(delivery, '0x1')[0].amount, '9999000');
  assert.deepEqual(paymentsFrom(delivery, '0x2'), []);
  const failed = structuredClone(delivery); failed.transactions.node.effects.status = 'FAILURE'; assert.deepEqual(paymentsFrom(failed, '0x1'), []);
});
test('cursor and payments advance together; replay is idempotent; first cursor can be recovered', () => {
  const a = applyDelivery({ ...emptySnapshot(), startCheckpoint: 100 }, delivery, '0x1', Date.parse('2026-10-15T09:01:00Z'));
  assert.equal(a.snapshot.cursor, 'c1'); assert.equal(a.added[0].recovered, true);
  const b = applyDelivery(a.snapshot, delivery, '0x1', Date.now()); assert.equal(b.snapshot.payments.length, 1); assert.equal(b.added.length, 0);
  const outbound = structuredClone(delivery); outbound.transactions.cursor = 'c2'; outbound.transactions.node.effects.balanceChanges.nodes = [];
  assert.equal(applyDelivery(b.snapshot, outbound, '0x1', 0).snapshot.cursor, 'c2');
});
test('amounts use exact base units and reject unsafe inputs', () => {
  assert.equal(parseSui('0.000000001'), 1n); assert.equal(parseSui('0.1'), 100000000n);
  for (const v of ['0', '-1', '1e-3', 'NaN', '0.0000000001', '0.100000001']) assert.throws(() => parseSui(v));
});
test('summary uses exact decimals and separates coin types with identical symbols', () => {
  const line = { symbol: 'SUI', sender: '0x1', timestamp: '2026-10-15', coinType: SUI_TYPE };
  assert.match(factsFor([{ ...line, amount: '0.1' }, { ...line, amount: '0.2' }]), /0.3 SUI/);
  assert.match(factsFor([{ ...line, amount: '0.1' }, { ...line, amount: '0.2', coinType: 'other' }]), /0.1 SUI, 0.2 SUI/);
});
test('invalid summary bodies return 400', async () => {
  const r = await POST(new Request('http://localhost/api/close', { method: 'POST', body: JSON.stringify({ payments: 'invalid' }) })); assert.equal(r.status, 400);
});
test('SSE handles split CRLF, multiline data, keepalives and empty complete events', async t => {
  const chunks = [': heartbeat\r', '\n\r\nevent: next\r\ndata: {"data":\r\ndata: {"n":1}}\r', '\n\r\nevent: complete\r\n\r\nevent: next\ndata: {"data":{"n":2}}\n\n'];
  const stream = new ReadableStream({ start(c) { chunks.forEach(s => c.enqueue(new TextEncoder().encode(s))); c.close(); } });
  t.mock.method(globalThis, 'fetch', async () => new Response(stream, { headers: { 'content-type': 'text/event-stream' } }));
  const values: unknown[] = []; await subscribe('http://test', '', {}, { onNext: d => { values.push(d); } }); assert.deepEqual(values, [{ n: 1 }]);
});
test('GraphQL errors inside HTTP 200 reject the connection', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('event: next\ndata: {"errors":[{"message":"Bad filter"}]}\n\n', { headers: { 'content-type': 'text/event-stream' } }));
  await assert.rejects(subscribe('http://test', '', {}, { onNext() {} }), /Bad filter/);
});
