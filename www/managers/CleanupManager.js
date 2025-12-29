/**
 * CleanupManager.js
 * Gestionnaire centralisé pour le nettoyage des ressources
 *
 * Permet de tracker et nettoyer :
 * - setInterval / setTimeout
 * - requestAnimationFrame
 * - Event listeners
 * - Objets à détruire
 *
 * Usage:
 *   // Enregistrer un interval
 *   const id = CleanupManager.registerInterval(setInterval(fn, 1000), 'game-loop');
 *
 *   // Enregistrer un timeout
 *   CleanupManager.registerTimeout(setTimeout(fn, 5000), 'delay');
 *
 *   // Enregistrer un RAF
 *   CleanupManager.registerRAF(requestAnimationFrame(fn), 'render');
 *
 *   // Nettoyer un contexte spécifique
 *   CleanupManager.cleanup('solo-game');
 *
 *   // Nettoyer tout
 *   CleanupManager.cleanupAll();
 *
 * @version 1.0.0
 */

import { logger } from '../services/logger.js';

const CleanupManager = (function() {
    'use strict';

    // Stockage des ressources par contexte
    const intervals = new Map();      // context -> Set<{id, name}>
    const timeouts = new Map();       // context -> Set<{id, name}>
    const rafs = new Map();           // context -> Set<{id, name}>
    const listeners = new Map();      // context -> Set<{element, event, handler, options}>
    const cleanupCallbacks = new Map(); // context -> Set<Function>

    // Contexte par défaut
    let currentContext = 'global';

    /**
     * Définit le contexte actuel pour les enregistrements
     * @param {string} context - Nom du contexte (ex: 'solo-game', 'multi-game')
     */
    function setContext(context) {
        currentContext = context;
        logger.debug(`[CleanupManager] Contexte: ${context}`);
    }

    /**
     * Récupère le contexte actuel
     * @returns {string}
     */
    function getContext() {
        return currentContext;
    }

    /**
     * Initialise les Sets pour un contexte si nécessaire
     * @param {string} context
     */
    function ensureContext(context) {
        if (!intervals.has(context)) intervals.set(context, new Set());
        if (!timeouts.has(context)) timeouts.set(context, new Set());
        if (!rafs.has(context)) rafs.set(context, new Set());
        if (!listeners.has(context)) listeners.set(context, new Set());
        if (!cleanupCallbacks.has(context)) cleanupCallbacks.set(context, new Set());
    }

    /**
     * Enregistre un setInterval pour tracking
     * @param {number} intervalId - ID retourné par setInterval
     * @param {string} name - Nom descriptif (pour debug)
     * @param {string} context - Contexte optionnel (défaut: contexte actuel)
     * @returns {number} L'ID de l'interval
     */
    function registerInterval(intervalId, name = 'unnamed', context = currentContext) {
        ensureContext(context);
        intervals.get(context).add({ id: intervalId, name });
        logger.debug(`[CleanupManager] +Interval "${name}" (${context})`);
        return intervalId;
    }

    /**
     * Enregistre un setTimeout pour tracking
     * @param {number} timeoutId - ID retourné par setTimeout
     * @param {string} name - Nom descriptif
     * @param {string} context - Contexte optionnel
     * @returns {number} L'ID du timeout
     */
    function registerTimeout(timeoutId, name = 'unnamed', context = currentContext) {
        ensureContext(context);
        timeouts.get(context).add({ id: timeoutId, name });
        logger.debug(`[CleanupManager] +Timeout "${name}" (${context})`);
        return timeoutId;
    }

    /**
     * Enregistre un requestAnimationFrame pour tracking
     * @param {number} rafId - ID retourné par requestAnimationFrame
     * @param {string} name - Nom descriptif
     * @param {string} context - Contexte optionnel
     * @returns {number} L'ID du RAF
     */
    function registerRAF(rafId, name = 'unnamed', context = currentContext) {
        ensureContext(context);
        rafs.get(context).add({ id: rafId, name });
        return rafId;
    }

    /**
     * Enregistre un event listener pour tracking
     * @param {EventTarget} element - Élément DOM
     * @param {string} event - Nom de l'événement
     * @param {Function} handler - Handler de l'événement
     * @param {Object} options - Options addEventListener
     * @param {string} context - Contexte optionnel
     */
    function registerListener(element, event, handler, options = {}, context = currentContext) {
        ensureContext(context);
        listeners.get(context).add({ element, event, handler, options });
        element.addEventListener(event, handler, options);
        logger.debug(`[CleanupManager] +Listener "${event}" (${context})`);
    }

    /**
     * Enregistre une fonction de cleanup à appeler lors du nettoyage
     * @param {Function} callback - Fonction à appeler
     * @param {string} context - Contexte optionnel
     */
    function registerCleanupCallback(callback, context = currentContext) {
        ensureContext(context);
        cleanupCallbacks.get(context).add(callback);
    }

    /**
     * Supprime un interval spécifique
     * @param {number} intervalId - ID de l'interval à supprimer
     * @param {string} context - Contexte optionnel
     */
    function clearRegisteredInterval(intervalId, context = currentContext) {
        if (intervals.has(context)) {
            const set = intervals.get(context);
            for (const item of set) {
                if (item.id === intervalId) {
                    clearInterval(intervalId);
                    set.delete(item);
                    logger.debug(`[CleanupManager] -Interval "${item.name}" (${context})`);
                    return;
                }
            }
        }
        // Fallback: clear même si non trouvé
        clearInterval(intervalId);
    }

    /**
     * Supprime un timeout spécifique
     * @param {number} timeoutId - ID du timeout à supprimer
     * @param {string} context - Contexte optionnel
     */
    function clearRegisteredTimeout(timeoutId, context = currentContext) {
        if (timeouts.has(context)) {
            const set = timeouts.get(context);
            for (const item of set) {
                if (item.id === timeoutId) {
                    clearTimeout(timeoutId);
                    set.delete(item);
                    logger.debug(`[CleanupManager] -Timeout "${item.name}" (${context})`);
                    return;
                }
            }
        }
        // Fallback
        clearTimeout(timeoutId);
    }

    /**
     * Supprime un RAF spécifique
     * @param {number} rafId - ID du RAF à supprimer
     * @param {string} context - Contexte optionnel
     */
    function clearRegisteredRAF(rafId, context = currentContext) {
        if (rafs.has(context)) {
            const set = rafs.get(context);
            for (const item of set) {
                if (item.id === rafId) {
                    cancelAnimationFrame(rafId);
                    set.delete(item);
                    return;
                }
            }
        }
        // Fallback
        cancelAnimationFrame(rafId);
    }

    /**
     * Nettoie toutes les ressources d'un contexte
     * @param {string} context - Contexte à nettoyer
     */
    function cleanup(context) {
        logger.log(`[CleanupManager] Cleanup "${context}"...`);
        let cleaned = { intervals: 0, timeouts: 0, rafs: 0, listeners: 0, callbacks: 0 };

        // Intervals
        if (intervals.has(context)) {
            for (const item of intervals.get(context)) {
                clearInterval(item.id);
                cleaned.intervals++;
            }
            intervals.get(context).clear();
        }

        // Timeouts
        if (timeouts.has(context)) {
            for (const item of timeouts.get(context)) {
                clearTimeout(item.id);
                cleaned.timeouts++;
            }
            timeouts.get(context).clear();
        }

        // RAFs
        if (rafs.has(context)) {
            for (const item of rafs.get(context)) {
                cancelAnimationFrame(item.id);
                cleaned.rafs++;
            }
            rafs.get(context).clear();
        }

        // Listeners
        if (listeners.has(context)) {
            for (const item of listeners.get(context)) {
                try {
                    item.element.removeEventListener(item.event, item.handler, item.options);
                    cleaned.listeners++;
                } catch (e) {
                    // Element peut avoir été supprimé
                }
            }
            listeners.get(context).clear();
        }

        // Cleanup callbacks
        if (cleanupCallbacks.has(context)) {
            for (const callback of cleanupCallbacks.get(context)) {
                try {
                    callback();
                    cleaned.callbacks++;
                } catch (e) {
                    logger.warn(`[CleanupManager] Erreur callback cleanup:`, e);
                }
            }
            cleanupCallbacks.get(context).clear();
        }

        logger.log(`[CleanupManager] Nettoyé: ${cleaned.intervals} intervals, ${cleaned.timeouts} timeouts, ${cleaned.rafs} RAFs, ${cleaned.listeners} listeners, ${cleaned.callbacks} callbacks`);
    }

    /**
     * Nettoie TOUTES les ressources de tous les contextes
     */
    function cleanupAll() {
        logger.log('[CleanupManager] Cleanup ALL...');

        for (const context of intervals.keys()) {
            cleanup(context);
        }

        // Reset contexte
        currentContext = 'global';
    }

    /**
     * Diagnostic: affiche l'état actuel
     */
    function diagnostic() {
        logger.log('═══════════════════════════════════════════════════════');
        logger.log('[CleanupManager] DIAGNOSTIC');
        logger.log('═══════════════════════════════════════════════════════');
        logger.log(`Contexte actuel: ${currentContext}`);

        for (const [context, set] of intervals) {
            if (set.size > 0) {
                logger.log(`\n[${context}] Intervals (${set.size}):`);
                for (const item of set) {
                    logger.log(`  - ${item.name} (ID: ${item.id})`);
                }
            }
        }

        for (const [context, set] of timeouts) {
            if (set.size > 0) {
                logger.log(`\n[${context}] Timeouts (${set.size}):`);
                for (const item of set) {
                    logger.log(`  - ${item.name} (ID: ${item.id})`);
                }
            }
        }

        for (const [context, set] of rafs) {
            if (set.size > 0) {
                logger.log(`\n[${context}] RAFs (${set.size}):`);
                for (const item of set) {
                    logger.log(`  - ${item.name}`);
                }
            }
        }

        for (const [context, set] of listeners) {
            if (set.size > 0) {
                logger.log(`\n[${context}] Listeners (${set.size}):`);
                for (const item of set) {
                    logger.log(`  - ${item.event} on ${item.element.tagName || 'window'}`);
                }
            }
        }

        logger.log('═══════════════════════════════════════════════════════');
    }

    /**
     * Retourne les statistiques actuelles
     * @returns {Object}
     */
    function getStats() {
        let total = { intervals: 0, timeouts: 0, rafs: 0, listeners: 0 };

        for (const set of intervals.values()) total.intervals += set.size;
        for (const set of timeouts.values()) total.timeouts += set.size;
        for (const set of rafs.values()) total.rafs += set.size;
        for (const set of listeners.values()) total.listeners += set.size;

        return total;
    }

    // API publique
    return {
        setContext,
        getContext,
        registerInterval,
        registerTimeout,
        registerRAF,
        registerListener,
        registerCleanupCallback,
        clearRegisteredInterval,
        clearRegisteredTimeout,
        clearRegisteredRAF,
        cleanup,
        cleanupAll,
        diagnostic,
        getStats
    };

})();

// Exposer globalement
window.CleanupManager = CleanupManager;

// Exposer diagnostic en console
window.diagCleanup = () => CleanupManager.diagnostic();

export { CleanupManager };
