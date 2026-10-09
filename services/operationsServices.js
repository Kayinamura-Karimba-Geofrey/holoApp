const SystemLog = require('../model/SystemLog');
const User = require('../model/user');
const os = require('os');
const { paginate } = require('../utils/pagination');
const audit = require('./auditService');

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

exports.clearLogs = async (userId) => {
  const { deletedCount } = await SystemLog.deleteMany();
  // Recorded after the wipe so there is always a trace of who cleared the logs.
  await audit.log('operations.logs_cleared', { userId, deletedCount });
  return { message: 'Logs cleared successfully' };
};
