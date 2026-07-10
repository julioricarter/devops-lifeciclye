---
id: HU-11
title: Alertar al equipo cuando el servicio falla o se degrada
status: done
persona: Ingeniero on-call
i_want: recibir una notificación en Slack automáticamente cuando el servicio esté caído o degradado
so_that: pueda reaccionar antes de que los usuarios reporten el problema
acceptance:
  - Si la API no responde por 1 minuto, se dispara la alerta crítica APIDown
  - Si más del 5% de las requests fallan por 2 minutos, se dispara APIHighErrorRate
  - Si la latencia p95 supera 500ms por 5 minutos, se dispara APIHighLatency
  - Toda alerta crítica se enruta a Slack vía AlertManager
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
  - docs/runbook.md
monitor:
  - monitoring/prometheus/rules/api_alerts.yml
  - monitoring/alertmanager/alertmanager.yml
---

## Historia

Como **ingeniero on-call**, quiero **recibir una alerta en Slack automáticamente
cuando el servicio falle o se degrade** para **reaccionar antes de que los
usuarios se den cuenta**, sin tener que estar mirando dashboards.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | El pilar "Monitor" incluye alertas como salida final del ciclo |
| Code | `app/src/index.js` | Expone las métricas base (`http_requests_total`, duración) que alimentan las reglas |
| Build | `app/Dockerfile` | La imagen expone `/metrics`, condición previa para poder alertar |
| Test | `app/tests/integration/health.test.js` | Verifica que las métricas que alimentan las alertas existen (tag `HU-11`) |
| Release | `.github/workflows/release.yml` | Cambios en umbrales de alerta se documentan en el changelog de la versión |
| Deploy | `kubernetes/base/deployment.yaml` | Anotaciones de scraping habilitan que Prometheus vea el pod |
| Operate | `docs/runbook.md` | Cada escenario de incidente está indexado por el nombre de la alerta |
| Monitor | `monitoring/prometheus/rules/api_alerts.yml`, `monitoring/alertmanager/alertmanager.yml` | Definen umbrales y el enrutamiento a Slack |

## Nota de trazabilidad

Los umbrales (`1 minuto`, `5%`, `500ms`) están duplicados en el criterio de
aceptación de esta historia y en `api_alerts.yml`. Si se ajusta un umbral en
uno de los dos lugares sin tocar el otro, la historia deja de describir el
comportamiento real — por eso ambos archivos están enlazados explícitamente
en el frontmatter y revisados en cada PR que toque alertas.
