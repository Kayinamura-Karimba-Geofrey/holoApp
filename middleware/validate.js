const AppError = require("../utils/AppError");

// Validates req[source] against a Joi schema, replacing it with the sanitized
// value so unknown fields (e.g. `role`) never reach the services.
module.exports = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return next(new AppError(error.details.map((d) => d.message).join("; "), 400));
  }
  if (source === "query") {
    // req.query is a getter in Express 5; mutate in place to stay compatible.
    Object.keys(req.query).forEach((k) => delete req.query[k]);
    Object.assign(req.query, value);
  } else {
    req[source] = value;
  }
  next();
};
