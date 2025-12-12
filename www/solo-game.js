/**
 * SoloSnakeGame - Version Refactorisée
 *
 * Ce fichier est passé de ~4000 lignes à ~800 lignes grâce à la modularisation.
 *
 * Architecture:
 * - BossFightSystem.js : Combat de boss (phases, épée, IA)
 * - BossRenderer.js : Rendu visuel du boss
 * - SpawnSystem.js : Génération des éléments (nourriture, obstacles)
 * - PowerUpSystem.js : Gestion des power-ups
 * - RoguelikeSystem.js : Mode roguelike (niveaux, upgrades)
 * - GoldSystem.js : Système Fortune (gold)
 */

import { logger } from './services/logger.js';
import { BaseSnakeGame } from './core/BaseSnakeGame.js';
import { drawSnakeEnhanced, getDirectionString } from './SkinsRenderer.js';
import { achievementManager } from './roguelike/achievements.js';

// Import des systèmes modulaires
import { BossFightSystem } from './systems/BossFightSystem.js';
import { BossRenderer } from './renderers/BossRenderer.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { PowerUpSystem } from './systems/PowerUpSystem.js';
import { RoguelikeSystem } from './systems/RoguelikeSystem.js';
import { GoldSystem } from './systems/GoldSystem.js';

class SoloSnakeGame extends BaseSnakeGame {
    constructor() {
        super('canvas-solo');

        // État du serpent
        this.snake = [];
        this.dx = 0;
        this.dy = 0;
        this.ndx = 0;
        this.ndy = 0;

        // Éléments du jeu
        this.food = null;
        this.bad = null;
        this.powerup = null;
        this.obstacles = [];

        // Scores et stats
        this.score = 0;
        this.foodCount = 0;
        this.combo = 1;
        this.maxCombo = 1;

        // Contrôle du jeu
        this.locked = false;

        // Stats de partie
        this.wallsDestroyed = 0;
        this.skullsEaten = 0;
        this.maxSnakeLength = 1;

        // Tracking pour achievements
        this.firstDirectionChangeTime = null;
        this.hasTeleported = false;

        // Mode Boss Rush
        this.isBossRushMode = false;
        this.bossRushStageConfig = null;

        // ========== SYSTÈMES MODULAIRES ==========
        this.spawnSystem = new SpawnSystem(this);
        this.powerUpSystem = new PowerUpSystem(this);
        this.bossSystem = new BossFightSystem(this);
        this.bossRenderer = new BossRenderer(this.ctx, this.CELL_SIZE, this.GRID_SIZE);
        this.roguelikeSystem = new RoguelikeSystem(this);
        this.goldSystem = new GoldSystem(this);

        // Aliases pour compatibilité (accès depuis les systèmes)
        this.powerupEffects = this.powerUpSystem.effects;
    }

    // ============================================
    // DÉMARRAGE & INITIALISATION
    // ============================================

    start(difficulty = 0) {
        super.start(difficulty);
    }

    /**
     * Démarre un niveau roguelike
     */
    startRoguelikeLevel(levelData, modifiers) {
        this.cleanupResidualOverlays();
        this.roguelikeSystem.startLevel(levelData, modifiers);
    }

    /**
     * Démarre un combat Boss Rush
     */
    startBossRushBattle(stageConfig) {
        logger.log(`[SoloGame] Démarrage Boss Rush Stage ${stageConfig.stage}`);

        this.cleanupResidualOverlays();
        this.reset();

        this.isBossRushMode = true;
        this.bossRushStageConfig = stageConfig;
        this.roguelikeSystem.isActive = true;

        // Config du niveau
        const playerSpeedByStage = { 1: 1.3, 2: 1.2, 3: 1.1, 4: 1.0 };

        this.roguelikeSystem.levelData = {
            level: stageConfig.stage,
            name: stageConfig.name,
            biome: stageConfig.visualTheme || 'boss-rush',
            bossSpeed: stageConfig.bossSpeed || 1.0,
            bossAggression: stageConfig.bossAggression || 0.5,
            bossMoveInterval: stageConfig.bossMoveInterval || 250,
            bossGraceDelay: stageConfig.bossGraceDelay || 2,
            bossPhases: stageConfig.bossPhases || null,
            modifiers: { speedMultiplier: playerSpeedByStage[stageConfig.stage] || 1.0 }
        };

        this.roguelikeSystem.objective = {
            type: 'boss',
            bossSegments: stageConfig.bossSegments,
            timeLimit: stageConfig.timeLimit
        };

        // Positionner le serpent
        const startX = Math.floor(this.GRID_SIZE / 2);
        const startY = this.GRID_SIZE - 5;
        this.snake = [{ x: startX, y: startY }];
        this.dx = 0;
        this.dy = -1;
        this.ndx = 0;
        this.ndy = -1;

        const startSize = stageConfig.playerStartSize || 10;
        for (let i = 1; i < startSize; i++) {
            this.snake.push({ x: startX, y: startY + i });
        }

        this.running = true;
        this.paused = true;
        this.lastTime = performance.now();

        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(this.loop.bind(this));

        this.bossSystem.startBossFight(this.roguelikeSystem.objective, this.roguelikeSystem.levelData);
    }

    // ============================================
    // RESET
    // ============================================

    reset() {
        // Serpent au centre
        this.snake = [
            { x: 15, y: 15 },
            { x: 14, y: 15 },
            { x: 13, y: 15 }
        ];
        this.dx = 1;
        this.dy = 0;
        this.ndx = 1;
        this.ndy = 0;

        // Flags
        this.gameOverTriggered = false;
        this.isExploding = false;
        this.isFlashing = false;
        this.locked = false;

        // Stats
        this.score = 0;
        this.level = 1;
        this.foodCount = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.wallsDestroyed = 0;
        this.skullsEaten = 0;
        this.maxSnakeLength = 1;

        // Éléments
        this.obstacles = [];
        this.powerup = null;

        // Tracking
        this.firstDirectionChangeTime = null;
        this.hasTeleported = false;

        // Boss Rush
        this.isBossRushMode = false;
        this.bossRushStageConfig = null;

        // Reset systèmes
        this.bossSystem.cleanup();
        this.powerUpSystem.reset();
        this.roguelikeSystem.cleanup();
        this.goldSystem.reset();

        // Sync alias
        this.powerupEffects = this.powerUpSystem.effects;

        // Spawn initial
        this.spawnSystem.spawnFood();
        this.spawnSystem.spawnBad();

        this.updateUI();
    }

    // ============================================
    // BOUCLE PRINCIPALE
    // ============================================

    loop(timestamp) {
        if (!this.running) return;

        if (this.paused) {
            this.draw();
            this.raf = requestAnimationFrame((t) => this.loop(t));
            return;
        }

        // Calculer vitesse
        let speed = this.calculateSpeed();
        if (this.powerUpSystem.isSlowActive) speed *= 1.5;

        // Update si temps écoulé
        if (timestamp - this.lastTime > speed) {
            this.lastTime = timestamp;
            this.update();
        }

        // Update boss
        if (this.bossSystem.isActive) {
            this.bossSystem.update(timestamp);
        }

        // Update power-ups
        this.powerUpSystem.update();

        // Update particules
        this.updateParticles();

        // Dessiner
        this.draw();

        this.raf = requestAnimationFrame((t) => this.loop(t));
    }

    calculateSpeed() {
        // Mode Roguelike : vitesse fixe 100ms (10 mouvements/sec)
        if (this.roguelikeSystem.isActive) {
            let speed = 100;

            // Boost universel (priorité sur sprint)
            if (this.powerUpSystem.boostActive) {
                speed = speed / this.powerUpSystem.boostSpeedMultiplier;
            }
            // Sprint (ability roguelike)
            else if (this.powerUpSystem.sprintActive) {
                speed = speed / this.powerUpSystem.sprintSpeedBoost;
            }

            // Ralentissement par zone de glace (Boss CRYO)
            const iceSlowFactor = this.bossSystem.getIceSlowFactor();
            if (iceSlowFactor < 1) {
                speed = speed / iceSlowFactor;  // vitesse réduite = interval plus long
            }

            return speed;
        }

        // Mode classique : progression par niveau
        const baseSpeed = this.difficulty === 0 ? 2.5 : this.difficulty === 1 ? 5 : 8;
        let speed = 1000 / (baseSpeed + (this.level - 1) * 0.5);

        // Boost universel (priorité sur sprint)
        if (this.powerUpSystem.boostActive) {
            speed = speed / this.powerUpSystem.boostSpeedMultiplier;
        }
        // Sprint
        else if (this.powerUpSystem.sprintActive) {
            speed = speed / this.powerUpSystem.sprintSpeedBoost;
        }

        return speed;
    }

    // ============================================
    // UPDATE (LOGIQUE)
    // ============================================

    update() {
        this.dx = this.ndx;
        this.dy = this.ndy;
        this.locked = false;

        // Nouvelle position
        let head = {
            x: this.snake[0].x + this.dx,
            y: this.snake[0].y + this.dy
        };

        // Wrapping
        let didTeleport = false;
        if (head.x < 0) { head.x = this.GRID_SIZE - 1; didTeleport = true; }
        if (head.x >= this.GRID_SIZE) { head.x = 0; didTeleport = true; }
        if (head.y < 0) { head.y = this.GRID_SIZE - 1; didTeleport = true; }
        if (head.y >= this.GRID_SIZE) { head.y = 0; didTeleport = true; }

        if (didTeleport && !this.hasTeleported) {
            this.hasTeleported = true;
        }

        // Collisions nourriture
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood(head);
            return;
        }

        // Collision crâne
        if (head.x === this.bad.x && head.y === this.bad.y) {
            this.eatSkull(head);
            return;
        }

        // Collision Mystery Box
        if (this.powerUpSystem.checkMysteryBoxCollision(head)) {
            this.powerUpSystem.collectMysteryBox();
            // Pas de return - le serpent continue de bouger normalement
        }

        // Collision gold
        if (this.goldSystem.items.length > 0) {
            this.goldSystem.checkCollection(head);
        }

        // Déplacement
        this.snake.unshift(head);
        this.snake.pop();

        // Collision avec soi-même
        if (this.snake.slice(1).some(s => s.x === head.x && s.y === head.y)) {
            // Vérifier immunité auto-collision (skin cyber/glitch/spectral)
            const run = this.roguelikeSystem.isActive ? window.roguelikeManager?.currentRun : null;
            const selfCollisionImmune = run?.selfCollisionImmune || false;

            if (!this.powerUpSystem.isInvincibleActive && !selfCollisionImmune) {
                if (this.audio) this.audio.die();
                this.gameOver();
                return;
            }
        }

        // Collision obstacles (ignore les obstacles en preview - skin Scanner)
        const now = Date.now();
        const collidedObs = this.obstacles.find(o =>
            o.x === head.x && o.y === head.y && (!o.previewUntil || now >= o.previewUntil)
        );

        if (collidedObs) {
            if (this.powerUpSystem.isGhostActive) {
                // Traverse
            } else if (this.powerUpSystem.isInvincibleActive) {
                // Détruit le mur
                const obsIndex = this.obstacles.indexOf(collidedObs);
                if (obsIndex !== -1) {
                    if (this.audio) this.audio.breakWall();
                    this.createBreakEffect(this.obstacles[obsIndex].x, this.obstacles[obsIndex].y);
                    this.obstacles.splice(obsIndex, 1);
                    this.score += 5;
                    this.wallsDestroyed++;
                    this.updateUI();
                }
            } else {
                if (this.audio) this.audio.obstacle();
                this.gameOver();
                return;
            }
        }

        // Collisions boss
        if (this.bossSystem.isActive) {
            this.bossSystem.checkCollisions();
        }
    }

    // ============================================
    // COLLECTES
    // ============================================

    eatFood(head) {
        let diffMultiplier = this.difficulty === 0 ? 1 : this.difficulty === 1 ? 1.5 : 2;
        let roguelikeMultiplier = this.roguelikeSystem.isActive ? this.roguelikeSystem.scoreMultiplier : 1;
        let baseAppleScore = 10 * (this.roguelikeSystem.isActive ? this.roguelikeSystem.appleScoreMultiplier : 1);

        let points = Math.floor(baseAppleScore * this.combo * (this.powerUpSystem.isDoubleActive ? 2 : 1) * diffMultiplier * roguelikeMultiplier);

        // Pomme dorée (Fortune)
        if (this.roguelikeSystem.isActive && this.roguelikeSystem.modifiers?.passives) {
            const goldenUpgrade = this.roguelikeSystem.modifiers.passives.find(p => p.type === 'golden_apple');
            if (goldenUpgrade && Math.random() < goldenUpgrade.chance) {
                points += goldenUpgrade.value * 10;
                this.createParticles(head.x, head.y, '#ffd700', 10);
            }
        }

        this.score += points;
        this.foodCount++;
        if (this.audio) this.audio.eat();

        // Achievements
        if (this.roguelikeSystem.isActive) {
            achievementManager.onAppleEaten();
            achievementManager.onScoreUpdate(this.score);
            achievementManager.onSegmentsUpdate(this.snake.length);
            // Passer les points calculés (avec combo) pour le score roguelike
            this.roguelikeSystem.onAppleEaten(points);
        }

        // Bonus épée pendant combat de boss
        if (this.bossSystem.isActive) {
            this.bossSystem.onAppleEaten();
        }

        // Niveau (mode classique)
        if (!this.roguelikeSystem.isActive && this.foodCount % 5 === 0) {
            this.level++;
            if (this.audio) this.audio.lvlup();
            this.spawnSystem.spawnObstacles();
        }

        // Grandir
        this.snake.unshift(head);
        this.syncCombo();

        if (this.snake.length > this.maxSnakeLength) {
            this.maxSnakeLength = this.snake.length;
        }

        // Respawn
        this.spawnSystem.spawnFood();
        this.spawnSystem.spawnBad();
        this.spawnSystem.spawnPowerup();
        this.goldSystem.trySpawn();

        this.updateUI();
    }

    eatSkull(head) {
        this.skullsEaten++;

        // Vérifier immunité aux crânes (skin toxic)
        const run = this.roguelikeSystem.isActive ? window.roguelikeManager?.currentRun : null;
        const skullImmunity = run?.skullImmunity || false;

        if (skullImmunity) {
            // Immunité : juste respawn le crâne, pas de dégâts
            if (this.audio) this.audio.powerup(); // Son positif
            this.createParticles(head.x, head.y, '#39FF14', 8); // Particules vertes
            this.snake.unshift(head);
            this.snake.pop();
        } else {
            // Comportement normal : perd la moitié des segments
            if (this.audio) this.audio.bad();
            this.snake.unshift(head);

            const targetLength = Math.max(3, Math.floor(this.snake.length / 2));
            const segmentsToRemove = this.snake.length - targetLength;

            for (let i = 0; i < segmentsToRemove; i++) {
                this.snake.pop();
            }

            this.syncCombo();
            this.createParticles(head.x, head.y, '#ff4444', 8);
        }

        this.spawnSystem.spawnFood();
        this.spawnSystem.spawnBad();
        this.spawnSystem.spawnPowerup();

        this.updateUI();
    }

    eatPowerup(head) {
        this.powerUpSystem.activate(this.powerup.t);
        this.powerup = null;
        this.powerupEffects = this.powerUpSystem.effects;

        this.snake.unshift(head);
        this.snake.pop();
        this.updateUI();
    }

    // ============================================
    // COMBO
    // ============================================

    syncCombo() {
        const oldCombo = this.combo;
        this.combo = Math.max(1, this.snake.length - 2);

        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
            achievementManager.onComboUpdate(this.combo);
        }
    }

    // ============================================
    // CONTRÔLES
    // ============================================

    changeDirection(newDx, newDy) {
        if (this.locked) return;
        if (newDx === -this.dx && newDy === -this.dy) return;

        // Sprint double-tap
        if (this.powerUpSystem.checkDoubleTapSprint(newDx, newDy)) {
            return;
        }

        // Tracking premier changement
        if (this.firstDirectionChangeTime === null) {
            this.firstDirectionChangeTime = Date.now();
        }

        // Lightning inverse les contrôles
        if (this.powerUpSystem.isLightningActive) {
            newDx = -newDx;
            newDy = -newDy;
        }

        this.ndx = newDx;
        this.ndy = newDy;
        this.locked = true;
    }

    // ============================================
    // RENDU
    // ============================================

    draw() {
        // Effacer
        this.ctx.fillStyle = this.COLORS.BG_DARK;
        this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

        // Grille
        const isDarkMode = document.body.classList.contains('dark-mode');
        const borderColor = isDarkMode ? '#00A5A5' : '#d8d800ff';
        RenderUtils.drawGrid(this.ctx, this.GRID_SIZE, this.CELL_SIZE, this.CANVAS_SIZE, { grid: '#404060', border: borderColor });

        // Nourriture
        if (this.food) RenderUtils.drawStar(this.ctx, this.food.x, this.food.y, this.CELL_SIZE);

        // Crâne
        if (this.bad) RenderUtils.drawSkull(this.ctx, this.bad.x, this.bad.y, this.CELL_SIZE);

        // Mystery Box
        const mysteryBox = this.powerUpSystem.mysteryBox;
        if (mysteryBox) RenderUtils.drawMysteryBox(this.ctx, mysteryBox.x, mysteryBox.y, this.CELL_SIZE);

        // Gold
        this.goldSystem.draw();

        // Obstacles
        const now = Date.now();
        for (let obs of this.obstacles) {
            // Vérifier si l'obstacle est en preview (skin Scanner)
            if (obs.previewUntil && now < obs.previewUntil) {
                // Dessiner en clignotant rouge semi-transparent
                const flash = Math.floor(now / 200) % 2 === 0;
                if (flash) {
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.fillStyle = '#FF0000';
                    const x = obs.x * this.CELL_SIZE;
                    const y = obs.y * this.CELL_SIZE;
                    this.ctx.fillRect(x + 2, y + 2, this.CELL_SIZE - 4, this.CELL_SIZE - 4);
                    this.ctx.globalAlpha = 1;
                }
            } else {
                RenderUtils.drawWall(this.ctx, obs.x, obs.y, this.CELL_SIZE);
            }
        }

        // Boss
        if (this.bossSystem.isActive) {
            // Nouveaux effets de boss
            this.bossRenderer.drawIceZones(this.bossSystem.boss?.iceZones);
            this.bossRenderer.drawSkulls(this.bossSystem.boss?.skulls);
            this.bossRenderer.drawTeleportPortals(this.bossSystem.boss?.teleportPortals);

            // Boss et épée
            this.bossRenderer.drawBoss(this.bossSystem.boss);
            this.bossRenderer.drawSword(this.bossSystem.sword);
        }

        // Serpent
        if (!this.isExploding) {
            let skinColors = this.powerUpSystem.getSkinColors();

            if (this.isFlashing) {
                const shouldBeRed = Math.floor(Date.now() / 80) % 2 === 0;
                if (shouldBeRed) {
                    skinColors = {
                        head: { light: '#FF0000', dark: '#CC0000' },
                        body: { from: '#FF0000', to: '#990000' },
                        tail: { color: '#990000' },
                        outline: '#660000',
                        glow: '#FF0000'
                    };
                }
            }

            if (this.powerUpSystem.isSprintActive) {
                this.drawSprintAura();
            }

            drawSnakeEnhanced(this.ctx, this.snake, getDirectionString(this.dx, this.dy), this.CELL_SIZE, skinColors);
        }

        // Particules
        this.drawParticles();

        // Pause (ne pas afficher pendant les cinématiques de boss)
        if (this.paused && !this.cinematicPlaying) {
            this.ctx.save();
            this.ctx.font = 'bold 120px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const pauseColor = isDarkMode ? '#FFFFFF' : '#000000';
            this.ctx.shadowColor = isDarkMode ? '#000000' : '#FFFFFF';
            this.ctx.shadowBlur = 30;
            this.ctx.fillStyle = pauseColor;
            this.ctx.fillText('⏸️', this.CANVAS_SIZE / 2, this.CANVAS_SIZE / 2);
            this.ctx.restore();
        }
    }

    drawSprintAura() {
        // ... (code existant pour l'aura de sprint)
        this.ctx.save();
        const time = Date.now() / 100;
        const pulseAlpha = 0.3 + Math.sin(time) * 0.15;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20 + Math.sin(time) * 10;
        this.ctx.globalAlpha = pulseAlpha;
        this.ctx.fillStyle = '#00ffff';

        this.snake.forEach((segment, index) => {
            const x = segment.x * this.CELL_SIZE;
            const y = segment.y * this.CELL_SIZE;
            const pulseSize = 4 + Math.sin(time * 2) * 2;
            const size = this.CELL_SIZE + pulseSize;
            const offset = (size - this.CELL_SIZE) / 2;

            if (index === 0) {
                this.ctx.beginPath();
                this.ctx.arc(x + this.CELL_SIZE / 2, y + this.CELL_SIZE / 2, size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.beginPath();
                this.ctx.roundRect(x - offset, y - offset, size, size, 4);
                this.ctx.fill();
            }
        });

        this.ctx.restore();
    }

    createBreakEffect(x, y) {
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
                color: this.COLORS.ACCENT_WARM
            });
        }
    }

    // ============================================
    // UI
    // ============================================

    updateUI() {
        const sc = document.getElementById('solo-sc');
        if (sc) {
            if (this.roguelikeSystem.isActive && window.roguelikeManager?.currentRun) {
                // Mode Roguelike : formule XP identique à RoguelikeManager.endRun()
                const run = window.roguelikeManager.currentRun;
                const xpMultiplier = run.modifiers?.xpMultiplier || 1;
                // Utiliser run.score (score roguelike) et run.applesEaten, pas this.score
                const baseXP = run.score + (run.level * 50) + (run.applesEaten * 2);
                sc.textContent = Math.floor(baseXP * xpMultiplier);
            } else {
                // Mode Solo classique : afficher XP gagné (score / 5)
                sc.textContent = Math.floor(this.score / 5);
            }
        }

        const lv = document.getElementById('solo-lv');
        if (lv) {
            lv.textContent = this.roguelikeSystem.isActive && this.roguelikeSystem.levelData
                ? this.roguelikeSystem.levelData.level
                : this.level;
        }

        const seg = document.getElementById('solo-seg');
        if (seg) {
            seg.textContent = this.roguelikeSystem.isActive ? this.combo : Math.max(0, this.snake.length - 3);
        }

        // Update HUD roguelike
        this.roguelikeSystem.updateObjectiveUI();
        this.roguelikeSystem.updateHUD();
    }

    // ============================================
    // GAME OVER
    // ============================================

    gameOver() {
        if (this.gameOverTriggered) return;
        this.gameOverTriggered = true;

        this.triggerDeathEffects();

        setTimeout(() => {
            this._finalizeGameOver();
        }, 1400);
    }

    _finalizeGameOver() {
        this.running = false;

        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }

        const gameDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(gameDuration / 60);
        const seconds = gameDuration % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        let patienceWaitTime = 0;
        if (this.firstDirectionChangeTime === null) {
            patienceWaitTime = Date.now() - this.gameStartTime;
        } else {
            patienceWaitTime = this.firstDirectionChangeTime - this.gameStartTime;
        }

        // Mode Boss Rush
        if (this.isBossRushMode) {
            logger.log('[SoloGame] Game Over en mode Boss Rush');
            this.running = false;
            this.paused = true;
            this.bossSystem.cleanup();
            if (window.bossRushManager) {
                window.bossRushManager.onPlayerDeath();
            }
            return;
        }

        // Mode roguelike
        if (this.roguelikeSystem.isActive) {
            const result = window.roguelikeManager?.onPlayerDeath();

            if (result?.continueRun) {
                this.gameOverTriggered = false;
                this.isExploding = false;
                this.isFlashing = false;
                this.running = true;

                if (result.shieldUsed) {
                    for (let i = 0; i < result.segmentsLost && this.snake.length > 3; i++) {
                        this.snake.pop();
                    }
                    this.createParticles(this.snake[0].x, this.snake[0].y, '#2196f3', 15);
                    const head = this.snake[0];
                    head.x = head.x - this.dx;
                    head.y = head.y - this.dy;
                    if (head.x < 0) head.x = this.GRID_SIZE - 1;
                    if (head.x >= this.GRID_SIZE) head.x = 0;
                    if (head.y < 0) head.y = this.GRID_SIZE - 1;
                    if (head.y >= this.GRID_SIZE) head.y = 0;
                } else {
                    this.snake = [{ x: 15, y: 15 }, { x: 14, y: 15 }, { x: 13, y: 15 }];
                    this.dx = 1;
                    this.dy = 0;
                    this.ndx = 1;
                    this.ndy = 0;
                    this.createParticles(15, 15, '#f44336', 15);
                }

                this.syncCombo();
                this.updateUI();
                this.loop(performance.now());
                return;
            }

            this.roguelikeSystem.exit();
            return;
        }

        // Mode classique
        if (typeof window.handleSoloGameOver === 'function') {
            const powerUpStats = this.powerUpSystem.getStats();
            window.handleSoloGameOver({
                score: this.score,
                level: this.level,
                combo: this.maxCombo,
                foodCount: this.foodCount,
                ...powerUpStats,
                difficulty: this.difficulty,
                timeString: timeString,
                wallsDestroyed: this.wallsDestroyed,
                skullsEaten: this.skullsEaten,
                maxSnakeLength: this.maxSnakeLength,
                patienceWaitTime: patienceWaitTime,
                hasTeleported: this.hasTeleported
            });
        }
    }

    // ============================================
    // COMPLETION ROGUELIKE
    // ============================================

    completeRoguelikeLevel() {
        this.roguelikeSystem.completeLevel();
    }

    // ============================================
    // CLEANUP
    // ============================================

    cleanupAllTimers() {
        logger.log('[SoloGame] cleanupAllTimers()');

        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }

        this.bossSystem.cleanup();
        this.roguelikeSystem.cleanup();
        this.powerUpSystem.reset();
        this.particles = [];
        this.running = false;
        this.paused = false;
    }

    cleanupResidualOverlays() {
        const overlays = [
            '.skin-unlock-overlay',
            '.skin-unlock-notification',
            '.confetti-overlay',
            '.achievement-notification'
        ];

        overlays.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
        });
    }

    exitRoguelikeMode() {
        this.roguelikeSystem.exit();
    }

    // ============================================
    // GETTERS COMPATIBILITÉ
    // ============================================

    get isRoguelikeMode() { return this.roguelikeSystem.isActive; }
    set isRoguelikeMode(val) { this.roguelikeSystem.isActive = val; }

    get roguelikeLevelData() { return this.roguelikeSystem.levelData; }
    set roguelikeLevelData(val) { this.roguelikeSystem.levelData = val; }

    get roguelikeModifiers() { return this.roguelikeSystem.modifiers; }
    set roguelikeModifiers(val) { this.roguelikeSystem.modifiers = val; }

    get roguelikeObjective() { return this.roguelikeSystem.objective; }
    set roguelikeObjective(val) { this.roguelikeSystem.objective = val; }

    get roguelikeProgress() { return this.roguelikeSystem.progress; }
    set roguelikeProgress(val) { this.roguelikeSystem.progress = val; }

    get isBossFight() { return this.bossSystem.isActive; }
    get boss() { return this.bossSystem.boss; }
    get swordActive() { return this.bossSystem.swordActive; }
    get sword() { return this.bossSystem.sword; }
    get goldItems() { return this.goldSystem.items; }
    set goldItems(val) { this.goldSystem.items = val; }
    get goldCollected() { return this.goldSystem.collected; }
    set goldCollected(val) { this.goldSystem.collected = val; }
}

// Export
window.SoloSnakeGame = SoloSnakeGame;
