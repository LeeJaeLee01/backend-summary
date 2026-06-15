-- 01_setup.sql
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS events CASCADE;

CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    email      TEXT NOT NULL,
    name       TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id),
    status     TEXT NOT NULL DEFAULT 'completed',
    amount     NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
    id         BIGSERIAL PRIMARY KEY,
    user_id    INT NOT NULL,
    event_type TEXT NOT NULL,
    payload    JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10k users
INSERT INTO users (email, name, is_active)
SELECT
    'user' || g || '@example.com',
    'User ' || g,
    (random() > 0.05)  -- ~95% active
FROM generate_series(1, 10000) g;

-- 200k orders: ~98% completed, 2% pending
INSERT INTO orders (user_id, status, amount, created_at)
SELECT
    (random() * 9999 + 1)::BIGINT,
    CASE WHEN random() < 0.02 THEN 'pending' ELSE 'completed' END,
    (random() * 500 + 10)::NUMERIC(12, 2),
    now() - (random() * interval '365 days')
FROM generate_series(1, 200000);

INSERT INTO events (user_id, event_type, payload, created_at)
SELECT
    (random() * 9999 + 1)::INT,
    (ARRAY['click', 'view', 'purchase'])[1 + (random() * 2)::INT],
    jsonb_build_object('type', 'click', 'page', '/p/' || (random() * 100)::INT),
    now() - (random() * interval '90 days')
FROM generate_series(1, 50000);

ANALYZE users;
ANALYZE orders;
ANALYZE events;

\echo '--- setup: 10k users, 200k orders, 50k events ---'
