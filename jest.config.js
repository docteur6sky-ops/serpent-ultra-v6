module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'SnakeServer.js',
    'server.js',
    'www/solo-game.js',
    'www/network-multiplayer.js'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/backup-structure-avant/',
    '/www/tests/',
    '/tests/unit-client/',
    '/tests/e2e/',
    '/android/',
    '/old-backups/'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70
    },
    './SnakeServer.js': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    }
  },
  testTimeout: 5000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true
};
