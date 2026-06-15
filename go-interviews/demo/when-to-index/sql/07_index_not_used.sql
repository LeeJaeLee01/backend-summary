-- 07_index_not_used.sql — Khi index KHÔNG được dùng (anti-pattern)

\echo '=== Có index user_id nhưng bọc function → Seq Scan ==='
EXPLAIN (COSTS OFF)
SELECT id FROM orders WHERE user_id::TEXT = '42';

\echo '=== OR nhiều giá trị low-selectivity — planner có thể Seq Scan ==='
EXPLAIN (COSTS OFF)
SELECT id FROM orders WHERE status = 'pending' OR status = 'completed' LIMIT 100;

\echo '=== LIKE prefix OK; LIKE %%middle%% không dùng B-tree thường ==='
EXPLAIN (COSTS OFF)
SELECT id FROM users WHERE email LIKE 'user5%@example.com';

EXPLAIN (COSTS OFF)
SELECT id FROM users WHERE email LIKE '%user500%';

\echo '--- Fix: khớp expression index, partial index, full-text/trigram cho LIKE %%...%% ---'

\echo '=== Kiểm tra index không dùng (sau chạy production một thời gian) ==='
SELECT
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
