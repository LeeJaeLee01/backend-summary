#!/usr/bin/env bash
# Export MongoDB ssa_c03 to backup/ssa_c03-YYYYMMDD.archive.gz
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$DIR/backup"
CONTAINER="${MONGO_CONTAINER:-ssa-c03-mongo}"
STAMP=$(date +%Y%m%d-%H%M)
OUT="$BACKUP_DIR/ssa_c03-${STAMP}.archive.gz"

mkdir -p "$BACKUP_DIR"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Start MongoDB: cd ssa-c03 && docker compose up -d mongodb"
  exit 1
fi

docker exec "$CONTAINER" mongodump --db=ssa_c03 --archive=/tmp/ssa_c03.archive --gzip
docker cp "${CONTAINER}:/tmp/ssa_c03.archive" "$OUT"
docker exec "$CONTAINER" rm -f /tmp/ssa_c03.archive

# Symlink latest
ln -sf "$(basename "$OUT")" "$BACKUP_DIR/ssa_c03-latest.archive.gz"

echo "Backup saved: $OUT"
ls -lh "$OUT"

docker exec "$CONTAINER" mongosh ssa_c03 --quiet --eval '
  print("questions:", db.questions.countDocuments());
  print("withAnswer:", db.questions.countDocuments({ correctAnswers: { $exists: true, $not: { $size: 0 } } }));
'
