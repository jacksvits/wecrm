#!/bin/bash
set -e

echo "=========================================="
echo "  WeCRM 502 Fix — Полное восстановление"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR=""
for dir in ~/wecrm /home/crm/wecrm /var/www/wecrm /opt/wecrm /wecrm .; do
  if [ -f "$dir/docker-compose.yml" ] || [ -f "$dir/docker-compose.yaml" ]; then
    PROJECT_DIR="$(cd "$dir" && pwd)"
    break
  fi
done

if [ -z "$PROJECT_DIR" ]; then
  echo -e "${RED}ERROR: Не найдена директория с docker-compose.yml${NC}"
  exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}Проект: $PROJECT_DIR${NC}"

# 1. Docker check
echo ""
echo "[1/10] Проверка Docker..."
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Docker не установлен${NC}"
  exit 1
fi
echo -e "${GREEN}Docker OK${NC}"

# 2. Stop and REMOVE volumes (CRITICAL: -v flag!)
echo ""
echo "[2/10] Остановка контейнеров и УДАЛЕНИЕ volumes (-v)..."
docker compose down -v --remove-orphans 2>/dev/null || true

# 3. Force remove volumes if still exist
echo ""
echo "[3/10] Принудительное удаление volumes..."
docker volume rm wecrm_pgdata wecrm_uploads 2>/dev/null || true
docker volume rm pgdata uploads 2>/dev/null || true
docker volume ls -q | grep -E "(wecrm|pgdata|uploads)" | xargs -r docker volume rm 2>/dev/null || true
echo -e "${GREEN}Volumes удалены${NC}"

# 4. Remove old images
echo ""
echo "[4/10] Удаление старых образов..."
docker rmi wecrm-backend wecrm-frontend 2>/dev/null || true

# 5. Remove old .dockerignore
echo ""
echo "[5/10] Удаление старых .dockerignore..."
rm -f backend/.dockerignore frontend/.dockerignore 2>/dev/null || true

# 6. Clean node_modules
echo ""
echo "[6/10] Очистка node_modules..."
if [ -d "backend/node_modules" ]; then
  docker run --rm -v "$PROJECT_DIR/backend:/target" alpine rm -rf /target/node_modules 2>/dev/null || true
fi
echo -e "${GREEN}Очистка завершена${NC}"

# 7. Verify volumes are gone
echo ""
echo "[7/10] Проверка: volumes удалены?"
if docker volume ls | grep -q "pgdata\|uploads"; then
  echo -e "${RED}WARNING: volumes еще существуют!${NC}"
  docker volume ls | grep -E "pgdata|uploads"
else
  echo -e "${GREEN}Все volumes удалены — чистый старт!${NC}"
fi

# 8. Build
echo ""
echo "[8/10] Пересборка контейнеров БЕЗ КЭША (3-5 минут)..."
docker compose build --no-cache

# 9. Start
echo ""
echo "[9/10] Запуск..."
docker compose up -d

# 10. Show logs
echo ""
echo "[10/10] Просмотр логов backend (60 сек)..."
echo "=========================================="
timeout 60 docker compose logs -f backend || true

echo ""
echo "=========================================="
echo "=== Контейнеры ==="
docker compose ps

echo ""
echo "=== API Check ==="
if docker compose exec -T backend wget -qO- http://localhost:4000/api/health 2>/dev/null; then
  echo -e "${GREEN}"
  echo "SUCCESS! API работает!"
  echo -e "${NC}"
else
  echo -e "${RED}"
  echo "ERROR: API не отвечает. Проверьте логи:"
  echo "  docker compose logs --tail=50 backend"
  echo -e "${NC}"
fi

echo ""
echo "Откройте: https://welans.cc"
echo "Жесткая перезагрузка: Ctrl + Shift + R"
