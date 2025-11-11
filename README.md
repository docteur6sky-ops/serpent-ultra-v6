# Snake Ultra V6 - Multiplayer Snake Game

A modern multiplayer snake game built with WebSocket for real-time gameplay. Features solo mode, network multiplayer, and comprehensive test coverage.

## Features

- **Solo Mode**: Play alone against AI or time
- **Multiplayer Mode**: Real-time network multiplayer with WebSocket
- **Smart Collision Detection**: Self-collision, obstacle detection, player collision
- **Power-ups System**: Food for growth, skulls for shrinking
- **Mobile-Ready**: Built with Cordova for mobile deployment

## Tech Stack

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Testing**: Jest 29.7.0
- **CI/CD**: GitHub Actions, Git Hooks
- **Mobile**: Apache Cordova

## Quick Start

```bash
# Install dependencies
cd www
npm install

# Run tests
npm test

# Start server (development)
npm start
```

## Testing

### Test Suite Overview

Comprehensive test suite with **101 tests** covering all core game logic:

- **40 Unit Tests** - SnakeServer.js (Snake class)
- **35 Unit Tests** - Room.js (Multiplayer rooms)
- **26 Integration Tests** - Complete game flows

### Run Tests

```bash
cd www

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode (auto-rerun on changes)
npm run test:watch
```

### Coverage Metrics

| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **SnakeServer.js** | 95.58% | 88.09% | 100% | 96.49% |
| **Overall** | Core logic fully tested | | | |

**Thresholds**: 70% global coverage, 95% for SnakeServer.js

### CI/CD Automation

#### Pre-Commit Hook

Runs automatically before each commit (~2s):
- Unit tests (40 tests)
- Integration tests (26 tests)
- Console.log detection

**Bypass** (emergency only):
```bash
git commit -m "message" --no-verify
```

#### GitHub Actions

Automated testing on every push/PR:
- Tests on Node.js 16.x, 18.x, 20.x
- Code quality checks
- Coverage threshold validation
- Automatic artifact archiving (7 days)

See `.github/workflows/tests.yml` for configuration.

## Project Structure

```
snake-ultra-v6/
├── www/
│   ├── SnakeServer.js         # Snake class (core logic)
│   ├── server.js              # WebSocket server + Room manager
│   ├── solo-game.js           # Solo game client
│   ├── network-multiplayer.js # Multiplayer client
│   ├── Logger.js              # Custom logger
│   ├── tests/
│   │   ├── unit/              # Unit tests
│   │   └── integration/       # Integration tests
│   ├── jest.config.js         # Jest configuration
│   └── package.json           # Dependencies & scripts
├── .github/
│   └── workflows/
│       └── tests.yml          # GitHub Actions CI/CD
├── .git-hooks/
│   └── pre-commit             # Pre-commit hook script
└── CI-CD-SETUP.md            # CI/CD documentation
```

## Development

### Adding New Tests

1. Create test file in `www/tests/unit/` or `www/tests/integration/`
2. Follow AAA pattern (Arrange, Act, Assert)
3. Run tests: `npm test`
4. Commit - pre-commit hook runs automatically

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm test

# Commit (pre-commit hook runs automatically)
git add .
git commit -m "feat: your feature"

# Push to GitHub
git push origin feature/your-feature
```

### Configuration

**Git Hooks Setup** (for new developers):
```bash
chmod +x .git-hooks/pre-commit
git config core.hooksPath .git-hooks
```

**Coverage Thresholds** (edit `www/jest.config.js`):
```javascript
coverageThreshold: {
  global: {
    statements: 70,
    branches: 65,
    functions: 70,
    lines: 70
  }
}
```

## Documentation

- **[TESTS.md](TESTS.md)** - Detailed test documentation
- **[CI-CD-SETUP.md](CI-CD-SETUP.md)** - CI/CD configuration guide

## Statistics

| Metric | Value |
|--------|-------|
| Total Tests | 101 |
| Test Execution Time | <1s |
| Pre-commit Hook Time | ~2s |
| SnakeServer Coverage | 95.58% |
| CI/CD Platforms | GitHub Actions |
| Node.js Versions Tested | 16.x, 18.x, 20.x |

## License

All rights reserved.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for new features
4. Ensure all tests pass (101/101)
5. Submit a pull request

---

**Built with Claude Code** - AI-powered development assistant
