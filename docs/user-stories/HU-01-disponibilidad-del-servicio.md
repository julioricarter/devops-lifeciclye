---
id: HU-01
title: Verificar la disponibilidad del servicio
status: done
persona: Operador de plataforma (SRE / Kubernetes)
i_want: poder consultar en cualquier momento si el proceso está vivo y si puede recibir tráfico
so_that: Kubernetes y el equipo de operaciones sepan cuándo reiniciar un pod o cuándo enviarle tráfico
acceptance:
  - GET /health responde 200 con { status: "ok", uptime: <segundos> }
  - GET /health/live responde 200 con { status: "alive", pid: <n> } mientras el proceso exista
  - GET /health/ready responde 200 con { status: "ready", timestamp } cuando el servicio puede aceptar tráfico
plan:
  - docs/architecture.md
code:
  - app/src/routes/health.js
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
  - scripts/setup.sh
monitor:
  - monitoring/prometheus/rules/api_alerts.yml
---

## Historia

Como **operador de plataforma**, quiero poder **consultar el estado de salud del
servicio** para que **Kubernetes decida automáticamente si un pod debe recibir
tráfico o ser reiniciado**, sin intervención manual.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | Define los health checks como parte del diseño |
| Code | `app/src/routes/health.js` | Implementa `/health`, `/health/live`, `/health/ready` |
| Build | `app/Dockerfile` | `HEALTHCHECK` de Docker apunta a `/health` |
| Test | `app/tests/integration/health.test.js` | Verifica los 3 endpoints (tag `HU-01`) |
| Release | `.github/workflows/release.yml` | El release no se corta si estos tests fallan (dependen de CI) |
| Deploy | `kubernetes/base/deployment.yaml` | `livenessProbe` → `/health/live`, `readinessProbe` → `/health/ready` |
| Operate | `docs/runbook.md`, `scripts/setup.sh` | Primer diagnóstico ante un incidente ("API Down") |
| Monitor | `monitoring/prometheus/rules/api_alerts.yml` | Alerta `APIDown` si `up == 0` |

## Nota de trazabilidad

Si se agrega un nuevo endpoint de salud (p. ej. `/health/startup`) o cambia el
contrato de respuesta, hay que actualizar: el test de integración (y su tag
`HU-01`), el `Dockerfile` (si cambia la ruta usada por `HEALTHCHECK`), las
probes en `kubernetes/base/deployment.yaml` y, si aplica, las reglas de alerta.
El script `scripts/verify-traceability.js` falla si alguno de estos archivos
deja de existir o si el test deja de mencionar `HU-01`.
