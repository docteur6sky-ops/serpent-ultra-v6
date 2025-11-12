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
    TICK_RATE: 275,              // Vitesse constante (275ms) - sweet spot
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
            activePowerup: null,        // ✅ NOUVEAU
            powerupEndTime: 0           // ✅ NOUVEAU
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

        // Reprogrammer avec la vitesse constante
        this.gameLoopTimeout = setTimeout(() => {
            this.gameLoopTick();
        }, CONFIG.TICK_RATE);
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
            let hitOpponent = false;
            for (let opponent of this.players.values()) {
                if (opponent.id === player.id || !opponent.snake.alive) continue;
                if (player.snake.collidesWithSnake(opponent.snake)) {
                    player.snake.die();
                    logger.info('GAME', `💀 Player ${player.number} éliminé`, { cause: 'opponent' });
                    hitOpponent = true;
                    break;
                }
            }

            if (hitOpponent) continue;

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

                    logger.info('GAME', `🎮 Player ${player.number} ramasse ${powerup.type}`, {
                        duration: POWERUP_TYPES[powerup.type.toUpperCase()].duration
                    });

                    // Retirer ce power-up et en générer un nouveau
                    this.gameState.powerups.splice(i, 1);
                    this.gameState.powerups.push(this.generatePowerUp());

                    break;
                }
            }

            // Pas de nourriture mangée - le move() a déjà géré le pop()
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
    console.log('║  🐍 SNAKE ULTRA V6 - LOGGER 🎮       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Serveur: http://localhost:${CONFIG.PORT}`);
    console.log(`⏱️  Timer: ${CONFIG.MATCH_DURATION / 1000}s`);
    console.log(`⚡ Vitesse: ${CONFIG.TICK_RATE}ms (constante)`);
    console.log('');
    console.log('Fonctionnalités:');
    console.log('  ⭐ Étoiles');
    console.log('  🎮 Prêt pour power-ups');
    console.log('');

    logger.info('SERVER', '🚀 Serveur démarré', {
        port: CONFIG.PORT,
        tickRate: CONFIG.TICK_RATE,
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