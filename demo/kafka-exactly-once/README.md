# Kafka Exactly-Once Demo

Demo **Kafka EOS (exactly-once semantics)** cho pipeline **Kafka → Kafka**:

```
orders-in  ──►  [Transactional Processor]  ──►  orders-out
                      │
            trong 1 transaction:
              consume + produce + commit offset
```

> **Lưu ý:** EOS native của Kafka áp dụng cho **read-process-write trong Kafka**.  
> Kafka → Postgres cần **Inbox/Outbox** — xem [mqs/exactly-once.md](../../mqs/exactly-once.md).

---

## Kiến trúc

```
┌─────────────┐     idempotent      ┌─────────────┐
│ 1-produce   │ ──────────────────► │  orders-in  │
└─────────────┘     producer        └──────┬──────┘
                                           │
                                    2-eos-processor
                                    (transactional)
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │ orders-out  │
                                    └──────┬──────┘
                                           │
                                    3-verify-output
                                    (check no dup eventId)
```

| Thành phần | Vai trò |
|------------|---------|
| **Idempotent producer** | `1-produce.ts` — PID + sequence, chống dup khi retry gửi |
| **Transactional producer** | `2-eos-processor.ts` — `transactional.id` + `sendOffsets` |
| **READ_COMMITTED consumer** | Chỉ đọc message đã commit transaction |

---

## Chạy demo

### 1. Start Kafka

```bash
cd demo/kafka-exactly-once
docker compose up -d
# đợi healthy (~30s)
docker compose ps
```

Broker: `localhost:9094`

### 2. Install dependencies

```bash
npm install
cp .env.example .env
```

### 3. Cách A — Hai terminal (processor chạy liên tục)

**Terminal 1 — processor:**

```bash
npm run process
```

**Terminal 2:**

```bash
npm run produce        # gửi 5 message vào orders-in
# đợi processor log ✅ EOS batch...
npm run verify         # kiểm tra orders-out không dup eventId
```

### 4. Cách B — One-shot (một lệnh)

```bash
npm run produce
npx tsx src/2-eos-processor.ts --once
npm run verify
```

### 5. Full script

```bash
# Terminal 1: npm run process
# Terminal 2:
npm run demo
```

---

## Code quan trọng

**Transactional batch** (`src/2-eos-processor.ts`):

```typescript
const transaction = await producer.transaction();
await transaction.send({ topic: 'orders-out', messages: [...] });
await transaction.sendOffsets({
  consumerGroupId: 'eos-processor-group',
  topics: [{ topic, partitions: [{ partition, offset }] }],
});
await transaction.commit();
```

**Khác at-least-once:**

| At-least-once | Exactly-once (Kafka EOS) |
|---------------|--------------------------|
| process → commit offset riêng | produce + offset **cùng transaction** |
| crash giữa chừng → dup output | abort → không có output chưa commit |

---

## Cấu hình Kafka (docker-compose)

Single broker cần:

```yaml
KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR: 1
```

---

## Troubleshooting

| Lỗi | Cách xử lý |
|-----|------------|
| `ECONNREFUSED :9094` | `docker compose up -d`, đợi healthy |
| `Invalid transactionalId` | Chỉ 1 processor instance / `transactional.id` |
| verify 0 messages | Chạy processor trước hoặc dùng `--once` sau produce |
| Duplicate sau rebalance | EOS trong txn; production cần monitor rebalance |

---

## Liên quan

- [mqs/exactly-once.md](../../mqs/exactly-once.md)
- [mqs/at-least-once.md](../../mqs/at-least-once.md)
- [design-sys/vips/outbox.md](../../design-sys/vips/outbox.md) — Kafka → DB
