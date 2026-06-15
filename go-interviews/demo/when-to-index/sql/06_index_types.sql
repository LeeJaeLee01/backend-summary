-- 06_index_types.sql — Kiểu dữ liệu → loại index

\echo '=== JSONB: GIN cho containment @> ==='
EXPLAIN (COSTS OFF)
SELECT id FROM events
WHERE payload @> '{"type": "click"}';

CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON events USING GIN (payload jsonb_path_ops);
ANALYZE events;

EXPLAIN (COSTS OFF)
SELECT id FROM events
WHERE payload @> '{"type": "click"}';

\echo '=== TEXT case-insensitive: expression index lower(email) ==='
EXPLAIN (COSTS OFF)
SELECT id FROM users WHERE lower(email) = 'user500@example.com';

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));
ANALYZE users;

EXPLAIN (COSTS OFF)
SELECT id FROM users WHERE lower(email) = 'user500@example.com';

\echo '--- Chọn index theo kiểu dữ liệu và operator trong WHERE ---'
