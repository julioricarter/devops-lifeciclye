#!/usr/bin/env bash
# rollback.sh — Revierte al contenedor anterior en caso de fallo
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warning() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

if command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  COMPOSE="docker compose"
fi

echo ""
echo "=============================================="
echo -e "   ${RED}ROLLBACK EN PROGRESO${NC}"
echo "=============================================="
echo ""

PREVIOUS_TAG=$(docker images devops-demo-api --format "{{.Tag}}" | grep -v latest | sort -V | tail -n 2 | head -n 1 || echo "")

if [ -z "$PREVIOUS_TAG" ]; then
  error "No se encontró imagen anterior para hacer rollback."
  exit 1
fi

info "Imagen anterior encontrada: devops-demo-api:${PREVIOUS_TAG}"
info "Haciendo rollback a: devops-demo-api:${PREVIOUS_TAG}..."

APP_VERSION="$PREVIOUS_TAG" $COMPOSE up -d --no-deps api

MAX_WAIT=30
elapsed=0
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  if [ $elapsed -ge $MAX_WAIT ]; then
    error "Rollback también falló. Intervención manual requerida."
    exit 1
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done

echo ""
success "Rollback exitoso a v${PREVIOUS_TAG}"
warning "Investiga el fallo antes de intentar un nuevo deploy."
echo ""
