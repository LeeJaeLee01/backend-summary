-- 03_rewrite_query.sql — Bước 4: rewrite query

\echo '=== Anti-pattern: SELECT * — đọc thêm cột note không cần ==='
EXPLAIN (COSTS OFF)
SELECT *
FROM orders
WHERE user_id = 42 AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

\echo '=== Tốt hơn: chỉ cột cần thiết ==='
EXPLAIN (COSTS OFF)
SELECT id, amount, created_at
FROM orders
WHERE user_id = 42 AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

\echo '=== Anti-pattern: correlated subquery (N lần lookup users) ==='
EXPLAIN (COSTS OFF)
SELECT o.id, o.amount,
       (SELECT u.name FROM users u WHERE u.id = o.user_id) AS user_name
FROM orders o
WHERE o.user_id = 42 AND o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 20;

\echo '=== Rewrite: JOIN một lần ==='
EXPLAIN (COSTS OFF)
SELECT o.id, o.amount, u.name AS user_name
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.user_id = 42 AND o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 20;

\echo '--- Rewrite giúp planner; index vẫn cần ở bước sau ---'
