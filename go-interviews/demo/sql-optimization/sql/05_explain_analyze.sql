-- 05_explain_analyze.sql — Bước 3 & 7: đo thời gian thật + buffers

\echo '=== EXPLAIN ANALYZE — actual time, actual rows, cache hit/read ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, amount, created_at
FROM orders
WHERE user_id = 42
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

\echo '=== So sánh: user_id không có order pending — actual rows = 0 ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, amount, created_at
FROM orders
WHERE user_id = 99999
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

\echo '--- Query tối ưu: Execution Time thấp, Index Scan, shared hit cao (warm) ---'
