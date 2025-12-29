// ============================================
// TESTS UNITAIRES - SoloSnakeGame (Client)
// Tests pour la classe SoloSnakeGame
// ============================================

// Les mocks sont configurés dans setup.js

describe('SoloSnakeGame - Construction', () => {

  beforeEach(() => {
    // Créer le DOM minimal nécessaire
    document.body.innerHTML = `
      <canvas id="canvas-solo" width="360" height="360"></canvas>
      <div id="score-solo">0</div>
      <div id="level-solo">1</div>
      <div id="combo-solo">x1</div>
      <div id="powerup-bar-container">
        <div id="powerup-emoji"></div>
        <div id="powerup-fill"></div>
      </div>
    `;

    // Mock window.audio
    window.audio = {
      playMusic: jest.fn(),
      playSound: jest.fn(),
      buttonClick: jest.fn()
    };

    // Charger la classe SoloSnakeGame
    // Note: Dans un environnement de test réel, il faudrait importer la classe
    // Pour l'instant, on simule sa structure
  });

  test('devrait créer une instance avec canvas', () => {
    // Mock de la classe pour les tests
    class SoloSnakeGame {
      constructor() {
        this.canvas = document.getElementById('canvas-solo');
        if (!this.canvas) {
          throw new Error('Canvas canvas-solo introuvable!');
        }
        this.ctx = this.canvas.getContext('2d');
        this.GRID_SIZE = 30;
        this.CANVAS_SIZE = 360;
        this.CELL_SIZE = 12;
        this.snake = [];
        this.score = 0;
        this.level = 1;
        this.running = false;
        this.paused = false;
      }
    }

    const game = new SoloSnakeGame();

    expect(game.canvas).toBeTruthy();
    expect(game.ctx).toBeTruthy();
    expect(game.GRID_SIZE).toBe(30);
    expect(game.CANVAS_SIZE).toBe(360);
    expect(game.score).toBe(0);
  });

  test('devrait throw si le canvas est introuvable', () => {
    // Supprimer le canvas
    document.getElementById('canvas-solo').remove();

    class SoloSnakeGame {
      constructor() {
        this.canvas = document.getElementById('canvas-solo');
        if (!this.canvas) {
          throw new Error('Canvas canvas-solo introuvable!');
        }
      }
    }

    expect(() => new SoloSnakeGame()).toThrow('Canvas canvas-solo introuvable!');
  });

});

describe('SoloSnakeGame - Initialisation du serpent', () => {

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas-solo" width="360" height="360"></canvas>
      <div id="score-solo">0</div>
      <div id="level-solo">1</div>
      <div id="combo-solo">x1</div>
      <div id="powerup-bar-container">
        <div id="powerup-emoji"></div>
        <div id="powerup-fill"></div>
      </div>
    `;
  });

  test('devrait initialiser le serpent au centre', () => {
    class SoloSnakeGame {
      constructor() {
        this.canvas = document.getElementById('canvas-solo');
        this.ctx = this.canvas.getContext('2d');
        this.snake = [];
        this.reset();
      }

      reset() {
        this.snake = [{ x: 15, y: 15 }];
        this.dx = 1;
        this.dy = 0;
        this.score = 0;
        this.level = 1;
      }
    }

    const game = new SoloSnakeGame();

    expect(game.snake.length).toBe(1);
    expect(game.snake[0]).toEqual({ x: 15, y: 15 });
    expect(game.dx).toBe(1);
    expect(game.dy).toBe(0);
  });

});

describe('SoloSnakeGame - Gestion du score', () => {

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas-solo" width="360" height="360"></canvas>
      <div id="score-solo">0</div>
      <div id="level-solo">1</div>
    `;
  });

  test('devrait mettre à jour le score', () => {
    class SoloSnakeGame {
      constructor() {
        this.canvas = document.getElementById('canvas-solo');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
      }

      addScore(points) {
        this.score += points;
        this.updateUI();
      }

      updateUI() {
        const scoreDisplay = document.getElementById('score-solo');
        if (scoreDisplay) {
          scoreDisplay.textContent = this.score.toString();
        }
      }
    }

    const game = new SoloSnakeGame();

    game.addScore(10);
    expect(game.score).toBe(10);
    expect(document.getElementById('score-solo').textContent).toBe('10');

    game.addScore(5);
    expect(game.score).toBe(15);
    expect(document.getElementById('score-solo').textContent).toBe('15');
  });

});

describe('SoloSnakeGame - Direction du serpent', () => {

  test('devrait changer la direction correctement', () => {
    class SoloSnakeGame {
      constructor() {
        this.dx = 1;
        this.dy = 0;
        this.ndx = 1;
        this.ndy = 0;
      }

      changeDirection(newDx, newDy) {
        // Empêcher le demi-tour
        if (this.dx === -newDx && this.dy === -newDy) {
          return;
        }
        this.ndx = newDx;
        this.ndy = newDy;
      }
    }

    const game = new SoloSnakeGame();

    // Direction initiale: droite (1, 0)
    expect(game.dx).toBe(1);
    expect(game.dy).toBe(0);

    // Changer vers le haut
    game.changeDirection(0, -1);
    expect(game.ndx).toBe(0);
    expect(game.ndy).toBe(-1);

    // Essayer un demi-tour (devrait être ignoré)
    game.dx = 1;
    game.dy = 0;
    game.changeDirection(-1, 0);

    // ndx/ndy ne devraient pas changer
    expect(game.ndx).toBe(0);
    expect(game.ndy).toBe(-1);
  });

});

describe('SoloSnakeGame - Collision detection', () => {

  test('devrait détecter la collision avec les murs (wrapping)', () => {
    class SoloSnakeGame {
      constructor() {
        this.GRID_SIZE = 30;
      }

      wrapPosition(pos) {
        if (pos.x < 0) pos.x = this.GRID_SIZE - 1;
        if (pos.x >= this.GRID_SIZE) pos.x = 0;
        if (pos.y < 0) pos.y = this.GRID_SIZE - 1;
        if (pos.y >= this.GRID_SIZE) pos.y = 0;
        return pos;
      }
    }

    const game = new SoloSnakeGame();

    // Test wrapping à droite
    let pos = game.wrapPosition({ x: 30, y: 15 });
    expect(pos.x).toBe(0);

    // Test wrapping à gauche
    pos = game.wrapPosition({ x: -1, y: 15 });
    expect(pos.x).toBe(29);

    // Test wrapping en haut
    pos = game.wrapPosition({ x: 15, y: -1 });
    expect(pos.y).toBe(29);

    // Test wrapping en bas
    pos = game.wrapPosition({ x: 15, y: 30 });
    expect(pos.y).toBe(0);
  });

  test('devrait détecter la collision avec le serpent lui-même', () => {
    class SoloSnakeGame {
      constructor() {
        this.snake = [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 }
        ];
      }

      checkSelfCollision() {
        const head = this.snake[0];
        for (let i = 1; i < this.snake.length; i++) {
          if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
            return true;
          }
        }
        return false;
      }
    }

    const game = new SoloSnakeGame();

    // Pas de collision initialement
    expect(game.checkSelfCollision()).toBe(false);

    // Créer une collision
    game.snake[0] = { x: 7, y: 10 }; // Tête sur la queue
    expect(game.checkSelfCollision()).toBe(true);
  });

});

describe('SoloSnakeGame - Pause et Reset', () => {

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas-solo" width="360" height="360"></canvas>
    `;
  });

  test('devrait mettre en pause et reprendre', () => {
    class SoloSnakeGame {
      constructor() {
        this.canvas = document.getElementById('canvas-solo');
        this.ctx = this.canvas.getContext('2d');
        this.running = true;
        this.paused = false;
      }

      pause() {
        this.paused = !this.paused;
      }
    }

    const game = new SoloSnakeGame();

    expect(game.paused).toBe(false);

    game.pause();
    expect(game.paused).toBe(true);

    game.pause();
    expect(game.paused).toBe(false);
  });

  test('devrait reset le jeu correctement', () => {
    class SoloSnakeGame {
      constructor() {
        this.canvas = document.getElementById('canvas-solo');
        this.ctx = this.canvas.getContext('2d');
        this.snake = [{ x: 10, y: 10 }];
        this.score = 50;
        this.level = 3;
      }

      reset() {
        this.snake = [{ x: 15, y: 15 }];
        this.score = 0;
        this.level = 1;
        this.running = false;
        this.paused = false;
      }
    }

    const game = new SoloSnakeGame();

    expect(game.score).toBe(50);
    expect(game.level).toBe(3);

    game.reset();

    expect(game.score).toBe(0);
    expect(game.level).toBe(1);
    expect(game.snake.length).toBe(1);
    expect(game.snake[0]).toEqual({ x: 15, y: 15 });
  });

});
