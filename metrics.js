
const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status: String(res.statusCode)
    };

    httpRequests.inc(labels);

    const duration =
      Number(process.hrtime.bigint() - start) / 1e9;

    httpDuration.observe(labels, duration);
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware
};
