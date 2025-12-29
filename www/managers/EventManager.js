/**
 * Gestionnaire centralisé des événements
 * Assure le cleanup automatique pour éviter les memory leaks
 */

import { logger } from '../services/logger.js';

export class EventManager {
    constructor() {
        this.listeners = new Map();
        this.listenerId = 0;

        logger.debug('EventManager initialisé');
    }

    /**
     * Ajoute un event listener avec tracking automatique
     * @param {EventTarget} target - Élément cible
     * @param {string} event - Type d'événement
     * @param {Function} handler - Fonction callback
     * @param {Object} options - Options addEventListener
     * @returns {number} ID du listener (pour removal manuel)
     */
    add(target, event, handler, options = {}) {
        const id = ++this.listenerId;

        // Wrapper pour pouvoir retirer plus tard
        const wrappedHandler = (e) => handler(e);

        target.addEventListener(event, wrappedHandler, options);

        // Stocker pour cleanup
        if (!this.listeners.has(target)) {
            this.listeners.set(target, []);
        }

        this.listeners.get(target).push({
            id,
            event,
            handler: wrappedHandler,
            originalHandler: handler,
            options
        });

        logger.debug(`Event ajouté: ${event} (ID: ${id})`);

        return id;
    }

    /**
     * Retire un event listener par ID
     * @param {number} id - ID du listener
     * @returns {boolean} true si trouvé et retiré
     */
    remove(id) {
        for (const [target, handlers] of this.listeners.entries()) {
            const index = handlers.findIndex(h => h.id === id);
            if (index !== -1) {
                const { event, handler, options } = handlers[index];
                target.removeEventListener(event, handler, options);
                handlers.splice(index, 1);

                if (handlers.length === 0) {
                    this.listeners.delete(target);
                }

                logger.debug(`Event retiré: ${event} (ID: ${id})`);
                return true;
            }
        }
        return false;
    }

    /**
     * Retire tous les listeners d'une target spécifique
     * @param {EventTarget} target - Élément cible
     */
    removeAll(target) {
        const handlers = this.listeners.get(target);
        if (!handlers) return;

        handlers.forEach(({ event, handler, options }) => {
            target.removeEventListener(event, handler, options);
        });

        this.listeners.delete(target);
        logger.debug(`Tous les events retirés pour target`);
    }

    /**
     * Retire tous les listeners d'un type d'événement
     * @param {string} eventType - Type d'événement
     */
    removeByType(eventType) {
        let count = 0;

        for (const [target, handlers] of this.listeners.entries()) {
            const filtered = handlers.filter(h => {
                if (h.event === eventType) {
                    target.removeEventListener(h.event, h.handler, h.options);
                    count++;
                    return false;
                }
                return true;
            });

            if (filtered.length === 0) {
                this.listeners.delete(target);
            } else {
                this.listeners.set(target, filtered);
            }
        }

        logger.debug(`${count} listeners de type '${eventType}' retirés`);
    }

    /**
     * Nettoie TOUS les listeners
     */
    cleanup() {
        let total = 0;

        for (const [target, handlers] of this.listeners.entries()) {
            handlers.forEach(({ event, handler, options }) => {
                target.removeEventListener(event, handler, options);
                total++;
            });
        }

        this.listeners.clear();
        logger.log(`EventManager cleanup: ${total} listeners retirés`);
    }

    /**
     * Statistiques de debug
     * @returns {Object} Stats
     */
    getStats() {
        let total = 0;
        const byType = {};

        for (const handlers of this.listeners.values()) {
            handlers.forEach(h => {
                total++;
                byType[h.event] = (byType[h.event] || 0) + 1;
            });
        }

        return {
            targets: this.listeners.size,
            totalListeners: total,
            byType
        };
    }
}

// Export instance singleton
export const eventManager = new EventManager();

// Exposer globalement pour debug
if (typeof window !== 'undefined') {
    window.__eventManager = eventManager;
}
