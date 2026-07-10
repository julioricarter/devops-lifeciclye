#!/usr/bin/env bash
# setup.sh — Inicializa el entorno local de desarrollo DevOps completo
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warning() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

check_dependency() {
  command -v "$1" &>/dev/null || error "$1 no está instalado. Por favor instálalo antes de continuar."
}

echo ""
echo "=============================================="
echo "   DevOps Lifecycle — Setup del Entorno Local"
echo "=============================================="
echo ""

info "Verificando dependencias..."
check_dependency docker
check_dependency git
check_dependency node
check_dependency npm

# Docker Desktop moderno trae el plugin "docker compose" (v2, sin guion);
# instalaciones más viejas usan el binario standalone "docker-compose".
if command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
elif docker compose version &>/dev/null; then
  COMPOSE="docker compose"
else
  error "Ni 'docker-compose' ni el plugin 'docker compose' están disponibles. Instala Docker Desktop."
fi
success "Todas las dependencias están disponibles (usando: ${COMPOSE})"

info "Instalando dependencias de la aplicación..."
cd "$(dirname "$0")/../app"
npm ci
success "Dependencias npm instaladas"

info "Ejecutando tests unitarios..."
npm run test:unit
success "Tests unitarios: PASSED"

info "Ejecutando tests de integración..."
npm run test:integration
success "Tests de integración: PASSED"

info "Verificando trazabilidad de historias de usuario..."
cd ..
node scripts/verify-traceability.js
success "Trazabilidad: OK (docs/user-stories/ ↔ ciclo DevOps)"
cd app

info "Construyendo imagen Docker..."
cd ..
docker build -t devops-demo-api:local ./app --target production
success "Imagen Docker construida: devops-demo-api:local"

info "Levantando stack completo (API + Prometheus + Grafana + AlertManager)..."
$COMPOSE up -d
success "Stack levantado"

info "Esperando que los servicios estén saludables..."
MAX_WAIT=60
elapsed=0
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  if [ $elapsed -ge $MAX_WAIT ]; then
    error "Timeout: la API no respondió en ${MAX_WAIT}s"
  fi
  sleep 3
  elapsed=$((elapsed + 3))
done

echo ""
echo "=============================================="
echo -e "${GREEN}   Entorno DevOps listo!${NC}"
echo "=============================================="
echo ""
echo "  Servicio         URL"
echo "  ────────────     ──────────────────────────"
echo "  API              http://localhost:3000"
echo "  API /metrics     http://localhost:3000/metrics"
echo "  API /health      http://localhost:3000/health"
echo "  Prometheus       http://localhost:9090"
echo "  Grafana          http://localhost:3001  (admin/devops123)"
echo "  AlertManager     http://localhost:9093"
echo ""
echo "  Para detener todo: ${COMPOSE} down"
echo ""
