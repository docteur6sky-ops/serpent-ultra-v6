// ============================================
// SOLO SNAKE GAME - MODE SOLO ENCAPSULÉ
// ============================================

import { logger } from './services/logger.js';
import { BaseSnakeGame } from './core/BaseSnakeGame.js';
import { drawSnakeEnhanced, getDirectionString } from './SkinsRenderer.js';
import roguelikeManager from './roguelike/RoguelikeManager.js';
import { achievementManager } from './roguelike/achievements.js';

class SoloSnakeGame extends BaseSnakeGame {
    constructor() {
        // Appeler le constructeur parent
        super('canvas-solo');

        // État du serpent (spécifique solo)
        this.snake = [];
        this.dx = 0;
        this.dy = 0;
        this.ndx = 0;
        this.ndy = 0;

        // Éléments du jeu (spécifique solo)
        this.food = null;
        this.bad = null;
        this.powerup = null;
        this.obstacles = [];

        // Scores et stats (spécifique solo)
        this.score = 0;
        this.foodCount = 0;
        this.combo = 1;
        this.maxCombo = 1;

        // Power-ups actifs (spécifique solo)
        this.powerupEffects = { slow: false, double: false, invincible: false, ghost: false };
        this.powerupTime = 0;
        this.activePowerup = null;  // Type actif : 'ice', 'fire', ou 'rock'
        this.slowCount = 0;
        this.doubleCount = 0;
        this.invincibleCount = 0;
        this.ghostCount = 0;

        // Contrôle du jeu (spécifique solo)
        this.locked = false;

        // ========== MODE ROGUELIKE ==========
        this.isRoguelikeMode = false;
        this.roguelikeLevelData = null;
        this.roguelikeModifiers = null;
        this.roguelikeObjective = null;
        this.roguelikeProgress = 0;

        // Upgrades roguelike actifs
        this.regenTimer = 0;            // Timer pour régénération
        this.regenInterval = null;      // Intervalle régénération
        this.sprintCooldown = 0;        // Cooldown du sprint
        this.sprintActive = false;      // Sprint actif
        this.scoreBoostActive = false;  // Combo Master x2 actif
        this.scoreBoostMultiplier = 1;  // Multiplicateur score
        this.scoreBoostTimer = null;    // Timer du boost

        // ========== BOSS FIGHT ==========
        this.isBossFight = false;
        this.boss = null;           // { snake: [], dx, dy, ndx, ndy, segments, speed }
        this.bossTimer = 0;         // Temps restant en secondes
        this.bossTimerInterval = null;
        this.bossDefeated = false;

        // Power-up épée (boss fight only)
        this.sword = null;          // { x, y } position de l'épée sur le terrain
        this.swordActive = false;   // Le joueur a l'épée
        this.swordDuration = 5;     // Durée en secondes
        this.swordTimer = 0;        // Temps restant
        this.swordSpawnInterval = null;

        // Stats de partie (spécifique solo)
        this.wallsDestroyed = 0;
        this.skullsEaten = 0;
        this.maxSnakeLength = 1;

        // Note: canvas, ctx, GRID_SIZE, CELL_SIZE, running, paused, difficulty,
        // raf, lastTime, level, particles, audio, COLORS, POWERUP_DURATION
        // sont maintenant dans BaseSnakeGame
    }

    // ============================================
    // DÉMARRAGE & INITIALISATION
    // ============================================

    start(difficulty = 0) {
        // Appeler la méthode start() du parent qui gère:
        // - difficulty, reset(), running, paused, gameStartTime, lastTime, loop()
        super.start(difficulty);
        // Note: La musique est gérée par ScreenManager.show('game-solo')
    }

    // ============================================
    // MODE ROGUELIKE - Démarrer un niveau
    // ============================================

    startRoguelikeLevel(levelData, modifiers) {
        logger.log(`[SoloGame] Démarrage niveau roguelike ${levelData.level}: ${levelData.name}`);

        // Sauvegarder l'état si on continue (pas level 1)
        const isNewRun = !this.isRoguelikeMode || levelData.level === 1;
        const previousSnakeLength = isNewRun ? 0 : this.snake.length;
        const previousScore = isNewRun ? 0 : this.score;
        const previousCombo = isNewRun ? 1 : this.combo;
        const previousMaxCombo = isNewRun ? 1 : this.maxCombo;

        this.isRoguelikeMode = true;
        this.roguelikeLevelData = levelData;
        this.roguelikeModifiers = modifiers || {};
        this.roguelikeObjective = levelData.objective;
        this.roguelikeProgress = 0;

        // Difficulté basée sur le monde
        const worldDifficulty = Math.min(2, levelData.world - 1);
        this.difficulty = worldDifficulty;

        // Reset et démarrage
        this.reset();
        this.running = true;
        this.paused = false;
        this.gameStartTime = Date.now();
        this.lastTime = performance.now();

        // Restaurer le score
        if (previousScore > 0) {
            this.score = previousScore;
            logger.log(`[SoloGame] Score restauré: ${this.score}`);
        }

        // Restaurer le combo (persiste entre les stages)
        this.combo = previousCombo;
        this.maxCombo = previousMaxCombo;
        if (previousCombo > 1) {
            logger.log(`[SoloGame] Combo restauré: ${this.combo} (max: ${this.maxCombo})`);
        }

        // Restaurer la longueur du serpent (conserver les segments gagnés)
        if (previousSnakeLength > 3) {
            const segmentsToAdd = previousSnakeLength - 3; // -3 car reset donne déjà 3 segments
            for (let i = 0; i < segmentsToAdd; i++) {
                this.snake.push({ ...this.snake[this.snake.length - 1] });
            }
            logger.log(`[SoloGame] Serpent restauré: ${this.snake.length} segments`);
        }

        // Mettre à jour l'UI avec les valeurs restaurées
        this.updateUI();

        // Appliquer les modificateurs roguelike
        this.applyRoguelikeModifiers();

        // Générer les obstacles du niveau
        this.generateRoguelikeObstacles();

        // Démarrer le combat de boss si c'est un niveau boss
        if (this.roguelikeObjective?.type === 'boss') {
            this.startBossFight();
        }

        // Afficher l'écran de jeu
        if (window.screenManager) {
            window.screenManager.show('game-solo');
        }

        // Démarrer la boucle
        this.loop(this.lastTime);
    }

    applyRoguelikeModifiers() {
        if (!this.roguelikeModifiers) return;

        // Appliquer les segments bonus
        const bonusSegments = this.roguelikeModifiers.bonusSegments || 0;
        for (let i = 0; i < bonusSegments; i++) {
            this.snake.push({ ...this.snake[this.snake.length - 1] });
        }

        // Démarrer la régénération si upgrade présent
        this.startRegeneration();

        // Démarrer le Combo Master (score x2 pendant 30s) si présent
        this.startScoreBoost();

        logger.log('[SoloGame] Modificateurs roguelike appliqués:', this.roguelikeModifiers);
    }

    startScoreBoost() {
        // Nettoyer ancien timer
        if (this.scoreBoostTimer) {
            clearTimeout(this.scoreBoostTimer);
            this.scoreBoostTimer = null;
        }
        this.scoreBoostActive = false;
        this.scoreBoostMultiplier = 1;

        if (!this.roguelikeModifiers?.passives) return;

        // Chercher l'upgrade score_boost (Combo Master)
        const boostUpgrade = this.roguelikeModifiers.passives.find(p => p.type === 'score_boost');
        if (!boostUpgrade) return;

        logger.log(`[SoloGame] Combo Master activé! x${boostUpgrade.multiplier} pendant ${boostUpgrade.duration}s`);

        this.scoreBoostActive = true;
        this.scoreBoostMultiplier = boostUpgrade.multiplier;

        // Effet visuel
        this.createParticles(this.snake[0].x, this.snake[0].y, '#ff4444', 10);

        // Désactiver après la durée
        this.scoreBoostTimer = setTimeout(() => {
            this.scoreBoostActive = false;
            this.scoreBoostMultiplier = 1;
            logger.log('[SoloGame] Combo Master terminé!');
        }, boostUpgrade.duration * 1000);
    }

    startRegeneration() {
        // Nettoyer ancien timer
        if (this.regenInterval) {
            clearInterval(this.regenInterval);
            this.regenInterval = null;
        }

        if (!this.roguelikeModifiers?.passives) return;

        // Chercher l'upgrade régénération
        const regenUpgrades = this.roguelikeModifiers.passives.filter(p => p.type === 'regen');
        if (regenUpgrades.length === 0) return;

        // Calculer intervalle total (peut avoir plusieurs stacks)
        // Chaque stack = +1 segment par intervalle
        const totalAmount = regenUpgrades.reduce((sum, r) => sum + r.amount, 0);
        const interval = regenUpgrades[0].interval * 1000; // en ms

        logger.log(`[SoloGame] Régénération activée: +${totalAmount} segment(s) toutes les ${interval/1000}s`);

        this.regenInterval = setInterval(() => {
            if (this.paused || !this.running) return;

            // Ajouter les segments
            for (let i = 0; i < totalAmount; i++) {
                this.snake.push({ ...this.snake[this.snake.length - 1] });
            }
            this.createParticles(this.snake[0].x, this.snake[0].y, '#00ff00', 3);
            logger.log(`[SoloGame] Régénération: +${totalAmount} segment(s)`);
        }, interval);
    }

    stopRegeneration() {
        if (this.regenInterval) {
            clearInterval(this.regenInterval);
            this.regenInterval = null;
        }
    }

    generateBorderWalls() {
        // Générer des murs sur tout le pourtour de la grille
        // Haut et bas
        for (let x = 0; x < this.GRID_SIZE; x++) {
            this.obstacles.push({ x: x, y: 0, isBorder: true });
            this.obstacles.push({ x: x, y: this.GRID_SIZE - 1, isBorder: true });
        }
        // Gauche et droite (sans les coins déjà ajoutés)
        for (let y = 1; y < this.GRID_SIZE - 1; y++) {
            this.obstacles.push({ x: 0, y: y, isBorder: true });
            this.obstacles.push({ x: this.GRID_SIZE - 1, y: y, isBorder: true });
        }
        logger.log(`[SoloGame] Murs de bordure générés: ${this.obstacles.length} blocs`);
    }

    generateRoguelikeObstacles() {
        this.obstacles = [];

        // Murs de bordure (sauf si upgrade Téléportation)
        const hasTeleport = this.roguelikeModifiers?.passives?.some(p => p.type === 'wrap_around') || false;
        if (!hasTeleport) {
            this.generateBorderWalls();
        }

        if (!this.roguelikeLevelData?.obstacles) return;

        // Zone de sécurité autour du serpent (5 cases dans toutes les directions)
        const head = this.snake[0];
        const safeZoneRadius = 5;
        const isInSafeZone = (x, y) => {
            // Zone carrée autour de la tête
            if (Math.abs(x - head.x) <= safeZoneRadius && Math.abs(y - head.y) <= safeZoneRadius) {
                return true;
            }
            // Zone étendue devant le serpent (direction initiale = droite)
            if (y === head.y && x > head.x && x <= head.x + safeZoneRadius + 3) {
                return true;
            }
            return false;
        };

        for (const obs of this.roguelikeLevelData.obstacles) {
            if (obs.type === 'wall_static') {
                // Générer des murs statiques
                for (let i = 0; i < obs.count; i++) {
                    let newObs;
                    let attempts = 0;
                    do {
                        newObs = {
                            x: Math.floor(Math.random() * (this.GRID_SIZE - 4)) + 2,
                            y: Math.floor(Math.random() * (this.GRID_SIZE - 4)) + 2
                        };
                        attempts++;
                    } while (attempts < 50 && (
                        this.snake.some(s => s.x === newObs.x && s.y === newObs.y) ||
                        this.obstacles.some(o => o.x === newObs.x && o.y === newObs.y) ||
                        (this.food && newObs.x === this.food.x && newObs.y === this.food.y) ||
                        isInSafeZone(newObs.x, newObs.y)
                    ));

                    if (attempts < 50) {
                        this.obstacles.push(newObs);
                    }
                }
            }
            // TODO: Ajouter skull, wall_moving, etc.
        }

        logger.log(`[SoloGame] ${this.obstacles.length} obstacles générés pour le niveau`);
    }

    checkRoguelikeObjective() {
        if (!this.isRoguelikeMode || !this.roguelikeObjective) return;

        const obj = this.roguelikeObjective;

        if (obj.type === 'apples') {
            if (this.roguelikeProgress >= obj.count) {
                this.completeRoguelikeLevel();
            }
        }
        // TODO: Ajouter survival, boss, etc.
    }

    completeRoguelikeLevel() {
        logger.log(`[SoloGame] Niveau roguelike ${this.roguelikeLevelData.level} complété!`);

        // Pause le jeu
        this.paused = true;

        // Nettoyer le boss si présent
        this.cleanupBossFight();

        // Notifier le manager
        roguelikeManager.onAppleEaten(this.roguelikeProgress);
        roguelikeManager.completeLevel();
    }

    // ============================================
    // BOSS FIGHT
    // ============================================

    startBossFight() {
        const objective = this.roguelikeObjective;
        if (!objective || objective.type !== 'boss') return;

        // Mettre le jeu en pause et afficher l'intro
        this.paused = true;
        this.showBossIntro();
    }

    showBossIntro() {
        const levelData = this.roguelikeLevelData;
        const objective = this.roguelikeObjective;
        const isFirstBoss = levelData.level === 5;

        // Créer l'écran d'intro
        let introScreen = document.getElementById('boss-intro-screen');
        if (!introScreen) {
            introScreen = document.createElement('div');
            introScreen.id = 'boss-intro-screen';
            introScreen.className = 'boss-intro-screen';
            document.body.appendChild(introScreen);
        }

        // Formater le timer
        const mins = Math.floor((objective.timeLimit || 120) / 60);
        const secs = (objective.timeLimit || 120) % 60;
        const timerStr = secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}:00`;

        // Contenu avec tutoriel pour le premier boss
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

        introScreen.innerHTML = `
            <div class="boss-intro-icon">⚔️</div>
            <div class="boss-intro-title">BOSS</div>
            <div class="boss-intro-name">${levelData.name}</div>
            <div class="boss-intro-stats">
                <div class="boss-intro-stat">
                    <div class="boss-intro-stat-value">${objective.bossSegments || 15}</div>
                    <div class="boss-intro-stat-label">Segments</div>
                </div>
                <div class="boss-intro-stat">
                    <div class="boss-intro-stat-value">${timerStr}</div>
                    <div class="boss-intro-stat-label">Timer</div>
                </div>
            </div>
            ${tutorialHTML}
            <button class="boss-intro-btn" id="boss-intro-start">COMBATTRE</button>
        `;

        introScreen.classList.remove('hidden');

        // Event listener pour le bouton
        document.getElementById('boss-intro-start').addEventListener('click', () => {
            this.hideBossIntro();
            this.startBossFightAfterIntro();
        });

        logger.log(`[SoloGame] Écran intro boss affiché: ${levelData.name}`);
    }

    hideBossIntro() {
        const introScreen = document.getElementById('boss-intro-screen');
        if (introScreen) {
            introScreen.classList.add('hidden');
        }
    }

    startBossFightAfterIntro() {
        const objective = this.roguelikeObjective;
        const levelData = this.roguelikeLevelData;
        const bossSegments = objective.bossSegments || 15;

        logger.log(`[SoloGame] Démarrage combat de boss!`);

        this.isBossFight = true;
        this.bossDefeated = false;
        this.paused = false;

        // Position du boss : coin opposé au joueur (en haut à droite)
        const bossStartX = this.GRID_SIZE - 3;
        const bossStartY = 3;

        this.boss = {
            snake: [],
            dx: -1,
            dy: 0,
            ndx: -1,
            ndy: 0,
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
            isCharging: false,
            chargeDirection: null,
            chargeCooldown: 0,
            poisonTrail: [],
            teleportCooldown: 0,
            isTeleporting: false,
            clone: null,
            mirrorMoves: [],
            specialTimer: 0,
            invincible: false
        };

        // Créer les segments du boss
        for (let i = 0; i < bossSegments; i++) {
            this.boss.snake.push({ x: bossStartX + i, y: bossStartY });
        }

        // Démarrer le timer de grâce
        this.boss.graceTimer = this.boss.graceDelay;

        // Démarrer le timer principal
        this.bossTimer = objective.timeLimit || 120;
        this.startBossTimer();

        // Afficher l'UI du boss
        this.showBossUI();

        // Démarrer le spawn des épées
        this.startSwordSpawning();

        logger.log(`[SoloGame] Boss créé: ${bossSegments} seg, ${this.bossTimer}s, aggro ${this.boss.aggression * 100}%, grâce ${this.boss.graceDelay}s`);
    }

    startBossTimer() {
        // Nettoyer l'ancien timer si existe
        if (this.bossTimerInterval) {
            clearInterval(this.bossTimerInterval);
        }

        this.bossTimerInterval = setInterval(() => {
            if (this.paused || !this.running) return;

            // Gérer le délai de grâce
            if (this.boss && this.boss.isInGrace) {
                this.boss.graceTimer--;
                if (this.boss.graceTimer <= 0) {
                    this.boss.isInGrace = false;
                    logger.log('[SoloGame] Période de grâce terminée, le boss attaque!');
                }
            }

            // Gérer le timer de l'épée
            this.updateSwordTimer();

            this.bossTimer--;
            this.updateBossUI();

            if (this.bossTimer <= 0) {
                // Temps écoulé = défaite
                this.bossFightLost();
            }
        }, 1000);
    }

    updateBoss(timestamp) {
        if (!this.isBossFight || !this.boss || this.bossDefeated) return;

        // Pendant la période de grâce, le boss ne bouge pas
        if (this.boss.isInGrace) return;

        // Mettre à jour les comportements spéciaux (poison, charge, etc.)
        this.updateBossSpecialBehavior();

        // Nettoyer les murs temporaires expirés
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
        if (newHead.x < 0) newHead.x = this.GRID_SIZE - 1;
        if (newHead.x >= this.GRID_SIZE) newHead.x = 0;
        if (newHead.y < 0) newHead.y = this.GRID_SIZE - 1;
        if (newHead.y >= this.GRID_SIZE) newHead.y = 0;

        // Déplacer le boss
        this.boss.snake.unshift(newHead);
        this.boss.snake.pop();
    }

    updateBossAI() {
        if (!this.boss || this.boss.snake.length === 0) return;

        const bossHead = this.boss.snake[0];
        const playerHead = this.snake[0];

        // Déterminer la cible : épée si le boss n'en a pas, sinon le joueur
        let targetX, targetY;
        let shouldChaseTarget = false;

        if (!this.boss.hasSword && this.sword) {
            // Le boss n'a pas d'épée et il y en a une sur le terrain → la chercher
            targetX = this.sword.x;
            targetY = this.sword.y;
            shouldChaseTarget = true; // Toujours chercher l'épée activement
        } else if (this.boss.hasSword) {
            // Le boss a l'épée → chasser le joueur pour attaquer
            targetX = playerHead.x;
            targetY = playerHead.y;
            shouldChaseTarget = true; // Agressif quand armé
        } else {
            // Pas d'épée sur le terrain → patrouiller
            targetX = playerHead.x;
            targetY = playerHead.y;
            shouldChaseTarget = false;
        }

        // Calculer la direction vers la cible
        const diffX = targetX - bossHead.x;
        const diffY = targetY - bossHead.y;

        // Éviter de faire demi-tour (direction opposée)
        const possibleMoves = [];

        if (this.boss.dx !== 1) possibleMoves.push({ dx: -1, dy: 0, priority: diffX < 0 ? Math.abs(diffX) : 0 });
        if (this.boss.dx !== -1) possibleMoves.push({ dx: 1, dy: 0, priority: diffX > 0 ? Math.abs(diffX) : 0 });
        if (this.boss.dy !== 1) possibleMoves.push({ dx: 0, dy: -1, priority: diffY < 0 ? Math.abs(diffY) : 0 });
        if (this.boss.dy !== -1) possibleMoves.push({ dx: 0, dy: 1, priority: diffY > 0 ? Math.abs(diffY) : 0 });

        // Trier par priorité (meilleure direction vers la cible en premier)
        possibleMoves.sort((a, b) => b.priority - a.priority);

        // Agressivité : quand le boss a l'épée ou cherche l'épée, il est plus déterminé
        const baseAggression = this.boss.aggression || 0.5;
        const aggression = shouldChaseTarget ? Math.max(0.8, baseAggression) : baseAggression;

        if (Math.random() < aggression && possibleMoves.length > 0) {
            // Mode agressif : suivre la cible
            this.boss.ndx = possibleMoves[0].dx;
            this.boss.ndy = possibleMoves[0].dy;
        } else if (possibleMoves.length > 0) {
            // Mode passif : direction aléatoire (patrouille)
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            this.boss.ndx = randomMove.dx;
            this.boss.ndy = randomMove.dy;
        }
    }

    // ========== SYSTÈME DE PHASES BOSS ==========

    checkBossPhase() {
        if (!this.boss || !this.boss.phases || this.boss.phases.length === 0) return;

        const hpRatio = this.boss.snake.length / this.boss.maxSegments;
        const phases = this.boss.phases;

        // Trouver la phase actuelle basée sur le ratio HP
        let newPhaseIndex = 0;
        for (let i = phases.length - 1; i >= 0; i--) {
            if (hpRatio <= phases[i].threshold) {
                newPhaseIndex = i;
            }
        }

        // Si changement de phase
        if (newPhaseIndex !== this.boss.currentPhase) {
            this.transitionToPhase(newPhaseIndex);
        }
    }

    transitionToPhase(newPhaseIndex) {
        const oldPhase = this.boss.phases[this.boss.currentPhase];
        const newPhase = this.boss.phases[newPhaseIndex];

        logger.log(`[Boss] Transition de phase: ${oldPhase?.name} → ${newPhase.name}`);

        this.boss.currentPhase = newPhaseIndex;
        this.boss.phaseName = newPhase.name;
        this.boss.phaseColor = newPhase.color;
        this.boss.aggression = newPhase.aggression;

        // Ajuster la vitesse
        const baseInterval = this.roguelikeLevelData?.bossMoveInterval || 200;
        this.boss.moveInterval = baseInterval / newPhase.speedMultiplier;

        // Effet visuel de transition
        this.triggerPhaseTransition(newPhase);

        // Initialiser les mécaniques spéciales de la phase
        this.initPhaseSpecial(newPhase);

        // Mettre à jour l'UI
        this.updateBossUI();
    }

    triggerPhaseTransition(phase) {
        // Screen shake intense
        this.triggerScreenShake(15);

        // Particules de la couleur de la phase
        if (this.boss.snake.length > 0) {
            const head = this.boss.snake[0];
            this.createParticles(head.x, head.y, phase.color, 20);
        }

        // Flash de l'écran
        this.flashScreen(phase.color, 300);

        // Afficher le nom de la phase
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

        switch (special.type) {
            case 'poison_trail':
                this.boss.poisonTrail = [];
                break;

            case 'poison_spit':
                this.boss.specialTimer = Date.now();
                break;

            case 'poison_flood':
                this.boss.specialTimer = Date.now();
                break;

            case 'charge':
            case 'charge_wall':
            case 'charge_frenzy':
                this.boss.chargeCooldown = Date.now() + 2000; // 2s avant première charge
                this.boss.isCharging = false;
                this.boss.chargeCount = 0;
                break;

            case 'mirror':
                this.boss.mirrorMoves = [];
                break;

            case 'split':
                this.createBossClone(special);
                break;

            case 'teleport':
                this.boss.teleportCooldown = Date.now() + 2000;
                this.boss.isTeleporting = false;
                break;
        }
    }

    // ========== COMPORTEMENTS SPÉCIAUX ==========

    updateBossSpecialBehavior() {
        if (!this.boss || !this.boss.phases) return;

        const phase = this.boss.phases[this.boss.currentPhase];
        if (!phase || !phase.special) return;

        const special = phase.special;
        const now = Date.now();

        switch (phase.behavior) {
            case 'rage':
                this.updateRageBehavior();
                break;

            case 'poison_trail':
                this.updatePoisonTrail();
                break;

            case 'poison_spit':
                this.updatePoisonSpit(special, now);
                break;

            case 'poison_flood':
                this.updatePoisonFlood(special, now);
                break;

            case 'charge':
            case 'charge_wall':
            case 'charge_frenzy':
                this.updateChargeBehavior(special, now);
                break;

            case 'mirror':
                this.updateMirrorBehavior(special);
                break;

            case 'teleport':
                this.updateTeleportBehavior(special, now);
                break;
        }

        // Mettre à jour le poison trail (durée de vie)
        this.updatePoisonDecay();
    }

    // GARDIEN - Rage : mouvements plus erratiques et agressifs
    updateRageBehavior() {
        // En rage, le boss a une chance de changer de direction aléatoirement
        if (Math.random() < 0.1) {
            const directions = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
            ];
            const validDirs = directions.filter(d =>
                !(d.dx === -this.boss.dx && d.dy === -this.boss.dy)
            );
            const randomDir = validDirs[Math.floor(Math.random() * validDirs.length)];
            this.boss.ndx = randomDir.dx;
            this.boss.ndy = randomDir.dy;
        }
    }

    // VENIN - Poison Trail : laisse du poison derrière lui
    updatePoisonTrail() {
        if (this.boss.snake.length > 0) {
            const tail = this.boss.snake[this.boss.snake.length - 1];
            // Ajouter la position de la queue au trail
            this.boss.poisonTrail.push({
                x: tail.x,
                y: tail.y,
                createdAt: Date.now(),
                duration: 5000 // 5 secondes
            });
        }
    }

    // VENIN - Poison Spit : crache du poison vers le joueur
    updatePoisonSpit(special, now) {
        if (now - this.boss.specialTimer >= special.interval) {
            this.boss.specialTimer = now;
            this.spitPoison(special.range);
        }
    }

    spitPoison(range) {
        if (!this.boss || this.boss.snake.length === 0) return;

        const head = this.boss.snake[0];
        const playerHead = this.snake[0];

        // Direction vers le joueur
        const dx = Math.sign(playerHead.x - head.x);
        const dy = Math.sign(playerHead.y - head.y);

        // Créer des cases de poison en ligne
        for (let i = 1; i <= range; i++) {
            const x = head.x + dx * i;
            const y = head.y + dy * i;

            if (x >= 0 && x < this.GRID_SIZE && y >= 0 && y < this.GRID_SIZE) {
                this.boss.poisonTrail.push({
                    x, y,
                    createdAt: Date.now(),
                    duration: 4000,
                    isSpit: true
                });
            }
        }

        // Effet visuel
        this.createParticles(head.x, head.y, '#00ff00', 8);
    }

    // VENIN - Poison Flood : spawn du poison aléatoire
    updatePoisonFlood(special, now) {
        if (now - this.boss.specialTimer >= special.spawnRate) {
            this.boss.specialTimer = now;

            // Spawn 2-3 cases de poison aléatoires
            const count = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                const x = Math.floor(Math.random() * this.GRID_SIZE);
                const y = Math.floor(Math.random() * this.GRID_SIZE);

                this.boss.poisonTrail.push({
                    x, y,
                    createdAt: Date.now(),
                    duration: 6000,
                    isFlood: true
                });
            }
        }
    }

    updatePoisonDecay() {
        const now = Date.now();
        this.boss.poisonTrail = this.boss.poisonTrail.filter(p =>
            now - p.createdAt < p.duration
        );
    }

    // TITAN - Charge : le boss charge en ligne droite
    updateChargeBehavior(special, now) {
        if (this.boss.isCharging) {
            // Pendant la charge, continuer dans la direction
            return;
        }

        if (now >= this.boss.chargeCooldown) {
            this.startBossCharge(special);
        }
    }

    startBossCharge(special) {
        if (!this.boss || this.boss.snake.length === 0) return;

        const head = this.boss.snake[0];
        const playerHead = this.snake[0];

        // Déterminer la direction de charge (vers le joueur)
        const dx = playerHead.x - head.x;
        const dy = playerHead.y - head.y;

        // Choisir la direction principale (horizontale ou verticale)
        if (Math.abs(dx) > Math.abs(dy)) {
            this.boss.chargeDirection = { dx: Math.sign(dx), dy: 0 };
        } else {
            this.boss.chargeDirection = { dx: 0, dy: Math.sign(dy) };
        }

        // Avertissement visuel
        this.showChargeWarning();

        // Démarrer la charge après le délai d'avertissement
        setTimeout(() => {
            if (this.boss) {
                this.boss.isCharging = true;
                this.boss.ndx = this.boss.chargeDirection.dx;
                this.boss.ndy = this.boss.chargeDirection.dy;

                // Réduire l'intervalle de mouvement pendant la charge
                this.boss.originalMoveInterval = this.boss.moveInterval;
                this.boss.moveInterval = this.boss.moveInterval / special.chargeSpeed;

                // Si invincible pendant la charge
                if (special.invincible) {
                    this.boss.invincible = true;
                }

                // Terminer la charge après quelques mouvements
                setTimeout(() => this.endBossCharge(special), 1500);
            }
        }, special.chargeWarning || 1000);

        // Cooldown pour la prochaine charge
        this.boss.chargeCooldown = Date.now() + (special.chargeCooldown || 4000) + 1500;
    }

    showChargeWarning() {
        if (!this.boss || this.boss.snake.length === 0) return;

        const head = this.boss.snake[0];
        const dir = this.boss.chargeDirection;

        // Créer une ligne d'avertissement
        for (let i = 1; i <= 10; i++) {
            const x = head.x + dir.dx * i;
            const y = head.y + dir.dy * i;

            if (x >= 0 && x < this.GRID_SIZE && y >= 0 && y < this.GRID_SIZE) {
                this.createParticles(x, y, '#ffff00', 2);
            }
        }

        // Screen shake léger
        this.triggerScreenShake(5);
    }

    endBossCharge(special) {
        if (!this.boss) return;

        this.boss.isCharging = false;
        this.boss.invincible = false;

        // Restaurer l'intervalle normal
        if (this.boss.originalMoveInterval) {
            this.boss.moveInterval = this.boss.originalMoveInterval;
        }

        // Si charge_wall, créer des murs temporaires
        if (special.type === 'charge_wall' && special.wallCount) {
            this.createTemporaryWalls(special.wallCount, special.wallDuration);
        }

        // Si charge_frenzy, vérifier si on doit continuer
        if (special.type === 'charge_frenzy') {
            this.boss.chargeCount = (this.boss.chargeCount || 0) + 1;
            if (this.boss.chargeCount < special.chargeCount) {
                // Nouvelle charge immédiate
                setTimeout(() => this.startBossCharge(special), 500);
            } else {
                this.boss.chargeCount = 0;
            }
        }
    }

    createTemporaryWalls(count, duration) {
        if (!this.boss || this.boss.snake.length === 0) return;

        const head = this.boss.snake[0];

        for (let i = 0; i < count; i++) {
            // Créer des murs autour de la position actuelle
            const offsetX = (Math.random() - 0.5) * 6;
            const offsetY = (Math.random() - 0.5) * 6;
            const x = Math.floor(head.x + offsetX);
            const y = Math.floor(head.y + offsetY);

            if (x >= 0 && x < this.GRID_SIZE && y >= 0 && y < this.GRID_SIZE) {
                const wall = { x, y, temporary: true, expiresAt: Date.now() + duration * 1000 };
                this.obstacles.push(wall);

                // Effet visuel
                this.createParticles(x, y, '#ff6600', 5);
            }
        }
    }

    // NÉMÉSIS - Mirror : copie les mouvements du joueur
    updateMirrorBehavior(special) {
        // Enregistrer le mouvement du joueur
        this.boss.mirrorMoves.push({
            dx: this.dx,
            dy: this.dy,
            time: Date.now()
        });

        // Appliquer les mouvements avec délai
        const delayedMove = this.boss.mirrorMoves.find(m =>
            Date.now() - m.time >= special.delay
        );

        if (delayedMove) {
            // Copier la direction (avec possible inversion pour miroir)
            this.boss.ndx = delayedMove.dx;
            this.boss.ndy = delayedMove.dy;

            // Retirer ce mouvement de la liste
            this.boss.mirrorMoves = this.boss.mirrorMoves.filter(m => m !== delayedMove);
        }
    }

    // NÉMÉSIS - Teleport : téléportation et attaque surprise
    updateTeleportBehavior(special, now) {
        if (this.boss.isTeleporting) return;

        if (now >= this.boss.teleportCooldown) {
            this.startBossTeleport(special);
        }
    }

    startBossTeleport(special) {
        if (!this.boss || this.boss.snake.length === 0) return;

        this.boss.isTeleporting = true;

        // Effet de disparition
        const head = this.boss.snake[0];
        this.createParticles(head.x, head.y, '#ff00ff', 15);

        // Avertissement à la nouvelle position
        setTimeout(() => {
            if (!this.boss) return;

            // Nouvelle position : près du joueur mais pas sur lui
            const playerHead = this.snake[0];
            const offset = 3 + Math.floor(Math.random() * 3);
            const angle = Math.random() * Math.PI * 2;

            let newX = Math.floor(playerHead.x + Math.cos(angle) * offset);
            let newY = Math.floor(playerHead.y + Math.sin(angle) * offset);

            // Clamp aux limites
            newX = Math.max(2, Math.min(this.GRID_SIZE - 3, newX));
            newY = Math.max(2, Math.min(this.GRID_SIZE - 3, newY));

            // Avertissement visuel
            this.createParticles(newX, newY, '#ff00ff', 10);
            this.triggerScreenShake(8);

            // Téléportation effective après le warning
            setTimeout(() => {
                if (!this.boss) return;

                // Déplacer le boss
                const dx = newX - this.boss.snake[0].x;
                const dy = newY - this.boss.snake[0].y;

                this.boss.snake.forEach(segment => {
                    segment.x += dx;
                    segment.y += dy;
                });

                // Effet d'apparition
                this.createParticles(newX, newY, '#ff00ff', 20);

                this.boss.isTeleporting = false;
                this.boss.teleportCooldown = Date.now() + special.teleportCooldown;
            }, special.teleportWarning);

        }, 200);
    }

    // NÉMÉSIS - Split : créer un clone du boss
    createBossClone(special) {
        if (!this.boss || this.boss.clone) return;

        const cloneSegments = Math.floor(this.boss.snake.length * special.cloneHP);
        if (cloneSegments < 3) return;

        // Position du clone : opposé au boss
        const bossHead = this.boss.snake[0];
        const cloneX = this.GRID_SIZE - bossHead.x;
        const cloneY = this.GRID_SIZE - bossHead.y;

        this.boss.clone = {
            snake: [],
            dx: -this.boss.dx,
            dy: -this.boss.dy,
            speed: special.cloneSpeed,
            moveInterval: this.boss.moveInterval / special.cloneSpeed,
            lastMoveTime: 0
        };

        // Créer les segments du clone
        for (let i = 0; i < cloneSegments; i++) {
            this.boss.clone.snake.push({
                x: Math.min(this.GRID_SIZE - 1, Math.max(0, cloneX + i)),
                y: cloneY
            });
        }

        // Effet visuel
        this.createParticles(cloneX, cloneY, '#aa00ff', 20);
        this.flashScreen('#aa00ff', 200);

        logger.log(`[Boss] Clone créé avec ${cloneSegments} segments`);
    }

    checkBossCollisions() {
        if (!this.isBossFight || !this.boss || this.boss.snake.length === 0) return;

        const playerHead = this.snake[0];
        const bossHead = this.boss.snake[0];

        // 0a. Vérifier si le joueur ramasse l'épée
        if (this.sword && playerHead.x === this.sword.x && playerHead.y === this.sword.y) {
            this.collectSword();
        }

        // 0b. Vérifier si le boss ramasse l'épée
        if (this.sword && bossHead.x === this.sword.x && bossHead.y === this.sword.y) {
            this.bossCollectSword();
        }

        // 0c. Vérifier collision joueur avec poison
        if (this.boss.poisonTrail && this.boss.poisonTrail.length > 0) {
            const poisonHit = this.boss.poisonTrail.find(p =>
                p.x === playerHead.x && p.y === playerHead.y
            );
            if (poisonHit && !this.powerupEffects.ghost && !this.powerupEffects.invincible) {
                this.playerHitPoison();
            }
        }

        // 0d. Vérifier collision joueur avec clone du boss
        if (this.boss.clone && this.boss.clone.snake.length > 0) {
            this.checkCloneCollisions(playerHead);
        }

        // 1. Tête contre tête = combat selon qui a l'épée
        if (playerHead.x === bossHead.x && playerHead.y === bossHead.y) {
            this.handleHeadToHeadCollision();
            return;
        }

        // 2. Joueur touche le corps du boss
        for (let i = 1; i < this.boss.snake.length; i++) {
            const segment = this.boss.snake[i];
            if (playerHead.x === segment.x && playerHead.y === segment.y) {
                // Si boss invincible (pendant charge), pas de dégâts
                if (this.boss.invincible) {
                    this.playerHitBossWithoutSword();
                    return;
                }
                if (this.swordActive) {
                    // Avec épée = vole 5 segments
                    this.playerStealsBossSegments();
                } else {
                    // Sans épée = le joueur perd 2 segments
                    this.playerHitBossWithoutSword();
                }
                return;
            }
        }

        // 3. Boss touche le corps du joueur
        for (let i = 1; i < this.snake.length; i++) {
            const segment = this.snake[i];
            if (bossHead.x === segment.x && bossHead.y === segment.y) {
                if (this.boss.hasSword) {
                    // Boss avec épée = vole 5 segments au joueur
                    this.bossStealsPlayerSegments();
                }
                // Boss sans épée = rien ne se passe (il ne peut pas attaquer)
                return;
            }
        }

        // Vérifier changement de phase du boss
        this.checkBossPhase();
    }

    // Collision avec le poison du boss VENIN
    playerHitPoison() {
        logger.log('[SoloGame] Joueur touché par le poison!');

        // Perte de 1 segment
        if (this.snake.length > 3) {
            this.snake.pop();
        }

        // Effet visuel
        this.triggerScreenShake(5);
        this.createParticles(this.snake[0].x, this.snake[0].y, '#00ff00', 5);

        // Vérifier défaite
        if (this.snake.length <= 3) {
            this.bossFightLost();
        }

        this.updateBossUI();
    }

    // Collision avec le clone du boss NÉMÉSIS
    checkCloneCollisions(playerHead) {
        const clone = this.boss.clone;
        if (!clone || clone.snake.length === 0) return;

        // Tête du clone
        const cloneHead = clone.snake[0];

        // Joueur touche le clone
        for (let i = 0; i < clone.snake.length; i++) {
            const segment = clone.snake[i];
            if (playerHead.x === segment.x && playerHead.y === segment.y) {
                if (this.swordActive && i > 0) {
                    // Attaquer le clone avec l'épée
                    this.attackClone();
                } else {
                    // Le clone fait perdre 1 segment
                    if (this.snake.length > 3) {
                        this.snake.pop();
                        this.triggerScreenShake(5);
                        this.createParticles(playerHead.x, playerHead.y, '#aa00ff', 5);
                    }
                    if (this.snake.length <= 3) {
                        this.bossFightLost();
                    }
                }
                return;
            }
        }
    }

    attackClone() {
        if (!this.boss.clone) return;

        // Retirer 3 segments au clone
        for (let i = 0; i < 3; i++) {
            if (this.boss.clone.snake.length > 0) {
                this.boss.clone.snake.pop();
            }
        }

        // Consommer l'épée
        this.swordActive = false;
        this.swordTimer = 0;

        // Effet visuel
        this.createParticles(this.boss.clone.snake[0]?.x || 15, this.boss.clone.snake[0]?.y || 15, '#aa00ff', 10);

        // Si clone détruit
        if (this.boss.clone.snake.length === 0) {
            logger.log('[Boss] Clone détruit!');
            this.boss.clone = null;
            this.flashScreen('#aa00ff', 200);
        }

        this.updateBossUI();
    }

    // Nettoyer les murs temporaires expirés
    cleanupTemporaryWalls() {
        const now = Date.now();
        this.obstacles = this.obstacles.filter(o => {
            if (o.temporary && o.expiresAt && now >= o.expiresAt) {
                // Effet de disparition
                this.createParticles(o.x, o.y, '#ff6600', 3);
                return false;
            }
            return true;
        });
    }

    handleHeadToHeadCollision() {
        logger.log('[SoloGame] Collision tête contre tête!');

        // Les deux perdent 3 segments (mais gardent le minimum)
        const playerLoss = Math.min(3, this.snake.length - 3);
        const bossLoss = Math.min(3, this.boss.snake.length - 1);

        for (let i = 0; i < playerLoss; i++) {
            if (this.snake.length > 3) this.snake.pop();
        }
        for (let i = 0; i < bossLoss; i++) {
            if (this.boss.snake.length > 0) this.boss.snake.pop();
        }

        // Effet visuel
        this.triggerScreenShake(10);

        // Vérifier si le joueur est mort (0 segments affichés = 3 segments réels)
        if (this.snake.length <= 3) {
            this.bossFightLost();
            return;
        }

        // Vérifier si le boss est vaincu
        if (this.boss.snake.length === 0) {
            this.bossFightWon();
        }

        this.updateBossUI();
    }

    playerHitBossWithoutSword() {
        // Sans épée, le joueur perd 2 segments
        logger.log('[SoloGame] Joueur touche le boss sans épée! Perte de segments.');

        const segmentsLost = Math.min(2, this.snake.length - 3);
        for (let i = 0; i < segmentsLost; i++) {
            if (this.snake.length > 3) this.snake.pop();
        }

        // Achievement tracking
        if (segmentsLost > 0) {
            achievementManager.onDamageTaken(segmentsLost);
        }

        // Effet visuel
        this.triggerScreenShake(8);
        this.createParticles(this.snake[0].x, this.snake[0].y, '#ff0000', 5);

        // Vérifier défaite (0 segments affichés = 3 segments réels)
        if (this.snake.length <= 3) {
            this.bossFightLost();
        }

        this.updateBossUI();
    }

    playerStealsBossSegments() {
        // Avec épée = vole 5 segments
        const segmentsToSteal = 5;
        const actualStolen = Math.min(segmentsToSteal, this.boss.snake.length);

        logger.log(`[SoloGame] Joueur vole ${actualStolen} segments au boss avec l'épée!`);

        for (let i = 0; i < actualStolen; i++) {
            if (this.boss.snake.length > 0) {
                this.boss.snake.pop();
                // Le joueur gagne le segment
                this.snake.push({ ...this.snake[this.snake.length - 1] });
            }
        }

        // Achievement tracking
        achievementManager.onSegmentsStolen(actualStolen);

        // Consommer l'épée après utilisation
        this.swordActive = false;
        this.swordTimer = 0;

        // Effet sonore et visuel
        if (window.audio) window.audio.eat?.();
        this.createParticles(this.snake[0].x, this.snake[0].y, '#ffd700', 8);  // Particules dorées
        this.triggerScreenShake(5);

        // Vérifier victoire
        if (this.boss.snake.length === 0) {
            this.bossFightWon();
        }

        this.updateBossUI();
    }

    bossStealsPlayerSegments() {
        // Le boss avec épée vole 5 segments au joueur
        const segmentsToSteal = 5;
        const segmentsLost = Math.min(segmentsToSteal, this.snake.length - 3); // Garder au moins 3 (tête+corps+queue)

        logger.log(`[SoloGame] Boss attaque avec l'épée! Perte de ${segmentsLost} segments.`);

        for (let i = 0; i < segmentsLost; i++) {
            if (this.snake.length > 3) {
                this.snake.pop();
                // Le boss gagne le segment
                this.boss.snake.push({ ...this.boss.snake[this.boss.snake.length - 1] });
            }
        }

        // Achievement tracking
        if (segmentsLost > 0) {
            achievementManager.onDamageTaken(segmentsLost);
        }

        // Consommer l'épée du boss après utilisation
        this.boss.hasSword = false;
        this.boss.swordTimer = 0;

        // Effet visuel
        this.triggerScreenShake(10);
        this.createParticles(this.snake[0].x, this.snake[0].y, '#ff0000', 8);

        // Vérifier défaite : game over si 0 segments affichés (= 3 segments réels)
        if (this.snake.length <= 3) {
            this.bossFightLost();
        }

        this.updateBossUI();
    }

    // ========== GESTION DE L'ÉPÉE ==========

    collectSword() {
        logger.log('[SoloGame] Épée ramassée par le joueur!');

        this.sword = null;
        this.swordActive = true;
        this.swordTimer = this.swordDuration;

        // Achievement tracking
        achievementManager.onSwordCollected();

        // Effet visuel et sonore
        if (window.audio) window.audio.powerup?.();
        this.createParticles(this.snake[0].x, this.snake[0].y, '#ffd700', 10);
    }

    bossCollectSword() {
        logger.log('[SoloGame] Épée ramassée par le boss!');

        this.sword = null;
        this.boss.hasSword = true;
        this.boss.swordTimer = this.swordDuration; // Même durée que le joueur

        // Effet visuel (couleur différente pour le boss)
        if (window.audio) window.audio.powerup?.();
        this.createParticles(this.boss.snake[0].x, this.boss.snake[0].y, '#ff4444', 10);
    }

    spawnSword() {
        // Ne pas spawn si une épée existe déjà, si le joueur en a une, ou si le boss en a une
        if (this.sword || this.swordActive || this.boss?.hasSword) return;

        // Trouver une position libre
        let attempts = 0;
        let pos = null;

        while (attempts < 50 && !pos) {
            const x = Math.floor(Math.random() * (this.GRID_SIZE - 4)) + 2;
            const y = Math.floor(Math.random() * (this.GRID_SIZE - 4)) + 2;

            // Vérifier que c'est pas sur le serpent, le boss ou un obstacle
            const onSnake = this.snake.some(s => s.x === x && s.y === y);
            const onBoss = this.boss?.snake.some(s => s.x === x && s.y === y);
            const onObstacle = this.obstacles.some(o => o.x === x && o.y === y);

            if (!onSnake && !onBoss && !onObstacle) {
                pos = { x, y };
            }
            attempts++;
        }

        if (pos) {
            this.sword = pos;
            logger.log(`[SoloGame] Épée apparue en (${pos.x}, ${pos.y})`);
        }
    }

    startSwordSpawning() {
        // Spawn la première épée après 3 secondes
        setTimeout(() => {
            if (this.isBossFight && !this.bossDefeated) {
                this.spawnSword();
            }
        }, 3000);

        // Puis spawn toutes les 8 secondes si besoin
        this.swordSpawnInterval = setInterval(() => {
            if (this.isBossFight && !this.bossDefeated && !this.sword && !this.swordActive) {
                this.spawnSword();
            }
        }, 8000);
    }

    updateSwordTimer() {
        // Timer épée du joueur
        if (this.swordActive && this.swordTimer > 0) {
            this.swordTimer--;
            if (this.swordTimer <= 0) {
                this.swordActive = false;
                logger.log('[SoloGame] Épée du joueur expirée!');
            }
        }

        // Timer épée du boss
        if (this.boss?.hasSword && this.boss.swordTimer > 0) {
            this.boss.swordTimer--;
            if (this.boss.swordTimer <= 0) {
                this.boss.hasSword = false;
                logger.log('[SoloGame] Épée du boss expirée!');
            }
        }
    }

    drawSword() {
        if (!this.sword) return;

        const ctx = this.ctx;
        const x = this.sword.x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const y = this.sword.y * this.CELL_SIZE + this.CELL_SIZE / 2;
        const size = this.CELL_SIZE * 0.8;

        // Animation de flottement
        const float = Math.sin(Date.now() / 200) * 3;

        ctx.save();
        ctx.translate(x, y + float);

        // Lueur dorée
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;

        // Dessiner l'épée (emoji ou forme)
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔️', 0, 0);

        ctx.restore();
    }

    bossFightWon() {
        logger.log('[SoloGame] Boss vaincu!');

        // Achievement tracking
        const bossName = this.roguelikeLevelData?.name || 'BOSS';
        const segmentsLostDuringFight = (this.bossStartPlayerSegments || this.snake.length) - this.snake.length;
        achievementManager.onBossKilled(bossName, this.bossTimer, segmentsLostDuringFight);

        this.bossDefeated = true;
        this.cleanupBossFight();

        // Effet de victoire
        if (window.audio) window.audio.victory?.();
        this.triggerScreenShake(15);

        // Compléter le niveau
        this.completeRoguelikeLevel();
    }

    bossFightLost() {
        logger.log('[SoloGame] Défaite contre le boss!');

        this.cleanupBossFight();

        // Déclencher game over
        this.gameOver();
    }

    cleanupBossFight() {
        this.isBossFight = false;
        this.boss = null;

        if (this.bossTimerInterval) {
            clearInterval(this.bossTimerInterval);
            this.bossTimerInterval = null;
        }

        // Nettoyer l'épée
        if (this.swordSpawnInterval) {
            clearInterval(this.swordSpawnInterval);
            this.swordSpawnInterval = null;
        }
        this.sword = null;
        this.swordActive = false;
        this.swordTimer = 0;

        this.hideBossUI();
    }

    showBossUI() {
        const container = document.getElementById('roguelike-objective');
        if (container) {
            container.innerHTML = `
                <div class="boss-ui">
                    <div class="boss-header">
                        <div class="boss-name">${this.roguelikeLevelData.name}</div>
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
        // Barre de vie du boss
        const healthFill = document.getElementById('boss-health-fill');
        const healthText = document.getElementById('boss-health-text');
        const timerEl = document.getElementById('boss-timer');
        const phaseEl = document.getElementById('boss-phase');

        if (this.boss && healthFill && healthText) {
            const maxSegments = this.roguelikeObjective.bossSegments || 15;
            const currentSegments = this.boss.snake.length;
            const percent = (currentSegments / maxSegments) * 100;

            healthFill.style.width = `${percent}%`;
            healthText.textContent = `${currentSegments}/${maxSegments}`;

            // Couleur de la barre selon la phase
            const phaseColor = this.boss.phaseColor || '#ff4444';
            healthFill.style.backgroundColor = phaseColor;
            healthFill.style.boxShadow = `0 0 10px ${phaseColor}`;
        }

        // Afficher la phase actuelle
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

            // Rouge si temps critique
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
            // Restaurer le HTML original pour l'affichage des pommes
            container.innerHTML = `
                <span class="rl-obj-icon">🎯</span>
                <span class="rl-obj-text">Stage <span id="rl-obj-level">1</span></span>
                <span class="rl-obj-progress"><span id="rl-obj-current">0</span>/<span id="rl-obj-target">8</span> 🍎</span>
            `;
            container.classList.add('hidden');
        }
    }

    drawBoss() {
        if (!this.boss || this.boss.snake.length === 0) return;

        const ctx = this.ctx;
        const cellSize = this.CELL_SIZE;

        // Couleur de base selon la phase
        const phaseColor = this.boss.phaseColor || '#ff0000';
        const isCharging = this.boss.isCharging;
        const isInvincible = this.boss.invincible;

        // Dessiner chaque segment du boss
        this.boss.snake.forEach((segment, index) => {
            const x = segment.x * cellSize;
            const y = segment.y * cellSize;

            // Couleur du boss selon phase et état
            if (index === 0) {
                // Tête du boss
                if (isCharging) {
                    ctx.fillStyle = '#ffff00';  // Jaune pendant la charge
                    ctx.shadowColor = '#ffff00';
                    ctx.shadowBlur = 20;
                } else if (isInvincible) {
                    ctx.fillStyle = '#ffffff';  // Blanc si invincible
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 25;
                } else {
                    ctx.fillStyle = this.boss.hasSword ? '#ff4400' : phaseColor;
                    ctx.shadowColor = this.boss.hasSword ? '#ff8800' : phaseColor;
                    ctx.shadowBlur = this.boss.hasSword ? 15 : 10;
                }
            } else {
                // Corps du boss - légèrement plus sombre
                if (isCharging) {
                    ctx.fillStyle = '#cccc00';
                } else if (isInvincible) {
                    ctx.fillStyle = '#cccccc';
                } else {
                    ctx.fillStyle = this.boss.hasSword ? '#cc2200' : this.darkenColor(phaseColor, 30);
                }
                ctx.shadowBlur = 0;
            }

            // Dessiner le segment
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 4);
            ctx.fill();

            // Yeux sur la tête
            if (index === 0) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                const eyeSize = cellSize / 5;
                ctx.beginPath();
                ctx.arc(x + cellSize * 0.3, y + cellSize * 0.35, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + cellSize * 0.7, y + cellSize * 0.35, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                // Pupilles (couleur selon état)
                ctx.fillStyle = isCharging ? '#ff0000' : (this.boss.hasSword ? '#ff0000' : '#000000');
                ctx.beginPath();
                ctx.arc(x + cellSize * 0.3, y + cellSize * 0.35, eyeSize / 2, 0, Math.PI * 2);
                ctx.arc(x + cellSize * 0.7, y + cellSize * 0.35, eyeSize / 2, 0, Math.PI * 2);
                ctx.fill();

                // Épée au-dessus de la tête si le boss est armé
                if (this.boss.hasSword) {
                    ctx.font = `${cellSize * 0.6}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText('⚔️', x + cellSize / 2, y - 2);
                }

                // Indicateur de charge (!)
                if (isCharging) {
                    ctx.font = `bold ${cellSize * 0.8}px Arial`;
                    ctx.fillStyle = '#ff0000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText('!', x + cellSize / 2, y - 5);
                }
            }
        });

        ctx.shadowBlur = 0;
    }

    // Assombrir une couleur hex
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    // Dessiner le poison du boss VENIN
    drawPoisonTrail() {
        if (!this.boss || !this.boss.poisonTrail || this.boss.poisonTrail.length === 0) return;

        const ctx = this.ctx;
        const cellSize = this.CELL_SIZE;
        const now = Date.now();

        this.boss.poisonTrail.forEach(poison => {
            const x = poison.x * cellSize;
            const y = poison.y * cellSize;

            // Opacité basée sur le temps restant
            const elapsed = now - poison.createdAt;
            const remaining = poison.duration - elapsed;
            const opacity = Math.max(0.2, remaining / poison.duration);

            // Couleur selon le type de poison
            let color = '#00ff00';
            if (poison.isSpit) color = '#44ff00';
            if (poison.isFlood) color = '#88ff00';

            // Effet de pulsation
            const pulse = 0.8 + Math.sin(now / 200 + poison.x + poison.y) * 0.2;

            ctx.save();
            ctx.globalAlpha = opacity * pulse;

            // Dessiner le poison
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Bulles de poison
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = opacity * 0.5;
            ctx.beginPath();
            ctx.arc(x + cellSize * 0.3, y + cellSize * 0.3, cellSize * 0.1, 0, Math.PI * 2);
            ctx.arc(x + cellSize * 0.6, y + cellSize * 0.5, cellSize * 0.08, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    // Dessiner le clone du boss NÉMÉSIS
    drawBossClone() {
        if (!this.boss || !this.boss.clone || this.boss.clone.snake.length === 0) return;

        const ctx = this.ctx;
        const cellSize = this.CELL_SIZE;
        const clone = this.boss.clone;

        // Le clone est semi-transparent et violet
        ctx.save();
        ctx.globalAlpha = 0.7;

        clone.snake.forEach((segment, index) => {
            const x = segment.x * cellSize;
            const y = segment.y * cellSize;

            if (index === 0) {
                // Tête du clone
                ctx.fillStyle = '#aa00ff';
                ctx.shadowColor = '#aa00ff';
                ctx.shadowBlur = 12;
            } else {
                // Corps du clone
                ctx.fillStyle = '#7700aa';
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 4);
            ctx.fill();

            // Yeux sur la tête du clone
            if (index === 0) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                const eyeSize = cellSize / 5;
                ctx.beginPath();
                ctx.arc(x + cellSize * 0.3, y + cellSize * 0.35, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + cellSize * 0.7, y + cellSize * 0.35, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                // Pupilles violettes
                ctx.fillStyle = '#aa00ff';
                ctx.beginPath();
                ctx.arc(x + cellSize * 0.3, y + cellSize * 0.35, eyeSize / 2, 0, Math.PI * 2);
                ctx.arc(x + cellSize * 0.7, y + cellSize * 0.35, eyeSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }

    reset() {
        // Réinitialiser serpent (centre de la grille 30x30) - 3 segments: tête, corps, queue
        this.snake = [
            { x: 15, y: 15 },  // Tête
            { x: 14, y: 15 },  // Corps
            { x: 13, y: 15 }   // Queue
        ];
        this.dx = 1;
        this.dy = 0;
        this.ndx = 1;
        this.ndy = 0;

        // ✅ Reset flags
        this.gameOverTriggered = false;
        this.isExploding = false;
        this.isFlashing = false;

        // Reset boss fight
        this.cleanupBossFight();

        // Reset régénération
        this.stopRegeneration();

        // Reset score boost (Combo Master)
        if (this.scoreBoostTimer) {
            clearTimeout(this.scoreBoostTimer);
            this.scoreBoostTimer = null;
        }
        this.scoreBoostActive = false;
        this.scoreBoostMultiplier = 1;

        // Reset roguelike progress (mais PAS le mode)
        this.roguelikeProgress = 0;

        // Réinitialiser scores
        this.score = 0;
        this.level = 1;
        this.foodCount = 0;
        this.combo = 1;
        this.maxCombo = 1;

        // Réinitialiser éléments
        this.obstacles = [];
        this.powerup = null;

        // Réinitialiser stats
        this.wallsDestroyed = 0;
        this.skullsEaten = 0;
        this.maxSnakeLength = 1;
        this.slowCount = 0;
        this.doubleCount = 0;
        this.invincibleCount = 0;
        this.ghostCount = 0;

        // Réinitialiser power-ups
        this.powerupEffects = { slow: false, double: false, invincible: false, ghost: false };
        this.activePowerup = null;
        this.particles = [];

        // 🧘 PATIENCE: Tracker si le joueur a attendu 1 min avant de changer de direction
        this.firstDirectionChangeTime = null;

        // 🌀 TÉLÉPORTATION: Tracker si le joueur a traversé un bord
        this.hasTeleported = false;

        // ✅ Réinitialiser la barre power-up
        const container = document.getElementById('powerup-bar-container');
        const emoji = document.getElementById('powerup-emoji');
        const fill = document.getElementById('powerup-fill');

        if (container) {
            container.className = '';  // ✅ Retirer classes
        }

        if (emoji) {
            emoji.textContent = '\u00A0';  // ✅ Espace insécable (garde la largeur fixe)
        }

        if (fill) {
            fill.style.width = '0%';   // ✅ Vider barre
        }

        // Générer nourriture et crâne
        this.spawnFood();
        this.spawnBad();

        // Mettre à jour UI
        this.updateUI();
    }

    // ============================================
    // BOUCLE PRINCIPALE (surcharge BaseSnakeGame)
    // ============================================

    loop(timestamp) {
        // ✅ FIX #1: Vérifier AVANT de programmer le prochain RAF
        if (!this.running) return;

        if (this.paused) {
            this.draw();
            // ✅ Programmer RAF même en pause pour continuer à afficher
            this.raf = requestAnimationFrame((t) => this.loop(t));
            return;
        }

        // Calculer vitesse selon difficulté et niveau
        let speed = this.calculateSpeed();

        // ✅ SPÉCIFICITÉ SOLO: Ralentissement si power-up actif
        if (this.powerupEffects.slow) {
            speed *= 1.5;
        }

        // Update si assez de temps écoulé
        if (timestamp - this.lastTime > speed) {
            this.lastTime = timestamp;
            this.update();
        }

        // ========== BOSS UPDATE ==========
        if (this.isBossFight) {
            this.updateBoss(timestamp);
        }

        // ✅ SPÉCIFICITÉ SOLO: Mettre à jour la barre power-up
        this.updatePowerupBar();

        // Mettre à jour particules
        this.updateParticles();

        // Dessiner
        this.draw();

        // ✅ FIX #1: Programmer le prochain RAF à la FIN (évite frames fantômes)
        this.raf = requestAnimationFrame((t) => this.loop(t));
    }

    // ============================================
    // VITESSE (surcharge pour roguelike)
    // ============================================

    calculateSpeed() {
        // Vitesse de base selon difficulté
        const baseSpeed = this.difficulty === 0 ? 2.5 :
                         this.difficulty === 1 ? 5 : 8;

        let speed = 1000 / (baseSpeed + (this.level - 1) * 0.5);

        // Appliquer le speedMultiplier du niveau roguelike
        if (this.isRoguelikeMode && this.roguelikeLevelData?.modifiers?.speedMultiplier) {
            // speedMultiplier > 1 = plus rapide, donc on divise le délai
            speed = speed / this.roguelikeLevelData.modifiers.speedMultiplier;
        }

        // Appliquer le sprint boost
        if (this.sprintActive && this.sprintSpeedBoost) {
            speed = speed / this.sprintSpeedBoost;
        }

        return speed;
    }

    // ============================================
    // UPDATE (LOGIQUE DU JEU)
    // ============================================

    update() {
        // Appliquer changement de direction
        this.dx = this.ndx;
        this.dy = this.ndy;
        this.locked = false;

        // Calculer nouvelle position tête
        let head = {
            x: this.snake[0].x + this.dx,
            y: this.snake[0].y + this.dy
        };

        // Wrapping (téléportation aux bords)
        let didTeleport = false;
        if (head.x < 0) { head.x = this.GRID_SIZE - 1; didTeleport = true; }
        if (head.x >= this.GRID_SIZE) { head.x = 0; didTeleport = true; }
        if (head.y < 0) { head.y = this.GRID_SIZE - 1; didTeleport = true; }
        if (head.y >= this.GRID_SIZE) { head.y = 0; didTeleport = true; }

        // 🌀 Tracker première téléportation
        if (didTeleport && !this.hasTeleported) {
            this.hasTeleported = true;
        }

        // Vérifier collision avec nourriture
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood(head);
            return;
        }

        // Vérifier collision avec crâne
        if (head.x === this.bad.x && head.y === this.bad.y) {
            this.eatSkull(head);
            return;
        }

        // Vérifier collision avec power-up
        if (this.powerup && head.x === this.powerup.x && head.y === this.powerup.y) {
            this.eatPowerup(head);
            return;
        }

        // Déplacement normal
        this.snake.unshift(head);
        this.snake.pop();

        // Vérifier collision avec soi-même
        if (this.snake.slice(1).some(s => s.x === head.x && s.y === head.y)) {
            if (!this.powerupEffects.invincible) {
                if (this.audio) this.audio.die();
                this.gameOver();
                return;
            }
        }

        // Vérifier collision avec obstacles
        if (this.obstacles.some(o => o.x === head.x && o.y === head.y)) {
            // ✅ Mode GHOST : traverse les murs (prioritaire)
            if (this.powerupEffects.ghost) {
                // Ne rien faire - passage à travers
            } else if (this.powerupEffects.invincible) {
                // Détruire le mur
                const obsIndex = this.obstacles.findIndex(o => o.x === head.x && o.y === head.y);
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

        // ========== BOSS FIGHT ==========
        if (this.isBossFight) {
            this.checkBossCollisions();
        }
    }

    // ============================================
    // GESTION DES COLLECTES
    // ============================================

    eatFood(head) {
        // Calculer points
        let diffMultiplier = this.difficulty === 0 ? 1 : this.difficulty === 1 ? 1.5 : 2;

        // Appliquer multiplicateur roguelike si actif
        let roguelikeMultiplier = 1;
        if (this.isRoguelikeMode && this.roguelikeModifiers?.scoreMultiplier) {
            roguelikeMultiplier = this.roguelikeModifiers.scoreMultiplier;
        }

        // Appliquer apple_score upgrade (+2 par pomme au lieu de +1 base)
        let baseAppleScore = 10;
        if (this.isRoguelikeMode && this.roguelikeModifiers?.appleScore) {
            baseAppleScore = 10 * this.roguelikeModifiers.appleScore;
        }

        let points = Math.floor(baseAppleScore * this.combo * (this.powerupEffects.double ? 2 : 1) * diffMultiplier * roguelikeMultiplier);

        // Combo Master : score x2 pendant 30s (si actif)
        if (this.scoreBoostActive && this.scoreBoostMultiplier > 1) {
            points *= this.scoreBoostMultiplier;
        }

        // Pomme dorée (upgrade Fortune) - 10% chance par stack
        let isGoldenApple = false;
        if (this.isRoguelikeMode && this.roguelikeModifiers?.passives) {
            const goldenUpgrade = this.roguelikeModifiers.passives.find(p => p.type === 'golden_apple');
            if (goldenUpgrade && Math.random() < goldenUpgrade.chance) {
                isGoldenApple = true;
                points += goldenUpgrade.value * 10;  // +100 points bonus
                this.createParticles(head.x, head.y, '#ffd700', 10);
                logger.log('[SoloGame] Pomme dorée! +' + (goldenUpgrade.value * 10) + ' bonus');
            }
        }

        this.score += points;
        this.foodCount++;
        if (this.audio) this.audio.eat();

        // ========== ACHIEVEMENTS ==========
        if (this.isRoguelikeMode) {
            achievementManager.onAppleEaten();
            achievementManager.onScoreUpdate(this.score);
            achievementManager.onSegmentsUpdate(this.snake.length);
        }

        // ========== MODE ROGUELIKE ==========
        if (this.isRoguelikeMode) {
            this.roguelikeProgress++;
            roguelikeManager.onAppleEaten(1);

            // Vérifier objectif
            if (this.roguelikeObjective?.type === 'apples') {
                if (this.roguelikeProgress >= this.roguelikeObjective.count) {
                    // Niveau complété!
                    this.completeRoguelikeLevel();
                    return;
                }
            }
        }

        // Monter de niveau tous les 5 pommes (mode classique uniquement)
        if (!this.isRoguelikeMode && this.foodCount % 5 === 0) {
            this.level++;
            if (this.audio) this.audio.lvlup();
            this.spawnObstacles();
        }

        // Augmenter combo
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        // Achievement tracking combo
        achievementManager.onComboUpdate(this.combo);

        // Grandir
        this.snake.unshift(head);

        // Tracker longueur max
        if (this.snake.length > this.maxSnakeLength) {
            this.maxSnakeLength = this.snake.length;
        }

        // Générer nouvelle nourriture
        this.spawnFood();
        this.spawnBad();
        this.spawnPowerup();

        this.updateUI();
    }

    eatSkull(head) {
        this.skullsEaten++;

        // ✨ NOUVEAU COMPORTEMENT: Combo divisé par 2 (garde tous les segments)
        // Punition modérée: combo 50 → 25, combo 10 → 5, etc.
        this.combo = Math.max(1, Math.floor(this.combo / 2));

        if (this.audio) this.audio.bad();

        // Déplacer normalement (pas de perte de segments)
        this.snake.unshift(head);

        // Générer nouveau crâne
        this.spawnFood();
        this.spawnBad();
        this.spawnPowerup();

        this.updateUI();

        logger.log(`[SoloGame] 💀 Crâne mangé: combo divisé par 2 → ${this.combo}`);
    }

    eatPowerup(head) {
        if (this.audio) this.audio.powerup();

        // Activer power-up (nouveaux noms : ice/fire/rock)
        if (this.powerup.t === 'ice') {
            this.slowCount++;
            this.powerupEffects.slow = true;  // Même effet que 'slow'
            this.activePowerup = 'ice';
        } else if (this.powerup.t === 'fire') {
            this.doubleCount++;
            this.powerupEffects.double = true;  // Même effet que 'double'
            this.activePowerup = 'fire';
        } else if (this.powerup.t === 'rock') {
            this.invincibleCount++;
            this.powerupEffects.invincible = true;  // Même effet que 'invincible'
            this.activePowerup = 'rock';
        } else if (this.powerup.t === 'ghost') {
            this.ghostCount++;
            this.powerupEffects.ghost = true;  // ✅ Mode fantôme : traverse les murs
            this.activePowerup = 'ghost';
        }

        this.powerupTime = performance.now();

        // Calculer durée avec upgrades roguelike
        let baseDuration = 8000;  // 8 secondes
        if (this.isRoguelikeMode && this.roguelikeModifiers?.powerupDurations) {
            const multiplier = this.roguelikeModifiers.powerupDurations[this.activePowerup] || 1;
            baseDuration = baseDuration * multiplier;
        }
        this.powerupDuration = baseDuration;

        // Achievement tracking
        achievementManager.onPowerupCollected(this.activePowerup);

        this.powerup = null;

        // Afficher la barre power-up
        this.showPowerupBar(this.activePowerup);

        // Déplacement normal
        this.snake.unshift(head);
        this.snake.pop();

        this.updateUI();
    }

    // ============================================
    // GESTION BARRE POWER-UP
    // ============================================

    showPowerupBar(type) {
        const container = document.getElementById('powerup-bar-container');
        const emoji = document.getElementById('powerup-emoji');
        const fill = document.getElementById('powerup-fill');

        if (!container) return;

        // Définir les emojis selon le type
        const powerupEmojis = {
            ice: '❄️',
            fire: '🔥',
            rock: '🪨',
            ghost: '👻'
        };

        // ✅ Ajouter classe 'active' + type
        container.className = 'active ' + type;

        // ✅ Afficher emoji
        emoji.textContent = powerupEmojis[type] || '⚡';

        // ✅ Remplir à 100%
        fill.style.width = '100%';
    }

    updatePowerupBar() {
        if (!this.activePowerup) return;

        const elapsed = performance.now() - this.powerupTime;
        const remaining = this.powerupDuration - elapsed;
        const percentage = Math.max(0, (remaining / this.powerupDuration) * 100);

        const fill = document.getElementById('powerup-fill');
        if (fill) {
            fill.style.width = percentage + '%';
        }

        // Si le timer est écoulé
        if (remaining <= 0) {
            this.removePowerup();
        }
    }

    removePowerup() {
        const type = this.activePowerup;

        // Vérifier GHOST dans un mur AVANT de retirer l'effet
        if (type === 'ghost') {
            // ✅ Vérifier si la tête est dans un mur quand le ghost expire
            const head = this.snake[0];
            if (this.obstacles.some(o => o.x === head.x && o.y === head.y)) {
                if (this.audio) this.audio.obstacle();
                this.gameOver();
                return;
            }
        }

        // ✅ RÉINITIALISER LES EFFETS (BUG FIX - power-ups duraient infiniment)
        this.powerupEffects = { slow: false, double: false, invincible: false, ghost: false };

        // ✅ Retirer classe 'active' et type
        const container = document.getElementById('powerup-bar-container');
        const emoji = document.getElementById('powerup-emoji');
        const fill = document.getElementById('powerup-fill');

        if (container) {
            container.className = '';  // ✅ Retirer classes
        }

        if (emoji) {
            emoji.textContent = '\u00A0';  // ✅ Espace insécable (garde la largeur fixe)
        }

        if (fill) {
            fill.style.width = '0%';   // ✅ Vider barre
        }

        this.activePowerup = null;
        this.updateUI();
    }

    // ============================================
    // GÉNÉRATION DES ÉLÉMENTS
    // ============================================

    spawnFood() {
        let attempts = 0;
        const maxAttempts = 200;

        do {
            this.food = {
                x: Math.floor(Math.random() * this.GRID_SIZE),
                y: Math.floor(Math.random() * this.GRID_SIZE)
            };
            attempts++;

            if (attempts > maxAttempts) {
                // Recherche exhaustive
                let found = false;
                for (let y = 0; y < this.GRID_SIZE && !found; y++) {
                    for (let x = 0; x < this.GRID_SIZE && !found; x++) {
                        if (!this.snake.some(s => s.x === x && s.y === y) &&
                            !this.obstacles.some(o => o.x === x && o.y === y) &&
                            !(this.bad && x === this.bad.x && y === this.bad.y) &&
                            !(this.powerup && x === this.powerup.x && y === this.powerup.y)) {
                            this.food = { x, y };
                            found = true;
                        }
                    }
                }
                break;
            }
        } while (this.snake.some(s => s.x === this.food.x && s.y === this.food.y) ||
                 this.obstacles.some(o => o.x === this.food.x && o.y === this.food.y) ||
                 (this.bad && this.food.x === this.bad.x && this.food.y === this.bad.y) ||
                 (this.powerup && this.food.x === this.powerup.x && this.food.y === this.powerup.y));
    }

    spawnBad() {
        let attempts = 0;
        const maxAttempts = 200;

        do {
            this.bad = {
                x: Math.floor(Math.random() * this.GRID_SIZE),
                y: Math.floor(Math.random() * this.GRID_SIZE)
            };
            attempts++;

            if (attempts > maxAttempts) {
                let found = false;
                for (let y = 0; y < this.GRID_SIZE && !found; y++) {
                    for (let x = 0; x < this.GRID_SIZE && !found; x++) {
                        if (!this.snake.some(s => s.x === x && s.y === y) &&
                            !this.obstacles.some(o => o.x === x && o.y === y) &&
                            !(x === this.food.x && y === this.food.y) &&
                            !(this.powerup && x === this.powerup.x && y === this.powerup.y)) {
                            this.bad = { x, y };
                            found = true;
                        }
                    }
                }
                break;
            }
        } while (this.snake.some(s => s.x === this.bad.x && s.y === this.bad.y) ||
                 this.obstacles.some(o => o.x === this.bad.x && o.y === this.bad.y) ||
                 (this.bad.x === this.food.x && this.bad.y === this.food.y) ||
                 (this.powerup && this.bad.x === this.powerup.x && this.bad.y === this.powerup.y));
    }

    spawnPowerup() {
        // Probabilité selon difficulté
        let powerupChance = this.difficulty === 0 ? 0.08 : this.difficulty === 1 ? 0.15 : 0.25;

        // Upgrade Dualité : 50% chance de doubler la probabilité
        if (this.isRoguelikeMode && this.roguelikeModifiers?.passives) {
            const doubleSpawn = this.roguelikeModifiers.passives.find(p => p.type === 'double_spawn');
            if (doubleSpawn && Math.random() < doubleSpawn.chance) {
                powerupChance *= 2;  // Double la chance
            }
        }

        if (!this.powerup && Math.random() < powerupChance) {
            let rand = Math.random();
            let type = rand < 0.25 ? 'ice' : rand < 0.50 ? 'fire' : rand < 0.75 ? 'rock' : 'ghost';  // ✅ 4 types : 25% chacun

            let attempts = 0;
            do {
                this.powerup = {
                    x: Math.floor(Math.random() * this.GRID_SIZE),
                    y: Math.floor(Math.random() * this.GRID_SIZE),
                    t: type
                };
                attempts++;

                if (attempts > 50) {
                    this.powerup = null;
                    break;
                }
            } while (this.powerup && (
                this.snake.some(s => s.x === this.powerup.x && s.y === this.powerup.y) ||
                this.obstacles.some(o => o.x === this.powerup.x && o.y === this.powerup.y) ||
                (this.powerup.x === this.food.x && this.powerup.y === this.food.y) ||
                (this.powerup.x === this.bad.x && this.powerup.y === this.bad.y)
            ));
        }
    }

    spawnObstacles() {
        // Nombre d'obstacles selon difficulté et niveau
        let obsCount = 0;

        if (this.difficulty === 0) {
            obsCount = this.level > 8 ? Math.floor((this.level - 8) / 3) : 0;
        } else if (this.difficulty === 1) {
            obsCount = this.level > 3 ? Math.floor((this.level - 3) / 2) : 0;
        } else {
            obsCount = Math.max(0, this.level - 1);
        }

        for (let i = 0; i < obsCount; i++) {
            let newObs;
            do {
                newObs = {
                    x: Math.floor(Math.random() * this.GRID_SIZE),
                    y: Math.floor(Math.random() * this.GRID_SIZE)
                };
            } while (this.snake.some(s => s.x === newObs.x && s.y === newObs.y) ||
                     (newObs.x === this.food.x && newObs.y === this.food.y));

            this.obstacles.push(newObs);
        }
    }

    // ============================================
    // PARTICULES
    // ============================================

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
    // RENDU
    // ============================================

    // getDarkerColor() est héritée de BaseSnakeGame ✅

    draw() {
        const dpr = this.ctx.getTransform().a;

        // Effacer canvas
        this.ctx.fillStyle = this.COLORS.BG_DARK;
        this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

        // ✅ Couleur bordure adaptée au mode dark/light
        const isDarkMode = document.body.classList.contains('dark-mode');
        let borderColor = isDarkMode ? '#00A5A5' : '#d8d800ff';

        // Dessiner grille
        RenderUtils.drawGrid(
            this.ctx,
            this.GRID_SIZE,
            this.CELL_SIZE,
            this.CANVAS_SIZE,
            { grid: '#404060', border: borderColor }
        );

        // Dessiner nourriture
        if (this.food) {
            RenderUtils.drawStar(this.ctx, this.food.x, this.food.y, this.CELL_SIZE);
        }

        // Dessiner crâne
        if (this.bad) {
            RenderUtils.drawSkull(this.ctx, this.bad.x, this.bad.y, this.CELL_SIZE);
        }

        // Dessiner power-up
        if (this.powerup) {
            RenderUtils.drawPowerup(
                this.ctx,
                this.powerup.x,
                this.powerup.y,
                this.CELL_SIZE,
                this.powerup.t
            );
        }

        // Dessiner obstacles
        for (let obs of this.obstacles) {
            RenderUtils.drawWall(this.ctx, obs.x, obs.y, this.CELL_SIZE);
        }

        // ========== DESSINER LE BOSS ET L'ÉPÉE ==========
        if (this.isBossFight) {
            this.drawPoisonTrail();  // Poison en dessous du boss
            this.drawBoss();
            this.drawBossClone();    // Clone du boss (NÉMÉSIS)
            this.drawSword();
        }

        // ============================================
        // ✨ DESSINER SERPENT AVEC SKINS AAA
        // ============================================

        // Obtenir les couleurs du skin (ou couleurs par défaut selon power-up)
        let skinColors = null;

        // Si un power-up est actif, utiliser des couleurs temporaires
        if (this.powerupEffects.ghost) {
            skinColors = {
                head: { light: '#FFFFFF', dark: '#CCCCCC' },
                body: { from: '#FFFFFF', to: '#999999' },
                tail: { color: '#999999' },
                outline: '#666666',
                glow: '#FFFFFF'
            };
        } else if (this.powerupEffects.invincible) {
            skinColors = {
                head: { light: '#D2B48C', dark: '#A0826D' },
                body: { from: '#D2B48C', to: '#8B7355' },
                tail: { color: '#8B7355' },
                outline: '#654321',
                glow: '#D2B48C'
            };
        } else if (this.powerupEffects.double) {
            skinColors = {
                head: { light: '#FF5722', dark: '#E64A19' },
                body: { from: '#FF5722', to: '#BF360C' },
                tail: { color: '#BF360C' },
                outline: '#5D0F00',
                glow: '#FF5722'
            };
        } else if (this.powerupEffects.slow) {
            skinColors = {
                head: { light: '#00A5A5', dark: '#008080' },
                body: { from: '#00A5A5', to: '#006666' },
                tail: { color: '#006666' },
                outline: '#003333',
                glow: '#00A5A5'
            };
        }
        // Sinon, utiliser le skin équipé (géré dans drawSnakeEnhanced)

        // Convertir la direction en string
        const directionString = getDirectionString(this.dx, this.dy);

        // 💥 Ne pas dessiner le serpent s'il explose
        if (!this.isExploding) {
            // ✨ Si clignotement actif, alterner rouge/normal
            let finalColors = skinColors;
            if (this.isFlashing) {
                const shouldBeRed = Math.floor(Date.now() / 80) % 2 === 0;
                if (shouldBeRed) {
                    finalColors = {
                        head: { light: '#FF0000', dark: '#CC0000' },
                        body: { from: '#FF0000', to: '#990000' },
                        tail: { color: '#990000' },
                        outline: '#660000',
                        glow: '#FF0000'
                    };
                }
            }

            // Dessiner le serpent avec le nouveau système AAA
            drawSnakeEnhanced(
                this.ctx,
                this.snake,
                directionString,
                this.CELL_SIZE,
                finalColors
            );
        }

        // Dessiner particules (toujours, pour l'explosion)
        this.drawParticles();

        // Overlay pause
        if (this.paused) {
            this.ctx.save();

            // Emoji seul, bien centré et plus gros
            this.ctx.font = 'bold 120px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Couleur adaptative selon le thème
            const isDarkMode = document.body.classList.contains('dark-mode');
            const pauseColor = isDarkMode ? '#FFFFFF' : '#000000';

            // Ombre pour lisibilité
            this.ctx.shadowColor = isDarkMode ? '#000000' : '#FFFFFF';
            this.ctx.shadowBlur = 30;
            this.ctx.shadowOffsetX = 5;
            this.ctx.shadowOffsetY = 5;

            this.ctx.fillStyle = pauseColor;
            this.ctx.fillText('⏸️', this.CANVAS_SIZE / 2, this.CANVAS_SIZE / 2);

            // Réinitialiser
            this.ctx.shadowBlur = 0;

            this.ctx.restore();
        }
    }

    // ============================================
    // UI
    // ============================================

    updateUI() {
        // XP estimé en temps réel (en mode roguelike) ou Score (mode classique)
        const sc = document.getElementById('solo-sc');
        if (sc) {
            if (this.isRoguelikeMode && window.roguelikeManager?.currentRun) {
                const run = window.roguelikeManager.currentRun;
                const xpMultiplier = run.modifiers?.xpMultiplier || 1;
                const baseXP = this.score + (run.level * 50) + (run.applesEaten * 2);
                const estimatedXP = Math.floor(baseXP * xpMultiplier);
                sc.textContent = estimatedXP;
            } else {
                sc.textContent = this.score;
            }
        }

        // Niveau / Stage (roguelike)
        const lv = document.getElementById('solo-lv');
        if (lv) {
            lv.textContent = this.isRoguelikeMode && this.roguelikeLevelData
                ? this.roguelikeLevelData.level
                : this.level;
        }

        // Combo (en mode roguelike) ou Segments (mode classique)
        const seg = document.getElementById('solo-seg');
        if (seg) {
            if (this.isRoguelikeMode) {
                seg.textContent = this.combo;
            } else {
                seg.textContent = Math.max(0, this.snake.length - 3);
            }
        }

        // Power-up status
        const powerupStatus = document.getElementById('solo-powerup-status');
        if (powerupStatus) {
            let status = 'Aucun';
            if (this.powerupEffects.ghost) status = '👻 Fantôme';
            else if (this.powerupEffects.invincible) status = '🛡️ Invincible';
            else if (this.powerupEffects.slow) status = '⏱️ Ralenti';
            else if (this.powerupEffects.double) status = '💰 Double Points';
            powerupStatus.textContent = status;
        }

        // ========== OBJECTIF ROGUELIKE ==========
        this.updateRoguelikeObjective();
    }

    updateRoguelikeObjective() {
        const objectiveDiv = document.getElementById('roguelike-objective');
        if (!objectiveDiv) return;

        if (this.isRoguelikeMode && this.roguelikeObjective) {
            // Afficher l'objectif
            objectiveDiv.classList.remove('hidden');

            // Mettre à jour le niveau
            const levelEl = document.getElementById('rl-obj-level');
            if (levelEl) levelEl.textContent = this.roguelikeLevelData?.level || 1;

            // Mettre à jour la progression
            const currentEl = document.getElementById('rl-obj-current');
            const targetEl = document.getElementById('rl-obj-target');

            if (currentEl) currentEl.textContent = this.roguelikeProgress;
            if (targetEl) targetEl.textContent = this.roguelikeObjective.count || '?';

            // Animation flash quand on progresse
            if (this.roguelikeProgress > 0) {
                objectiveDiv.classList.add('apple-eaten');
                setTimeout(() => objectiveDiv.classList.remove('apple-eaten'), 300);
            }
        } else {
            // Cacher l'objectif en mode classique
            objectiveDiv.classList.add('hidden');
        }
    }

    hideRoguelikeObjective() {
        const objectiveDiv = document.getElementById('roguelike-objective');
        if (objectiveDiv) {
            objectiveDiv.classList.add('hidden');
        }
    }

    // ============================================
    // CONTRÔLES
    // ============================================

    changeDirection(newDx, newDy) {
        // Anti-demi-tour
        if (this.locked) return;

        // Upgrade Miroir : inverser les contrôles
        if (this.isRoguelikeMode && this.roguelikeModifiers?.passives) {
            const mirrorUpgrade = this.roguelikeModifiers.passives.find(p => p.type === 'mirror_controls');
            if (mirrorUpgrade) {
                newDx = -newDx;
                newDy = -newDy;
            }
        }

        if (newDx === -this.dx && newDy === -this.dy) return;

        // Sprint (double-tap) - si on tape dans la même direction que la direction actuelle
        if (this.isRoguelikeMode && this.roguelikeModifiers?.abilities) {
            const sprintAbility = this.roguelikeModifiers.abilities.find(a => a.ability === 'sprint');
            if (sprintAbility && !this.sprintActive && this.sprintCooldown <= 0) {
                // Vérifier si c'est un double-tap (même direction que le mouvement actuel)
                if (newDx === this.dx && newDy === this.dy) {
                    const now = Date.now();
                    if (this.lastDirectionTap && now - this.lastDirectionTap < 300) {
                        // Double-tap détecté!
                        this.activateSprint(sprintAbility);
                    }
                    this.lastDirectionTap = now;
                } else {
                    this.lastDirectionTap = null;
                }
            }
        }

        // 🧘 PATIENCE: Tracker le premier changement de direction
        if (this.firstDirectionChangeTime === null) {
            this.firstDirectionChangeTime = Date.now();
        }

        this.ndx = newDx;
        this.ndy = newDy;
        this.locked = true;
    }

    activateSprint(ability) {
        if (this.sprintActive) return;

        logger.log('[SoloGame] Sprint activé!');
        this.sprintActive = true;

        // Boost de vitesse temporaire
        this.sprintSpeedBoost = 2;  // Vitesse x2

        // Effet visuel
        this.createParticles(this.snake[0].x, this.snake[0].y, '#00ffff', 8);

        // Désactiver après la durée
        setTimeout(() => {
            this.sprintActive = false;
            this.sprintSpeedBoost = 1;
            this.sprintCooldown = ability.cooldown;
            logger.log('[SoloGame] Sprint terminé, cooldown: ' + ability.cooldown + 's');

            // Décrémenter le cooldown chaque seconde
            const cooldownInterval = setInterval(() => {
                this.sprintCooldown--;
                if (this.sprintCooldown <= 0) {
                    clearInterval(cooldownInterval);
                }
            }, 1000);
        }, ability.duration * 1000);
    }

    // pause() et stop() sont héritées de BaseSnakeGame ✅

    // ============================================
    // GAME OVER
    // ============================================

    gameOver() {
        // ✅ Empêcher appels multiples
        if (this.gameOverTriggered) return;
        this.gameOverTriggered = true;

        // 💥 Séquence: Clignotement (400ms) → Explosion (1000ms)
        this.triggerDeathEffects();

        // Délai total: 400ms clignotement + 1000ms explosion
        setTimeout(() => {
            this._finalizeGameOver();
        }, 1400);
    }

    /**
     * Finalise le game over après les effets visuels
     */
    _finalizeGameOver() {
        this.running = false;

        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }

        // Calculer durée
        const gameDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(gameDuration / 60);
        const seconds = gameDuration % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // 🧘 PATIENCE: Calculer temps avant premier changement de direction
        let patienceWaitTime = 0;
        if (this.firstDirectionChangeTime === null) {
            // Jamais changé de direction = toute la partie
            patienceWaitTime = Date.now() - this.gameStartTime;
        } else {
            patienceWaitTime = this.firstDirectionChangeTime - this.gameStartTime;
        }

        // L'XP sera attribué dans handleSoloGameOver

        // ========== MODE ROGUELIKE ==========
        if (this.isRoguelikeMode) {
            // Notifier le manager roguelike
            const result = roguelikeManager.onPlayerDeath();

            if (result?.continueRun) {
                // Le joueur a des vies restantes ou un bouclier
                logger.log('[SoloGame] Roguelike: Vie/bouclier utilisé, reprise...');

                if (result.shieldUsed) {
                    // Retirer des segments
                    for (let i = 0; i < result.segmentsLost && this.snake.length > 1; i++) {
                        this.snake.pop();
                    }
                }

                // Réinitialiser les flags et reprendre
                this.gameOverTriggered = false;
                this.isExploding = false;
                this.isFlashing = false;
                this.running = true;

                // Repositionner le serpent au centre (3 segments: tête, corps, queue)
                this.snake = [
                    { x: 15, y: 15 },  // Tête
                    { x: 14, y: 15 },  // Corps
                    { x: 13, y: 15 }   // Queue
                ];
                this.dx = 1;
                this.dy = 0;
                this.ndx = 1;
                this.ndy = 0;

                this.loop(performance.now());
                return;
            }

            // Fin de run - désactiver le mode roguelike
            this.isRoguelikeMode = false;
            this.roguelikeLevelData = null;
            return;
        }

        // ========== MODE CLASSIQUE ==========
        // Appeler callback si existe
        if (typeof window.handleSoloGameOver === 'function') {
            window.handleSoloGameOver({
                score: this.score,
                level: this.level,
                combo: this.maxCombo,
                foodCount: this.foodCount,
                slowCount: this.slowCount,
                doubleCount: this.doubleCount,
                invincibleCount: this.invincibleCount,
                ghostCount: this.ghostCount,
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
    // MÉTHODE POUR QUITTER LE MODE ROGUELIKE
    // ============================================

    exitRoguelikeMode() {
        this.isRoguelikeMode = false;
        this.roguelikeLevelData = null;
        this.roguelikeModifiers = null;
        this.roguelikeObjective = null;
        this.roguelikeProgress = 0;
        logger.log('[SoloGame] Mode roguelike désactivé');
    }
}

// Export
window.SoloSnakeGame = SoloSnakeGame;
