// ============================================
// AI SNAKE GAME - MODE JOUEUR VS IA (MVP)
// ============================================

import { logger } from './services/logger.js';
import { BaseSnakeGame } from './core/BaseSnakeGame.js';
import { SnakeAI } from './ai/snake-ai.js';
import { drawSnakeEnhanced, getDirectionString } from './SkinsRenderer.js';
import { POWERUP_SKIN_COLORS, POWERUP_EFFECTS } from './config/constants.js';
import { CleanupManager } from './managers/CleanupManager.js';
import { PowerUpState } from './core/PowerUpState.js';

class AISnakeGame extends BaseSnakeGame {
    constructor() {
        super('canvas-ai');

        // 🎮 SERPENT JOUEUR
        this.playerSnake = [];
        this.playerDx = 0;
        this.playerDy = 0;
        this.playerNdx = 0;
        this.playerNdy = 0;

        // 🤖 SERPENT IA
        this.aiSnake = [];
        this.aiDx = 0;
        this.aiDy = 0;

        // 🧠 Intelligence Artificielle
        this.ai = new SnakeAI(this.GRID_SIZE);

        // 🍎 Nourriture normale (3 pommes simultanées)
        this.foods = [];
        this.MAX_FOODS = 3;

        // ⚡ Power-ups (3 max avec expiration 15s)
        this.powerups = [];
        this.MAX_POWERUPS = 3;
        this.POWERUP_LIFETIME = 15000; // 15 secondes

        // Durées des power-ups (en ms) - toutes à 6 secondes
        this.POWERUP_DURATIONS = {
            fire: 6000,       // 6 secondes - unlimited boost
            lightning: 6000,  // 6 secondes (ex-fire)
            ice: 6000,        // 6 secondes
            rock: 6000,       // 6 secondes
            ghost: 6000,      // 6 secondes
            sword: 6000       // 6 secondes - steal 2 segments
        };

        // Effets power-ups (utilise PowerUpState centralisé)
        this.playerPowerup = new PowerUpState('player');
        this.aiPowerup = new PowerUpState('ai');

        // Aliases pour compatibilité (getter dynamique)
        Object.defineProperty(this, 'playerPowerupEffects', { get: () => this.playerPowerup.effects });
        Object.defineProperty(this, 'playerActivePowerup', { get: () => this.playerPowerup.activePowerup });
        Object.defineProperty(this, 'playerGhostUsed', {
            get: () => this.playerPowerup.ghostUsed,
            set: (v) => this.playerPowerup.ghostUsed = v
        });
        Object.defineProperty(this, 'playerSlowed', { get: () => this.playerPowerup.slowed });
        Object.defineProperty(this, 'aiPowerupEffects', { get: () => this.aiPowerup.effects });
        Object.defineProperty(this, 'aiActivePowerup', { get: () => this.aiPowerup.activePowerup });
        Object.defineProperty(this, 'aiGhostUsed', {
            get: () => this.aiPowerup.ghostUsed,
            set: (v) => this.aiPowerup.ghostUsed = v
        });
        Object.defineProperty(this, 'aiSlowed', { get: () => this.aiPowerup.slowed });

        // 🏆 Tracking segments volés par le joueur (pour trophée Voleur)
        this.playerSegmentsStolenThisGame = 0;
        // 💎 Tracking power-ups collectés par le joueur (pour trophée Collectionneur)
        this.playerPowerupsCollectedThisGame = 0;

        // États de ralentissement (ICE) - géré par PowerUpState

        // Vitesses indépendantes (comme multi)
        this.playerLastMove = 0;
        this.aiLastMove = 0;

        // ⏱️ Timer 3 minutes
        this.matchDuration = 3 * 60 * 1000;
        this.timeRemaining = this.matchDuration;
        this.timerInterval = null;

        // 🔒 Contrôle
        this.locked = false;

        // 💥 Effets visuels
        this.particles = [];

        // ✨ Clignotement lors impact
        this.playerFlash = null; // {color: '#...', until: timestamp}
        this.aiFlash = null;

        logger.log('[AIGame] Initialized');

        // 🧹 Cache DOM refs pour performance
        this._isDarkMode = false;
        this._darkModeCheckCounter = 0;
        this._domCache = {
            timer: null,
            player1Score: null,
            player2Score: null
        };
        this._lastUIValues = { timeText: '', playerScore: -1, aiScore: -1 };
    }

    /**
     * Calcule la vitesse du joueur selon power-up et débuffs
     * FIRE: 125ms (boost illimité), SLOWED: x2, Normal: 250ms
     */
    getPlayerSpeed() {
        const BASE = 250;
        if (this.playerPowerup.canBoostUnlimited()) return this.playerPowerup.getBoostSpeed();
        return this.playerPowerup.getSpeed(BASE, 500);
    }

    /**
     * Calcule la vitesse de l'IA selon power-up et débuffs
     */
    getAISpeed() {
        const BASE = 250;
        if (this.aiPowerup.canBoostUnlimited()) return this.aiPowerup.getBoostSpeed();
        return this.aiPowerup.getSpeed(BASE, 500);
    }

    /**
     * Surcharge de calculateSpeed pour la boucle de rendu globale
     * Retourne la vitesse la plus rapide des deux serpents
     */
    calculateSpeed() {
        // Update à la vitesse du serpent le plus rapide
        const playerSpeed = this.getPlayerSpeed();
        const aiSpeed = this.getAISpeed();
        return Math.min(playerSpeed, aiSpeed, 125); // Min 125ms pour FIRE
    }

    // ============================================
    // DÉMARRAGE & RESET
    // ============================================

    start(difficulty = 0) {
        CleanupManager.setContext('ai-game');
        super.start(difficulty);
        this.startTimer();
        // Note: La musique est gérée par ScreenManager.show('game-ai')
    }

    reset() {
        // ✅ Reset flags
        this.gameOverTriggered = false;
        this.isExploding = false;
        this.isFlashing = false;

        // Serpents aux coins opposés
        this.playerSnake = [{ x: 5, y: 25 }]; // Bas-gauche
        this.playerDx = 1;
        this.playerDy = 0;
        this.playerNdx = 1;
        this.playerNdy = 0;
        this.playerInvincible = false;

        this.aiSnake = [{ x: 24, y: 4 }]; // Haut-droit
        this.aiDx = -1;
        this.aiDy = 0;
        this.aiInvincible = false;

        // ✅ Afficher le pseudo du joueur
        const playerNameElem = document.getElementById('ai-player1-name');
        if (playerNameElem) {
            const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';
            playerNameElem.textContent = pseudo;
        }

        // Spawn 3 pommes
        this.foods = [];
        for (let i = 0; i < this.MAX_FOODS; i++) {
            this.spawnFood();
        }

        // Réinitialiser power-ups
        this.powerups = [];
        this.playerPowerup.reset();
        this.aiPowerup.reset();
        this.playerSegmentsStolenThisGame = 0;
        this.playerPowerupsCollectedThisGame = 0;

        // Timer
        this.timeRemaining = this.matchDuration;
        this.stopTimer();

        // Flags
        this.locked = false;
        this.particles = [];

        this.updateUI();
    }

    // ============================================
    // TIMER
    // ============================================

    startTimer() {
        this.stopTimer();

        this.timerInterval = CleanupManager.registerInterval(setInterval(() => {
            if (!this.running || this.paused) return;

            this.timeRemaining -= 100;

            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.gameOver();
            }

            this.updateUI();
        }, 100), 'ai-timer', 'ai-game');
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // ============================================
    // BOUCLE PRINCIPALE
    // ============================================

    update() {
        const now = performance.now();
        const timestamp = Date.now(); // Pour clignotements et ralentissement

        // 1️⃣ Appliquer direction joueur (input clavier)
        this.playerDx = this.playerNdx;
        this.playerDy = this.playerNdy;
        this.locked = false;

        // 2️⃣ IA décide son mouvement (cible la pomme la plus proche)
        const closestFood = this.getClosestFood(this.aiSnake[0]);
        const aiMove = this.ai.getNextMove(
            this.aiSnake,
            this.playerSnake,
            closestFood,
            []
        );
        this.aiDx = aiMove.dx;
        this.aiDy = aiMove.dy;

        // 3️⃣ Calculer vitesses individuelles selon power-ups (comme multi)
        const playerSpeed = this.getPlayerSpeed();
        const aiSpeed = this.getAISpeed();

        // 🔥 Vérifier collision tête-à-tête AVANT mouvement (les deux effets s'appliquent)
        const playerShouldMove = (now - this.playerLastMove > playerSpeed);
        const aiShouldMove = (now - this.aiLastMove > aiSpeed);

        if (playerShouldMove && aiShouldMove) {
            this.checkHeadToHeadCollision();
        }

        // Déplacer chaque serpent selon sa propre vitesse
        if (playerShouldMove) {
            this.playerLastMove = now;
            this.movePlayer();
        }

        if (aiShouldMove) {
            this.aiLastMove = now;
            this.moveAI();
        }

        // 4️⃣ Gérer power-ups (spawn + expiration)
        this.managePowerups();

        // 5️⃣ + 6️⃣ Vérifier expiration des power-ups et ralentissement via PowerUpState
        this.playerPowerup.update(timestamp, this.POWERUP_DURATIONS);
        this.aiPowerup.update(timestamp, this.POWERUP_DURATIONS);

        // 7️⃣ Mettre à jour particules
        this.updateParticles();

        // 8️⃣ Vérifier fin des clignotements (utilise timestamp, pas now !)
        if (this.playerFlash && timestamp > this.playerFlash.until) {
            this.playerFlash = null;
            logger.log('[AIGame] ✨ Clignotement joueur terminé');
        }
        if (this.aiFlash && timestamp > this.aiFlash.until) {
            this.aiFlash = null;
            logger.log('[AIGame] ✨ Clignotement IA terminé');
        }
    }

    movePlayer() {

        let head = {
            x: this.playerSnake[0].x + this.playerDx,
            y: this.playerSnake[0].y + this.playerDy
        };

        // Wrapping
        if (head.x < 0) head.x = this.GRID_SIZE - 1;
        if (head.x >= this.GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = this.GRID_SIZE - 1;
        if (head.y >= this.GRID_SIZE) head.y = 0;

        // 🚫 Vérifier collision avec le corps de l'IA
        const collidesWithAI = this.aiSnake.some(seg => seg.x === head.x && seg.y === head.y);
        if (collidesWithAI) {
            // ✅ Vérifier si GHOST AVANT de déclencher les effets
            const canPhase = this.playerPowerup.canPhaseThroughEnemy();

            // 🔥 BIDIRECTIONNEL: Appliquer les DEUX effets (joueur -> IA et IA -> joueur)
            this.handleCollision('player', 'ai');  // Effet du joueur sur IA
            this.handleCollision('ai', 'player');  // Effet de l'IA sur joueur (riposte)

            // GHOST peut traverser, les autres sont bloqués
            if (canPhase) {
                // Peut traverser l'adversaire
                logger.log('[AIGame] 👻 GHOST: Joueur traverse l\'IA');
                // Continue le déplacement normalement (ne return pas)
            } else {
                // Bloqué - ne bouge pas
                logger.log('[AIGame] 🚫 Joueur bloqué par IA');
                return;
            }
        }

        // Vérifier collision avec n'importe quelle pomme
        const foodIndex = this.foods.findIndex(f => f.x === head.x && f.y === head.y);
        if (foodIndex !== -1) {
            this.eatFood('player', head, foodIndex);
            return;
        }

        // Vérifier collision avec n'importe quel power-up
        const powerupIndex = this.powerups.findIndex(p => p.x === head.x && p.y === head.y);
        if (powerupIndex !== -1) {
            this.eatPowerup('player', head, powerupIndex);
            return;
        }

        // Déplacement normal
        this.playerSnake.unshift(head);
        this.playerSnake.pop();
    }

    moveAI() {
        let head = {
            x: this.aiSnake[0].x + this.aiDx,
            y: this.aiSnake[0].y + this.aiDy
        };

        // Wrapping
        if (head.x < 0) head.x = this.GRID_SIZE - 1;
        if (head.x >= this.GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = this.GRID_SIZE - 1;
        if (head.y >= this.GRID_SIZE) head.y = 0;

        // 🚫 Vérifier collision avec le corps du joueur
        const collidesWithPlayer = this.playerSnake.some(seg => seg.x === head.x && seg.y === head.y);
        if (collidesWithPlayer) {
            // ✅ Vérifier si GHOST AVANT de déclencher les effets
            const canPhase = this.aiPowerup.canPhaseThroughEnemy();

            // 🔥 BIDIRECTIONNEL: Appliquer les DEUX effets (IA -> joueur et joueur -> IA)
            this.handleCollision('ai', 'player');  // Effet de l'IA sur joueur
            this.handleCollision('player', 'ai');  // Effet du joueur sur IA (riposte)

            // GHOST peut traverser, les autres sont bloqués
            if (canPhase) {
                // Peut traverser l'adversaire
                logger.log('[AIGame] 👻 GHOST: IA traverse le joueur');
                // Continue le déplacement normalement (ne return pas)
            } else {
                // Bloqué - ne bouge pas
                logger.log('[AIGame] 🚫 IA bloquée par joueur');
                return;
            }
        }

        // Vérifier collision avec n'importe quelle pomme
        const foodIndex = this.foods.findIndex(f => f.x === head.x && f.y === head.y);
        if (foodIndex !== -1) {
            this.eatFood('ai', head, foodIndex);
            return;
        }

        // Vérifier collision avec n'importe quel power-up
        const powerupIndex = this.powerups.findIndex(p => p.x === head.x && p.y === head.y);
        if (powerupIndex !== -1) {
            this.eatPowerup('ai', head, powerupIndex);
            return;
        }

        // Déplacement normal
        this.aiSnake.unshift(head);
        this.aiSnake.pop();
    }

    // ============================================
    // COLLISION TÊTE-À-TÊTE (MUTUAL)
    // ============================================

    /**
     * Vérifie si les deux serpents vont entrer en collision tête-à-tête
     * Si oui, applique les deux effets de power-up AVANT mouvement
     */
    checkHeadToHeadCollision() {
        // Calculer les nouvelles positions des têtes
        let playerNewHead = {
            x: this.playerSnake[0].x + this.playerDx,
            y: this.playerSnake[0].y + this.playerDy
        };
        let aiNewHead = {
            x: this.aiSnake[0].x + this.aiDx,
            y: this.aiSnake[0].y + this.aiDy
        };

        // Wrapping pour joueur
        if (playerNewHead.x < 0) playerNewHead.x = this.GRID_SIZE - 1;
        if (playerNewHead.x >= this.GRID_SIZE) playerNewHead.x = 0;
        if (playerNewHead.y < 0) playerNewHead.y = this.GRID_SIZE - 1;
        if (playerNewHead.y >= this.GRID_SIZE) playerNewHead.y = 0;

        // Wrapping pour IA
        if (aiNewHead.x < 0) aiNewHead.x = this.GRID_SIZE - 1;
        if (aiNewHead.x >= this.GRID_SIZE) aiNewHead.x = 0;
        if (aiNewHead.y < 0) aiNewHead.y = this.GRID_SIZE - 1;
        if (aiNewHead.y >= this.GRID_SIZE) aiNewHead.y = 0;

        // Collision tête-à-tête: les deux têtes vont au même endroit
        // OU les deux têtes échangent leurs positions (croisement)
        const headsAtSamePos = (playerNewHead.x === aiNewHead.x && playerNewHead.y === aiNewHead.y);
        const headsCrossing = (
            playerNewHead.x === this.aiSnake[0].x && playerNewHead.y === this.aiSnake[0].y &&
            aiNewHead.x === this.playerSnake[0].x && aiNewHead.y === this.playerSnake[0].y
        );

        if (headsAtSamePos || headsCrossing) {
            logger.log('[AIGame] 💥 Collision tête-à-tête détectée!');

            // Appliquer TOUS les effets avant mouvement (les deux directions)
            this.handleCollision('player', 'ai');
            this.handleCollision('ai', 'player');
        }
    }

    // ============================================
    // COLLISIONS CORPS-À-CORPS
    // ============================================

    /**
     * Vérifie les collisions entre les corps des deux serpents
     */
    checkBodyCollisions() {
        const playerHead = this.playerSnake[0];
        const aiHead = this.aiSnake[0];

        // Joueur touche corps IA
        const playerTouchesAI = this.aiSnake.slice(1).some(seg =>
            seg.x === playerHead.x && seg.y === playerHead.y
        );

        if (playerTouchesAI) {
            this.handleCollision('player', 'ai');
        }

        // IA touche corps joueur
        const aiTouchesPlayer = this.playerSnake.slice(1).some(seg =>
            seg.x === aiHead.x && seg.y === aiHead.y
        );

        if (aiTouchesPlayer) {
            this.handleCollision('ai', 'player');
        }
    }

    /**
     * Gère une collision entre attaquant et défenseur - V2
     * Utilise POWERUP_EFFECTS pour déterminer les effets
     */
    handleCollision(attacker, defender) {
        const attackerState = attacker === 'player' ? this.playerPowerup : this.aiPowerup;
        const defenderState = defender === 'player' ? this.playerPowerup : this.aiPowerup;
        const attackerSnake = attacker === 'player' ? this.playerSnake : this.aiSnake;
        const defenderSnake = defender === 'player' ? this.playerSnake : this.aiSnake;

        // Vérifier si l'attaquant peut utiliser son effet contact
        if (!attackerState.canUseContact()) {
            logger.log('[AIGame] ' + attacker + ' collision sans effet (déjà utilisé ou pas de power-up)');
            return;
        }

        // Récupérer l'effet contact (avec exceptions pour Rock)
        const contactEffect = attackerState.getContactEffect(defenderState.activePowerup);
        if (!contactEffect) {
            return;
        }

        // Vérifier immunité Rock
        if (defenderState.isInvincible()) {
            logger.log('[AIGame] ' + defender + ' immunisé (Rock)');
            return;
        }

        let totalStolen = 0;
        let totalBurned = 0;

        // 🔥 Effet BURN (Fire) - Détruit segments sans les voler
        if (contactEffect.burnSegments > 0) {
            const burned = this.applyBurnEffect(defenderSnake, contactEffect.burnSegments);
            totalBurned = burned;
            logger.log('[AIGame] 🔥 ' + attacker + ' brûle ' + burned + ' segment(s)');
        }

        // ⚔️ Effet STEAL (Ghost, Lightning, Sword)
        if (contactEffect.stealSegments > 0 && !defenderState.isImmuneToSteal()) {
            const stolen = this.applyStealEffect(attackerSnake, defenderSnake, contactEffect.stealSegments);
            totalStolen = stolen;
            if (attacker === 'player') {
                this.playerSegmentsStolenThisGame += stolen;
            }
            logger.log('[AIGame] ⚔️ ' + attacker + ' vole ' + stolen + ' segment(s)');
        }

        // 👻 Vol de power-up stocké (Ghost uniquement)
        if (contactEffect.stealEnemyPowerup) {
            const stolenPowerup = defenderState.stealStoredPowerup();
            if (stolenPowerup) {
                attackerState.storePowerup(stolenPowerup);
                logger.log('[AIGame] 👻 ' + attacker + ' vole power-up stocké: ' + stolenPowerup);
            }
        }

        // 💫 Appliquer débuff
        if (contactEffect.debuff) {
            const debuff = contactEffect.debuff;
            if (debuff.type === 'SLOWED') {
                defenderState.applySlowed(debuff.duration, debuff.speedMultiplier);
            } else if (debuff.type === 'INVERTED_CONTROLS') {
                defenderState.applyInvertedControls(debuff.duration);
            }
            logger.log('[AIGame] 💫 ' + defender + ' reçoit débuff: ' + debuff.type);
        }

        // Marquer comme utilisé (one-shot)
        attackerState.markContactUsed();

        // Effets visuels si segments perdus
        if (totalStolen > 0 || totalBurned > 0) {
            const now = Date.now();
            if (defender === 'player') {
                this.playerFlash = { color: totalBurned > 0 ? '#FF5722' : '#FFFFFF', until: now + 1500 };
            } else {
                this.aiFlash = { color: totalBurned > 0 ? '#FF5722' : '#FFFFFF', until: now + 1500 };
            }
            if (this.audio) this.audio.eat();
        }

        this.updateUI();
    }

    /**
     * Applique l'effet BURN - Détruit des segments (Fire)
     */
    applyBurnEffect(targetSnake, count) {
        let burned = 0;
        for (let i = 0; i < count && targetSnake.length > 1; i++) {
            const seg = targetSnake.pop();
            this.createBreakEffect(seg.x, seg.y, '#FF5722');
            burned++;
        }
        return burned;
    }

    /**
     * Applique l'effet STEAL - Vole des segments
     */
    applyStealEffect(attackerSnake, defenderSnake, count) {
        let stolen = 0;
        for (let i = 0; i < count && defenderSnake.length > 1; i++) {
            const seg = defenderSnake.pop();
            this.createBreakEffect(seg.x, seg.y, '#FFFFFF');
            attackerSnake.push({...attackerSnake[attackerSnake.length - 1]});
            stolen++;
        }
        return stolen;
    }

    // ============================================
    // NOURRITURE
    // ============================================

    /**
     * Trouve la pomme la plus proche d'une position
     */
    getClosestFood(position) {
        if (this.foods.length === 0) return null;

        let closest = this.foods[0];
        let minDist = Math.abs(position.x - closest.x) + Math.abs(position.y - closest.y);

        for (let i = 1; i < this.foods.length; i++) {
            const dist = Math.abs(position.x - this.foods[i].x) + Math.abs(position.y - this.foods[i].y);
            if (dist < minDist) {
                minDist = dist;
                closest = this.foods[i];
            }
        }

        return closest;
    }

    /**
     * Spawn une nouvelle pomme (maintient toujours MAX_FOODS pommes)
     */
    spawnFood() {
        if (this.foods.length >= this.MAX_FOODS) return;

        let x, y;
        const occupied = [
            ...this.playerSnake,
            ...this.aiSnake,
            ...this.foods,
            ...this.powerups
        ];

        let attempts = 0;
        do {
            x = Math.floor(Math.random() * this.GRID_SIZE);
            y = Math.floor(Math.random() * this.GRID_SIZE);
            attempts++;
            if (attempts > 100) return; // Éviter boucle infinie
        } while (occupied.some(s => s.x === x && s.y === y));

        this.foods.push({ x, y });
    }

    /**
     * Mange une pomme (supprime + respawn)
     */
    eatFood(eater, head, foodIndex) {
        if (eater === 'player') {
            this.playerSnake.unshift(head);
        } else {
            this.aiSnake.unshift(head);
        }

        if (this.audio) this.audio.eat();

        // Supprimer la pomme mangée
        this.foods.splice(foodIndex, 1);

        // Respawn immédiatement pour maintenir 3 pommes
        this.spawnFood();

        this.updateUI();
    }

    // ============================================
    // PARTICULES
    // ============================================

    /**
     * Crée un effet de particules à une position donnée
     * @param {number} x - Position X en grille
     * @param {number} y - Position Y en grille
     * @param {string} color - Couleur des particules
     */
    createBreakEffect(x, y, color = '#FFFFFF') {
        const centerX = x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const centerY = y * this.CELL_SIZE + this.CELL_SIZE / 2;

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: 2 + Math.random() * 3,
                color: color
            });
        }
    }

    /**
     * Met à jour toutes les particules
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Dessine toutes les particules
     */
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            this.ctx.restore();
        });
    }

    // ============================================
    // POWER-UPS
    // ============================================

    /**
     * Gère les power-ups : spawn automatique + expiration après 15s
     * Maintient toujours MAX_POWERUPS (3) power-ups sur la grille
     */
    managePowerups() {
        const now = Date.now();

        // 1️⃣ Supprimer les power-ups expirés (>15s)
        this.powerups = this.powerups.filter(p => {
            const age = now - p.spawnTime;
            if (age > this.POWERUP_LIFETIME) {
                logger.log(`[AIGame] ⏰ Power-up ${p.t} expiré (15s)`);
                return false;
            }
            return true;
        });

        // 2️⃣ Spawn nouveaux power-ups jusqu'à MAX_POWERUPS
        while (this.powerups.length < this.MAX_POWERUPS) {
            this.spawnPowerup();
        }
    }

    /**
     * Spawn un nouveau power-up
     */
    spawnPowerup() {
        if (this.powerups.length >= this.MAX_POWERUPS) return;

        const rand = Math.random();
        const types = ['fire', 'lightning', 'ice', 'rock', 'ghost', 'sword'];
        const type = types[Math.floor(Math.random() * types.length)];

        const occupied = [
            ...this.playerSnake,
            ...this.aiSnake,
            ...this.foods,
            ...this.powerups
        ];

        let attempts = 0;
        let x, y;
        do {
            x = Math.floor(Math.random() * this.GRID_SIZE);
            y = Math.floor(Math.random() * this.GRID_SIZE);
            attempts++;
            if (attempts > 100) return; // Éviter boucle infinie
        } while (occupied.some(s => s.x === x && s.y === y));

        this.powerups.push({
            x,
            y,
            t: type,
            spawnTime: Date.now()
        });

        logger.log(`[AIGame] ⚡ Nouveau power-up ${type} spawné (${this.powerups.length}/${this.MAX_POWERUPS})`);
    }

    /**
     * Mange un power-up (supprime de la grille, un nouveau respawn automatiquement)
     */
    eatPowerup(eater, head, powerupIndex) {
        if (this.audio) this.audio.powerup();

        const type = this.powerups[powerupIndex].t;

        // Activer l'effet pour le bon serpent
        if (eater === 'player') {
            this.playerSnake.unshift(head);

            // 💎 Tracking pour trophée Collectionneur
            this.playerPowerupsCollectedThisGame++;

            // Activer via PowerUpState (gère reset automatique)
            this.playerPowerup.activate(type);
        } else {
            this.aiSnake.unshift(head);

            // Activer via PowerUpState (gère reset automatique)
            this.aiPowerup.activate(type);
        }

        // Supprimer le power-up mangé (un nouveau respawnera via managePowerups)
        this.powerups.splice(powerupIndex, 1);

        this.updateUI();
        logger.log(`[AIGame] ${eater} ramasse power-up: ${type} (${this.powerups.length}/${this.MAX_POWERUPS} restants)`);
    }

    disablePowerup(who) {
        if (who === 'player') {
            this.playerPowerup.disable();
        } else {
            this.aiPowerup.disable();
        }
    }

    // ============================================
    // RENDU
    // ============================================

    draw() {
        if (!this.ctx) return;

        // Fond
        this.ctx.fillStyle = this.COLORS.BG_DARK;
        this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

        // ✅ Couleur bordure adaptée au mode dark/light (check toutes les 60 frames)
        if (++this._darkModeCheckCounter >= 60) {
            this._isDarkMode = document.body.classList.contains('dark-mode');
            this._darkModeCheckCounter = 0;
        }
        const borderColor = this._isDarkMode ? '#00A5A5' : '#d8d800ff';

        // Grille avec bordure (utilise RenderUtils)
        if (window.RenderUtils) {
            window.RenderUtils.drawGrid(
                this.ctx,
                this.GRID_SIZE,
                this.CELL_SIZE,
                this.CANVAS_SIZE,
                { grid: '#404060', border: borderColor }
            );
        }

        // Toutes les pommes (étoiles dorées)
        if (window.RenderUtils) {
            this.foods.forEach(food => {
                window.RenderUtils.drawStar(this.ctx, food.x, food.y, this.CELL_SIZE);
            });
        }

        // Tous les power-ups
        if (window.RenderUtils) {
            this.powerups.forEach(powerup => {
                window.RenderUtils.drawPowerup(
                    this.ctx,
                    powerup.x,
                    powerup.y,
                    this.CELL_SIZE,
                    powerup.t
                );
            });
        }

        // ============================================
        // ✨ DESSINER SERPENT JOUEUR AVEC SKINS
        // ============================================

        // Obtenir les couleurs du skin joueur (ou couleurs temporaires selon power-up)
        let playerSkinColors = null;

        // Si un power-up est actif, utiliser des couleurs centralisées
        if (this.playerActivePowerup && POWERUP_SKIN_COLORS[this.playerActivePowerup]) {
            playerSkinColors = POWERUP_SKIN_COLORS[this.playerActivePowerup];
        }

        // ✅ Si ralenti par ICE ennemi, forcer couleur cyan
        if (this.playerSlowed) {
            playerSkinColors = POWERUP_SKIN_COLORS.slowed;
        }

        // ⚡ Si contrôles inversés (Lightning débuff), couleur jaune
        if (this.playerPowerup.debuffs.invertedControls.active) {
            playerSkinColors = POWERUP_SKIN_COLORS.invertedControls;
        }

        // ✨ Si clignotement actif (impact GHOST), couleur blanche
        if (this.playerFlash) {
            const shouldFlash = Math.floor(Date.now() / 200) % 2 === 0;
            if (shouldFlash) {
                const flashColor = this.playerFlash.color;
                playerSkinColors = {
                    head: { light: flashColor, dark: flashColor },
                    body: { from: flashColor, to: flashColor },
                    tail: { color: flashColor },
                    outline: '#999999',
                    glow: flashColor
                };
            }
        }

        // Convertir la direction en string
        const playerDirectionString = getDirectionString(this.playerDx, this.playerDy);

        // 💥 Ne pas dessiner le serpent joueur s'il explose
        if (!this.isExploding) {
            // ✨ Si clignotement actif, alterner rouge/normal
            let finalPlayerColors = playerSkinColors;
            if (this.isFlashing) {
                const shouldBeRed = Math.floor(Date.now() / 80) % 2 === 0;
                if (shouldBeRed) {
                    finalPlayerColors = {
                        head: { light: '#FF0000', dark: '#CC0000' },
                        body: { from: '#FF0000', to: '#990000' },
                        tail: { color: '#990000' },
                        outline: '#660000',
                        glow: '#FF0000'
                    };
                }
            }

            drawSnakeEnhanced(
                this.ctx,
                this.playerSnake,
                playerDirectionString,
                this.CELL_SIZE,
                finalPlayerColors
            );
        }

        // ============================================
        // ✨ DESSINER SERPENT IA (couleurs centralisées)
        // ============================================

        // L'IA utilise couleurs rouges par défaut ou power-up actif
        let aiSkinColors = POWERUP_SKIN_COLORS.aiDefault;

        // Power-up actif change la couleur de l'IA
        if (this.aiActivePowerup && POWERUP_SKIN_COLORS[this.aiActivePowerup]) {
            aiSkinColors = POWERUP_SKIN_COLORS[this.aiActivePowerup];
        }

        // ✅ Si ralenti par ICE ennemi, forcer couleur cyan
        if (this.aiSlowed) {
            aiSkinColors = POWERUP_SKIN_COLORS.slowed;
        }

        // ⚡ Si contrôles inversés (Lightning débuff), couleur jaune
        if (this.aiPowerup.debuffs.invertedControls.active) {
            aiSkinColors = POWERUP_SKIN_COLORS.invertedControls;
        }

        // ✨ Si clignotement actif (impact GHOST), couleur blanche
        if (this.aiFlash) {
            const shouldFlash = Math.floor(Date.now() / 200) % 2 === 0;
            if (shouldFlash) {
                const flashColor = this.aiFlash.color;
                aiSkinColors = {
                    head: { light: flashColor, dark: flashColor },
                    body: { from: flashColor, to: flashColor },
                    tail: { color: flashColor },
                    outline: '#999999',
                    glow: flashColor
                };
            }
        }

        // Convertir la direction en string
        const aiDirectionString = getDirectionString(this.aiDx, this.aiDy);

        // 💥 Ne pas dessiner le serpent IA s'il explose
        if (!this.isExploding) {
            // ✨ Si clignotement actif, alterner rouge/blanc
            let finalAIColors = aiSkinColors;
            if (this.isFlashing) {
                const shouldBeWhite = Math.floor(Date.now() / 80) % 2 === 0;
                if (shouldBeWhite) {
                    finalAIColors = {
                        head: { light: '#FFFFFF', dark: '#CCCCCC' },
                        body: { from: '#FFFFFF', to: '#AAAAAA' },
                        tail: { color: '#AAAAAA' },
                        outline: '#888888',
                        glow: '#FFFFFF'
                    };
                }
            }

            drawSnakeEnhanced(
                this.ctx,
                this.aiSnake,
                aiDirectionString,
                this.CELL_SIZE,
                finalAIColors
            );
        }

        // 💥 Dessiner toutes les particules (toujours, pour l'explosion)
        this.drawParticles();
    }

    // ============================================
    // UI
    // ============================================

    updateUI() {
        // Timer - cache DOM element
        const minutes = Math.floor(this.timeRemaining / 60000);
        const seconds = Math.floor((this.timeRemaining % 60000) / 1000);
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (timeText !== this._lastUIValues.timeText) {
            const timerElem = this._domCache.timer ||
                (this._domCache.timer = document.getElementById('ai-timer'));
            if (timerElem) {
                timerElem.textContent = timeText;
                if (this.timeRemaining < 60000) {
                    timerElem.style.color = '#FF4444';
                }
            }
            this._lastUIValues.timeText = timeText;
        }

        // Scores - only update when changed
        const playerLen = this.playerSnake.length;
        const aiLen = this.aiSnake.length;

        if (playerLen !== this._lastUIValues.playerScore) {
            const player1Score = this._domCache.player1Score ||
                (this._domCache.player1Score = document.getElementById('ai-player1-segments'));
            if (player1Score) player1Score.textContent = playerLen;
            this._lastUIValues.playerScore = playerLen;
        }

        if (aiLen !== this._lastUIValues.aiScore) {
            const player2Score = this._domCache.player2Score ||
                (this._domCache.player2Score = document.getElementById('ai-player2-segments'));
            if (player2Score) player2Score.textContent = aiLen;
            this._lastUIValues.aiScore = aiLen;
        }
    }

    // ============================================
    // CONTRÔLES
    // ============================================

    changeDirection(dx, dy) {
        if (this.locked) return;

        // ⚡ Inverser contrôles si Lightning passif ou débuff
        if (this.playerPowerup.hasInvertedControls()) {
            dx = -dx;
            dy = -dy;
        }

        // Empêcher demi-tour
        if (this.playerDx === -dx && this.playerDy === -dy) return;

        this.playerNdx = dx;
        this.playerNdy = dy;
        this.locked = true;
    }

    // ============================================
    // GAME OVER
    // ============================================

    stop() {
        super.stop();
        this.stopTimer();
        CleanupManager.cleanup('ai-game');
    }

    gameOver() {
        // ✅ Empêcher appels multiples
        if (this.gameOverTriggered) return;
        this.gameOverTriggered = true;
        this.stopTimer();

        // 1️⃣ D'abord clignotement rouge (400ms)
        this.isFlashing = true;

        // 2️⃣ Après 400ms, explosion des deux serpents
        setTimeout(() => {
            this.isFlashing = false;
            if (this.playerSnake && this.playerSnake.length > 0) {
                this.explodeSnake(this.playerSnake, '#00FF87');  // Joueur = vert
            }
            if (this.aiSnake && this.aiSnake.length > 0) {
                this.explodeSnake(this.aiSnake, '#FF6B6B');  // IA = rouge
            }
        }, 400);

        // Délai total: 400ms clignotement + 1200ms explosion
        setTimeout(() => {
            this._finalizeGameOver();
        }, 1600);
    }

    /**
     * Finalise le game over après les effets visuels
     */
    _finalizeGameOver() {
        this.stop();

        // Déterminer gagnant
        const playerScore = this.playerSnake.length;
        const aiScore = this.aiSnake.length;

        let winner, loser, winnerScore, loserScore;
        if (playerScore > aiScore) {
            winner = 'Vous';
            loser = 'IA';
            winnerScore = playerScore;
            loserScore = aiScore;
        } else if (aiScore > playerScore) {
            winner = 'IA';
            loser = 'Vous';
            winnerScore = aiScore;
            loserScore = playerScore;
        } else {
            winner = 'Égalité';
            loser = '';
            winnerScore = playerScore;
            loserScore = aiScore;
        }

        logger.log(`[AIGame] Game Over - ${winner} gagne ! (${winnerScore} vs ${loserScore})`);

        // ✅ Tracker victoire pour trophées
        const isPlayerWinner = (winner === 'Vous');
        this.trackAIVictory(isPlayerWinner);

        // ✅ Afficher écran Game Over animé
        this.showGameOverScreen(winner, playerScore, aiScore, isPlayerWinner);
    }

    /**
     * Affiche l'écran Game Over animé
     */
    showGameOverScreen(winner, playerScore, aiScore, isPlayerWinner) {
        // Récupérer les éléments DOM
        const resultTitle = document.getElementById('ai-result-title');
        const resultIcon = document.getElementById('ai-result-icon');
        const resultText = document.getElementById('ai-result-text');
        const playerCard = document.getElementById('ai-player-card');
        const opponentCard = document.getElementById('ai-opponent-card');
        const playerScoreElem = document.getElementById('ai-go-player-score');
        const aiScoreElem = document.getElementById('ai-go-ai-score');
        const playerNameElem = document.getElementById('ai-go-player-name');
        const stolenElem = document.getElementById('ai-go-stolen');
        const powerupsElem = document.getElementById('ai-go-powerups');
        const winsElem = document.getElementById('ai-go-wins');

        // Mettre à jour le pseudo
        const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';
        if (playerNameElem) playerNameElem.textContent = pseudo;

        // Mettre à jour les scores
        if (playerScoreElem) playerScoreElem.textContent = playerScore;
        if (aiScoreElem) aiScoreElem.textContent = aiScore;

        // Mettre à jour les stats
        if (stolenElem) stolenElem.textContent = this.playerSegmentsStolenThisGame || 0;
        if (powerupsElem) powerupsElem.textContent = this.playerPowerupsCollectedThisGame || 0;

        // Récupérer victoires totales
        let career = window.load ? window.load('career', {}) : {};
        if (winsElem) winsElem.textContent = career.aiWins || 0;

        // Configurer l'affichage selon le résultat
        if (resultTitle) {
            resultTitle.classList.remove('defeat', 'tie');
        }

        if (winner === 'Vous') {
            // Victoire
            if (resultIcon) resultIcon.textContent = '🏆';
            if (resultText) resultText.textContent = 'VICTOIRE';
            if (playerCard) {
                playerCard.classList.add('winner');
                playerCard.classList.remove('loser');
            }
            if (opponentCard) {
                opponentCard.classList.remove('winner');
                opponentCard.classList.add('loser');
            }
        } else if (winner === 'IA') {
            // Défaite
            if (resultTitle) resultTitle.classList.add('defeat');
            if (resultIcon) resultIcon.textContent = '💀';
            if (resultText) resultText.textContent = 'DÉFAITE';
            if (playerCard) {
                playerCard.classList.remove('winner');
                playerCard.classList.add('loser');
            }
            if (opponentCard) {
                opponentCard.classList.add('winner');
                opponentCard.classList.remove('loser');
            }
        } else {
            // Égalité
            if (resultTitle) resultTitle.classList.add('tie');
            if (resultIcon) resultIcon.textContent = '🤝';
            if (resultText) resultText.textContent = 'ÉGALITÉ';
            if (playerCard) {
                playerCard.classList.remove('winner', 'loser');
            }
            if (opponentCard) {
                opponentCard.classList.remove('winner', 'loser');
            }
        }

        // Jouer le son approprié
        if (this.audio) {
            if (isPlayerWinner) {
                this.audio.victory?.() || this.audio.eat?.();
            } else {
                this.audio.gameover?.();
            }
        }

        // Afficher l'écran
        if (window.screenManager) {
            window.screenManager.show('over-ai');
        }

        logger.log('[AIGame] Écran Game Over affiché');
    }

    /**
     * Track les victoires contre l'IA (pour trophées)
     * @param {boolean} isPlayerWinner - Si le joueur a gagné
     */
    trackAIVictory(isPlayerWinner) {
        // Sécurité: attendre que snake.js soit chargé
        if (!window.load || !window.save || !window.checkTrophy) return;

        // ✅ Réinitialiser les trophées de session
        window.sessionTrophies = [];

        let career = window.load('career', {});

        // Initialiser les variables IA si besoin
        if (typeof career.aiWins === 'undefined') career.aiWins = 0;
        if (typeof career.aiGames === 'undefined') career.aiGames = 0;
        if (typeof career.aiApples === 'undefined') career.aiApples = 0;
        if (typeof career.ghostThiefAchieved === 'undefined') career.ghostThiefAchieved = 0;
        if (typeof career.aiMaxSegments === 'undefined') career.aiMaxSegments = 0;
        if (typeof career.aiPowerups === 'undefined') career.aiPowerups = 0;
        if (typeof career.aiWinStreak === 'undefined') career.aiWinStreak = 0;
        if (typeof career.ecrasantAchieved === 'undefined') career.ecrasantAchieved = 0;

        // ✅ Incrémenter compteur parties IA (toujours)
        career.aiGames++;

        // ✅ Compter les pommes mangées vs IA (séparé des pommes solo)
        const playerSegments = this.playerSnake ? this.playerSnake.length : 0;
        const aiSegments = this.aiSnake ? this.aiSnake.length : 0;
        const applesEaten = Math.max(0, playerSegments - 3); // 3 = taille initiale
        career.aiApples += applesEaten;

        // 🦕 GÉANT: Max segments atteints vs IA
        if (playerSegments > career.aiMaxSegments) {
            career.aiMaxSegments = playerSegments;
        }

        // 💎 COLLECTIONNEUR: Power-ups collectés vs IA
        career.aiPowerups += this.playerPowerupsCollectedThisGame || 0;

        // ✅ Incrémenter victoires si le joueur gagne
        if (isPlayerWinner) {
            career.aiWins++;
            career.aiWinStreak++;

            // 💪 ÉCRASANT: Gagner avec 20+ segments d'avance
            const segmentAdvantage = playerSegments - aiSegments;
            if (segmentAdvantage >= 20) {
                career.ecrasantAchieved++;
                logger.log(`[AIGame] 🏆 ÉCRASANT débloqué! (${segmentAdvantage} segments d'avance)`);
            }
        } else {
            // Défaite = reset streak
            career.aiWinStreak = 0;
        }

        // 🏆 VOLEUR: A volé 10+ segments en une partie avec GHOST
        if (this.playerSegmentsStolenThisGame >= 10) {
            career.ghostThiefAchieved++;
            logger.log(`[AIGame] 🏆 VOLEUR débloqué! (${this.playerSegmentsStolenThisGame} segments volés)`);
        }

        // 🌙 NOCTURNE: Jouer entre 20h et 8h du matin
        const currentHour = new Date().getHours();
        if (currentHour >= 20 || currentHour < 8) {
            if (typeof career.nightOwlGames === 'undefined') career.nightOwlGames = 0;
            career.nightOwlGames++;
        }

        // ✅ SYNC: Mettre à jour window.career pour que TROPHIES.check() voit les changements
        if (window.career) {
            Object.assign(window.career, career);
        }

        // Sauvegarder et vérifier les trophées
        window.save('career', career);
        window.checkTrophy();
    }
}

// Exposer globalement
window.AISnakeGame = AISnakeGame;

// Instance globale
window.aiGame = null;

// Fonction de démarrage
window.startAIGame = function(difficulty = 0) {
    logger.log('[AIGame] Démarrage...');

    if (window.aiGame) {
        window.aiGame.stop();
    }

    window.aiGame = new AISnakeGame();
    window.aiGame.start(difficulty);

    if (window.screenManager) {
        window.screenManager.show('game-ai');
    }
};

// Fonction rejouer (appelée depuis écran Game Over)
window.replayAIGame = function() {
    logger.log('[AIGame] Rejouer...');
    window.startAIGame(0);
};

// Fonction retour au hub (appelée depuis écran Game Over)
window.returnToHubFromAI = function() {
    logger.log('[AIGame] Retour au hub...');

    if (window.aiGame) {
        window.aiGame.stop();
        window.aiGame = null;
    }

    if (window.screenManager) {
        window.screenManager.show('hub');
    }

    // Rafraîchir le hub
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }
};

logger.log('[AIGame] Module chargé');
