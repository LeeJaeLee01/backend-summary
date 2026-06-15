-- 02_baseline_explain.sql — Bước 1–3: EXPLAIN trước tối ưu

\echo '=== Query: pending orders của user 42, mới nhất (chưa có index) ==='
EXPLAIN (COSTS OFF)
SELECT id, amount, created_at
FROM orders
WHERE user_id = 42
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

\echo '=== Kỳ vọng: Seq Scan + Filter + Sort — đọc gần hết bảng orders ==='
