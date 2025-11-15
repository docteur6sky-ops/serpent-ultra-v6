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
        };

        this.client.onRoomJoined = (message) => {
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
            this.hideWaitingOverlay();
            setTimeout(() => this.client.sendReady(), 1000);
        };

        this.client.onGameStart = (message) => {
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
            }
        };

        this.client.onGameUpdate = (gameState) => {
            this.serverState = gameState;
        };

        this.client.onGameOver = (message) => {
            this.stopRenderLoop();
            this.stopTimerUpdate();
            this.showGameOver(message);
        };

        this.client.onPlayerLeft = (message) => {
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
        this.isActive = false;
        this.serverState = null;

        // Connecter au serveur
        this.client.connect();
    }

    stop() {
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
            }
        });
    }

    // ============================================
    // BOUCLE DE RENDU
    // ============================================

    startRenderLoop() {
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
                fire: '#FF5722',
                ice: '#00A5A5',
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
                        fire: '#FF5722',
                        ice: '#00A5A5',
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

        // ❌ SUPPRIMÉ - Power-ups maintenant affichés dans le tableau HTML (mini-barres)
        // this.drawPowerupUI();
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
            const colors = ['#FF5722', '#FF6347', '#FF8C00', '#FFA500'];
            this.ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            this.ctx.globalAlpha = 0.6 + Math.random() * 0.4;

            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
    }

    // ❌ FONCTION DÉSACTIVÉE - Remplacée par les mini-barres HTML dans le tableau
    // drawPowerupUI() {
    //     if (!this.serverState || !this.serverState.players) return;

    //     // Trouver le power-up actif du joueur local
    //     const myPlayer = this.serverState.players[this.client.playerId];
    //     if (!myPlayer || !myPlayer.activePowerup || !myPlayer.powerupEndTime) return;

    //     const timeRemaining = Math.max(0, myPlayer.powerupEndTime - Date.now());
    //     if (timeRemaining <= 0) return;

    //     const powerupEmojis = {
    //         fire: '🔥',
    //         ice: '❄️',
    //         ghost: '👻',
    //         rock: '🪨'
    //     };

    //     const powerupNames = {
    //         fire: 'FIRE',
    //         ice: 'ICE',
    //         ghost: 'GHOST',
    //         rock: 'ROCK'
    //     };

    //     const powerupColors = {
    //         fire: '#FF5722',
    //         ice: '#008B8B',
    //         ghost: '#FFFFFF',
    //         rock: '#D2B48C'
    //     };

    //     // Position en haut au centre
    //     const centerX = this.CANVAS_SIZE / 2;
    //     const y = 20;

    //     // Fond semi-transparent
    //     const text = `${powerupEmojis[myPlayer.activePowerup]} ${powerupNames[myPlayer.activePowerup]} ${(timeRemaining / 1000).toFixed(1)}s`;
    //     this.ctx.font = 'bold 16px Arial';
    //     const textWidth = this.ctx.measureText(text).width;

    //     this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    //     this.ctx.fillRect(centerX - textWidth / 2 - 10, y - 12, textWidth + 20, 24);

    //     // Bordure colorée
    //     this.ctx.strokeStyle = powerupColors[myPlayer.activePowerup];
    //     this.ctx.lineWidth = 2;
    //     this.ctx.strokeRect(centerX - textWidth / 2 - 10, y - 12, textWidth + 20, 24);

    //     // Texte
    //     this.ctx.fillStyle = powerupColors[myPlayer.activePowerup];
    //     this.ctx.textAlign = 'center';
    //     this.ctx.textBaseline = 'middle';
    //     this.ctx.fillText(text, centerX, y);
    // }

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
        if (!this.serverState || !this.client?.playerId) return;

        // ═══════════════════════════════════════════════════════════
        // TIMER
        // ═══════════════════════════════════════════════════════════
        const timerElement = document.getElementById('multi-timer');
        const timeRemaining = this.serverState.matchTimeRemaining || 0;
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);

        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Temps critique (< 60s) - Rouge
            if (timeRemaining < 60000) {
                timerElement.style.color = '#FF4444';
            } else {
                timerElement.style.color = ''; // Reset
            }
        }

        // ═══════════════════════════════════════════════════════════
        // DÉTERMINER QUEL JOUEUR EST QUEL ID
        // ═══════════════════════════════════════════════════════════
        const myId = this.client.playerId;
        const players = this.serverState.players || {};
        const playerIds = Object.keys(players);
        const opponentId = playerIds.find(id => id !== myId);

        if (!opponentId) return;

        // Déterminer qui est P1 et P2 (le joueur local est toujours P1)
        const p1Id = myId;
        const p2Id = opponentId;

        // ═══════════════════════════════════════════════════════════
        // PSEUDOS
        // ═══════════════════════════════════════════════════════════
        const p1Name = document.getElementById('multi-player1-name');
        const p2Name = document.getElementById('multi-player2-name');

        if (p1Name) p1Name.textContent = players[p1Id]?.pseudo || 'Joueur 1';
        if (p2Name) p2Name.textContent = players[p2Id]?.pseudo || 'Joueur 2';

        // ═══════════════════════════════════════════════════════════
        // SEGMENTS
        // ═══════════════════════════════════════════════════════════
        const segments = this.serverState.segments || {};
        const p1Segments = document.getElementById('multi-player1-segments');
        const p2Segments = document.getElementById('multi-player2-segments');

        if (p1Segments) p1Segments.textContent = segments[p1Id] || 1;
        if (p2Segments) p2Segments.textContent = segments[p2Id] || 1;

        // ═══════════════════════════════════════════════════════════
        // POWER-UPS (MINI-BARRES)
        // ═══════════════════════════════════════════════════════════
        this.updatePlayerPowerup('multi-player1-powerup', players[p1Id]);
        this.updatePlayerPowerup('multi-player2-powerup', players[p2Id]);
    }

    updatePlayerPowerup(containerId, playerData) {
        const container = document.getElementById(containerId);
        if (!container || !playerData) return;

        const emoji = container.querySelector('.mp-pw-emoji');
        const fill = container.querySelector('.mp-pw-fill');

        if (!emoji || !fill) return;

        const powerupType = playerData.activePowerup;
        const powerupEndTime = playerData.powerupEndTime;

        const powerupEmojis = {
            ice: '❄️',
            fire: '🔥',
            rock: '🪨',
            ghost: '👻'
        };

        if (powerupType && powerupEndTime) {
            const timeRemaining = Math.max(0, powerupEndTime - Date.now());
            const duration = 5000;
            const percentage = (timeRemaining / duration) * 100;

            container.className = `mp-powerup-compact active ${powerupType}`;
            emoji.textContent = powerupEmojis[powerupType] || '';
            fill.style.width = Math.max(0, percentage) + '%';
        } else {
            container.className = 'mp-powerup-compact';
            emoji.textContent = '\u00A0';
            fill.style.width = '0%';
        }
    }

    // ============================================
    // CONTRÔLES
    // ============================================

    changeDirection(dx, dy) {
        // Convertir { dx, dy } en string pour le serveur
        let directionString;
        if (dy === -1) directionString = 'up';
        else if (dy === 1) directionString = 'down';
        else if (dx === -1) directionString = 'left';
        else if (dx === 1) directionString = 'right';
        else return; // Direction invalide

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
        // Créer un overlay d'attente (styles dans snake.css)
        const overlay = document.createElement('div');
        overlay.id = 'mp-waiting-overlay';
        overlay.innerHTML = `
            <h2>🔍 Recherche adversaire...</h2>
            <div class="mp-spinner"></div>
        `;

        // Ajouter au body (position fixed dans CSS)
        document.body.appendChild(overlay);

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

        // Créer l'overlay de game over (styles dans snake.css)
        const gameOverOverlay = document.createElement('div');
        gameOverOverlay.id = 'mp-gameover-overlay';

        gameOverOverlay.innerHTML = `
            <div class="mp-gameover-content">
                <h1 class="mp-gameover-title">${resultMessage}</h1>
                <p class="mp-gameover-result">${reasonText}</p>

                <div class="mp-gameover-stats">
                    <div class="mp-stat">
                        <div class="mp-stat-label">Vous</div>
                        <div class="mp-stat-value">${mySegments}</div>
                    </div>
                    <div class="mp-stat">
                        <div class="mp-stat-label">Adversaire</div>
                        <div class="mp-stat-value">${opponentSegments}</div>
                    </div>
                </div>

                <div class="mp-gameover-buttons">
                    <button id="mp-replay-btn" class="mp-gameover-btn">🔄 Rejouer</button>
                    <button id="mp-menu-btn" class="mp-gameover-btn secondary">🏠 Menu</button>
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
        // Redémarrer une nouvelle partie
        this.stop();
        setTimeout(() => this.start(), 500);
    }

    returnToMenu() {
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
