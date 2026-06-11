-- Replication user + slot for read replica demo
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator';
SELECT pg_create_physical_replication_slot('replica_slot');

-- App schema
CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL,
  total       NUMERIC(12, 2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

INSERT INTO orders (user_id, total, status, note)
VALUES
  (1, 99.00, 'paid', 'seed-primary'),
  (2, 150.50, 'pending', 'seed-primary');
