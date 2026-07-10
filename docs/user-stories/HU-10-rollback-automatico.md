---
id: HU-10
title: Revertir automáticamente un despliegue fallido
status: done
persona: Ingeniero de operaciones (on-call)
i_want: que el sistema vuelva solo a la versión anterior si el health check de un deploy falla
so_that: el tiempo de interrupción sea mínimo y no dependa de que alguien esté despierto para reaccionar
acceptance:
  - Si el health check tras un deploy no responde dentro del tiempo máximo, se ejecuta rollback automáticamente
  - El rollback despliega la imagen etiquetada inmediatamente anterior a la fallida
  - Si el rollback también falla, se informa que se requiere intervención manual
plan:
  - docs/architecture.md
code:
  - kubernetes/base/deployment.yaml
build:
  - app/Dockerfile
test:
  - scripts/deploy.sh
release:
  - .github/workflows/release.yml
deploy:
  - scripts/rollback.sh
operate:
  - docs/runbook.md
monitor:
  - monitoring/prometheus/rules/api_alerts.yml
---

## Historia

Como **ingeniero on-call**, quiero que **un deploy fallido se revierta solo**
para que **el servicio se recupere sin esperar a que alguien intervenga
manualmente a las 3am**.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | El rollback automático es parte del diseño de resiliencia |
| Code | `kubernetes/base/deployment.yaml` | `RollingUpdate` con `maxUnavailable: 0` evita downtime durante el rollback |
| Build | `app/Dockerfile` | `HEALTHCHECK` es la señal que dispara el rollback |
| Test | `scripts/deploy.sh` | Contiene la lógica que detecta el fallo y llama a `rollback.sh` |
| Release | `.github/workflows/release.yml` | Cada versión etiquetada es un punto de rollback válido |
| Deploy | `scripts/rollback.sh` | Ejecuta el rollback a la imagen previa y verifica salud |
| Operate | `docs/runbook.md` | Escenario "API Down" documenta cuándo correr rollback manualmente |
| Monitor | `monitoring/prometheus/rules/api_alerts.yml` | Alerta `APIDown` es la señal externa equivalente en producción real |

## Nota de trazabilidad

Esta historia no tiene test de Jest — su "test" es el propio script
`scripts/deploy.sh`, que ejercita la ruta de fallo llamando a
`scripts/rollback.sh` cuando el health check no responde a tiempo. Si cambia
el mecanismo de selección de "versión anterior" (hoy: orden por tag semántico
de imágenes Docker locales), debe actualizarse `rollback.sh` y esta historia
en el mismo cambio.
