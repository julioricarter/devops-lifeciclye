const request = require('supertest');
const { app, server } = require('../../src/index');

afterAll(() => server.close());

// HU-01: Verificar la disponibilidad del servicio (docs/user-stories/HU-01-disponibilidad-del-servicio.md)
// HU-02: Consultar información de versión y entorno (docs/user-stories/HU-02-informacion-del-servicio.md)
// HU-08: Exponer métricas para monitoreo (docs/user-stories/HU-08-metricas-de-la-aplicacion.md)
// HU-11: Alertar al equipo ante fallos o degradación (docs/user-stories/HU-11-alertas-de-incidentes.md)
describe('Health endpoints (integration)', () => {
  // HU-01
  it('GET /health returns status ok and uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  // HU-01
  it('GET /health/ready returns ready status', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body).toHaveProperty('timestamp');
  });

  // HU-01
  it('GET /health/live returns alive status with pid', async () => {
    const res = await request(app).get('/health/live');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('alive');
    expect(typeof res.body.pid).toBe('number');
  });

  // HU-02
  it('GET / returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe('devops-demo-api');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('environment');
  });

  // HU-08, HU-11: estas métricas alimentan el dashboard de Grafana y las alertas de Prometheus
  it('GET /metrics returns prometheus format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});
