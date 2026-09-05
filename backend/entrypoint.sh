#!/bin/sh
set -e

echo "[Entrypoint] Generating Prisma Client..."
npx prisma generate

echo "[Entrypoint] Starting server on port 4000..."
exec npx tsx src/index.ts
