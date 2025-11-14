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
const SecurityValidator = require('./SecurityValidator.js');

const logger = new Logger(true); // true = activer DEBUG
const securityValidator = new SecurityValidator();
logger.info('SERVER', '🛡️ SecurityValidator initialisé');

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
        color: '#FF5722',    // Deep Orange
        symbol: '🔥',
        spawnChance: 0.25    // 25% de chance à chaque spawn
    },
    ICE: {
        id: 'ice',
        duration: 8000,      // 8 secondes
        color: '#00A5A5',    // Cyan medium
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

    addPlayer(playerId, ws, pseudo = null) {
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
            pseudo: pseudo || `Joueur ${playerNumber}`, // ✅ NOUVEAU - Pseudo du joueur
            ws: ws,
            number: playerNumber,
            snake: snake,
            ready: false,
            activePowerup: null,        // Power-up actif
            powerupEndTime: 0,          // Temps de fin du power-up
            invincible: false,          // ✅ Invincibilité temporaire après éjection tête-à-tête
            queueContact: {             // ✅ Contact queue (tête vs queue)
                active: false,
                targetId: null,
                startTime: 0,
                lastStealTime: 0,
                stolenCount: 0
            },
            bodyContact: {              // ✅ Contact corps (tête vs corps)
                active: false,
                targetId: null,
                segmentIndex: -1,
                startTime: 0,
                lastStealTime: 0,
                stolenCount: 0
            },
            frozen: false,              // ✅ NOUVEAU - Effet ICE
            frozenUntil: 0,             // ✅ NOUVEAU - Timestamp fin gel
            victimInvincible: false,    // ✅ NOUVEAU - Invincibilité après perte de segments
            victimInvincibleUntil: 0,   // ✅ NOUVEAU - Timestamp fin invincibilité victime
            headToHeadProcessed: false, // ✅ NOUVEAU - Flag pour éviter double traitement tête-à-tête
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

        // ✅ Notifier tous les joueurs du lobby
        this.broadcastLobbyUpdate();

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
        if (!player) return;

        player.ready = true;
        logger.info('ROOM', `Joueur ${player.pseudo} prêt`, {
            playerId,
            roomId: this.id
        });

        // Broadcaster le lobby update
        this.broadcastLobbyUpdate();

        // Vérifier si tous les joueurs sont prêts
        const allReady = Array.from(this.players.values()).every(p => p.ready);
        const allPlayersPresent = this.players.size === CONFIG.MAX_PLAYERS_PER_ROOM;

        if (allReady && allPlayersPresent) {
            logger.info('ROOM', `Tous les joueurs sont prêts ! Démarrage dans 3s...`, {
                roomId: this.id
            });

            // ✅ Démarrer après 3 secondes (sera countdown à l'étape 3)
            setTimeout(() => {
                this.startGame();
            }, 3000);
        }
    }

    // ============================================
    // PSEUDO MANAGEMENT
    // ============================================

    isPseudoTaken(pseudo, excludePlayerId = null) {
        const normalizedPseudo = pseudo.trim().toLowerCase();
        for (let [playerId, player] of this.players.entries()) {
            if (playerId !== excludePlayerId) {
                if (player.pseudo.toLowerCase() === normalizedPseudo) {
                    return true;
                }
            }
        }
        return false;
    }

    setPseudo(playerId, pseudo) {
        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, error: 'Joueur introuvable' };
        }

        const trimmed = pseudo.trim();

        // Valider format
        if (trimmed.length < 3 || trimmed.length > 12) {
            return { success: false, error: 'Le pseudo doit contenir entre 3 et 12 caractères' };
        }

        const regex = /^[a-zA-Z0-9_-]+$/;
        if (!regex.test(trimmed)) {
            return { success: false, error: 'Caractères autorisés: lettres, chiffres, _ et -' };
        }

        // Vérifier unicité
        if (this.isPseudoTaken(trimmed, playerId)) {
            return { success: false, error: 'Ce pseudo est déjà pris dans cette salle' };
        }

        // Mettre à jour
        player.pseudo = trimmed;
        logger.info('ROOM', `Pseudo mis à jour: ${playerId} → "${trimmed}"`);

        // Notifier tous les joueurs
        this.notifyPlayers({
            type: 'pseudo_updated',
            playerId: playerId,
            pseudo: trimmed
        });

        return { success: true, pseudo: trimmed };
    }

    /**
     * Broadcaster l'état du lobby à tous les joueurs
     */
    broadcastLobbyUpdate() {
        const players = Array.from(this.players.entries()).map(([id, p]) => ({
            playerId: id,
            number: p.number,
            pseudo: p.pseudo,
            ready: p.ready
        }));

        this.notifyPlayers({
            type: 'lobby_update',
            players: players,
            playerCount: this.players.size
        });

        logger.info('ROOM', `Lobby update broadcasté`, {
            roomId: this.id,
            playerCount: this.players.size
        });
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
            this.gameState.segments[player1.id] = player1.snake.length;
            logger.debug('GAME', `Player ${player1.number} perd 1 segment (plus petit)`);
        } else if (player2.snake.length < player1.snake.length) {
            player2.snake.shrink(1);
            player2.stats.segmentsLost++;
            this.gameState.segments[player2.id] = player2.snake.length;
            logger.debug('GAME', `Player ${player2.number} perd 1 segment (plus petit)`);
        }
        // Si égalité : personne ne perd

        // Tracker la collision
        player1.stats.headToHeadCollisions++;
        player2.stats.headToHeadCollisions++;

        // 2. Importer les helpers
        const { getPerpendicularLeft, getPerpendicularRight } = require('./SnakeServer.js');

        // 3. Calculer directions perpendiculaires (éjection à 90°)
        const leftDir = getPerpendicularLeft(player1.snake.direction);
        const rightDir = getPerpendicularRight(player1.snake.direction);

        // 4. Changer direction ET nextDirection
        player1.snake.direction = leftDir;
        player1.snake.nextDirection = leftDir;
        player2.snake.direction = rightDir;
        player2.snake.nextDirection = rightDir;

        // 5. ✅ SOLUTION : Faire 3 move() pour éloigner les serpents
        // move() déplace TOUT le serpent (tête + corps) correctement
        for (let i = 0; i < 3; i++) {
            player1.snake.move();
            player2.snake.move();
        }

        // 6. Invincibilité temporaire (500ms au lieu de 300ms)
        player1.invincible = true;
        player2.invincible = true;

        setTimeout(() => {
            player1.invincible = false;
            player2.invincible = false;
        }, 500);

        logger.info('GAME', `✅ Éjection 3 cases perpendiculaires`, {
            p1: { newPos: player1.snake.head, dir: leftDir },
            p2: { newPos: player2.snake.head, dir: rightDir }
        });
    }

    /**
     * Gère les collisions Tête vs Corps (sans power-up spécial)
     * Vol progressif de segments (1/sec, max 3)
     */
    handleBodyCollision(attacker, defender) {
        const now = Date.now();

        // Vérifier si nouveau contact ou changement de cible
        const isNewContact = !attacker.bodyContact.active ||
                            attacker.bodyContact.targetId !== defender.id;

        if (isNewContact) {
            attacker.bodyContact.active = true;
            attacker.bodyContact.targetId = defender.id;
            attacker.bodyContact.startTime = now;
            attacker.bodyContact.lastStealTime = now;
            attacker.bodyContact.stolenCount = 0;

            logger.info('GAME', `🍴 Player ${attacker.number} commence à voler des segments de Player ${defender.number}`);
        }

        // Vol progressif : 1er segment instantané, puis toutes les 600ms, max 3
        const timeSinceLastSteal = now - attacker.bodyContact.lastStealTime;

        // Vol instantané au premier contact, puis toutes les 600ms
        if ((attacker.bodyContact.stolenCount === 0 || timeSinceLastSteal >= 600) &&
            attacker.bodyContact.stolenCount < 3) {
            if (defender.snake.body.length > 3) {
                defender.snake.shrink(1);
                attacker.snake.grow();

                attacker.bodyContact.lastStealTime = now;
                attacker.bodyContact.stolenCount++;
                attacker.stats.segmentsEaten++;
                defender.stats.segmentsLost++;

                // ✅ Mettre à jour le tableau de scores
                this.gameState.segments[attacker.id] = attacker.snake.length;
                this.gameState.segments[defender.id] = defender.snake.length;

                logger.info('GAME', `🎯 Player ${attacker.number} vole segment #${attacker.bodyContact.stolenCount}/3 à Player ${defender.number}`);

                // Activer invincibilité victime pendant 3 secondes
                defender.victimInvincible = true;
                defender.victimInvincibleUntil = now + 3000;

                logger.debug('GAME', `🛡️ Player ${defender.number} devient invincible 3 secondes`);

                if (!defender.snake.alive) {
                    logger.info('GAME', `💀 Player ${defender.number} éliminé (vol de segments)`);
                }
            }
        }
    }

    /**
     * Gère l'effet du power-up ICE sur un adversaire
     * Gèle l'adversaire pendant 3 secondes (immobile)
     */
    handleIceEffect(attacker, defender) {
        const now = Date.now();

        // Geler l'adversaire
        if (!defender.frozen) {
            defender.frozen = true;
            defender.frozenUntil = now + 3000;

            logger.info('GAME', `❄️ Player ${attacker.number} gèle Player ${defender.number} pendant 3 secondes`);
        }
    }

    /**
     * Gère l'effet du power-up FIRE sur un adversaire
     * Brûle 1 segment + boost pour l'attaquant
     */
    handleFireEffect(attacker, defender) {
        if (defender.snake.body.length > 3) {
            defender.snake.shrink(1);
            attacker.snake.grow();

            attacker.stats.segmentsEaten++;
            defender.stats.segmentsLost++;

            // ✅ Mettre à jour le tableau de scores
            this.gameState.segments[attacker.id] = attacker.snake.length;
            this.gameState.segments[defender.id] = defender.snake.length;

            logger.info('GAME', `🔥 Player ${attacker.number} brûle 1 segment de Player ${defender.number}`);

            // Activer invincibilité victime pendant 3 secondes
            const now = Date.now();
            defender.victimInvincible = true;
            defender.victimInvincibleUntil = now + 3000;

            if (!defender.snake.alive) {
                logger.info('GAME', `💀 Player ${defender.number} éliminé par FIRE`);
            }
        }
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
        logger.info('GAME', `🎮 Démarrage countdown - Salle ${this.id}`);

        // ✅ Notifier les clients que le jeu va démarrer
        this.notifyPlayers({
            type: 'game_starting'
        });

        // 🔢 Countdown 5-4-3-2-1-GO
        const countdownSequence = [5, 4, 3, 2, 1];
        let index = 0;

        const countdownInterval = setInterval(() => {
            if (index < countdownSequence.length) {
                // Envoyer le tick du countdown
                this.notifyPlayers({
                    type: 'countdown_tick',
                    number: countdownSequence[index]
                });
                logger.info('GAME', `Countdown: ${countdownSequence[index]}`, { roomId: this.id });
                index++;
            } else {
                // Fin du countdown
                clearInterval(countdownInterval);

                // Envoyer GO
                this.notifyPlayers({
                    type: 'countdown_go'
                });
                logger.info('GAME', `🎮 GO! - Salle ${this.id}`);

                // Initialiser le jeu après un petit délai
                setTimeout(() => {
                    this.initializeGame();
                }, 500);
            }
        }, 1000);
    }

    initializeGame() {
        logger.info('GAME', `🎮 Partie initialisée - Salle ${this.id}`);

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

        const now = Date.now();

        // ===== GÉRER LES EFFETS TEMPORAIRES =====
        for (let player of this.players.values()) {
            // Dégeler les joueurs
            if (player.frozen && now >= player.frozenUntil) {
                player.frozen = false;
                logger.debug('GAME', `❄️ Player ${player.number} dégelé`);
            }

            // Fin invincibilité victime
            if (player.victimInvincible && now >= player.victimInvincibleUntil) {
                player.victimInvincible = false;
                logger.debug('GAME', `🛡️ Player ${player.number} perd invincibilité victime`);
            }
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

        // ===== COLLISION TÊTE-À-TÊTE PRÉDICTIVE (AVANT MOVE) =====
        // ✅ Détecter si deux serpents VONT se rencontrer à la prochaine position
        const players = Array.from(this.players.values());

        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const p1 = players[i];
                const p2 = players[j];

                if (!p1.snake.alive || !p2.snake.alive) continue;
                if (p1.frozen || p2.frozen) continue;
                if (p1.activePowerup === 'ghost' || p2.activePowerup === 'ghost') continue;
                if (p1.invincible || p2.invincible) continue;
                if (p1.victimInvincible || p2.victimInvincible) continue;

                // Calculer les prochaines positions des têtes
                const p1Head = p1.snake.head;
                const p2Head = p2.snake.head;

                const p1NextX = (p1Head.x + p1.snake.direction.dx + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;
                const p1NextY = (p1Head.y + p1.snake.direction.dy + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;

                const p2NextX = (p2Head.x + p2.snake.direction.dx + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;
                const p2NextY = (p2Head.y + p2.snake.direction.dy + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;

                // 🔍 DEBUG : Log positions prédictives
                logger.debug('PREDICTIVE', `P${p1.number} (${p1Head.x},${p1Head.y}) dir(${p1.snake.direction.dx},${p1.snake.direction.dy}) → (${p1NextX},${p1NextY}) | P${p2.number} (${p2Head.x},${p2Head.y}) dir(${p2.snake.direction.dx},${p2.snake.direction.dy}) → (${p2NextX},${p2NextY})`);

                // ✅ DÉTECTION TÊTE-À-TÊTE : Deux cas possibles
                let headToHeadDetected = false;

                // CAS 1 : Les têtes vont à la même position (collision directe)
                if (p1NextX === p2NextX && p1NextY === p2NextY) {
                    logger.info('COLLISION', `⚠️ COLLISION DIRECTE ! P${p1.number} et P${p2.number} vont en (${p1NextX},${p1NextY})`);
                    headToHeadDetected = true;
                }

                // CAS 2 : Les têtes ÉCHANGENT leurs positions (crossing)
                // P1 va où P2 est, ET P2 va où P1 est = ils se croisent!
                if (p1NextX === p2Head.x && p1NextY === p2Head.y &&
                    p2NextX === p1Head.x && p2NextY === p1Head.y) {
                    logger.info('COLLISION', `⚠️ CROSSING DÉTECTÉ ! P${p1.number} et P${p2.number} échangent positions (${p1Head.x},${p1Head.y}) ↔ (${p2Head.x},${p2Head.y})`);
                    headToHeadDetected = true;
                }

                // Traiter la collision tête-à-tête si détectée
                if (headToHeadDetected) {
                    if (!p1.headToHeadProcessed && !p2.headToHeadProcessed) {
                        logger.info('COLLISION', `💥 Tête-à-tête prédite entre Player ${p1.number} et Player ${p2.number}`);
                        this.handleHeadToHeadCollision(p1, p2);
                        p1.headToHeadProcessed = true;
                        p2.headToHeadProcessed = true;
                    } else {
                        logger.warn('COLLISION', `⚠️ Match ignoré (déjà traité) : P${p1.number}.processed=${p1.headToHeadProcessed}, P${p2.number}.processed=${p2.headToHeadProcessed}`);
                    }
                }
            }
        }

        // ===== DÉPLACER LES SERPENTS =====
        for (let player of this.players.values()) {
            if (!player.snake.alive) continue;

            // Ne pas bouger si gelé
            if (player.frozen) {
                logger.debug('GAME', `❄️ Player ${player.number} est gelé, skip move`);
                continue;
            }

            player.snake.move();

            // Vérifier collision avec soi-même
            if (player.snake.checkSelfCollision()) {
                player.snake.die();
                logger.info('GAME', `💀 Player ${player.number} se mord`);
                continue;
            }

            // Manger la nourriture
            if (player.snake.headAt(this.gameState.food.x, this.gameState.food.y)) {
                player.snake.grow();
                player.snake.addScore(10);
                this.gameState.scores[player.id] = player.snake.score;
                this.gameState.segments[player.id] = player.snake.length;
                this.gameState.food = this.generateFood();

                logger.debug('GAME', `⭐ Player ${player.number} mange (score: ${player.snake.score})`);
            }

            // Ramasser power-ups
            for (let i = this.gameState.powerups.length - 1; i >= 0; i--) {
                const powerup = this.gameState.powerups[i];
                if (player.snake.headAt(powerup.x, powerup.y)) {
                    player.activePowerup = powerup.type;
                    player.powerupEndTime = now + POWERUP_TYPES[powerup.type.toUpperCase()].duration;
                    player.stats.powerupsCollected++;

                    const symbol = POWERUP_TYPES[powerup.type.toUpperCase()].symbol;
                    logger.info('GAME', `${symbol} Player ${player.number} active ${powerup.type.toUpperCase()}`);

                    this.gameState.powerups.splice(i, 1);
                    this.gameState.powerups.push(this.generatePowerUp());
                    break;
                }
            }
        }

        // ===== COLLISIONS ENTRE SERPENTS (APRÈS MOVE) =====
        for (let player of this.players.values()) {
            if (!player.snake.alive) continue;
            if (player.activePowerup === 'ghost') continue; // Ghost traverse tout
            if (player.invincible) continue; // Invincible après éjection tête-à-tête
            if (player.victimInvincible) continue; // Invincible après perte de segments

            for (let opponent of this.players.values()) {
                if (opponent.id === player.id || !opponent.snake.alive) continue;
                if (opponent.activePowerup === 'ghost') continue;

                const myHead = player.snake.head;
                const opponentHead = opponent.snake.head;

                // Collision tête-à-tête déjà gérée AVANT move (détection prédictive)
                // Ignorer si les têtes se touchent après move (cas rare mais possible)
                if (myHead.x === opponentHead.x && myHead.y === opponentHead.y) {
                    continue;
                }

                // Vérifier collision tête vs corps
                const bodyCollision = player.snake.collidesWithBody(opponent.snake);

                if (bodyCollision) {
                    logger.debug('COLLISION', `${player.id} touche corps de ${opponent.id} - MaT te(${myHead.x},${myHead.y}) dir(${player.snake.direction.dx},${player.snake.direction.dy}) vs OpponentTête(${opponentHead.x},${opponentHead.y}) dir(${opponent.snake.direction.dx},${opponent.snake.direction.dy})`);

                    // Appliquer effet selon power-up actif
                    if (player.activePowerup === 'rock') {
                        // ROCK : Mange 2 segments
                        opponent.snake.shrink(2);
                        player.snake.grow();
                        player.snake.grow();
                        player.stats.segmentsEaten += 2;
                        opponent.stats.segmentsLost += 2;

                        // ✅ Mettre à jour le tableau de scores
                        this.gameState.segments[player.id] = player.snake.length;
                        this.gameState.segments[opponent.id] = opponent.snake.length;

                        logger.info('GAME', `🪨 Player ${player.number} ROCK mange 2 segments de Player ${opponent.number}`);

                        if (!opponent.snake.alive) {
                            logger.info('GAME', `💀 Player ${opponent.number} éliminé par ROCK`);
                        }
                    } else if (player.activePowerup === 'ice') {
                        // ICE : Geler l'adversaire
                        this.handleIceEffect(player, opponent);
                    } else if (player.activePowerup === 'fire') {
                        // FIRE : Brûler 1 segment
                        this.handleFireEffect(player, opponent);
                    } else {
                        // Pas de power-up : Vol progressif
                        this.handleBodyCollision(player, opponent);
                    }
                } else {
                    // Plus de contact : réinitialiser bodyContact
                    if (player.bodyContact.active && player.bodyContact.targetId === opponent.id) {
                        const totalStolen = player.bodyContact.stolenCount;
                        logger.info('GAME', `📤 Player ${player.number} perd le contact (${totalStolen} segments volés)`);

                        player.bodyContact.active = false;
                        player.bodyContact.targetId = null;
                        player.bodyContact.segmentIndex = -1;
                        player.bodyContact.stolenCount = 0;
                    }
                }
            }
        }

        // ✅ VALIDATION DE SÉCURITÉ (score et position)
        for (let player of this.players.values()) {
            if (!player.snake.alive) continue;

            // ✅ Valider le score
            const scoreValidation = securityValidator.validateScore(
                player.id,
                player.snake.length,  // Score = longueur
                this.gameState.matchStartTime,
                'multi'  // Mode multijoueur
            );

            if (!scoreValidation.valid) {
                logger.error('SECURITY', `Score invalide détecté`, {
                    playerId: player.id,
                    reason: scoreValidation.reason
                });

                if (scoreValidation.shouldKick) {
                    // Kick immédiat
                    player.snake.die();
                    logger.error('SECURITY', `🚨 Kick pour score invalide`, { playerId: player.id });
                }
            }

            // ✅ Vérifier téléportation SEULEMENT si pas de wrapping
            // Note: Le jeu a le wrapping (traversée de bords) activé,
            // donc les sauts de position sont légitimes (x=29 → x=0)
            const hasWrapping = true; // Ce jeu utilise le wrapping

            if (!hasWrapping) {
                const positionValidation = securityValidator.validatePosition(
                    player.id,
                    player.snake.head,
                    CONFIG.GRID_SIZE
                );

                if (!positionValidation.valid) {
                    logger.error('SECURITY', `Téléportation détectée`, {
                        playerId: player.id,
                        reason: positionValidation.reason
                    });

                    // Kick immédiat
                    player.snake.die();
                    logger.error('SECURITY', `🚨 Kick pour téléportation`, { playerId: player.id });
                }
            }
        }

        // ✅ Réinitialiser les flags de collision tête-à-tête pour le prochain tick
        for (let player of this.players.values()) {
            player.headToHeadProcessed = false;
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

        // ✅ NOUVEAU : Ignorer les inputs pendant l'invincibilité
        if (player.invincible) {
            logger.debug('INPUT', `🛡️ Input ignoré pour Player ${player.number} (invincible)`);
            return;
        }

        // ✅ NOUVEAU : Ignorer les inputs si gelé
        if (player.frozen) {
            logger.debug('INPUT', `❄️ Input ignoré pour Player ${player.number} (gelé)`);
            return;
        }

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
                pseudo: player.pseudo,              // ✅ NOUVEAU - Pseudo du joueur
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

wss.on('connection', (ws, req) => {
    // Obtenir l'IP du client
    const ip = req.socket.remoteAddress;

    // Vérifier si l'IP est bannie
    if (securityValidator.isIPBanned(ip)) {
        logger.warn('SECURITY', '🚫 Connexion refusée (IP bannie)', { ip });
        ws.close(1008, 'Banned');
        return;
    }

    const playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    logger.info('NETWORK', `🔌 Connexion`, { playerId, ip });

    // Initialiser le tracking de sécurité
    securityValidator.initPlayer(playerId, ip);

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
                case 'set_pseudo':
                    const result = room.setPseudo(playerId, message.pseudo);

                    if (!result.success) {
                        // Envoyer le message d'erreur
                        ws.send(JSON.stringify({
                            type: 'pseudo_taken',
                            error: result.error
                        }));

                        logger.warn('NETWORK', 'Pseudo refusé - déconnexion', {
                            playerId,
                            pseudo: message.pseudo,
                            reason: result.error
                        });

                        // Attendre que le message soit envoyé puis fermer
                        setTimeout(() => {
                            ws.close(1008, 'Pseudo already taken');
                            roomManager.removePlayer(playerId);
                        }, 100);
                    } else {
                        // Pseudo accepté
                        ws.send(JSON.stringify({
                            type: 'pseudo_response',
                            success: true,
                            pseudo: result.pseudo
                        }));
                    }
                    break;

                case 'player_ready':
                    room.setPlayerReady(playerId);
                    break;

                case 'input':
                    // ✅ VALIDER L'INPUT AVANT DE L'APPLIQUER
                    const validation = securityValidator.validateInput(
                        playerId,
                        message.direction
                    );

                    if (!validation.valid) {
                        logger.warn('SECURITY', `Input rejeté`, {
                            playerId,
                            reason: validation.reason
                        });

                        // Vérifier si le joueur doit être kické
                        const stats = securityValidator.getPlayerStats(playerId);
                        if (stats && stats.violationCount >= securityValidator.config.KICK_THRESHOLD) {
                            logger.error('SECURITY', `🚨 Kick joueur`, { playerId });

                            // ✅ Notifier le joueur kické
                            if (ws.readyState === 1) {
                                ws.send(JSON.stringify({
                                    type: 'kicked',
                                    reason: 'Violations de sécurité multiples détectées'
                                }));
                            }

                            // ✅ Notifier les autres joueurs (adversaire)
                            if (room) {
                                for (let [otherPlayerId, otherPlayer] of room.players) {
                                    if (otherPlayerId !== playerId && otherPlayer.ws.readyState === 1) {
                                        otherPlayer.ws.send(JSON.stringify({
                                            type: 'opponent_kicked',
                                            reason: 'Adversaire expulsé pour triche',
                                            winner: true,
                                            bonusPoints: 500
                                        }));
                                    }
                                }
                            }

                            // Fermer la connexion du joueur kické
                            setTimeout(() => {
                                ws.close(1008, 'Security violation');
                            }, 100);

                            roomManager.removePlayer(playerId);
                        }
                        break;
                    }

                    // Input valide, l'appliquer
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

        // Nettoyer les stats de sécurité
        securityValidator.cleanupPlayer(playerId);

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

// Endpoint de monitoring de sécurité
app.get('/security', (req, res) => {
    const summary = securityValidator.getSecuritySummary();

    // Ajouter infos sur les salles actives
    const rooms = [];
    for (let [roomId, room] of roomManager.rooms) {
        const players = [];

        for (let [pid, player] of room.players) {
            const stats = securityValidator.getPlayerStats(pid);
            players.push({
                id: pid,
                pseudo: player.pseudo || 'Inconnu',
                score: player.snake ? player.snake.length : 0,
                violations: stats ? stats.violationCount : 0
            });
        }

        rooms.push({
            id: roomId,
            playerCount: room.players.size,
            gameStarted: room.gameState.gameStarted,
            players: players
        });
    }

    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        security: summary,
        rooms: rooms
    });
});

logger.info('SERVER', '📊 Endpoint /security activé');

// ============================================
// DÉMARRAGE
// ============================================

server.listen(CONFIG.PORT, () => {
    logger.info('SERVER', '🚀 Serveur démarré avec power-ups', {
        port: CONFIG.PORT,
        baseTickRate: CONFIG.BASE_TICK_RATE,
        fireTickRate: CONFIG.FIRE_TICK_RATE,
        iceTickRate: CONFIG.ICE_TICK_RATE,
        matchDuration: CONFIG.MATCH_DURATION
    });
});

// ============================================
// LOGS PÉRIODIQUES DE SÉCURITÉ
// ============================================

// Logger l'état de sécurité toutes les minutes (seulement si violations)
setInterval(() => {
    const summary = securityValidator.getSecuritySummary();
    if (summary.totalViolations > 0 || summary.playersWithViolations > 0) {
        logger.info('SECURITY', '📊 État de sécurité périodique', summary);
    }
}, 60000); // 60 secondes = 1 minute

logger.info('SECURITY', '⏰ Logs périodiques activés (1 min)');

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