---
id: HU-09
title: Desplegar automáticamente a staging con aprobación manual a producción
status: done
persona: Tech Lead / Release Manager
i_want: que cada push a main despliegue solo a staging automáticamente y que producción requiera una aprobación humana
so_that: el equipo entregue rápido sin arriesgar producción por un merge accidental
acceptance:
  - Un push a main dispara CD y despliega a staging sin intervención manual
  - El deploy a producción solo ocurre tras aprobar el environment "production" en GitHub
  - Si el smoke test de staging falla, el job de producción no se ejecuta
plan:
  - docs/architecture.md
code:
  - kubernetes/overlays/staging/kustomization.yaml
  - kubernetes/overlays/production/kustomization.yaml
build:
  - .github/workflows/ci.yml
test:
  - .github/workflows/ci.yml
release:
  - .github/workflows/release.yml
deploy:
  - .github/workflows/cd.yml
operate:
  - docs/runbook.md
monitor:
  - monitoring/alertmanager/alertmanager.yml
---

## Historia

Como **tech lead**, quiero que **el pipeline despliegue automáticamente a
staging pero pida aprobación humana explícita para producción**, para
**combinar velocidad de entrega con control de riesgo**.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | Diagrama "Flujo de un Feature Completo" documenta el gate manual |
| Code | overlays de `kubernetes/` | Diferencian réplicas/dominio entre staging y producción |
| Build | `.github/workflows/ci.yml` | Job `build` publica la imagen que CD despliega |
| Test | `.github/workflows/ci.yml` | CI debe estar verde antes de que `main` reciba el push que dispara CD |
| Release | `.github/workflows/release.yml` | Los tags `v*.*.*` documentan qué se desplegó y cuándo |
| Deploy | `.github/workflows/cd.yml` | `deploy-staging` automático → `deploy-production` con `environment: production` (gate) |
| Operate | `docs/runbook.md` | Procedimiento de deploy manual de emergencia |
| Monitor | `monitoring/alertmanager/alertmanager.yml` | Notifica a Slack el resultado del deploy a producción |

## Nota de trazabilidad

El gate manual depende de la protección del *environment* `production`
configurada en GitHub (Settings → Environments), no solo del YAML. Si se
edita esta historia para exigir, por ejemplo, 2 aprobadores, el cambio debe
reflejarse en la configuración del environment en GitHub además de en
`cd.yml` — el traceability check solo puede verificar el archivo, no la
configuración remota del repositorio.
