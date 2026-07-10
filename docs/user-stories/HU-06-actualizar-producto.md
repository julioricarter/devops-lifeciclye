---
id: HU-06
title: Actualizar un producto existente
status: done
persona: Cliente de la API (administrador de catálogo)
i_want: poder modificar los datos de un producto existente (p. ej. su precio)
so_that: el catálogo refleje cambios de precio o stock sin crear un producto duplicado
acceptance:
  - PUT /api/products/:id responde 200 con el producto actualizado cuando existe
  - PUT /api/products/:id responde 404 cuando el producto no existe
  - El id del producto no cambia aunque se envíe uno distinto en el body
plan:
  - docs/architecture.md
code:
  - app/src/routes/products.js
build:
  - app/Dockerfile
test:
  - app/tests/unit/products.test.js
release:
  - .github/workflows/release.yml
deploy:
  - kubernetes/overlays/staging/kustomization.yaml
  - kubernetes/overlays/production/kustomization.yaml
operate:
  - docs/runbook.md
monitor:
  - monitoring/prometheus/rules/api_alerts.yml
---

## Historia

Como **administrador de catálogo**, quiero **actualizar los datos de un
producto existente** (por ejemplo su precio) para **mantener el catálogo al
día sin duplicar registros**.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | Caso de uso de negocio de referencia |
| Code | `app/src/routes/products.js` | `PUT /api/products/:id`, preserva el `id` original |
| Build | `app/Dockerfile` | Tests corren antes de empaquetar la imagen |
| Test | `app/tests/unit/products.test.js` | `describe('PUT /api/products/:id')` (tag `HU-06`) |
| Release | `.github/workflows/release.yml` | Contrato versionado en el changelog |
| Deploy | overlays de `kubernetes/` | Igual en staging y producción |
| Operate | `docs/runbook.md` | Diagnóstico ante actualizaciones inconsistentes |
| Monitor | `monitoring/prometheus/rules/api_alerts.yml` | Alerta `APIHighErrorRate` cubre 404/5xx anómalos |

## Nota de trazabilidad

La invariante "el id nunca cambia" es un criterio de aceptación explícito y
está cubierta por el test `HU-06`. Si se relaja esa regla de negocio, el
criterio de aceptación de esta historia y el test deben editarse juntos.
