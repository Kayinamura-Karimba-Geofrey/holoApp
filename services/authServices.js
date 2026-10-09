const User = require('../model/user');
const Fingerprint = require('../model/fingerPrint');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const AppError = require('../utils/AppError');

// Used to keep login timing constant when the email doesn't exist.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const issueTokens = (user) => ({
  token: jwt.sign({ id: user._id, tv: user.tokenVersion }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  }),
  refreshToken: jwt.sign({ id: user._id, tv: user.tokenVersion }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  }),
});

exports.register = async ({ email, password, name, fingerprintId }) => {
  const existingUser = await User.exists({ email });
  if (existingUser) throw new AppError('Email already registered', 409);

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ email, name, password: hashedPassword });

  if (fingerprintId) {
    await Fingerprint.create({ userId: user._id, fingerprintHash: sha256(fingerprintId) });
  }

  return { ...issueTokens(user), user };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  // Compare even when the user is missing so response timing doesn't reveal which emails exist.
  const hash = user ? user.password : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hash);
  if (!user || !isMatch) throw new AppError('Invalid email or password', 401);

  return { ...issueTokens(user), user };
};

exports.logout = async (user) => {
  await User.updateOne({ _id: user._id }, { $inc: { tokenVersion: 1 } });
  return { message: 'Logged out successfully' };
};

exports.fingerprintLogin = async ({ email, fingerprintId }) => {
  const user = await User.findOne({ email });
  const record = user && await Fingerprint.findOne({
    userId: user._id,
    fingerprintHash: sha256(fingerprintId),
  });
  if (!record) throw new AppError('Fingerprint not recognized', 401);

  return { ...issueTokens(user), user };
};

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  // Always succeed silently so this endpoint can't be used to discover accounts.
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetTokenHash = sha256(resetToken);
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();

  // TODO: send this link by email once a mail provider is configured.
  if (config.env === 'development') {
    console.log(`Password reset link for ${email}: ${config.baseUrl}/reset-password?token=${resetToken}`);
  }
};

exports.resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetTokenHash: sha256(token),
    resetTokenExpiry: { $gt: Date.now() }
  });
  if (!user) throw new AppError('Invalid or expired token', 400);

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpiry = undefined;
  user.tokenVersion += 1;
  await user.save();

  return { message: 'Password reset successful' };
};

exports.refreshToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || user.tokenVersion !== decoded.tv) {
    throw new AppError('Invalid refresh token', 401);
  }
  return issueTokens(user);
};
