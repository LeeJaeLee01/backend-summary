-- 05_index_on_partition.sql — Kết hợp partition + index (pattern production)

\echo '=== Index trên parent → Postgres tạo index trên từng partition ==='
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events (user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events (user_id, event_date);

ANALYZE events;

\echo '=== Query có CẢ partition key + cột index → pruning + index scan ==='
EXPLAIN (COSTS OFF)
SELECT id, event_type
FROM events
WHERE event_date >= '2024-02-01'
  AND event_date < '2024-03-01'
  AND user_id = 42;

\echo '=== Chỉ user_id (có index nhưng KHÔNG pruning) ==='
EXPLAIN (COSTS OFF)
SELECT id, event_type
FROM events
WHERE user_id = 42
LIMIT 20;

\echo '--- Kết luận demo: partition (theo date) + index (theo user_id) bổ sung nhau ---'
