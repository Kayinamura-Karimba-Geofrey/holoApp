// Runs before each test file, ahead of config/env.js validation.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://unused-in-tests';
process.env.JWT_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
delete process.env.AI_API_KEY;
