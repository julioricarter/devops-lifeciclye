const express = require('express');
const prometheus = require('prom-client');
const healthRouter = require('./routes/health');
const productsRouter = require('./routes/products');

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'test' ? 0 : 3000);
const VERSION = process.env.APP_VERSION || '1.0.0';
const ENV = process.env.NODE_ENV || 'development';

const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode };
    end(labels);
    httpRequestTotal.inc(labels);
  });
  next();
});

app.use('/health', healthRouter);
app.use('/api/products', productsRouter);

app.get('/', (req, res) => {
  res.json({
    service: 'devops-demo-api',
    version: VERSION,
    environment: ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const server = app.listen(PORT, () => {
  console.log(`[${ENV}] devops-demo-api v${VERSION} running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server };
