require('dotenv').config({ quiet: true });

const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

if (process.env.JWT_SECRET === process.env.REFRESH_TOKEN_SECRET) {
  throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be different');
}

const env = process.env.NODE_ENV || 'development';
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

module.exports = {
  env,
  port: Number(process.env.PORT) || 3000,
  baseUrl,
  logLevel: process.env.LOG_LEVEL || (env === 'test' ? 'silent' : 'info'),
  mongoUri: process.env.MONGO_URI,
  redisUrl: process.env.REDIS_URL,
  sentryDsn: process.env.SENTRY_DSN,
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [],
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '1h',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d',
  },
  // Where the frontend lives; used to build links in emails.
  appUrl: process.env.APP_URL || baseUrl,
  mail: {
    from: process.env.MAIL_FROM || 'HoloApp <no-reply@holoapp.local>',
    smtp: process.env.SMTP_HOST
      ? {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        }
      : null,
  },
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'HoloApp',
    rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
    origins: (process.env.WEBAUTHN_ORIGINS || 'http://localhost:5173').split(',').map((o) => o.trim()),
  },
  ai: {
    apiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-4o',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
    dailyLimit: Number(process.env.HOLOBOT_DAILY_LIMIT) || 50,
  },
};
