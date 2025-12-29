/**
 * NotificationManager.js
 * Gestionnaire centralisé des notifications avec gestion propre de la mémoire
 *
 * Résout le problème des timeouts orphelins et des notifications qui persistent
 * en mémoire après suppression de l'élément DOM.
 *
 * @version 1.0.0
 * @date 2025-11-19
 */

const NotificationManager = (function() {
    'use strict';

    // Stockage des timers actifs pour cleanup
    let activeTimers = [];

    // Stockage des notifications actives pour éviter doublons
    let activeNotifications = new Map();

    // Compteur pour IDs uniques
    let notificationIdCounter = 0;

    /**
     * Enregistre un timer pour tracking et cleanup futur
     * @private
     * @param {number} timerId - ID retourné par setTimeout
     */
    function registerTimer(timerId) {
        activeTimers.push(timerId);
    }

    /**
     * Supprime un timer de la liste de tracking
     * @private
     * @param {number} timerId - ID du timer à retirer
     */
    function unregisterTimer(timerId) {
        activeTimers = activeTimers.filter(id => id !== timerId);
    }

    /**
     * Affiche une notification de trophée débloqué
     * @public
     * @param {Object} trophy - Objet trophée avec {emoji, name, xp}
     * @param {Function} audioCallback - Callback optionnel pour jouer un son
     * @returns {string} ID de la notification créée
     */
    function showTrophyNotification(trophy, audioCallback = null) {
        const notifId = 'trophy-' + (notificationIdCounter++);

        logger.log('[NotificationManager] Affichage trophée:', trophy.name);

        // Créer l'élément DOM
        const notification = document.createElement('div');
        notification.className = 'trophy-notification';
        notification.dataset.notifId = notifId;
        notification.innerHTML = `
            <div class="trophy-notif-content">
                <div class="trophy-notif-emoji">${trophy.emoji}</div>
                <div class="trophy-notif-text">
                    <div class="trophy-notif-title">TROPHÉE DÉBLOQUÉ !</div>
                    <div class="trophy-notif-name">${trophy.name}</div>
                    <div class="trophy-notif-xp">+${trophy.xp} XP</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Stocker la référence
        activeNotifications.set(notifId, {
            element: notification,
            type: 'trophy',
            timers: []
        });

        // Timer 1 : Animation d'entrée (100ms)
        const timer1 = setTimeout(() => {
            notification.classList.add('show');
            unregisterTimer(timer1);
        }, 100);
        registerTimer(timer1);
        activeNotifications.get(notifId).timers.push(timer1);

        // Timer 2 : Animation de sortie (4000ms)
        const timer2 = setTimeout(() => {
            notification.classList.remove('show');
            unregisterTimer(timer2);

            // Timer 3 : Suppression finale (500ms après début sortie)
            const timer3 = setTimeout(() => {
                removeNotification(notifId);
            }, 500);
            registerTimer(timer3);
            activeNotifications.get(notifId).timers.push(timer3);

        }, 4000);
        registerTimer(timer2);
        activeNotifications.get(notifId).timers.push(timer2);

        // Jouer le son si callback fourni
        if (audioCallback && typeof audioCallback === 'function') {
            try {
                audioCallback();
            } catch (err) {
                logger.warn('[NotificationManager] Erreur audio trophée:', err);
            }
        }

        return notifId;
    }

    /**
     * Affiche une notification de montée de rang
     * @public
     * @param {Object} rank - Objet rang avec {emoji, name, color}
     * @param {Function} audioCallback - Callback optionnel pour jouer un son
     * @returns {string} ID de la notification créée
     */
    function showRankUpNotification(rank, audioCallback = null) {
        const notifId = 'rank-' + (notificationIdCounter++);

        logger.log('[NotificationManager] Affichage nouveau rang:', rank.name);

        // Créer l'élément DOM
        const notification = document.createElement('div');
        notification.className = 'rank-notification';
        notification.dataset.notifId = notifId;
        notification.innerHTML = `
            <div class="rank-notif-content">
                <div class="rank-notif-emoji">${rank.emoji}</div>
                <div class="rank-notif-text">
                    <div class="rank-notif-title">NOUVEAU RANG</div>
                    <div class="rank-notif-name">VOUS ÊTES MAINTENANT ${rank.name}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Stocker la référence
        activeNotifications.set(notifId, {
            element: notification,
            type: 'rank',
            timers: []
        });

        // Timer 1 : Animation d'entrée (100ms)
        const timer1 = setTimeout(() => {
            notification.classList.add('show');
            unregisterTimer(timer1);
        }, 100);
        registerTimer(timer1);
        activeNotifications.get(notifId).timers.push(timer1);

        // Timer 2 : Animation de sortie (4000ms)
        const timer2 = setTimeout(() => {
            notification.classList.remove('show');
            unregisterTimer(timer2);

            // Timer 3 : Suppression finale (500ms après début sortie)
            const timer3 = setTimeout(() => {
                removeNotification(notifId);
            }, 500);
            registerTimer(timer3);
            activeNotifications.get(notifId).timers.push(timer3);

        }, 4000);
        registerTimer(timer2);
        activeNotifications.get(notifId).timers.push(timer2);

        // Jouer le son si callback fourni
        if (audioCallback && typeof audioCallback === 'function') {
            try {
                audioCallback();
            } catch (err) {
                logger.warn('[NotificationManager] Erreur audio rang:', err);
            }
        }

        return notifId;
    }

    /**
     * Supprime une notification spécifique
     * @private
     * @param {string} notifId - ID de la notification à supprimer
     */
    function removeNotification(notifId) {
        const notif = activeNotifications.get(notifId);

        if (!notif) {
            return; // Déjà supprimée
        }

        // Nettoyer tous les timers associés
        notif.timers.forEach(timerId => {
            clearTimeout(timerId);
            unregisterTimer(timerId);
        });

        // Supprimer l'élément DOM
        if (notif.element && notif.element.parentNode) {
            notif.element.remove();
        }

        // Supprimer de la Map
        activeNotifications.delete(notifId);

        logger.log('[NotificationManager] Notification supprimée:', notifId);
    }

    /**
     * Nettoie toutes les notifications actives et leurs timers
     * @public
     * Appelé lors du changement de page ou fermeture du jeu
     */
    function cleanup() {
        logger.log('[NotificationManager] Cleanup de', activeNotifications.size, 'notifications et', activeTimers.length, 'timers');

        // Nettoyer toutes les notifications une par une
        const notifIds = Array.from(activeNotifications.keys());
        notifIds.forEach(notifId => removeNotification(notifId));

        // Double sécurité : nettoyer tous les timers restants
        activeTimers.forEach(timerId => clearTimeout(timerId));
        activeTimers = [];

        // Supprimer visuellement toutes les notifications qui traînent encore
        document.querySelectorAll('.trophy-notification, .rank-notification').forEach(el => {
            el.remove();
        });

        logger.log('[NotificationManager] Cleanup terminé');
    }

    /**
     * Retourne les statistiques du gestionnaire (pour debug)
     * @public
     * @returns {Object} Stats avec nombre de notifications et timers actifs
     */
    function getStats() {
        return {
            activeNotifications: activeNotifications.size,
            activeTimers: activeTimers.length,
            notificationIds: Array.from(activeNotifications.keys())
        };
    }

    /**
     * Affiche une notification simple (générique)
     * @public
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification ('success', 'error', 'info', 'warning')
     * @param {number} duration - Durée d'affichage en ms (défaut: 3000)
     * @returns {string} ID de la notification créée
     */
    function show(message, type = 'info', duration = 3000) {
        const notifId = 'notif-' + (notificationIdCounter++);

        logger.log(`[NotificationManager] Affichage ${type}:`, message);

        // Créer l'élément DOM
        const notification = document.createElement('div');
        notification.className = `simple-notification ${type}`;
        notification.dataset.notifId = notifId;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Stocker la référence
        activeNotifications.set(notifId, {
            element: notification,
            type: 'simple',
            timers: []
        });

        // Timer 1 : Animation d'entrée (100ms)
        const timer1 = setTimeout(() => {
            notification.classList.add('show');
            unregisterTimer(timer1);
        }, 100);
        registerTimer(timer1);
        activeNotifications.get(notifId).timers.push(timer1);

        // Timer 2 : Animation de sortie
        const timer2 = setTimeout(() => {
            notification.classList.remove('show');
            unregisterTimer(timer2);

            // Timer 3 : Suppression finale (300ms après début sortie)
            const timer3 = setTimeout(() => {
                removeNotification(notifId);
            }, 300);
            registerTimer(timer3);
            activeNotifications.get(notifId).timers.push(timer3);

        }, duration);
        registerTimer(timer2);
        activeNotifications.get(notifId).timers.push(timer2);

        return notifId;
    }

    // API Publique
    return {
        showTrophyNotification,
        showRankUpNotification,
        show,  // ✅ NOUVELLE méthode générique
        cleanup,
        getStats
    };
})();

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}

// Rendre disponible globalement pour snake.js et autres modules
window.NotificationManager = NotificationManager;
