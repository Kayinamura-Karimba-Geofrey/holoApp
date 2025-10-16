
const jwt = require("jsonwebtoken");
const User = require("../model/user");

module.exports = async function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid token: user not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
