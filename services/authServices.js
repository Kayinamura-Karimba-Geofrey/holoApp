const User = require('../model/user');
const Fingerprint = require('../model/fingerPrint');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refreshsecretkey';

exports.register = async (data) => {
  const { email, password, fingerprintId } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashedPassword });

  if (fingerprintId) {
    await Fingerprint.create({ userId: user._id, fingerprintId });
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
  return { token, user };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { token, refreshToken, user };
};

exports.logout = async () => {
  // No session storage; simply rely on token expiration
  return { message: 'Logged out successfully' };
};

exports.fingerprintLogin = async (fingerprintId) => {
  const record = await Fingerprint.findOne({ fingerprintId }).populate('userId');
  if (!record) throw new Error('Fingerprint not recognized');

  const token = jwt.sign({ id: record.userId._id }, JWT_SECRET, { expiresIn: '1h' });
  return { token, user: record.userId };
};

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Email not found');

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();

  return { message: 'Password reset link sent', resetToken };
};

exports.resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });
  if (!user) throw new Error('Invalid or expired token');

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return { message: 'Password reset successful' };
};

exports.refreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: '1h' });
    return { token: newAccessToken };
  } catch {
    throw new Error('Invalid refresh token');
  }
};
