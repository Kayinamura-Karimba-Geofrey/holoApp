const User = require('../model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const emailService = require('./emailService');
const audit = require('./auditService');

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
exports.issueTokens = issueTokens;

exports.register = async ({ email, password, name }, req) => {
  const existingUser = await User.exists({ email });
  if (existingUser) throw new AppError('Email already registered', 409);

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ email, name, password: hashedPassword });
  await audit.log('auth.register', { userId: user._id, req });

  return { ...issueTokens(user), user };
};

exports.login = async ({ email, password }, req) => {
  const user = await User.findOne({ email }).select('+password');
  // Compare even when the user is missing so response timing doesn't reveal which emails exist.
  const hash = user ? user.password : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hash);
  if (!user || !isMatch) {
    await audit.log('auth.login_failed', { userId: user?._id, email, req });
    throw new AppError('Invalid email or password', 401);
  }

  await audit.log('auth.login', { userId: user._id, method: 'password', req });
  return { ...issueTokens(user), user };
};

exports.logout = async (user, req) => {
  await User.updateOne({ _id: user._id }, { $inc: { tokenVersion: 1 } });
  await audit.log('auth.logout', { userId: user._id, req });
  return { message: 'Logged out successfully' };
};

exports.forgotPassword = async (email, req) => {
  const user = await User.findOne({ email });
  // Always succeed silently so this endpoint can't be used to discover accounts.
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetTokenHash = sha256(resetToken);
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();

  await emailService.sendPasswordReset(user.email, resetToken);
  await audit.log('auth.password_reset_requested', { userId: user._id, req });
};

exports.resetPassword = async (token, newPassword, req) => {
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
  await audit.log('auth.password_reset', { userId: user._id, req });

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
