// ============================================
// 🎮 SERVEUR MULTIJOUEUR SNAKE ULTRA - V5 CORRIGÉ
// Avec crânes, murs, vitesse progressive et timer
// ============================================

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const Snake = require('./SnakeServer.js');
const Logger = require('./Logger.js');

const logger = new Logger(true); // true = activer DEBUG

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    PORT: process.env.PORT || 8080,
    GRID_SIZE: 30,
    BASE_TICK_RATE: 275,         // ✅ Vitesse normale (275ms)
    FIRE_TICK_RATE: 140,         // ✅ FIRE: x2 vitesse (275/2)
    ICE_TICK_RATE: 550,          // ✅ ICE: ÷2 vitesse (275*2)
    MAX_PLAYERS_PER_ROOM: 2,
    ROOM_TIMEOUT: 300000,
    MATCH_DURATION: 300000       // 5 minutes
};

const POWERUP_TYPES = {
    FIRE: {
        id: 'fire',
        duration: 5000,      // 5 secondes
        color: '#FF4500',    // Rouge orangé
        symbol: '🔥',
        spawnChance: 0.25    // 25% de chance à chaque spawn
    },
    ICE: {
        id: 'ice',
        duration: 8000,      // 8 secondes
        color: '#00CED1',    // Bleu cyan
        symbol: '❄️',
        spawnChance: 0.25
    },
    GHOST: {
        id: 'ghost',
        duration: 6000,      // 6 secondes
        color: '#FFFFFF',    // Blanc
        symbol: '👻',
        spawnChance: 0.25
    },
    ROCK: {
        id: 'rock',
        duration: 8000,      // 8 secondes
        color: '#D2B48C',    // Beige tan
        symbol: '🪨',
        spawnChance: 0.25
    }
};

// ============================================
// CLASSE POWERUP
// ============================================

class PowerUp {
    constructor(type) {
        this.type = type;
        this.x = 0;
        this.y = 0;
        this.active = true;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    toJSON() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            active: this.active
        };
    }
}

// ============================================
// GESTION DES SALLES
// ============================================

class Room {
    constructor(id) {
        this.id = id;
        this.players = new Map();
        this.gameState = {
            food: null,
            powerups: [], // ✅ NOUVEAU pour les power-ups
            scores: {},
            segments: {},
            gameStarted: false,
            matchStartTime: null,
            matchTimeRemaining: CONFIG.MATCH_DURATION
        };
        this.lastActivity = Date.now();
        this.gameLoopTimeout = null;
        this.running = false;
        this.timerInterval = null;
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

    generatePowerUp() {
        // Choisir un type aléatoire
        const types = ['fire', 'ice', 'ghost', 'rock'];
        const randomType = types[Math.floor(Math.random() * types.length)];

        // Créer le power-up
        const powerup = new PowerUp(randomType);

        // Trouver une position libre
        let attempts = 0;
        let x, y;
        do {
            x = Math.floor(Math.random() * CONFIG.GRID_SIZE);
            y = Math.floor(Math.random() * CONFIG.GRID_SIZE);
            attempts++;
            if (attempts > 200) break;
        } while (this.isPositionOccupied(x, y));

        powerup.setPosition(x, y);

        logger.debug('GAME', `Power-up généré`, {
            type: randomType,
            position: { x, y }
        });

        return powerup;
    }

    isPositionOccupied(x, y) {
        // Vérifier si une position est occupée
        if (this.gameState.food && this.gameState.food.x === x && this.gameState.food.y === y) return true;

        for (let player of this.players.values()) {
            if (player.snake.isAt(x, y)) return true;
        }

        return false;
    }

    addPlayer(playerId, ws) {
        if (this.players.size >= CONFIG.MAX_PLAYERS_PER_ROOM) {
            return false;
        }

        const playerNumber = this.players.size + 1;
        const startPos = playerNumber === 1
            ? { x: 5, y: 15 }
            : { x: 24, y: 15 };

        // Créer une instance de Snake
        const snake = new Snake(startPos.x, startPos.y, playerId);

        this.players.set(playerId, {
            id: playerId,
            ws: ws,
            number: playerNumber,
            snake: snake,
            ready: false,
            activePowerup: null,        // Power-up actif
            powerupEndTime: 0,          // Temps de fin du power-up
            queueContact: {             // ✅ NOUVEAU - Contact queue
                active: false,
                targetId: null,
                startTime: 0,
                lastStealTime: 0,
                stolenCount: 0
            },
            stats: {                    // 📊 Stats de la partie
                powerupsCollected: 0,
                segmentsEaten: 0,
                segmentsLost: 0,
                headToHeadCollisions: 0
            }
        });

        this.gameState.scores[playerId] = 0;
        this.gameState.segments[playerId] = 1;
        this.lastActivity = Date.now();

        logger.info('ROOM', `Joueur ${playerNumber} rejoint la salle ${this.id}`);

        if (this.players.size === 2) {
            logger.info('ROOM', `Salle ${this.id} complète !`);
            this.notifyPlayers({
                type: 'room_full',
                message: 'Salle complète ! Préparez-vous...'
            });
        }

        return true;
    }

    removePlayer(playerId) {
        logger.info('ROOM', `👋 Retrait du joueur ${playerId} de la salle ${this.id}`);

        const player = this.players.get(playerId);
        if (!player) return;

        // Fermer le WebSocket du joueur
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            try {
                player.ws.close();
            } catch (error) {
                logger.error('NETWORK', 'Erreur fermeture WebSocket', error);
            }
        }

        // Retirer le joueur
        this.players.delete(playerId);
        delete this.gameState.scores[playerId];
        delete this.gameState.segments[playerId];

        // Si la salle est vide, tout nettoyer
        if (this.players.size === 0) {
            logger.info('ROOM', `🗑️ Salle ${this.id} vide, nettoyage complet`);
            this.cleanup();
        } else {
            // Notifier les autres joueurs
            this.notifyPlayers({
                type: 'player_left',
                playerId: playerId,
                message: 'Adversaire déconnecté'
            });

            // Si le jeu était en cours, l'arrêter
            if (this.gameState.gameStarted) {
                this.stopGame();
            }
        }
    }

    setPlayerReady(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.ready = true;
            logger.info('ROOM', `Joueur ${player.number} prêt (${this.countReady()}/${this.players.size}) - Salle ${this.id}`);

            if (this.allPlayersReady()) {
                this.startGame();
            }
        }
    }

    countReady() {
        let count = 0;
        for (let player of this.players.values()) {
            if (player.ready) count++;
        }
        return count;
    }

    allPlayersReady() {
        if (this.players.size < CONFIG.MAX_PLAYERS_PER_ROOM) return false;
        for (let player of this.players.values()) {
            if (!player.ready) return false;
        }
        return true;
    }

    getCurrentTickRate(player) {
        // Vérifier si le power-up est toujours actif
        if (player.activePowerup && Date.now() < player.powerupEndTime) {
            switch (player.activePowerup) {
                case 'fire':
                    return CONFIG.FIRE_TICK_RATE;  // 140ms - x2 vitesse
                case 'ice':
                    return CONFIG.ICE_TICK_RATE;   // 550ms - ÷2 vitesse
                default:
                    return CONFIG.BASE_TICK_RATE;  // 275ms - normal
            }
        }

        // Power-up expiré ou aucun
        if (player.activePowerup && Date.now() >= player.powerupEndTime) {
            player.activePowerup = null;
            player.powerupEndTime = 0;
            logger.debug('GAME', `⏱️ Power-up expiré pour player ${player.number}`);
        }

        return CONFIG.BASE_TICK_RATE;
    }

    handleHeadToHeadCollision(player1, player2) {
        logger.info('GAME', `💥 Collision tête-à-tête`, {
            player1: player1.number,
            player2: player2.number,
            lengths: [player1.snake.length, player2.snake.length]
        });

        // 1. Déterminer qui perd un segment
        if (player1.snake.length < player2.snake.length) {
            player1.snake.shrink(1);
            player1.stats.segmentsLost++;
            logger.debug('GAME', `Player ${player1.number} perd 1 segment (plus petit)`);
        } else if (player2.snake.length < player1.snake.length) {
            player2.snake.shrink(1);
            player2.stats.segmentsLost++;
            logger.debug('GAME', `Player ${player2.number} perd 1 segment (plus petit)`);
        }
        // Si égalité : personne ne perd

        // Tracker la collision
        player1.stats.headToHeadCollisions++;
        player2.stats.headToHeadCollisions++;

        // 2. Importer les helpers
        const { getPerpendicularLeft, getPerpendicularRight } = require('./SnakeServer.js');

        // 3. Éjection latérale
        const leftDir = getPerpendicularLeft(player1.snake.direction);
        const rightDir = getPerpendicularRight(player2.snake.direction);

        player1.snake.direction = leftDir;
        player2.snake.direction = rightDir;

        // 4. Avancer de 2 cases dans la nouvelle direction
        for (let i = 0; i < 2; i++) {
            player1.snake.head.x += leftDir.dx;
            player1.snake.head.y += leftDir.dy;

            player2.snake.head.x += rightDir.dx;
            player2.snake.head.y += rightDir.dy;

            // Wrapping
            player1.snake.head.x = (player1.snake.head.x + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;
            player1.snake.head.y = (player1.snake.head.y + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;

            player2.snake.head.x = (player2.snake.head.x + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;
            player2.snake.head.y = (player2.snake.head.y + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;
        }

        // 5. Invincibilité temporaire
        player1.snake.invincible = true;
        player2.snake.invincible = true;

        setTimeout(() => {
            player1.snake.invincible = false;
            player2.snake.invincible = false;
        }, 300);

        logger.debug('GAME', `Éjection complète`, {
            p1NewPos: player1.snake.head,
            p2NewPos: player2.snake.head
        });
    }

    // Boucle de jeu avec setTimeout
    gameLoopTick() {
        // Vérifier EN PREMIER
        if (!this.running) {
            logger.warn('GAME', `⚠️ gameLoopTick appelé alors que running=false pour ${this.id}`);
            return;
        }

        if (!this.tickCount) this.tickCount = 0;
        this.tickCount++;

        logger.debug('GAME', `Tick #${this.tickCount} - Salle ${this.id}`);
        this.update();

        // 🎮 Trouver le tick rate le plus rapide parmi les joueurs actifs
        let fastestTickRate = CONFIG.BASE_TICK_RATE;
        for (let player of this.players.values()) {
            if (player.snake.alive) {
                const playerTickRate = this.getCurrentTickRate(player);
                if (playerTickRate < fastestTickRate) {
                    fastestTickRate = playerTickRate;
                }
            }
        }

        // Scheduler le prochain tick au tick rate le plus rapide
        this.gameLoopTimeout = setTimeout(() => {
            this.gameLoopTick();
        }, fastestTickRate);
    }

    startGame() {
        logger.info('GAME', `🎮 Partie démarrée - Salle ${this.id}`);
        this.gameState.gameStarted = true;
        this.gameState.matchStartTime = Date.now();
        this.gameState.matchTimeRemaining = CONFIG.MATCH_DURATION;

        // Réinitialiser les positions
        let playerNum = 1;
        for (let player of this.players.values()) {
            const startPos = playerNum === 1
                ? { x: 5, y: 15 }
                : { x: 24, y: 15 };

            player.snake.reset(startPos.x, startPos.y, { dx: 1, dy: 0 });
            this.gameState.scores[player.id] = 0;
            this.gameState.segments[player.id] = 1;
            playerNum++;
        }

        // ⭐ Générer étoile uniquement
        this.gameState.food = this.generateFood();

        // 🎮 Générer 2 power-ups au début
        this.gameState.powerups = [];
        for (let i = 0; i < 2; i++) {
            this.gameState.powerups.push(this.generatePowerUp());
        }

        this.notifyPlayers({
            type: 'game_start',
            gameState: this.getGameStateForClients()
        });

        // Démarrer les boucles
        this.running = true;
        this.gameLoopTick();
        this.startMatchTimer();
    }

    startMatchTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.gameState.gameStarted) {
                this.stopMatchTimer();
                return;
            }

            const elapsed = Date.now() - this.gameState.matchStartTime;
            this.gameState.matchTimeRemaining = Math.max(0, CONFIG.MATCH_DURATION - elapsed);

            if (this.gameState.matchTimeRemaining <= 0) {
                this.endGameByTime();
            }
        }, 100); // Mettre à jour toutes les 100ms pour précision
    }

    stopMatchTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    endGameByTime() {
        logger.info('GAME', `⏰ Temps écoulé - Salle ${this.id}`);
        this.stopMatchTimer();
        
        let longestPlayer = null;
        let maxLength = 0;
        
        for (let player of this.players.values()) {
            const length = player.snake.length;
            if (length > maxLength) {
                maxLength = length;
                longestPlayer = player;
            } else if (length === maxLength) {
                longestPlayer = null;
            }
        }

        const scores = {};
        for (let player of this.players.values()) {
            scores[player.id] = player.snake.length;
        }

        this.notifyPlayers({
            type: 'game_over',
            reason: 'time_up',
            winner: longestPlayer ? longestPlayer.id : null,
            winnerNumber: longestPlayer ? longestPlayer.number : null,
            scores: scores,
            message: longestPlayer 
                ? `🏆 Joueur ${longestPlayer.number} gagne avec ${maxLength} segments !`
                : `⚔️ Match nul ! ${maxLength} segments chacun.`
        });

        this.stopGame();
    }

    stopGame() {
        this.running = false;
        if (this.gameLoopTimeout) {
            clearTimeout(this.gameLoopTimeout);
            this.gameLoopTimeout = null;
        }

        this.stopMatchTimer();

        // 📊 Logger les stats de la partie
        if (this.gameState.matchStartTime) {
            const duration = Date.now() - this.gameState.matchStartTime;
            const stats = {
                duration: `${(duration / 1000).toFixed(1)}s`,
                players: {}
            };

            for (let [id, player] of this.players) {
                stats.players[`Player ${player.number}`] = {
                    finalLength: player.snake.length,
                    alive: player.snake.alive,
                    powerupsCollected: player.stats.powerupsCollected,
                    segmentsEaten: player.stats.segmentsEaten,
                    segmentsLost: player.stats.segmentsLost,
                    headToHeadCollisions: player.stats.headToHeadCollisions
                };
            }

            logger.info('GAME', `📊 Stats de la partie - Salle ${this.id}`, stats);
        }

        this.gameState.gameStarted = false;
        this.gameState.matchStartTime = null;
        this.gameState.matchTimeRemaining = CONFIG.MATCH_DURATION;
    }

    cleanup() {
        // ✅ CRITIQUE : EN PREMIÈRE LIGNE ABSOLUE
        this.running = false;

        logger.info('ROOM', `🧹 Nettoyage de la salle ${this.id}`);

        // Arrêter la boucle de jeu
        if (this.gameLoopTimeout) {
            clearTimeout(this.gameLoopTimeout);
            this.gameLoopTimeout = null;
            logger.debug('ROOM', `✅ gameLoopTimeout nettoyé pour ${this.id}`);
        }

        // Arrêter le timer de match
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            logger.debug('ROOM', `✅ timerInterval nettoyé pour ${this.id}`);
        }

        // Fermer toutes les connexions WebSocket
        for (let player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                try {
                    player.ws.close();
                    logger.debug('NETWORK', `✅ WebSocket fermé pour ${player.id}`);
                } catch (error) {
                    logger.error('NETWORK', 'Erreur fermeture WebSocket', error);
                }
            }
        }

        // Vider la map des joueurs
        this.players.clear();

        // Réinitialiser l'état du jeu
        this.gameState = {
            food: null,
            powerups: [],
            scores: {},
            segments: {},
            gameStarted: false,
            matchStartTime: null,
            matchTimeRemaining: 0
        };

        logger.info('ROOM', `✅ Salle ${this.id} nettoyée complètement`);
    }

    update() {
        // Double vérification de sécurité
        if (!this.running || !this.gameState.gameStarted) {
            logger.warn('GAME', `⚠️ update() appelé alors que le jeu est arrêté pour ${this.id}`);
            return;
        }

        const alivePlayers = Array.from(this.players.values()).filter(p => p.snake.alive);
        
        if (alivePlayers.length === 0) {
            const scores = {};
            for (let player of this.players.values()) {
                scores[player.id] = player.snake.length;
            }
            
            this.notifyPlayers({
                type: 'game_over',
                reason: 'both_dead',
                winner: null,
                scores: scores,
                message: '💀 Les deux joueurs sont morts !'
            });
            this.stopGame();
            return;
        }

        if (alivePlayers.length === 1) {
            const winner = alivePlayers[0];
            const scores = {};
            for (let player of this.players.values()) {
                scores[player.id] = player.snake.length;
            }
            
            this.notifyPlayers({
                type: 'game_over',
                reason: 'opponent_died',
                winner: winner.id,
                winnerNumber: winner.number,
                scores: scores,
                message: `🏆 Joueur ${winner.number} gagne !`
            });
            this.stopGame();
            return;
        }

        // 💥 Détecter collisions tête-à-tête AVANT les déplacements
        if (alivePlayers.length === 2) {
            const [p1, p2] = alivePlayers;

            // Calculer les PROCHAINES positions des têtes (après mouvement)
            const nextP1Head = {
                x: (p1.snake.head.x + p1.snake.direction.dx + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE,
                y: (p1.snake.head.y + p1.snake.direction.dy + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE
            };

            const nextP2Head = {
                x: (p2.snake.head.x + p2.snake.direction.dx + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE,
                y: (p2.snake.head.y + p2.snake.direction.dy + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE
            };

            // Vérifier si collision tête-à-tête va se produire
            if (nextP1Head.x === nextP2Head.x &&
                nextP1Head.y === nextP2Head.y &&
                !p1.snake.invincible && !p2.snake.invincible) {

                logger.info('GAME', `💥 TÊTE-À-TÊTE DÉTECTÉE - Éjection`, {
                    p1: { current: p1.snake.head, next: nextP1Head, dir: p1.snake.direction, length: p1.snake.length },
                    p2: { current: p2.snake.head, next: nextP2Head, dir: p2.snake.direction, length: p2.snake.length }
                });

                this.handleHeadToHeadCollision(p1, p2);

                // Skip le reste de l'update ce tick (ne pas bouger)
                this.notifyPlayers({
                    type: 'game_update',
                    gameState: this.getGameStateForClients()
                });
                return;
            }
        }

        // Déplacer chaque serpent
        for (let player of this.players.values()) {
            if (!player.snake.alive) continue;

            const oldHead = { ...player.snake.head };

            // Déplacer le serpent (gère automatiquement le wrapping)
            player.snake.move();
            const newHead = player.snake.head;

            logger.debug('GAME', `Player ${player.number} move`, {
                before: oldHead,
                after: { x: newHead.x, y: newHead.y }
            });

            // Vérifier collision avec adversaire
            // 👻 GHOST = Peut traverser les adversaires
            // 🛡️ INVINCIBLE = Pas de collision pendant 300ms après tête-à-tête
            if (player.activePowerup !== 'ghost' && !player.snake.invincible) {
                let hitOpponent = false;
                for (let opponent of this.players.values()) {
                    if (opponent.id === player.id || !opponent.snake.alive) continue;

                    if (player.snake.collidesWithSnake(opponent.snake)) {
                        // 🪨 ROCK : Mange 2 segments à l'adversaire au lieu de mourir
                        if (player.activePowerup === 'rock') {
                            opponent.snake.shrink(2);
                            player.snake.grow();
                            player.snake.grow();
                            player.stats.segmentsEaten += 2;
                            opponent.stats.segmentsLost += 2;
                            this.gameState.scores[player.id] = player.snake.score;
                            this.gameState.segments[player.id] = player.snake.length;

                            logger.info('GAME', `🪨 Player ${player.number} ROCK mange 2 segments de Player ${opponent.number}`);

                            if (!opponent.snake.alive) {
                                logger.info('GAME', `💀 Player ${opponent.number} éliminé par ROCK`);
                            }
                        } else {
                            // Collision normale - joueur meurt
                            player.snake.die();
                            logger.info('GAME', `💀 Player ${player.number} éliminé`, { cause: 'opponent' });
                            hitOpponent = true;
                        }
                        break;
                    }
                }

                if (hitOpponent) continue;
            } else {
                logger.debug('GAME', `👻 Player ${player.number} GHOST traverse adversaire`);
            }

            // ⭐ Manger l'étoile
            if (player.snake.headAt(this.gameState.food.x, this.gameState.food.y)) {
                player.snake.grow();
                player.snake.addScore(10);
                this.gameState.scores[player.id] = player.snake.score;
                this.gameState.segments[player.id] = player.snake.length;

                // Générer nouvelle étoile
                this.gameState.food = this.generateFood();

                logger.debug('GAME', `⭐ Player ${player.number} mange`, {
                    score: player.snake.score,
                    length: player.snake.length
                });
            }

            // 🎮 Ramasser un power-up
            for (let i = this.gameState.powerups.length - 1; i >= 0; i--) {
                const powerup = this.gameState.powerups[i];
                if (player.snake.headAt(powerup.x, powerup.y)) {
                    // Activer le power-up
                    player.activePowerup = powerup.type;
                    player.powerupEndTime = Date.now() + POWERUP_TYPES[powerup.type.toUpperCase()].duration;
                    player.stats.powerupsCollected++;

                    const symbol = POWERUP_TYPES[powerup.type.toUpperCase()].symbol;
                    const duration = POWERUP_TYPES[powerup.type.toUpperCase()].duration;

                    logger.info('GAME', `${symbol} Player ${player.number} active ${powerup.type.toUpperCase()}`, {
                        duration: `${duration}ms (${duration / 1000}s)`,
                        endsAt: new Date(player.powerupEndTime).toISOString()
                    });

                    // Retirer ce power-up et en générer un nouveau
                    this.gameState.powerups.splice(i, 1);
                    this.gameState.powerups.push(this.generatePowerUp());

                    break;
                }
            }

            // Pas de nourriture mangée - le move() a déjà géré le pop()
        }

        // 🍴 Contact queue : Manger segments
        for (let player of this.players.values()) {
            if (!player.snake.alive) continue;
            if (player.activePowerup === 'ghost') continue; // Ghost ignore ça

            for (let opponent of this.players.values()) {
                if (opponent.id === player.id || !opponent.snake.alive) continue;
                if (opponent.activePowerup === 'ghost') continue; // Ne peut pas manger un ghost

                // Vérifier si la tête touche la queue de l'adversaire
                const tail = opponent.snake.body[opponent.snake.body.length - 1];
                if (player.snake.head.x === tail.x && player.snake.head.y === tail.y) {

                    if (!player.queueContact.active) {
                        // Premier contact
                        player.queueContact.active = true;
                        player.queueContact.targetId = opponent.id;
                        player.queueContact.startTime = Date.now();
                        player.queueContact.lastStealTime = Date.now();
                        player.queueContact.stolenCount = 0;

                        logger.info('GAME', `🍴 Player ${player.number} commence à manger la queue de ${opponent.number}`);
                    } else {
                        // Contact continu
                        const now = Date.now();
                        if (now - player.queueContact.lastStealTime >= 1000 &&
                            player.queueContact.stolenCount < 5) {

                            // Voler 1 segment
                            opponent.snake.shrink(1);
                            player.snake.grow();
                            player.queueContact.lastStealTime = now;
                            player.queueContact.stolenCount++;
                            player.stats.segmentsEaten++;
                            opponent.stats.segmentsLost++;

                            logger.debug('GAME', `🍴 Player ${player.number} vole segment #${player.queueContact.stolenCount}`);

                            if (!opponent.snake.alive) {
                                logger.info('GAME', `💀 Player ${opponent.number} éliminé (queue mangée)`);
                            }
                        }
                    }
                } else {
                    // Contact perdu
                    if (player.queueContact.active && player.queueContact.targetId === opponent.id) {
                        logger.info('GAME', `Player ${player.number} perd le contact (${player.queueContact.stolenCount} segments volés)`);
                        player.queueContact.active = false;
                        player.queueContact.targetId = null;
                    }
                }
            }
        }

        // Envoyer l'état
        this.notifyPlayers({
            type: 'game_update',
            gameState: this.getGameStateForClients()
        });
    }

    handleInput(playerId, direction) {
        const player = this.players.get(playerId);
        if (!player || !player.snake.alive) return;

        // Convertir la direction string en objet { dx, dy }
        let newDirection;
        switch (direction) {
            case 'up':
                newDirection = { dx: 0, dy: -1 };
                break;
            case 'down':
                newDirection = { dx: 0, dy: 1 };
                break;
            case 'left':
                newDirection = { dx: -1, dy: 0 };
                break;
            case 'right':
                newDirection = { dx: 1, dy: 0 };
                break;
            default:
                return;
        }

        // Le Snake gère la validation anti-retour
        player.snake.changeDirection(newDirection);
    }

    getGameStateForClients() {
        const players = {};
        for (let [id, player] of this.players) {
            const snakeData = player.snake.toJSON();
            players[id] = {
                ...snakeData,
                number: player.number,              // Ajouter le numéro du joueur
                activePowerup: player.activePowerup,    // ✅ Power-up actif
                powerupEndTime: player.powerupEndTime   // ✅ Temps de fin du power-up
            };
        }

        return {
            players: players,
            food: this.gameState.food,
            powerups: this.gameState.powerups.map(p => p.toJSON()), // ✅ Power-ups avec toJSON()
            scores: this.gameState.scores,
            segments: this.gameState.segments,
            gameStarted: this.gameState.gameStarted,
            matchTimeRemaining: this.gameState.matchTimeRemaining
        };
    }

    notifyPlayers(message) {
        for (let player of this.players.values()) {
            if (player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        }
    }
}

// ============================================
// GESTIONNAIRE DE SALLES
// ============================================

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.playerToRoom = new Map();
    }

    findOrCreateRoom() {
        for (let room of this.rooms.values()) {
            if (room.players.size < CONFIG.MAX_PLAYERS_PER_ROOM) {
                return room;
            }
        }

        const roomId = 'room_' + Date.now();
        const room = new Room(roomId);
        this.rooms.set(roomId, room);
        logger.info('MANAGER', `🏠 Nouvelle salle créée`, { roomId });
        return room;
    }

    addPlayerToRoom(playerId, ws) {
        const room = this.findOrCreateRoom();
        if (room.addPlayer(playerId, ws)) {
            this.playerToRoom.set(playerId, room.id);
            return {
                success: true,
                room: room,
                playerNumber: room.players.get(playerId).number,
                playersInRoom: room.players.size
            };
        }
        return { success: false };
    }

    removePlayer(playerId) {
        const roomId = this.playerToRoom.get(playerId);
        if (!roomId) {
            logger.warn('MANAGER', `Joueur ${playerId} non trouvé dans playerToRoom`);
            return;
        }

        logger.info('MANAGER', `🗑️ Suppression du joueur ${playerId} de la salle ${roomId}`);

        const room = this.rooms.get(roomId);
        if (room) {
            room.removePlayer(playerId);

            // Si la salle est vide après le retrait, la supprimer
            if (room.players.size === 0) {
                logger.info('MANAGER', `🗑️ Suppression de la salle vide ${roomId}`);
                room.cleanup();  // S'assurer du nettoyage complet
                this.rooms.delete(roomId);
            }
        }

        this.playerToRoom.delete(playerId);
    }

    getPlayerRoom(playerId) {
        const roomId = this.playerToRoom.get(playerId);
        return roomId ? this.rooms.get(roomId) : null;
    }

    cleanupAll() {
        logger.info('MANAGER', '🧹 Nettoyage de toutes les salles...');

        let roomCount = 0;
        let playerCount = 0;

        for (let room of this.rooms.values()) {
            playerCount += room.players.size;
            room.cleanup();
            roomCount++;
        }

        this.rooms.clear();
        this.playerToRoom.clear();

        logger.info('MANAGER', `✅ ${roomCount} salles et ${playerCount} joueurs nettoyés`);
    }
}

const roomManager = new RoomManager();

// ============================================
// WEBSOCKET
// ============================================

wss.on('connection', (ws) => {
    const playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    logger.info('NETWORK', `🔌 Connexion`, { playerId });

    ws.send(JSON.stringify({
        type: 'connected',
        playerId: playerId
    }));

    const result = roomManager.addPlayerToRoom(playerId, ws);
    if (result.success) {
        ws.send(JSON.stringify({
            type: 'room_joined',
            roomId: result.room.id,
            playerNumber: result.playerNumber,
            playersInRoom: result.playersInRoom
        }));
    }

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            const room = roomManager.getPlayerRoom(playerId);
            
            if (!room) return;

            switch (message.type) {
                case 'ready':
                    room.setPlayerReady(playerId);
                    break;

                case 'input':
                    room.handleInput(playerId, message.direction);
                    break;

                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
            }
        } catch (error) {
            logger.error('NETWORK', 'Erreur traitement message', error);
        }
    });

    ws.on('close', () => {
        logger.info('NETWORK', `👋 Déconnexion`, { playerId });
        roomManager.removePlayer(playerId);
    });

    ws.on('error', (error) => {
        logger.error('NETWORK', 'Erreur WebSocket', error);
    });
});

// ============================================
// EXPRESS
// ============================================

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  
});


app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        rooms: roomManager.rooms.size,
        players: roomManager.playerToRoom.size
    });
});

// ============================================
// DÉMARRAGE
// ============================================

server.listen(CONFIG.PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║  🐍 SNAKE ULTRA V6 - POWER-UPS 🎮   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Serveur: http://localhost:${CONFIG.PORT}`);
    console.log(`⏱️  Timer: ${CONFIG.MATCH_DURATION / 1000}s`);
    console.log(`⚡ Vitesse normale: ${CONFIG.BASE_TICK_RATE}ms`);
    console.log(`   🔥 FIRE: ${CONFIG.FIRE_TICK_RATE}ms (x2 vitesse)`);
    console.log(`   ❄️  ICE:  ${CONFIG.ICE_TICK_RATE}ms (÷2 vitesse)`);
    console.log('');
    console.log('Power-ups:');
    console.log('  🔥 FIRE  - Speed boost (5s)');
    console.log('  ❄️  ICE   - Slow (8s)');
    console.log('  👻 GHOST - Intangible (6s)');
    console.log('  🪨 ROCK  - Tank, mange 2 segments (8s)');
    console.log('');

    logger.info('SERVER', '🚀 Serveur démarré avec power-ups', {
        port: CONFIG.PORT,
        baseTickRate: CONFIG.BASE_TICK_RATE,
        fireTickRate: CONFIG.FIRE_TICK_RATE,
        iceTickRate: CONFIG.ICE_TICK_RATE,
        matchDuration: CONFIG.MATCH_DURATION
    });
});

// ============================================
// GESTIONNAIRES D'ARRÊT
// ============================================

function gracefulShutdown(signal) {
    logger.info('SERVER', `🛑 Signal ${signal} reçu - Arrêt du serveur...`);

    // Nettoyer toutes les salles
    logger.info('SERVER', '🧹 Nettoyage des salles en cours...');
    roomManager.cleanupAll();

    // Afficher les statistiques des logs
    logger.printSummary();

    // Sauvegarder les logs
    const logFile = `snake-ultra-logs-${Date.now()}.json`;
    logger.saveToFile(logFile);
    logger.info('SERVER', `💾 Logs sauvegardés : ${logFile}`);

    // Fermer le serveur WebSocket
    server.close(() => {
        logger.info('SERVER', '✅ Serveur WebSocket fermé');
        logger.info('SERVER', '👋 Arrêt propre terminé');
        process.exit(0);
    });

    // Timeout de sécurité (si le serveur ne se ferme pas en 10s)
    setTimeout(() => {
        logger.error('SERVER', '⚠️ Timeout - Arrêt forcé');
        process.exit(1);
    }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));