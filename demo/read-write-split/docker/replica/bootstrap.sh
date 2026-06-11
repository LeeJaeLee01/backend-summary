#!/bin/bash
set -euo pipefail

PRIMARY_HOST="${PRIMARY_HOST:-postgres-primary}"
PRIMARY_PORT="${PRIMARY_PORT:-5432}"
REPLICATOR_USER="${REPLICATOR_USER:-replicator}"
REPLICATOR_PASSWORD="${REPLICATOR_PASSWORD:-replicator}"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"

echo "Waiting for primary at ${PRIMARY_HOST}:${PRIMARY_PORT}..."
until pg_isready -h "$PRIMARY_HOST" -p "$PRIMARY_PORT" -U postgres; do
  sleep 2
done

if [ ! -f "${PGDATA}/PG_VERSION" ]; then
  echo "Running pg_basebackup from primary..."
  rm -rf "${PGDATA:?}"/*
  PGPASSWORD="$REPLICATOR_PASSWORD" pg_basebackup \
    -h "$PRIMARY_HOST" \
    -p "$PRIMARY_PORT" \
    -U "$REPLICATOR_USER" \
    -D "$PGDATA" \
    -Fp -Xs -P -R

  cat >> "${PGDATA}/postgresql.auto.conf" <<EOF
primary_slot_name = 'replica_slot'
hot_standby = on
EOF

  touch "${PGDATA}/standby.signal"
  echo "Base backup complete — replica ready to stream WAL."
fi

exec docker-entrypoint.sh postgres \
  -c hot_standby=on \
  -c max_connections=100
