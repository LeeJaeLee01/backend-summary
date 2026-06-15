-- 02_index_before_after.sql — Index giúp tìm row nhanh trong CÙNG một table

\echo '=== BEFORE index: filter user_id (expect Seq Scan) ==='
EXPLAIN (COSTS OFF)
SELECT id, event_type, event_date
FROM events_plain
WHERE user_id = 42;

\echo '=== BEFORE index: filter user_id + date range ==='
EXPLAIN (COSTS OFF)
SELECT id, event_type
FROM events_plain
WHERE user_id = 42
  AND event_date >= CURRENT_DATE - 7;

-- B-tree index cho lookup theo user
CREATE INDEX IF NOT EXISTS idx_events_plain_user_id ON events_plain (user_id);
CREATE INDEX IF NOT EXISTS idx_events_plain_user_date ON events_plain (user_id, event_date);

ANALYZE events_plain;

\echo '=== AFTER index: filter user_id (expect Index Scan) ==='
EXPLAIN (COSTS OFF)
SELECT id, event_type, event_date
FROM events_plain
WHERE user_id = 42;

\echo '=== AFTER index: user_id + date (expect Index Scan / Bitmap) ==='
EXPLAIN (COSTS OFF)
SELECT id, event_type
FROM events_plain
WHERE user_id = 42
  AND event_date >= CURRENT_DATE - 7;

\echo '--- Index KHÔNG chia table — vẫn 1 table, thêm cấu trúc phụ ---'
