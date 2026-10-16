#!/bin/sh
# Nightly backups: one dump for the platform schema and one per tenant schema,
# so a single school can be restored or exported without touching the others.
set -eu
STAMP=$(date +%Y%m%d-%H%M)
DIR="/backups/$STAMP"
mkdir -p "$DIR"
for SCHEMA in $(psql -At -c "SELECT nspname FROM pg_namespace WHERE nspname = 'platform' OR nspname LIKE 't\_%' ORDER BY 1"); do
  pg_dump --schema="$SCHEMA" --format=custom --file="$DIR/$SCHEMA.dump"
done
find /backups -mindepth 1 -maxdepth 1 -type d -mtime +"${RETENTION_DAYS:-14}" -exec rm -rf {} +
echo "backup $STAMP done"
