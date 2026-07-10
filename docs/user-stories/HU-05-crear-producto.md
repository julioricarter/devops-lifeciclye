---
id: HU-05
title: Crear un nuevo producto
status: done
persona: Cliente de la API (aplicación consumidora / administrador de catálogo)
i_want: poder registrar un nuevo producto con nombre, precio y stock
so_that: el catálogo se mantenga actualizado sin acceso directo a una base de datos
acceptance:
  - POST /api/products con name y price válidos responde 201 con el producto creado (incluye id)
  - POST /api/products sin name responde 400 con { error }
  - POST /api/products sin price responde 400 con { error }
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

Como **administrador de catálogo**, quiero **crear productos nuevos vía API**
para **mantener el inventario actualizado** con validación de datos mínimos.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | Caso de uso de negocio de referencia |
| Code | `app/src/routes/products.js` | `POST /api/products` con validación de `name`/`price` |
| Build | `app/Dockerfile` | Tests corren antes de empaquetar la imagen |
| Test | `app/tests/unit/products.test.js` | `describe('POST /api/products')` (tag `HU-05`), 201 + 2 casos 400 |
| Release | `.github/workflows/release.yml` | Contrato versionado en el changelog |
| Deploy | overlays de `kubernetes/` | Igual en staging y producción |
| Operate | `docs/runbook.md` | Diagnóstico ante errores de validación masivos |
| Monitor | `monitoring/prometheus/rules/api_alerts.yml` | Alerta `APIHighErrorRate` detecta picos de 400 |

## Nota de trazabilidad

Si se agrega un campo obligatorio nuevo (p. ej. `category`), el criterio de
aceptación de esta historia debe actualizarse junto con el test `HU-05`
correspondiente (caso 400 por campo faltante) antes de que el pipeline de CI
permita el merge.
