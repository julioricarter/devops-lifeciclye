---
id: HU-02
title: Consultar información de versión y entorno del servicio
status: done
persona: Ingeniero de despliegue
i_want: poder pedirle al servicio su versión y entorno actuales
so_that: pueda confirmar que un deploy entregó la versión esperada en el entorno correcto
acceptance:
  - GET / responde 200 con { service, version, environment, timestamp }
  - version refleja la variable de entorno APP_VERSION inyectada en el deploy
  - environment refleja NODE_ENV (development, staging o production)
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
  - scripts/deploy.sh
monitor:
  - monitoring/grafana/dashboards/api_dashboard.json
---

## Historia

Como **ingeniero de despliegue**, quiero **verificar qué versión y entorno está
sirviendo la API en este momento** para **confirmar que un deploy realmente
entregó lo que se esperaba**, sin depender de logs.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | El flujo de feature completo termina en "smoke test" de versión |
| Code | `app/src/index.js` | Endpoint raíz `GET /` con `service/version/environment/timestamp` |
| Build | `app/Dockerfile` | `ENV NODE_ENV=production`; `APP_VERSION` se inyecta en runtime |
| Test | `app/tests/integration/health.test.js` | Verifica la forma de la respuesta (tag `HU-02`) |
| Release | `.github/workflows/release.yml` | El tag `vX.Y.Z` es la fuente de verdad de la versión esperada |
| Deploy | `kubernetes/base/deployment.yaml` | `APP_VERSION` viene de `metadata.labels['app.kubernetes.io/version']` |
| Operate | `scripts/deploy.sh` | Compara la versión desplegada contra la solicitada tras el deploy |
| Monitor | `monitoring/grafana/dashboards/api_dashboard.json` | Panel filtra métricas por versión/entorno |

## Nota de trazabilidad

Si cambia el contrato de este endpoint (por ejemplo se agrega `commit_sha`),
debe reflejarse en el test de integración (`HU-02`) y, si el dashboard de
Grafana filtra por ese campo, también en `api_dashboard.json`.
