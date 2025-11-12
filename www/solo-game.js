// ============================================
// SOLO SNAKE GAME - MODE SOLO ENCAPSULÉ
// ============================================

class SoloSnakeGame {
    constructor() {
        // Canvas et contexte
        this.canvas = document.getElementById('canvas-solo');
        if (!this.canvas) {
            throw new Error('Canvas canvas-solo introuvable!');
        }
        this.ctx = this.canvas.getContext('2d');

        // Configuration (depuis CONFIG)
        this.GRID_SIZE = 30;
        this.CANVAS_SIZE = 400;
        this.CELL_SIZE = 400 / 30;
        this.SNAKE_EYE_SIZE = 3;
        this.SNAKE_EYE_OFFSET = 4;

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
        this.level = 1;
        this.foodCount = 0;
        this.combo = 1;
        this.maxCombo = 1;

        // Power-ups actifs
        this.powerupEffects = { slow: false, double: false, invincible: false };
        this.powerupTime = 0;
        this.slowCount = 0;
        this.doubleCount = 0;
        this.invincibleCount = 0;

        // Contrôle du jeu
        this.running = false;
        this.paused = false;
        this.locked = false;
        this.difficulty = 0; // 0=Facile, 1=Normal, 2=Difficile
        this.raf = null;
        this.lastTime = 0;

        // Stats de partie
        this.wallsDestroyed = 0;
        this.skullsEaten = 0;
        this.gameStartTime = 0;
        this.maxSnakeLength = 1;

        // Particules
        this.particles = [];

        // Audio
        this.audio = window.audio;

        // Couleurs
        this.COLORS = {
            GOLD: '#D4AF37',
            BG_DARK: '#000',
            ACCENT_WARM: '#B8860B'
        };
    }

    // ============================================
    // DÉMARRAGE & INITIALISATION
    // ============================================

    start(difficulty = 0) {
        console.log('🎮 Démarrage mode SOLO');
        this.difficulty = difficulty;
        this.reset();
        this.running = true;
        this.paused = false;
        this.gameStartTime = Date.now();

        // Lancer la boucle
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    reset() {
        // Réinitialiser serpent
        this.snake = [{ x: 15, y: 15 }];
        this.dx = 1;
        this.dy = 0;
        this.ndx = 1;
        this.ndy = 0;

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

        // Réinitialiser power-ups
        this.powerupEffects = { slow: false, double: false, invincible: false };
        this.particles = [];

        // Générer nourriture et crâne
        this.spawnFood();
        this.spawnBad();

        // Mettre à jour UI
        this.updateUI();
    }

    // ============================================
    // BOUCLE PRINCIPALE
    // ============================================

    loop(timestamp) {
        if (!this.running) return;

        this.raf = requestAnimationFrame((t) => this.loop(t));

        if (this.paused) {
            this.draw();
            return;
        }

        // Calculer vitesse selon difficulté et niveau
        let baseSpeed = this.difficulty === 0 ? 2.5 : this.difficulty === 1 ? 5 : 8;
        let speed = 1000 / (baseSpeed + (this.level - 1) * 0.5);

        // Ralentissement si power-up actif
        if (this.powerupEffects.slow) {
            speed *= 1.5;
        }

        // Update si assez de temps écoulé
        if (timestamp - this.lastTime > speed) {
            this.lastTime = timestamp;
            this.update();
        }

        // Vérifier fin des power-ups (8 secondes)
        if (this.powerupEffects.slow || this.powerupEffects.double || this.powerupEffects.invincible) {
            if (performance.now() - this.powerupTime > 8000) {
                this.powerupEffects = { slow: false, double: false, invincible: false };
                this.updateUI();
            }
        }

        // Mettre à jour particules
        this.updateParticles();

        // Dessiner
        this.draw();
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
        if (head.x < 0) head.x = this.GRID_SIZE - 1;
        if (head.x >= this.GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = this.GRID_SIZE - 1;
        if (head.y >= this.GRID_SIZE) head.y = 0;

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
            if (this.powerupEffects.invincible) {
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

        // Vérifier si serpent trop petit
        if (this.snake.length <= 6) {
            if (this.audio) this.audio.bad();
            this.gameOver();
            return;
        }

        // Retirer 5 segments
        for (let i = 0; i < 5; i++) {
            if (this.snake.length > 1) {
                this.snake.pop();
            }
        }

        // Pénalité
        this.score = Math.max(0, this.score - 5);
        this.combo = 1;

        if (this.audio) this.audio.bad();

        // Déplacer
        this.snake.unshift(head);

        // Générer nouveau
        this.spawnFood();
        this.spawnBad();
        this.spawnPowerup();

        this.updateUI();
    }

    eatPowerup(head) {
        if (this.audio) this.audio.powerup();

        // Activer power-up
        if (this.powerup.t === 'slow') {
            this.slowCount++;
            this.powerupEffects.slow = true;
        } else if (this.powerup.t === 'double') {
            this.doubleCount++;
            this.powerupEffects.double = true;
        } else if (this.powerup.t === 'invincible') {
            this.invincibleCount++;
            this.powerupEffects.invincible = true;
        }

        this.powerupTime = performance.now();
        this.powerup = null;

        // Déplacement normal
        this.snake.unshift(head);
        this.snake.pop();

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
                            !this.obstacles.some(o => o.x === x && o.y === y)) {
                            this.food = { x, y };
                            found = true;
                        }
                    }
                }
                break;
            }
        } while (this.snake.some(s => s.x === this.food.x && s.y === this.food.y) ||
                 this.obstacles.some(o => o.x === this.food.x && o.y === this.food.y));
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
                            !(x === this.food.x && y === this.food.y)) {
                            this.bad = { x, y };
                            found = true;
                        }
                    }
                }
                break;
            }
        } while (this.snake.some(s => s.x === this.bad.x && s.y === this.bad.y) ||
                 this.obstacles.some(o => o.x === this.bad.x && o.y === this.bad.y) ||
                 (this.bad.x === this.food.x && this.bad.y === this.food.y));
    }

    spawnPowerup() {
        // Probabilité selon difficulté
        let powerupChance = this.difficulty === 0 ? 0.08 : this.difficulty === 1 ? 0.15 : 0.25;

        if (!this.powerup && Math.random() < powerupChance) {
            let rand = Math.random();
            let type = rand < 0.33 ? 'slow' : rand < 0.66 ? 'double' : 'invincible';

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

    draw() {
        const dpr = this.ctx.getTransform().a;

        // Effacer canvas
        this.ctx.fillStyle = this.COLORS.BG_DARK;
        this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

        // Couleur bordure selon power-up
        let borderColor = '#d8d800ff';
        if (this.powerupEffects.slow) borderColor = '#00FF87';
        else if (this.powerupEffects.double) borderColor = '#873e87ff';
        else if (this.powerupEffects.invincible) borderColor = '#ff1900ff';

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

        // Dessiner serpent
        this.snake.forEach((s, i) => {
            let headColor = '#00FF00';
            let bodyColor = '#008000';

            // Couleur selon power-up
            if (this.powerupEffects.invincible) {
                headColor = '#FFD700';
                bodyColor = '#FFA500';
            } else if (this.powerupEffects.double) {
                headColor = '#FF00FF';
                bodyColor = '#800080';
            } else if (this.powerupEffects.slow) {
                headColor = '#00FFFF';
                bodyColor = '#008080';
            }

            if (i === 0) {
                // Tête avec yeux
                const eyeSize = this.SNAKE_EYE_SIZE * (dpr > 1 ? 0.75 : 1);
                const eyeOffset = this.SNAKE_EYE_OFFSET * (dpr > 1 ? 0.5 : 1);
                RenderUtils.drawSnakeHead(
                    this.ctx,
                    s.x,
                    s.y,
                    this.CELL_SIZE,
                    headColor,
                    eyeOffset,
                    eyeSize
                );
            } else {
                // Corps
                this.ctx.fillStyle = bodyColor;
                this.ctx.fillRect(
                    s.x * this.CELL_SIZE,
                    s.y * this.CELL_SIZE,
                    this.CELL_SIZE,
                    this.CELL_SIZE
                );
            }
        });

        // Dessiner particules
        this.drawParticles();

        // Overlay pause
        if (this.paused) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.85;
            this.ctx.fillStyle = this.COLORS.GOLD;
            this.ctx.font = '40px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSE', this.CANVAS_SIZE / 2, this.CANVAS_SIZE / 2);
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

        // Combo
        const cb = document.getElementById('solo-cb');
        if (cb) cb.textContent = 'x' + this.combo;

        // Power-up status
        const powerupStatus = document.getElementById('solo-powerup-status');
        if (powerupStatus) {
            let status = 'Aucun';
            if (this.powerupEffects.invincible) status = '🛡️ Invincible';
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

        this.ndx = newDx;
        this.ndy = newDy;
        this.locked = true;
    }

    pause() {
        this.paused = !this.paused;
    }

    stop() {
        this.running = false;
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
    }

    // ============================================
    // GAME OVER
    // ============================================

    gameOver() {
        console.log('💀 Game Over SOLO');
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

        // Calculer et attribuer XP basé sur le score
        const xpGained = Math.floor(this.score / 10); // 1 XP par 10 points
        if (typeof window.awardXP === 'function' && xpGained > 0) {
            window.awardXP(xpGained);
        }

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
                difficulty: this.difficulty,
                timeString: timeString,
                wallsDestroyed: this.wallsDestroyed,
                skullsEaten: this.skullsEaten,
                maxSnakeLength: this.maxSnakeLength
            });
        }
    }
}

// Export
window.SoloSnakeGame = SoloSnakeGame;
console.log('✅ SoloSnakeGame chargé');
