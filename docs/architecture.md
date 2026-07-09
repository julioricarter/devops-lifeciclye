# Arquitectura del Sistema

## Visión General

Este proyecto demuestra el ciclo de vida DevOps completo (Plan → Code → Build → Test → Release → Deploy → Operate → Monitor) usando herramientas estándar de la industria.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CICLO DE VIDA DEVOPS                                 │
│                                                                             │
│  1.PLAN     2.CODE      3.BUILD     4.TEST      5.RELEASE                   │
│  ───────    ───────     ───────     ───────     ────────                    │
│  docs/      app/src/    Dockerfile  tests/      GitHub                      │
│  issues     git         docker-     jest        Actions                     │
│  backlog    branch      compose     coverage    release.yml                 │
│                                                                             │
│  6.DEPLOY              7.OPERATE               8.MONITOR                   │
│  ────────              ─────────               ─────────                   │
│  kubernetes/           scripts/                monitoring/                  │
│  terraform/            ansible/                prometheus/                  │
│  cd.yml                rollback.sh             grafana/                     │
│                                                alertmanager/                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Componentes

### Aplicación (app/)
- **Runtime**: Node.js 20 + Express.js
- **API**: REST CRUD para productos
- **Observabilidad**: Endpoint `/metrics` en formato Prometheus
- **Health checks**: `/health`, `/health/ready`, `/health/live`

### Contenedores (Dockerfile, docker-compose.yml)
- **Multi-stage build**: `builder` → `tester` → `production`
- **Imagen mínima**: Alpine Linux, usuario no-root, filesystem read-only
- **Stack local**: API + Prometheus + Grafana + AlertManager + Node Exporter

### CI/CD (.github/workflows/)
| Workflow | Trigger | Función |
|----------|---------|---------|
| `ci.yml` | Push/PR a cualquier rama | Lint → Test → Build → Security Scan |
| `cd.yml` | Push a `main` | Deploy staging → (gate manual) → Deploy prod |
| `release.yml` | Push de tag `v*.*.*` | Crea GitHub Release con changelog |

### Infraestructura (infrastructure/)
- **Terraform**: VPC + subnets + EKS en AWS (módulos reutilizables)
- **Ansible**: Provisioning de servidores + deploy de contenedores

### Kubernetes (kubernetes/)
- **Kustomize**: base + overlays por entorno (staging/production)
- **HPA**: Auto-scaling basado en CPU/memoria
- **Rolling update**: maxUnavailable=0, maxSurge=1

### Monitoreo (monitoring/)
- **Prometheus**: Scraping de métricas cada 15s
- **Grafana**: Dashboard con RPS, error rate, latencia p50/p95/p99
- **AlertManager**: Alertas a Slack (critical y warning)
- **Reglas**: API down, high error rate, high latency, CPU/RAM/disk

## Flujo de un Feature Completo

```
Developer                 GitHub                    Kubernetes          Monitoring
    │                        │                           │                   │
    ├─ git checkout -b feat/x │                           │                   │
    ├─ [escribe código]       │                           │                   │
    ├─ git push origin feat/x │                           │                   │
    │                        ├─ CI: lint ────────────────│                   │
    │                        ├─ CI: unit tests ──────────│                   │
    │                        ├─ CI: integration tests ───│                   │
    │                        ├─ CI: docker build + push ─│                   │
    │                        ├─ CI: trivy scan ──────────│                   │
    ├─ [crea PR]             │                           │                   │
    ├─ [PR aprobado + merge] │                           │                   │
    │                        ├─ CD: deploy → staging ────┤                   │
    │                        │                           ├─ pods rolling     │
    │                        │                           ├─ health checks    │
    │                        ├─ CD: smoke test staging ──┤                   │
    │                        ├─ CD: gate manual ─────────│                   │
    │                        ├─ CD: deploy → production ─┤                   │
    │                        │                           ├─ pods rolling     │
    │                        │                           ├─ HPA activo       │
    │                        │                           │                   ├─ métricas
    │                        │                           │                   ├─ alertas
    │                        ├─ Slack: deploy OK ────────┤───────────────────┤
```
