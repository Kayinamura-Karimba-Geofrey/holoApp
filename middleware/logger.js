const pinoHttp = require("pino-http");
const logger = require("../utils/logger");

// Structured request logging to stdout (collected by the hosting platform).
module.exports = pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === "/health" },
  customLogLevel: (req, res, err) =>
    err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
});
