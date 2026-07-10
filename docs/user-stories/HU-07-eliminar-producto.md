---
id: HU-07
title: Eliminar un producto
status: done
persona: Cliente de la API (administrador de catálogo)
i_want: poder eliminar un producto que ya no se vende
so_that: el catálogo no muestre productos descontinuados
acceptance:
  - DELETE /api/products/:id responde 204 sin cuerpo cuando el producto existe y se elimina
  - DELETE /api/products/:id responde 404 cuando el producto no existe o ya fue eliminado
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

Como **administrador de catálogo**, quiero **eliminar un producto
descontinuado** para que **deje de aparecer en el catálogo**, con un error
claro si ya no existe.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | Caso de uso de negocio de referencia |
| Code | `app/src/routes/products.js` | `DELETE /api/products/:id` |
| Build | `app/Dockerfile` | Tests corren antes de empaquetar la imagen |
| Test | `app/tests/unit/products.test.js` | `describe('DELETE /api/products/:id')` (tag `HU-07`) |
| Release | `.github/workflows/release.yml` | Contrato versionado en el changelog |
| Deploy | overlays de `kubernetes/` | Igual en staging y producción |
| Operate | `docs/runbook.md` | Diagnóstico ante eliminaciones inesperadas |
| Monitor | `monitoring/prometheus/rules/api_alerts.yml` | Alerta `APIHighErrorRate` cubre 404/5xx anómalos |

## Nota de trazabilidad

La idempotencia del 404 en doble borrado es un criterio de aceptación
explícito, cubierto por el segundo test dentro de `HU-07`. Cambiarla (p. ej.
devolver 204 en doble borrado) exige editar tanto esta historia como el test.
