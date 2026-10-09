const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, disconnectDB } = require('../config/db');
const app = require('../server');
const User = require('../model/user');

let mongo;

// Call at the top of each test file: one in-memory MongoDB per file.
exports.useDatabase = () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDB(mongo.getUri());
  });
  afterAll(async () => {
    await disconnectDB();
    await mongo.stop();
  });
};

exports.app = app;
exports.auth = (token) => ({ Authorization: `Bearer ${token}` });

// Registers (if needed) and logs in; returns { token, refreshToken, user }.
exports.signIn = async (email, { admin = false, password = 'a-long-test-password' } = {}) => {
  await request(app).post('/auth/register').send({ email, password });
  if (admin) await User.updateOne({ email }, { role: 'admin' });
  const res = await request(app).post('/auth/login').send({ email, password });
  return res.body;
};
