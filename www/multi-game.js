// ============================================
// MULTIPLAYER SNAKE GAME - MODE MULTIJOUEUR ENCAPSULÉ
// ============================================

// ✅ Fonction placeholder pour le leaderboard (à implémenter plus tard)
import { logger } from './services/logger.js';
import { drawSnakeEnhanced, getDirectionString } from './SkinsRenderer.js';

window.showLeaderboard = function() {
    if (window.ModalManager) {
        window.ModalManager.info('Leaderboard mondial - Fonctionnalité à venir !', { title: 'Leaderboard' });
    }
    // TODO : Implémenter affichage leaderboard
};

class MultiplayerSnakeGame {
    constructor() {
        // Canvas dédié au multijoueur
        this.canvas = document.getElementById('canvas-multi');
        if (!this.canvas) {
            throw new Error('Canvas canvas-multi introuvable!');
        }
        this.ctx = this.canvas.getContext('2d');

        // Configuration - utiliser la taille réelle du canvas
        this.GRID_SIZE = 30;
        this.CANVAS_SIZE = this.canvas.width; // 540 ou la taille définie dans HTML
        this.CELL_SIZE = this.CANVAS_SIZE / this.GRID_SIZE; // 18px si 540/30

        // Client WebSocket
        this.client = new MultiplayerClient();

        // État du serveur
        this.serverState = null;

        // Contrôle
        this.isActive = false;
        this.renderRAF = null;
        this.timerInterval = null;
        this.gameOverShown = false; // ✅ FIX: Track si game over affiché (pour éviter retour auto lobby)

        // Tracking power-ups pour trophées
        this.powerupsCollectedThisGame = 0;
        this.lastPowerupState = null;

        // 💥 Système de particules pour explosions
        this.particles = [];
        this.MAX_PARTICLES = 500;
        this.explodingPlayers = {}; // { playerId: true } pour cacher les serpents explosés
        this.pendingGameOver = null; // Message gameOver en attente (affichage après explosion)

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
            logger.log('[MultiGame] Connecté au serveur');
        };

        this.client.onRoomJoined = (message) => {
            logger.log('[MultiGame] Room joinée, envoi du pseudo:', this.playerPseudo);

            // ✅ Envoyer le pseudo stocké dans l'instance
            if (this.playerPseudo) {
                this.client.sendPseudo(this.playerPseudo);
            } else {
                logger.warn('[MultiGame] Aucun pseudo défini !');
            }

            // ✅ AMÉLIORATION: Plus d'overlay "Recherche..." - Direct au lobby
            // Le lobby affiche déjà le compteur de joueurs (1/2 ou 2/2)
        };

        this.client.onRoomFull = (message) => {
            // Overlay supprimé - le lobby gère l'affichage
            // Les joueurs doivent cliquer manuellement sur "Prêt"
        };

        this.client.onGameStart = (message) => {
            // Overlay supprimé
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
            // ✅ TRACKING POWER-UPS: Détecter quand le joueur collecte un power-up
            if (gameState?.players && this.client?.playerId) {
                const myPlayer = gameState.players[this.client.playerId];
                if (myPlayer?.activePowerup && myPlayer.activePowerup !== this.lastPowerupState) {
                    // Un nouveau power-up a été collecté (via utilisation de l'item)
                    this.powerupsCollectedThisGame++;
                    logger.log(`[MultiGame] Power-up activé: ${myPlayer.activePowerup} (total: ${this.powerupsCollectedThisGame})`);
                }
                this.lastPowerupState = myPlayer?.activePowerup || null;

                // 🎁 ITEM STOCKÉ - Mettre à jour le slot d'item dans le D-pad
                const itemSlot = document.getElementById('multi-sword-slot');
                const itemIcon = document.getElementById('multi-sword-icon');
                if (itemSlot && itemIcon) {
                    if (myPlayer?.storedItem) {
                        // Item stocké - afficher l'emoji correspondant
                        itemSlot.classList.add('has-item');
                        itemSlot.classList.remove('has-sword', 'sword-active');
                        const itemEmojis = {
                            ice: '❄️', fire: '🔥', rock: '🪨', ghost: '👻', lightning: '⚡', sword: '⚔️'
                        };
                        itemIcon.textContent = itemEmojis[myPlayer.storedItem] || '?';
                        // Mettre à jour la charge si épée stockée
                        if (myPlayer.storedItem === 'sword') {
                            this.updateSwordSlotCharge(myPlayer);
                        }
                    } else if (myPlayer?.hasSword) {
                        // ⚔️ Épée activée (dégainée) - le timer SVG gère l'affichage
                        itemSlot.classList.add('has-sword', 'sword-active');
                        itemSlot.classList.remove('has-item');
                        // L'icône et le timer sont gérés par startSwordTimer()
                    } else {
                        // Aucun item - reset complet
                        itemSlot.classList.remove('has-item', 'has-sword', 'sword-active');
                        itemIcon.textContent = '?';
                        // Reset le timer si épée plus active
                        if (this.swordTimerRAF) {
                            this.clearSwordTimer();
                        }
                    }
                }
            }
            this.serverState = gameState;
        };

        // 🎁 MYSTERY BOX COLLECTÉE - Animation roulette
        this.client.onMysteryBoxCollected = (message) => {
            logger.log(`[MultiGame] Mystery Box collectée! Item: ${message.item}`);
            this.playRouletteAnimation(message.item);
        };

        // 🎁 ITEM UTILISÉ
        this.client.onItemUsed = (message) => {
            logger.log(`[MultiGame] Item utilisé: ${message.item}`);
        };

        // ⚡ BOOST ACTIVÉ
        this.client.onBoostActivated = (message) => {
            logger.log(`[MultiGame] Boost activé! (${message.duration}ms)`);
            this.showBoostCooldown(message.cooldown);
        };

        // ⚔️ DÉGÂTS D'ÉPÉE REÇUS
        this.client.onSwordDamage = (message) => {
            logger.log(`[MultiGame] Dégâts épée: -${message.damage} HP (reste: ${message.health}/15)`);
            this.showDamageEffect(message.damage);
        };

        // ⚔️ ÉPÉE ACTIVÉE (nouveau système avec durée)
        this.client.onSwordActivated = (message) => {
            logger.log(`[MultiGame] Épée activée! Charge: ${message.charge}, Durée: ${message.duration}ms`);
            this.startSwordTimer(message.endTime, message.charge);
        };

        // ⚔️ HIT RÉUSSI
        this.client.onSwordHitSuccess = (message) => {
            logger.log(`[MultiGame] Épée touche! Dégâts: ${message.damage}, Segments gagnés: ${message.segmentsGained}`);
            this.showSwordHitEffect(message.damage);
            this.clearSwordTimer(); // Arrêter le timer car épée consommée
        };

        this.client.onGameOver = (message) => {
            this.stopRenderLoop();
            this.stopTimerUpdate();
            // 💥 Déclencher l'explosion avant d'afficher le game over
            this.triggerDeathExplosion(message);
            this.gameOverShown = true; // ✅ FIX: Marquer que game over a été affiché
        };

        this.client.onPlayerLeft = (message) => {
            // ✅ FIX: Ne pas retourner au menu si game over déjà affiché (abandon)
            if (this.gameOverShown) {
                return;
            }

            this.stopRenderLoop();
            this.stopTimerUpdate();
            this.client.showMessage('Adversaire déconnecté', 'warning');
            setTimeout(() => this.returnToMenu(), 3000);
        };
    }

    // ============================================
    // DÉMARRAGE & ARRÊT
    // ============================================

    start(playerPseudo = null) {
        this.isActive = false;
        this.serverState = null;
        this.gameOverShown = false; // ✅ FIX: Réinitialiser à chaque nouvelle partie
        this.powerupsCollectedThisGame = 0; // ✅ Reset compteur power-ups
        this.lastPowerupState = null;

        // 💥 Reset système de particules
        this.particles = [];
        this.explodingPlayers = {};
        this.pendingGameOver = null;

        // Stocker le pseudo du joueur
        if (playerPseudo) {
            this.playerPseudo = playerPseudo;
            logger.log('[MultiGame] Pseudo défini:', this.playerPseudo);
        } else {
            logger.warn('[MultiGame] Aucun pseudo fourni à start()');
        }

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
        // ✅ FIX #8: Déléguer au ScreenManager qui track TOUS les overlays
        if (window.screenManager) {
            window.screenManager.cleanupAll();
        }

        // Double sécurité : supprimer manuellement les overlays multi connus
        // ✅ FIX: Ne PAS supprimer countdown-overlay (élément HTML permanent réutilisable)
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

    /**
     * Nettoyer le canvas (fond noir uniquement)
     * Utilisé avant le countdown pour avoir un écran propre
     */
    clearCanvas() {
        if (!this.ctx) return;
        this.ctx.fillStyle = this.COLORS.BG_DARK;
        this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
    }

    draw() {
        if (!this.serverState || !this.ctx) return;

        // Effacer le canvas
        this.ctx.fillStyle = this.COLORS.BG_DARK;
        this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

        // ✅ Couleur bordure adaptée au mode dark/light (comme solo)
        const isDarkMode = document.body.classList.contains('dark-mode');
        const borderColor = isDarkMode ? '#008B8B' : '#d8d800ff';  // Cyan en dark, Gold en light

        // Dessiner la grille (même style que le solo)
        RenderUtils.drawGrid(
            this.ctx,
            this.GRID_SIZE,
            this.CELL_SIZE,
            this.CANVAS_SIZE,
            { grid: this.COLORS.grid, border: borderColor }
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

        // 🎁 MYSTERY BOX - Utiliser le même rendu que solo/roguelike
        if (this.serverState.mysteryBox) {
            RenderUtils.drawMysteryBox(
                this.ctx,
                this.serverState.mysteryBox.x,
                this.serverState.mysteryBox.y,
                this.CELL_SIZE
            );
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

                // ============================================
                // ✨ DESSINER SERPENT AVEC SKINS
                // ============================================

                // Couleurs du skin (ou couleurs temporaires selon power-up)
                let skinColors = null;

                if (!isAlive) {
                    // Serpent mort = gris
                    skinColors = {
                        head: { light: '#666666', dark: '#444444' },
                        body: { from: '#666666', to: '#444444' },
                        tail: { color: '#444444' },
                        outline: '#222222',
                        glow: '#666666'
                    };
                } else if (activePowerup === 'ghost') {
                    // GHOST : Blanc semi-transparent
                    skinColors = {
                        head: { light: '#FFFFFF', dark: '#CCCCCC' },
                        body: { from: '#FFFFFF', to: '#999999' },
                        tail: { color: '#999999' },
                        outline: '#666666',
                        glow: '#FFFFFF'
                    };
                    this.ctx.globalAlpha = 0.6;
                } else if (activePowerup === 'rock') {
                    // ROCK : Tan (ROCK)
                    skinColors = {
                        head: { light: '#D2B48C', dark: '#A0826D' },
                        body: { from: '#D2B48C', to: '#8B7355' },
                        tail: { color: '#8B7355' },
                        outline: '#654321',
                        glow: '#D2B48C'
                    };
                } else if (activePowerup === 'fire') {
                    // FIRE : Rouge/Orange (LIGHTNING équivalent)
                    skinColors = {
                        head: { light: '#FF5722', dark: '#E64A19' },
                        body: { from: '#FF5722', to: '#BF360C' },
                        tail: { color: '#BF360C' },
                        outline: '#5D0F00',
                        glow: '#FF5722'
                    };
                } else if (activePowerup === 'ice') {
                    // ICE : Cyan
                    skinColors = {
                        head: { light: '#00A5A5', dark: '#008080' },
                        body: { from: '#00A5A5', to: '#006666' },
                        tail: { color: '#006666' },
                        outline: '#003333',
                        glow: '#00A5A5'
                    };
                } else if (activePowerup === 'lightning') {
                    // ⚡ LIGHTNING : Jaune/Doré électrique
                    skinColors = {
                        head: { light: '#FFD700', dark: '#FFA500' },
                        body: { from: '#FFD700', to: '#FF8C00' },
                        tail: { color: '#FF8C00' },
                        outline: '#B8860B',
                        glow: '#FFD700'
                    };
                } else if (!isMe) {
                    // Adversaire sans power-up : rouge
                    skinColors = {
                        head: { light: '#FF6B6B', dark: '#CC3636' },
                        body: { from: '#FF6B6B', to: '#CC3636' },
                        tail: { color: '#CC3636' },
                        outline: '#8B0000',
                        glow: '#FF6B6B'
                    };
                }
                // Sinon (isMe && !activePowerup) : utiliser skin équipé (null = auto)

                // Dessiner particules FIRE avant le serpent
                if (isAlive && activePowerup === 'fire' && playerData.snake.length > 0) {
                    this.drawFireParticles(playerData.snake[0]);
                }

                // Calculer la direction du serpent (dx, dy) pour drawSnakeEnhanced
                let dx = 0, dy = 0;
                if (playerData.snake.length >= 2) {
                    const head = playerData.snake[0];
                    const neck = playerData.snake[1];
                    dx = head.x - neck.x;
                    dy = head.y - neck.y;

                    // Gérer le wrapping (si dx ou dy > 1, c'est un wrap)
                    if (Math.abs(dx) > 1) dx = -Math.sign(dx);
                    if (Math.abs(dy) > 1) dy = -Math.sign(dy);
                } else {
                    // Par défaut, direction droite
                    dx = 1;
                    dy = 0;
                }

                // Convertir la direction en string
                const directionString = getDirectionString(dx, dy);

                // Dessiner le serpent avec skins
                drawSnakeEnhanced(
                    this.ctx,
                    playerData.snake,
                    directionString,
                    this.CELL_SIZE,
                    skinColors
                );

                // ⚔️ ÉPÉE - Indicateur visuel si le joueur a l'épée
                if (playerData.hasSword && playerData.snake.length > 0) {
                    const head = playerData.snake[0];
                    const headX = head.x * this.CELL_SIZE + this.CELL_SIZE / 2;
                    const headY = head.y * this.CELL_SIZE - 5; // Au-dessus de la tête

                    // Épée flottante au-dessus de la tête
                    this.ctx.save();
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = '#FFD700';
                    this.ctx.font = `${this.CELL_SIZE * 0.6}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'bottom';
                    this.ctx.fillText('⚔️', headX, headY);

                    // Afficher le bonus de dégâts (3 + pommes)
                    const damage = 3 + (playerData.applesEatenWithSword || 0);
                    this.ctx.font = `bold ${this.CELL_SIZE * 0.4}px Arial`;
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeText(`+${damage}`, headX, headY + this.CELL_SIZE + 5);
                    this.ctx.fillText(`+${damage}`, headX, headY + this.CELL_SIZE + 5);
                    this.ctx.restore();
                }

                // Restaurer l'opacité normale
                this.ctx.globalAlpha = 1;

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

    // ============================================
    // 💥 SYSTÈME D'EXPLOSION DU SERPENT
    // ============================================

    /**
     * Fait exploser un serpent en particules (effet de mort)
     * @param {Array} snake - Tableau des segments du serpent [{x, y}, ...]
     * @param {string} color - Couleur des particules
     * @param {string} playerId - ID du joueur (pour le marquer comme explosé)
     */
    explodeSnake(snake, color = '#00FF87', playerId = null) {
        if (!snake || snake.length === 0) return;

        // Marquer ce joueur comme explosé (pour cacher son serpent)
        if (playerId) {
            this.explodingPlayers[playerId] = true;
        }

        // Générer particules pour chaque segment
        snake.forEach((segment, index) => {
            // Plus de particules pour la tête
            const particleCount = index === 0 ? 20 : 8;

            for (let i = 0; i < particleCount; i++) {
                if (this.particles.length >= this.MAX_PARTICLES) break;

                const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
                const speed = 3 + Math.random() * 4;
                const size = index === 0 ? 4 + Math.random() * 4 : 2 + Math.random() * 3;

                this.particles.push({
                    x: segment.x * this.CELL_SIZE + this.CELL_SIZE / 2,
                    y: segment.y * this.CELL_SIZE + this.CELL_SIZE / 2,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    color: color,
                    size: size
                });
            }
        });

        logger.debug(`💥 Serpent explosé en ${this.particles.length} particules`);
    }

    /**
     * Met à jour les particules (physique + fade out)
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Physique
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // Gravité
            p.vx *= 0.98; // Friction
            p.vy *= 0.98;

            // Fade out
            p.life -= 0.02;

            // Supprimer particules mortes
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Dessine toutes les particules actives
     */
    drawParticles() {
        if (this.particles.length === 0) return;

        for (const p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Déclenche l'effet de mort complet (explosion + affichage game over différé)
     * @param {Object} message - Message de game over du serveur
     */
    triggerDeathExplosion(message) {
        if (!this.serverState || !this.serverState.players) {
            this.showGameOver(message);
            return;
        }

        const myId = this.client.playerId;
        let hasExplosion = false;

        // Déterminer qui est mort (le perdant, ou les deux si match nul)
        for (const [playerId, playerData] of Object.entries(this.serverState.players)) {
            if (!playerData.alive && playerData.snake && playerData.snake.length > 0) {
                // Choisir la couleur selon si c'est moi ou l'adversaire
                const isMe = playerId === myId;
                const color = isMe ? '#00FF87' : '#FF6B6B'; // Vert pour moi, rouge pour adversaire
                this.explodeSnake(playerData.snake, color, playerId);
                hasExplosion = true;
            }
        }

        // Si personne n'est mort (time_up), afficher game over directement
        if (!hasExplosion) {
            this.showGameOver(message);
            return;
        }

        // Stocker le message pour l'afficher après l'explosion
        this.pendingGameOver = message;

        // Continuer le rendu pour voir l'explosion
        this.isActive = true;
        this.startExplosionRender();
    }

    /**
     * Boucle de rendu spéciale pour l'explosion (continue même après game over)
     */
    startExplosionRender() {
        const explosionDuration = 1500; // 1.5 secondes pour l'explosion
        const startTime = Date.now();

        const renderExplosion = () => {
            const elapsed = Date.now() - startTime;

            // Dessiner le jeu avec l'explosion
            this.drawWithExplosion();

            if (elapsed < explosionDuration && this.particles.length > 0) {
                this.renderRAF = requestAnimationFrame(renderExplosion);
            } else {
                // Explosion terminée, afficher le game over
                this.isActive = false;
                if (this.pendingGameOver) {
                    this.showGameOver(this.pendingGameOver);
                    this.pendingGameOver = null;
                }
            }
        };

        renderExplosion();
    }

    /**
     * Dessine le jeu pendant l'explosion (serpents explosés cachés)
     */
    drawWithExplosion() {
        if (!this.serverState || !this.ctx) return;

        // Effacer le canvas
        this.ctx.fillStyle = this.COLORS.BG_DARK;
        this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

        // Couleur bordure
        const isDarkMode = document.body.classList.contains('dark-mode');
        const borderColor = isDarkMode ? '#008B8B' : '#d8d800ff';

        // Dessiner la grille
        RenderUtils.drawGrid(
            this.ctx,
            this.GRID_SIZE,
            this.CELL_SIZE,
            this.CANVAS_SIZE,
            { grid: this.COLORS.grid, border: borderColor }
        );

        // Dessiner nourriture, obstacles, etc.
        if (this.serverState.food) {
            RenderUtils.drawStar(this.ctx, this.serverState.food.x, this.serverState.food.y, this.CELL_SIZE);
        }
        if (this.serverState.bad) {
            RenderUtils.drawSkull(this.ctx, this.serverState.bad.x, this.serverState.bad.y, this.CELL_SIZE);
        }
        if (this.serverState.obstacles) {
            for (let obs of this.serverState.obstacles) {
                RenderUtils.drawWall(this.ctx, obs.x, obs.y, this.CELL_SIZE);
            }
        }

        // Dessiner les serpents NON explosés (survivants)
        if (this.serverState.players) {
            for (let [playerId, playerData] of Object.entries(this.serverState.players)) {
                // Ne pas dessiner les serpents explosés
                if (this.explodingPlayers[playerId]) continue;
                if (!playerData.snake || playerData.snake.length === 0) continue;

                const isMe = playerId === this.client.playerId;
                let skinColors = null;

                if (!isMe) {
                    skinColors = {
                        head: { light: '#FF6B6B', dark: '#CC3636' },
                        body: { from: '#FF6B6B', to: '#CC3636' },
                        tail: { color: '#CC3636' },
                        outline: '#8B0000',
                        glow: '#FF6B6B'
                    };
                }

                let dx = 1, dy = 0;
                if (playerData.snake.length >= 2) {
                    const head = playerData.snake[0];
                    const neck = playerData.snake[1];
                    dx = head.x - neck.x;
                    dy = head.y - neck.y;
                    if (Math.abs(dx) > 1) dx = -Math.sign(dx);
                    if (Math.abs(dy) > 1) dy = -Math.sign(dy);
                }

                drawSnakeEnhanced(this.ctx, playerData.snake, getDirectionString(dx, dy), this.CELL_SIZE, skinColors);
            }
        }

        // Mettre à jour et dessiner les particules
        this.updateParticles();
        this.drawParticles();
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
        // ✅ FIX #3: Nettoyer l'ancien interval AVANT d'en créer un nouveau
        this.stopTimerUpdate();

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
        // POWER-UPS (MINI-BARRES)
        // ═══════════════════════════════════════════════════════════
        this.updatePlayerPowerup('multi-player1-powerup', players[p1Id]);
        this.updatePlayerPowerup('multi-player2-powerup', players[p2Id]);

        // ═══════════════════════════════════════════════════════════
        // ❤️ BARRES DE VIE (selon grade du joueur)
        // ═══════════════════════════════════════════════════════════
        const p1Health = players[p1Id]?.health ?? 15;
        const p2Health = players[p2Id]?.health ?? 15;
        // DEBUG: Voir les valeurs de health reçues
        if (this._lastP1Health !== p1Health || this._lastP2Health !== p2Health) {
            logger.log(`[MultiGame] ❤️ Health update: P1=${p1Health}, P2=${p2Health}`);
            this._lastP1Health = p1Health;
            this._lastP2Health = p2Health;
        }
        this.updateHealthBar('multi-player1-health', p1Health);
        this.updateHealthBar('multi-player2-health', p2Health);

        // ═══════════════════════════════════════════════════════════
        // ⚔️ CHARGE ÉPÉE (bordure slot)
        // ═══════════════════════════════════════════════════════════
        const myPlayer = players[this.client.playerId];
        this.updateSwordSlotCharge(myPlayer);
    }

    // ❤️ Mettre à jour une barre de vie
    updateHealthBar(barId, health) {
        const bar = document.getElementById(barId);
        if (!bar) return;

        const segments = bar.querySelectorAll('.mp-health-segment');
        segments.forEach((seg, index) => {
            if (index < health) {
                seg.classList.remove('empty');
            } else {
                seg.classList.add('empty');
            }
        });

        // Classes de couleur selon niveau de vie
        bar.classList.remove('low', 'critical');
        if (health <= 3) {
            bar.classList.add('critical');
        } else if (health <= 7) {
            bar.classList.add('low');
        }
    }

    // ⚔️ Mettre à jour la bordure du slot épée selon la charge
    updateSwordSlotCharge(playerData) {
        const slot = document.getElementById('multi-sword-slot');
        if (!slot) return;

        // Seulement si l'épée est stockée
        if (playerData?.storedItem !== 'sword') {
            slot.style.borderColor = '';
            slot.style.boxShadow = '';
            slot.removeAttribute('data-charge');
            return;
        }

        const charge = playerData?.swordCharge ?? 0;
        slot.setAttribute('data-charge', charge);

        // Bordure grise (0) → verte progressive (15)
        slot.style.boxShadow = ''; // Reset
        if (charge === 0) {
            slot.style.borderColor = '#6b7280'; // Gris
        } else if (charge < 5) {
            slot.style.borderColor = '#84cc16'; // Vert lime clair
        } else if (charge < 10) {
            slot.style.borderColor = '#22c55e'; // Vert
        } else if (charge < 15) {
            slot.style.borderColor = '#10b981'; // Vert émeraude
        } else {
            slot.style.borderColor = '#00ff88'; // Full charge - vert brillant
            slot.style.boxShadow = '0 0 15px #00ff88, 0 0 30px #00ff88';
        }
    }

    // ⚔️ Effet visuel de dégâts (flash rouge)
    showDamageEffect(damage) {
        const canvas = document.getElementById('multi-game-canvas');
        if (!canvas) return;

        // Flash rouge sur le canvas
        canvas.style.boxShadow = `inset 0 0 100px rgba(255, 0, 0, 0.5), 0 0 50px rgba(255, 0, 0, 0.3)`;
        canvas.style.animation = 'damageShake 0.3s ease-out';

        setTimeout(() => {
            canvas.style.boxShadow = '';
            canvas.style.animation = '';
        }, 300);

        // Notification de dégâts
        this.client.showMessage(`⚔️ -${damage} HP!`, 'error');
    }

    /**
     * ⚔️ Démarre le timer visuel de l'épée active (barre circulaire SVG)
     */
    startSwordTimer(endTime, charge) {
        const slot = document.getElementById('multi-sword-slot');
        const icon = document.getElementById('multi-sword-icon');

        if (!slot || !icon) return;

        // Afficher l'icône épée
        slot.classList.add('sword-active');
        icon.textContent = '⚔️';

        // Créer ou récupérer le SVG circulaire
        let svgTimer = slot.querySelector('.sword-timer-svg');
        if (!svgTimer) {
            svgTimer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgTimer.classList.add('sword-timer-svg');
            svgTimer.setAttribute('viewBox', '0 0 100 100');
            svgTimer.innerHTML = `
                <circle class="sword-timer-bg" cx="50" cy="50" r="45" />
                <circle class="sword-timer-progress" cx="50" cy="50" r="45" />
            `;
            slot.appendChild(svgTimer);
        }

        const progressCircle = svgTimer.querySelector('.sword-timer-progress');
        const circumference = 2 * Math.PI * 45; // r=45
        progressCircle.style.strokeDasharray = circumference;

        // Calculer durée totale
        const duration = endTime - Date.now();
        const startTime = Date.now();

        // Animation du timer
        const updateTimer = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const progress = remaining / duration;

            // Mettre à jour le cercle (sens anti-horaire)
            progressCircle.style.strokeDashoffset = circumference * (1 - progress);

            // Couleur selon temps restant
            if (progress < 0.3) {
                progressCircle.style.stroke = '#ff4444'; // Rouge
            } else if (progress < 0.6) {
                progressCircle.style.stroke = '#ffaa00'; // Orange
            } else {
                progressCircle.style.stroke = '#00ff88'; // Vert
            }

            if (remaining > 0) {
                this.swordTimerRAF = requestAnimationFrame(updateTimer);
            } else {
                // Timer expiré - reset visuel
                this.clearSwordTimer();
            }
        };

        updateTimer();
    }

    /**
     * ⚔️ Nettoie le timer visuel de l'épée
     */
    clearSwordTimer() {
        if (this.swordTimerRAF) {
            cancelAnimationFrame(this.swordTimerRAF);
            this.swordTimerRAF = null;
        }

        const slot = document.getElementById('multi-sword-slot');
        if (slot) {
            slot.classList.remove('sword-active');
            const svgTimer = slot.querySelector('.sword-timer-svg');
            if (svgTimer) {
                svgTimer.remove();
            }
        }
    }

    /**
     * ⚔️ Effet visuel quand l'épée touche
     */
    showSwordHitEffect(damage) {
        // Flash doré sur le canvas
        const canvas = this.canvas;
        if (canvas) {
            canvas.style.boxShadow = `0 0 50px rgba(255, 215, 0, 0.8), inset 0 0 30px rgba(255, 215, 0, 0.3)`;
            setTimeout(() => {
                canvas.style.boxShadow = '';
            }, 300);
        }

        // Notification succès
        this.client.showMessage(`⚔️ +${damage} segments volés!`, 'success');
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
            ghost: '👻',
            lightning: '⚡'
        };

        if (powerupType && powerupEndTime) {
            const timeRemaining = Math.max(0, powerupEndTime - Date.now());
            const duration = 5000;
            const percentage = (timeRemaining / duration) * 100;

            container.className = `mp-powerup-inline active ${powerupType}`;
            emoji.textContent = powerupEmojis[powerupType] || '';
            fill.style.width = Math.max(0, percentage) + '%';
        } else {
            container.className = 'mp-powerup-inline';
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
        // Créer un overlay d'attente AAA (styles dans snake.css)
        const overlay = document.createElement('div');
        overlay.id = 'mp-waiting-overlay';
        overlay.innerHTML = `
            <div class="mp-waiting-content">
                <div class="mp-waiting-icon">🎯</div>
                <h2 class="mp-waiting-title">Recherche en cours</h2>
                <p class="mp-waiting-subtitle">Connexion à un adversaire...</p>

                <div class="mp-waiting-spinner-container">
                    <div class="mp-spinner-outer"></div>
                    <div class="mp-spinner-inner"></div>
                    <div class="mp-spinner-dot"></div>
                </div>

                <div class="mp-waiting-status">
                    <div class="mp-status-dot"></div>
                    <span class="mp-status-text">Connecté au serveur</span>
                </div>

                <button class="mp-waiting-cancel" onclick="window.multiGame?.cancelMatchmaking()">
                    Annuler
                </button>
            </div>
        `;

        // Ajouter au body (position fixed dans CSS)
        document.body.appendChild(overlay);

        // Enregistrer l'overlay dans le ScreenManager
        window.screenManager.registerOverlay('mp-waiting-overlay');
    }

    cancelMatchmaking() {
        // Fermer la connexion et retourner au lobby
        this.hideWaitingOverlay();
        if (this.client) {
            this.client.disconnect();
        }
        if (window.screenManager) {
            window.screenManager.show('main-lobby-screen');
        }
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
        const players = message.players || {}; // ✅ FIX: Récupérer les infos des joueurs
        const mySegments = scores[myId] || 0;
        const opponentId = Object.keys(scores).find(id => id !== myId);
        const opponentSegments = opponentId ? scores[opponentId] : 0;

        // ✅ FIX: Récupérer les pseudos réels
        const myPseudo = players[myId]?.pseudo || 'Vous';
        const opponentPseudo = opponentId ? (players[opponentId]?.pseudo || 'Adversaire') : 'Adversaire';

        // ✅ FIX ABANDON: Gérer winner booléen (abandon) ou ID (collision)
        const isWinner = typeof message.winner === 'boolean'
            ? message.winner
            : message.winner === myId;

        // ✅ TRACKING VICTOIRES MULTIJOUEUR (pour trophées)
        this.trackMultiplayerVictory(isWinner);

        const resultMessage = isWinner
            ? '🏆 VICTOIRE !'
            : message.winner
                ? '💀 DÉFAITE'
                : '⚔️ MATCH NUL';

        const reasonText = message.reason === 'time_up'
            ? '⏰ Temps écoulé !'
            : message.reason === 'opponent_died'
                ? '💀 Adversaire éliminé !'
                : message.reason === 'abandon'
                    ? '🏳️ Adversaire a abandonné !'
                    : '💀 Les deux sont morts !';

        // Créer l'overlay de game over (styles AAA dans snake.css)
        const gameOverOverlay = document.createElement('div');
        gameOverOverlay.id = 'mp-gameover-overlay';
        gameOverOverlay.className = isWinner ? 'victory' : (message.winner ? 'defeat' : 'draw');

        // Titre et icône selon le résultat
        const titleText = isWinner ? 'VICTOIRE' : (message.winner ? 'DÉFAITE' : 'MATCH NUL');
        const titleIcon = isWinner ? '🏆' : (message.winner ? '💀' : '⚔️');

        gameOverOverlay.innerHTML = `
            <div class="mp-gameover-content">
                <div class="mp-gameover-icon">${titleIcon}</div>
                <h1 class="mp-gameover-title ${isWinner ? 'victory' : ''}">${titleText}</h1>
                <p class="mp-gameover-subtitle">${reasonText}</p>

                <div class="mp-gameover-scores">
                    <div class="mp-score-card ${mySegments > opponentSegments ? 'winner' : ''}">
                        <div class="mp-score-avatar">🐍</div>
                        <div class="mp-score-name">${myPseudo}</div>
                        <div class="mp-score-value">${mySegments}</div>
                        <div class="mp-score-label">segments</div>
                    </div>
                    <div class="mp-score-vs">VS</div>
                    <div class="mp-score-card ${opponentSegments > mySegments ? 'winner' : ''}">
                        <div class="mp-score-avatar">🐍</div>
                        <div class="mp-score-name">${opponentPseudo}</div>
                        <div class="mp-score-value">${opponentSegments}</div>
                        <div class="mp-score-label">segments</div>
                    </div>
                </div>

                <div class="mp-gameover-actions">
                    <button id="mp-replay-btn" class="mp-btn-primary">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Rejouer</span>
                    </button>
                    <button id="mp-leaderboard-btn" class="mp-btn-secondary">
                        <span class="btn-icon">🏆</span>
                        <span class="btn-text">Leaderboard</span>
                    </button>
                    <button id="mp-menu-btn" class="mp-btn-tertiary">
                        <span class="btn-icon">🏠</span>
                        <span class="btn-text">Menu</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(gameOverOverlay);

        // Enregistrer l'overlay dans le ScreenManager
        window.screenManager.registerOverlay('mp-gameover-overlay');

        // Attacher les événements
        document.getElementById('mp-replay-btn').onclick = () => {
            gameOverOverlay.remove();

            // ✅ FIX MUSIQUE: Forcer l'arrêt de la musique actuelle
            if (window.audioManager) {
                window.audioManager.stopAll();
            }

            // ✅ FIX BUG REJOUER: Retourner au lobby au lieu de disconnect/reconnect
            window.screenManager.show('lobby-screen');
        };

        document.getElementById('mp-leaderboard-btn').onclick = () => {
            window.showLeaderboard();
        };

        document.getElementById('mp-menu-btn').onclick = () => {
            gameOverOverlay.remove();
            this.returnToMenu();
        };
    }

    /**
     * Track les victoires multijoueur (pour trophées)
     * @param {boolean} isWinner - Si le joueur a gagné
     */
    trackMultiplayerVictory(isWinner) {
        // Sécurité: attendre que snake.js soit chargé
        if (!window.load || !window.save || !window.checkTrophy) return;

        // ✅ Réinitialiser les trophées de session
        window.sessionTrophies = [];

        let career = window.load('career', {});

        // Initialiser les variables multi si besoin
        if (typeof career.multiWins === 'undefined') career.multiWins = 0;
        if (typeof career.currentStreak === 'undefined') career.currentStreak = 0;
        if (typeof career.bestStreak === 'undefined') career.bestStreak = 0;
        if (typeof career.phoenixRisesMulti === 'undefined') career.phoenixRisesMulti = 0;
        if (typeof career.lastMultiResult === 'undefined') career.lastMultiResult = null;
        if (typeof career.multiPowerups === 'undefined') career.multiPowerups = 0;
        if (typeof career.totalMultiGames === 'undefined') career.totalMultiGames = 0;
        if (typeof career.multiCompleted === 'undefined') career.multiCompleted = 0;

        // ✅ TRACKING: Incrémenter compteur parties multi (toujours)
        career.totalMultiGames++;
        career.multiCompleted++; // On considère que finir = pas d'abandon
        logger.log(`[MultiGame] Parties multi: ${career.totalMultiGames}, Complétées: ${career.multiCompleted}`);

        // ✅ TRACKING POWER-UPS: Ajouter les power-ups collectés cette partie
        career.multiPowerups += this.powerupsCollectedThisGame || 0;
        logger.log(`[MultiGame] Power-ups collectés cette partie: ${this.powerupsCollectedThisGame}, Total carrière: ${career.multiPowerups}`);

        // Mettre à jour selon le résultat
        if (isWinner) {
            career.multiWins++;
            career.currentStreak++;

            // PHOENIX: Victoire immédiatement après une défaite en multi
            if (career.lastMultiResult === 'loss') {
                career.phoenixRisesMulti++;
            }
            career.lastMultiResult = 'win';

            // Mettre à jour le meilleur streak
            if (career.currentStreak > career.bestStreak) {
                career.bestStreak = career.currentStreak;
            }
        } else {
            // Défaite ou match nul - réinitialiser le streak
            career.currentStreak = 0;
            career.lastMultiResult = 'loss';
        }

        // ✅ SYNC: Mettre à jour window.career pour que TROPHIES.check() voit les changements
        if (window.career) {
            Object.assign(window.career, career);
        }

        // Sauvegarder et vérifier les trophées
        window.save('career', career);
        window.checkTrophy();
    }

    replay() {
        // Redémarrer une nouvelle partie
        this.stop();
        setTimeout(() => this.start(), 500);
    }

    // 🎁 ANIMATION ROULETTE - Jouer l'animation quand on collecte une mystery box
    async playRouletteAnimation(finalItem) {
        const itemSlot = document.getElementById('multi-sword-slot');
        const itemIcon = document.getElementById('multi-sword-icon');

        if (!itemSlot || !itemIcon) return;

        // Ajouter classe d'animation
        itemSlot.classList.add('revealing');

        const emojis = ['❄️', '🔥', '🪨', '👻', '⚡', '⚔️'];

        // Animation roulette rapide (600ms)
        for (let i = 0; i < 12; i++) {
            itemIcon.textContent = emojis[i % emojis.length];
            await new Promise(r => setTimeout(r, 30 + i * 8));
        }

        // Révéler l'item final
        const itemEmojis = {
            ice: '❄️', fire: '🔥', rock: '🪨', ghost: '👻', lightning: '⚡', sword: '⚔️'
        };
        itemIcon.textContent = itemEmojis[finalItem] || '?';

        // Retirer animation et ajouter effet de révélation
        itemSlot.classList.remove('revealing');
        itemSlot.classList.add('has-item', 'item-revealed');

        setTimeout(() => {
            itemSlot.classList.remove('item-revealed');
        }, 500);

        logger.log(`[MultiGame] Roulette terminée: ${finalItem}`);
    }

    // 🎁 UTILISER L'ITEM STOCKÉ
    useStoredItem() {
        if (!this.client || !this.client.connected) {
            logger.warn('[MultiGame] Non connecté pour utiliser l\'item');
            return false;
        }

        // Vérifier si le joueur a un item stocké
        if (this.serverState?.players && this.client.playerId) {
            const myPlayer = this.serverState.players[this.client.playerId];
            if (!myPlayer?.storedItem) {
                logger.log('[MultiGame] Aucun item stocké');
                return false;
            }
        }

        this.client.sendUseItem();
        return true;
    }

    // ⚡ BOOST - Activer le boost de vitesse
    activateBoost() {
        if (!this.client?.connected) {
            logger.log('[MultiGame] Non connecté, impossible d\'activer le boost');
            return false;
        }

        // Vérifier si on est en jeu
        if (!this.serverState?.players || !this.client.playerId) {
            logger.log('[MultiGame] Pas de partie en cours');
            return false;
        }

        // Vérifier le cooldown côté client (le serveur le vérifiera aussi)
        const myPlayer = this.serverState.players[this.client.playerId];
        if (myPlayer?.boostCooldownEnd && Date.now() < myPlayer.boostCooldownEnd) {
            const remaining = Math.ceil((myPlayer.boostCooldownEnd - Date.now()) / 1000);
            logger.log(`[MultiGame] Boost en cooldown (${remaining}s)`);
            return false;
        }

        this.client.sendBoost();
        return true;
    }

    // ⚡ BOOST - Afficher le cooldown sur le bouton
    showBoostCooldown(cooldownMs) {
        const boostBtn = document.getElementById('multi-boost-btn');
        if (!boostBtn) return;

        // Ajouter classe cooldown (même classe que mode solo)
        boostBtn.classList.add('boost-cooldown');
        boostBtn.disabled = true;

        // Timer visuel
        const startTime = Date.now();
        const endTime = startTime + cooldownMs;

        const updateCooldown = () => {
            const remaining = Math.max(0, endTime - Date.now());
            if (remaining > 0) {
                const seconds = Math.ceil(remaining / 1000);
                boostBtn.setAttribute('data-cooldown', `${seconds}s`);
                requestAnimationFrame(updateCooldown);
            } else {
                boostBtn.classList.remove('boost-cooldown');
                boostBtn.disabled = false;
                boostBtn.removeAttribute('data-cooldown');
            }
        };

        updateCooldown();
    }

    returnToMenu() {
        // Arrêter le jeu (cleanup des overlays inclus)
        this.stop();

        // Le ScreenManager s'occupe de tout (cleanup + affichage)
        window.screenManager.show('hub');

        // Rafraîchir le hub
        if (window.initHub) {
            setTimeout(() => window.initHub(), 100);
        }
    }
}

// ============================================
// EXPORT
// ============================================

window.MultiplayerSnakeGame = MultiplayerSnakeGame;

// ⚡ BOOST - Fonction globale pour le bouton boost multi
window.multiBoost = function() {
    if (window.multiGame) {
        return window.multiGame.activateBoost();
    }
    return false;
};
