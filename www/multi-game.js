// ============================================
// MULTIPLAYER SNAKE GAME - MODE MULTIJOUEUR ENCAPSULÉ
// ============================================

class MultiplayerSnakeGame {
    constructor() {
        // Canvas dédié au multijoueur
        this.canvas = document.getElementById('canvas-multi');
        if (!this.canvas) {
            throw new Error('Canvas canvas-multi introuvable!');
        }
        this.ctx = this.canvas.getContext('2d');

        // Configuration
        this.GRID_SIZE = 30;
        this.CANVAS_SIZE = 360;
        this.CELL_SIZE = 360 / 30; // 12px

        // Client WebSocket
        this.client = new MultiplayerClient();

        // État du serveur
        this.serverState = null;

        // Contrôle
        this.isActive = false;
        this.renderRAF = null;
        this.timerInterval = null;

        // Couleurs
        this.COLORS = {
            GOLD: '#D4AF37',
            BG_DARK: '#0f0f23',
            grid: '#404060',
            border: '#D4AF37'
        };

        // Setup des callbacks
        this.setupCallbacks();
    }

    // ============================================
    // SETUP CALLBACKS
    // ============================================

    setupCallbacks() {
        this.client.onConnected = (message) => {
            console.log('🎮 Connecté au serveur multijoueur');
        };

        this.client.onRoomJoined = (message) => {
            console.log(`🏠 Salle rejointe - Joueur ${message.playerNumber}`);

            // ✅ Envoyer le pseudo immédiatement après avoir rejoint la salle
            const pseudo = window.getValidPseudo ? window.getValidPseudo() : null;
            if (pseudo) {
                this.client.sendPseudo(pseudo);
            }

            if (message.playersInRoom === 1) {
                this.showWaitingOverlay();
            } else {
                this.hideWaitingOverlay();
                setTimeout(() => this.client.sendReady(), 1000);
            }
        };

        this.client.onRoomFull = (message) => {
            console.log('🎉 Salle complète - 2 joueurs');
            this.hideWaitingOverlay();
            setTimeout(() => this.client.sendReady(), 1000);
        };

        this.client.onGameStart = (message) => {
            console.log('🎮 Démarrage de la partie!');
            this.hideWaitingOverlay();
            this.isActive = true;

            if (message.gameState) {
                this.serverState = message.gameState;
            }

            this.startRenderLoop();
            this.startTimerUpdate();

            // Cacher UNIQUEMENT le menu multijoueur au démarrage de la partie
            const multiMenu = document.getElementById('multiplayer-menu');
            if (multiMenu) {
                multiMenu.classList.add('hidden');
                multiMenu.classList.remove('active');
                console.log('🧹 Menu multijoueur caché');
            }
        };

        this.client.onGameUpdate = (gameState) => {
            this.serverState = gameState;
        };

        this.client.onGameOver = (message) => {
            console.log('🏁 Fin de partie multijoueur');
            this.stopRenderLoop();
            this.stopTimerUpdate();
            this.showGameOver(message);
        };

        this.client.onPlayerLeft = (message) => {
            console.log('👋 Adversaire déconnecté');
            this.stopRenderLoop();
            this.stopTimerUpdate();
            this.client.showMessage('Adversaire déconnecté', 'warning');
            setTimeout(() => this.returnToMenu(), 3000);
        };
    }

    // ============================================
    // DÉMARRAGE & ARRÊT
    // ============================================

    start() {
        console.log('🎮 Démarrage mode multijoueur');
        this.isActive = false;
        this.serverState = null;

        // Connecter au serveur
        this.client.connect();
    }

    stop() {
        console.log('🛑 Arrêt mode multijoueur');
        this.isActive = false;

        this.stopRenderLoop();
        this.stopTimerUpdate();
        this.client.disconnect();

        // Nettoyer TOUS les overlays créés dynamiquement
        this.cleanupOverlays();
    }

    cleanupOverlays() {
        // Supprimer tous les overlays dynamiques du multijoueur
        const overlayIds = ['mp-waiting-overlay', 'mp-gameover-overlay', 'mp-message'];
        overlayIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
                console.log(`🧹 Overlay ${id} supprimé`);
            }
        });
    }

    // ============================================
    // BOUCLE DE RENDU
    // ============================================

    startRenderLoop() {
        console.log('🎨 Démarrage boucle de rendu');

        const render = () => {
            if (!this.isActive) return;
            this.draw();
            this.renderRAF = requestAnimationFrame(render);
        };

        render();
    }

    stopRenderLoop() {
        if (this.renderRAF) {
            cancelAnimationFrame(this.renderRAF);
            this.renderRAF = null;
        }
    }

    // ============================================
    // RENDU (Avec RenderUtils)
    // ============================================

    draw() {
        if (!this.serverState || !this.ctx) return;

        // Effacer le canvas
        this.ctx.fillStyle = this.COLORS.BG_DARK;
        this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

        // Dessiner la grille (même style que le solo)
        RenderUtils.drawGrid(
            this.ctx,
            this.GRID_SIZE,
            this.CELL_SIZE,
            this.CANVAS_SIZE,
            { grid: this.COLORS.grid, border: this.COLORS.border }
        );

        // Dessiner la nourriture (même étoile dorée que le solo)
        if (this.serverState.food) {
            RenderUtils.drawStar(
                this.ctx,
                this.serverState.food.x,
                this.serverState.food.y,
                this.CELL_SIZE
            );
        }

        // Dessiner les power-ups
        if (this.serverState.powerups && this.serverState.powerups.length > 0) {
            const powerupColors = {
                fire: '#FF4500',
                ice: '#00CED1',
                ghost: '#FFFFFF',
                rock: '#D2B48C'
            };

            const powerupEmojis = {
                fire: '🔥',
                ice: '❄️',
                ghost: '👻',
                rock: '🪨'
            };

            this.serverState.powerups.forEach(powerup => {
                const x = powerup.x * this.CELL_SIZE;
                const y = powerup.y * this.CELL_SIZE;

                // Fond coloré avec transparence
                this.ctx.fillStyle = powerupColors[powerup.type] || '#FFFFFF';
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
                this.ctx.globalAlpha = 1;

                // Emoji au centre
                this.ctx.font = `${this.CELL_SIZE * 0.8}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    powerupEmojis[powerup.type] || '?',
                    x + this.CELL_SIZE / 2,
                    y + this.CELL_SIZE / 2
                );
            });
        }

        // Dessiner le crâne (même que le solo)
        if (this.serverState.bad) {
            RenderUtils.drawSkull(
                this.ctx,
                this.serverState.bad.x,
                this.serverState.bad.y,
                this.CELL_SIZE
            );
        }

        // Dessiner les obstacles (même murs que le solo)
        if (this.serverState.obstacles && this.serverState.obstacles.length > 0) {
            for (let obs of this.serverState.obstacles) {
                RenderUtils.drawWall(
                    this.ctx,
                    obs.x,
                    obs.y,
                    this.CELL_SIZE
                );
            }
        }

        // Dessiner les serpents des joueurs
        if (this.serverState.players) {
            for (let [playerId, playerData] of Object.entries(this.serverState.players)) {
                if (!playerData.snake || playerData.snake.length === 0) continue;

                const isMe = playerId === this.client.playerId;
                const isAlive = playerData.alive;
                const activePowerup = playerData.activePowerup;

                // Couleur du serpent (modifiée par power-up)
                let headColor = isMe ? '#00FF87' : '#FF6B6B';
                const deadColor = '#666666';

                // Modifier la couleur selon le power-up actif
                if (isAlive && activePowerup) {
                    const powerupColors = {
                        fire: '#FF4500',
                        ice: '#00CED1',
                        ghost: '#E0E0E0',
                        rock: '#D2B48C'
                    };
                    headColor = powerupColors[activePowerup] || headColor;
                }

                // Appliquer l'opacité pour GHOST
                if (isAlive && activePowerup === 'ghost') {
                    this.ctx.globalAlpha = 0.6;
                }

                // Dessiner particules FIRE avant le serpent
                if (isAlive && activePowerup === 'fire' && playerData.snake.length > 0) {
                    this.drawFireParticles(playerData.snake[0]);
                }

                // Dessiner le serpent avec RenderUtils.drawMultiplayerSnake
                const playerNumber = isMe ? this.client.playerNumber : (this.client.playerNumber === 1 ? 2 : 1);
                RenderUtils.drawMultiplayerSnake(
                    this.ctx,
                    playerData.snake,
                    this.CELL_SIZE,
                    isAlive ? headColor : deadColor,
                    playerNumber,
                    isAlive
                );

                // Restaurer l'opacité normale
                this.ctx.globalAlpha = 1;

                // Dessiner indicateur ROCK (bordure épaisse)
                if (isAlive && activePowerup === 'rock' && playerData.snake.length > 0) {
                    const head = playerData.snake[0];
                    this.ctx.strokeStyle = '#8B4513';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(
                        head.x * this.CELL_SIZE,
                        head.y * this.CELL_SIZE,
                        this.CELL_SIZE,
                        this.CELL_SIZE
                    );
                }

                // ❌ SUPPRIMÉ - Pseudo maintenant affiché dans le tableau de scores
            }
        }

        // Dessiner l'UI des power-ups actifs
        this.drawPowerupUI();
    }

    // ============================================
    // POWER-UP VISUAL EFFECTS
    // ============================================

    drawFireParticles(headSegment) {
        // Créer des particules de feu aléatoires autour de la tête
        const centerX = headSegment.x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const centerY = headSegment.y * this.CELL_SIZE + this.CELL_SIZE / 2;

        // Dessiner 3-5 particules aléatoires
        const particleCount = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.CELL_SIZE * 0.8;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const size = 2 + Math.random() * 3;

            // Couleur aléatoire entre orange et rouge
            const colors = ['#FF4500', '#FF6347', '#FF8C00', '#FFA500'];
            this.ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            this.ctx.globalAlpha = 0.6 + Math.random() * 0.4;

            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
    }

    drawPowerupUI() {
        if (!this.serverState || !this.serverState.players) return;

        // Trouver le power-up actif du joueur local
        const myPlayer = this.serverState.players[this.client.playerId];
        if (!myPlayer || !myPlayer.activePowerup || !myPlayer.powerupEndTime) return;

        const timeRemaining = Math.max(0, myPlayer.powerupEndTime - Date.now());
        if (timeRemaining <= 0) return;

        const powerupEmojis = {
            fire: '🔥',
            ice: '❄️',
            ghost: '👻',
            rock: '🪨'
        };

        const powerupNames = {
            fire: 'FIRE',
            ice: 'ICE',
            ghost: 'GHOST',
            rock: 'ROCK'
        };

        const powerupColors = {
            fire: '#FF4500',
            ice: '#00CED1',
            ghost: '#FFFFFF',
            rock: '#D2B48C'
        };

        // Position en haut au centre
        const centerX = this.CANVAS_SIZE / 2;
        const y = 20;

        // Fond semi-transparent
        const text = `${powerupEmojis[myPlayer.activePowerup]} ${powerupNames[myPlayer.activePowerup]} ${(timeRemaining / 1000).toFixed(1)}s`;
        this.ctx.font = 'bold 16px Arial';
        const textWidth = this.ctx.measureText(text).width;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(centerX - textWidth / 2 - 10, y - 12, textWidth + 20, 24);

        // Bordure colorée
        this.ctx.strokeStyle = powerupColors[myPlayer.activePowerup];
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(centerX - textWidth / 2 - 10, y - 12, textWidth + 20, 24);

        // Texte
        this.ctx.fillStyle = powerupColors[myPlayer.activePowerup];
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, centerX, y);
    }

    // ============================================
    // TIMER & SCOREBOARD
    // ============================================

    startTimerUpdate() {
        this.timerInterval = setInterval(() => {
            if (!this.isActive || !this.serverState) {
                this.stopTimerUpdate();
                return;
            }

            this.updateScoreBoard();
        }, 100);
    }

    stopTimerUpdate() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateScoreBoard() {
        if (!this.serverState) return;

        // Mettre à jour le timer
        const timerElement = document.getElementById('multi-timer');
        if (timerElement && this.serverState.matchTimeRemaining !== undefined) {
            const timeRemaining = this.serverState.matchTimeRemaining;
            const minutes = Math.floor(timeRemaining / 60000);
            const seconds = Math.floor((timeRemaining % 60000) / 1000);
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Changer le style si temps critique
            if (timeRemaining < 60000) {
                timerElement.style.color = '#FF4444';
                timerElement.style.fontWeight = 'bold';
            }
        }

        // Mettre à jour les scores (segments)
        if (this.serverState.segments && this.client.playerId) {
            const segments = this.serverState.segments;
            const players = Object.keys(segments);

            const myId = this.client.playerId;
            const opponentId = players.find(id => id !== myId);

            const mySegments = segments[myId] || 1;
            const oppSegments = segments[opponentId] || 1;

            // ✅ NOUVEAU - Récupérer les pseudos depuis serverState.players
            const myPseudo = this.serverState.players?.[myId]?.pseudo || `J${this.client.playerNumber}`;
            const oppPseudo = this.serverState.players?.[opponentId]?.pseudo || `J${this.client.playerNumber === 1 ? 2 : 1}`;

            const p1El = document.getElementById('multi-player1-score');
            const p2El = document.getElementById('multi-player2-score');

            // Afficher avec pseudos au lieu de "J1" et "J2"
            if (this.client.playerNumber === 1) {
                if (p1El) p1El.textContent = `${myPseudo}: ${mySegments}`;
                if (p2El) p2El.textContent = `${oppPseudo}: ${oppSegments}`;
            } else {
                if (p1El) p1El.textContent = `${oppPseudo}: ${oppSegments}`;
                if (p2El) p2El.textContent = `${myPseudo}: ${mySegments}`;
            }
        }
    }

    // ============================================
    // CONTRÔLES
    // ============================================

    changeDirection(dx, dy) {
        console.log(`🎮 MultiplayerSnakeGame.changeDirection(${dx}, ${dy})`);

        // Convertir { dx, dy } en string pour le serveur
        let directionString;
        if (dy === -1) directionString = 'up';
        else if (dy === 1) directionString = 'down';
        else if (dx === -1) directionString = 'left';
        else if (dx === 1) directionString = 'right';
        else return; // Direction invalide

        console.log(`   → Direction convertie: "${directionString}"`);
        this.client.sendInput(directionString);
    }

    abandon() {
        if (confirm('Abandonner la partie ?')) {
            this.returnToMenu();
        }
    }

    // ============================================
    // ÉCRANS & UI
    // ============================================

    showWaitingOverlay() {
        // Créer un overlay d'attente sur le canvas
        const overlay = document.createElement('div');
        overlay.id = 'mp-waiting-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            color: #D4AF37;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 100;
            border-radius: 8px;
        `;

        overlay.innerHTML = `
            <h2 style="font-size: 20px; margin-bottom: 16px; text-shadow: 0 0 10px #D4AF37;">
                🔍 Recherche adversaire...
            </h2>
            <div style="
                width: 40px;
                height: 40px;
                border: 4px solid #333;
                border-top: 4px solid #D4AF37;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        // Insérer l'overlay juste après le canvas
        const canvasParent = this.canvas.parentElement;
        if (canvasParent) {
            canvasParent.style.position = 'relative';
            canvasParent.appendChild(overlay);
        }

        // Enregistrer l'overlay dans le ScreenManager
        window.screenManager.registerOverlay('mp-waiting-overlay');
    }

    hideWaitingOverlay() {
        const overlay = document.getElementById('mp-waiting-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    showGameOver(message) {
        console.log('🏁 Affichage écran Game Over');

        this.isActive = false;

        const myId = this.client.playerId;
        const scores = message.scores || {};
        const mySegments = scores[myId] || 0;
        const opponentId = Object.keys(scores).find(id => id !== myId);
        const opponentSegments = opponentId ? scores[opponentId] : 0;

        const isWinner = message.winner === myId;
        const resultMessage = isWinner
            ? '🏆 VICTOIRE !'
            : message.winner
                ? '💀 DÉFAITE'
                : '⚔️ MATCH NUL';

        const reasonText = message.reason === 'time_up'
            ? '⏰ Temps écoulé !'
            : message.reason === 'opponent_died'
                ? '💀 Adversaire éliminé !'
                : '💀 Les deux sont morts !';

        // Créer l'overlay de game over
        const gameOverOverlay = document.createElement('div');
        gameOverOverlay.id = 'mp-gameover-overlay';
        gameOverOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: 20px;
        `;

        gameOverOverlay.innerHTML = `
            <div style="text-align: center; max-width: 400px;">
                <h1 style="font-size: 36px; margin-bottom: 10px; color: #D4AF37; text-shadow: 0 0 10px #D4AF37;">${resultMessage}</h1>
                <p style="font-size: 16px; color: #C0C0C0; margin-bottom: 20px;">${reasonText}</p>
                <div style="margin: 20px 0;">
                    <div style="font-size: 20px; margin: 12px 0;">
                        <span style="color: #4CAF50;">Vous:</span> <strong>${mySegments} segments</strong>
                    </div>
                    <div style="font-size: 20px; margin: 12px 0;">
                        <span style="color: #F44336;">Adversaire:</span> <strong>${opponentSegments} segments</strong>
                    </div>
                </div>
                <div style="display: flex; gap: 16px; justify-content: center; margin-top: 24px;">
                    <button id="mp-replay-btn" style="
                        padding: 12px 24px;
                        font-size: 16px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
                    ">🔄 Rejouer</button>
                    <button id="mp-menu-btn" style="
                        padding: 12px 24px;
                        font-size: 16px;
                        background: #D4AF37;
                        color: #000;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
                    ">🏠 Menu</button>
                </div>
            </div>
        `;

        document.body.appendChild(gameOverOverlay);

        // Enregistrer l'overlay dans le ScreenManager
        window.screenManager.registerOverlay('mp-gameover-overlay');

        // Attacher les événements
        document.getElementById('mp-replay-btn').onclick = () => {
            gameOverOverlay.remove();
            this.replay();
        };

        document.getElementById('mp-menu-btn').onclick = () => {
            gameOverOverlay.remove();
            this.returnToMenu();
        };
    }

    replay() {
        console.log('🔄 Rejouer');
        // Redémarrer une nouvelle partie
        this.stop();
        setTimeout(() => this.start(), 500);
    }

    returnToMenu() {
        console.log('🏠 Retour au menu');

        // Arrêter le jeu (cleanup des overlays inclus)
        this.stop();

        // Le ScreenManager s'occupe de tout (cleanup + affichage)
        window.screenManager.show('menu');
    }
}

// ============================================
// EXPORT
// ============================================

window.MultiplayerSnakeGame = MultiplayerSnakeGame;
console.log('✅ MultiplayerSnakeGame chargé!');
