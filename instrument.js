// Loaded before anything else so Sentry can instrument Express and Mongoose.
const Sentry = require('@sentry/node');
const config = require('./config/env');

if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.env,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    sendDefaultPii: false,
  });
}

module.exports = Sentry;
