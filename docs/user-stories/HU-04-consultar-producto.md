---
id: HU-04
title: Consultar el detalle de un producto por ID
status: done
persona: Cliente de la API (aplicación consumidora)
i_want: obtener los datos completos de un producto específico dado su ID
so_that: pueda mostrar su ficha de detalle o validar su existencia antes de otra operación
acceptance:
  - GET /api/products/:id responde 200 con el producto cuando existe
  - GET /api/products/:id responde 404 con { error: "Product not found" } cuando no existe
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

Como **cliente de la API**, quiero **consultar un producto por su ID** para
**mostrar su ficha de detalle** y recibir un error claro si no existe.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | Caso de uso de negocio de referencia |
| Code | `app/src/routes/products.js` | `GET /api/products/:id` |
| Build | `app/Dockerfile` | Tests corren antes de empaquetar la imagen |
| Test | `app/tests/unit/products.test.js` | `describe('GET /api/products/:id')` (tag `HU-04`), camino feliz + 404 |
| Release | `.github/workflows/release.yml` | Contrato versionado en el changelog |
| Deploy | overlays de `kubernetes/` | Igual en staging y producción |
| Operate | `docs/runbook.md` | Diagnóstico de errores 4xx/5xx |
| Monitor | `monitoring/prometheus/rules/api_alerts.yml` | Alerta `APIHighErrorRate` cubre 404/5xx anómalos |

## Nota de trazabilidad

El caso 404 es un criterio de aceptación explícito: si se cambia el mensaje de
error o el código de estado, el test `HU-04` debe actualizarse en el mismo
commit o el traceability check falla al no encontrar la mención `HU-04`
alineada con el cambio.
