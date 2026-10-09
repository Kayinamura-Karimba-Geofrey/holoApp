const mongoose = require('mongoose');
const config = require('./env');

exports.connectDB = async (uri = config.mongoUri) => {
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

exports.disconnectDB = () => mongoose.disconnect();
