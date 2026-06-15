-- 02_cardinality.sql — High cardinality (user_id) vs low (is_active)

\echo '=== HIGH cardinality: filter user_id (nên index) ==='
EXPLAIN (COSTS OFF)
SELECT id, status, amount
FROM orders
WHERE user_id = 42;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
ANALYZE orders;

\echo '=== AFTER idx_orders_user_id ==='
EXPLAIN (COSTS OFF)
SELECT id, status, amount
FROM orders
WHERE user_id = 42;

\echo '=== LOW cardinality: filter is_active=true (~95% rows) — index thường KHÔNG đáng ==='
EXPLAIN (COSTS OFF)
SELECT id, email FROM users WHERE is_active = true LIMIT 100;

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);
ANALYZE users;

\echo '=== Sau index is_active — planner có thể vẫn Seq Scan (gần full table) ==='
EXPLAIN (COSTS OFF)
SELECT id, email FROM users WHERE is_active = true LIMIT 100;

\echo '--- Kết luận: ưu tiên index cột phân biệt được nhiều row (user_id, email) ---'
