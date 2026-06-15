-- 07_pagination.sql — OFFSET lớn vs keyset pagination

\echo '=== OFFSET 50000 — Postgres vẫn đọc + bỏ 50k row ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, amount, created_at
FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
OFFSET 50000
LIMIT 20;

\echo '=== Keyset: WHERE created_at < cursor (hoặc id < cursor) ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, amount, created_at
FROM orders
WHERE user_id = 42
  AND created_at < now() - interval '200 days'
ORDER BY created_at DESC
LIMIT 20;

\echo '--- Keyset + index (user_id, created_at DESC) — ổn định khi page sâu ---'
