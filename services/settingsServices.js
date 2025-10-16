let systemSettings = { maintenanceMode: false, version: '1.0.0' };
let currentTheme = 'dark';

exports.getSystemSettings = async () => systemSettings;

exports.updateSystemSettings = async (data) => {
  systemSettings = { ...systemSettings, ...data };
  return systemSettings;
};

exports.getThemes = async () => ['dark', 'light', 'neon', 'glass'];

exports.updateTheme = async (theme) => {
  if (!['dark', 'light', 'neon', 'glass'].includes(theme))
    throw new Error('Invalid theme');
  currentTheme = theme;
  return { theme };
};
