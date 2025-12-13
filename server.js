// ============================================
// 🎮 SERVEUR MULTIJOUEUR SNAKE ULTRA - V5 CORRIGÉ
// Avec crânes, murs, vitesse progressive et timer
// ============================================

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
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
    PORT: process.env.PORT || 3000,
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
    constructor(id, options = {}) {
        this.id = id;

        // ✅ LOBBY PRINCIPAL - Propriétés salons personnalisés
        this.name = options.name || `Salle ${id.split('_')[1]}`;
        this.isPublic = options.isPublic !== false; // Public par défaut
        this.code = options.code || null; // Code privé optionnel
        this.createdBy = options.createdBy || null;
        this.createdAt = Date.now();
        this.maxPlayers = options.maxPlayers || CONFIG.MAX_PLAYERS_PER_ROOM;

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
        const players = {}; // ✅ FIX: Ajouter les infos des joueurs (pseudo, number)
        for (let player of this.players.values()) {
            scores[player.id] = player.snake.length;
            players[player.id] = {
                pseudo: player.pseudo || `Joueur ${player.number}`,
                number: player.number
            };
        }

        this.notifyPlayers({
            type: 'game_over',
            reason: 'time_up',
            winner: longestPlayer ? longestPlayer.id : null,
            winnerNumber: longestPlayer ? longestPlayer.number : null,
            scores: scores,
            players: players, // ✅ FIX: Envoyer les pseudos
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

        // ✅ FIX BUG REJOUER: Réinitialiser le statut ready des joueurs
        for (let player of this.players.values()) {
            player.ready = false;
        }

        // Broadcaster le lobby update pour que les clients sachent
        this.broadcastLobbyUpdate();

        this.gameState.gameStarted = false;
        this.gameState.matchStartTime = null;
        this.gameState.matchTimeRemaining = CONFIG.MATCH_DURATION;
    }

    // ✅ LOBBY PRINCIPAL - Infos publiques pour la liste
    getPublicInfo() {
        return {
            id: this.id,
            name: this.name,
            isPublic: this.isPublic,
            hasPassword: !!this.code,
            playerCount: this.players.size,
            maxPlayers: this.maxPlayers,
            isGameStarted: this.gameState.gameStarted,
            createdAt: this.createdAt
        };
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
            const players = {}; // ✅ FIX: Ajouter les infos des joueurs
            for (let player of this.players.values()) {
                scores[player.id] = player.snake.length;
                players[player.id] = {
                    pseudo: player.pseudo || `Joueur ${player.number}`,
                    number: player.number
                };
            }

            this.notifyPlayers({
                type: 'game_over',
                reason: 'both_dead',
                winner: null,
                scores: scores,
                players: players, // ✅ FIX: Envoyer les pseudos
                message: '💀 Les deux joueurs sont morts !'
            });
            this.stopGame();
            return;
        }

        if (alivePlayers.length === 1) {
            const winner = alivePlayers[0];
            const scores = {};
            const players = {}; // ✅ FIX: Ajouter les infos des joueurs
            for (let player of this.players.values()) {
                scores[player.id] = player.snake.length;
                players[player.id] = {
                    pseudo: player.pseudo || `Joueur ${player.number}`,
                    number: player.number
                };
            }

            this.notifyPlayers({
                type: 'game_over',
                reason: 'opponent_died',
                winner: winner.id,
                winnerNumber: winner.number,
                scores: scores,
                players: players, // ✅ FIX: Envoyer les pseudos
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
                const bodyCollision = player.snake.collidesWithSnake(opponent.snake);

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

    // ✅ ANCIENNE MÉTHODE - Conservée pour compatibilité (matchmaking auto)
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

    // ✅ LOBBY PRINCIPAL - Créer salon personnalisé
    createCustomRoom(creatorId, name, isPublic = true, code = null) {
        const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

        const room = new Room(roomId, {
            name: name,
            isPublic: isPublic,
            code: code,
            createdBy: creatorId,
            maxPlayers: 2 // Fixé à 2 pour le moment
        });

        this.rooms.set(roomId, room);
        logger.info('MANAGER', `🏠 Salon personnalisé créé`, {
            roomId,
            name,
            isPublic,
            hasPassword: !!code,
            createdBy: creatorId
        });

        return room;
    }

    // ✅ LOBBY PRINCIPAL - Rejoindre salon par ID
    joinRoomById(playerId, ws, roomId, code = null) {
        const room = this.rooms.get(roomId);

        if (!room) {
            return { success: false, error: 'Salon introuvable' };
        }

        if (room.players.size >= room.maxPlayers) {
            return { success: false, error: 'Salon complet' };
        }

        if (room.code && room.code !== code) {
            return { success: false, error: 'Code incorrect' };
        }

        if (room.addPlayer(playerId, ws)) {
            this.playerToRoom.set(playerId, room.id);
            return {
                success: true,
                room: room,
                playerNumber: room.players.get(playerId).number,
                playersInRoom: room.players.size
            };
        }

        return { success: false, error: 'Erreur lors de l\'ajout au salon' };
    }

    // ✅ LOBBY PRINCIPAL - Liste des salons publics
    listPublicRooms() {
        const publicRooms = [];

        for (let room of this.rooms.values()) {
            // Afficher seulement les salons publics non démarrés et non pleins
            if (room.isPublic && !room.gameState.gameStarted && room.players.size < room.maxPlayers) {
                publicRooms.push(room.getPublicInfo());
            }
        }

        // Trier par date de création (plus récents en premier)
        publicRooms.sort((a, b) => b.createdAt - a.createdAt);

        // Limiter à 20 salons max pour éviter surcharge
        return publicRooms.slice(0, 20);
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

    // ✅ LOBBY PRINCIPAL - Ne plus auto-assigner à une room
    // Le joueur reste dans le lobby principal jusqu'à créer/rejoindre un salon
    ws.send(JSON.stringify({
        type: 'lobby_ready'
    }));

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            // ✅ LOBBY PRINCIPAL - Nouveaux messages qui ne nécessitent pas de room
            switch (message.type) {
                case 'list_rooms':
                    // Envoyer la liste des salons publics
                    const rooms = roomManager.listPublicRooms();
                    ws.send(JSON.stringify({
                        type: 'room_list',
                        rooms: rooms
                    }));
                    logger.info('LOBBY', `📋 Liste envoyée à ${playerId}`, { count: rooms.length });
                    return;

                case 'create_room':
                    // Créer un nouveau salon personnalisé
                    const newRoom = roomManager.createCustomRoom(
                        playerId,
                        message.name,
                        message.isPublic !== false,
                        message.code || null
                    );

                    // Ajouter le créateur au salon
                    if (newRoom.addPlayer(playerId, ws)) {
                        roomManager.playerToRoom.set(playerId, newRoom.id);
                        ws.send(JSON.stringify({
                            type: 'room_created',
                            roomId: newRoom.id,
                            playerNumber: newRoom.players.get(playerId).number,
                            playersInRoom: newRoom.players.size
                        }));
                        logger.info('LOBBY', `🏠 Salon créé et rejoint par ${playerId}`, { roomId: newRoom.id });
                    }
                    return;

                case 'join_room':
                    // Rejoindre un salon existant par ID
                    const joinResult = roomManager.joinRoomById(
                        playerId,
                        ws,
                        message.roomId,
                        message.code
                    );

                    if (joinResult.success) {
                        ws.send(JSON.stringify({
                            type: 'room_joined',
                            roomId: joinResult.room.id,
                            playerNumber: joinResult.playerNumber,
                            playersInRoom: joinResult.playersInRoom
                        }));
                        logger.info('LOBBY', `✅ ${playerId} a rejoint ${message.roomId}`);
                    } else {
                        ws.send(JSON.stringify({
                            type: 'join_error',
                            error: joinResult.error
                        }));
                        logger.warn('LOBBY', `❌ ${playerId} échec rejoindre ${message.roomId}`, { error: joinResult.error });
                    }
                    return;

                case 'quick_play':
                    // ⚡ QUICK PLAY - Rejoindre automatiquement un salon ou en créer un
                    logger.info('LOBBY', `⚡ Quick Play demandé par ${playerId}`);

                    // 1. Chercher un salon public disponible
                    let availableRoom = null;

                    // Debug: afficher tous les salons
                    logger.info('LOBBY', `⚡ Recherche de salons disponibles (total: ${roomManager.rooms.size})`);

                    for (let room of roomManager.rooms.values()) {
                        logger.debug('LOBBY', `⚡ Salon ${room.id}:`, {
                            isPublic: room.isPublic,
                            hasCode: !!room.code,
                            gameStarted: room.gameState.gameStarted,
                            players: room.players.size,
                            maxPlayers: room.maxPlayers
                        });

                        // Conditions: Public, sans code (ou code null/vide), partie pas commencée, places disponibles
                        if (room.isPublic &&
                            (!room.code || room.code === null || room.code === '') &&
                            !room.gameState.gameStarted &&
                            room.players.size < room.maxPlayers) {
                            availableRoom = room;
                            logger.info('LOBBY', `⚡ Salon trouvé: ${room.id}`);
                            break;
                        }
                    }

                    // 2. Si salon trouvé, rejoindre
                    if (availableRoom) {
                        if (availableRoom.addPlayer(playerId, ws)) {
                            roomManager.playerToRoom.set(playerId, availableRoom.id);
                            ws.send(JSON.stringify({
                                type: 'room_joined',
                                roomId: availableRoom.id,
                                playerNumber: availableRoom.players.get(playerId).number,
                                playersInRoom: availableRoom.players.size
                            }));
                            logger.info('LOBBY', `⚡ Quick Play: ${playerId} rejoint ${availableRoom.id}`);
                        }
                    } else {
                        // 3. Sinon, créer un nouveau salon
                        logger.info('LOBBY', `⚡ Aucun salon disponible, création d'un nouveau salon`);
                        const quickRoom = roomManager.createCustomRoom(
                            playerId,
                            'Quick Play',
                            true,
                            null
                        );

                        if (quickRoom.addPlayer(playerId, ws)) {
                            roomManager.playerToRoom.set(playerId, quickRoom.id);
                            ws.send(JSON.stringify({
                                type: 'room_created',
                                roomId: quickRoom.id,
                                playerNumber: quickRoom.players.get(playerId).number,
                                playersInRoom: quickRoom.players.size
                            }));
                            logger.info('LOBBY', `⚡ Quick Play: ${playerId} crée ${quickRoom.id}`);
                        }
                    }
                    return;
            }

            // ✅ Messages qui nécessitent d'être dans une room
            const room = roomManager.getPlayerRoom(playerId);

            if (!room) {
                logger.warn('NETWORK', `${playerId} pas dans une room pour ${message.type}`);
                return;
            }

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

                case 'player_abandon':
                    // 🏳️ Un joueur abandonne la partie
                    logger.info('GAME', `🏳️ ${playerId} abandonne la partie`, { roomId: room.id });

                    // Arrêter la partie
                    room.stopGame();

                    // Notifier l'adversaire qu'il gagne par abandon
                    for (let [otherPlayerId, otherPlayer] of room.players) {
                        if (otherPlayerId !== playerId && otherPlayer.ws.readyState === 1) {
                            otherPlayer.ws.send(JSON.stringify({
                                type: 'opponent_abandoned',
                                message: 'Votre adversaire a abandonné',
                                winner: true,
                                reason: 'abandon'
                            }));
                            logger.info('GAME', `✅ ${otherPlayerId} gagne par abandon`);
                        }
                    }

                    // Confirmer l'abandon au joueur qui abandonne
                    if (ws.readyState === 1) {
                        ws.send(JSON.stringify({
                            type: 'abandon_confirmed',
                            message: 'Vous avez abandonné la partie'
                        }));
                    }
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

// 🌐 CORS - Configuration sécurisée
// Permet les requêtes cross-origin pour l'app mobile Capacitor
app.use((req, res, next) => {
    // Origines autorisées (ajuster en production)
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:5500',
        'capacitor://localhost',           // Android Capacitor
        'ionic://localhost',               // iOS Ionic
        'http://192.168.1.100:3000',       // LAN local (ajuster l'IP)
        'https://snake-ultra.com'          // Domaine production (à configurer)
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight 24h

    // Répondre immédiatement aux requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

// 🚫 NO-CACHE pour le développement (évite les problèmes de cache navigateur)
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
});

app.use(express.static(path.join(__dirname, 'www'), {
    etag: false,
    lastModified: false
}));

// Parser JSON pour les requêtes API
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// ============================================
// 🏆 API LEADERBOARD ROGUELIKE
// ============================================

const LEADERBOARD_FILE = path.join(__dirname, 'data', 'roguelike-leaderboard.json');
const MAX_LEADERBOARD_SIZE = 100;

/**
 * Charge le leaderboard depuis le fichier
 */
function loadLeaderboard() {
    try {
        // Créer le dossier data s'il n'existe pas
        const dataDir = path.dirname(LEADERBOARD_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        if (fs.existsSync(LEADERBOARD_FILE)) {
            const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        logger.error('LEADERBOARD', 'Erreur chargement leaderboard', error);
    }
    return [];
}

/**
 * Sauvegarde le leaderboard dans le fichier
 */
function saveLeaderboard(leaderboard) {
    try {
        const dataDir = path.dirname(LEADERBOARD_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), 'utf8');
        logger.info('LEADERBOARD', `💾 Leaderboard sauvegardé (${leaderboard.length} entrées)`);
    } catch (error) {
        logger.error('LEADERBOARD', 'Erreur sauvegarde leaderboard', error);
    }
}

/**
 * Valide un pseudo (anti-spam, caractères valides)
 */
function validatePseudo(pseudo) {
    if (!pseudo || typeof pseudo !== 'string') return false;
    const trimmed = pseudo.trim();
    if (trimmed.length < 2 || trimmed.length > 16) return false;
    // Autoriser lettres, chiffres, espaces, tirets, underscores
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) return false;
    return trimmed;
}

/**
 * Valide un score (anti-triche renforcé)
 */
function validateScore(data) {
    // Vérifications de base
    if (!data || typeof data !== 'object') return { valid: false, reason: 'invalid_data' };
    if (typeof data.score !== 'number' || data.score < 0) return { valid: false, reason: 'invalid_score' };
    if (typeof data.level !== 'number' || data.level < 1) return { valid: false, reason: 'invalid_level' };

    // Limites raisonnables (anti-triche)
    if (data.score > 999999) return { valid: false, reason: 'score_too_high' };
    if (data.level > 50) return { valid: false, reason: 'level_too_high' };

    // Vérifier la cohérence score/level (heuristique ajustée pour combos/multipliers)
    const maxScorePerLevel = 10000; // Augmenté pour tenir compte des combos élevés
    if (data.score > data.level * maxScorePerLevel) {
        return { valid: false, reason: 'score_level_mismatch' };
    }

    // Vérifier le temps minimum (15 secondes par niveau minimum)
    if (data.time !== undefined && data.level > 1) {
        const minExpectedTime = data.level * 15 * 0.5; // 50% du temps minimal
        if (data.time < minExpectedTime) {
            return { valid: false, reason: 'time_too_short' };
        }
    }

    // Vérifier les pommes par minute (max 120 par minute)
    if (data.apples !== undefined && data.time > 0) {
        const applesPerMinute = (data.apples / data.time) * 60;
        if (applesPerMinute > 150) { // Un peu de marge
            return { valid: false, reason: 'apples_too_fast' };
        }
    }

    return { valid: true };
}

/**
 * Vérifie le token de sécurité client
 */
function verifySecurityToken(verifyToken) {
    if (!verifyToken) return { valid: false, reason: 'no_token' };

    try {
        // Décoder base64 -> UTF8
        const decoded = JSON.parse(Buffer.from(verifyToken, 'base64').toString('utf8'));

        // Vérifier que le token n'est pas trop vieux (5 minutes max)
        if (Date.now() - decoded.timestamp > 5 * 60 * 1000) {
            return { valid: false, reason: 'token_expired' };
        }

        // Vérifier qu'il y a une session ID
        if (!decoded.sessionId) {
            return { valid: false, reason: 'no_session' };
        }

        return {
            valid: true,
            sessionId: decoded.sessionId,
            checksum: decoded.checksum,
            timestamp: decoded.timestamp
        };
    } catch (e) {
        logger.warn('SECURITY', 'Token verification failed:', e.message);
        return { valid: false, reason: 'invalid_token' };
    }
}

// GET /api/roguelike/leaderboard - Récupérer le classement
app.get('/api/roguelike/leaderboard', (req, res) => {
    try {
        const leaderboard = loadLeaderboard();
        const limit = Math.min(parseInt(req.query.limit) || 50, MAX_LEADERBOARD_SIZE);
        const offset = parseInt(req.query.offset) || 0;

        // Trier par score décroissant
        const sorted = leaderboard.sort((a, b) => b.score - a.score);

        // Paginer
        const paginated = sorted.slice(offset, offset + limit);

        // Ajouter le rang
        const ranked = paginated.map((entry, idx) => ({
            ...entry,
            rank: offset + idx + 1
        }));

        res.json({
            success: true,
            total: leaderboard.length,
            offset,
            limit,
            data: ranked
        });

        logger.info('LEADERBOARD', `📊 Leaderboard envoyé (${ranked.length} entrées)`);
    } catch (error) {
        logger.error('LEADERBOARD', 'Erreur GET leaderboard', error);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

// POST /api/roguelike/scores - Soumettre un score
app.post('/api/roguelike/scores', (req, res) => {
    try {
        const { pseudo, score, level, apples, time, upgrades, date, trustScore, verifyToken, sessionId } = req.body;

        // Valider le pseudo
        const cleanPseudo = validatePseudo(pseudo);
        if (!cleanPseudo) {
            return res.status(400).json({ success: false, error: 'invalid_pseudo' });
        }

        // Valider le score (avec temps et pommes maintenant)
        const scoreValidation = validateScore({ score, level, time, apples });
        if (!scoreValidation.valid) {
            logger.warn('LEADERBOARD', `⚠️ Score rejeté: ${scoreValidation.reason}`, { pseudo: cleanPseudo, score, level });
            return res.status(400).json({ success: false, error: scoreValidation.reason });
        }

        // Vérifier le token de sécurité (optionnel pour compatibilité)
        let securityInfo = { verified: false };
        if (verifyToken) {
            const tokenValidation = verifySecurityToken(verifyToken);
            if (tokenValidation.valid) {
                securityInfo = {
                    verified: true,
                    sessionId: tokenValidation.sessionId,
                    trustScore: trustScore || 0
                };
            } else {
                logger.warn('LEADERBOARD', `⚠️ Token invalide: ${tokenValidation.reason}`, { pseudo: cleanPseudo });
            }
        }

        // Rejeter les scores avec trustScore trop bas (< 30)
        if (securityInfo.verified && securityInfo.trustScore < 30) {
            logger.warn('LEADERBOARD', `⚠️ TrustScore trop bas: ${securityInfo.trustScore}`, { pseudo: cleanPseudo, score, level });
            return res.status(400).json({ success: false, error: 'suspicious_activity' });
        }

        // Charger le leaderboard
        const leaderboard = loadLeaderboard();

        // Créer l'entrée
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            pseudo: cleanPseudo,
            score: Math.floor(score),
            level: Math.floor(level),
            apples: Math.floor(apples) || 0,
            time: Math.floor(time) || 0,
            upgrades: Math.floor(upgrades) || 0,
            date: new Date().toISOString(),
            verified: securityInfo.verified,
            trustScore: securityInfo.trustScore || null
        };

        // Ajouter l'entrée
        leaderboard.push(entry);

        // Trier et limiter
        leaderboard.sort((a, b) => b.score - a.score);
        const trimmed = leaderboard.slice(0, MAX_LEADERBOARD_SIZE);

        // Sauvegarder
        saveLeaderboard(trimmed);

        // Calculer le rang
        const rank = trimmed.findIndex(e => e.id === entry.id) + 1;
        const isInTop = rank > 0 && rank <= MAX_LEADERBOARD_SIZE;

        logger.info('LEADERBOARD', `✅ Score soumis: ${cleanPseudo} - ${score} pts (Niveau ${level})`, { rank: isInTop ? rank : 'hors top' });

        res.json({
            success: true,
            entry: { ...entry, rank: isInTop ? rank : null },
            isInTop,
            message: isInTop ? `🏆 Top ${rank} !` : 'Score enregistré'
        });
    } catch (error) {
        logger.error('LEADERBOARD', 'Erreur POST score', error);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

// GET /api/roguelike/rank/:pseudo - Obtenir le rang d'un joueur
app.get('/api/roguelike/rank/:pseudo', (req, res) => {
    try {
        const pseudo = validatePseudo(req.params.pseudo);
        if (!pseudo) {
            return res.status(400).json({ success: false, error: 'invalid_pseudo' });
        }

        const leaderboard = loadLeaderboard();
        const sorted = leaderboard.sort((a, b) => b.score - a.score);

        // Trouver toutes les entrées du joueur
        const playerEntries = sorted
            .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
            .filter(entry => entry.pseudo.toLowerCase() === pseudo.toLowerCase());

        if (playerEntries.length === 0) {
            return res.json({
                success: true,
                found: false,
                message: 'Aucun score trouvé'
            });
        }

        // Meilleur score du joueur
        const best = playerEntries[0];

        res.json({
            success: true,
            found: true,
            best,
            totalEntries: playerEntries.length
        });
    } catch (error) {
        logger.error('LEADERBOARD', 'Erreur GET rank', error);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

logger.info('SERVER', '🏆 API Leaderboard Roguelike activée');

// ============================================
// 🎯 API DAILY CHALLENGE ROGUELIKE
// ============================================

const DAILY_FILE = path.join(__dirname, 'data', 'roguelike-daily.json');
const MAX_DAILY_ATTEMPTS = 3;

// Modificateurs possibles pour les défis
const DAILY_MODIFIERS = {
    speed: [
        { id: 'slow', name: 'Escargot', description: 'Vitesse réduite de 20%', value: 0.8 },
        { id: 'normal', name: 'Normal', description: 'Vitesse normale', value: 1.0 },
        { id: 'fast', name: 'Turbo', description: 'Vitesse +30%', value: 1.3 },
        { id: 'insane', name: 'Démoniaque', description: 'Vitesse +50%', value: 1.5 }
    ],
    apples: [
        { id: 'scarce', name: 'Famine', description: 'Pommes rares', value: 0.5 },
        { id: 'normal', name: 'Normal', description: 'Spawn normal', value: 1.0 },
        { id: 'abundant', name: 'Abondance', description: 'Pommes fréquentes', value: 1.5 }
    ],
    obstacles: [
        { id: 'none', name: 'Vide', description: 'Aucun obstacle', value: 0 },
        { id: 'few', name: 'Parsemé', description: 'Quelques murs', value: 1 },
        { id: 'many', name: 'Labyrinthique', description: 'Beaucoup de murs', value: 2 },
        { id: 'chaos', name: 'Chaos', description: 'Murs + crânes', value: 3 }
    ],
    special: [
        { id: 'none', name: 'Aucun', description: 'Pas de règle spéciale', effect: null },
        { id: 'no_powerups', name: 'Purist', description: 'Pas de power-ups', effect: 'no_powerups' },
        { id: 'one_life', name: 'Hardcore', description: 'Une seule vie', effect: 'one_life' },
        { id: 'reverse', name: 'Miroir', description: 'Contrôles inversés', effect: 'reverse' },
        { id: 'growing', name: 'Croissance', description: '+1 segment/3 sec', effect: 'auto_grow' },
        { id: 'shrinking', name: 'Déclin', description: '-1 segment/5 sec', effect: 'auto_shrink' }
    ]
};

/**
 * Générateur pseudo-aléatoire avec seed (Mulberry32)
 */
function seededRandom(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/**
 * Génère la seed du jour (basée sur la date UTC)
 */
function getDailySeed() {
    const now = new Date();
    const dateStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
    // Convertir en nombre pour la seed
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Génère le défi du jour
 */
function generateDailyChallenge() {
    const seed = getDailySeed();
    const rng = seededRandom(seed);

    // Sélectionner les modificateurs avec la seed
    const challenge = {
        seed: seed,
        date: new Date().toISOString().split('T')[0],
        name: generateChallengeName(rng),
        modifiers: {
            speed: DAILY_MODIFIERS.speed[Math.floor(rng() * DAILY_MODIFIERS.speed.length)],
            apples: DAILY_MODIFIERS.apples[Math.floor(rng() * DAILY_MODIFIERS.apples.length)],
            obstacles: DAILY_MODIFIERS.obstacles[Math.floor(rng() * DAILY_MODIFIERS.obstacles.length)],
            special: DAILY_MODIFIERS.special[Math.floor(rng() * DAILY_MODIFIERS.special.length)]
        },
        targetLevel: 5 + Math.floor(rng() * 6), // Niveau cible: 5-10
        bonusXP: 100 + Math.floor(rng() * 200)  // Bonus XP: 100-300
    };

    return challenge;
}

/**
 * Génère un nom de défi aléatoire
 */
function generateChallengeName(rng) {
    const adjectives = ['Dangereux', 'Mystique', 'Infernal', 'Glacial', 'Toxique', 'Royal', 'Maudit', 'Légendaire'];
    const nouns = ['Serpent', 'Labyrinthe', 'Piège', 'Défi', 'Épreuve', 'Parcours', 'Test', 'Combat'];
    return `${adjectives[Math.floor(rng() * adjectives.length)]} ${nouns[Math.floor(rng() * nouns.length)]}`;
}

/**
 * Charge les données du daily
 */
function loadDailyData() {
    try {
        if (fs.existsSync(DAILY_FILE)) {
            const data = fs.readFileSync(DAILY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        logger.error('DAILY', 'Erreur chargement daily', error);
    }
    return { date: null, leaderboard: [], attempts: {} };
}

/**
 * Sauvegarde les données du daily
 */
function saveDailyData(data) {
    try {
        fs.writeFileSync(DAILY_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        logger.error('DAILY', 'Erreur sauvegarde daily', error);
    }
}

/**
 * Réinitialise le daily si la date a changé
 */
function checkAndResetDaily(data) {
    const today = new Date().toISOString().split('T')[0];
    if (data.date !== today) {
        logger.info('DAILY', `🔄 Reset du Daily Challenge (${data.date} → ${today})`);
        return { date: today, leaderboard: [], attempts: {} };
    }
    return data;
}

// GET /api/roguelike/daily - Récupérer le défi du jour
app.get('/api/roguelike/daily', (req, res) => {
    try {
        const challenge = generateDailyChallenge();
        const pseudo = req.query.pseudo;

        let dailyData = loadDailyData();
        dailyData = checkAndResetDaily(dailyData);
        saveDailyData(dailyData);

        // Vérifier les tentatives restantes pour ce joueur
        let attemptsLeft = MAX_DAILY_ATTEMPTS;
        if (pseudo && dailyData.attempts[pseudo]) {
            attemptsLeft = Math.max(0, MAX_DAILY_ATTEMPTS - dailyData.attempts[pseudo]);
        }

        // Calculer le temps restant avant reset (minuit UTC)
        const now = new Date();
        const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const timeRemaining = tomorrow - now;

        res.json({
            success: true,
            challenge,
            attemptsLeft,
            maxAttempts: MAX_DAILY_ATTEMPTS,
            timeRemaining,
            resetAt: tomorrow.toISOString()
        });

        logger.info('DAILY', `📅 Défi du jour envoyé: "${challenge.name}"`);
    } catch (error) {
        logger.error('DAILY', 'Erreur GET daily', error);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

// POST /api/roguelike/daily/scores - Soumettre un score daily
app.post('/api/roguelike/daily/scores', (req, res) => {
    try {
        const { pseudo, score, level, time, seed } = req.body;

        // Valider le pseudo
        const cleanPseudo = validatePseudo(pseudo);
        if (!cleanPseudo) {
            return res.status(400).json({ success: false, error: 'invalid_pseudo' });
        }

        // Vérifier que la seed correspond au défi du jour
        const todayChallenge = generateDailyChallenge();
        if (seed !== todayChallenge.seed) {
            logger.warn('DAILY', `⚠️ Seed invalide: ${seed} vs ${todayChallenge.seed}`);
            return res.status(400).json({ success: false, error: 'invalid_seed' });
        }

        // Charger et vérifier les données
        let dailyData = loadDailyData();
        dailyData = checkAndResetDaily(dailyData);

        // Vérifier les tentatives
        const currentAttempts = dailyData.attempts[cleanPseudo] || 0;
        if (currentAttempts >= MAX_DAILY_ATTEMPTS) {
            return res.status(400).json({
                success: false,
                error: 'no_attempts_left',
                message: 'Plus de tentatives pour aujourd\'hui'
            });
        }

        // Incrémenter les tentatives
        dailyData.attempts[cleanPseudo] = currentAttempts + 1;

        // Créer l'entrée
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            pseudo: cleanPseudo,
            score: Math.floor(score),
            level: Math.floor(level),
            time: Math.floor(time) || 0,
            attempt: currentAttempts + 1,
            date: new Date().toISOString()
        };

        // Ajouter au leaderboard
        dailyData.leaderboard.push(entry);

        // Trier par score décroissant
        dailyData.leaderboard.sort((a, b) => b.score - a.score);

        // Garder seulement le meilleur score par joueur
        const bestByPlayer = {};
        dailyData.leaderboard = dailyData.leaderboard.filter(e => {
            const key = e.pseudo.toLowerCase();
            if (!bestByPlayer[key]) {
                bestByPlayer[key] = true;
                return true;
            }
            return false;
        });

        // Limiter à 100 entrées
        dailyData.leaderboard = dailyData.leaderboard.slice(0, 100);

        // Sauvegarder
        saveDailyData(dailyData);

        // Calculer le rang
        const rank = dailyData.leaderboard.findIndex(e => e.pseudo.toLowerCase() === cleanPseudo.toLowerCase()) + 1;

        // Bonus si objectif atteint
        const targetReached = level >= todayChallenge.targetLevel;
        const bonusXP = targetReached ? todayChallenge.bonusXP : 0;

        logger.info('DAILY', `✅ Score daily: ${cleanPseudo} - ${score} pts (Niveau ${level}, Rang #${rank})`);

        res.json({
            success: true,
            entry: { ...entry, rank },
            attemptsLeft: MAX_DAILY_ATTEMPTS - (currentAttempts + 1),
            targetReached,
            bonusXP,
            message: targetReached
                ? `🎯 Objectif atteint ! +${bonusXP} XP bonus`
                : `Score enregistré (Rang #${rank})`
        });
    } catch (error) {
        logger.error('DAILY', 'Erreur POST daily score', error);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

// GET /api/roguelike/daily/leaderboard - Classement du jour
app.get('/api/roguelike/daily/leaderboard', (req, res) => {
    try {
        let dailyData = loadDailyData();
        dailyData = checkAndResetDaily(dailyData);

        const challenge = generateDailyChallenge();

        // Ajouter le rang
        const ranked = dailyData.leaderboard.map((entry, idx) => ({
            ...entry,
            rank: idx + 1
        }));

        res.json({
            success: true,
            challenge: {
                name: challenge.name,
                targetLevel: challenge.targetLevel,
                bonusXP: challenge.bonusXP
            },
            total: ranked.length,
            data: ranked.slice(0, 50)
        });
    } catch (error) {
        logger.error('DAILY', 'Erreur GET daily leaderboard', error);
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

logger.info('SERVER', '🎯 API Daily Challenge activée');

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
// ✅ FIX: Assigné à une variable pour cleanup dans gracefulShutdown
let securityLogInterval = setInterval(() => {
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

    // ✅ FIX: Nettoyer l'interval de sécurité
    if (securityLogInterval) {
        clearInterval(securityLogInterval);
        securityLogInterval = null;
        logger.info('SERVER', '🧹 Interval sécurité nettoyé');
    }

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