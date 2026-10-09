// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const limiter = (windowMs, limit) =>
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
  });

// General API traffic: 100 requests per 15 minutes per IP.
exports.apiLimiter = limiter(15 * 60 * 1000, 100);

// Credential endpoints (login, fingerprint, password reset): 10 per 15 minutes per IP.
exports.authLimiter = limiter(15 * 60 * 1000, 10);
