// ============================================
// TESTS UNITAIRES - Room (Multijoueur)
// 35 tests - Logique des salles
// ============================================

// Mock WebSocket
global.WebSocket = class MockWebSocket {
    constructor() {
        this.readyState = 1;
        this.OPEN = 1;
        this.sentMessages = [];
    }
    send(data) {
        this.sentMessages.push(JSON.parse(data));
    }
    close() {
        this.readyState = 3;
    }
};

const Snake = require('../../SnakeServer.js');

// Configuration pour tests
const CONFIG = {
    GRID_SIZE: 30,
    MAX_PLAYERS_PER_ROOM: 2,
    TICK_RATE: 275,
    MATCH_DURATION: 300000
};

// Classe Room simplifiée pour tests
class Room {
    constructor(id) {
        this.id = id;
        this.players = new Map();
        this.gameState = {
            food: null,
            bad: null,
            obstacles: [],
            scores: {},
            segments: {},
            gameStarted: false,
            matchStartTime: null,
            matchTimeRemaining: CONFIG.MATCH_DURATION
        };
        this.running = false;
        this.gameLoopTimeout = null;
        this.timerInterval = null;
    }

    addPlayer(playerId, ws) {
        if (this.players.size >= CONFIG.MAX_PLAYERS_PER_ROOM) {
            return false;
        }

        const playerNumber = this.players.size + 1;
        const startPos = playerNumber === 1
            ? { x: 5, y: 15 }
            : { x: 24, y: 15 };

        const snake = new Snake(startPos.x, startPos.y, playerId);

        this.players.set(playerId, {
            id: playerId,
            ws: ws,
            number: playerNumber,
            snake: snake,
            ready: false
        });

        this.gameState.scores[playerId] = 0;
        this.gameState.segments[playerId] = 1;

        return true;
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        delete this.gameState.scores[playerId];
        delete this.gameState.segments[playerId];

        if (this.players.size === 0) {
            this.cleanup();
        }
    }

    setPlayerReady(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.ready = true;
        }
    }

    allPlayersReady() {
        if (this.players.size < CONFIG.MAX_PLAYERS_PER_ROOM) return false;
        for (let player of this.players.values()) {
            if (!player.ready) return false;
        }
        return true;
    }

    generateFood() {
        let attempts = 0;
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
                y: Math.floor(Math.random() * CONFIG.GRID_SIZE)
            };
            attempts++;
            if (attempts > 200) break;
        } while (this.isPositionOccupied(food.x, food.y));
        return food;
    }

    generateBad() {
        let attempts = 0;
        let bad;
        do {
            bad = {
                x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
                y: Math.floor(Math.random() * CONFIG.GRID_SIZE)
            };
            attempts++;
            if (attempts > 200) break;
        } while (this.isPositionOccupied(bad.x, bad.y));
        return bad;
    }

    generateObstacles(count) {
        const obstacles = [];
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let obstacle;
            do {
                obstacle = {
                    x: Math.floor(Math.random() * CONFIG.GRID_SIZE),
                    y: Math.floor(Math.random() * CONFIG.GRID_SIZE)
                };
                attempts++;
                if (attempts > 100) break;
            } while (this.isPositionOccupied(obstacle.x, obstacle.y));

            if (attempts <= 100) {
                obstacles.push(obstacle);
            }
        }
        return obstacles;
    }

    isPositionOccupied(x, y) {
        if (this.gameState.food && this.gameState.food.x === x && this.gameState.food.y === y) return true;
        if (this.gameState.bad && this.gameState.bad.x === x && this.gameState.bad.y === y) return true;
        if (this.gameState.obstacles.some(o => o.x === x && o.y === y)) return true;

        for (let player of this.players.values()) {
            if (player.snake.isAt(x, y)) return true;
        }

        return false;
    }

    cleanup() {
        this.running = false;
        if (this.gameLoopTimeout) {
            clearTimeout(this.gameLoopTimeout);
            this.gameLoopTimeout = null;
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.players.clear();
        this.gameState = {
            food: null,
            bad: null,
            obstacles: [],
            scores: {},
            segments: {},
            gameStarted: false,
            matchStartTime: null,
            matchTimeRemaining: 0
        };
    }
}

describe('Room - Construction et Initialisation', () => {
    test('devrait créer une room avec un ID', () => {
        const room = new Room('room_123');

        expect(room.id).toBe('room_123');
        expect(room.players.size).toBe(0);
        expect(room.gameState.gameStarted).toBe(false);
    });

    test('devrait initialiser l\'état du jeu correctement', () => {
        const room = new Room('test');

        expect(room.gameState.food).toBeNull();
        expect(room.gameState.bad).toBeNull();
        expect(room.gameState.obstacles).toEqual([]);
        expect(room.gameState.scores).toEqual({});
        expect(room.running).toBe(false);
    });
});

describe('Room - Gestion des Joueurs', () => {
    test('devrait ajouter un joueur avec succès', () => {
        const room = new Room('test');
        const ws = new WebSocket();

        const result = room.addPlayer('player1', ws);

        expect(result).toBe(true);
        expect(room.players.size).toBe(1);
    });

    test('devrait placer le joueur 1 à la position (5, 15)', () => {
        const room = new Room('test');
        const ws = new WebSocket();

        room.addPlayer('player1', ws);
        const player = room.players.get('player1');

        expect(player.snake.head).toEqual({ x: 5, y: 15 });
        expect(player.number).toBe(1);
    });

    test('devrait placer le joueur 2 à la position (24, 15)', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);
        const player2 = room.players.get('player2');

        expect(player2.snake.head).toEqual({ x: 24, y: 15 });
        expect(player2.number).toBe(2);
    });

    test('ne devrait pas ajouter plus de 2 joueurs', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();
        const ws3 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);
        const result = room.addPlayer('player3', ws3);

        expect(result).toBe(false);
        expect(room.players.size).toBe(2);
    });

    test('devrait retirer un joueur correctement', () => {
        const room = new Room('test');
        const ws = new WebSocket();

        room.addPlayer('player1', ws);
        room.removePlayer('player1');

        expect(room.players.size).toBe(0);
        expect(room.gameState.scores['player1']).toBeUndefined();
    });

    test('devrait initialiser le score à 0 pour un nouveau joueur', () => {
        const room = new Room('test');
        const ws = new WebSocket();

        room.addPlayer('player1', ws);

        expect(room.gameState.scores['player1']).toBe(0);
        expect(room.gameState.segments['player1']).toBe(1);
    });

    test('devrait nettoyer la room si tous les joueurs partent', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);
        room.removePlayer('player1');
        room.removePlayer('player2');

        expect(room.players.size).toBe(0);
        expect(room.gameLoopTimeout).toBeNull();
    });
});

describe('Room - Système Ready', () => {
    test('devrait marquer un joueur comme prêt', () => {
        const room = new Room('test');
        const ws = new WebSocket();

        room.addPlayer('player1', ws);
        room.setPlayerReady('player1');
        const player = room.players.get('player1');

        expect(player.ready).toBe(true);
    });

    test('allPlayersReady devrait retourner false si pas assez de joueurs', () => {
        const room = new Room('test');
        const ws = new WebSocket();

        room.addPlayer('player1', ws);
        room.setPlayerReady('player1');

        expect(room.allPlayersReady()).toBe(false);
    });

    test('allPlayersReady devrait retourner false si un joueur n\'est pas prêt', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);
        room.setPlayerReady('player1');

        expect(room.allPlayersReady()).toBe(false);
    });

    test('allPlayersReady devrait retourner true si tous les joueurs sont prêts', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);
        room.setPlayerReady('player1');
        room.setPlayerReady('player2');

        expect(room.allPlayersReady()).toBe(true);
    });

    test('ne devrait pas crash si setPlayerReady sur joueur inexistant', () => {
        const room = new Room('test');

        expect(() => {
            room.setPlayerReady('ghost_player');
        }).not.toThrow();
    });
});

describe('Room - Génération de Nourriture et Obstacles', () => {
    test('devrait générer de la nourriture dans les limites de la grille', () => {
        const room = new Room('test');

        const food = room.generateFood();

        expect(food.x).toBeGreaterThanOrEqual(0);
        expect(food.x).toBeLessThan(CONFIG.GRID_SIZE);
        expect(food.y).toBeGreaterThanOrEqual(0);
        expect(food.y).toBeLessThan(CONFIG.GRID_SIZE);
    });

    test('devrait générer un crâne dans les limites de la grille', () => {
        const room = new Room('test');

        const bad = room.generateBad();

        expect(bad.x).toBeGreaterThanOrEqual(0);
        expect(bad.x).toBeLessThan(CONFIG.GRID_SIZE);
        expect(bad.y).toBeGreaterThanOrEqual(0);
        expect(bad.y).toBeLessThan(CONFIG.GRID_SIZE);
    });

    test('devrait générer le nombre correct d\'obstacles', () => {
        const room = new Room('test');

        const obstacles = room.generateObstacles(5);

        expect(obstacles.length).toBeLessThanOrEqual(5);
    });

    test('ne devrait pas générer de nourriture sur le serpent', () => {
        const room = new Room('test');
        const ws = new WebSocket();
        room.addPlayer('player1', ws);

        for (let i = 0; i < 10; i++) {
            const food = room.generateFood();
            const player = room.players.get('player1');
            expect(player.snake.isAt(food.x, food.y)).toBe(false);
        }
    });

    test('isPositionOccupied devrait détecter la nourriture', () => {
        const room = new Room('test');
        room.gameState.food = { x: 10, y: 10 };

        expect(room.isPositionOccupied(10, 10)).toBe(true);
        expect(room.isPositionOccupied(10, 11)).toBe(false);
    });

    test('isPositionOccupied devrait détecter le crâne', () => {
        const room = new Room('test');
        room.gameState.bad = { x: 15, y: 15 };

        expect(room.isPositionOccupied(15, 15)).toBe(true);
    });

    test('isPositionOccupied devrait détecter les obstacles', () => {
        const room = new Room('test');
        room.gameState.obstacles = [{ x: 20, y: 20 }];

        expect(room.isPositionOccupied(20, 20)).toBe(true);
    });

    test('isPositionOccupied devrait détecter le serpent', () => {
        const room = new Room('test');
        const ws = new WebSocket();
        room.addPlayer('player1', ws);

        expect(room.isPositionOccupied(5, 15)).toBe(true);
    });
});

describe('Room - Cleanup et Timers', () => {
    test('cleanup devrait arrêter tous les timers', () => {
        const room = new Room('test');
        room.gameLoopTimeout = setTimeout(() => {}, 1000);
        room.timerInterval = setInterval(() => {}, 1000);

        room.cleanup();

        expect(room.gameLoopTimeout).toBeNull();
        expect(room.timerInterval).toBeNull();
    });

    test('cleanup devrait vider la liste des joueurs', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();
        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);

        room.cleanup();

        expect(room.players.size).toBe(0);
    });

    test('cleanup devrait réinitialiser l\'état du jeu', () => {
        const room = new Room('test');
        room.gameState.food = { x: 10, y: 10 };
        room.gameState.gameStarted = true;

        room.cleanup();

        expect(room.gameState.food).toBeNull();
        expect(room.gameState.gameStarted).toBe(false);
    });

    test('cleanup devrait mettre running à false', () => {
        const room = new Room('test');
        room.running = true;

        room.cleanup();

        expect(room.running).toBe(false);
    });
});

describe('Room - Scénarios Complets', () => {
    test('devrait gérer l\'ajout de deux joueurs complet', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);

        expect(room.players.size).toBe(2);
        expect(room.gameState.scores['player1']).toBe(0);
        expect(room.gameState.scores['player2']).toBe(0);
    });

    test('devrait gérer la séquence ready des deux joueurs', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);

        expect(room.allPlayersReady()).toBe(false);

        room.setPlayerReady('player1');
        expect(room.allPlayersReady()).toBe(false);

        room.setPlayerReady('player2');
        expect(room.allPlayersReady()).toBe(true);
    });

    test('devrait générer nourriture et obstacles sans collision', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();
        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);

        const food = room.generateFood();
        room.gameState.food = food;
        const bad = room.generateBad();
        const obstacles = room.generateObstacles(3);

        expect(room.isPositionOccupied(food.x, food.y)).toBe(true);
        expect(obstacles.length).toBeLessThanOrEqual(3);
    });

    test('devrait gérer la déconnexion d\'un joueur pendant la partie', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);
        room.running = true;

        room.removePlayer('player1');

        expect(room.players.size).toBe(1);
        expect(room.gameState.scores['player1']).toBeUndefined();
    });

    test('devrait supporter plusieurs cycles de joueurs', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.removePlayer('player1');
        room.addPlayer('player2', ws2);

        expect(room.players.size).toBe(1);
        expect(room.players.has('player2')).toBe(true);
    });

    test('devrait créer des serpents distincts pour chaque joueur', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);

        const p1 = room.players.get('player1');
        const p2 = room.players.get('player2');

        expect(p1.snake.playerId).toBe('player1');
        expect(p2.snake.playerId).toBe('player2');
        expect(p1.snake).not.toBe(p2.snake);
    });

    test('devrait gérer plusieurs générations d\'obstacles', () => {
        const room = new Room('test');

        const obs1 = room.generateObstacles(2);
        room.gameState.obstacles = obs1;
        const obs2 = room.generateObstacles(3);

        expect(obs1.length).toBeLessThanOrEqual(2);
        expect(obs2.length).toBeLessThanOrEqual(3);
    });

    test('devrait nettoyer complètement après plusieurs opérations', () => {
        const room = new Room('test');
        const ws1 = new WebSocket();
        const ws2 = new WebSocket();

        room.addPlayer('player1', ws1);
        room.addPlayer('player2', ws2);
        room.gameState.food = room.generateFood();
        room.gameState.obstacles = room.generateObstacles(5);
        room.running = true;

        room.cleanup();

        expect(room.players.size).toBe(0);
        expect(room.gameState.food).toBeNull();
        expect(room.gameState.obstacles).toEqual([]);
        expect(room.running).toBe(false);
    });

    test('devrait gérer WebSocket mock correctement', () => {
        const ws = new WebSocket();

        expect(ws.readyState).toBe(1);
        expect(ws.OPEN).toBe(1);

        ws.send(JSON.stringify({ type: 'test', data: 'hello' }));

        expect(ws.sentMessages.length).toBe(1);
        expect(ws.sentMessages[0].type).toBe('test');
    });
});
