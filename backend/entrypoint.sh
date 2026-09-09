#!/bin/sh
set -e

echo "[Entrypoint] Clearing Prisma Client cache..."
rm -rf node_modules/.prisma/client

echo "[Entrypoint] Applying database migrations..."
npx prisma migrate deploy

echo "[Entrypoint] Generating Prisma Client..."
npx prisma generate

echo "[Entrypoint] Starting server on port 4000..."
exec npx tsx src/index.ts
