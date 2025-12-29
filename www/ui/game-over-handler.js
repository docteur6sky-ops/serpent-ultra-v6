/**
 * Gestionnaire des fins de partie (game over)
 */

import { logger } from '../services/logger.js';
import { SnakeUltra } from '../SnakeUltra.js';

export class GameOverHandler {
    constructor() {
        logger.debug('GameOverHandler créé');
    }

    /**
     * Gérer le game over du mode solo
     * @param {object} stats - Statistiques de la partie
     */
    handleSolo(stats) {
        logger.log('Game Over Solo', stats);

        // Arrêter audio
        if (window.audioManager) {
            window.audioManager.stopAll();
        }

        // Stocker les stats pour plus tard
        window.lastGameStats = stats;

        // Mettre à jour les stats de carrière (fonction globale)
        if (window.updateCareerStats) {
            window.updateCareerStats(stats);
        }

        // Sauvegarder dans le classement (fonction globale)
        if (window.saveScore) {
            window.saveScore(stats);
        }

        // Afficher overlay progression (fonction globale)
        if (window.showProgressionOverlay) {
            window.showProgressionOverlay(stats);
        }
    }

    /**
     * Gérer le game over du mode multijoueur
     * @param {object} data - Données de fin de partie
     */
    handleMulti(data) {
        logger.log('Game Over Multi', data);

        // Arrêter audio
        if (window.audioManager) {
            window.audioManager.stopAll();
        }

        // Afficher les résultats
        // (La logique d'affichage est déjà gérée par MultiplayerSnakeGame)
    }

    /**
     * Retourner au menu depuis les stats
     */
    returnToMenu() {
        logger.log('Retour au menu depuis stats');

        // Cacher l'overlay de stats
        const overlay = document.getElementById('stats-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }

        // Afficher le menu
        if (SnakeUltra.managers.screen) {
            SnakeUltra.managers.screen.show('menu');
        }

        // Lancer la musique du menu
        if (window.audioManager) {
            window.audioManager.setAudio('menu');
        }
    }

    /**
     * Rejouer une partie
     */
    replay() {
        logger.log('Rejouer');

        // Fermer l'overlay de stats
        const overlay = document.getElementById('stats-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }

        // ✅ Lancer la musique de jeu
        if (window.audioManager) {
            window.audioManager.setAudio('game-solo');
        }

        // Relancer le jeu solo
        if (SnakeUltra.ui.start) {
            SnakeUltra.ui.start();
        } else if (window.start) {
            window.start();
        }
    }
}

// Instance singleton
export const gameOverHandler = new GameOverHandler();
