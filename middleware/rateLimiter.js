// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { createClient } = require("redis");
const config = require("../config/env");
const logger = require("../utils/logger");

// With REDIS_URL set, counts are shared across all app instances; otherwise
// each process keeps its own in-memory counts.
let redisClient = null;
if (config.redisUrl && config.env !== "test") {
  redisClient = createClient({ url: config.redisUrl });
  redisClient.on("error", (err) => logger.error({ err }, "Redis error"));
  redisClient.connect().catch((err) => logger.error({ err }, "Redis connection failed"));
}

const limiter = (name, windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    ...(redisClient && {
      store: new RedisStore({
        prefix: `rl:${name}:`,
        sendCommand: (...args) => redisClient.sendCommand(args),
      }),
    }),
  });

// General API traffic: 100 requests per 15 minutes per IP.
exports.apiLimiter = limiter("api", 15 * 60 * 1000, 100);

// Credential endpoints (login, passkeys, password reset): 10 per 15 minutes per IP.
exports.authLimiter = limiter("auth", 15 * 60 * 1000, 10);

exports.closeRateLimitStore = async () => {
  if (redisClient?.isOpen) await redisClient.quit();
};
