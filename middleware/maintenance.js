const jwt = require("jsonwebtoken");
const config = require("../config/env");
const SystemSetting = require("../model/systemSetting");
const User = require("../model/user");

// Paths that stay reachable during maintenance so admins can sign in and turn it off.
const ALWAYS_OPEN = ["/health", "/api-docs", "/auth", "/settings", "/operations"];
const CACHE_MS = 10 * 1000;

let cached = { value: false, at: 0 };

const isMaintenanceOn = async () => {
  if (Date.now() - cached.at > CACHE_MS) {
    const settings = await SystemSetting.findOne({ key: "global" }).lean();
    cached = { value: Boolean(settings?.maintenanceMode), at: Date.now() };
  }
  return cached.value;
};

const isAdminRequest = async (req) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return false;
  try {
    const { id, tv } = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(id).select("role tokenVersion").lean();
    return user?.role === "admin" && user.tokenVersion === tv;
  } catch {
    return false;
  }
};

module.exports = async (req, res, next) => {
  try {
    if (ALWAYS_OPEN.some((p) => req.path === p || req.path.startsWith(`${p}/`))) return next();
    if (!(await isMaintenanceOn()) || (await isAdminRequest(req))) return next();
    res.set("Retry-After", "300");
    res.status(503).json({ success: false, message: "HoloApp is down for maintenance. Please try again soon." });
  } catch (err) {
    next(err);
  }
};

// Called after settings change so the new value applies immediately.
module.exports.clearCache = () => {
  cached = { value: false, at: 0 };
};
