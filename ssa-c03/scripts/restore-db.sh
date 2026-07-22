#!/usr/bin/env bash
# Restore ssa_c03 MongoDB from backup archive
set -euo pipefail

ARCHIVE="${1:-backup/ssa_c03-*.archive.gz}"
CONTAINER="${MONGO_CONTAINER:-ssa-c03-mongo}"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "MongoDB container '${CONTAINER}' not running."
  echo "Start first: docker compose up -d mongodb"
  exit 1
fi

# Resolve latest archive if glob
if [[ "$ARCHIVE" == *"*"* ]]; then
  ARCHIVE=$(ls -t $ARCHIVE 2>/dev/null | head -1)
fi

if [[ ! -f "$ARCHIVE" ]]; then
  echo "Archive not found: $ARCHIVE"
  exit 1
fi

echo "Restoring from: $ARCHIVE"
docker cp "$ARCHIVE" "${CONTAINER}:/tmp/restore.archive.gz"
docker exec "$CONTAINER" mongorestore --drop --gzip --archive=/tmp/restore.archive.gz
docker exec "$CONTAINER" rm -f /tmp/restore.archive.gz

echo "Done. Verify:"
docker exec "$CONTAINER" mongosh ssa_c03 --quiet --eval '
  print("questions:", db.questions.countDocuments());
  print("withAnswer:", db.questions.countDocuments({ correctAnswers: { $exists: true, $not: { $size: 0 } } }));
'
