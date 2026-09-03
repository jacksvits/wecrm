#!/bin/sh
set -e

echo "[Entrypoint] Clearing tsx cache..."
rm -rf /tmp/tsx-0 /root/.cache/tsx /root/.cache/esbuild /tmp/esbuild*

echo "[Entrypoint] Generating Prisma Client..."
npx prisma generate

echo "[Entrypoint] Starting server on port 4000..."
exec npx tsx --no-cache src/index.ts
