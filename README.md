# DevOps Lifecycle — Entorno de Demostración Completo

Simulación del ciclo de vida DevOps completo en un solo repositorio: desde el código hasta el monitoreo en producción.

```
PLAN → CODE → BUILD → TEST → RELEASE → DEPLOY → OPERATE → MONITOR
```

---

## Inicio Rápido (5 minutos)

**Requisitos**: Docker, Docker Compose, Node.js 20+, Git

```bash
# 1. Clonar e inicializar
cd devops-lifecycle
bash scripts/setup.sh
```

Eso es todo. El script ejecuta los tests, construye la imagen y levanta el stack completo.

| Servicio | URL | Credenciales |
|---|---|---|
| API | http://localhost:3000 | — |
| API Metrics | http://localhost:3000/metrics | — |
| Prometheus | http://localhost:9090 | — |
| **Grafana** | http://localhost:3001 | admin / devops123 |
| AlertManager | http://localhost:9093 | — |

---

## Estructura del Proyecto

```
devops-lifecycle/
│
├── app/                          # Aplicación Node.js/Express
│   ├── src/
│   │   ├── index.js              # Entry point + métricas Prometheus
│   │   └── routes/
│   │       ├── health.js         # /health, /health/ready, /health/live
│   │       └── products.js       # CRUD completo de productos
│   ├── tests/
│   │   ├── unit/                 # Tests unitarios (jest + supertest)
│   │   └── integration/          # Tests de integración
│   ├── Dockerfile                # Multi-stage: builder → tester → production
│   └── package.json
│
├── .github/workflows/
│   ├── ci.yml                    # Lint → Test → Build → Security Scan
│   ├── cd.yml                    # Deploy staging → (gate) → Deploy production
│   └── release.yml               # Changelog + GitHub Release
│
├── infrastructure/
│   ├── terraform/                # VPC + EKS en AWS (módulos reutilizables)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── modules/
│   │       ├── network/          # VPC, subnets, NAT gateway
│   │       └── compute/          # EKS cluster + node groups + IAM
│   └── ansible/
│       ├── inventory/hosts.ini   # Inventario de servidores
│       ├── playbooks/deploy.yml  # Deploy con health check y rollback
│       └── roles/webserver/      # Instalar Docker, configurar servidor
│
├── kubernetes/
│   ├── base/                     # Manifiestos base (Deployment, Service, Ingress, HPA)
│   └── overlays/
│       ├── staging/              # 1 réplica, dominio staging
│       └── production/           # 3+ réplicas, HPA hasta 20, dominio prod
│
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml        # Scraping de API + node-exporter
│   │   └── rules/api_alerts.yml  # Alertas: API down, 5xx, latencia, CPU, RAM, disco
│   ├── grafana/
│   │   ├── datasources.yml       # Fuente de datos Prometheus
│   │   └── dashboards/           # Dashboard JSON: RPS, error rate, latencia p50/p95/p99
│   └── alertmanager/
│       └── alertmanager.yml      # Enrutamiento de alertas a Slack
│
├── scripts/
│   ├── setup.sh                  # Inicializar entorno local completo
│   ├── deploy.sh                 # Deploy con zero-downtime rolling update
│   ├── rollback.sh               # Rollback automático a imagen anterior
│   ├── load-test.sh              # Generador de tráfico para ver métricas
│   └── verify-traceability.js    # Valida que las historias de usuario cubran las 8 etapas
│
├── docs/
│   ├── architecture.md           # Diagrama del sistema y flujo completo
│   ├── runbook.md                # Respuesta a incidentes y SLOs
│   └── user-stories/             # Documentación funcional por historia de usuario (HU-01..HU-11)
│
└── docker-compose.yml            # Stack local completo (6 servicios)
```

---

## Las 8 Etapas del Ciclo DevOps en Este Proyecto

### 1. PLAN — `docs/`
Arquitectura documentada, SLOs definidos, runbook de incidentes.

### 2. CODE — `app/src/`
API REST en Node.js con Express. Endpoints de health check y métricas Prometheus integrados desde el inicio.

### 3. BUILD — `app/Dockerfile`
Multi-stage build: las dependencias de producción se instalan en una etapa, los tests corren en otra, la imagen final es mínima (Alpine, non-root).

```bash
docker build -t devops-demo-api:local ./app --target production
```

### 4. TEST — `app/tests/`
Tests unitarios e integración con Jest + Supertest. Umbral de cobertura: 80% de líneas.

```bash
cd app && npm test
```

### 5. RELEASE — `.github/workflows/release.yml`
Al crear un tag `v*.*.*`, GitHub Actions genera automáticamente el changelog y publica el Release.

```bash
git tag v1.2.3 && git push origin v1.2.3
```

### 6. DEPLOY — `kubernetes/` + `.github/workflows/cd.yml`
Kustomize gestiona las diferencias entre entornos. El pipeline de CD hace deploy a staging automáticamente y requiere aprobación manual para producción.

```bash
# Local (simulado)
bash scripts/deploy.sh 1.2.3 staging

# Kubernetes real
kubectl apply -k kubernetes/overlays/production
```

### 7. OPERATE — `scripts/`, `infrastructure/ansible/`
Scripts de deploy, rollback y diagnóstico. Ansible automatiza el provisioning de servidores.

```bash
# Rollback de emergencia
bash scripts/rollback.sh

# Provisioning con Ansible
ansible-playbook -i infrastructure/ansible/inventory/hosts.ini \
  infrastructure/ansible/playbooks/deploy.yml -e "version=1.2.3"
```

### 8. MONITOR — `monitoring/`
Prometheus scraping métricas cada 15s. Grafana con dashboard de RPS, error rate y latencia. AlertManager enviando alertas a Slack.

```bash
# Generar tráfico para ver métricas en vivo
bash scripts/load-test.sh http://localhost:3000 120 20
# Abre http://localhost:3001 en Grafana
```

---

## Historias de Usuario y Trazabilidad

La documentación funcional está separada **por historia de usuario** en
[`docs/user-stories/`](docs/user-stories/README.md) — 11 historias (`HU-01`
a `HU-11`), una por cada funcionalidad real del sistema (health checks, CRUD
de productos, métricas, deploy con gate manual, rollback automático, alertas).

Cada historia declara explícitamente en qué archivo vive en las 8 etapas del
ciclo (Plan/Code/Build/Test/Release/Deploy/Operate/Monitor). Un script,
[`scripts/verify-traceability.js`](scripts/verify-traceability.js), corre en
cada push/PR (job `traceability` en `ci.yml`) y **falla el pipeline** si una
historia queda desincronizada del código: un artefacto enlazado que ya no
existe, o un test que dejó de mencionar el ID de la historia.

```bash
node scripts/verify-traceability.js
```

Esto significa que si alguien edita una historia de usuario a mano —agrega un
endpoint, cambia un criterio de aceptación, mueve un archivo—, el resto del
ciclo debe actualizarse en consecuencia o el CI lo rechaza.

---

## Comandos Útiles

> Los comandos usan `docker-compose` (binario standalone). Si tu instalación
> de Docker Desktop solo trae el plugin v2, sustituye por `docker compose`
> (sin guion) — los scripts de `scripts/` ya detectan cuál tienes disponible.

```bash
# Ver logs de la API
docker-compose logs -f api

# Ver todos los servicios
docker-compose ps

# Recargar configuración de Prometheus sin reiniciar
curl -X POST http://localhost:9090/-/reload

# Apagar todo
docker-compose down

# Apagar y borrar volúmenes (datos de Prometheus/Grafana)
docker-compose down -v
```

---

## Tecnologías Utilizadas

| Categoría | Herramienta |
|-----------|-------------|
| Aplicación | Node.js 20, Express.js |
| Tests | Jest, Supertest |
| Contenedores | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| IaC | Terraform (AWS VPC + EKS) |
| Config Mgmt | Ansible |
| Orquestación | Kubernetes + Kustomize |
| Auto-scaling | Kubernetes HPA |
| Métricas | Prometheus, prom-client |
| Dashboards | Grafana |
| Alertas | AlertManager → Slack |
| Host metrics | Node Exporter |
| Seguridad | Trivy (image scanning) |
