/**
 * BossFightSystem.js - Gestion des combats de boss
 * Extrait de solo-game.js pour modularité
 *
 * Responsabilités:
 * - Initialisation et phases du boss
 * - IA et mouvements du boss
 * - Système d'épée (joueur et boss)
 * - Comportements spéciaux (poison, charge, téléport, clone)
 * - Collisions boss/joueur
 * - Timer et conditions de victoire/défaite
 */

import { logger } from '../services/logger.js';
import { achievementManager } from '../roguelike/achievements.js';
// Imports SkinsRenderer retirés - cinématiques supprimées pour performance

// Couleurs des skins pour chaque boss (basé sur items.js)
const BOSS_SKIN_COLORS = {
    TITAN: {
        head: { light: '#CD853F', dark: '#8B4513' },
        body: { from: '#CD853F', to: '#5C3317' },
        tail: { color: '#3D2314' },
        outline: '#2D1810',
        glow: '#8B4513'
    },
    CRYO: {
        head: { light: '#B0E0FF', dark: '#4DB8FF' },
        body: { from: '#B0E0FF', to: '#1E90FF' },
        tail: { color: '#1E90FF' },
        outline: '#003D66',
        glow: '#00FFFF'
    },
    SPECTRE: {
        head: { light: '#F0F0F0', dark: '#C0C0C0' },
        body: { from: '#E0E0E0', to: '#808080' },
        tail: { color: '#606060' },
        outline: '#404040',
        glow: '#FFFFFF'
    },
    FOUDRE: {
        head: { light: '#FFFF00', dark: '#FFD700' },
        body: { from: '#FFFF00', to: '#FF8C00' },
        tail: { color: '#FF8C00' },
        outline: '#664400',
        glow: '#FFFF00'
    }
};

export class BossFightSystem {
    constructor(game) {
        this.game = game;  // Référence au jeu principal

        // État du boss
        this.isBossFight = false;
        this.boss = null;
        this.bossTimer = 0;
        this.bossTimerInterval = null;
        this.bossDefeated = false;

        // Système d'épée
        this.sword = null;
        this.swordActive = false;
        this.swordDuration = 5;
        this.swordTimer = 0;
        this.swordSpawnInterval = null;

        // Période de grâce après vol de segments (évite double collision)
        this.stealGracePeriod = 0;

        // Compteur de pommes mangées pendant le combat (pour bonus épée)
        this.applesEatenDuringBoss = 0;

        // Stats pour achievements
        this.bossStartPlayerSegments = 0;
    }

    // ============================================
    // DÉMARRAGE DU COMBAT
    // ============================================

    startBossFight(objective, levelData) {
        if (!objective || objective.type !== 'boss') return;

        this.game.paused = true;
        this.showBossIntro(levelData, objective);
    }

    showBossIntro(levelData, objective) {
        const isFirstBoss = this.game.isBossRushMode
            ? (levelData.level === 1)
            : (levelData.level === 5);

        // Config par boss (background + couleur flash)
        const bossConfig = {
            TITAN: { bg: 'roche_background.webp', flash: '#8B4513', emoji: '🏔️' },
            CRYO: { bg: 'glace_background.webp', flash: '#00BFFF', emoji: '❄️' },
            SPECTRE: { bg: 'ghost_background.webp', flash: '#9932CC', emoji: '👻' },
            FOUDRE: { bg: 'foudre_background.webp', flash: '#FFD700', emoji: '⚡' }
        };
        const bossName = levelData.name?.toUpperCase() || 'TITAN';
        const config = bossConfig[bossName] || bossConfig.TITAN;

        let introScreen = document.getElementById('boss-intro-screen');
        if (!introScreen) {
            introScreen = document.createElement('div');
            introScreen.id = 'boss-intro-screen';
            introScreen.className = 'boss-intro-screen';
            document.body.appendChild(introScreen);
        }

        // Appliquer le background spécifique au boss
        introScreen.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url('./assets/backgrounds/${config.bg}')`;
        introScreen.style.backgroundSize = 'cover';
        introScreen.style.backgroundPosition = 'center';

        const mins = Math.floor((objective.timeLimit || 120) / 60);
        const secs = (objective.timeLimit || 120) % 60;
        const timerStr = secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}:00`;

        let tutorialHTML = '';
        if (isFirstBoss) {
            tutorialHTML = `
                <div class="boss-intro-tutorial">
                    <div class="boss-intro-tutorial-title">Comment vaincre</div>
                    <div class="boss-intro-tutorial-item">
                        <span class="boss-intro-tutorial-icon">⚔️</span>
                        <span>Ramasse l'ÉPÉE pour attaquer</span>
                    </div>
                    <div class="boss-intro-tutorial-item">
                        <span class="boss-intro-tutorial-icon">🎯</span>
                        <span>Avec l'épée, touche-le = vole 5 segments</span>
                    </div>
                    <div class="boss-intro-tutorial-item">
                        <span class="boss-intro-tutorial-icon">⚠️</span>
                        <span>Sans épée, FUIS le boss !</span>
                    </div>
                </div>
            `;
        }

        // Écran VS Triple AAA
        introScreen.innerHTML = `
            <div class="boss-vs-container">
                <div class="boss-vs-player">
                    <div class="boss-vs-icon">🐍</div>
                    <div class="boss-vs-label">TOI</div>
                </div>
                <div class="boss-vs-center">
                    <div class="boss-vs-text">VS</div>
                </div>
                <div class="boss-vs-boss">
                    <div class="boss-vs-icon">${config.emoji}</div>
                    <div class="boss-vs-label">${levelData.name}</div>
                </div>
            </div>
            <div class="boss-intro-stats">
                <div class="boss-intro-stat">
                    <div class="boss-intro-stat-icon">❤️</div>
                    <div class="boss-intro-stat-value">${objective.bossSegments || 15}</div>
                    <div class="boss-intro-stat-label">Segments</div>
                </div>
                <div class="boss-intro-stat">
                    <div class="boss-intro-stat-icon">⏱️</div>
                    <div class="boss-intro-stat-value">${timerStr}</div>
                    <div class="boss-intro-stat-label">Timer</div>
                </div>
            </div>
            ${tutorialHTML}
            <button class="boss-intro-btn" id="boss-intro-start">⚔️ COMBATTRE</button>
        `;

        introScreen.classList.remove('hidden');

        // Stocker la config pour le flash
        this._currentBossConfig = config;

        document.getElementById('boss-intro-start').addEventListener('click', () => {
            this.hideBossIntro();
            // Flash couleur simple puis combat
            this.startBossWithFlash(levelData, objective);
        });

        logger.log(`[BossFight] Écran VS affiché: ${levelData.name}`);
    }

    hideBossIntro() {
        const introScreen = document.getElementById('boss-intro-screen');
        if (introScreen) {
            introScreen.classList.add('hidden');
        }
    }

    startBossFightAfterIntro(objective, levelData) {
        const bossSegments = objective.bossSegments || 15;

        logger.log(`[BossFight] Démarrage combat de boss!`);

        this.isBossFight = true;
        this.bossDefeated = false;
        this.game.paused = false;
        this.bossStartPlayerSegments = this.game.snake.length;
        this.applesEatenDuringBoss = 0; // Reset compteur pommes

        // Position du boss : coin opposé au joueur
        const bossStartX = this.game.GRID_SIZE - 3;
        const bossStartY = 3;

        this.boss = {
            snake: [],
            dx: -1,
            dy: 0,
            ndx: -1,
            ndy: 0,
            name: levelData.name || 'TITAN', // Nom du boss pour le skin
            speed: levelData.bossSpeed || 1.0,
            aggression: levelData.bossAggression || 0.5,
            lastMoveTime: 0,
            moveInterval: levelData.bossMoveInterval || 200,
            graceDelay: levelData.bossGraceDelay || 2,
            graceTimer: 0,
            isInGrace: true,
            hasSword: false,
            // Système de phases
            phases: levelData.bossPhases || null,
            currentPhase: 0,
            maxSegments: bossSegments,
            phaseName: levelData.bossPhases?.[0]?.name || levelData.name,
            phaseColor: levelData.bossPhases?.[0]?.color || '#ff0000',
            // États spéciaux
            specialTimer: 0,
            invincible: false,
            isInvisible: false,
            // Wall spawn (Boss 1 TITAN)
            wallSpawnTimer: 0,
            // Ice zones (Boss 2 CRYO)
            iceZones: [],
            iceSpawnTimer: 0,
            // Skulls (Boss 3 SPECTRE)
            skulls: [],
            skullSpawnTimer: 0,
            invisibleTimer: 0,
            // Portails de téléportation (Boss 4 FOUDRE)
            teleportPortals: [],
            portalSpawnTimer: 0
        };

        // Créer les segments du boss
        for (let i = 0; i < bossSegments; i++) {
            this.boss.snake.push({ x: bossStartX + i, y: bossStartY });
        }

        this.boss.graceTimer = this.boss.graceDelay;
        this.bossTimer = objective.timeLimit || 120;

        this.startBossTimer();
        this.showBossUI(levelData);
        this.startSwordSpawning();

        logger.log(`[BossFight] Boss créé: ${bossSegments} seg, ${this.bossTimer}s, aggro ${this.boss.aggression * 100}%`);
    }

    // ============================================
    // TIMER ET UI
    // ============================================

    startBossTimer() {
        if (this.bossTimerInterval) {
            clearInterval(this.bossTimerInterval);
        }

        this.bossTimerInterval = setInterval(() => {
            if (this.game.paused || !this.game.running) return;

            // Gérer le délai de grâce
            if (this.boss && this.boss.isInGrace) {
                this.boss.graceTimer--;
                if (this.boss.graceTimer <= 0) {
                    this.boss.isInGrace = false;
                    logger.log('[BossFight] Période de grâce terminée, le boss attaque!');
                }
            }

            this.updateSwordTimer();
            this.bossTimer--;
            this.updateBossUI();

            if (this.bossTimer <= 0) {
                this.bossFightLost();
            }
        }, 1000);
    }

    showBossUI(levelData) {
        const container = document.getElementById('roguelike-objective');
        if (container) {
            container.innerHTML = `
                <div class="boss-ui">
                    <div class="boss-header">
                        <div class="boss-name">${levelData.name}</div>
                        <div class="boss-phase" id="boss-phase"></div>
                    </div>
                    <div class="boss-health-bar">
                        <div class="boss-health-fill" id="boss-health-fill"></div>
                        <span class="boss-health-text" id="boss-health-text"></span>
                    </div>
                    <div class="boss-timer" id="boss-timer"></div>
                </div>
            `;
            container.classList.remove('hidden');
        }
        this.updateBossUI();
    }

    updateBossUI() {
        const healthFill = document.getElementById('boss-health-fill');
        const healthText = document.getElementById('boss-health-text');
        const timerEl = document.getElementById('boss-timer');
        const phaseEl = document.getElementById('boss-phase');

        if (this.boss && healthFill && healthText) {
            const maxSegments = this.game.roguelikeObjective?.bossSegments || 15;
            const currentSegments = this.boss.snake.length;
            const percent = (currentSegments / maxSegments) * 100;

            healthFill.style.width = `${percent}%`;
            healthText.textContent = `${currentSegments}/${maxSegments}`;

            const phaseColor = this.boss.phaseColor || '#ff4444';
            healthFill.style.backgroundColor = phaseColor;
            healthFill.style.boxShadow = `0 0 10px ${phaseColor}`;
        }

        if (phaseEl && this.boss) {
            const phaseName = this.boss.phaseName || '';
            const phaseColor = this.boss.phaseColor || '#ff4444';

            if (phaseName) {
                phaseEl.textContent = phaseName;
                phaseEl.style.color = phaseColor;
                phaseEl.style.textShadow = `0 0 8px ${phaseColor}`;
                phaseEl.classList.add('phase-active');
            }
        }

        if (timerEl) {
            const mins = Math.floor(this.bossTimer / 60);
            const secs = this.bossTimer % 60;
            timerEl.textContent = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;

            if (this.bossTimer <= 10) {
                timerEl.style.color = '#ff4444';
                timerEl.classList.add('timer-critical');
            } else {
                timerEl.style.color = '#ffffff';
                timerEl.classList.remove('timer-critical');
            }
        }
    }

    hideBossUI() {
        const container = document.getElementById('roguelike-objective');
        if (container) {
            container.innerHTML = `
                <span class="rl-obj-icon">🎯</span>
                <span class="rl-obj-text">Stage <span id="rl-obj-level">1</span></span>
                <span class="rl-obj-progress"><span id="rl-obj-current">0</span>/<span id="rl-obj-target">8</span> 🍎</span>
            `;
            container.classList.add('hidden');
        }
    }

    // ============================================
    // UPDATE DU BOSS
    // ============================================

    update(timestamp) {
        if (!this.isBossFight || !this.boss || this.bossDefeated) return;

        // Décrémenter la période de grâce après vol de segments
        if (this.stealGracePeriod > 0) {
            this.stealGracePeriod--;
        }

        // Pendant la période de grâce, le boss ne bouge pas
        if (this.boss.isInGrace) return;

        this.updateSpecialBehavior();
        this.cleanupTemporaryWalls();

        // Vérifier si le boss doit bouger
        const moveDelay = this.boss.moveInterval / this.boss.speed;
        if (timestamp - this.boss.lastMoveTime < moveDelay) return;

        this.boss.lastMoveTime = timestamp;

        // IA : le boss suit le joueur selon son agressivité (sauf si en charge)
        if (!this.boss.isCharging) {
            this.updateBossAI();
        }

        // Appliquer le mouvement
        this.boss.dx = this.boss.ndx;
        this.boss.dy = this.boss.ndy;

        // Calculer nouvelle position de la tête
        const head = this.boss.snake[0];
        let newHead = {
            x: head.x + this.boss.dx,
            y: head.y + this.boss.dy
        };

        // Wrap around (le boss traverse les murs)
        if (newHead.x < 0) newHead.x = this.game.GRID_SIZE - 1;
        if (newHead.x >= this.game.GRID_SIZE) newHead.x = 0;
        if (newHead.y < 0) newHead.y = this.game.GRID_SIZE - 1;
        if (newHead.y >= this.game.GRID_SIZE) newHead.y = 0;

        // Le boss casse les murs sur son passage (isBossWall ou cinematicWall)
        const wallIndex = this.game.obstacles.findIndex(o =>
            o.x === newHead.x && o.y === newHead.y && (o.isBossWall || o.cinematicWall)
        );
        if (wallIndex !== -1) {
            this.game.createParticles(newHead.x, newHead.y, '#8B4513', 6);
            this.game.obstacles.splice(wallIndex, 1);
            if (window.audio) window.audio.breakWall?.();
            logger.log(`[BossFight] Boss a cassé un mur en (${newHead.x}, ${newHead.y})`);
        }

        // Déplacer le boss
        this.boss.snake.unshift(newHead);
        this.boss.snake.pop();
    }

    updateBossAI() {
        if (!this.boss || this.boss.snake.length === 0) return;

        const bossHead = this.boss.snake[0];
        const playerHead = this.game.snake[0];

        let targetX, targetY;
        let shouldChaseTarget = false;

        if (!this.boss.hasSword && this.sword) {
            targetX = this.sword.x;
            targetY = this.sword.y;
            shouldChaseTarget = true;
        } else if (this.boss.hasSword) {
            targetX = playerHead.x;
            targetY = playerHead.y;
            shouldChaseTarget = true;
        } else {
            targetX = playerHead.x;
            targetY = playerHead.y;
            shouldChaseTarget = false;
        }

        const diffX = targetX - bossHead.x;
        const diffY = targetY - bossHead.y;

        const possibleMoves = [];

        if (this.boss.dx !== 1) possibleMoves.push({ dx: -1, dy: 0, priority: diffX < 0 ? Math.abs(diffX) : 0 });
        if (this.boss.dx !== -1) possibleMoves.push({ dx: 1, dy: 0, priority: diffX > 0 ? Math.abs(diffX) : 0 });
        if (this.boss.dy !== 1) possibleMoves.push({ dx: 0, dy: -1, priority: diffY < 0 ? Math.abs(diffY) : 0 });
        if (this.boss.dy !== -1) possibleMoves.push({ dx: 0, dy: 1, priority: diffY > 0 ? Math.abs(diffY) : 0 });

        possibleMoves.sort((a, b) => b.priority - a.priority);

        const baseAggression = this.boss.aggression || 0.5;
        const aggression = shouldChaseTarget ? Math.max(0.8, baseAggression) : baseAggression;

        if (Math.random() < aggression && possibleMoves.length > 0) {
            this.boss.ndx = possibleMoves[0].dx;
            this.boss.ndy = possibleMoves[0].dy;
        } else if (possibleMoves.length > 0) {
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            this.boss.ndx = randomMove.dx;
            this.boss.ndy = randomMove.dy;
        }
    }

    // ============================================
    // SYSTÈME DE PHASES
    // ============================================

    checkBossPhase() {
        if (!this.boss || !this.boss.phases || this.boss.phases.length === 0) return;

        const hpRatio = this.boss.snake.length / this.boss.maxSegments;
        const phases = this.boss.phases;

        let newPhaseIndex = 0;
        for (let i = phases.length - 1; i >= 0; i--) {
            if (hpRatio <= phases[i].threshold) {
                newPhaseIndex = i;
            }
        }

        if (newPhaseIndex !== this.boss.currentPhase) {
            this.transitionToPhase(newPhaseIndex);
        }
    }

    transitionToPhase(newPhaseIndex) {
        const oldPhase = this.boss.phases[this.boss.currentPhase];
        const newPhase = this.boss.phases[newPhaseIndex];

        logger.log(`[BossFight] Transition de phase: ${oldPhase?.name} → ${newPhase.name}`);

        this.boss.currentPhase = newPhaseIndex;
        this.boss.phaseName = newPhase.name;
        this.boss.phaseColor = newPhase.color;
        this.boss.aggression = newPhase.aggression;

        const baseInterval = this.game.roguelikeLevelData?.bossMoveInterval || 200;
        this.boss.moveInterval = baseInterval / newPhase.speedMultiplier;

        this.triggerPhaseTransition(newPhase);
        this.initPhaseSpecial(newPhase);
        this.updateBossUI();
    }

    triggerPhaseTransition(phase) {
        this.game.triggerScreenShake(15);

        if (this.boss.snake.length > 0) {
            const head = this.boss.snake[0];
            this.game.createParticles(head.x, head.y, phase.color, 20);
        }

        this.flashScreen(phase.color, 300);
        this.showPhaseAnnouncement(phase.name);
    }

    flashScreen(color, duration) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: ${color};
            opacity: 0.5;
            pointer-events: none;
            z-index: 9999;
            animation: flashFade ${duration}ms ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), duration);
    }

    showPhaseAnnouncement(phaseName) {
        const announcement = document.createElement('div');
        announcement.className = 'phase-announcement';
        announcement.innerHTML = `<span class="phase-text">${phaseName.toUpperCase()}</span>`;
        announcement.style.cssText = `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: bold;
            color: white;
            text-shadow: 0 0 20px ${this.boss.phaseColor}, 0 0 40px ${this.boss.phaseColor};
            z-index: 10000;
            animation: phaseAnnounce 1.5s ease-out forwards;
            pointer-events: none;
        `;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1500);
    }

    initPhaseSpecial(phase) {
        if (!phase.special) return;

        const special = phase.special;
        const now = Date.now();

        switch (special.type) {
            case 'wall_spawn':
                this.boss.wallSpawnTimer = now + 2000;
                break;
            case 'ice_zone':
                this.boss.iceSpawnTimer = now + 2000;
                break;
            case 'skull_spawn':
            case 'skull_invisible':
                this.boss.skullSpawnTimer = now + 2000;
                this.boss.invisibleTimer = now + (special.invisibleInterval || 6000);
                break;
            case 'teleport_zone':
                this.boss.portalSpawnTimer = now + 2000;
                break;
        }
    }

    // ============================================
    // COMPORTEMENTS SPÉCIAUX
    // ============================================

    updateSpecialBehavior() {
        if (!this.boss || !this.boss.phases) return;

        const phase = this.boss.phases[this.boss.currentPhase];
        if (!phase || !phase.special) return;

        const special = phase.special;
        const now = Date.now();

        switch (phase.behavior) {
            case 'wall_spawn':
                this.updateWallSpawn(special, now);
                break;
            case 'ice_zone':
                this.updateIceZone(special, now);
                break;
            case 'skull_spawn':
                this.updateSkullSpawn(special, now);
                break;
            case 'skull_invisible':
                this.updateSkullSpawn(special, now);
                this.updateInvisibility(special, now);
                break;
            case 'teleport_zone':
                this.updateTeleportZones(special, now);
                break;
        }

        // Cleanup des éléments temporaires
        this.cleanupTemporaryWalls();
        this.cleanupIceZones();
        this.cleanupSkulls();
        this.cleanupTeleportPortals();
    }

    // ============================================
    // BOSS 1 - TITAN : WALL SPAWN
    // ============================================

    updateWallSpawn(special, now) {
        if (now < this.boss.wallSpawnTimer) return;

        this.boss.wallSpawnTimer = now + special.spawnInterval;
        this.spawnTemporaryWalls(special.wallCount, special.wallDuration);
    }

    spawnTemporaryWalls(count, duration) {
        if (!this.boss || this.boss.snake.length === 0) return;

        const gridSize = this.game.GRID_SIZE;
        const playerHead = this.game.snake[0];

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let x, y;

            // Trouver une position valide (pas sur le joueur ni le boss)
            do {
                x = Math.floor(Math.random() * (gridSize - 4)) + 2;
                y = Math.floor(Math.random() * (gridSize - 4)) + 2;
                attempts++;
            } while (
                attempts < 20 &&
                (Math.abs(x - playerHead.x) < 3 && Math.abs(y - playerHead.y) < 3) ||
                this.boss.snake.some(s => s.x === x && s.y === y)
            );

            if (attempts < 20) {
                const wall = {
                    x, y,
                    temporary: true,
                    expiresAt: Date.now() + duration * 1000,
                    isBossWall: true
                };
                this.game.obstacles.push(wall);
                this.game.createParticles(x, y, '#8B4513', 5);
            }
        }

        logger.log(`[BossFight] TITAN: ${count} mur(s) temporaire(s) créé(s)`);
    }

    cleanupTemporaryWalls() {
        const now = Date.now();
        this.game.obstacles = this.game.obstacles.filter(o => {
            if (o.temporary && o.expiresAt && now >= o.expiresAt) {
                this.game.createParticles(o.x, o.y, '#8B4513', 3);
                return false;
            }
            return true;
        });
    }

    // ============================================
    // BOSS 2 - CRYO : ICE ZONES
    // ============================================

    updateIceZone(special, now) {
        if (now < this.boss.iceSpawnTimer) return;

        this.boss.iceSpawnTimer = now + special.spawnInterval;
        this.spawnIceZones(special.zoneCount, special.zoneRadius, special.zoneDuration, special.slowFactor);
    }

    spawnIceZones(count, radius, duration, slowFactor) {
        if (!this.boss || this.boss.snake.length === 0) return;

        const gridSize = this.game.GRID_SIZE;

        for (let i = 0; i < count; i++) {
            // Position aléatoire sur le terrain
            const centerX = Math.floor(Math.random() * (gridSize - 4)) + 2;
            const centerY = Math.floor(Math.random() * (gridSize - 4)) + 2;

            const zone = {
                x: centerX,
                y: centerY,
                radius: radius,
                slowFactor: slowFactor,
                createdAt: Date.now(),
                duration: duration * 1000
            };

            this.boss.iceZones.push(zone);
            this.game.createParticles(centerX, centerY, '#00BFFF', 8);
        }

        logger.log(`[BossFight] CRYO: ${count} zone(s) de glace créée(s)`);
    }

    cleanupIceZones() {
        if (!this.boss || !this.boss.iceZones) return;

        const now = Date.now();
        this.boss.iceZones = this.boss.iceZones.filter(zone => {
            if (now - zone.createdAt >= zone.duration) {
                this.game.createParticles(zone.x, zone.y, '#00BFFF', 3);
                return false;
            }
            return true;
        });
    }

    /**
     * Vérifie si le joueur est dans une zone de glace
     * @returns {number} Facteur de ralentissement (1 = normal, 0.5 = ralenti)
     */
    getIceSlowFactor() {
        if (!this.boss || !this.boss.iceZones || this.boss.iceZones.length === 0) return 1;

        const playerHead = this.game.snake[0];

        for (const zone of this.boss.iceZones) {
            const dist = Math.abs(playerHead.x - zone.x) + Math.abs(playerHead.y - zone.y);
            if (dist <= zone.radius) {
                return zone.slowFactor;
            }
        }

        return 1;
    }

    // ============================================
    // BOSS 3 - SPECTRE : SKULLS + INVISIBILITY
    // ============================================

    updateSkullSpawn(special, now) {
        if (now < this.boss.skullSpawnTimer) return;

        this.boss.skullSpawnTimer = now + special.spawnInterval;
        this.spawnSkulls(special.skullCount, special.skullDuration, special.skullDamage || 1);
    }

    spawnSkulls(count, duration, damage) {
        if (!this.boss || this.boss.snake.length === 0) return;

        const gridSize = this.game.GRID_SIZE;
        const playerHead = this.game.snake[0];

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let x, y;

            // Trouver une position valide
            do {
                x = Math.floor(Math.random() * (gridSize - 4)) + 2;
                y = Math.floor(Math.random() * (gridSize - 4)) + 2;
                attempts++;
            } while (
                attempts < 20 &&
                ((Math.abs(x - playerHead.x) < 2 && Math.abs(y - playerHead.y) < 2) ||
                this.boss.skulls.some(s => s.x === x && s.y === y))
            );

            if (attempts < 20) {
                const skull = {
                    x, y,
                    damage: damage,
                    createdAt: Date.now(),
                    duration: duration * 1000
                };
                this.boss.skulls.push(skull);
                this.game.createParticles(x, y, '#9932CC', 5);
            }
        }

        logger.log(`[BossFight] SPECTRE: ${count} crâne(s) invoqué(s)`);
    }

    cleanupSkulls() {
        if (!this.boss || !this.boss.skulls) return;

        const now = Date.now();
        this.boss.skulls = this.boss.skulls.filter(skull => {
            if (now - skull.createdAt >= skull.duration) {
                this.game.createParticles(skull.x, skull.y, '#9932CC', 3);
                return false;
            }
            return true;
        });
    }

    updateInvisibility(special, now) {
        // Vérifier si le boss doit devenir invisible
        if (!this.boss.isInvisible && now >= this.boss.invisibleTimer) {
            this.boss.isInvisible = true;
            this.boss.invisibleEndTime = now + special.invisibleDuration * 1000;
            this.game.createParticles(this.boss.snake[0].x, this.boss.snake[0].y, '#DDA0DD', 10);
            logger.log('[BossFight] SPECTRE: Devient invisible!');
        }

        // Vérifier si le boss redevient visible
        if (this.boss.isInvisible && now >= this.boss.invisibleEndTime) {
            this.boss.isInvisible = false;
            this.boss.invisibleTimer = now + special.invisibleInterval;
            this.game.createParticles(this.boss.snake[0].x, this.boss.snake[0].y, '#DDA0DD', 10);
            logger.log('[BossFight] SPECTRE: Redevient visible!');
        }
    }

    // ============================================
    // BOSS 4 - FOUDRE : PORTAILS DE TÉLÉPORTATION
    // ============================================

    updateTeleportZones(special, now) {
        if (now < this.boss.portalSpawnTimer) return;

        this.boss.portalSpawnTimer = now + (special.spawnInterval || 4000);
        this.spawnTeleportPortals(special.portalCount || 2, special.portalDuration || 8);
    }

    spawnTeleportPortals(count, duration) {
        if (!this.boss) return;

        const gridSize = this.game.GRID_SIZE;
        const margin = 3;

        for (let i = 0; i < count; i++) {
            // Position aléatoire évitant le joueur et le boss
            let x, y, attempts = 0;
            do {
                x = Math.floor(Math.random() * (gridSize - margin * 2)) + margin;
                y = Math.floor(Math.random() * (gridSize - margin * 2)) + margin;
                attempts++;
            } while (attempts < 20 && this.isPositionOccupied(x, y));

            const portal = {
                x: x,
                y: y,
                createdAt: Date.now(),
                duration: duration * 1000,
                pulsePhase: Math.random() * Math.PI * 2 // Pour animation
            };

            this.boss.teleportPortals.push(portal);
            this.game.createParticles(x, y, '#FFD700', 5);
        }

        logger.log(`[BossFight] FOUDRE: ${count} portail(s) créé(s)`);
    }

    isPositionOccupied(x, y) {
        // Vérifier si position sur le joueur
        if (this.game.snake.some(s => s.x === x && s.y === y)) return true;
        // Vérifier si position sur le boss
        if (this.boss.snake.some(s => s.x === x && s.y === y)) return true;
        // Vérifier si position sur un autre portail
        if (this.boss.teleportPortals.some(p => p.x === x && p.y === y)) return true;
        return false;
    }

    cleanupTeleportPortals() {
        if (!this.boss || !this.boss.teleportPortals) return;

        const now = Date.now();

        this.boss.teleportPortals = this.boss.teleportPortals.filter(portal => {
            const age = now - portal.createdAt;
            return age < portal.duration;
        });
    }

    /**
     * Vérifie si le joueur marche sur un portail et le téléporte
     * @returns {boolean} true si téléporté
     */
    checkTeleportCollision() {
        if (!this.boss || !this.boss.teleportPortals || this.boss.teleportPortals.length === 0) return false;

        const playerHead = this.game.snake[0];

        for (const portal of this.boss.teleportPortals) {
            if (playerHead.x === portal.x && playerHead.y === portal.y) {
                this.teleportPlayer();
                return true;
            }
        }

        return false;
    }

    /**
     * Téléporte le joueur à une position aléatoire
     */
    teleportPlayer() {
        const gridSize = this.game.GRID_SIZE;
        const margin = 2;

        // Trouver une position sûre
        let newX, newY, attempts = 0;
        do {
            newX = Math.floor(Math.random() * (gridSize - margin * 2)) + margin;
            newY = Math.floor(Math.random() * (gridSize - margin * 2)) + margin;
            attempts++;
        } while (attempts < 30 && this.isPositionOccupied(newX, newY));

        // Particules à l'ancienne position
        const oldHead = this.game.snake[0];
        this.game.createParticles(oldHead.x, oldHead.y, '#FFD700', 8);

        // Téléporter la tête
        this.game.snake[0].x = newX;
        this.game.snake[0].y = newY;

        // Particules à la nouvelle position
        this.game.createParticles(newX, newY, '#9932CC', 8);

        // Effet visuel
        this.game.triggerScreenShake(5);
        if (window.audio) window.audio.powerup?.();

        logger.log(`[BossFight] Joueur téléporté de (${oldHead.x},${oldHead.y}) vers (${newX},${newY})`);
    }

    // ============================================
    // SYSTÈME D'ÉPÉE
    // ============================================

    collectSword() {
        logger.log('[BossFight] Épée ramassée par le joueur!');

        this.sword = null;
        this.swordActive = true;
        this.swordTimer = this.swordDuration;

        achievementManager.onSwordCollected();

        if (window.audio) window.audio.powerup?.();
        this.game.createParticles(this.game.snake[0].x, this.game.snake[0].y, '#ffd700', 10);
    }

    bossCollectSword() {
        logger.log('[BossFight] Épée ramassée par le boss!');

        this.sword = null;
        this.boss.hasSword = true;
        this.boss.swordTimer = this.swordDuration;

        if (window.audio) window.audio.powerup?.();
        this.game.createParticles(this.boss.snake[0].x, this.boss.snake[0].y, '#ff4444', 10);
    }

    spawnSword() {
        if (this.sword || this.swordActive || this.boss?.hasSword) return;

        let attempts = 0;
        let pos = null;

        while (attempts < 50 && !pos) {
            const x = Math.floor(Math.random() * (this.game.GRID_SIZE - 4)) + 2;
            const y = Math.floor(Math.random() * (this.game.GRID_SIZE - 4)) + 2;

            const onSnake = this.game.snake.some(s => s.x === x && s.y === y);
            const onBoss = this.boss?.snake.some(s => s.x === x && s.y === y);
            const onObstacle = this.game.obstacles.some(o => o.x === x && o.y === y);

            if (!onSnake && !onBoss && !onObstacle) {
                pos = { x, y };
            }
            attempts++;
        }

        if (pos) {
            this.sword = pos;
            logger.log(`[BossFight] Épée apparue en (${pos.x}, ${pos.y})`);
        }
    }

    startSwordSpawning() {
        setTimeout(() => {
            if (this.isBossFight && !this.bossDefeated) {
                this.spawnSword();
            }
        }, 3000);

        this.swordSpawnInterval = setInterval(() => {
            if (this.isBossFight && !this.bossDefeated && !this.sword && !this.swordActive) {
                this.spawnSword();
            }
        }, 8000);
    }

    updateSwordTimer() {
        if (this.swordActive && this.swordTimer > 0) {
            this.swordTimer--;
            if (this.swordTimer <= 0) {
                this.swordActive = false;
                logger.log('[BossFight] Épée du joueur expirée!');
            }
        }

        if (this.boss?.hasSword && this.boss.swordTimer > 0) {
            this.boss.swordTimer--;
            if (this.boss.swordTimer <= 0) {
                this.boss.hasSword = false;
                logger.log('[BossFight] Épée du boss expirée!');
            }
        }
    }

    // ============================================
    // COLLISIONS
    // ============================================

    checkCollisions() {
        if (!this.isBossFight || !this.boss || this.boss.snake.length === 0) return;

        const playerHead = this.game.snake[0];
        const bossHead = this.boss.snake[0];

        // Joueur ramasse l'épée
        if (this.sword && playerHead.x === this.sword.x && playerHead.y === this.sword.y) {
            this.collectSword();
        }

        // Boss ramasse l'épée
        if (this.sword && bossHead.x === this.sword.x && bossHead.y === this.sword.y) {
            this.bossCollectSword();
        }

        // Collision joueur avec skulls (Boss 3 SPECTRE)
        if (this.boss?.skulls && this.boss.skulls.length > 0) {
            const skullHit = this.boss.skulls.find(s =>
                s.x === playerHead.x && s.y === playerHead.y
            );
            if (skullHit && !this.game.powerupEffects.ghost && !this.game.powerupEffects.invincible) {
                this.playerHitSkull(skullHit);
                if (!this.boss) return; // Combat terminé
            }
        }

        // Collision joueur avec portail (Boss 4 FOUDRE) - téléporte le joueur
        if (this.checkTeleportCollision()) {
            // Le joueur a été téléporté, pas de dégâts
        }

        // Vérification que le boss existe toujours
        if (!this.boss || this.boss.snake.length === 0) return;

        // Tête contre tête
        if (playerHead.x === bossHead.x && playerHead.y === bossHead.y) {
            this.handleHeadToHeadCollision();
            return;
        }

        // Joueur touche le corps du boss
        for (let i = 1; i < this.boss.snake.length; i++) {
            const segment = this.boss.snake[i];
            if (playerHead.x === segment.x && playerHead.y === segment.y) {
                // Pendant la période de grâce (après vol), on ignore la collision
                if (this.stealGracePeriod > 0) {
                    return;
                }
                if (this.boss.invincible) {
                    this.playerBlockedByBoss();
                    return;
                }
                if (this.swordActive) {
                    this.playerStealsBossSegments();
                } else {
                    this.playerBlockedByBoss();
                }
                return;
            }
        }

        // Boss touche le corps du joueur
        for (let i = 1; i < this.game.snake.length; i++) {
            const segment = this.game.snake[i];
            if (bossHead.x === segment.x && bossHead.y === segment.y) {
                if (this.boss.hasSword) {
                    this.bossStealsPlayerSegments();
                } else {
                    this.bossBlockedByPlayer();
                }
                return;
            }
        }

        this.checkBossPhase();
    }

    /**
     * Joueur touché par un skull (Boss 3 SPECTRE)
     */
    playerHitSkull(skull) {
        logger.log('[BossFight] Joueur touché par un crâne!');

        // Retirer le skull
        const idx = this.boss.skulls.indexOf(skull);
        if (idx !== -1) {
            this.boss.skulls.splice(idx, 1);
        }

        // Dégâts
        const damage = skull.damage || 1;
        for (let i = 0; i < damage; i++) {
            if (this.game.snake.length > 3) {
                this.game.snake.pop();
            }
        }
        this.game.syncCombo();

        this.game.triggerScreenShake(5);
        this.game.createParticles(this.game.snake[0].x, this.game.snake[0].y, '#9932CC', 8);

        if (this.game.snake.length <= 3) {
            this.bossFightLost();
        }

        this.updateBossUI();
    }

    handleHeadToHeadCollision() {
        logger.log('[BossFight] Collision tête contre tête!');

        const playerLoss = Math.min(3, this.game.snake.length - 3);
        const bossLoss = Math.min(3, this.boss.snake.length - 1);

        for (let i = 0; i < playerLoss; i++) {
            if (this.game.snake.length > 3) this.game.snake.pop();
        }
        for (let i = 0; i < bossLoss; i++) {
            if (this.boss.snake.length > 0) this.boss.snake.pop();
        }

        if (playerLoss > 0) this.game.syncCombo();

        this.game.triggerScreenShake(10);

        if (this.game.snake.length <= 3) {
            this.bossFightLost();
            return;
        }

        if (this.boss.snake.length <= 1) {
            this.bossFightWon();
            return;
        }

        this.updateBossUI();
    }

    playerBlockedByBoss() {
        logger.log('[BossFight] Joueur bloqué par le boss!');

        if (this.game.snake.length >= 2) {
            const previousPos = this.game.snake[1];
            this.game.snake[0] = { x: previousPos.x, y: previousPos.y };
        }

        this.game.triggerScreenShake(6);
        this.game.createParticles(this.game.snake[0].x, this.game.snake[0].y, '#ff8800', 4);

        const canvas = this.game.canvas;
        if (canvas) {
            canvas.style.boxShadow = '0 0 30px #ff4400';
            setTimeout(() => {
                canvas.style.boxShadow = '';
            }, 100);
        }

        if (window.audio) window.audio.hit?.();
    }

    bossBlockedByPlayer() {
        logger.log('[BossFight] Boss bloqué par le joueur!');

        if (this.boss.snake.length >= 2) {
            const previousPos = this.boss.snake[1];
            this.boss.snake[0] = { x: previousPos.x, y: previousPos.y };
        }

        const directions = ['up', 'down', 'left', 'right'];
        const oppositeDir = {
            'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left'
        };
        const validDirs = directions.filter(d =>
            d !== this.boss.direction && d !== oppositeDir[this.boss.direction]
        );
        if (validDirs.length > 0) {
            this.boss.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
        }

        this.game.createParticles(this.boss.snake[0].x, this.boss.snake[0].y, '#ff4400', 4);
    }

    playerStealsBossSegments() {
        // Formule : 3 segments de base (ou 6 avec skin blood) + pommes mangées pendant le combat
        const run = window.roguelikeManager?.currentRun;
        const baseSegments = run?.swordDamage || 3;
        const bonusFromApples = this.applesEatenDuringBoss;
        const segmentsToSteal = baseSegments + bonusFromApples;
        const actualStolen = Math.min(segmentsToSteal, this.boss.snake.length);

        logger.log(`[BossFight] Joueur vole ${actualStolen} segments au boss! (base: ${baseSegments} + pommes: ${bonusFromApples})`);

        for (let i = 0; i < actualStolen; i++) {
            if (this.boss.snake.length > 0) {
                this.boss.snake.pop();
                this.game.snake.push({ ...this.game.snake[this.game.snake.length - 1] });
            }
        }

        if (actualStolen > 0) this.game.syncCombo();

        achievementManager.onSegmentsStolen(actualStolen);

        this.swordActive = false;
        this.swordTimer = 0;

        // Reset le compteur de pommes après un vol réussi
        this.applesEatenDuringBoss = 0;

        // Période de grâce pour éviter une collision immédiate après le vol
        // Le joueur a 2 frames pour s'éloigner du boss
        this.stealGracePeriod = 2;

        if (window.audio) window.audio.eat?.();
        this.game.createParticles(this.game.snake[0].x, this.game.snake[0].y, '#ffd700', 8);
        this.game.triggerScreenShake(5);

        if (this.boss.snake.length <= 1) {
            this.bossFightWon();
            return;
        }

        this.updateBossUI();
    }

    bossStealsPlayerSegments() {
        const segmentsToSteal = 5;
        const segmentsLost = Math.min(segmentsToSteal, this.game.snake.length - 3);

        logger.log(`[BossFight] Boss attaque! Perte de ${segmentsLost} segments.`);

        for (let i = 0; i < segmentsLost; i++) {
            if (this.game.snake.length > 3) {
                this.game.snake.pop();
                this.boss.snake.push({ ...this.boss.snake[this.boss.snake.length - 1] });
            }
        }

        if (segmentsLost > 0) this.game.syncCombo();

        if (segmentsLost > 0) {
            achievementManager.onDamageTaken(segmentsLost);
        }

        this.boss.hasSword = false;
        this.boss.swordTimer = 0;

        this.game.triggerScreenShake(10);
        this.game.createParticles(this.game.snake[0].x, this.game.snake[0].y, '#ff0000', 8);

        if (this.game.snake.length <= 3) {
            this.bossFightLost();
        }

        this.updateBossUI();
    }

    // ============================================
    // FIN DE COMBAT
    // ============================================

    bossFightWon() {
        logger.log('[BossFight] Boss vaincu!');

        const bossName = this.game.roguelikeLevelData?.name || 'BOSS';
        const segmentsLostDuringFight = (this.bossStartPlayerSegments || this.game.snake.length) - this.game.snake.length;
        achievementManager.onBossKilled(bossName, this.bossTimer, segmentsLostDuringFight);

        this.bossDefeated = true;
        this.cleanup();

        if (window.audio) window.audio.victory?.();
        this.game.triggerScreenShake(15);

        // Boss Rush Mode
        if (this.game.isBossRushMode) {
            logger.log('[BossFight] Boss Rush - Boss vaincu');
            this.game.running = false;
            this.game.paused = true;

            if (window.bossRushManager) {
                window.bossRushManager.onBossDefeated();
            }
            return;
        }

        // Roguelike Mode
        this.game.completeRoguelikeLevel();
    }

    bossFightLost() {
        logger.log('[BossFight] Défaite contre le boss!');

        this.cleanup();

        // Boss Rush Mode
        if (this.game.isBossRushMode) {
            logger.log('[BossFight] Boss Rush - Défaite');
            this.game.running = false;
            this.game.paused = true;

            if (window.bossRushManager) {
                window.bossRushManager.onPlayerDeath();
            }
            return;
        }

        // Roguelike / Classique
        this.game.gameOver();
    }

    cleanup() {
        this.isBossFight = false;
        this.boss = null;

        if (this.bossTimerInterval) {
            clearInterval(this.bossTimerInterval);
            this.bossTimerInterval = null;
        }

        if (this.swordSpawnInterval) {
            clearInterval(this.swordSpawnInterval);
            this.swordSpawnInterval = null;
        }

        this.sword = null;
        this.swordActive = false;
        this.swordTimer = 0;
        this.stealGracePeriod = 0;

        this.hideBossUI();
    }

    // ============================================
    // TRANSITION SIMPLE VERS LE COMBAT
    // ============================================

    /**
     * Lance un flash couleur puis démarre le combat (remplace les cinématiques lourdes)
     */
    startBossWithFlash(levelData, objective) {
        const config = this._currentBossConfig || { flash: '#9932CC' };

        logger.log(`[BossFight] Flash ${config.flash} puis combat: ${levelData.name}`);

        // Flash de couleur selon le boss (0.3s)
        this.flashScreen(config.flash, 300);

        // Petit délai puis démarrage du combat
        setTimeout(() => {
            this.startBossFightAfterIntro(objective, levelData);
        }, 350);
    }

    // ============================================
    // GETTERS pour le jeu principal
    // ============================================

    get isActive() {
        return this.isBossFight;
    }

    get currentBoss() {
        return this.boss;
    }

    get hasSword() {
        return this.swordActive;
    }

    get swordPosition() {
        return this.sword;
    }

    /**
     * Appelé quand le joueur mange une pomme pendant le combat de boss
     * Augmente le bonus de segments volés avec l'épée
     */
    onAppleEaten() {
        if (this.isBossFight) {
            this.applesEatenDuringBoss++;
            logger.log(`[BossFight] Pomme mangée! Bonus épée: +${this.applesEatenDuringBoss} segments`);
        }
    }
}
