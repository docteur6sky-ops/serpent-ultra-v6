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

        // Emojis des power-ups
        this.powerupEmojis = {
            ice: '❄️',
            fire: '🔥',
            rock: '🪨',
            ghost: '👻',
            lightning: '⚡'
        };
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
        this.hideBar();
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
                const cooldownInterval = setInterval(() => {
                    this.sprintCooldown--;
                    if (this.sprintCooldown <= 0) {
                        clearInterval(cooldownInterval);
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
}
