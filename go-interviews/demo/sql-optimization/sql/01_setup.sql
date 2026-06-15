-- 01_setup.sql
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    email      TEXT NOT NULL,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id),
    status     TEXT NOT NULL DEFAULT 'completed',
    amount     NUMERIC(12, 2) NOT NULL,
    note       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO users (email, name)
SELECT
    'user' || g || '@example.com',
    'User ' || g
FROM generate_series(1, 10000) g;

INSERT INTO orders (user_id, status, amount, note, created_at)
SELECT
    (random() * 9999 + 1)::BIGINT,
    CASE WHEN random() < 0.03 THEN 'pending' ELSE 'completed' END,
    (random() * 500 + 10)::NUMERIC(12, 2),
    'note-' || g,
    now() - (random() * interval '365 days')
FROM generate_series(1, 200000) g;

ANALYZE users;
ANALYZE orders;

\echo '--- setup: 10k users, 200k orders ---'
