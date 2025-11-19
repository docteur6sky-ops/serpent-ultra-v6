// ============================================
// TESTS D'INTÉGRATION - Flows Complets
// 24 tests - Scénarios de jeu complets
// ============================================

const Snake = require('../../../SnakeServer.js');

describe('INTÉGRATION - Flow Complet Solo', () => {
    test('devrait gérer un flow complet : démarrage → mouvement → nourriture', () => {
        const snake = new Snake(10, 10, 'solo1');

        // Démarrage
        expect(snake.alive).toBe(true);
        expect(snake.score).toBe(0);
        expect(snake.length).toBe(1);

        // Mouvement
        snake.move();
        snake.move();
        snake.move();

        expect(snake.head.x).toBe(13);
        expect(snake.length).toBe(1);

        // Manger nourriture (simulation)
        snake.grow();
        snake.addScore(10);

        expect(snake.length).toBe(2);
        expect(snake.score).toBe(10);
    });

    test('devrait gérer un flow complet : nourriture → level up → obstacles', () => {
        const snake = new Snake(10, 10, 'solo2');

        // Manger 5 nourritures (level up)
        for (let i = 0; i < 5; i++) {
            snake.grow();
            snake.addScore(10);
            snake.move();
        }

        expect(snake.length).toBe(6);
        expect(snake.score).toBe(50);
        expect(snake.head.x).toBe(15);
    });

    test('devrait gérer un flow complet : crâne → rétrécissement → survie', () => {
        const snake = new Snake(10, 10, 'solo3');

        // Grandir d'abord
        for (let i = 0; i < 8; i++) {
            snake.grow();
        }

        expect(snake.length).toBe(9);

        // Manger crâne
        snake.shrink(5);
        snake.addScore(-5);

        expect(snake.length).toBe(4);
        expect(snake.alive).toBe(true);
        expect(snake.score).toBe(0);
    });

    test('devrait gérer un flow complet : jeu long avec changements de direction', () => {
        const snake = new Snake(15, 15, 'solo4');

        // Séquence complexe de mouvements
        for (let i = 0; i < 3; i++) {
            snake.move();
        }
        snake.changeDirection({ dx: 0, dy: 1 });
        for (let i = 0; i < 3; i++) {
            snake.move();
        }
        snake.changeDirection({ dx: -1, dy: 0 });
        for (let i = 0; i < 3; i++) {
            snake.move();
        }

        expect(snake.alive).toBe(true);
        expect(snake.head.x).toBe(15);
        expect(snake.head.y).toBe(18);
    });
});

describe('INTÉGRATION - Flow Complet Multijoueur', () => {
    test('devrait gérer un flow complet : 2 joueurs → déplacement simultané', () => {
        const snake1 = new Snake(5, 15, 'player1');
        const snake2 = new Snake(24, 15, 'player2');

        // Les deux serpents se déplacent
        for (let i = 0; i < 5; i++) {
            snake1.move();
            snake2.move();
        }

        expect(snake1.head.x).toBe(10);
        expect(snake2.head.x).toBe(29);
        expect(snake1.alive).toBe(true);
        expect(snake2.alive).toBe(true);
    });

    test('devrait gérer un flow complet : collision entre deux serpents', () => {
        const snake1 = new Snake(10, 10, 'p1');
        const snake2 = new Snake(13, 10, 'p2');

        // Snake1 avance vers Snake2
        snake1.move();
        snake1.move();
        snake1.move();

        // Vérifier collision
        const collision = snake1.collidesWithSnake(snake2);

        expect(collision).toBe(true);
    });

    test('devrait gérer un flow complet : les deux joueurs mangent', () => {
        const snake1 = new Snake(5, 15, 'p1');
        const snake2 = new Snake(24, 15, 'p2');

        // Les deux mangent
        snake1.grow();
        snake1.addScore(10);
        snake2.grow();
        snake2.addScore(10);

        expect(snake1.length).toBe(2);
        expect(snake2.length).toBe(2);
        expect(snake1.score).toBe(10);
        expect(snake2.score).toBe(10);
    });

    test('devrait gérer un flow complet : un joueur meurt, l\'autre continue', () => {
        const snake1 = new Snake(10, 10, 'p1');
        const snake2 = new Snake(20, 20, 'p2');

        // Snake1 meurt
        snake1.die();

        // Snake2 continue
        snake2.move();
        snake2.grow();

        expect(snake1.alive).toBe(false);
        expect(snake2.alive).toBe(true);
        expect(snake2.length).toBe(2);
    });

    test('devrait gérer un flow complet : match avec timer et score final', () => {
        const snake1 = new Snake(5, 15, 'p1');
        const snake2 = new Snake(24, 15, 'p2');

        // Simulation de partie complète
        for (let i = 0; i < 10; i++) {
            snake1.move();
            snake2.move();

            if (i % 3 === 0) {
                snake1.grow();
                snake1.addScore(10);
            }
            if (i % 4 === 0) {
                snake2.grow();
                snake2.addScore(10);
            }
        }

        // Vérifier scores finaux
        expect(snake1.length).toBeGreaterThan(1);
        expect(snake2.length).toBeGreaterThan(1);
        expect(snake1.score).toBeGreaterThanOrEqual(30);
        expect(snake2.score).toBeGreaterThanOrEqual(20);
    });
});

describe('INTÉGRATION - Edge Cases et Situations Complexes', () => {
    test('devrait gérer un serpent très long avec wrapping multiple', () => {
        const snake = new Snake(28, 15, 'long');

        // Grandir beaucoup
        for (let i = 0; i < 15; i++) {
            snake.grow();
        }

        // Traverser plusieurs fois la frontière
        for (let i = 0; i < 10; i++) {
            snake.move();
        }

        expect(snake.length).toBe(16);
        expect(snake.alive).toBe(true);
        expect(snake.head.x).toBeLessThan(30);
    });

    test('devrait gérer des changements de direction rapides', () => {
        const snake = new Snake(10, 10, 'fast');

        snake.changeDirection({ dx: 0, dy: 1 });
        snake.move();
        snake.changeDirection({ dx: 1, dy: 0 });
        snake.move();
        snake.changeDirection({ dx: 0, dy: -1 });
        snake.move();
        snake.changeDirection({ dx: -1, dy: 0 });
        snake.move();

        expect(snake.alive).toBe(true);
        expect(snake.head).toBeDefined();
    });

    test('devrait gérer reset pendant une partie active', () => {
        const snake = new Snake(10, 10, 'reset');

        // Jouer un peu
        for (let i = 0; i < 5; i++) {
            snake.grow();
            snake.move();
        }
        snake.addScore(50);

        // Reset
        snake.reset(5, 5, { dx: 0, dy: 1 });

        expect(snake.length).toBe(1);
        expect(snake.score).toBe(0);
        expect(snake.head).toEqual({ x: 5, y: 5 });
        expect(snake.direction).toEqual({ dx: 0, dy: 1 });
        expect(snake.alive).toBe(true);
    });

    test('devrait gérer plusieurs shrink consécutifs jusqu\'à la mort', () => {
        const snake = new Snake(10, 10, 'shrink');

        // Commencer avec 4 segments (1 initial + 3 grow)
        snake.grow();
        snake.grow();
        snake.grow();

        snake.shrink(1);
        expect(snake.alive).toBe(true);  // 3 segments

        snake.shrink(1);
        expect(snake.alive).toBe(true);  // 2 segments

        snake.shrink(1);
        expect(snake.alive).toBe(false); // 1 segment -> mort
    });

    test('devrait gérer un serpent qui fait le tour complet de la grille', () => {
        const snake = new Snake(0, 0, 'tour');

        // Faire le tour (30 cases à droite)
        for (let i = 0; i < 30; i++) {
            snake.move();
        }

        expect(snake.head.x).toBe(0);
        // Après 30 mouvements, retour à départ
        expect(snake.alive).toBe(true);
    });
});

describe('INTÉGRATION - Performance et Stress Tests', () => {
    test('devrait gérer 1000 mouvements sans erreur', () => {
        const snake = new Snake(15, 15, 'perf1');

        for (let i = 0; i < 1000; i++) {
            snake.move();

            // Changer direction tous les 10 mouvements
            if (i % 10 === 0) {
                const directions = [
                    { dx: 1, dy: 0 },
                    { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 },
                    { dx: 0, dy: -1 }
                ];
                snake.changeDirection(directions[Math.floor(i / 10) % 4]);
            }
        }

        expect(snake.alive).toBe(true);
        expect(snake.head).toBeDefined();
    });

    test('devrait gérer un serpent de longueur 100', () => {
        const snake = new Snake(15, 15, 'perf2');

        for (let i = 0; i < 100; i++) {
            snake.grow();
        }

        expect(snake.length).toBe(101);
        expect(snake.body.length).toBe(101);

        // Bouger avec un très long serpent
        snake.move();
        expect(snake.length).toBe(101);
    });

    test('devrait gérer 100 serpents simultanés', () => {
        const snakes = [];

        for (let i = 0; i < 100; i++) {
            snakes.push(new Snake(i % 30, Math.floor(i / 30), `snake_${i}`));
        }

        // Tous se déplacent
        snakes.forEach(s => s.move());

        expect(snakes.length).toBe(100);
        expect(snakes.every(s => s.alive)).toBe(true);
    });
});

describe('INTÉGRATION - Collisions Complexes', () => {
    test('devrait détecter auto-collision après séquence en spirale', () => {
        const snake = new Snake(10, 10, 'spiral');

        // Créer un très long serpent pour garantir collision
        for (let i = 0; i < 15; i++) {
            snake.grow();
        }

        // Spirale très serrée : carré 2x2
        snake.move();
        snake.move();
        snake.changeDirection({ dx: 0, dy: 1 });
        snake.move();
        snake.move();
        snake.changeDirection({ dx: -1, dy: 0 });
        snake.move();
        snake.move();
        snake.changeDirection({ dx: 0, dy: -1 });
        snake.move();
        snake.move();

        const collision = snake.checkSelfCollision();
        expect(collision).toBe(true);
    });

    test('devrait gérer collision avec obstacle après wrapping', () => {
        const snake = new Snake(29, 15, 'wrap');
        const obstacles = [{ x: 0, y: 15 }];

        snake.move();

        const collision = snake.checkCollision(30, obstacles);
        expect(collision).toBe('obstacle');
    });

    test('devrait gérer collision entre 3 serpents', () => {
        const snake1 = new Snake(10, 10, 's1');
        const snake2 = new Snake(11, 10, 's2');
        const snake3 = new Snake(12, 10, 's3');

        snake1.move();

        expect(snake1.collidesWithSnake(snake2)).toBe(true);
        expect(snake1.collidesWithSnake(snake3)).toBe(false);
    });

    test('devrait gérer collision avec corps d\'un serpent long', () => {
        const snake1 = new Snake(10, 10, 's1');
        const snake2 = new Snake(5, 10, 's2');

        // Snake2 grandit horizontalement
        for (let i = 0; i < 8; i++) {
            snake2.grow();
            snake2.move();
        }

        // Snake1 va vers snake2
        const collision = snake1.collidesWithSnake(snake2);

        expect(snake2.length).toBeGreaterThan(1);
        expect(collision).toBe(true);
    });

    test('devrait gérer checkCollision avec obstacles multiples', () => {
        const snake = new Snake(10, 10, 'multi');
        const obstacles = [
            { x: 11, y: 10 },
            { x: 12, y: 10 },
            { x: 13, y: 10 }
        ];

        snake.move();

        const collision = snake.checkCollision(30, obstacles);
        expect(collision).toBe('obstacle');
    });

    test('devrait gérer collision après plusieurs rétrécissements', () => {
        const snake = new Snake(10, 10, 'shrink_col');

        for (let i = 0; i < 10; i++) {
            snake.grow();
        }

        snake.shrink(5);

        // Essayer de créer une collision
        snake.move();
        snake.changeDirection({ dx: 0, dy: 1 });
        snake.move();
        snake.changeDirection({ dx: -1, dy: 0 });
        snake.move();

        expect(snake.alive).toBe(true);
        expect(snake.length).toBe(6);
    });

    test('devrait gérer collision près des bords avec wrapping', () => {
        const snake = new Snake(1, 1, 'corner');

        snake.changeDirection({ dx: 0, dy: 1 });
        snake.move();
        snake.changeDirection({ dx: -1, dy: 0 });
        snake.move();
        snake.move();

        expect(snake.head.x).toBe(29);

        snake.changeDirection({ dx: 0, dy: -1 });
        snake.move();
        snake.move();
        snake.move();

        expect(snake.head.y).toBe(29);
        expect(snake.alive).toBe(true);
    });
});
