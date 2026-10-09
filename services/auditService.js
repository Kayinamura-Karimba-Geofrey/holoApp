const SystemLog = require('../model/SystemLog');
const logger = require('../utils/logger');

// Records a security or admin event. Never throws: a failed audit write must
// not break the request that triggered it.
exports.log = async (action, { userId, req, ...details } = {}) => {
  try {
    await SystemLog.create({
      action,
      userId,
      details: { ...details, ...(req && { ip: req.ip, userAgent: req.get('user-agent') }) },
    });
  } catch (err) {
    logger.error({ err, action }, 'Failed to write audit log');
  }
};
