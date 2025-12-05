/**
 * SNAKE ROGUELIKE - Point d'entrée du module
 * Exporte tous les composants du mode roguelike
 */

// Data
export { ROGUELIKE_LEVELS, WORLDS, WALL_PATTERNS } from './levels.js';
export { RUN_UPGRADES, PERMANENT_UPGRADES, RARITIES, selectRandomUpgrades, applyUpgrade, calculateRunModifiers } from './upgrades.js';

// Manager
export { default as roguelikeManager } from './RoguelikeManager.js';

// UI
export { default as roguelikeUI } from './RoguelikeUI.js';

// Achievements
export { achievementsUI } from './AchievementsUI.js';
export { achievementManager } from './achievements.js';

// Daily Challenge
export { default as dailyChallenge } from './DailyChallenge.js';

// Initialisation
export function initRoguelike() {
    // Les singletons sont créés automatiquement à l'import
    // Logger disponible via RoguelikeManager

    // Exposer la fonction de démarrage
    window.startRoguelikeRun = () => {
        window.roguelikeManager.startNewRun();
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
