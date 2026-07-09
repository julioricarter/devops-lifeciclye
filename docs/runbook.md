# Runbook — Operación y Respuesta a Incidentes

## Comandos de Diagnóstico Rápido

```bash
# Estado de todos los contenedores locales
docker-compose ps

# Logs en tiempo real de la API
docker-compose logs -f api

# Métricas en bruto
curl http://localhost:3000/metrics

# Health checks
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
```

## Escenarios de Incidente

### INCIDENTE: API Down (Alerta: APIDown)

**Síntomas**: `up{job="devops-demo-api"} == 0`

**Diagnóstico**:
```bash
# 1. Verificar si el contenedor está corriendo
docker-compose ps api

# 2. Ver logs del crash
docker-compose logs --tail=50 api

# 3. Intentar reiniciar
docker-compose restart api

# 4. Si no levanta, hacer rollback
./scripts/rollback.sh
```

### INCIDENTE: Alta tasa de errores 5xx (Alerta: APIHighErrorRate)

**Síntomas**: Error rate > 5% por más de 2 minutos

**Diagnóstico**:
```bash
# Ver logs de errores
docker-compose logs api | grep -E '"status":5[0-9][0-9]'

# Correlacionar con un deploy reciente
git log --oneline -10

# Si el último deploy causó el problema
./scripts/rollback.sh
```

### INCIDENTE: Alta latencia (Alerta: APIHighLatency)

**Síntomas**: p95 > 500ms por 5 minutos

**Diagnóstico**:
```bash
# Verificar uso de recursos del contenedor
docker stats devops_api

# Ver métricas de latencia en Prometheus
# http://localhost:9090/graph
# Query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### INCIDENTE: Poco espacio en disco (Alerta: DiskSpaceLow)

```bash
# Ver uso de disco
df -h

# Limpiar imágenes Docker no usadas
docker system prune -a --volumes

# Ver tamaño de logs
du -sh /var/log/
```

## Procedimientos de Mantenimiento

### Deploy manual (emergencia)
```bash
./scripts/deploy.sh 1.2.3 production
```

### Rollback manual
```bash
./scripts/rollback.sh
```

### Generar tráfico de prueba
```bash
./scripts/load-test.sh http://localhost:3000 120 20
```

### Actualizar configuración de Prometheus
```bash
# Recargar sin reiniciar
curl -X POST http://localhost:9090/-/reload
```

## Contactos de Escalación

| Nivel | Quién | Cuándo |
|-------|-------|--------|
| L1 | On-call engineer | Cualquier alerta |
| L2 | Tech Lead | Incidente mayor (>30min) |
| L3 | CTO | Incidente crítico en producción |

## SLOs del Servicio

| Métrica | Objetivo | Ventana |
|---------|----------|---------|
| Disponibilidad | 99.9% | 30 días |
| Latencia p95 | < 200ms | 5 min rolling |
| Error rate | < 0.1% | 5 min rolling |
