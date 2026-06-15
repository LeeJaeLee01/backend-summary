-- 04_partial_index.sql — Chỉ index subset nhỏ (pending orders ~2%)

\echo '=== Full scan tìm pending (ít row nhưng chưa có index hẹp) ==='
EXPLAIN (COSTS OFF)
SELECT id, user_id, created_at
FROM orders
WHERE status = 'pending'
ORDER BY created_at
LIMIT 50;

\echo '=== Partial index: chỉ row pending ==='
CREATE INDEX IF NOT EXISTS idx_orders_pending_created
    ON orders (created_at)
    WHERE status = 'pending';

ANALYZE orders;

EXPLAIN (COSTS OFF)
SELECT id, user_id, created_at
FROM orders
WHERE status = 'pending'
ORDER BY created_at
LIMIT 50;

\echo '--- Partial index: ít row hơn full index trên status, write nhẹ hơn ---'
