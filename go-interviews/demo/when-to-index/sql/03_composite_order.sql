-- 03_composite_order.sql — Thứ tự cột trong composite index

DROP INDEX IF EXISTS idx_orders_user_created;
DROP INDEX IF EXISTS idx_orders_created_user;

\echo '=== Query: user_id = ? AND created_at > ? ==='
EXPLAIN (COSTS OFF)
SELECT id, amount
FROM orders
WHERE user_id = 100
  AND created_at > now() - interval '30 days';

\echo '=== ĐÚNG: (user_id, created_at) — equality trước range ==='
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at);
ANALYZE orders;

EXPLAIN (COSTS OFF)
SELECT id, amount
FROM orders
WHERE user_id = 100
  AND created_at > now() - interval '30 days';

\echo '=== SAI thứ tự cho query chỉ user_id: (created_at, user_id) ==='
CREATE INDEX idx_orders_created_user ON orders (created_at, user_id);
ANALYZE orders;

EXPLAIN (COSTS OFF)
SELECT id, amount
FROM orders
WHERE user_id = 100;

\echo '--- idx_orders_created_user KHÔNG tối ưu WHERE chỉ user_id (leftmost prefix) ---'
