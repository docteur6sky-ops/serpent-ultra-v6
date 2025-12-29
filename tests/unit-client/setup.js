// ============================================
// SETUP POUR TESTS CLIENT (JSDOM)
// Mocks globaux pour l'environnement navigateur
// ============================================

// Mock HTMLCanvasElement
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
  }));
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  return setTimeout(cb, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock performance.now
if (!global.performance) {
  global.performance = {};
}
global.performance.now = jest.fn(() => Date.now());

// Mock window.audio
global.audio = {
  playMusic: jest.fn(),
  playSound: jest.fn(),
  buttonClick: jest.fn(),
  init: jest.fn()
};

// Supprimer les warnings console pour les tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
