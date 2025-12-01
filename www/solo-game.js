// ============================================
// SOLO SNAKE GAME - MODE SOLO ENCAPSULÉ
// ============================================

import { logger } from './services/logger.js';
import { BaseSnakeGame } from './core/BaseSnakeGame.js';
import { drawSnakeEnhanced, getDirectionString } from './SkinsRenderer.js';

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

    reset() {
        // Réinitialiser serpent
        this.snake = [{ x: 15, y: 15 }];
        this.dx = 1;
        this.dy = 0;
        this.ndx = 1;
        this.ndy = 0;

        // ✅ Reset flags
        this.gameOverTriggered = false;
        this.isExploding = false;
        this.isFlashing = false;

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
    }

    // ============================================
    // GESTION DES COLLECTES
    // ============================================

    eatFood(head) {
        // Calculer points
        let diffMultiplier = this.difficulty === 0 ? 1 : this.difficulty === 1 ? 1.5 : 2;
        let points = Math.floor(10 * this.combo * (this.powerupEffects.double ? 2 : 1) * diffMultiplier);

        this.score += points;
        this.foodCount++;
        if (this.audio) this.audio.eat();

        // Monter de niveau tous les 5 pommes
        if (this.foodCount % 5 === 0) {
            this.level++;
            if (this.audio) this.audio.lvlup();
            this.spawnObstacles();
        }

        // Augmenter combo
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

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
        this.powerupDuration = 8000;  // 8 secondes
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
        // Score
        const sc = document.getElementById('solo-sc');
        if (sc) sc.textContent = this.score;

        // Niveau
        const lv = document.getElementById('solo-lv');
        if (lv) lv.textContent = this.level;

        // Segments (longueur du serpent)
        const seg = document.getElementById('solo-seg');
        if (seg) seg.textContent = this.snake.length;

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
    }

    // ============================================
    // CONTRÔLES
    // ============================================

    changeDirection(newDx, newDy) {
        // Anti-demi-tour
        if (this.locked) return;
        if (newDx === -this.dx && newDy === -this.dy) return;

        // 🧘 PATIENCE: Tracker le premier changement de direction
        if (this.firstDirectionChangeTime === null) {
            this.firstDirectionChangeTime = Date.now();
        }

        this.ndx = newDx;
        this.ndy = newDy;
        this.locked = true;
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
}

// Export
window.SoloSnakeGame = SoloSnakeGame;
