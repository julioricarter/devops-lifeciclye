const request = require('supertest');
const { app, server } = require('../../src/index');

afterAll(() => server.close());

describe('Health endpoints (integration)', () => {
  it('GET /health returns status ok and uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /health/ready returns ready status', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /health/live returns alive status with pid', async () => {
    const res = await request(app).get('/health/live');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('alive');
    expect(typeof res.body.pid).toBe('number');
  });

  it('GET / returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe('devops-demo-api');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('environment');
  });

  it('GET /metrics returns prometheus format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});
