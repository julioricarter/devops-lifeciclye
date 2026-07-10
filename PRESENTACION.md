# DevOps Lifecycle — Guía de Presentación

## De qué trata este ejemplo

Es una **API REST de gestión de productos** usada como pretexto para demostrar el ciclo de vida DevOps completo. La aplicación en sí es simple (un CRUD con 3 productos), pero todo lo que la rodea replica exactamente cómo trabaja un equipo de ingeniería real.

```
Lo que escribes          →  app/src/        el código fuente
Cómo lo pruebas         →  app/tests/      15 tests automáticos
Cómo lo empaquetas      →  Dockerfile      imagen Docker multi-stage
Cómo lo entregas        →  .github/        pipeline CI/CD automático
Dónde corre             →  kubernetes/     orquestación de contenedores
Qué infraestructura usa →  terraform/      VPC + cluster en AWS
Cómo se configura       →  ansible/        provisioning de servidores
Cómo sabes que funciona →  monitoring/     métricas Prometheus + Grafana
Qué pasa si falla       →  scripts/        alertas Slack + rollback automático
```

**En una frase:** código que nace, se prueba, se empaqueta, se despliega, escala solo y avisa cuando algo falla.

---

## Requisitos para ejecutarlo

### Modo básico (solo Node.js)
- Node.js 20 o superior
- npm

### Modo completo (con monitoreo visual)
- Node.js 20 o superior
- Docker Desktop — https://www.docker.com/products/docker-desktop/

---

## Pasos para presentar el ejemplo

### PASO 0 — Preparar el entorno (hacer esto antes de la presentación)

```bash
# Situarse en la carpeta del proyecto
cd devops-lifecycle

# Instalar dependencias
cd app && npm install && cd ..
```

Verificar que funciona:
```bash
cd app && node src/index.js
# Debe mostrar: [development] devops-demo-api v1.0.0 running on port 3000
# Ctrl+C para detener
```

---

### PASO 1 — Mostrar la estructura del proyecto (2 min)

Abrir el explorador de archivos o ejecutar en terminal:

```bash
# Windows
tree /F devops-lifecycle

# Mac/Linux
find devops-lifecycle -type f | sort
```

**Explicar en voz alta:**
> "Esto no es solo código. Cada carpeta representa una etapa del ciclo DevOps.
> La carpeta `app/` es lo que construye el desarrollador.
> Todo lo demás — Docker, GitHub Actions, Kubernetes, Terraform, Prometheus —
> es lo que hace que ese código viva en producción de forma segura y automatizada."

---

### PASO 2 — Historias de Usuario y Trazabilidad (2 min)

```bash
# Desde la raíz del proyecto
node scripts/verify-traceability.js
```

**Qué mostrar:** el check en verde listando las 11 historias (`HU-01`..`HU-11`).

Abrir `docs/user-stories/README.md` y luego una historia cualquiera, por
ejemplo `docs/user-stories/HU-05-crear-producto.md`.

**Explicar en voz alta:**
> "La documentación funcional no es un Word aparte que nadie actualiza.
> Cada historia de usuario declara, en este frontmatter, exactamente qué
> archivo la implementa en cada una de las 8 etapas del ciclo: plan, código,
> build, test, release, deploy, operación y monitoreo.
>
> Este script valida esos enlaces en cada push. Si alguien edita una
> historia a mano — mueve un archivo, borra un test, cambia un criterio de
> aceptación — y el resto del ciclo no se actualiza junto con eso, el
> pipeline de CI falla aquí mismo, antes de llegar a los tests."

**Demostración en vivo de que realmente detecta el desfase** (opcional, 30s):
```bash
# Romper un enlace a propósito
sed -i "s#app/tests/unit/products.test.js#app/tests/unit/no-existe.test.js#" docs/user-stories/HU-03-listar-productos.md
node scripts/verify-traceability.js   # falla con el archivo exacto que falta
git checkout -- docs/user-stories/HU-03-listar-productos.md   # restaurar
```

---

### PASO 3 — Demostrar la etapa TEST (3 min)

```bash
cd devops-lifecycle/app
npm test
```

**Qué mostrar:** Los 15 tests pasando en verde con el reporte de cobertura (92%).

**Explicar:**
> "Antes de que cualquier código llegue a producción, pasa por aquí.
> Si un test falla, el pipeline de CI/CD se detiene y el código no se despliega.
> Nadie tiene que recordar hacer esto manualmente — es automático en cada `git push`."

**Señalar en el código** (`app/tests/unit/products.test.js`):
- Hay tests para el camino feliz (producto encontrado)
- Hay tests para errores (404, 400)
- Supertest levanta la app real en memoria — no hay mocks falsos

---

### PASO 4 — Levantar la API en vivo (2 min)

```bash
# Desde la carpeta app/
node src/index.js
```

Abrir el navegador y visitar estas URLs una por una:

| URL | Qué muestra | Por qué importa |
|-----|-------------|-----------------|
| `http://localhost:3000/` | Info del servicio | Identifica versión y entorno |
| `http://localhost:3000/health` | `{"status":"ok","uptime":N}` | Kubernetes usa esto para saber si el pod vive |
| `http://localhost:3000/health/ready` | `{"status":"ready"}` | Kubernetes usa esto para enviar tráfico |
| `http://localhost:3000/api/products` | Lista de productos | La funcionalidad real |
| `http://localhost:3000/metrics` | Texto Prometheus | Lo que Grafana consume |

**Explicar al mostrar `/metrics`:**
> "Este endpoint lo lee Prometheus cada 15 segundos.
> Mide cuántas requests llegaron, con qué código de respuesta, y cuánto tardaron.
> Con esos datos, Grafana dibuja los dashboards y AlertManager dispara las alertas."

---

### PASO 5 — Demostrar el CRUD completo (3 min)

Con la API corriendo, abrir una segunda terminal y ejecutar:

```bash
# Listar productos
curl http://localhost:3000/api/products

# Crear un producto nuevo
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Producto","price":49.99,"stock":100}'

# Actualizar precio
curl -X PUT http://localhost:3000/api/products/4 \
  -H "Content-Type: application/json" \
  -d '{"price":39.99}'

# Simular error 404
curl http://localhost:3000/api/products/9999

# Borrar
curl -X DELETE http://localhost:3000/api/products/4
```

**En Windows (PowerShell):**
```powershell
Invoke-RestMethod http://localhost:3000/api/products
Invoke-RestMethod http://localhost:3000/api/products/1
```

---

### PASO 6 — Mostrar el pipeline CI/CD (3 min, sin ejecutar)

Abrir `.github/workflows/ci.yml` en el editor.

**Explicar la secuencia de jobs:**
```
git push
    │
    ├─→ lint          ← "¿El código está bien escrito?"
    │       │
    │       ├─→ unit-tests        ← "¿Funciona cada pieza?"
    │       └─→ integration-tests ← "¿Funcionan juntas?"
    │               │
    │               └─→ build     ← "Empaquetar en Docker"
    │                       │
    │                       └─→ security-scan ← "¿Tiene vulnerabilidades?"
```

> "Todo esto ocurre automáticamente en GitHub. Si cualquier paso falla,
> el código no avanza. El equipo recibe una notificación y nadie puede
> mergear hasta que esté verde."

Luego abrir `cd.yml`:
> "Una vez que CI pasa, CD despliega automáticamente a staging.
> Para llegar a producción, un humano tiene que aprobar en GitHub.
> Ese es el 'gate manual' — combina automatización con control humano."

**Señalar el job `traceability`** al inicio de `ci.yml`:
> "Este es el mismo check del Paso 2. Corre antes que los tests unitarios e
> integración — si las historias de usuario no están sincronizadas con el
> código, el pipeline ni siquiera llega a correr los tests."

---

### PASO 7 — Mostrar la infraestructura como código (2 min, sin ejecutar)

Abrir `infrastructure/terraform/main.tf` y `infrastructure/terraform/variables.tf`.

**Explicar:**
> "Con Terraform, la infraestructura se describe como código.
> Necesito un cluster de Kubernetes en AWS con 3 nodos en 2 zonas de disponibilidad?
> Lo escribo aquí, hago `terraform apply`, y se crea solo.
> Lo más importante: está en Git. Si alguien borra la infraestructura por error,
> puedo recrearla exactamente igual en minutos."

Abrir `kubernetes/base/deployment.yaml`:
> "Y aquí le digo a Kubernetes: corre 2 copias de mi app,
> si una falla reiníciala automáticamente,
> escala hasta 20 si el CPU supera el 70%."

---

### PASO 8 — Mostrar el monitoreo (2 min, sin Docker / 5 min con Docker)

**Sin Docker** — abrir `monitoring/prometheus/rules/api_alerts.yml`:
> "Esto define cuándo Prometheus debe gritar.
> Si la API no responde por 1 minuto → alerta crítica.
> Si más del 5% de requests fallan → alerta de warning.
> Si la latencia p95 supera 500ms → alerta de warning."

**Con Docker instalado** — ejecutar el stack completo:
```bash
# Desde la carpeta raíz del proyecto
docker compose up -d

# Generar tráfico para ver las métricas moverse
bash scripts/load-test.sh http://localhost:3000 120 20
```

Luego abrir:
- `http://localhost:9090` → Prometheus (queries en bruto)
- `http://localhost:3001` → Grafana, usuario: `admin`, contraseña: `devops123`

En Grafana navegar a **Dashboards → DevOps Demo API** y mostrar:
- Panel de RPS (requests por segundo) subiendo con el load test
- Panel de Error Rate
- Panel de Latencia p50 / p95 / p99

---

### PASO 9 — Demostrar el rollback (2 min)

```bash
# Simular un deploy fallido y rollback automático
bash scripts/deploy.sh 2.0.0-broken staging
# Si el health check falla → el script llama a rollback.sh automáticamente
```

**Explicar:**
> "En producción real, si el health check falla después de un deploy,
> el sistema revierte solo a la versión anterior sin intervención humana.
> El tiempo de interrupción es mínimo porque Kubernetes nunca apaga
> los pods viejos hasta que los nuevos están saludables."

---

## Preguntas frecuentes durante la presentación

**¿Por qué no poner toda la lógica en un solo archivo?**
> Separar responsabilidades: la app no sabe nada de infraestructura,
> la infraestructura no sabe nada del código de negocio.
> Equipos distintos pueden trabajar en paralelo sin pisarse.

**¿Para qué sirve el Dockerfile multi-stage?**
> La imagen de producción pesa ~150MB en vez de ~600MB.
> No incluye devDependencies, ni el código fuente de tests, ni herramientas de build.
> Menos superficie = menos vulnerabilidades.

**¿Qué pasa si Terraform falla a mitad de una operación?**
> Terraform guarda el estado en S3. Si algo falla, sabe exactamente
> qué recursos creó y cuáles no. `terraform apply` de nuevo solo crea lo que falta.

**¿Por qué Kubernetes en vez de correr Docker directamente?**
> Docker corre un contenedor. Kubernetes gestiona cientos:
> los reinicia si fallan, los escala si hay más tráfico,
> y hace deploys sin tiempo de inactividad.

---

## Archivos clave para abrir durante la presentación

```
devops-lifecycle/
├── docs/user-stories/README.md               ← Índice de historias de usuario
├── docs/user-stories/HU-05-crear-producto.md ← Ejemplo de historia con trazabilidad a las 8 etapas
├── scripts/verify-traceability.js            ← Check que valida esa trazabilidad
├── app/src/index.js                          ← La app: métricas integradas desde el inicio
├── app/tests/unit/products.test.js           ← Cómo se ven los tests (con tags HU-03..HU-07)
├── app/Dockerfile                            ← Multi-stage build explicado
├── .github/workflows/ci.yml                 ← Pipeline CI completo (incluye job traceability)
├── .github/workflows/cd.yml                 ← Deploy automático con gate manual
├── kubernetes/base/deployment.yaml          ← Health checks + recursos + seguridad
├── kubernetes/base/hpa.yaml                 ← Auto-scaling declarativo
├── infrastructure/terraform/main.tf         ← Infraestructura como código
├── monitoring/prometheus/rules/api_alerts.yml ← Cuándo y cómo alertar
└── docs/architecture.md                     ← Diagrama del flujo completo
```

---

## Duración sugerida

| Paso | Tema | Tiempo |
|------|------|--------|
| 0 | Preparación | antes |
| 1 | Estructura del proyecto | 2 min |
| 2 | Historias de usuario y trazabilidad | 2 min |
| 3 | Tests en vivo | 3 min |
| 4 | API en vivo | 2 min |
| 5 | CRUD completo | 3 min |
| 6 | Pipeline CI/CD | 3 min |
| 7 | Infraestructura como código | 2 min |
| 8 | Monitoreo | 2-5 min |
| 9 | Rollback | 2 min |
| — | Preguntas | libre |
| **Total** | | **~22 min** |
