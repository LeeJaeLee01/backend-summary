import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { eventBus } from './event-bus.js';
import { printState } from './show-state.js';
import { createRuntime } from './services/index.js';
type Scenario = 'all' | 'success' | 'fail' | 'inbox';

function parseScenario(): Scenario {
  const idx = process.argv.indexOf('--scenario');
  const value = idx >= 0 ? process.argv[idx + 1] : 'all';
  if (value === 'success' || value === 'fail' || value === 'inbox') return value;
  return 'all';
}

function resetData() {
  spawnSync('npx', ['tsx', 'src/reset.ts'], { stdio: 'inherit', shell: true });
}

async function waitForPropagation(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function runRelayUntilIdle(rt: ReturnType<typeof createRuntime>, maxRounds = 30) {
  for (let i = 0; i < maxRounds; i++) {
    await rt.relay.pollOnce();
    const pending =
      rt.orderStore.countUnpublishedOutbox() +
      rt.inventoryStore.countUnpublishedOutbox() +
      rt.paymentStore.countUnpublishedOutbox();
    if (pending === 0) break;
    await waitForPropagation(config.outboxPollMs);
  }
}

async function scenarioSuccess() {
  console.log('\n══════════════════════════════════════════');
  console.log(' SCENARIO 1: Happy path — payment OK');
  console.log('══════════════════════════════════════════\n');

  resetData();
  eventBus.reset();
  const rt = createRuntime();

  const orderId = `ord_${randomUUID().slice(0, 8)}`;
  rt.orderService.placeOrder({
    orderId,
    productSku: 'SKU-001',
    qty: 2,
    amount: 199.99,
    forcePaymentFail: false,
  });

  await runRelayUntilIdle(rt);
  printState(rt, 'Kết quả — order confirmed, stock trừ, payment completed');

  const order = rt.orderStore.get<{ id: string; status: string }>('orders').find((o) => o.id === orderId);
  if (order?.status !== 'confirmed') {
    throw new Error(`Expected confirmed, got ${order?.status}`);
  }
  console.log('\n✅ Happy path OK\n');
}

async function scenarioFail() {
  console.log('\n══════════════════════════════════════════');
  console.log(' SCENARIO 2: Payment fail → Saga compensate');
  console.log('══════════════════════════════════════════\n');

  resetData();
  eventBus.reset();
  const rt = createRuntime();

  const stockBefore = rt.inventoryStore.get<{ sku: string; qty: number }>('inventory')[0].qty;

  const orderId = `ord_${randomUUID().slice(0, 8)}`;
  rt.orderService.placeOrder({
    orderId,
    productSku: 'SKU-001',
    qty: 3,
    amount: 299.99,
    forcePaymentFail: true,
  });

  await runRelayUntilIdle(rt);
  printState(rt, 'Kết quả — order cancelled, stock released (compensate)');

  const order = rt.orderStore.get<{ id: string; status: string }>('orders').find((o) => o.id === orderId);
  const stockAfter = rt.inventoryStore.get<{ sku: string; qty: number }>('inventory')[0].qty;
  const reservation = rt.inventoryStore
    .get<{ order_id: string; status: string }>('stock_reservations')
    .find((r) => r.order_id === orderId);

  if (order?.status !== 'cancelled') throw new Error(`Expected cancelled, got ${order?.status}`);
  if (reservation?.status !== 'released') throw new Error('Expected stock released');
  if (stockAfter !== stockBefore) throw new Error('Stock should be restored after compensate');

  console.log('\n✅ Compensate path OK\n');
}

async function scenarioInbox() {
  console.log('\n══════════════════════════════════════════');
  console.log(' SCENARIO 3: Inbox — duplicate event chỉ xử lý 1 lần');
  console.log('══════════════════════════════════════════\n');

  resetData();
  eventBus.reset();
  const rt = createRuntime();

  const orderId = `ord_${randomUUID().slice(0, 8)}`;
  rt.orderService.placeOrder({
    orderId,
    productSku: 'SKU-001',
    qty: 1,
    amount: 49.99,
    forcePaymentFail: false,
  });

  // Chỉ relay order → inventory reserve (stock.reserved còn trong outbox, chưa publish)
  await rt.relay.pollOnce('order');
  await waitForPropagation(100);

  const stockEvent = rt.inventoryStore
    .getUnpublishedOutbox()
    .find((r) => r.event_type === 'stock.reserved');

  if (!stockEvent) throw new Error('stock.reserved not found in outbox');

  const domainEvent = {
    eventId: stockEvent.event_id,
    eventType: stockEvent.event_type,
    aggregateId: stockEvent.aggregate_id,
    payload: JSON.parse(stockEvent.payload) as Record<string, unknown>,
    occurredAt: new Date().toISOString(),
  };

  console.log('[demo] Gửi stock.reserved 2 lần (at-least-once)...');
  await eventBus.publish(domainEvent, { duplicate: true });

  rt.inventoryStore.markOutboxPublished(stockEvent.id);
  rt.inventoryStore.flush();

  await rt.relay.pollOnce('payment');
  await rt.relay.pollOnce('order');
  printState(rt, 'Kết quả — chỉ 1 payment dù event duplicate');

  const paymentCount = rt.paymentStore
    .get<{ order_id: string }>('payments')
    .filter((p) => p.order_id === orderId).length;

  if (paymentCount !== 1) {
    throw new Error(`Expected 1 payment row, got ${paymentCount} (inbox failed)`);
  }

  console.log('\n✅ Inbox dedup OK — payment không bị charge 2 lần\n');
}

async function main() {
  const scenario = parseScenario();

  console.log('=== Saga Choreography Demo ===');
  console.log('3 microservice × 3 JSON store + Outbox + Inbox');
  console.log('Flow: Order → Inventory → Payment (+ compensate khi fail)\n');

  if (scenario === 'all' || scenario === 'success') await scenarioSuccess();
  if (scenario === 'all' || scenario === 'fail') await scenarioFail();
  if (scenario === 'all' || scenario === 'inbox') await scenarioInbox();

  console.log('══════════════════════════════════════════');
  console.log(' Demo xong. Đọc README.md để map sang production.');
  console.log('══════════════════════════════════════════');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
