module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.js'],
  testTimeout: 60000,
  collectCoverageFrom: ['**/*.js', '!node_modules/**', '!coverage/**', '!tests/**', '!scripts/**', '!*.config.js'],
};
