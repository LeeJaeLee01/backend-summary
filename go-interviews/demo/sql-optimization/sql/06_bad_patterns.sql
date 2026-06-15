-- 06_bad_patterns.sql — pattern khiến index không dùng được

\echo '=== Function bọc cột — index trên email không dùng ==='
EXPLAIN (COSTS OFF)
SELECT id, email FROM users WHERE lower(email) = 'user42@example.com';

CREATE INDEX idx_users_email ON users (email);
ANALYZE users;

\echo '=== Vẫn Seq Scan sau khi có index trên email thường ==='
EXPLAIN (COSTS OFF)
SELECT id, email FROM users WHERE lower(email) = 'user42@example.com';

\echo '=== Fix: expression index ==='
CREATE INDEX idx_users_email_lower ON users (lower(email));
ANALYZE users;

EXPLAIN (COSTS OFF)
SELECT id, email FROM users WHERE lower(email) = 'user42@example.com';

\echo '=== LIKE với wildcard đầu — B-tree không giúp ==='
EXPLAIN (COSTS OFF)
SELECT id, email FROM users WHERE email LIKE '%42@example.com';

\echo '--- Cần pg_trgm / full-text / search engine cho pattern này ---'
