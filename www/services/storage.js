// ============================================
// SERVICE DE STOCKAGE LOCAL
// Gestion de localStorage avec gestion d'erreurs
// Intègre SecurityManager pour les données sensibles
// ============================================

import { logger } from './logger.js';

// Clés sensibles qui nécessitent une protection
const SENSITIVE_KEYS = [
    'career',
    'snakeRoguelikeMeta',
    'snakeAchievements',
    'tr',
    'leaderboard',
    'boxData'
];

// Référence au SecurityManager (initialisé après)
let _securityManager = null;

/**
 * Initialise la référence au SecurityManager
 * Appelé après le chargement du SecurityManager
 */
export function initSecureStorage(secManager) {
    _securityManager = secManager;
    logger.log('[Storage] SecurityManager connecté');
}

/**
 * Sauvegarde une valeur dans le localStorage
 * Utilise SecurityManager pour les clés sensibles
 * @param {string} key - Clé de stockage
 * @param {*} value - Valeur à sauvegarder (sera JSON.stringified)
 * @returns {boolean} true si succès, false sinon
 */
export function save(key, value) {
    try {
        // Utiliser sauvegarde sécurisée pour les clés sensibles
        if (_securityManager && SENSITIVE_KEYS.includes(key)) {
            return _securityManager.saveSecure(key, value);
        }

        // Sauvegarde standard
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        logger.error(`Failed to save ${key}:`, e);

        // Notification utilisateur si quota dépassé
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            logger.warn('[Storage] Quota localStorage dépassé !');
            if (window.NotificationManager?.show) {
                window.NotificationManager.show('Stockage plein !', 'error');
            }
        }

        return false;
    }
}

/**
 * Charge une valeur depuis le localStorage
 * Utilise SecurityManager pour les clés sensibles
 * @param {string} key - Clé de stockage
 * @param {*} defaultValue - Valeur par défaut si la clé n'existe pas
 * @returns {*} La valeur chargée ou la valeur par défaut
 */
export function load(key, defaultValue = null) {
    try {
        // Utiliser chargement sécurisé pour les clés sensibles
        if (_securityManager && SENSITIVE_KEYS.includes(key)) {
            const result = _securityManager.loadSecure(key, defaultValue);

            // Si données modifiées, log mais retourner quand même
            if (result.tampered) {
                logger.warn(`[Storage] Données potentiellement modifiées: ${key}`);
            }

            return result.data;
        }

        // Chargement standard
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        logger.error(`Failed to load ${key}:`, e);
        return defaultValue;
    }
}

/**
 * Charge une valeur avec informations de validation
 * @param {string} key - Clé de stockage
 * @param {*} defaultValue - Valeur par défaut
 * @returns {object} { data, valid, tampered, reason }
 */
export function loadWithValidation(key, defaultValue = null) {
    if (_securityManager && SENSITIVE_KEYS.includes(key)) {
        return _securityManager.loadSecure(key, defaultValue);
    }

    try {
        const item = localStorage.getItem(key);
        return {
            data: item ? JSON.parse(item) : defaultValue,
            valid: true,
            tampered: false
        };
    } catch (e) {
        return {
            data: defaultValue,
            valid: false,
            reason: 'parse_error'
        };
    }
}

/**
 * Supprime une valeur du localStorage
 * @param {string} key - Clé à supprimer
 * @returns {boolean} true si succès, false sinon
 */
export function remove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        logger.error(`Failed to remove ${key}:`, e);
        return false;
    }
}

/**
 * Vérifie si une clé existe dans le localStorage
 * @param {string} key - Clé à vérifier
 * @returns {boolean} true si la clé existe
 */
export function exists(key) {
    try {
        return localStorage.getItem(key) !== null;
    } catch (e) {
        logger.error(`Failed to check ${key}:`, e);
        return false;
    }
}

/**
 * Vide complètement le localStorage
 * @returns {boolean} true si succès, false sinon
 */
export function clear() {
    try {
        localStorage.clear();
        return true;
    } catch (e) {
        logger.error('Failed to clear localStorage:', e);
        return false;
    }
}
