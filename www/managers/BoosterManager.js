/**
 * BOOSTER MANAGER - Système de boosters XP
 *
 * Responsabilités :
 * - Affichage des boosters disponibles
 * - Timer du booster actif
 * - Activation des boosters
 */

import { logger } from '../services/logger.js';
import { adMobManager } from '../services/AdMobManager.js';

// ============================================
// CLASSE BOOSTER MANAGER
// ============================================

class BoosterManager {
    constructor() {
        this.timerInterval = null;
        logger.log('[BoosterManager] Initialisé');
    }

    /**
     * Met à jour l'affichage des boosters dans Ma Box
     */
    updateBoostersDisplay() {
        if (!window.boxManager) return;

        const boosters = window.boxManager.getBoosters();
        const activeBooster = window.boxManager.getActiveBooster();

        // Mettre à jour les compteurs (Hub + Box - mêmes IDs maintenant)
        const hubCount25El = document.getElementById('hub-booster-25-count');
        const hubCount50El = document.getElementById('hub-booster-50-count');
        const hubItem25El = document.getElementById('hub-booster-25');
        const hubItem50El = document.getElementById('hub-booster-50');

        if (hubCount25El) hubCount25El.textContent = boosters.boost25;
        if (hubCount50El) hubCount50El.textContent = boosters.boost50;

        // Gérer l'opacité selon le count (via data-attribute)
        if (hubItem25El) {
            hubItem25El.setAttribute('data-count', boosters.boost25);
            hubItem25El.classList.toggle('disabled', boosters.boost25 === 0 || activeBooster !== null);
        }
        if (hubItem50El) {
            hubItem50El.setAttribute('data-count', boosters.boost50);
            hubItem50El.classList.toggle('disabled', boosters.boost50 === 0 || activeBooster !== null);
        }

        // Afficher indicateur booster actif
        if (activeBooster) {
            if (hubItem25El && activeBooster.percent === 25) {
                hubItem25El.classList.add('active-glow');
            }
            if (hubItem50El && activeBooster.percent === 50) {
                hubItem50El.classList.add('active-glow');
            }
        } else {
            if (hubItem25El) hubItem25El.classList.remove('active-glow');
            if (hubItem50El) hubItem50El.classList.remove('active-glow');
        }
    }

    /**
     * Met à jour le timer du booster actif
     */
    updateBoosterTimer() {
        if (!window.boxManager) return;

        const activeBooster = window.boxManager.getActiveBooster();
        const timerEl = document.getElementById('hub-booster-timer');
        const activeEl = document.getElementById('hub-booster-active');

        if (!activeBooster) {
            // Booster expiré
            if (activeEl) activeEl.style.display = 'none';
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            this.updateBoostersDisplay();
            return;
        }

        // Calculer le temps restant
        const remainingMs = activeBooster.remainingMs;
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);

        if (timerEl) {
            timerEl.textContent = `⚗️ +${activeBooster.percent}% - ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Active un booster
     * @param {number} percent - 25 ou 50
     */
    activateBooster(percent) {
        if (!window.boxManager) {
            logger.warn('[BoosterManager] BoxManager non disponible');
            return false;
        }

        // Jouer un son
        if (window.audio) window.audio.buttonClick();

        const success = window.boxManager.activateBooster(percent);

        if (success) {
            logger.log(`[BoosterManager] ⚗️ Booster ${percent}% activé !`);
            this.updateBoostersDisplay();

            // Démarrer le timer si pas déjà actif
            if (!this.timerInterval) {
                this.timerInterval = setInterval(() => this.updateBoosterTimer(), 1000);
            }
        }

        return success;
    }

    /**
     * Initialise le timer si un booster est actif
     */
    initBoosterTimer() {
        if (!window.boxManager) return;

        const activeBooster = window.boxManager.getActiveBooster();
        if (activeBooster && !this.timerInterval) {
            this.timerInterval = setInterval(() => this.updateBoosterTimer(), 1000);
            this.updateBoosterTimer();
        }
    }

    /**
     * Regarde une pub pour obtenir un coffre gratuit
     * @returns {Promise<boolean>} true si récompense obtenue
     */
    async watchAdForChest() {
        logger.log('[BoosterManager] Tentative pub rewarded pour coffre');

        // Vérifier si on peut ajouter un coffre
        if (window.boxManager && !window.boxManager.canAddChest()) {
            logger.warn('[BoosterManager] Max coffres atteint');
            if (window.notificationManager) {
                window.notificationManager.show('Max coffres atteint (5) !', 'warning');
            }
            return false;
        }

        // Vérifier si AdMob est disponible
        if (!adMobManager.initialized && !adMobManager.testMode) {
            logger.warn('[BoosterManager] AdMob non disponible');
            if (window.notificationManager) {
                window.notificationManager.show('Pubs non disponibles', 'error');
            }
            return false;
        }

        try {
            const rewarded = await adMobManager.showRewarded((reward) => {
                // Récompense : 1 coffre à ouvrir dans Ma Box
                if (window.boxManager) {
                    const added = window.boxManager.addChest();

                    if (added) {
                        logger.log('[BoosterManager] Coffre obtenu via pub !');
                    }
                }
            });

            return rewarded;
        } catch (error) {
            logger.error('[BoosterManager] Erreur pub rewarded:', error.message);
            if (window.notificationManager) {
                window.notificationManager.show('Erreur de chargement', 'error');
            }
            return false;
        }
    }

    /**
     * Nettoie le timer
     */
    cleanup() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            logger.log('[BoosterManager] Timer nettoyé');
        }
    }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

const boosterManager = new BoosterManager();

// Exposer globalement pour compatibilité HTML onclick
window.boosterManager = boosterManager;
window.activateBooster = (percent) => boosterManager.activateBooster(percent);
window.updateBoostersDisplay = () => boosterManager.updateBoostersDisplay();
window.watchAdForChest = () => boosterManager.watchAdForChest();

logger.log('✅ BoosterManager chargé');

export { boosterManager, BoosterManager };
