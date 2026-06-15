-- 01_setup.sql — bảng không partition, seed data để so sánh index
DROP TABLE IF EXISTS events_plain CASCADE;

CREATE TABLE events_plain (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INT NOT NULL,
    event_type  TEXT NOT NULL,
    event_date  DATE NOT NULL,
    payload     JSONB DEFAULT '{}'
);

-- ~100k rows: user 1..1000, ngày trong 120 ngày gần đây
INSERT INTO events_plain (user_id, event_type, event_date, payload)
SELECT
    (random() * 999 + 1)::INT,
    (ARRAY['click', 'view', 'purchase', 'login'])[1 + (random() * 3)::INT],
    CURRENT_DATE - ((random() * 119)::INT),
    jsonb_build_object('seq', g)
FROM generate_series(1, 100000) AS g;

ANALYZE events_plain;

\echo '--- events_plain ready: 100k rows ---'
