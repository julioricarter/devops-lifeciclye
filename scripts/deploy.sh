#!/usr/bin/env bash
# deploy.sh — Simula un deploy con zero-downtime usando rolling update
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

VERSION="${1:-}"
ENVIRONMENT="${2:-staging}"

if [ -z "$VERSION" ]; then
  echo "Uso: $0 <version> [environment]"
  echo "Ejemplo: $0 1.2.3 staging"
  exit 1
fi

echo ""
echo "=============================================="
echo "   Deploy: v${VERSION} → ${ENVIRONMENT}"
echo "=============================================="
echo ""

info "Validando entorno: ${ENVIRONMENT}"
[[ "$ENVIRONMENT" =~ ^(staging|production)$ ]] || error "Entorno inválido: $ENVIRONMENT"

info "Ejecutando tests antes del deploy..."
cd "$(dirname "$0")/../app"
npm test
success "Tests: PASSED"

info "Construyendo imagen v${VERSION}..."
cd ..
docker build -t "devops-demo-api:${VERSION}" ./app --target production
success "Imagen construida: devops-demo-api:${VERSION}"

info "Simulando rolling update (local con docker-compose)..."
APP_VERSION="$VERSION" docker-compose up -d --no-deps api

info "Verificando salud del nuevo deploy..."
MAX_WAIT=30
elapsed=0
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  if [ $elapsed -ge $MAX_WAIT ]; then
    error "Health check falló. Ejecutando rollback..."
    bash "$(dirname "$0")/rollback.sh"
    exit 1
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done

# Verificar version
DEPLOYED_VERSION=$(curl -s http://localhost:3000 | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])" 2>/dev/null || echo "unknown")

echo ""
success "Deploy exitoso!"
echo ""
echo "  Version desplegada : ${DEPLOYED_VERSION}"
echo "  Entorno            : ${ENVIRONMENT}"
echo "  Timestamp          : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""
