# Historias de Usuario

Cada archivo `HU-NN-*.md` de esta carpeta es la fuente de verdad de **una**
funcionalidad, y declara explícitamente en qué archivo vive esa funcionalidad
en cada una de las 8 etapas del ciclo DevOps (`Plan → Code → Build → Test →
Release → Deploy → Operate → Monitor`).

## Índice

| ID | Historia | Área |
|----|----------|------|
| [HU-01](HU-01-disponibilidad-del-servicio.md) | Verificar la disponibilidad del servicio | Salud / Kubernetes probes |
| [HU-02](HU-02-informacion-del-servicio.md) | Consultar información de versión y entorno | Salud / Verificación de deploy |
| [HU-03](HU-03-listar-productos.md) | Listar el catálogo de productos | Negocio (CRUD) |
| [HU-04](HU-04-consultar-producto.md) | Consultar el detalle de un producto por ID | Negocio (CRUD) |
| [HU-05](HU-05-crear-producto.md) | Crear un nuevo producto | Negocio (CRUD) |
| [HU-06](HU-06-actualizar-producto.md) | Actualizar un producto existente | Negocio (CRUD) |
| [HU-07](HU-07-eliminar-producto.md) | Eliminar un producto | Negocio (CRUD) |
| [HU-08](HU-08-metricas-de-la-aplicacion.md) | Exponer métricas para monitoreo | Observabilidad |
| [HU-09](HU-09-despliegue-automatizado-con-gate-manual.md) | Deploy automático a staging con gate manual a producción | CI/CD |
| [HU-10](HU-10-rollback-automatico.md) | Rollback automático ante un deploy fallido | CI/CD / Resiliencia |
| [HU-11](HU-11-alertas-de-incidentes.md) | Alertar al equipo ante fallos o degradación | Observabilidad |

## Formato de cada historia

Cada archivo empieza con un frontmatter YAML:

```yaml
---
id: HU-01
title: ...
status: done          # done | in-progress | planned
persona: ...
i_want: ...
so_that: ...
acceptance:
  - criterio 1
  - criterio 2
plan:    [docs/architecture.md]
code:    [app/src/routes/health.js]
build:   [app/Dockerfile]
test:    [app/tests/integration/health.test.js]
release: [.github/workflows/release.yml]
deploy:  [kubernetes/base/deployment.yaml]
operate: [docs/runbook.md]
monitor: [monitoring/prometheus/rules/api_alerts.yml]
---
```

Las 8 claves (`plan`, `code`, `build`, `test`, `release`, `deploy`, `operate`,
`monitor`) son **obligatorias** y cada una debe apuntar a al menos un archivo
real del repositorio. Esto obliga a que toda historia esté representada en
las ocho etapas del ciclo, no solo en el código.

## Cómo se mantiene esto sincronizado automáticamente

El script [`scripts/verify-traceability.js`](../../scripts/verify-traceability.js)
corre en cada push/PR (job `traceability` en
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) y valida:

1. Que cada historia tenga los campos obligatorios y sus 8 etapas enlazadas.
2. Que **todo archivo enlazado exista** en el repositorio.
3. Que todo archivo de test (`*.test.js`) enlazado en la etapa `test`
   **mencione el ID de la historia** (p. ej. `HU-03`) en un comentario cerca
   del `describe()` correspondiente.
4. Que no haya IDs duplicados y que el nombre de archivo coincida con el ID.

### Qué pasa si alguien edita una historia a mano

- **Si borra o renombra un archivo enlazado** (por ejemplo, mueve
  `app/src/routes/products.js`) sin actualizar la historia → el CI falla en
  el job `traceability` con un mensaje señalando exactamente qué enlace quedó
  roto.
- **Si agrega un nuevo criterio de aceptación** que implica un archivo nuevo
  (por ejemplo, una nueva regla de alerta) y no lo agrega a la sección
  `monitor:` → la historia queda "incompleta" a simple vista al revisarla,
  aunque el check no puede inferir semánticamente que falta — por eso las
  tablas "Dónde vive en cada etapa" dentro de cada historia sirven de
  checklist humano en code review.
- **Si el test deja de citar el ID** (p. ej. alguien reescribe
  `products.test.js` y borra el comentario `HU-05`) → el CI falla
  explícitamente pidiendo que se restaure la mención.

En otras palabras: el ciclo completo (código, tests, build, deploy,
monitoreo) está obligado a mantenerse consistente con lo que las historias
declaran, porque **CI no pasa si no lo está**.
