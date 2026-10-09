require('dotenv').config({ quiet: true });

const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

if (process.env.JWT_SECRET === process.env.REFRESH_TOKEN_SECRET) {
  throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be different');
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGO_URI,
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [],
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '1h',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d',
  },
  ai: {
    apiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-4o',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
  },
};
