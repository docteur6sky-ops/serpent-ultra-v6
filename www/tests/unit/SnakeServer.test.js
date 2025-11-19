// Tests simplifiés SnakeServer - 40 tests essentiels
const Snake = require('../../../SnakeServer.js');

describe('Construction', () => {
    test('créer serpent', () => {
        const s = new Snake(10, 15, 'p1');
        expect(s.playerId).toBe('p1');
        expect(s.alive).toBe(true);
    });

    test('position initiale', () => {
        const s = new Snake(5, 5, 'p1');
        expect(s.head).toEqual({ x: 5, y: 5 });
        expect(s.length).toBe(1);
    });

    test('direction par défaut', () => {
        const s = new Snake(10, 10, 'p1');
        expect(s.direction).toEqual({ dx: 1, dy: 0 });
    });
});

describe('Déplacement', () => {
    test('move droite', () => {
        const s = new Snake(10, 10, 'p1');
        s.move();
        expect(s.head.x).toBe(11);
    });

    test('move haut', () => {
        const s = new Snake(10, 10, 'p1');
        s.changeDirection({ dx: 0, dy: -1 });
        s.move();
        expect(s.head.y).toBe(9);
    });

    test('move bas', () => {
        const s = new Snake(10, 10, 'p1');
        s.changeDirection({ dx: 0, dy: 1 });
        s.move();
        expect(s.head.y).toBe(11);
    });

    test('wrapping droite', () => {
        const s = new Snake(29, 10, 'p1');
        s.move();
        expect(s.head.x).toBe(0);
    });

    test('wrapping haut', () => {
        const s = new Snake(10, 0, 'p1');
        s.changeDirection({ dx: 0, dy: -1 });
        s.move();
        expect(s.head.y).toBe(29);
    });

    test('wrapping bas', () => {
        const s = new Snake(10, 29, 'p1');
        s.changeDirection({ dx: 0, dy: 1 });
        s.move();
        expect(s.head.y).toBe(0);
    });

    test('pas de move si mort', () => {
        const s = new Snake(10, 10, 'p1');
        s.die();
        const pos = { ...s.head };
        s.move();
        expect(s.head).toEqual(pos);
    });
});

describe('Direction', () => {
    test('change direction', () => {
        const s = new Snake(10, 10, 'p1');
        s.changeDirection({ dx: 0, dy: 1 });
        s.move();
        expect(s.direction).toEqual({ dx: 0, dy: 1 });
    });

    test('bloque demi-tour', () => {
        const s = new Snake(10, 10, 'p1');
        s.changeDirection({ dx: -1, dy: 0 });
        s.move();
        expect(s.direction).toEqual({ dx: 1, dy: 0 });
    });

    test('permet 90deg', () => {
        const s = new Snake(10, 10, 'p1');
        s.changeDirection({ dx: 0, dy: -1 });
        s.move();
        expect(s.direction.dy).toBe(-1);
    });
});

describe('Croissance', () => {
    test('grow ajoute segment', () => {
        const s = new Snake(10, 10, 'p1');
        s.grow();
        expect(s.length).toBe(2);
    });

    test('grow garde queue', () => {
        const s = new Snake(10, 10, 'p1');
        s.grow();
        expect(s.body[1]).toEqual({ x: 10, y: 10 });
    });

    test('grow bloqué si mort', () => {
        const s = new Snake(10, 10, 'p1');
        s.die();
        const len = s.length;
        s.grow();
        expect(s.length).toBe(len);
    });

    test('plusieurs grow', () => {
        const s = new Snake(10, 10, 'p1');
        for (let i = 0; i < 5; i++) s.grow();
        expect(s.length).toBe(6);
    });
});

describe('Rétrécissement', () => {
    test('shrink retire segments', () => {
        const s = new Snake(10, 10, 'p1');
        for (let i = 0; i < 5; i++) s.grow();
        s.shrink(3);
        expect(s.length).toBe(3);
    });

    test('shrink tue si trop petit', () => {
        const s = new Snake(10, 10, 'p1');
        s.shrink(1);
        expect(s.alive).toBe(false);
    });

    test('shrink limite à 1', () => {
        const s = new Snake(10, 10, 'p1');
        s.shrink(10);
        expect(s.length).toBeGreaterThanOrEqual(1);
    });
});

describe('Collisions', () => {
    test('auto-collision', () => {
        const s = new Snake(10, 10, 'p1');
        for (let i = 0; i < 4; i++) s.grow();
        s.move();
        s.changeDirection({ dx: 0, dy: -1 });
        s.move();
        s.changeDirection({ dx: -1, dy: 0 });
        s.move();
        s.changeDirection({ dx: 0, dy: 1 });
        s.move();
        expect(s.checkSelfCollision()).toBe(true);
    });

    test('pas collision si petit', () => {
        const s = new Snake(10, 10, 'p1');
        expect(s.checkSelfCollision()).toBe(false);
    });

    test('collision obstacle', () => {
        const s = new Snake(10, 10, 'p1');
        const obs = [{ x: 11, y: 10 }];
        s.move();
        expect(s.checkCollision(30, obs)).toBe('obstacle');
    });

    test('collision autre serpent', () => {
        const s1 = new Snake(10, 10, 'p1');
        const s2 = new Snake(11, 10, 'p2');
        s1.move();
        expect(s1.collidesWithSnake(s2)).toBe(true);
    });

    test('pas collision éloigné', () => {
        const s1 = new Snake(10, 10, 'p1');
        const s2 = new Snake(20, 20, 'p2');
        expect(s1.collidesWithSnake(s2)).toBe(false);
    });
});

describe('Score', () => {
    test('addScore', () => {
        const s = new Snake(10, 10, 'p1');
        s.addScore(10);
        expect(s.score).toBe(10);
    });

    test('score négatif plafonné', () => {
        const s = new Snake(10, 10, 'p1');
        s.addScore(-5);
        expect(s.score).toBe(0);
    });

    test('die', () => {
        const s = new Snake(10, 10, 'p1');
        s.die();
        expect(s.alive).toBe(false);
    });

    test('reset', () => {
        const s = new Snake(10, 10, 'p1');
        s.grow();
        s.addScore(50);
        s.die();
        s.reset(5, 5);
        expect(s.alive).toBe(true);
        expect(s.score).toBe(0);
        expect(s.length).toBe(1);
    });
});

describe('Utilitaires', () => {
    test('headAt', () => {
        const s = new Snake(10, 10, 'p1');
        expect(s.headAt(10, 10)).toBe(true);
        expect(s.headAt(11, 10)).toBe(false);
    });

    test('isAt', () => {
        const s = new Snake(10, 10, 'p1');
        s.grow();
        s.move();
        expect(s.isAt(11, 10)).toBe(true);
        expect(s.isAt(5, 5)).toBe(false);
    });

    test('toJSON', () => {
        const s = new Snake(10, 10, 'player1');
        s.addScore(25);
        const json = s.toJSON();
        expect(json.id).toBe('player1');
        expect(json.score).toBe(25);
        expect(json.alive).toBe(true);
    });

    test('length getter', () => {
        const s = new Snake(10, 10, 'p1');
        expect(s.length).toBe(s.body.length);
        s.grow();
        expect(s.length).toBe(s.body.length);
    });

    test('head getter', () => {
        const s = new Snake(10, 10, 'p1');
        expect(s.head).toBe(s.body[0]);
    });
});

describe('Scénarios', () => {
    test('séquence complète', () => {
        const s = new Snake(10, 10, 'p1');
        s.move();
        s.changeDirection({ dx: 0, dy: 1 });
        s.move();
        expect(s.alive).toBe(true);
    });

    test('grandir en bougeant', () => {
        const s = new Snake(10, 10, 'p1');
        s.grow();
        s.move();
        s.grow();
        s.move();
        expect(s.length).toBe(3);
    });

    test('wrapping long serpent', () => {
        const s = new Snake(28, 15, 'p1');
        for (let i = 0; i < 5; i++) s.grow();
        for (let i = 0; i < 3; i++) s.move();
        expect(s.head.x).toBe(1);
    });

    test('préserve playerId', () => {
        const s = new Snake(10, 10, 'p123');
        s.reset(5, 5);
        expect(s.playerId).toBe('p123');
    });

    test('grow/shrink mix', () => {
        const s = new Snake(10, 10, 'p1');
        for (let i = 0; i < 10; i++) s.grow();
        s.shrink(5);
        for (let i = 0; i < 3; i++) s.grow();
        expect(s.length).toBe(9);
    });

    test('nextDirection', () => {
        const s = new Snake(10, 10, 'p1');
        s.changeDirection({ dx: 0, dy: 1 });
        expect(s.nextDirection).toEqual({ dx: 0, dy: 1 });
        s.move();
        expect(s.direction).toEqual({ dx: 0, dy: 1 });
    });

    test('collision après shrink', () => {
        const s = new Snake(10, 10, 'p1');
        for (let i = 0; i < 5; i++) s.grow();
        s.shrink(3);
        expect(s.alive).toBe(true);
        expect(s.length).toBe(3);
    });

    test('cohérence corps', () => {
        const s = new Snake(10, 10, 'p1');
        for (let i = 0; i < 3; i++) s.grow();
        for (let i = 0; i < 5; i++) s.move();
        expect(s.body.length).toBe(4);
    });
});
