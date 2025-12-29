// Configuration Jest pour les tests client (frontend)
module.exports = {
  testEnvironment: 'jsdom',
  displayName: 'client',
  coverageDirectory: 'coverage-client',
  collectCoverageFrom: [
    'www/**/*.js',
    '!www/tests/**',
    '!www/**/*.min.js'
  ],
  testMatch: ['**/tests/unit-client/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/backup-structure-avant/',
    '/tests/unit/',
    '/tests/integration/',
    '/tests/e2e/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/unit-client/setup.js'],
  testTimeout: 5000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true
};
