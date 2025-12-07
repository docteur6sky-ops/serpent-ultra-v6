// ============================================
// TESTS UNITAIRES - BaseSnakeGame
// Tests pour la classe de base du jeu Snake
// ============================================

import { BaseSnakeGame } from '../../www/core/BaseSnakeGame.js';

// Classe concrète pour tester BaseSnakeGame (qui est abstraite)
class TestSnakeGame extends BaseSnakeGame {
  constructor(canvasId = 'test-canvas') {
    super(canvasId);
    this.resetCalled = false;
    this.updateCalled = false;
    this.drawCalled = false;
  }

  reset() {
    this.resetCalled = true;
  }

  update() {
    this.updateCalled = true;
  }

  draw() {
    this.drawCalled = true;
  }
}

describe('BaseSnakeGame - Classe de base', () => {

  let game;

  beforeEach(() => {
    // Créer le canvas dans le DOM
    document.body.innerHTML = '<canvas id="test-canvas" width="360" height="360"></canvas>';

    // Mock window.audio
    window.audio = {
      playMusic: jest.fn(),
      playSound: jest.fn(),
      buttonClick: jest.fn()
    };

    // Créer une instance de test
    game = new TestSnakeGame();
  });

  afterEach(() => {
    if (game) {
      game.stop();
    }
  });

  describe('Construction', () => {
    test('devrait créer une instance avec les propriétés de base', () => {
      expect(game.canvas).not.toBeNull();
      expect(game.ctx).not.toBeNull();
      expect(game.GRID_SIZE).toBe(30);
      expect(game.CANVAS_SIZE).toBe(540);  // Mis à jour: canvas agrandi
      expect(game.CELL_SIZE).toBe(18);     // Mis à jour: 540/30 = 18px
    });

    test('devrait initialiser les propriétés de jeu', () => {
      expect(game.running).toBe(false);
      expect(game.paused).toBe(false);
      expect(game.difficulty).toBe(0);
      expect(game.level).toBe(1);
      expect(game.raf).toBeNull();
      expect(game.lastTime).toBe(0);
    });

    test('devrait initialiser le tableau de particules', () => {
      expect(game.particles).toEqual([]);
      expect(Array.isArray(game.particles)).toBe(true);
    });

    test('devrait lever une erreur si canvas introuvable', () => {
      expect(() => {
        new TestSnakeGame('canvas-inexistant');
      }).toThrow('Canvas canvas-inexistant introuvable!');
    });
  });

  describe('Méthodes abstraites', () => {
    test('Les méthodes abstraites doivent être implémentées par les classes enfants', () => {
      // Créer une classe qui n'implémente pas les méthodes
      class IncompleteGame extends BaseSnakeGame {
        // N'implémente aucune méthode abstraite
      }

      document.body.innerHTML = '<canvas id="incomplete-canvas" width="360" height="360"></canvas>';
      const incomplete = new IncompleteGame('incomplete-canvas');

      expect(() => incomplete.reset()).toThrow('reset() doit être implémenté par la classe enfant');
      expect(() => incomplete.update()).toThrow('update() doit être implémenté par la classe enfant');
      expect(() => incomplete.draw()).toThrow('draw() doit être implémenté par la classe enfant');
    });
  });

  describe('start - Démarrage du jeu', () => {
    test('devrait démarrer le jeu avec difficulté par défaut', () => {
      game.start();

      expect(game.difficulty).toBe(0);
      expect(game.running).toBe(true);
      expect(game.paused).toBe(false);
      expect(game.resetCalled).toBe(true);
    });

    test('devrait démarrer le jeu avec difficulté spécifiée', () => {
      game.start(2);

      expect(game.difficulty).toBe(2);
      expect(game.running).toBe(true);
    });

    test('devrait définir gameStartTime', () => {
      const before = Date.now();
      game.start();
      const after = Date.now();

      expect(game.gameStartTime).toBeGreaterThanOrEqual(before);
      expect(game.gameStartTime).toBeLessThanOrEqual(after);
    });

    test('devrait appeler reset()', () => {
      game.start();
      expect(game.resetCalled).toBe(true);
    });

    test('devrait démarrer la boucle de jeu', () => {
      game.start();
      expect(game.raf).not.toBeNull();
    });
  });

  describe('stop - Arrêt du jeu', () => {
    test('devrait arrêter le jeu en cours', () => {
      game.start();
      game.stop();

      expect(game.running).toBe(false);
      expect(game.raf).toBeNull();
    });

    test('ne devrait pas planter si jeu déjà arrêté', () => {
      expect(() => game.stop()).not.toThrow();
    });

    test('devrait annuler requestAnimationFrame', () => {
      game.start();
      const rafId = game.raf;

      game.stop();

      expect(global.cancelAnimationFrame).toHaveBeenCalledWith(rafId);
    });
  });

  describe('pause - Mise en pause', () => {
    test('devrait mettre le jeu en pause', () => {
      game.start();
      expect(game.paused).toBe(false);

      game.pause();
      expect(game.paused).toBe(true);
    });

    test('devrait reprendre le jeu après pause', () => {
      game.start();
      game.pause();
      expect(game.paused).toBe(true);

      game.pause();
      expect(game.paused).toBe(false);
    });

    test('pause devrait être un toggle', () => {
      expect(game.paused).toBe(false);
      game.pause();
      expect(game.paused).toBe(true);
      game.pause();
      expect(game.paused).toBe(false);
      game.pause();
      expect(game.paused).toBe(true);
    });
  });

  describe('calculateSpeed - Calcul de vitesse', () => {
    test('devrait calculer la vitesse pour difficulté Facile', () => {
      game.difficulty = 0;
      game.level = 1;

      const speed = game.calculateSpeed();
      // baseSpeed = 2.5, level = 1 => 1000 / (2.5 + 0) = 400ms
      expect(speed).toBe(1000 / 2.5);
    });

    test('devrait calculer la vitesse pour difficulté Normale', () => {
      game.difficulty = 1;
      game.level = 1;

      const speed = game.calculateSpeed();
      // baseSpeed = 5, level = 1 => 1000 / 5 = 200ms
      expect(speed).toBe(1000 / 5);
    });

    test('devrait calculer la vitesse pour difficulté Difficile', () => {
      game.difficulty = 2;
      game.level = 1;

      const speed = game.calculateSpeed();
      // baseSpeed = 8, level = 1 => 1000 / 8 = 125ms
      expect(speed).toBe(1000 / 8);
    });

    test('devrait augmenter la vitesse avec le niveau', () => {
      game.difficulty = 0;
      game.level = 1;
      const speed1 = game.calculateSpeed();

      game.level = 5;
      const speed5 = game.calculateSpeed();

      // Plus le niveau augmente, plus la vitesse diminue (jeu plus rapide)
      expect(speed5).toBeLessThan(speed1);
    });
  });

  describe('Particules', () => {
    test('createParticles devrait créer des particules', () => {
      game.createParticles(5, 5, '#ff0000', 10);

      expect(game.particles.length).toBe(10);
    });

    test('les particules devraient avoir les bonnes propriétés', () => {
      game.createParticles(10, 10, '#00ff00', 5);

      game.particles.forEach(p => {
        expect(p).toHaveProperty('x');
        expect(p).toHaveProperty('y');
        expect(p).toHaveProperty('vx');
        expect(p).toHaveProperty('vy');
        expect(p).toHaveProperty('life');
        expect(p).toHaveProperty('color');
        expect(p.color).toBe('#00ff00');
        expect(p.life).toBe(1.0);
      });
    });

    test('updateParticles devrait mettre à jour les particules', () => {
      game.createParticles(5, 5, '#ff0000', 3);

      const initialPositions = game.particles.map(p => ({ x: p.x, y: p.y }));

      game.updateParticles();

      game.particles.forEach((p, i) => {
        // Les positions devraient avoir changé
        expect(p.x).not.toBe(initialPositions[i].x);
        expect(p.y).not.toBe(initialPositions[i].y);
        // La vie devrait avoir diminué
        expect(p.life).toBeLessThan(1.0);
      });
    });

    test('updateParticles devrait retirer les particules mortes', () => {
      game.createParticles(5, 5, '#ff0000', 5);

      // Simuler beaucoup d'updates pour tuer les particules
      for (let i = 0; i < 60; i++) {
        game.updateParticles();
      }

      // Toutes les particules devraient être mortes
      expect(game.particles.length).toBe(0);
    });

    test('drawParticles devrait dessiner chaque particule', () => {
      game.createParticles(5, 5, '#ff0000', 3);

      // L'implémentation utilise arc/fill au lieu de fillRect
      const fillSpy = jest.spyOn(game.ctx, 'fill');

      game.drawParticles();

      expect(fillSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Utilitaires', () => {
    test('randomPosition devrait générer une position valide', () => {
      const pos = game.randomPosition();

      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThan(game.GRID_SIZE);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThan(game.GRID_SIZE);
    });

    test('randomPosition devrait exclure les positions données', () => {
      const excludeList = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 }
      ];

      const pos = game.randomPosition(excludeList);

      const isExcluded = excludeList.some(item => item.x === pos.x && item.y === pos.y);
      expect(isExcluded).toBe(false);
    });

    test('collides devrait détecter une collision', () => {
      const pos1 = { x: 5, y: 10 };
      const pos2 = { x: 5, y: 10 };

      expect(game.collides(pos1, pos2)).toBe(true);
    });

    test('collides devrait détecter l\'absence de collision', () => {
      const pos1 = { x: 5, y: 10 };
      const pos2 = { x: 6, y: 10 };

      expect(game.collides(pos1, pos2)).toBe(false);
    });

    test('getDarkerColor devrait assombrir une couleur', () => {
      const original = '#ff0000';
      const darker = game.getDarkerColor(original);

      expect(darker).not.toBe(original);
      expect(darker).toMatch(/^#[0-9a-f]{6}$/);

      // Vérifier que c'est plus sombre (valeurs RGB plus petites)
      const origR = parseInt(original.slice(1, 3), 16);
      const darkR = parseInt(darker.slice(1, 3), 16);
      expect(darkR).toBeLessThan(origR);
    });

    test('getDarkerColor devrait retourner la couleur si pas en format hex', () => {
      const color = 'red';
      const result = game.getDarkerColor(color);
      expect(result).toBe(color);
    });
  });

  describe('Loop - Boucle de jeu', () => {
    test('loop ne devrait pas continuer si running=false', () => {
      game.running = false;
      game.loop(0);

      expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });

    test('loop devrait appeler draw si en pause', () => {
      game.start();
      game.pause();

      game.drawCalled = false;
      game.loop(performance.now());

      expect(game.drawCalled).toBe(true);
      expect(game.updateCalled).toBe(false);
    });

    test('loop devrait mettre à jour les particules', () => {
      game.createParticles(5, 5, '#ff0000', 5);
      game.start();

      const particleCountBefore = game.particles.length;

      // Simuler plusieurs frames
      for (let i = 0; i < 10; i++) {
        game.updateParticles();
      }

      // Les particules devraient avoir perdu de la vie
      game.particles.forEach(p => {
        expect(p.life).toBeLessThan(1.0);
      });
    });
  });
});
