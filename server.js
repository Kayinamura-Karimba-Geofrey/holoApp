const Sentry = require('./instrument');
const config = require('./config/env');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/logger');
const maintenance = require('./middleware/maintenance');
const { apiLimiter, closeRateLimitStore } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const vrSocket = require('./services/vrSocket');

const app = express();

app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '100kb' }));
app.use(requestLogger);

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const openapiPath = path.join(__dirname, 'openapi.json');
let openapiSpec;
try {
  openapiSpec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
} catch {
  openapiSpec = { openapi: '3.0.3', info: { title: 'HoloApp API', version: '1.0.0' } };
}
// Swagger UI needs inline scripts/styles that the default helmet CSP blocks.
app.use('/api-docs', helmet({ contentSecurityPolicy: false }), swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.get('/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' });
});

// Route modules
const authRoutes = require('./routes/authRoutes');
const holobotRoutes = require('./routes/holobotRoutes');
const helpRoutes = require('./routes/helpRoutes');
const operationsRoutes = require('./routes/operationRoutes');
const vrRoutes = require('./routes/vrRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.use(apiLimiter);
app.use(maintenance);
app.use('/auth', authRoutes);
app.use('/holobot', holobotRoutes);
app.use('/help', helpRoutes);
app.use('/operations', operationsRoutes);
app.use('/vr', vrRoutes);
app.use('/settings', settingsRoutes);


app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

if (config.sentryDsn) Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

module.exports = app;

const SHUTDOWN_TIMEOUT_MS = 10000;

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  vrSocket.attach(server);
  server.listen(config.port, () => logger.info(`Server running on port ${config.port}`));

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    try {
      await vrSocket.close();
      await new Promise((resolve) => server.close(resolve));
      await Promise.all([mongoose.disconnect(), closeRateLimitStore(), Sentry.close(2000)]);
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

if (require.main === module) {
  start().catch((err) => {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  });
}
