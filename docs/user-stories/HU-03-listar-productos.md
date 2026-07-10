---
id: HU-03
title: Listar el catálogo de productos
status: done
persona: Cliente de la API (aplicación consumidora)
i_want: obtener la lista completa de productos disponibles
so_that: pueda mostrarla en un catálogo o hacer análisis de inventario
acceptance:
  - GET /api/products responde 200 con { data: [...], total: <n> }
  - data es un arreglo de productos con id, name, price y stock
  - total coincide con la cantidad de elementos en data
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

Como **cliente de la API**, quiero **listar todos los productos disponibles**
para **construir un catálogo o hacer análisis de inventario** sin necesidad de
conocer los IDs de antemano.

## Dónde vive en cada etapa del ciclo

| Etapa | Artefacto | Rol |
|---|---|---|
| Plan | `docs/architecture.md` | El CRUD de productos es el caso de uso de negocio de referencia |
| Code | `app/src/routes/products.js` | `GET /api/products` |
| Build | `app/Dockerfile` | La etapa `tester` corre `npm test` antes de construir la imagen final |
| Test | `app/tests/unit/products.test.js` | `describe('GET /api/products')` (tag `HU-03`) |
| Release | `.github/workflows/release.yml` | Este endpoint queda congelado en el changelog de cada tag |
| Deploy | overlays de `kubernetes/` | Se despliega igual en staging y producción vía Kustomize |
| Operate | `docs/runbook.md` | Verificación funcional post-incidente |
| Monitor | `monitoring/prometheus/rules/api_alerts.yml` | Cubierto por las alertas de error rate y latencia generales |

## Nota de trazabilidad

Cualquier cambio en la forma de la respuesta (paginación, filtros) debe
reflejarse primero en el test unitario (`HU-03`) — el pipeline de CI no deja
avanzar el build si el test no se actualiza para cubrir el nuevo comportamiento.
