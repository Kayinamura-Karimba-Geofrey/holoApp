
const express = require('express');

const app = express();

app.use(express.json());

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const openapiPath = path.join(__dirname, 'openapi.json');
let openapiSpec = {};
try {
  openapiSpec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
} catch (_) {
  openapiSpec = { openapi: '3.0.3', info: { title: 'HoloApp API', version: '1.0.0' } };
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Route modules
const authRoutes = require('./routes/authRoutes');
const holobotRoutes = require('./routes/holobotRoutes');
const helpRoutes = require('./routes/helpRoutes');
const operationsRoutes = require('./routes/operationRoutes');
const vrRoutes = require('./routes/vrRoutes');
const settingsRoutes = require('./routes/settingsRoutes');


app.use('/auth', authRoutes);
app.use('/holobot', holobotRoutes);
app.use('/help', helpRoutes);
app.use('/operations', operationsRoutes);
app.use('/vr', vrRoutes);
app.use('/settings', settingsRoutes);


app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});


app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
