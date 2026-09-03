#!/bin/bash
set -e

echo "=== WeCRM Auto Deploy ==="

# Detect project directory
PROJECT_DIR=""
for dir in /var/www/wecrm /opt/wecrm ~/wecrm /home/crm/wecrm; do
  if [ -d "$dir/.git" ]; then
    PROJECT_DIR="$dir"
    break
  fi
done

if [ -z "$PROJECT_DIR" ]; then
  echo "ERROR: Could not find wecrm project directory"
  exit 1
fi

cd "$PROJECT_DIR"
echo "Project directory: $PROJECT_DIR"

# 1. Update code
echo "Pulling latest code..."
git reset --hard origin/HEAD
git pull origin master

# 2. Clean host node_modules to prevent container conflicts
echo "Cleaning host node_modules to prevent Docker volume conflicts..."
rm -rf backend/node_modules frontend/node_modules

# 3. Stop and rebuild containers
echo "Stopping containers..."
docker compose down

echo "Building and starting containers..."
docker compose up -d --build --force-recreate

# 4. Wait for backend healthcheck
echo "Waiting for backend to become healthy..."
for i in {1..30}; do
  if docker compose ps backend | grep -q "healthy"; then
    echo "Backend is healthy!"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 2
done

# 5. Show status
echo ""
echo "=== Container Status ==="
docker compose ps

echo ""
echo "=== Recent Backend Logs ==="
docker compose logs --tail=20 backend

echo ""
echo "=== Deploy complete! ==="
echo "Open https://welans.cc in browser"
echo "Hard refresh: Ctrl + Shift + R"
