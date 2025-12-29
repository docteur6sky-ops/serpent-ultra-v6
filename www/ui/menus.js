// ============================================
// MENUS - Navigation entre les menus
// Module extrait de navigation.js
// ============================================

import { logger } from '../services/logger.js';
import { loadSoundSettings, loadLanguageSettings, loadControlsSettings, loadVibrationSettings } from './settings.js';

// ============================================
// NAVIGATION MENUS
// ============================================

/**
 * Masquer tous les menus
 */
export function hideAllMenus() {
    const menus = [
        'menu', 'difficulty-menu', 'multiplayer-menu', 'options-menu',
        'sound-menu', 'controls-menu', 'career-menu', 'rules-menu', 'credits-menu', 'language-menu',
        'google-account-menu'
    ];
    menus.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
            element.classList.remove('active');
        }
    });
}

/**
 * Afficher un menu avec animation
 * @param {string} menuId - ID du menu à afficher
 * @param {string} direction - Direction de l'animation
 */
export function showMenu(menuId, direction = 'slide-in-right') {
    hideAllMenus();

    // Cacher le hub quand on affiche un sous-menu
    const hub = document.getElementById('hub');
    if (hub) {
        hub.classList.add('hidden');
    }

    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.remove('hidden');
        // Animation sera gérée par CSS
        setTimeout(() => {
            menu.classList.add('active');
        }, 10);
    }

    // Tracking pour trophée Explorateur (sous-menus)
    if (window.screenManager && window.screenManager.trackScreenVisit) {
        window.screenManager.trackScreenVisit(menuId);
    }
}

// ============================================
// NAVIGATION - MENU PRINCIPAL
// ============================================

/**
 * Retour au HUB V6 (écran principal)
 */
export function backToMain() {
    // Cacher tous les sous-menus
    hideAllMenus();

    // Retour au HUB V6
    if (window.screenManager) {
        window.screenManager.show('hub');
    }

    // Mettre à jour la progression
    if (window.updatePlayerProgress) {
        window.updatePlayerProgress();
    }

    // Rafraîchir le hub
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }
}

/**
 * Afficher le menu Options
 */
export function showOptions() {
    showMenu('options-menu', 'slide-in-right');
}

/**
 * Afficher le menu Difficulté
 */
export function showDifficulty() {
    showMenu('difficulty-menu', 'slide-in-right');
}

/**
 * Afficher le menu Multiplayer
 * Utilise le pseudo sauvegardé et connecte directement au serveur
 */
export function showMultiplayer() {
    try {
        // Récupérer le pseudo sauvegardé
        const savedPseudo = localStorage.getItem('snakeultra_pseudo');

        if (!savedPseudo) {
            // Sécurité : Si pas de pseudo, afficher l'écran pseudo
            logger.warn('⚠️ Pas de pseudo sauvegardé dans showMultiplayer');
            if (window.screenManager) {
                window.screenManager.show('multiplayer-menu');
            }
            return;
        }

        logger.log('🌐 Connexion multiplayer avec pseudo:', savedPseudo);

        // Créer le jeu multiplayer si nécessaire
        if (!window.multiGame) {
            try {
                window.multiGame = new MultiplayerSnakeGame();
            } catch (error) {
                logger.error('❌ Erreur création jeu multiplayer:', error);
                if (window.ModalManager) {
                    window.ModalManager.error('Impossible de créer le jeu multijoueur');
                }
                return;
            }
        }

        // Démarrer avec le pseudo sauvegardé
        window.multiGame.start(savedPseudo);

        // Afficher le lobby principal (après connexion)
        setTimeout(() => {
            if (window.mainLobby) {
                window.mainLobby.show();
            }
        }, 500);

    } catch (error) {
        logger.error('❌ Erreur showMultiplayer:', error);
        if (window.ModalManager) {
            window.ModalManager.error('Erreur lors de la connexion multiplayer');
        }
    }
}

// ============================================
// NAVIGATION - SOUS-MENUS OPTIONS
// ============================================

/**
 * Retour au menu Options
 */
export function backToOptions() {
    showMenu('options-menu', 'slide-in-left');
}

/**
 * Afficher le menu Son
 */
export function showSound() {
    showMenu('sound-menu', 'slide-in-right');
    loadSoundSettings();
}

/**
 * Afficher le menu Règles
 */
export function showRules() {
    showMenu('rules-menu', 'slide-in-right');
}

/**
 * Afficher le menu Crédits
 */
export function showCredits() {
    showMenu('credits-menu', 'slide-in-right');
}

/**
 * Afficher le menu Langue
 */
export function showLanguage() {
    showMenu('language-menu',
        'google-account-menu', 'slide-in-right');
    loadLanguageSettings();
}

/**
 * Afficher le menu Contrôles
 */
export function showControls() {
    showMenu('controls-menu', 'slide-in-right');
    loadControlsSettings();
    loadVibrationSettings();
}


/**
 * Afficher le menu Compte Google
 */
export function showGoogleAccount() {
    showMenu('google-account-menu', 'slide-in-right');
}

// ============================================
// EXPORTS GLOBAUX (compatibilité window.*)
// ============================================

window.hideAllMenus = hideAllMenus;
window.showMenu = showMenu;
window.backToMain = backToMain;
window.showOptions = showOptions;
window.showDifficulty = showDifficulty;
window.showMultiplayer = showMultiplayer;
window.backToOptions = backToOptions;
window.showSound = showSound;
window.showRules = showRules;
window.showCredits = showCredits;
window.showLanguage = showLanguage;
window.showControls = showControls;
window.showGoogleAccount = showGoogleAccount;

logger.log('✅ Module menus.js chargé');
