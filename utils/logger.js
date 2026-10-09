const pino = require('pino');
const config = require('../config/env');

// Pretty output for local development; JSON lines everywhere else.
const usePretty = config.env === 'development' && (() => {
  try { return Boolean(require.resolve('pino-pretty')); } catch { return false; }
})();

module.exports = pino({
  level: config.logLevel,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  ...(usePretty && { transport: { target: 'pino-pretty' } }),
});
