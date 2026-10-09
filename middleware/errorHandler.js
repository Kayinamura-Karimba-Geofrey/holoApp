// middleware/errorHandler.js
const config = require("../config/env");

// Maps known error types to an HTTP status and a client-safe message.
const classify = (err) => {
  if (err.statusCode) return [err.statusCode, err.message];
  if (err.type === "entity.parse.failed") return [400, "Malformed JSON body"];
  if (err.type === "entity.too.large") return [413, "Request body too large"];
  if (err.name === "CastError") return [400, `Invalid ${err.path}`];
  if (err.name === "ValidationError") return [400, err.message];
  if (err.code === 11000) return [409, "Resource already exists"];
  return [500, "Internal Server Error"];
};

module.exports = (err, req, res, next) => {
  const [statusCode, message] = classify(err);
  if (!err.statusCode && statusCode >= 500) console.error("Error caught:", err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env === "development" && statusCode >= 500 && { stack: err.stack }),
  });
};
