/**
 * Contrôleur de navigation et des menus
 */

import { logger } from '../services/logger.js';
import { SnakeUltra } from '../SnakeUltra.js';

export class MenuController {
    constructor() {
        this.currentDifficulty = 0; // 0 = Facile, 1 = Normal, 2 = Difficile
        logger.debug('MenuController créé');
    }

    /**
     * Retour au menu principal
     */
    backToMain() {
        logger.log('Retour au menu principal');
        if (window.showMenu) {
            window.showMenu('menu', 'slide-in-left');
        }
        if (window.updatePlayerProgress) {
            window.updatePlayerProgress();
        }
    }

    /**
     * Afficher le menu Options
     */
    showOptions() {
        logger.log('Afficher options');
        if (window.showMenu) {
            window.showMenu('options-menu', 'slide-in-right');
        }
    }

    /**
     * Afficher le menu Difficulté
     */
    showDifficulty() {
        logger.log('Afficher difficulté');
        if (window.showMenu) {
            window.showMenu('difficulty-menu', 'slide-in-right');
        }
    }

    /**
     * Afficher le menu Multiplayer
     */
    showMultiplayer() {
        logger.log('Afficher multiplayer');

        // Afficher l'écran menu multi (c'est un SCREEN, pas un sous-menu)
        if (SnakeUltra.managers.screen) {
            SnakeUltra.managers.screen.show('multiplayer-menu');
        } else if (window.screenManager) {
            window.screenManager.show('multiplayer-menu');
        }

        // NE PAS auto-connecter - on attend que l'utilisateur clique sur DÉMARRER
    }

    /**
     * Retour au menu Options
     */
    backToOptions() {
        logger.log('Retour au menu options');
        if (window.showMenu) {
            window.showMenu('options-menu', 'slide-in-left');
        }
    }

    /**
     * Afficher le menu Son
     */
    showSound() {
        logger.log('Afficher menu son');
        if (window.showMenu) {
            window.showMenu('sound-menu', 'slide-in-right');
        }
        if (window.loadSoundSettings) {
            window.loadSoundSettings();
        }
    }

    /**
     * Afficher le menu Règles
     */
    showRules() {
        logger.log('Afficher règles');
        if (window.showMenu) {
            window.showMenu('rules-menu', 'slide-in-right');
        }
    }

    /**
     * Afficher le menu Crédits
     */
    showCredits() {
        logger.log('Afficher crédits');
        if (window.showMenu) {
            window.showMenu('credits-menu', 'slide-in-right');
        }
    }

    /**
     * Afficher le menu Langue
     */
    showLanguage() {
        logger.log('Afficher langue');
        if (window.showMenu) {
            window.showMenu('language-menu', 'slide-in-right');
        }
        if (window.loadLanguageSettings) {
            window.loadLanguageSettings();
        }
    }

    /**
     * Change la difficulté sélectionnée
     * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
     */
    setDifficulty(difficulty) {
        logger.log(`Difficulté changée: ${difficulty}`);

        this.currentDifficulty = difficulty;

        // Mettre à jour l'UI des boutons de difficulté
        const buttons = document.querySelectorAll('.diff-btn');
        buttons.forEach((btn, index) => {
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
    getCurrentDifficulty() {
        return this.currentDifficulty;
    }

    /**
     * Contrôle directionnel pour mode tactile
     * @param {number} dx - Direction X
     * @param {number} dy - Direction Y
     */
    directionalControl(dx, dy) {
        // Récupérer l'instance du jeu solo
        const soloGame = SnakeUltra.games.solo || window.getSoloGame?.();

        if (soloGame && soloGame.running && !soloGame.paused) {
            soloGame.changeDirection(dx, dy);
        }
    }

    /**
     * Contrôles simplifiés
     */
    moveUp() { this.directionalControl(0, -1); }
    moveDown() { this.directionalControl(0, 1); }
    moveLeft() { this.directionalControl(-1, 0); }
    moveRight() { this.directionalControl(1, 0); }
}

// Instance singleton
export const menuController = new MenuController();
