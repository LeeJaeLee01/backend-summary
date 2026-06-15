#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgres://demo:demo@localhost:5435/sql_optimization_demo}"
DIR="$(cd "$(dirname "$0")" && pwd)"

for f in "$DIR"/sql/*.sql; do
  echo "=== $(basename "$f") ==="
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  echo
done

echo "Done."
