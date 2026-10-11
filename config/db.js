const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

// Fail fast instead of Mongoose's default 30s wait when MongoDB is unreachable.
const SERVER_SELECTION_TIMEOUT_MS = 5000;

// Hide credentials when logging the connection string.
const redact = (uri) => uri.replace(/\/\/[^@/]*@/, '//***@');

exports.connectDB = async (uri = config.mongoUri) => {
  logger.info(`Connecting to MongoDB at ${redact(uri)}`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });
  } catch (err) {
    throw new Error(
      `Could not connect to MongoDB at ${redact(uri)} (${err.message}). ` +
        'Is it running? Try `docker compose up -d mongo redis`.',
      { cause: err },
    );
  }
  logger.info('MongoDB connected');
};

exports.disconnectDB = () => mongoose.disconnect();
