#!/usr/bin/env bash
# load-test.sh — Genera tráfico simulado para ver las métricas en Grafana
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
DURATION="${2:-60}"
RPS="${3:-10}"

echo "Generando tráfico en ${BASE_URL} durante ${DURATION}s a ~${RPS} req/s"
echo "Abre Grafana en http://localhost:3001 para ver las métricas en tiempo real."
echo ""
echo "Ctrl+C para detener."
echo ""

ENDPOINTS=(
  "GET /"
  "GET /health"
  "GET /api/products"
  "GET /api/products/1"
  "GET /api/products/2"
  "GET /api/products/9999"
  "POST /api/products"
)

end=$((SECONDS + DURATION))
count=0

while [ $SECONDS -lt $end ]; do
  # Rotar endpoints
  idx=$((count % ${#ENDPOINTS[@]}))
  entry="${ENDPOINTS[$idx]}"
  METHOD="${entry%% *}"
  ROUTE="${entry#* }"

  if [ "$METHOD" = "POST" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Test Product ${count}\",\"price\":${RANDOM}}" \
      "${BASE_URL}${ROUTE}")
  else
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${ROUTE}")
  fi

  printf "[%s] %s %s -> %s\n" "$(date +%H:%M:%S)" "$METHOD" "$ROUTE" "$STATUS"

  count=$((count + 1))
  sleep "$(awk "BEGIN{printf \"%.3f\", 1/$RPS}")"
done

echo ""
echo "Test completado. Requests enviados: ${count}"
