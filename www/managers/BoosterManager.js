/**
 * BOOSTER MANAGER - Système de boosters XP
 *
 * Responsabilités :
 * - Affichage des boosters disponibles
 * - Timer du booster actif
 * - Activation des boosters
 */

import { logger } from '../services/logger.js';

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

        // Mettre à jour les compteurs
        const count25El = document.getElementById('box-booster-25-count');
        const count50El = document.getElementById('box-booster-50-count');
        const item25El = document.getElementById('box-booster-25');
        const item50El = document.getElementById('box-booster-50');

        if (count25El) count25El.textContent = boosters.boost25;
        if (count50El) count50El.textContent = boosters.boost50;

        // Désactiver si pas de booster ou booster actif
        if (item25El) {
            item25El.classList.toggle('disabled', boosters.boost25 === 0 || activeBooster !== null);
        }
        if (item50El) {
            item50El.classList.toggle('disabled', boosters.boost50 === 0 || activeBooster !== null);
        }

        // Afficher indicateur booster actif
        if (activeBooster) {
            if (item25El && activeBooster.percent === 25) {
                item25El.classList.add('active-glow');
            }
            if (item50El && activeBooster.percent === 50) {
                item50El.classList.add('active-glow');
            }
        } else {
            if (item25El) item25El.classList.remove('active-glow');
            if (item50El) item50El.classList.remove('active-glow');
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

logger.log('✅ BoosterManager chargé');

export { boosterManager, BoosterManager };
