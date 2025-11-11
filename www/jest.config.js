module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'SnakeServer.js',
    'server.js',
    'solo-game.js',
    'network-multiplayer.js'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/coverage/'],
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
