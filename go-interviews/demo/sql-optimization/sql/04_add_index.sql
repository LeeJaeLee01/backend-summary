-- 04_add_index.sql — Bước 5: thêm index, verify plan

\echo '=== BEFORE index ==='
EXPLAIN (COSTS OFF)
SELECT id, amount, created_at
FROM orders
WHERE user_id = 42
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

CREATE INDEX idx_orders_user_status_created
ON orders (user_id, status, created_at DESC);

ANALYZE orders;

\echo '=== AFTER index — kỳ vọng Index Scan, bỏ Sort ==='
EXPLAIN (COSTS OFF)
SELECT id, amount, created_at
FROM orders
WHERE user_id = 42
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

\echo '--- Partial index thay thế nếu pending << completed (xem when-to-index demo) ---'
