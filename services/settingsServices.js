const SystemSetting = require('../model/systemSetting');
const User = require('../model/user');
const { THEMES } = require('../utils/constants');

const GLOBAL = { key: 'global' };

exports.getSystemSettings = async () =>
  SystemSetting.findOneAndUpdate(GLOBAL, {}, { new: true, upsert: true, setDefaultsOnInsert: true });

exports.updateSystemSettings = async (data) =>
  SystemSetting.findOneAndUpdate(GLOBAL, { $set: data }, {
    new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true
  });

exports.getThemes = async (user) => ({ themes: THEMES, current: user.preferences.theme });

exports.updateTheme = async (userId, theme) => {
  await User.updateOne({ _id: userId }, { $set: { 'preferences.theme': theme } }, { runValidators: true });
  return { theme };
};
