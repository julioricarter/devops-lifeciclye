---
id: HU-08
title: Exponer métricas de la aplicación para monitoreo
status: done
persona: Ingeniero de observabilidad (SRE)
i_want: que la aplicación exponga sus métricas en formato Prometheus
so_that: pueda construir dashboards y alertas basadas en tráfico, errores y latencia reales
acceptance:
  - GET /metrics responde 200 en formato texto Prometheus
  - Incluye la métrica http_requests_total con labels method, route y status_code
  - Incluye la métrica http_request_duration_seconds como histograma
plan:
  - docs/architecture.md
code:
  - app/src/index.js
build:
  - app/Dockerfile
test:
  - app/tests/integration/health.test.js
release:
  - .github/workflows/release.yml
deploy:
  - kubernetes/base/deployment.yaml
operate:
  - scripts/load-test.sh
monitor:
  - monitoring/prometheus/prometheus.yml
  - monitoring/grafana/dashboards/api_dashboard.json
  - monitoring/alertmanager/alertmanager.yml
---

## Historia

Como **ingeniero de observabilidad**, quiero que **la API exponga métricas en
formato Prometheus** para **poder graficar tráfico, tasa de error y latencia,
y disparar alertas automáticas sin instrumentación externa**.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | El pilar "Monitor" del ciclo depende de este endpoint |
| Code | `app/src/index.js` | Middleware que registra `http_requests_total` e `http_request_duration_seconds` |
| Build | `app/Dockerfile` | La imagen expone el puerto 3000 donde vive `/metrics` |
| Test | `app/tests/integration/health.test.js` | Verifica presencia de ambas métricas (tag `HU-08`) |
| Release | `.github/workflows/release.yml` | El contrato de métricas queda congelado por versión |
| Deploy | `kubernetes/base/deployment.yaml` | Anotaciones `prometheus.io/scrape=true`, `port=3000`, `path=/metrics` |
| Operate | `scripts/load-test.sh` | Genera tráfico para validar que las métricas se mueven |
| Monitor | `monitoring/prometheus/prometheus.yml`, `.../api_dashboard.json`, `.../alertmanager.yml` | Scraping, dashboard y alertas se construyen sobre estas métricas |

## Nota de trazabilidad

Este es el nodo con más dependencias del sistema de monitoreo: si se renombra
una métrica o un label, hay que actualizar el test (`HU-08`), las queries de
`api_dashboard.json` y las expresiones PromQL en
`monitoring/prometheus/rules/api_alerts.yml`. El script de trazabilidad solo
valida existencia de archivos y la mención del ID en el test — la consistencia
de las queries PromQL se revisa manualmente en code review.
