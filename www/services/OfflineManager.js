/**
 * OFFLINE MANAGER - Détection et gestion du mode hors-ligne
 *
 * Fonctionnalités :
 * - Détection automatique de la connexion
 * - Bannière d'avertissement quand offline
 * - Désactivation des fonctionnalités nécessitant internet
 */

import { logger } from './logger.js';

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.banner = null;
        this.listeners = [];

        this.init();
    }

    /**
     * Initialise les event listeners
     */
    init() {
        // Écouter les changements de connexion
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Créer la bannière
        this.createBanner();

        // Vérifier l'état initial
        if (!navigator.onLine) {
            this.handleOffline();
        }

        logger.log(`[OfflineManager] Initialisé - En ligne: ${this.isOnline}`);
    }

    /**
     * Crée la bannière d'avertissement offline
     */
    createBanner() {
        this.banner = document.createElement('div');
        this.banner.className = 'offline-banner';
        this.banner.innerHTML = `
            <span class="offline-icon">📡</span>
            <span>Mode hors-ligne - Les classements et messages sont indisponibles</span>
        `;
        document.body.appendChild(this.banner);
    }

    /**
     * Gère le passage en ligne
     */
    handleOnline() {
        this.isOnline = true;
        this.hideBanner();

        // Notifier les listeners
        this.notifyListeners(true);

        logger.log('[OfflineManager] ✅ Connexion rétablie');

        // Notification utilisateur
        if (window.notificationManager) {
            window.notificationManager.success('Connexion rétablie !', 2000);
        }
    }

    /**
     * Gère le passage hors-ligne
     */
    handleOffline() {
        this.isOnline = false;
        this.showBanner();

        // Notifier les listeners
        this.notifyListeners(false);

        logger.log('[OfflineManager] ⚠️ Connexion perdue');
    }

    /**
     * Affiche la bannière offline
     */
    showBanner() {
        if (this.banner) {
            this.banner.classList.add('show');
        }
    }

    /**
     * Cache la bannière offline
     */
    hideBanner() {
        if (this.banner) {
            this.banner.classList.remove('show');
        }
    }

    /**
     * Vérifie si une fonctionnalité nécessitant internet est disponible
     * @param {string} feature - Nom de la fonctionnalité
     * @returns {boolean} - true si disponible
     */
    canUseFeature(feature) {
        if (this.isOnline) return true;

        // Afficher un message pour les fonctionnalités offline
        const offlineFeatures = ['leaderboard', 'messaging', 'firebase', 'sync'];

        if (offlineFeatures.includes(feature)) {
            this.showOfflineMessage(feature);
            return false;
        }

        return true;
    }

    /**
     * Affiche un message pour fonctionnalité indisponible offline
     */
    showOfflineMessage(feature) {
        const messages = {
            leaderboard: 'Les classements nécessitent une connexion internet',
            messaging: 'La messagerie nécessite une connexion internet',
            firebase: 'Cette fonctionnalité nécessite une connexion internet',
            sync: 'La synchronisation nécessite une connexion internet'
        };

        const message = messages[feature] || 'Connexion internet requise';

        if (window.notificationManager) {
            window.notificationManager.warning(message, 3000);
        }

        logger.log(`[OfflineManager] Fonctionnalité bloquée: ${feature}`);
    }

    /**
     * Ajoute un listener pour les changements de connexion
     * @param {Function} callback - Fonction appelée avec (isOnline)
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Retire un listener
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    /**
     * Notifie tous les listeners
     */
    notifyListeners(isOnline) {
        this.listeners.forEach(callback => {
            try {
                callback(isOnline);
            } catch (e) {
                logger.error('[OfflineManager] Erreur listener:', e);
            }
        });
    }

    /**
     * Getter pour l'état de connexion
     */
    get online() {
        return this.isOnline;
    }
}

// Singleton
const offlineManager = new OfflineManager();

// Export global
window.offlineManager = offlineManager;

export { offlineManager };
export default offlineManager;
