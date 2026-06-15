-- 03_partition_setup.sql — Partition RANGE theo event_date (chia table vật lý)

DROP TABLE IF EXISTS events CASCADE;

CREATE TABLE events (
    id          BIGSERIAL,
    user_id     INT NOT NULL,
    event_type  TEXT NOT NULL,
    event_date  DATE NOT NULL,
    payload     JSONB DEFAULT '{}',
    PRIMARY KEY (id, event_date)  -- PK phải gồm partition key (Postgres)
) PARTITION BY RANGE (event_date);

-- Partition theo tháng (3 tháng gần đây + default)
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE events_2024_02 PARTITION OF events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE events_2024_03 PARTITION OF events
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE events_default PARTITION OF events DEFAULT;

-- Copy data từ events_plain (map date vào partition tương ứng hoặc default)
INSERT INTO events (user_id, event_type, event_date, payload)
SELECT user_id, event_type, event_date, payload
FROM events_plain;

ANALYZE events;

\echo '--- Partitioned table events: chia theo event_date ---'
SELECT
    parent.relname AS parent,
    child.relname AS partition,
    pg_size_pretty(pg_relation_size(child.oid)) AS size
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'events'
ORDER BY child.relname;
