const SystemSetting = require('../model/systemSetting');
const User = require('../model/user');
const { THEMES } = require('../utils/constants');
const audit = require('./auditService');
const maintenance = require('../middleware/maintenance');

const GLOBAL = { key: 'global' };

exports.getSystemSettings = async () =>
  SystemSetting.findOneAndUpdate(GLOBAL, {}, { new: true, upsert: true, setDefaultsOnInsert: true });

exports.updateSystemSettings = async (data, userId) => {
  const settings = await SystemSetting.findOneAndUpdate(GLOBAL, { $set: data }, {
    new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true
  });
  maintenance.clearCache();
  await audit.log('settings.system_updated', { userId, changes: data });
  return settings;
};

exports.getThemes = async (user) => ({ themes: THEMES, current: user.preferences.theme });

exports.updateTheme = async (userId, theme) => {
  await User.updateOne({ _id: userId }, { $set: { 'preferences.theme': theme } }, { runValidators: true });
  return { theme };
};
