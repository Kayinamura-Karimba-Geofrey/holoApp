const SystemLog = require('../model/SystemLog');
const User = require('../model/user');
const os = require('os');
const { paginate } = require('../utils/pagination');

exports.getStats = async () => {
  const [userCount, adminCount, logCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    SystemLog.countDocuments()
  ]);
  return { userCount, adminCount, logCount };
};

exports.getSystemStatus = async () => ({
  uptime: Math.round(process.uptime()),
  hostUptime: os.uptime(),
  memoryUsage: `${Math.round(os.freemem() / 1024 / 1024)} MB free`,
  cpuLoad: os.loadavg()[0].toFixed(2),
});

exports.getLogs = async (pagination) => paginate(SystemLog, {}, pagination);

exports.clearLogs = async () => {
  await SystemLog.deleteMany();
  return { message: 'Logs cleared successfully' };
};
