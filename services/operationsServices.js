const SystemLog = require('../model/SystemLog');
const os = require('os');

exports.getStats = async () => {
  const userCount = await SystemLog.countDocuments();
  return { userCount, activeSessions: Math.floor(Math.random() * 50) };
};

exports.getSystemStatus = async () => ({
  uptime: os.uptime(),
  memoryUsage: `${Math.round(os.freemem() / 1024 / 1024)} MB free`,
  cpuLoad: os.loadavg()[0].toFixed(2),
});

exports.getLogs = async () => await SystemLog.find().sort({ createdAt: -1 });

exports.clearLogs = async () => {
  await SystemLog.deleteMany();
  return { message: 'Logs cleared successfully' };
};
