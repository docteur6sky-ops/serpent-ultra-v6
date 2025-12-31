/**
 * PowerUpState.js - État partagé pour les power-ups
 * Utilisé par ai-game.js et potentiellement d'autres modes
 *
 * Gère pour UNE entité (joueur ou IA):
 * - Effets actifs (slow, double, invincible, ghost)
 * - Type de power-up actif
 * - Timer d'activation
 * - État de ralentissement (par ICE ennemi)
 * - Flag GHOST utilisé (vol one-shot)
 */

import { logger } from '../services/logger.js';

export class PowerUpState {
    /**
     * @param {string} name - Nom de l'entité pour les logs (ex: 'player', 'ai')
     */
    constructor(name = 'entity') {
        this.name = name;

        // Effets actifs
        this.effects = {
            slow: false,      // ICE - ralentit l'ennemi
            double: false,    // LIGHTNING - vitesse x2
            invincible: false, // ROCK - invincible aux collisions
            ghost: false      // GHOST - traverse + vole segments
        };

        // Power-up actif
        this.activePowerup = null;  // 'ice', 'lightning', 'rock', 'ghost' ou null
        this.powerupTime = 0;       // Timestamp d'activation

        // État GHOST (vol one-shot)
        this.ghostUsed = false;

        // État de ralentissement (par ICE ennemi)
        this.slowed = false;
        this.slowedUntil = 0;
    }

    /**
     * Active un power-up
     * @param {string} type - Type du power-up (ice, lightning, rock, ghost)
     */
    activate(type) {
        // Reset d'abord tous les effets
        this.disable();

        // Activer le nouvel effet
        switch (type) {
            case 'ice':
                this.effects.slow = true;
                break;
            case 'lightning':
                this.effects.double = true;
                break;
            case 'rock':
                this.effects.invincible = true;
                break;
            case 'ghost':
                this.effects.ghost = true;
                this.ghostUsed = false; // Reset flag pour nouveau GHOST
                break;
        }

        this.activePowerup = type;
        this.powerupTime = performance.now();

        logger.log(`[PowerUpState:${this.name}] Activé: ${type}`);
    }

    /**
     * Désactive le power-up actif
     */
    disable() {
        if (this.activePowerup) {
            logger.log(`[PowerUpState:${this.name}] Expiré: ${this.activePowerup}`);
        }

        this.effects = {
            slow: false,
            double: false,
            invincible: false,
            ghost: false
        };
        this.activePowerup = null;
    }

    /**
     * Vérifie si le power-up a expiré
     * @param {Object} durations - Objet avec les durées par type {lightning: 6000, ...}
     * @returns {boolean}
     */
    isExpired(durations) {
        if (!this.activePowerup) return false;

        const elapsed = performance.now() - this.powerupTime;
        const duration = durations[this.activePowerup] || 8000;
        return elapsed > duration;
    }

    /**
     * Met à jour l'état (vérifie expiration power-up et slow)
     * @param {number} timestamp - Date.now() pour le slow
     * @param {Object} durations - Durées des power-ups
     * @returns {Object} - {powerupExpired: boolean, slowEnded: boolean}
     */
    update(timestamp, durations) {
        const result = { powerupExpired: false, slowEnded: false };

        // Vérifier expiration power-up
        if (this.activePowerup && this.isExpired(durations)) {
            this.disable();
            result.powerupExpired = true;
        }

        // Vérifier fin du slow
        if (this.slowed && timestamp > this.slowedUntil) {
            this.slowed = false;
            result.slowEnded = true;
            logger.log(`[PowerUpState:${this.name}] N'est plus ralenti`);
        }

        return result;
    }

    /**
     * Applique un effet de ralentissement (ICE ennemi)
     * @param {number} duration - Durée du ralentissement en ms
     */
    applySlowed(duration) {
        this.slowed = true;
        this.slowedUntil = Date.now() + duration;
        logger.log(`[PowerUpState:${this.name}] Ralenti pour ${duration}ms`);
    }

    /**
     * Marque GHOST comme utilisé (après vol de segments)
     */
    markGhostUsed() {
        this.ghostUsed = true;
    }

    /**
     * Vérifie si GHOST peut encore voler
     * @returns {boolean}
     */
    canGhostSteal() {
        return this.effects.ghost && !this.ghostUsed;
    }

    /**
     * Reset complet de l'état
     */
    reset() {
        this.effects = {
            slow: false,
            double: false,
            invincible: false,
            ghost: false
        };
        this.activePowerup = null;
        this.powerupTime = 0;
        this.ghostUsed = false;
        this.slowed = false;
        this.slowedUntil = 0;
    }

    /**
     * Retourne la vitesse modifiée selon l'état
     * @param {number} baseSpeed - Vitesse de base en ms
     * @param {number} slowedSpeed - Vitesse quand ralenti
     * @returns {number}
     */
    getSpeed(baseSpeed, slowedSpeed = 500) {
        // Si ralenti par ICE ennemi
        if (this.slowed) return slowedSpeed;

        // LIGHTNING augmente la vitesse
        if (this.activePowerup === 'lightning') {
            return baseSpeed / 2;
        }

        return baseSpeed;
    }
}
