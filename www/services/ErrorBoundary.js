/**
 * ErrorBoundary.js
 * Service de gestion d'erreurs global pour Snake Ultra
 *
 * Fonctionnalités:
 * - Capture des erreurs globales (window.onerror)
 * - Capture des promesses rejetées (unhandledrejection)
 * - Notifications utilisateur via NotificationManager
 * - Déduplication pour éviter le spam de notifications
 * - Logging structuré via logger
 *
 * @version 1.0.0
 */

import { logger } from './logger.js';

const ErrorBoundary = (function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Délai minimum entre notifications identiques (ms)
        DEDUP_WINDOW: 5000,
        // Nombre max d'erreurs par minute avant throttling
        MAX_ERRORS_PER_MINUTE: 10,
        // Durée d'affichage des notifications d'erreur (ms)
        NOTIFICATION_DURATION: 4000,
        // Messages user-friendly par catégorie
        USER_MESSAGES: {
            network: 'Problème de connexion. Vérifiez votre réseau.',
            script: 'Une erreur est survenue. Le jeu continue.',
            promise: 'Opération interrompue. Réessayez.',
            generic: 'Oups ! Une erreur inattendue est survenue.'
        }
    };

    // État interne
    let isInitialized = false;
    let recentErrors = new Map(); // Pour déduplication
    let errorCount = 0;
    let errorCountResetTime = Date.now();
    let notificationManager = null;

    /**
     * Initialise le système de capture d'erreurs
     * @public
     */
    function init() {
        if (isInitialized) {
            logger.warn('[ErrorBoundary] Déjà initialisé');
            return;
        }

        // Récupérer le NotificationManager global
        notificationManager = window.NotificationManager || null;

        // Installer les handlers globaux
        installGlobalErrorHandler();
        installUnhandledRejectionHandler();

        isInitialized = true;
        logger.log('[ErrorBoundary] Initialisé avec succès');
    }

    /**
     * Installe le handler pour window.onerror
     * @private
     */
    function installGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            const errorInfo = {
                type: 'script',
                message: event.message || 'Erreur inconnue',
                filename: event.filename || 'unknown',
                lineno: event.lineno || 0,
                colno: event.colno || 0,
                stack: event.error?.stack || null
            };

            handleError(errorInfo);
        });
    }

    /**
     * Installe le handler pour les promesses rejetées
     * @private
     */
    function installUnhandledRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason;
            const errorInfo = {
                type: 'promise',
                message: reason?.message || String(reason) || 'Promesse rejetée',
                stack: reason?.stack || null
            };

            handleError(errorInfo);
        });
    }

    /**
     * Traite une erreur capturée
     * @private
     * @param {Object} errorInfo - Infos sur l'erreur
     */
    function handleError(errorInfo) {
        // Vérifier le throttling
        if (isThrottled()) {
            logger.warn('[ErrorBoundary] Throttling actif - erreur ignorée');
            return;
        }

        // Créer une clé unique pour déduplication
        const errorKey = createErrorKey(errorInfo);

        // Vérifier la déduplication
        if (isDuplicate(errorKey)) {
            logger.debug('[ErrorBoundary] Erreur dupliquée ignorée:', errorKey);
            return;
        }

        // Enregistrer pour déduplication
        markAsSeen(errorKey);

        // Logger l'erreur
        logError(errorInfo);

        // Notifier l'utilisateur
        notifyUser(errorInfo);

        // Incrémenter le compteur
        incrementErrorCount();
    }

    /**
     * Crée une clé unique pour identifier une erreur
     * @private
     */
    function createErrorKey(errorInfo) {
        return `${errorInfo.type}:${errorInfo.message}:${errorInfo.filename || ''}:${errorInfo.lineno || 0}`;
    }

    /**
     * Vérifie si une erreur est un doublon récent
     * @private
     */
    function isDuplicate(errorKey) {
        const lastSeen = recentErrors.get(errorKey);
        if (!lastSeen) return false;
        return (Date.now() - lastSeen) < CONFIG.DEDUP_WINDOW;
    }

    /**
     * Marque une erreur comme vue
     * @private
     */
    function markAsSeen(errorKey) {
        recentErrors.set(errorKey, Date.now());

        // Nettoyer les anciennes entrées périodiquement
        if (recentErrors.size > 50) {
            cleanupOldEntries();
        }
    }

    /**
     * Nettoie les entrées de déduplication expirées
     * @private
     */
    function cleanupOldEntries() {
        const now = Date.now();
        for (const [key, time] of recentErrors.entries()) {
            if (now - time > CONFIG.DEDUP_WINDOW * 2) {
                recentErrors.delete(key);
            }
        }
    }

    /**
     * Vérifie si le throttling est actif
     * @private
     */
    function isThrottled() {
        const now = Date.now();

        // Reset le compteur chaque minute
        if (now - errorCountResetTime > 60000) {
            errorCount = 0;
            errorCountResetTime = now;
        }

        return errorCount >= CONFIG.MAX_ERRORS_PER_MINUTE;
    }

    /**
     * Incrémente le compteur d'erreurs
     * @private
     */
    function incrementErrorCount() {
        errorCount++;
    }

    /**
     * Log l'erreur avec le logger
     * @private
     */
    function logError(errorInfo) {
        const logData = {
            type: errorInfo.type,
            message: errorInfo.message,
            timestamp: new Date().toISOString()
        };

        if (errorInfo.filename) {
            logData.location = `${errorInfo.filename}:${errorInfo.lineno}:${errorInfo.colno}`;
        }

        if (errorInfo.stack) {
            logData.stack = errorInfo.stack;
        }

        logger.error('[ErrorBoundary]', errorInfo.message, logData);
    }

    /**
     * Notifie l'utilisateur d'une erreur
     * @private
     */
    function notifyUser(errorInfo) {
        if (!notificationManager) {
            // Fallback si NotificationManager pas disponible
            return;
        }

        // Déterminer le message user-friendly
        let userMessage = CONFIG.USER_MESSAGES.generic;

        if (errorInfo.message.includes('fetch') ||
            errorInfo.message.includes('network') ||
            errorInfo.message.includes('Failed to fetch')) {
            userMessage = CONFIG.USER_MESSAGES.network;
        } else if (errorInfo.type === 'promise') {
            userMessage = CONFIG.USER_MESSAGES.promise;
        } else if (errorInfo.type === 'script') {
            userMessage = CONFIG.USER_MESSAGES.script;
        }

        notificationManager.show(userMessage, 'error', CONFIG.NOTIFICATION_DURATION);
    }

    /**
     * Wrapper pour exécuter une fonction de manière sécurisée
     * @public
     * @param {Function} fn - Fonction à exécuter
     * @param {any} fallback - Valeur de retour en cas d'erreur
     * @returns {any} Résultat de la fonction ou fallback
     */
    function safeExecute(fn, fallback = null) {
        try {
            return fn();
        } catch (error) {
            handleError({
                type: 'script',
                message: error.message,
                stack: error.stack
            });
            return fallback;
        }
    }

    /**
     * Wrapper pour exécuter une fonction async de manière sécurisée
     * @public
     * @param {Function} asyncFn - Fonction async à exécuter
     * @param {any} fallback - Valeur de retour en cas d'erreur
     * @returns {Promise<any>} Résultat de la fonction ou fallback
     */
    async function safeExecuteAsync(asyncFn, fallback = null) {
        try {
            return await asyncFn();
        } catch (error) {
            handleError({
                type: 'promise',
                message: error.message,
                stack: error.stack
            });
            return fallback;
        }
    }

    /**
     * Capture manuellement une erreur
     * @public
     * @param {Error|string} error - Erreur à capturer
     * @param {Object} context - Contexte additionnel
     */
    function captureError(error, context = {}) {
        const errorInfo = {
            type: context.type || 'manual',
            message: error.message || String(error),
            stack: error.stack || null,
            ...context
        };

        handleError(errorInfo);
    }

    /**
     * Retourne les statistiques d'erreurs
     * @public
     */
    function getStats() {
        return {
            isInitialized,
            errorCount,
            recentErrorsCount: recentErrors.size,
            isThrottled: isThrottled()
        };
    }

    /**
     * Réinitialise les compteurs (pour tests)
     * @public
     */
    function reset() {
        recentErrors.clear();
        errorCount = 0;
        errorCountResetTime = Date.now();
        logger.log('[ErrorBoundary] Compteurs réinitialisés');
    }

    // API Publique
    return {
        init,
        safeExecute,
        safeExecuteAsync,
        captureError,
        getStats,
        reset
    };
})();

// Export ES6
export { ErrorBoundary };

// Export global pour compatibilité
if (typeof window !== 'undefined') {
    window.ErrorBoundary = ErrorBoundary;
}
