// ============================================
// DIFFICULTY - Gestion de la difficulté
// Module extrait de navigation.js
// ============================================

import { logger } from '../services/logger.js';

// Variable pour tracker le mode actuel du modal (solo ou ai)
let currentModalMode = 'solo';

// Difficulté actuelle (0 = Facile, 1 = Normal, 2 = Difficile)
let currentDifficulty = 0;

// ============================================
// GESTION DE LA DIFFICULTÉ
// ============================================

/**
 * Change la difficulté sélectionnée
 * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
 */
export function setDiff(difficulty) {
    currentDifficulty = difficulty;
    window.currentDifficulty = difficulty; // Synchroniser avec window pour l'accès HTML

    // Mettre à jour l'UI des tabs de difficulté (nouveau design menu principal)
    const tabs = document.querySelectorAll('.diff-tab');
    tabs.forEach((tab) => {
        const tabDiff = parseInt(tab.getAttribute('data-diff'));
        if (tabDiff === difficulty) {
            tab.classList.add('active');
            tab.setAttribute('aria-checked', 'true');
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-checked', 'false');
        }
    });

    // Mettre à jour l'UI des tabs du HUB V6
    const hubTabs = document.querySelectorAll('.hub-diff-tab');
    hubTabs.forEach((tab) => {
        const tabDiff = parseInt(tab.getAttribute('data-diff'));
        if (tabDiff === difficulty) {
            tab.classList.add('active');
            tab.setAttribute('aria-checked', 'true');
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-checked', 'false');
        }
    });

    // Compatibilité avec les anciens boutons .diff-btn (si présents)
    const oldButtons = document.querySelectorAll('.diff-btn');
    oldButtons.forEach((btn, index) => {
        if (index === difficulty) {
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        }
    });

    // Son du bouton
    if (window.audio && window.audio.buttonClick) {
        window.audio.buttonClick();
    }
}

/**
 * Retourne la difficulté actuelle
 * @returns {number}
 */
export function getCurrentDifficulty() {
    return currentDifficulty;
}

// ============================================
// MODAL SÉLECTION DIFFICULTÉ
// ============================================

/**
 * Affiche le modal de sélection de difficulté
 * @param {string} mode - 'solo' ou 'ai'
 */
export function showDifficultyModal(mode = 'solo') {
    logger.log(`[Difficulty] Ouverture modal difficulté (mode: ${mode})`);

    // Stocker le mode actuel
    currentModalMode = mode;

    const modal = document.getElementById('difficulty-modal');
    const title = document.querySelector('.diff-modal-title');
    const btnNormal = document.getElementById('diff-btn-normal');
    const btnHard = document.getElementById('diff-btn-hard');
    const btnEasy = document.getElementById('diff-btn-easy');

    if (!modal) return;

    // Configurer le modal selon le mode
    if (mode === 'ai') {
        // Mode IA : seulement Facile disponible
        if (title) title.textContent = 'Choisis ta difficulté (vs IA)';

        // Désactiver Normal et Hard
        if (btnNormal) {
            btnNormal.classList.add('diff-disabled');
            btnNormal.disabled = true;
        }
        if (btnHard) {
            btnHard.classList.add('diff-disabled');
            btnHard.disabled = true;
        }
        if (btnEasy) {
            btnEasy.classList.remove('diff-disabled');
            btnEasy.disabled = false;
        }

        // Modifier les textes de description
        const normalDesc = document.querySelector('#diff-btn-normal .diff-choice-desc');
        const hardDesc = document.querySelector('#diff-btn-hard .diff-choice-desc');
        if (normalDesc) normalDesc.textContent = 'À venir...';
        if (hardDesc) hardDesc.textContent = 'À venir...';

    } else {
        // Mode Solo : toutes les difficultés disponibles
        if (title) title.textContent = 'Choisis ta difficulté';

        // Réactiver tous les boutons
        if (btnEasy) {
            btnEasy.classList.remove('diff-disabled');
            btnEasy.disabled = false;
        }
        if (btnNormal) {
            btnNormal.classList.remove('diff-disabled');
            btnNormal.disabled = false;
        }
        if (btnHard) {
            btnHard.classList.remove('diff-disabled');
            btnHard.disabled = false;
        }

        // Restaurer les textes originaux
        const normalDesc = document.querySelector('#diff-btn-normal .diff-choice-desc');
        const hardDesc = document.querySelector('#diff-btn-hard .diff-choice-desc');
        if (normalDesc) normalDesc.textContent = 'Équilibré et fun';
        if (hardDesc) hardDesc.textContent = 'Pour les pros';
    }

    // Afficher le modal
    modal.classList.remove('hidden');
}

/**
 * Ferme le modal de sélection de difficulté
 */
export function closeDifficultyModal() {
    logger.log('[Difficulty] Fermeture modal difficulté');

    const modal = document.getElementById('difficulty-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Lance le jeu avec la difficulté choisie (solo ou IA selon le mode)
 * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
 */
export function launchDifficulty(difficulty) {
    logger.log(`[Difficulty] Lancement ${currentModalMode} avec difficulté ${difficulty}`);

    // Fermer le modal
    closeDifficultyModal();

    // Mettre à jour la difficulté globale
    window.currentDifficulty = difficulty;
    currentDifficulty = difficulty;

    // Lancer le jeu approprié selon le mode
    if (currentModalMode === 'ai') {
        // Forcer difficulté 0 (Facile) pour l'IA pour l'instant
        if (difficulty !== 0) {
            logger.warn('[Difficulty] IA mode: Forçage difficulté 0 (Facile uniquement disponible)');
            difficulty = 0;
        }
        if (window.startAIGame) {
            window.startAIGame(difficulty);
        }
    } else {
        // Mode solo
        if (window.startSolo) {
            window.startSolo(difficulty);
        }
    }
}

/**
 * Lance le jeu solo avec la difficulté choisie (ancienne fonction, gardée pour compatibilité)
 */
export function launchSoloDifficulty(difficulty) {
    logger.log(`[Difficulty] Lancement solo avec difficulté ${difficulty}`);

    // Fermer le modal
    closeDifficultyModal();

    // Mettre à jour la difficulté globale
    window.currentDifficulty = difficulty;
    currentDifficulty = difficulty;

    // Lancer le jeu solo
    if (window.startSolo) {
        window.startSolo(difficulty);
    }
}

// ============================================
// EXPORTS GLOBAUX (compatibilité window.*)
// ============================================

window.setDiff = setDiff;
window.getCurrentDifficulty = getCurrentDifficulty;
window.showDifficultyModal = showDifficultyModal;
window.closeDifficultyModal = closeDifficultyModal;
window.launchDifficulty = launchDifficulty;
window.launchSoloDifficulty = launchSoloDifficulty;
window.showDifficultySelection = showDifficultyModal; // Alias

// Exposer currentDifficulty globalement
window.currentDifficulty = currentDifficulty;

logger.log('✅ Module difficulty.js chargé');
