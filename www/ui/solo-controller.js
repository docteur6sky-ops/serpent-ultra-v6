/**
 * Contrôleur du mode solo
 */

import { logger } from '../services/logger.js';
import { SnakeUltra } from '../SnakeUltra.js';

export class SoloController {
    constructor() {
        this.gameInstance = null;
        logger.debug('SoloController créé');
    }

    /**
     * Démarre le mode solo
     */
    start(difficulty = 0) {
        logger.log(`Démarrage mode solo (difficulté: ${difficulty})`);

        // Afficher l'écran de jeu solo
        if (SnakeUltra.managers.screen) {
            SnakeUltra.managers.screen.show('game-solo');
        }

        // Créer l'instance si elle n'existe pas
        if (!this.gameInstance) {
            try {
                this.gameInstance = new window.SoloSnakeGame();
                window.soloGame = this.gameInstance; // Exposer globalement pour index.html
                SnakeUltra.games.solo = this.gameInstance;
            } catch (error) {
                logger.error('Erreur création jeu solo:', error);
                if (window.ModalManager) {
                    window.ModalManager.error('Impossible de créer le jeu solo');
                }
                return;
            }
        }

        // Démarrer le jeu avec la difficulté sélectionnée
        this.gameInstance.start(difficulty);

        // Lancer la musique de jeu si disponible
        if (window.audio && window.audio.playMusic) {
            window.audio.playMusic('game');
        }
    }

    /**
     * Met en pause / reprend le jeu solo
     */
    pause() {
        if (!this.gameInstance) return;

        // Vérifier l'état AVANT de toggler
        const wasPaused = this.gameInstance.paused;

        // Toggle pause
        this.gameInstance.pause();

        // Son de pause
        if (window.audio && window.audio.buttonClick) {
            window.audio.buttonClick();
        }

        // Gérer la musique selon le nouvel état
        if (window.audioManager) {
            if (wasPaused) {
                // Le jeu était en pause, on reprend
                window.audioManager.resume();
            } else {
                // Le jeu tourne, on met en pause
                window.audioManager.pause();
            }
        }
    }

    /**
     * Quitter le mode solo et retourner au menu
     */
    quit() {
        if (window.audio && window.audio.buttonClick) {
            window.audio.buttonClick();
        }

        // Mettre le jeu en pause
        if (this.gameInstance && this.gameInstance.running) {
            this.gameInstance.pause();
        }

        // Afficher l'overlay
        const overlay = document.getElementById('solo-quit-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
        }
    }

    /**
     * Confirmer la sortie du jeu solo
     */
    confirmQuit() {
        // Arrêter le jeu
        if (this.gameInstance) {
            this.gameInstance.stop();
        }

        // Cacher l'overlay
        const overlay = document.getElementById('solo-quit-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }

        // Retour au menu
        if (SnakeUltra.managers.screen) {
            SnakeUltra.managers.screen.show('menu');
        }

        // Changer la musique
        if (window.audioManager) {
            window.audioManager.setAudio('menu');
        }
    }

    /**
     * Annuler la sortie du jeu solo
     */
    cancelQuit() {
        // Cacher l'overlay
        const overlay = document.getElementById('solo-quit-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }

        // Reprendre le jeu (toggle pause)
        if (this.gameInstance) {
            this.gameInstance.pause();
        }
    }

    /**
     * Rejouer une partie
     */
    replay() {
        logger.log('Rejouer mode solo');
        if (this.gameInstance) {
            this.gameInstance.start(window.getCurrentDifficulty ? window.getCurrentDifficulty() : 0);
        }
    }

    /**
     * Récupérer l'instance du jeu solo
     */
    getGameInstance() {
        return this.gameInstance;
    }
}

// Instance singleton
export const soloController = new SoloController();
