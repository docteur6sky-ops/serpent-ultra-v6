/**
 * Classe de base pour tous les modes de jeu Snake
 * Contient la logique commune entre Solo et Multi
 * Les classes enfants peuvent surcharger: reset(), update(), draw(), start(), stop()
 * Pour les jeux réseau, ces méthodes sont optionnelles.
 */

import { CONFIG, COLORS } from '../config/constants.js';
import { logger } from '../services/logger.js';

export class BaseSnakeGame {
    constructor(canvasId) {
        // Canvas
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas ${canvasId} introuvable!`);
        }
        this.ctx = this.canvas.getContext('2d');

        // Configuration depuis constants
        this.GRID_SIZE = CONFIG.GRID_SIZE;
        this.CANVAS_SIZE = CONFIG.CANVAS_SIZE;
        this.CELL_SIZE = CONFIG.CELL_SIZE;
        this.SNAKE_EYE_SIZE = CONFIG.SNAKE_EYE_SIZE;
        this.SNAKE_EYE_OFFSET = CONFIG.SNAKE_EYE_OFFSET;
        this.POWERUP_DURATION = CONFIG.POWERUP_DURATION;

        // État du jeu
        this.running = false;
        this.paused = false;
        this.difficulty = 0;
        this.level = 1;
        this.raf = null;
        this.lastTime = 0;

        // Particules avec limite et pooling
        this.particles = [];
        this.MAX_PARTICLES = 100;  // Limite pour performance mobile
        this.particlePool = [];     // Pool de particules recyclables

        // 💥 JUICE EFFECTS
        this.shakeIntensity = 0;
        this.shakeDecay = 0.92;
        this.slowMoFactor = 1;
        this.slowMoDecay = 0.008;
        this.isExploding = false;  // Flag pour cacher le serpent pendant explosion
        this.isFlashing = false;   // Flag pour clignotement avant explosion
        this.flashColor = null;    // Couleur du clignotement

        // Couleurs
        this.COLORS = COLORS;

        // Audio (sera injecté)
        this.audio = window.audio;

        logger.debug(`${canvasId} initialisé`);
    }

    /**
     * Démarre le jeu
     * @param {number} difficulty - 0=Facile, 1=Normal, 2=Difficile
     */
    start(difficulty = 0) {
        this.difficulty = difficulty;
        this.reset();
        this.running = true;
        this.paused = false;
        this.gameStartTime = Date.now();

        logger.log(`Jeu démarré - Difficulté: ${difficulty}`);

        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    /**
     * Réinitialise l'état du jeu
     * À IMPLÉMENTER par les classes enfants
     */
    reset() {
        // Méthode optionnelle - les jeux réseau n'en ont pas besoin
    }

    /**
     * Boucle principale du jeu
     * @param {number} timestamp - Timestamp performance.now()
     */
    loop(timestamp) {
        if (!this.running) return;

        this.raf = requestAnimationFrame((t) => this.loop(t));

        if (this.paused) {
            this.draw();
            return;
        }

        // 💥 Mise à jour des effets juice
        this.updateJuiceEffects();

        // Calculer vitesse selon difficulté et niveau
        // 💥 Appliquer slow-mo factor
        const speed = this.calculateSpeed() / this.slowMoFactor;

        // Update si assez de temps écoulé
        if (timestamp - this.lastTime > speed) {
            this.lastTime = timestamp;
            this.update();
        }

        // Mise à jour particules
        this.updateParticles();

        // 💥 Appliquer screenshake avant dessin
        this.applyScreenShake();

        // Dessin
        this.draw();

        // 💥 Restaurer le contexte après dessin
        this.restoreAfterShake();
    }

    /**
     * Calcule la vitesse de jeu selon difficulté et niveau
     * Peut être surchargé pour modifier le comportement
     * @returns {number} Délai en ms entre chaque update
     */
    calculateSpeed() {
        const baseSpeed = this.difficulty === 0 ? 2.5 :
                         this.difficulty === 1 ? 5 : 8;
        return 1000 / (baseSpeed + (this.level - 1) * 0.5);
    }

    /**
     * Met à jour la logique du jeu
     * À IMPLÉMENTER par les classes enfants
     */
    update() {
        // Méthode optionnelle - les jeux réseau reçoivent l'état du serveur
    }

    /**
     * Dessine le jeu
     * À IMPLÉMENTER par les classes enfants
     */
    draw() {
        // Méthode à surcharger par les classes enfants
    }

    /**
     * Met en pause / reprend le jeu
     */
    pause() {
        this.paused = !this.paused;
        logger.debug(`Pause: ${this.paused}`);
    }

    // ============================================
    // 💥 JUICE EFFECTS (Screenshake + Slow-mo)
    // ============================================

    /**
     * Met à jour les effets juice (decay)
     */
    updateJuiceEffects() {
        // Decay du screenshake
        if (this.shakeIntensity > 0.1) {
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
        }

        // Decay du slow-mo (retour à la normale)
        if (this.slowMoFactor < 1) {
            this.slowMoFactor += this.slowMoDecay;
            if (this.slowMoFactor > 1) this.slowMoFactor = 1;
        }
    }

    /**
     * Applique le screenshake au canvas
     */
    applyScreenShake() {
        if (this.shakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);
        }
    }

    /**
     * Restaure le contexte après le screenshake
     */
    restoreAfterShake() {
        if (this.shakeIntensity > 0) {
            this.ctx.restore();
        }
    }

    /**
     * Déclenche un screenshake
     * @param {number} intensity - Intensité du shake (5-20 recommandé)
     */
    triggerScreenShake(intensity = 10) {
        this.shakeIntensity = intensity;
        logger.debug(`💥 Screenshake déclenché (intensité: ${intensity})`);
    }

    /**
     * Déclenche un effet slow-motion
     * @param {number} factor - Facteur de ralentissement (0.2 = 5x plus lent)
     */
    triggerSlowMo(factor = 0.3) {
        this.slowMoFactor = factor;
        logger.debug(`🐌 Slow-mo déclenché (facteur: ${factor})`);
    }

    /**
     * Déclenche les effets "death" combinés
     * Séquence: Clignotement rouge → Explosion en particules
     */
    triggerDeathEffects() {
        // 1️⃣ D'abord clignotement rouge
        this.triggerFlash('#FF0000');

        // 2️⃣ Après 400ms, explosion
        setTimeout(() => {
            this.isFlashing = false;
            if (this.snake && this.snake.length > 0) {
                this.explodeSnake(this.snake, '#00FF87');
            }
        }, 400);

        logger.debug('💀 Effets de mort déclenchés');
    }

    /**
     * Déclenche un clignotement du serpent
     * @param {string} color - Couleur du clignotement
     */
    triggerFlash(color = '#FF0000') {
        this.isFlashing = true;
        this.flashColor = color;
        logger.debug(`✨ Clignotement déclenché (${color})`);
    }

    /**
     * Fait exploser un serpent en particules
     * @param {Array} snake - Tableau des segments du serpent
     * @param {string} color - Couleur des particules
     */
    explodeSnake(snake, color = '#00FF87') {
        // Cacher le serpent
        this.isExploding = true;

        // Générer particules pour chaque segment
        snake.forEach((segment, index) => {
            // Plus de particules pour la tête
            const particleCount = index === 0 ? 20 : 8;

            for (let i = 0; i < particleCount; i++) {
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
     * Arrête le jeu et nettoie
     */
    stop() {
        this.running = false;
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
        logger.debug('Jeu arrêté');
    }

    /**
     * Crée des particules d'effet avec pooling et limite
     * @param {number} x - Position X en coordonnées grille
     * @param {number} y - Position Y en coordonnées grille
     * @param {string} color - Couleur des particules
     * @param {number} count - Nombre de particules
     */
    createParticles(x, y, color, count = 10) {
        // Limiter le nombre de nouvelles particules si on approche du max
        const availableSlots = this.MAX_PARTICLES - this.particles.length;
        const actualCount = Math.min(count, availableSlots);

        if (actualCount <= 0) return;

        const centerX = x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const centerY = y * this.CELL_SIZE + this.CELL_SIZE / 2;

        for (let i = 0; i < actualCount; i++) {
            let particle;

            // Réutiliser une particule du pool si disponible
            if (this.particlePool.length > 0) {
                particle = this.particlePool.pop();
                particle.x = centerX;
                particle.y = centerY;
                particle.vx = (Math.random() - 0.5) * 4;
                particle.vy = (Math.random() - 0.5) * 4;
                particle.life = 1.0;
                particle.color = color;
            } else {
                // Créer une nouvelle particule
                particle = {
                    x: centerX,
                    y: centerY,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1.0,
                    color: color
                };
            }

            this.particles.push(particle);
        }
    }

    /**
     * Met à jour toutes les particules avec recyclage optimisé
     * Utilise swap-and-pop au lieu de splice() pour O(1) au lieu de O(n)
     */
    updateParticles() {
        let writeIndex = 0;
        const len = this.particles.length;
        
        for (let i = 0; i < len; i++) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravité
            p.life -= 0.02;

            if (p.life > 0) {
                // Particule vivante : la garder
                this.particles[writeIndex++] = p;
            } else {
                // Particule morte : recycler dans le pool (max 100)
                if (this.particlePool.length < 100) {
                    this.particlePool.push(p);
                }
            }
        }
        
        // Tronquer le tableau aux particules vivantes (O(1))
        this.particles.length = writeIndex;
    }

    /**
     * Dessine toutes les particules
     */
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            const size = p.size || 3;
            // Dessiner particule ronde
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Génère une position aléatoire valide
     * @param {Array} excludeList - Liste de positions à exclure
     * @returns {Object} Position {x, y}
     */
    randomPosition(excludeList = []) {
        let pos;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            pos = {
                x: Math.floor(Math.random() * this.GRID_SIZE),
                y: Math.floor(Math.random() * this.GRID_SIZE)
            };
            attempts++;
        } while (
            excludeList.some(item => item.x === pos.x && item.y === pos.y) &&
            attempts < maxAttempts
        );

        return pos;
    }

    /**
     * Vérifie si deux positions sont identiques
     * @param {Object} pos1 - Position 1 {x, y}
     * @param {Object} pos2 - Position 2 {x, y}
     * @returns {boolean}
     */
    collides(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }

    /**
     * Assombrit une couleur hexadécimale
     * @param {string} color - Couleur hex (#RRGGBB)
     * @returns {string} Couleur assombrie
     */
    getDarkerColor(color) {
        if (!color.startsWith('#')) return color;

        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        const darker = (val) => Math.max(0, Math.floor(val * 0.6));

        const newR = darker(r).toString(16).padStart(2, '0');
        const newG = darker(g).toString(16).padStart(2, '0');
        const newB = darker(b).toString(16).padStart(2, '0');

        return `#${newR}${newG}${newB}`;
    }
}
