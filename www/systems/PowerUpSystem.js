/**
 * PowerUpSystem.js - Gestion des power-ups
 * Extrait de solo-game.js pour modularité
 *
 * Responsabilités:
 * - Activation des effets power-up
 * - Timer et expiration des power-ups
 * - Affichage de la barre UI
 * - Système de sprint
 */

import { logger } from '../services/logger.js';
import { achievementManager } from '../roguelike/achievements.js';

export class PowerUpSystem {
    constructor(game) {
        this.game = game;

        // Effets actifs
        this.effects = {
            slow: false,
            double: false,
            invincible: false,
            ghost: false,
            lightning: false
        };

        // Timer du power-up actif
        this.activePowerup = null;
        this.powerupTime = 0;
        this.powerupDuration = 8000;  // 8 secondes par défaut

        // Compteurs (pour stats)
        this.slowCount = 0;
        this.doubleCount = 0;
        this.invincibleCount = 0;
        this.ghostCount = 0;
        this.lightningCount = 0;

        // Système de sprint
        this.sprintActive = false;
        this.sprintSpeedBoost = 1;
        this.sprintCooldown = 0;
        this.lastDirectionTap = null;
        this.sprintCooldownInterval = null;

        // Boost cooldown tracking
        this.boostCooldownStartTime = 0;
        this.boostCooldownDuration = 0;
        this.boostRAFId = null;

        // Emojis des power-ups
        this.powerupEmojis = {
            ice: '❄️',
            fire: '🔥',
            rock: '🪨',
            ghost: '👻',
            lightning: '⚡'
        };

        // ========== SYSTÈME MYSTERY BOX ==========
        this.storedItem = null;           // Item stocké : null ou 'ice'/'fire'/'rock'/'ghost'
        this.mysteryBox = null;           // Position de la boîte : {x, y} ou null
        this.isRevealingItem = false;     // Animation en cours

        // ========== SYSTÈME BOOST UNIVERSEL ==========
        this.boostDuration = 1.5;         // Durée du boost en secondes
        this.boostCooldown = 5;           // Cooldown en secondes
        this.boostCooldownRemaining = 0;  // Temps restant avant prochain boost
        this.boostActive = false;         // Boost actuellement actif
        this.boostSpeedMultiplier = 2;    // Vitesse x2 pendant le boost
    }

    /**
     * Active un power-up
     * @param {string} type - Type du power-up (ice, fire, rock, ghost, lightning)
     */
    activate(type) {
        if (this.game.audio) this.game.audio.powerup();

        switch (type) {
            case 'ice':
                this.slowCount++;
                this.effects.slow = true;
                break;
            case 'fire':
                this.doubleCount++;
                this.effects.double = true;
                break;
            case 'rock':
                this.invincibleCount++;
                this.effects.invincible = true;
                break;
            case 'ghost':
                this.ghostCount++;
                this.effects.ghost = true;
                break;
            case 'lightning':
                this.lightningCount++;
                this.effects.lightning = true;
                break;
        }

        this.activePowerup = type;
        this.powerupTime = performance.now();

        // Calculer durée avec upgrades roguelike
        let baseDuration = 8000;
        if (this.game.isRoguelikeMode && this.game.roguelikeModifiers?.powerupDurations) {
            const multiplier = this.game.roguelikeModifiers.powerupDurations[type] || 1;
            baseDuration = baseDuration * multiplier;
        }

        // Bonus skin chameleon : +50% durée sur TOUS les powerups
        const run = window.roguelikeManager?.currentRun;
        if (run?.powerupDurationBonus && run.powerupDurationBonus > 1) {
            baseDuration = baseDuration * run.powerupDurationBonus;
        }

        this.powerupDuration = baseDuration;

        // Achievement tracking
        achievementManager.onPowerupCollected(type);

        // Afficher la barre UI
        this.showBar(type);

        logger.log(`[PowerUp] ${type} activé pour ${baseDuration / 1000}s`);
    }

    /**
     * Met à jour le système (appelé chaque frame)
     */
    update() {
        if (!this.activePowerup) return;

        const elapsed = performance.now() - this.powerupTime;
        const remaining = this.powerupDuration - elapsed;
        const percentage = Math.max(0, (remaining / this.powerupDuration) * 100);

        // Mettre à jour la barre
        const fill = document.getElementById('powerup-fill');
        if (fill) {
            fill.style.width = percentage + '%';
        }

        // Expiration
        if (remaining <= 0) {
            this.deactivate();
        }
    }

    /**
     * Désactive le power-up actif
     */
    deactivate() {
        const type = this.activePowerup;

        // Cas spécial GHOST : vérifier si dans un mur
        if (type === 'ghost') {
            const head = this.game.snake[0];
            if (this.game.obstacles.some(o => o.x === head.x && o.y === head.y)) {
                if (this.game.audio) this.game.audio.obstacle();
                this.game.gameOver();
                return;
            }
        }

        // Reset tous les effets
        this.effects = {
            slow: false,
            double: false,
            invincible: false,
            ghost: false,
            lightning: false
        };

        // Cacher la barre
        this.hideBar();

        this.activePowerup = null;
        this.game.updateUI();

        logger.log(`[PowerUp] ${type} expiré`);
    }

    /**
     * Affiche la barre de power-up
     * @param {string} type - Type du power-up
     */
    showBar(type) {
        const container = document.getElementById('powerup-bar-container');
        const emoji = document.getElementById('powerup-emoji');
        const fill = document.getElementById('powerup-fill');

        if (!container) return;

        container.className = 'active ' + type;

        if (emoji) {
            emoji.textContent = this.powerupEmojis[type] || '⚡';
        }

        if (fill) {
            fill.style.width = '100%';
        }
    }

    /**
     * Cache la barre de power-up
     */
    hideBar() {
        const container = document.getElementById('powerup-bar-container');
        const emoji = document.getElementById('powerup-emoji');
        const fill = document.getElementById('powerup-fill');

        if (container) {
            container.className = '';
        }

        if (emoji) {
            emoji.textContent = '\u00A0';  // Espace insécable
        }

        if (fill) {
            fill.style.width = '0%';
        }
    }

    /**
     * Reset complet du système
     */
    reset() {
        this.effects = {
            slow: false,
            double: false,
            invincible: false,
            ghost: false,
            lightning: false
        };
        this.activePowerup = null;
        this.sprintActive = false;
        this.sprintSpeedBoost = 1;
        this.sprintCooldown = 0;
        this.lastDirectionTap = null;
        if (this.sprintCooldownInterval) { clearInterval(this.sprintCooldownInterval); this.sprintCooldownInterval = null; }

        // Boost cooldown tracking
        this.boostCooldownStartTime = 0;
        this.boostCooldownDuration = 0;
        if (this.boostRAFId) { cancelAnimationFrame(this.boostRAFId); this.boostRAFId = null; }
        this.hideBar();

        // Reset Mystery Box
        this.storedItem = null;
        this.mysteryBox = null;
        this.isRevealingItem = false;
        this.updateStoredItemUI();

        // Reset Boost
        this.boostActive = false;
        this.boostCooldownRemaining = 0;
        this.updateBoostUI();
    }

    // ============================================
    // SYSTÈME DE SPRINT
    // ============================================

    /**
     * Vérifie si un sprint peut être activé via double-tap
     * @param {number} newDx - Nouvelle direction X
     * @param {number} newDy - Nouvelle direction Y
     * @returns {boolean} true si sprint activé
     */
    checkDoubleTapSprint(newDx, newDy) {
        if (!this.game.isRoguelikeMode || !this.game.roguelikeModifiers?.abilities) {
            return false;
        }

        const sprintAbility = this.game.roguelikeModifiers.abilities.find(a => a.ability === 'sprint');
        if (!sprintAbility) return false;

        // FEU = Boost infini (ignore le cooldown)
        const fireActive = this.effects.double;
        const canSprint = !this.sprintActive && (this.sprintCooldown <= 0 || fireActive);

        if (!canSprint) return false;

        // Vérifier double-tap dans la même direction
        if (newDx === this.game.dx && newDy === this.game.dy) {
            const now = Date.now();
            if (this.lastDirectionTap && now - this.lastDirectionTap < 300) {
                this.activateSprint(sprintAbility);
                return true;
            }
            this.lastDirectionTap = now;
        } else {
            this.lastDirectionTap = null;
        }

        return false;
    }

    /**
     * Active le sprint
     * @param {Object} ability - Données de l'ability sprint
     */
    activateSprint(ability) {
        if (this.sprintActive) return;

        logger.log('[PowerUp] Sprint activé!');
        this.sprintActive = true;
        this.sprintSpeedBoost = 2;  // Vitesse x2

        // Effet visuel
        this.game.createParticles(this.game.snake[0].x, this.game.snake[0].y, '#00ffff', 8);

        // Désactiver après la durée
        setTimeout(() => {
            this.sprintActive = false;
            this.sprintSpeedBoost = 1;

            // FEU = Pas de cooldown
            if (this.effects.double) {
                this.sprintCooldown = 0;
                logger.log('[PowerUp] Sprint terminé, FEU actif = pas de cooldown!');
            } else {
                this.sprintCooldown = ability.cooldown;
                logger.log('[PowerUp] Sprint terminé, cooldown: ' + ability.cooldown + 's');

                // Décrémenter le cooldown chaque seconde
                if (this.sprintCooldownInterval) clearInterval(this.sprintCooldownInterval);
                this.sprintCooldownInterval = setInterval(() => {
                    this.sprintCooldown--;
                    if (this.sprintCooldown <= 0) {
                        clearInterval(this.sprintCooldownInterval); this.sprintCooldownInterval = null;
                    }
                }, 1000);
            }
        }, ability.duration * 1000);
    }

    /**
     * Réduit le cooldown du sprint (appelé quand pomme mangée)
     * @param {number} reduction - Réduction en secondes
     */
    reduceSprintCooldown(reduction) {
        if (this.sprintCooldown > 0) {
            this.sprintCooldown = Math.max(0, this.sprintCooldown - reduction);
        }
    }

    // ============================================
    // GETTERS
    // ============================================

    get isSlowActive() { return this.effects.slow; }
    get isDoubleActive() { return this.effects.double; }
    get isInvincibleActive() { return this.effects.invincible; }
    get isGhostActive() { return this.effects.ghost; }
    get isLightningActive() { return this.effects.lightning; }
    get isSprintActive() { return this.sprintActive; }

    /**
     * Retourne les couleurs du skin selon le power-up actif
     * @returns {Object|null} Couleurs du skin ou null si aucun power-up
     */
    getSkinColors() {
        if (this.effects.ghost) {
            return {
                head: { light: '#FFFFFF', dark: '#CCCCCC' },
                body: { from: '#FFFFFF', to: '#999999' },
                tail: { color: '#999999' },
                outline: '#666666',
                glow: '#FFFFFF'
            };
        }
        if (this.effects.invincible) {
            return {
                head: { light: '#D2B48C', dark: '#A0826D' },
                body: { from: '#D2B48C', to: '#8B7355' },
                tail: { color: '#8B7355' },
                outline: '#654321',
                glow: '#D2B48C'
            };
        }
        if (this.effects.double) {
            return {
                head: { light: '#FF5722', dark: '#E64A19' },
                body: { from: '#FF5722', to: '#BF360C' },
                tail: { color: '#BF360C' },
                outline: '#5D0F00',
                glow: '#FF5722'
            };
        }
        if (this.effects.slow) {
            return {
                head: { light: '#00A5A5', dark: '#008080' },
                body: { from: '#00A5A5', to: '#006666' },
                tail: { color: '#006666' },
                outline: '#003333',
                glow: '#00A5A5'
            };
        }
        if (this.effects.lightning) {
            return {
                head: { light: '#FFD700', dark: '#FFA500' },
                body: { from: '#FFD700', to: '#1E90FF' },
                tail: { color: '#1E90FF' },
                outline: '#0000CD',
                glow: '#FFD700'
            };
        }
        return null;
    }

    /**
     * Retourne les stats pour le game over
     */
    getStats() {
        return {
            slowCount: this.slowCount,
            doubleCount: this.doubleCount,
            invincibleCount: this.invincibleCount,
            ghostCount: this.ghostCount,
            lightningCount: this.lightningCount
        };
    }

    // ============================================
    // SYSTÈME MYSTERY BOX (Style Mario Kart)
    // ============================================

    /**
     * Spawn une mystery box sur la grille
     * @param {Function} findFreePosition - Fonction pour trouver une position libre
     * @param {number} powerupChance - Probabilité de spawn (0-1)
     */
    spawnMysteryBox(findFreePosition, powerupChance = 0.25) {
        // Ne pas spawn si déjà une boîte présente
        if (this.mysteryBox) return;

        if (Math.random() < powerupChance) {
            const position = findFreePosition({ maxAttempts: 50 });
            if (position) {
                this.mysteryBox = { x: position.x, y: position.y };
                logger.log('[PowerUp] Mystery Box spawnée à', position);
            }
        }
    }

    /**
     * Vérifie si le serpent touche la mystery box
     * @param {Object} head - Position de la tête {x, y}
     * @returns {boolean} true si collision
     */
    checkMysteryBoxCollision(head) {
        if (!this.mysteryBox) return false;
        return head.x === this.mysteryBox.x && head.y === this.mysteryBox.y;
    }

    /**
     * Ramasse la mystery box et révèle l'item
     */
    async collectMysteryBox() {
        if (!this.mysteryBox || this.isRevealingItem) return;

        if (this.game.audio) this.game.audio.powerup();

        // Retirer la boîte de la grille
        this.mysteryBox = null;

        // Déterminer type aléatoire (25% chaque)
        const types = ['ice', 'fire', 'rock', 'ghost'];
        const newItem = types[Math.floor(Math.random() * types.length)];

        // Animation de révélation AAA
        await this.revealItemAnimation(newItem);

        // Stocker l'item (remplace l'ancien si existant)
        this.storedItem = newItem;
        this.updateStoredItemUI();

        logger.log(`[PowerUp] Mystery Box collectée! Item: ${newItem}`);
    }

    /**
     * Animation de révélation style roulette (AAA)
     * @param {string} finalType - Type final de l'item
     */
    async revealItemAnimation(finalType) {
        this.isRevealingItem = true;

        const slot = document.getElementById('stored-item-slot');
        const icon = document.getElementById('stored-item-icon');

        if (!slot || !icon) {
            this.isRevealingItem = false;
            return;
        }

        // Afficher le slot avec animation
        slot.classList.add('revealing');

        const emojis = ['❄️', '🔥', '🪨', '👻'];

        // Roulette rapide (600ms) - ralentit progressivement
        for (let i = 0; i < 12; i++) {
            icon.textContent = emojis[i % 4];
            await new Promise(r => setTimeout(r, 30 + i * 8));
        }

        // Révéler le vrai item
        icon.textContent = this.powerupEmojis[finalType];
        slot.classList.remove('revealing');
        slot.classList.add('has-item', 'item-revealed');

        // Flash de révélation
        setTimeout(() => {
            slot.classList.remove('item-revealed');
        }, 500);

        this.isRevealingItem = false;
    }

    /**
     * Utilise l'item stocké
     * @returns {boolean} true si un item a été utilisé
     */
    useStoredItem() {
        if (!this.storedItem || this.isRevealingItem) return false;
        if (this.game.paused || !this.game.running) return false;

        const type = this.storedItem;

        // Activer l'effet du power-up
        this.activate(type);

        // Vider le slot
        this.storedItem = null;
        this.updateStoredItemUI();

        logger.log(`[PowerUp] Item utilisé: ${type}`);
        return true;
    }

    /**
     * Met à jour l'UI du slot d'item stocké
     */
    updateStoredItemUI() {
        const slot = document.getElementById('stored-item-slot');
        const icon = document.getElementById('stored-item-icon');

        if (!slot || !icon) return;

        if (this.storedItem) {
            slot.classList.add('has-item');
            icon.textContent = this.powerupEmojis[this.storedItem];
        } else {
            slot.classList.remove('has-item', 'revealing', 'item-revealed');
            icon.textContent = '';
        }
    }

    /**
     * Getter pour savoir si un item est stocké
     */
    get hasStoredItem() {
        return this.storedItem !== null;
    }

    // ============================================
    // SYSTÈME BOOST UNIVERSEL
    // ============================================

    /**
     * Active le boost de vitesse
     * @returns {boolean} true si le boost a été activé
     */
    activateBoost() {
        // Vérifier si le jeu est en cours
        if (!this.game.running || this.game.paused) return false;

        // Vérifier cooldown (FEU = ignore le cooldown)
        const fireActive = this.effects.double;
        if (this.boostActive) return false;
        if (this.boostCooldownRemaining > 0 && !fireActive) return false;

        logger.log('[PowerUp] BOOST activé!');
        this.boostActive = true;

        // Son et effet visuel
        if (this.game.audio) this.game.audio.powerup();
        if (this.game.createParticles) {
            this.game.createParticles(this.game.snake[0].x, this.game.snake[0].y, '#00ffff', 10);
        }

        // Mettre à jour l'UI
        this.updateBoostUI();

        // Désactiver après la durée
        setTimeout(() => {
            this.boostActive = false;
            this.boostCooldownRemaining = this.boostCooldown;
            this.updateBoostUI();

            // Décrémenter le cooldown
            this.startBoostCooldown();

            logger.log('[PowerUp] BOOST terminé, cooldown: ' + this.boostCooldown + 's');
        }, this.boostDuration * 1000);

        return true;
    }

    /**
     * Démarre le décompte du cooldown
     */
    startBoostCooldown() {
        // Annuler le RAF précédent si existant
        if (this.boostRAFId) { cancelAnimationFrame(this.boostRAFId); this.boostRAFId = null; }

        const startTime = Date.now();
        const totalCooldown = this.boostCooldown * 1000;

        const updateCooldown = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, totalCooldown - elapsed);
            this.boostCooldownRemaining = remaining / 1000;

            this.updateBoostUI();

            if (remaining > 0) {
                this.boostRAFId = requestAnimationFrame(updateCooldown);
            }
        };

        this.boostRAFId = requestAnimationFrame(updateCooldown);
    }

    /**
     * Met à jour l'UI du bouton boost
     */
    updateBoostUI() {
        const btn = document.getElementById('boost-btn');
        const progress = document.getElementById('boost-cd-progress');

        if (!btn) return;

        // FEU actif = ignore visuellement le cooldown
        const fireActive = this.effects.double;

        // État actif
        if (this.boostActive) {
            btn.classList.add('boost-active');
            btn.classList.remove('boost-cooldown', 'boost-fire-ready');
        }
        // État cooldown (mais FEU = prêt visuellement)
        else if (this.boostCooldownRemaining > 0 && !fireActive) {
            btn.classList.remove('boost-active', 'boost-fire-ready');
            btn.classList.add('boost-cooldown');

            // Mettre à jour le cercle de progression
            if (progress) {
                const percentage = (this.boostCooldownRemaining / this.boostCooldown) * 100;
                const circumference = 2 * Math.PI * 45; // r=45
                const offset = circumference * (1 - percentage / 100);
                progress.style.strokeDasharray = circumference;
                progress.style.strokeDashoffset = offset;
            }
        }
        // État prêt (ou FEU actif)
        else {
            btn.classList.remove('boost-active', 'boost-cooldown');
            if (fireActive && this.boostCooldownRemaining > 0) {
                btn.classList.add('boost-fire-ready'); // Visuel spécial feu
            } else {
                btn.classList.remove('boost-fire-ready');
            }
            if (progress) {
                progress.style.strokeDashoffset = 0;
            }
        }
    }

    /**
     * Getter pour le multiplicateur de vitesse actuel
     */
    get currentSpeedMultiplier() {
        if (this.boostActive) return this.boostSpeedMultiplier;
        if (this.sprintActive) return this.sprintSpeedBoost;
        return 1;
    }

    /**
     * Getter pour savoir si le boost est prêt
     */
    get isBoostReady() {
        // FEU actif = toujours prêt (ignore cooldown)
        if (this.effects.double) return !this.boostActive;
        return !this.boostActive && this.boostCooldownRemaining <= 0;
    }
}
