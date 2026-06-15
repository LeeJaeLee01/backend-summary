-- 04_partition_pruning.sql — Partition pruning: chỉ scan partition liên quan

\echo '=== CÓ partition key trong WHERE → pruning (ít partition scan) ==='
EXPLAIN (COSTS OFF)
SELECT count(*)
FROM events
WHERE event_date >= '2024-03-01'
  AND event_date < '2024-04-01';

\echo '=== KHÔNG có partition key → scan MỌI partition (chậm hơn khi nhiều partition) ==='
EXPLAIN (COSTS OFF)
SELECT count(*)
FROM events
WHERE user_id = 42;

\echo '=== Purge data cũ: DROP partition thay vì DELETE hàng loạt ==='
-- Ví dụ (không chạy thật để giữ demo):
-- DROP TABLE events_2024_01;  -- xóa cả chunk instant, không bloat

\echo '--- Partition giảm phạm vi TABLE scan; không thay thế index cho filter user_id ---'
