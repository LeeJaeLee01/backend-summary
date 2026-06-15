-- 05_covering_index.sql — INCLUDE để index-only scan

\echo '=== Trước covering: lookup user_id + lấy email, name ==='
EXPLAIN (COSTS OFF)
SELECT email, name
FROM users
WHERE id = 500;

DROP INDEX IF EXISTS idx_users_id_covering;
CREATE INDEX idx_users_id_covering ON users (id) INCLUDE (email, name);
ANALYZE users;

\echo '=== Sau INCLUDE — có thể Index Only Scan (không đọc heap) ==='
EXPLAIN (COSTS OFF)
SELECT email, name
FROM users
WHERE id = 500;

\echo '--- Covering index hữu ích khi SELECT chỉ cần cột đã INCLUDE ---'
