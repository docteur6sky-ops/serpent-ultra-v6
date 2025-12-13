/**
 * TimerManager.js - Gestionnaire centralisé des timers
 *
 * Remplace les appels directs à setTimeout/setInterval par une API
 * qui track automatiquement les timers et permet le cleanup.
 *
 * Usage:
 *   import { TimerManager } from './services/TimerManager.js';
 *
 *   // Créer une instance pour un contexte
 *   const timers = new TimerManager('solo-game');
 *
 *   // Créer des timers (auto-trackés)
 *   timers.setTimeout('powerup-expire', () => expirePowerup(), 8000);
 *   timers.setInterval('cooldown-tick', () => updateCooldown(), 1000);
 *
 *   // Annuler un timer spécifique
 *   timers.clear('powerup-expire');
 *
 *   // Nettoyer tous les timers du contexte
 *   timers.clearAll();
 */

import { logger } from './logger.js';

export class TimerManager {
    /**
     * @param {string} context - Nom du contexte (ex: 'solo-game', 'roguelike')
     */
    constructor(context = 'default') {
        this.context = context;
        this.timeouts = new Map();   // name -> timeoutId
        this.intervals = new Map();  // name -> intervalId
    }

    /**
     * Crée un setTimeout tracké
     * @param {string} name - Nom unique du timer
     * @param {Function} callback - Fonction à exécuter
     * @param {number} delay - Délai en ms
     * @returns {string} Le nom du timer (pour clear)
     */
    setTimeout(name, callback, delay) {
        // Clear si existe déjà
        if (this.timeouts.has(name)) {
            clearTimeout(this.timeouts.get(name));
        }

        const id = setTimeout(() => {
            this.timeouts.delete(name);
            try {
                callback();
            } catch (e) {
                logger.warn(`[TimerManager:${this.context}] Erreur dans timeout "${name}":`, e);
            }
        }, delay);

        this.timeouts.set(name, id);
        logger.debug(`[TimerManager:${this.context}] +Timeout "${name}" (${delay}ms)`);
        return name;
    }

    /**
     * Crée un setInterval tracké
     * @param {string} name - Nom unique de l'interval
     * @param {Function} callback - Fonction à exécuter
     * @param {number} interval - Intervalle en ms
     * @returns {string} Le nom de l'interval (pour clear)
     */
    setInterval(name, callback, interval) {
        // Clear si existe déjà
        if (this.intervals.has(name)) {
            clearInterval(this.intervals.get(name));
        }

        const id = setInterval(() => {
            try {
                callback();
            } catch (e) {
                logger.warn(`[TimerManager:${this.context}] Erreur dans interval "${name}":`, e);
            }
        }, interval);

        this.intervals.set(name, id);
        logger.debug(`[TimerManager:${this.context}] +Interval "${name}" (${interval}ms)`);
        return name;
    }

    /**
     * Annule un timer/interval par son nom
     * @param {string} name - Nom du timer à annuler
     */
    clear(name) {
        if (this.timeouts.has(name)) {
            clearTimeout(this.timeouts.get(name));
            this.timeouts.delete(name);
            logger.debug(`[TimerManager:${this.context}] -Timeout "${name}"`);
        }
        if (this.intervals.has(name)) {
            clearInterval(this.intervals.get(name));
            this.intervals.delete(name);
            logger.debug(`[TimerManager:${this.context}] -Interval "${name}"`);
        }
    }

    /**
     * Vérifie si un timer existe
     * @param {string} name - Nom du timer
     * @returns {boolean}
     */
    has(name) {
        return this.timeouts.has(name) || this.intervals.has(name);
    }

    /**
     * Nettoie tous les timers du contexte
     */
    clearAll() {
        const countTimeouts = this.timeouts.size;
        const countIntervals = this.intervals.size;

        for (const id of this.timeouts.values()) {
            clearTimeout(id);
        }
        this.timeouts.clear();

        for (const id of this.intervals.values()) {
            clearInterval(id);
        }
        this.intervals.clear();

        if (countTimeouts + countIntervals > 0) {
            logger.log(`[TimerManager:${this.context}] Cleared ${countTimeouts} timeouts, ${countIntervals} intervals`);
        }
    }

    /**
     * Obtient les statistiques
     * @returns {{ timeouts: number, intervals: number }}
     */
    getStats() {
        return {
            context: this.context,
            timeouts: this.timeouts.size,
            intervals: this.intervals.size,
            total: this.timeouts.size + this.intervals.size
        };
    }

    /**
     * Debug - liste tous les timers actifs
     */
    debug() {
        logger.log(`[TimerManager:${this.context}] Active timers:`);
        logger.log(`  Timeouts: ${[...this.timeouts.keys()].join(', ') || 'none'}`);
        logger.log(`  Intervals: ${[...this.intervals.keys()].join(', ') || 'none'}`);
    }
}

// Instance globale pour usage simple
export const globalTimers = new TimerManager('global');

// Exposer pour debug en console
window.TimerManager = TimerManager;
window.globalTimers = globalTimers;
