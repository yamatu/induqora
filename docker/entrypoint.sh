#!/bin/sh
set -e

if [ -z "$AUTH_SECRET" ] || [ ${#AUTH_SECRET} -lt 32 ]; then
  echo "ERROR: AUTH_SECRET must be set to at least 32 characters (see .env.production.example)." >&2
  exit 1
fi

DB_FILE="${DATABASE_URL#file:}"
mkdir -p "$(dirname "$DB_FILE")" "$UPLOAD_DIR"

FIRST_RUN=false
[ -f "$DB_FILE" ] || FIRST_RUN=true

echo "[induqora] Syncing database schema..."
prisma db push --skip-generate --schema ./prisma/schema.prisma

if [ "$FIRST_RUN" = "true" ] && [ "${SEED_ON_FIRST_RUN:-true}" = "true" ]; then
  echo "[induqora] New database — seeding categories, authors, sample articles and admin user..."
  node ./prisma/seed.mjs
fi

node ./docker/warmup.mjs &

echo "[induqora] Starting server on port ${PORT}"
exec node server.js
