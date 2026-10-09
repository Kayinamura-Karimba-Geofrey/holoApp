
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const config = require("../config/env");
const AppError = require("../utils/AppError");

module.exports = async function (req, res, next) {
  const [scheme, token] = (req.headers["authorization"] || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Access denied. No token provided.", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }

  try {
    const user = await User.findById(decoded.id);
    if (!user || user.tokenVersion !== decoded.tv) {
      return next(new AppError("Invalid or expired token", 401));
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
