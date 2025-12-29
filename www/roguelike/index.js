/**
 * SNAKE ROGUELIKE - Point d'entrée du module
 * Exporte tous les composants du mode roguelike
 */

// Data
export { ROGUELIKE_LEVELS, WORLDS, WALL_PATTERNS } from './levels.js';
import { RUN_UPGRADES, PERMANENT_UPGRADES, RARITIES, selectRandomUpgrades, applyUpgrade, calculateRunModifiers } from './upgrades.js';
export { RUN_UPGRADES, PERMANENT_UPGRADES, RARITIES, selectRandomUpgrades, applyUpgrade, calculateRunModifiers };

// Manager
export { default as roguelikeManager } from './RoguelikeManager.js';

// UI
export { default as roguelikeUI } from './RoguelikeUI.js';

// Achievements
export { achievementsUI } from './AchievementsUI.js';
export { achievementManager } from './achievements.js';

// Daily Challenge
export { default as dailyChallenge } from './DailyChallenge.js';

// Tutorial
export { default as tutorialManager } from './TutorialManager.js';

// Initialisation
export function initRoguelike() {
    // Les singletons sont créés automatiquement à l'import
    // Logger disponible via RoguelikeManager

    // Exposer les upgrades pour le HUD
    window.roguelikeUpgrades = { RUN_UPGRADES, PERMANENT_UPGRADES, RARITIES };

    // Exposer la fonction de démarrage (passe par le tutoriel si pas fait)
    window.startRoguelikeRun = () => {
        // Vérifie si le tutoriel a été complété
        if (window.tutorialManager && !window.tutorialManager.hasCompletedTutorial()) {
            window.tutorialManager.start();
        } else {
            window.roguelikeManager.startNewRun();
        }
    };

    // Fonction pour forcer le lancement direct (bypass tuto)
    window.startRoguelikeRunDirect = () => {
        window.roguelikeManager.startNewRun();
    };

    // ✅ Fonction pour continuer une run sauvegardee
    window.continueRoguelikeRun = () => {
        if (window.roguelikeManager.hasSavedRun) {
            window.roguelikeManager.loadSavedRun();
        }
    };

    // ✅ Fonction pour verifier s'il y a une run sauvegardee
    window.hasRoguelikeSavedRun = () => {
        return window.roguelikeManager.hasSavedRun;
    };

    // ✅ Fonction pour obtenir les infos de la run sauvegardee
    window.getRoguelikeSavedRunInfo = () => {
        return window.roguelikeManager.getSavedRunInfo();
    };

    // ✅ Fonction pour supprimer la run sauvegardee
    window.deleteRoguelikeSavedRun = () => {
        window.roguelikeManager.deleteSavedRun();
        updateRoguelikeButton();
    };

    // ✅ Met a jour le bouton Roguelike du hub selon l'etat de sauvegarde
    window.updateRoguelikeButton = () => {
        const btn = document.getElementById('hub-hero-btn');
        const newRunBtn = document.getElementById('hub-new-run-btn');
        if (!btn) return;

        const iconEl = btn.querySelector('.hub-hero-icon');
        const textEl = btn.querySelector('.hub-hero-text');
        const badgeEl = btn.querySelector('.hub-hero-badge');

        if (window.roguelikeManager?.hasSavedRun) {
            const info = window.roguelikeManager.getSavedRunInfo();

            if (iconEl) iconEl.textContent = '▶️';
            if (textEl) textEl.innerHTML = `Reprendre<br><small style="font-size:10px;opacity:0.8">Niv.${info?.level || '?'} • ${info?.score || 0}pts</small>`;
            if (badgeEl) {
                badgeEl.textContent = 'SAVE';
                badgeEl.style.background = '#4CAF50';
            }

            btn.onclick = () => {
                window.audio.buttonClick();
                window.continueRoguelikeRun();
            };
            btn.classList.add('has-save');

            // Afficher le bouton "Nouvelle Run"
            if (newRunBtn) newRunBtn.classList.remove('hidden');
        } else {
            if (iconEl) iconEl.textContent = '🎲';
            if (textEl) textEl.textContent = 'Roguelike';
            if (badgeEl) {
                badgeEl.textContent = 'HOT';
                badgeEl.style.background = '';
            }

            btn.onclick = () => {
                window.audio.buttonClick();
                window.startRoguelikeRun();
            };
            btn.classList.remove('has-save');

            // Cacher le bouton "Nouvelle Run"
            if (newRunBtn) newRunBtn.classList.add('hidden');
        }
    };

    // Fonction pour reset le tutoriel (debug)
    window.resetRoguelikeTutorial = () => {
        window.tutorialManager?.resetTutorial();
    };

    // Fonction pour voir/revoir le tutoriel (depuis Options)
    // Ne lance PAS de game après - retourne au hub
    window.showTutorial = () => {
        // Reset le flag pour forcer l'affichage
        window.tutorialManager?.resetTutorial();
        // Lancer le tutoriel SANS lancer de game après (false)
        window.tutorialManager?.start(false);
    };

    // Exposer la fonction achievements
    window.showRoguelikeAchievements = () => {
        window.achievementsUI?.show();
    };

    // Exposer la fonction Daily Challenge
    window.showDailyChallenge = () => {
        window.dailyChallenge?.show();
    };
}
