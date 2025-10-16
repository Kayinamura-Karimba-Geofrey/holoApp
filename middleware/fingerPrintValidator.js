// middlewares/fingerprintValidator.js
const User = require("../model/user");

module.exports = async function (req, res, next) {
  const { fingerprintId, email } = req.body;

  if (!fingerprintId || !email) {
    return res
      .status(400)
      .json({ message: "Fingerprint ID and email are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.fingerprintId !== fingerprintId) {
      return res.status(401).json({ message: "Invalid fingerprint" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Fingerprint validation failed:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
