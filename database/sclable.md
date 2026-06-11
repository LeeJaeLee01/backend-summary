# Tách Read / Write Database — Giảm tải DB

Khi traffic tăng, **read** (SELECT) thường chiếm **70–90%** query nhưng **write** (INSERT/UPDATE/DELETE) mới gây lock và contention. Tách **1 primary ghi** + **1 hoặc nhiều replica đọc** để scale read mà không nhân đôi chi phí ghi.

```
                    ┌─────────────┐
   INSERT/UPDATE   │   Primary   │  ← mọi write
   DELETE    ──────►│   (Write)   │
                    └──────┬──────┘
                           │ streaming replication
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
 SELECT │ Replica 1│ │ Replica 2│ │ Replica N│  ← read scale
        └──────────┘ └──────────┘ └──────────┘
              ▲
              │
         App route read query
```

> PostgreSQL / MySQL InnoDB / RDS đều hỗ trợ pattern này. Chi tiết failover/HA: sẽ bổ sung ở `replication-ha.md`.  
> **Demo chạy được:** [demo/read-write-split](../demo/read-write-split/) — NestJS + PostgreSQL primary/replica + Docker Compose.

---

## 1. Vì sao tách read / write?

| Vấn đề | Tách read/write giải quyết |
|--------|----------------------------|
| Primary quá tải vì SELECT nhiều | Replica nhận phần lớn read |
| Report/analytics làm chậm OLTP | Report chạy trên replica riêng |
| Connection pool full | Chia pool: write → primary, read → replica |
| CPU primary cao chỉ vì read | Scale thêm replica (horizontal read) |

**Không giải quyết:**

- Write-heavy workload (insert/update nhiều) — primary vẫn là bottleneck
- Cross-shard query, JOIN phức tạp giữa nhiều DB
- Strong consistency bắt buộc mọi read phải thấy write vừa xong

---

## 2. Kiến trúc cơ bản

### Primary (Write DB)

- Nhận **mọi** INSERT, UPDATE, DELETE, DDL
- Nhận SELECT nếu cần **read-your-writes** (đọc ngay sau khi ghi)
- Thường **1 primary** — không ghi song song 2 primary (split brain)

### Read Replica (Read DB)

- **Copy async** từ primary (streaming replication)
- Chỉ phục vụ SELECT (và read-only transaction)
- Có thể thêm nhiều replica — scale read ngang
- **Read-only** — mọi write redirect về primary

### Replication lag

Replica **luôn trễ** primary một khoảng (ms → vài giây):

```
T0: User POST /orders     → write primary OK
T1: User GET /orders/123  → read replica → có thể CHƯA thấy order mới (lag)
```

| Lag | Nguyên nhân thường gặp |
|-----|------------------------|
| < 100ms | Bình thường, OLTP ổn |
| 1–10s | Replica yếu hơn primary, query nặng trên replica, network |
| > 10s | Replica disk/CPU quá tải, long transaction trên primary, cần alert |

---

## 3. Thao tác đồng bộ Primary ↔ Replica (Slave)

Phần này mô tả **cách data được copy từ primary sang replica** và **các bước thực hiện** (setup, kiểm tra, xử lý lỗi). App **không** tự sync từng row — DB engine làm việc này qua **replication log**.

### 3.1 Cơ chế đồng bộ

```
Primary                              Replica (Slave)
───────                              ───────────────
Ghi data → WAL (Write-Ahead Log)
              │
              │  streaming replication (liên tục)
              └────────────────────────► Nhận WAL → replay → data cập nhật
```

| Khái niệm | Giải thích |
|-----------|------------|
| **WAL** | Log mọi thay đổi trên primary (PostgreSQL) |
| **Binlog** | Tương đương WAL trên MySQL |
| **Streaming** | Primary **push** log realtime, không đợi batch |
| **Replay / Apply** | Replica áp log → bảng/index giống primary (trễ một chút) |

**Sync vs Async:**

| Mode | Ghi primary | Rủi ro |
|------|-------------|--------|
| **Async** (phổ biến cho read replica) | Không chờ replica xác nhận | Replica lag; primary down có thể mất vài giây WAL chưa replicate |
| **Sync** | Chờ ít nhất 1 replica flush | Chậm hơn; dùng HA quan trọng, ít dùng cho read scale thuần |

> Read replica OLTP thường dùng **async** — mục tiêu giảm tải read, không phải zero data loss.

---

### 3.2 PostgreSQL — Setup replica từ đầu (self-hosted)

#### Bước 1: Cấu hình Primary

```bash
# postgresql.conf trên PRIMARY
wal_level = replica          # bắt buộc cho replication
max_wal_senders = 10         # số replica tối đa connect
max_replication_slots = 10   # optional — tránh mất WAL khi replica offline
hot_standby = on             # replica cho phép SELECT
```

```bash
# pg_hba.conf — cho phép user replication từ IP replica
host  replication  replicator  10.0.1.50/32  scram-sha-256
```

```sql
-- Tạo user replication trên PRIMARY
CREATE USER replicator WITH REPLICATION PASSWORD 'strong-password' LOGIN;
```

Restart PostgreSQL primary sau khi đổi config.

#### Bước 2: Clone data ban đầu sang Replica

Replica mới phải có **snapshot** primary tại một thời điểm, rồi bắt kịp WAL phía sau.

```bash
# Trên REPLICA server — dừng postgres nếu đang chạy
sudo systemctl stop postgresql

# Xóa data cũ (cẩn thận — máy mới hoàn toàn)
sudo rm -rf /var/lib/postgresql/16/main/*

# pg_basebackup — copy toàn bộ data + bật streaming
sudo -u postgres pg_basebackup \
  -h PRIMARY_HOST \
  -p 5432 \
  -U replicator \
  -D /var/lib/postgresql/16/main \
  -Fp -Xs -P -R

# -R: tạo sẵn standby.signal + postgresql.auto.conf (PG 12+)
```

File `postgresql.auto.conf` trên replica (tự tạo bởi `-R`):

```
primary_conninfo = 'host=PRIMARY_HOST port=5432 user=replicator password=... application_name=replica1'
```

```bash
# Khởi động replica
sudo systemctl start postgresql
```

#### Bước 3: Xác nhận đồng bộ đang chạy

**Trên PRIMARY:**

```sql
SELECT
  client_addr,
  application_name,
  state,           -- streaming = OK
  sync_state,      -- async / sync
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replication_lag
FROM pg_stat_replication;
```

| `state` | Ý nghĩa |
|---------|---------|
| `streaming` | ✅ Đang đồng bộ realtime |
| `startup` | Replica đang khởi động / catch-up |
| (không có row) | ❌ Replica chưa connect — kiểm tra network, pg_hba, password |

**Trên REPLICA:**

```sql
-- Replica ở chế độ read-only
SELECT pg_is_in_recovery();  -- true = standby/replica

-- Lag ước lượng (giây)
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;
```

**Test thực tế:**

```sql
-- PRIMARY: insert test
INSERT INTO health_check (note) VALUES ('sync-test-' || now());

-- REPLICA (vài trăm ms sau): phải thấy row
SELECT * FROM health_check ORDER BY id DESC LIMIT 1;
```

---

### 3.3 AWS RDS — Tạo Read Replica (managed)

Cloud tự lo initial sync + streaming — không cần `pg_basebackup` thủ công.

**Console:**

```
RDS → Databases → chọn Primary instance
→ Actions → Create read replica
→ Chọn instance class, AZ, Multi-AZ (optional)
→ Create
```

**AWS CLI:**

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier myapp-replica-1 \
  --source-db-instance-identifier myapp-primary \
  --db-instance-class db.r6g.large \
  --availability-zone ap-southeast-1b
```

**Sau khi tạo:**

```bash
# Endpoint riêng — dùng cho app read pool
aws rds describe-db-instances \
  --db-instance-identifier myapp-replica-1 \
  --query 'DBInstances[0].Endpoint'
```

```
Primary:  myapp-primary.xxxx.ap-southeast-1.rds.amazonaws.com
Replica:  myapp-replica-1.xxxx.ap-southeast-1.rds.amazonaws.com
```

**Kiểm tra lag (CloudWatch):**

- Metric: `ReplicaLag` (giây)
- Alert: `ReplicaLag > 5` trong 5 phút

**Lưu ý RDS:**

- Migration/DDL chạy trên **primary** → replica tự apply
- Không SSH vào replica để “sync thủ công”
- Promote replica thành primary = **break replication** (one-way)

---

### 3.4 MySQL — Setup replica (InnoDB)

MySQL dùng **binary log (binlog)** thay WAL.

**Primary (`my.cnf`):**

```ini
[mysqld]
server-id = 1
log_bin = mysql-bin
binlog_format = ROW
gtid_mode = ON
enforce_gtid_consistency = ON
```

```sql
CREATE USER 'replicator'@'%' IDENTIFIED BY 'strong-password';
GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';

-- Lấy vị trí binlog (hoặc dùng GTID)
SHOW MASTER STATUS;
-- File: mysql-bin.000003, Position: 15432
```

**Replica:**

```bash
# Backup initial (mysqldump hoặc Percona XtraBackup)
mysqldump -h PRIMARY -u root -p --all-databases --master-data=2 > dump.sql
mysql < dump.sql
```

```sql
-- Replica
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST = 'PRIMARY_HOST',
  SOURCE_USER = 'replicator',
  SOURCE_PASSWORD = 'strong-password',
  SOURCE_LOG_FILE = 'mysql-bin.000003',
  SOURCE_LOG_POS = 15432;

START REPLICA;

-- Kiểm tra
SHOW REPLICA STATUS\G
-- Replica_IO_Running: Yes, Replica_SQL_Running: Yes, Seconds_Behind_Source: 0
```

---

### 3.5 Đồng bộ hàng ngày — cần làm gì?

| Việc | Ai làm | Tần suất |
|------|--------|----------|
| Stream WAL/binlog primary → replica | DB engine | **Tự động, liên tục** |
| App ghi primary | Developer | Mỗi write |
| Migration DDL trên primary | CI/CD | Mỗi deploy schema |
| Monitor lag | Ops | Realtime / alert |
| `ANALYZE` trên replica | Optional | Replica có stats riêng (PG) |
| Manual “sync data” giữa 2 DB | **Không cần** | — |

**Sau migration schema trên primary:**

```sql
-- Chỉ chạy trên PRIMARY
ALTER TABLE orders ADD COLUMN note TEXT;

-- Replica tự nhận qua replication — KHÔNG chạy lại trên replica
-- Verify trên replica:
\d orders   -- phải thấy cột note
```

---

### 3.6 Xử lý khi đồng bộ lỗi / lag cao

| Triệu chứng | Nguyên nhân | Xử lý |
|-------------|-------------|-------|
| `pg_stat_replication` trống | Replica down, sai password, firewall | Fix connect → restart replica |
| Lag tăng dần | Query nặng trên replica, replica nhỏ hơn primary | Scale replica; tách analytics replica |
| WAL đầy trên primary | Replica offline lâu, slot giữ WAL | Restore replica hoặc drop slot |
| Data lệch (hiếm) | Replica từng writable, restore sai | **Rebuild replica** từ primary |
| `Seconds_Behind_Source` cao (MySQL) | Disk/CPU replica, long query | Scale + kill query nặng |

**Rebuild replica PostgreSQL (an toàn nhất khi nghi ngờ lệch data):**

```bash
# 1. Dừng replica
sudo systemctl stop postgresql

# 2. Xóa data replica
sudo rm -rf /var/lib/postgresql/16/main/*

# 3. pg_basebackup lại từ primary (giống setup ban đầu)
sudo -u postgres pg_basebackup -h PRIMARY_HOST -U replicator \
  -D /var/lib/postgresql/16/main -Fp -Xs -P -R

# 4. Start replica — catch-up tự động
sudo systemctl start postgresql
```

**RDS — rebuild replica:**

```
Actions → Delete read replica (nếu hỏng)
Actions → Create read replica (mới) — sync lại từ primary snapshot
```

---

### 3.7 Replication slot (PostgreSQL — tránh mất WAL)

Khi replica offline, primary vẫn giữ WAL cho đến khi replica catch-up. Dùng **slot** để primary không xóa WAL sớm.

```sql
-- PRIMARY: tạo slot cho replica
SELECT pg_create_physical_replication_slot('replica1_slot');

-- postgresql.auto.conf trên replica
primary_slot_name = 'replica1_slot'
```

```sql
-- Kiểm tra slot
SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots;
```

> Slot inactive lâu → WAL tích tụ → disk primary đầy. Alert khi `retained_wal` lớn.

---

### 3.8 Checklist đồng bộ Primary ↔ Replica

```
□ Primary: wal_level=replica, user replication, pg_hba cho phép replica IP
□ Initial sync: pg_basebackup (PG) / mysqldump+XtraBackup (MySQL) / RDS Create Replica
□ Replica: pg_is_in_recovery() = true (PG) hoặc read_only=1 (MySQL)
□ pg_stat_replication state = streaming (PG)
□ Test INSERT primary → SELECT replica thấy row
□ Monitor lag (pg_stat_replication / ReplicaLag / Seconds_Behind_Source)
□ Alert lag > ngưỡng SLA
□ DDL chỉ trên primary — không chạy migration trên replica
□ Plan rebuild replica khi lag không hồi hoặc nghi data lệch
```

---

## 4. Khi nào nên dùng?

### ✅ Nên dùng

| Use case | Route |
|----------|-------|
| List/detail API (feed, catalog, profile) | **Replica** |
| Dashboard, report, export CSV | **Replica** (hoặc replica analytics riêng) |
| Search, filter phức tạp | **Replica** |
| Background job đọc nhiều | **Replica** |
| Create order, update profile, payment | **Primary** |
| Đọc ngay sau write (redirect sau POST) | **Primary** |

### ❌ Chưa cần / không phù hợp

- Traffic nhỏ, primary < 40% CPU — optimize query/index trước
- App cần **strong consistency** mọi request — replica gây stale read
- Write >> read — scale vertical primary hoặc sharding trước
- Chưa monitor lag — dễ bug khó debug

---

## 5. Routing read / write ở App

### Quy tắc routing

```
WRITE  →  Primary   (INSERT, UPDATE, DELETE, transaction có write)
READ   →  Replica   (SELECT thuần, không cần data vừa ghi)
READ*  →  Primary   (* sau write trong cùng request/session — read-your-writes)
```

### Node.js — 2 connection pool

```typescript
import { Pool } from 'pg';

const primaryPool = new Pool({
  host: process.env.DB_PRIMARY_HOST,
  port: 5432,
  database: 'myapp',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  application_name: 'api-primary',
});

const replicaPool = new Pool({
  host: process.env.DB_REPLICA_HOST,
  port: 5432,
  database: 'myapp',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // read thường cần pool lớn hơn
  application_name: 'api-replica',
});

// Helper
export const db = {
  write: primaryPool,
  read: replicaPool,
};
```

**Service layer:**

```typescript
// READ — list orders (OK stale vài trăm ms)
async function listOrders(userId: number) {
  const { rows } = await db.read.query(
    `SELECT id, total, status, created_at
     FROM orders WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );
  return rows;
}

// WRITE — create order
async function createOrder(userId: number, total: number) {
  const client = await db.write.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, total, status)
       VALUES ($1, $2, 'pending') RETURNING id`,
      [userId, total]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// READ after WRITE — dùng primary (read-your-writes)
async function createOrderAndReturn(userId: number, total: number) {
  const order = await createOrder(userId, total);
  const { rows } = await db.write.query(
    'SELECT * FROM orders WHERE id = $1',
    [order.id]
  );
  return rows[0];
}
```

---

### Prisma — read replicas extension

```typescript
// schema.prisma — datasource primary
// prisma/schema.prisma
// datasource db { provider = "postgresql" url = env("DATABASE_URL") }

import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';

const prisma = new PrismaClient().$extends(
  readReplicas({
    url: process.env.DATABASE_REPLICA_URL!,
  })
);

// Read → replica
const users = await prisma.user.findMany({ take: 20 });

// Write → primary
await prisma.user.create({ data: { email: 'a@b.com' } });

// Read sau write — force primary
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email: 'x@y.com' } });
  return tx.user.findUnique({ where: { id: user.id } }); // cùng tx → primary
});
```

---

### TypeORM — 2 DataSource

```typescript
// data-source-primary.ts
export const PrimaryDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_PRIMARY_HOST,
  // ...
  name: 'primary',
});

// data-source-replica.ts
export const ReplicaDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_REPLICA_HOST,
  // ...
  name: 'replica',
});

// READ
const orders = await ReplicaDataSource.getRepository(Order).find({
  where: { userId },
  take: 20,
});

// WRITE
await PrimaryDataSource.getRepository(Order).save(order);
```

---

## 6. Xử lý Replication Lag

### 6.1 Read-your-writes (user vừa ghi, vừa đọc)

| Pattern | Cách làm |
|---------|----------|
| **Cùng request** | Sau INSERT → SELECT từ **primary** |
| **Redirect sau POST** | `POST /orders` → `302` → `GET /orders/:id` — GET từ primary hoặc đợi lag |
| **Session flag** | Sau write, 2–5s tiếp theo route read → primary |
| **Sticky primary** | Header `X-Read-From: primary` nội bộ |

```typescript
// Middleware — sau write trong 3s dùng primary cho read
const recentWrites = new Map<string, number>(); // userId → timestamp

function getReadPool(userId: string): Pool {
  const lastWrite = recentWrites.get(userId);
  if (lastWrite && Date.now() - lastWrite < 3000) {
    return primaryPool; // read-your-writes window
  }
  return replicaPool;
}

function markWritten(userId: string) {
  recentWrites.set(userId, Date.now());
}
```

### 6.2 Chấp nhận eventual consistency

Phù hợp khi stale read **OK**:

- Product catalog (delay vài giây)
- View count, like count
- Notification list (không critical)
- Search index (đã async anyway)

### 6.3 Monitor lag

```sql
-- PostgreSQL — lag giây (trên replica hoặc primary)
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds
FROM pg_stat_replication;

-- RDS CloudWatch: ReplicaLag metric
```

**Alert khi:** `lag_seconds > 5` (tuỳ SLA) hoặc replica disconnect.

---

## 7. Phân loại endpoint — ví dụ thực tế

**E-commerce API:**

| Endpoint | Method | DB | Lý do |
|----------|--------|-----|-------|
| `GET /products` | GET | Replica | List catalog, stale OK |
| `GET /products/:id` | GET | Replica | Detail, stale OK |
| `POST /orders` | POST | Primary | Write |
| `GET /orders/:id` | GET | Primary* | *Sau checkout user expect thấy order ngay |
| `GET /orders` (history) | GET | Replica | List cũ, lag OK |
| `POST /payment` | POST | Primary | Transaction |
| `GET /admin/report` | GET | Replica analytics | Query nặng, tách replica riêng |
| `PATCH /cart` | PATCH | Primary | Write session |

**Social feed:**

| Endpoint | DB | Lý do |
|----------|-----|-------|
| `GET /feed` | Replica | Scale read, delay vài giây OK |
| `POST /posts` | Primary | Write |
| `GET /posts/:id` ngay sau POST | Primary | Author thấy post của mình ngay |

---

## 8. Nhiều replica — load balance read

```
                    Primary
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    Replica A     Replica B     Replica C
         ▲             ▲             ▲
         └─────── App round-robin / random
```

```typescript
const replicaPools = [replica1Pool, replica2Pool, replica3Pool];

function getReplicaPool(): Pool {
  const i = Math.floor(Math.random() * replicaPools.length);
  return replicaPools[i];
}

// Hoặc: replica riêng cho analytics — tránh report làm chậm API replica
const apiReplicaPool = replica1Pool;
const analyticsReplicaPool = replica2Pool;
```

**Cloud managed:**

| Provider | Cách |
|----------|------|
| **AWS RDS** | Create Read Replica → endpoint riêng mỗi replica |
| **RDS Proxy** | Pool + failover (link [connection-pool.md](./connection-pool.md)) |
| **Cloud SQL** | Read replica với IP/connection name riêng |
| **Supabase** | Read replica (Pro plan) — connection string khác |

---

## 9. Connection pool khi tách read/write

Primary và replica **pool riêng** — không share:

```typescript
// Primary: ít connection hơn (write ít hơn read)
primaryPool.max = 10;

// Replica: nhiều connection hơn (read nhiều)
replicaPool.max = 30;
```

Công thức tổng connection tới DB:

```
primary_connections = instances × primary_pool.max
replica_connections = instances × replica_pool.max × số_replica_app_connect
Tổng ≤ max_connections DB budget
```

> Chi tiết pool: [connection-pool.md](./connection-pool.md)

---

## 10. Lỗi thường gặp

| Lỗi | Hậu quả | Fix |
|-----|---------|-----|
| Ghi vào replica | Error hoặc data loss (replica read-only) | Route write strict → primary |
| Read replica sau POST | User không thấy data mới | Read-your-writes → primary |
| Transaction cross read/write | BEGIN trên primary, SELECT replica → inconsistent | Cả transaction trên **một** DB |
| Report nặng trên replica API | Lag tăng, API read chậm | Replica analytics riêng |
| Không monitor lag | Bug intermittent khó reproduce | Alert ReplicaLag |
| `SELECT FOR UPDATE` trên replica | Sai / fail | Lock phải trên **primary** |
| Migration DDL | Chỉ chạy trên primary | Replica tự apply qua replication |

```typescript
// ❌ Transaction trên primary nhưng read replica giữa chừng
await primary.query('BEGIN');
await primary.query('INSERT INTO orders ...');
const { rows } = await replica.query('SELECT ...'); // stale!
await primary.query('COMMIT');

// ✅ Cùng connection primary trong transaction
const client = await primary.connect();
await client.query('BEGIN');
await client.query('INSERT ...');
await client.query('SELECT ...');
await client.query('COMMIT');
```

---

## 11. So sánh với giải pháp khác

| Giải pháp | Scale | Complexity | Consistency |
|-----------|-------|------------|-------------|
| **Index + query tune** | Vertical | Thấp | Strong |
| **Read replica** | Read horizontal | Trung bình | Eventual (lag) |
| **Cache (Redis)** | Read hot data | Trung bình | TTL / invalidation |
| **Partition** | Bảng lớn | Cao | Strong (1 DB) |
| **Sharding** | Read + Write | Rất cao | Phức tạp |

**Thứ tự thường gặp khi scale:**

```
1. Optimize query + index
2. Connection pool (PgBouncer)
3. Cache Redis (hot read)
4. Read replica (read/write split)     ← file này
5. Partition (bảng quá lớn)
6. Sharding (write bottleneck)
```

---

## Checklist triển khai

```
□ Primary + ít nhất 1 read replica
□ Initial sync: pg_basebackup / RDS Create Read Replica (xem §3)
□ pg_stat_replication state = streaming
□ Env riêng: DB_PRIMARY_HOST, DB_REPLICA_HOST
□ App route: write → primary, read → replica
□ Read-your-writes: sau POST dùng primary hoặc session window
□ Transaction luôn trên primary (cả read trong tx)
□ Pool riêng primary vs replica
□ Monitor replication lag + alert
□ Report nặng → replica analytics riêng
□ Test: POST rồi GET ngay — verify UX
□ Failover plan: replica promote khi primary down (xem replication-ha.md)
```

---

## Tóm tắt

- **Primary** = mọi write; **Replica** = scale read, giảm tải primary
- **Đồng bộ:** WAL/binlog streaming tự động — setup bằng `pg_basebackup` / RDS Create Replica
- Replica **async** → luôn có **lag** → route read sau write về primary khi cần
- App cần **2 pool / 2 connection string** và quy tắc routing rõ ràng
- Monitor **`pg_stat_replication` / ReplicaLag**; rebuild replica khi sync hỏng
- Đây là bước scale **phổ biến nhất** trước khi cần sharding
