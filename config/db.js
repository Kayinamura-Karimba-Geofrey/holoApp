const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

exports.connectDB = async (uri = config.mongoUri) => {
  await mongoose.connect(uri);
  logger.info('MongoDB connected');
};

exports.disconnectDB = () => mongoose.disconnect();
