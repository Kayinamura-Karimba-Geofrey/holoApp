const config = require('./config/env');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { connectDB } = require('./config/db');
const logger = require('./middleware/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '100kb' }));
if (config.env !== 'test') app.use(logger);

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

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Route modules
const authRoutes = require('./routes/authRoutes');
const holobotRoutes = require('./routes/holobotRoutes');
const helpRoutes = require('./routes/helpRoutes');
const operationsRoutes = require('./routes/operationRoutes');
const vrRoutes = require('./routes/vrRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.use(apiLimiter);
app.use('/auth', authRoutes);
app.use('/holobot', holobotRoutes);
app.use('/help', helpRoutes);
app.use('/operations', operationsRoutes);
app.use('/vr', vrRoutes);
app.use('/settings', settingsRoutes);


app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    });
}
