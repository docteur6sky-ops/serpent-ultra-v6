/**
 * Service de logging avec activation conditionnelle
 * En production, seuls les erreurs sont loggées
 * En développement, tous les logs sont actifs
 */

// Détecter l'environnement
const IS_DEV = window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.port === '8080';

export const logger = {
    /**
     * Log normal (uniquement en dev)
     */
    log: (...args) => {
        if (IS_DEV) {
            console.log('[Snake Ultra]', ...args);
        }
    },

    /**
     * Warning (uniquement en dev)
     */
    warn: (...args) => {
        if (IS_DEV) {
            console.warn('[Snake Ultra]', ...args);
        }
    },

    /**
     * Erreur (toujours loggée, même en prod)
     */
    error: (...args) => {
        console.error('[Snake Ultra]', ...args);
    },

    /**
     * Debug détaillé (uniquement en dev)
     */
    debug: (...args) => {
        if (IS_DEV) {
            console.debug('[Snake Ultra]', ...args);
        }
    },

    /**
     * Groupe de logs (uniquement en dev)
     */
    group: (label) => {
        if (IS_DEV) {
            console.group(`[Snake Ultra] ${label}`);
        }
    },

    /**
     * Fin de groupe (uniquement en dev)
     */
    groupEnd: () => {
        if (IS_DEV) {
            console.groupEnd();
        }
    },

    /**
     * Table (uniquement en dev)
     */
    table: (data) => {
        if (IS_DEV) {
            console.table(data);
        }
    },

    /**
     * Timer start (uniquement en dev)
     */
    time: (label) => {
        if (IS_DEV) {
            console.time(`[Snake Ultra] ${label}`);
        }
    },

    /**
     * Timer end (uniquement en dev)
     */
    timeEnd: (label) => {
        if (IS_DEV) {
            console.timeEnd(`[Snake Ultra] ${label}`);
        }
    }
};

// Exposer l'état dev pour debug
logger.isDev = IS_DEV;

// Exposer globalement pour compatibilité
if (typeof window !== 'undefined') {
    window.logger = logger;
}
