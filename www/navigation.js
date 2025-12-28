// ============================================
// NAVIGATION - GESTION DES ÉCRANS ET MODES
// ============================================

import { logger } from './services/logger.js';
import { SnakeUltra } from './SnakeUltra.js';
import { progressionManager } from './managers/ProgressionManager.js';
import { leaderboardManager } from './managers/LeaderboardManager.js';
import {
    soloController,
    multiController,
    gameOverHandler,
    menuController,
    // Modules extraits de navigation.js (Phase 1 refactoring)
    // settings.js
    updateMusicVolume,
    updateSFXVolume,
    toggleMute,
    loadSoundSettings,
    toggleDarkMode,
    loadDarkMode,
    setLanguage,
    loadLanguageSettings,
    // difficulty.js
    setDiff,
    getCurrentDifficulty,
    showDifficultyModal,
    closeDifficultyModal,
    launchDifficulty,
    launchSoloDifficulty,
    // controls.js
    d,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    initKeyboardControls,
    // menus.js
    hideAllMenus,
    showMenu,
    backToMain,
    showOptions,
    showDifficulty,
    showMultiplayer,
    backToOptions,
    showSound,
    showRules,
    showCredits,
    showLanguage
} from './ui/index.js';

// Instances globales des jeux
let soloGameInstance = null;
let multiGameInstance = null;
let currentDifficulty = 0; // 0 = Facile, 1 = Normal, 2 = Difficile

// Exposer currentDifficulty globalement pour le HTML
window.currentDifficulty = currentDifficulty;

// ============================================
// HELPERS - OVERLAYS
// ============================================

/**
 * Cache DOM pour les overlays (évite getElementById répétés)
 */
const _overlayCache = {};

/**
 * Récupère un overlay avec cache
 */
function getOverlay(id) {
    if (!_overlayCache[id]) {
        _overlayCache[id] = document.getElementById(id);
    }
    return _overlayCache[id];
}

/**
 * Affiche un overlay
 */
function showOverlay(id) {
    const overlay = getOverlay(id);
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
    }
}

/**
 * Cache un overlay
 */
function hideOverlay(id) {
    const overlay = getOverlay(id);
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }
}

/**
 * Récupère l'instance de jeu active (Solo ou Roguelike)
 */
function getActiveGameInstance() {
    return soloGameInstance || window.soloGame;
}

// ============================================
// FONCTIONS DE NAVIGATION
// ============================================

// Utiliser le ScreenManager global
const showScreen = (screenId) => window.screenManager.show(screenId);
const hideAllScreens = () => window.screenManager.hideAll();

// ============================================
// MODE SOLO
// ============================================

/**
 * Démarre le mode solo
 */
window.start = function() {

    // Afficher l'écran de jeu solo
    window.screenManager.show('game-solo');

    // Créer l'instance si elle n'existe pas
    if (!soloGameInstance) {
        try {
            // ✅ FIX: Utiliser window.SoloSnakeGame (exposé par solo-game.js)
            if (!window.SoloSnakeGame) {
                logger.error('[Navigation] SoloSnakeGame non disponible !');
                if (window.ModalManager) {
                    window.ModalManager.error('Jeu non chargé, rechargez la page');
                }
                return;
            }
            soloGameInstance = new window.SoloSnakeGame();
            window.soloGame = soloGameInstance; // Exposer globalement pour index.html
        } catch (error) {
            logger.error('[Navigation] Erreur création SoloSnakeGame:', error);
            if (window.ModalManager) {
                window.ModalManager.error('Impossible de créer le jeu solo');
            }
            return;
        }
    }

    // Démarrer le jeu avec la difficulté sélectionnée
    soloGameInstance.start(currentDifficulty);

    // Lancer la musique de jeu si disponible
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('game');
    }
};

/**
 * Met en pause / reprend le jeu solo
 */
window.pauseSolo = function() {
    const gameInstance = getActiveGameInstance();

    if (gameInstance) {
        const wasPaused = gameInstance.paused;
        gameInstance.pause();

        window.audio?.buttonClick?.();

        // Gérer la musique selon le nouvel état
        if (window.audioManager) {
            wasPaused ? window.audioManager.resume() : window.audioManager.pause();
        }
    }
};

/**
 * Quitter le mode solo et retourner au menu
 */
window.quitSolo = function() {
    window.audio?.buttonClick();

    const gameInstance = getActiveGameInstance();
    if (gameInstance && !gameInstance.paused) {
        gameInstance.pause();
    }

    showOverlay('solo-quit-overlay');
};

/**
 * Confirmer la sortie du mode solo
 */
function confirmQuitSolo() {
    window.audio?.buttonClick();
    hideOverlay('solo-quit-overlay');

    const gameInstance = getActiveGameInstance();
    if (gameInstance) {
        gameInstance.stop();
    }

    // Si on quitte une run Roguelike, proposer de sauvegarder
    if (window.roguelikeManager?.isRunActive) {
        window.roguelikeManager.saveRunMidGame();
    }

    // Retour au HUB V6
    window.screenManager.show('hub');

    // ✅ METTRE À JOUR LE NIVEAU ET LE CERCLE D'XP
    if (window.updatePlayerProgress) {
        window.updatePlayerProgress();
    }

    // Rafraîchir le hub
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }

    // Lancer la musique du menu
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('menu');
    }
}

/**
 * Annuler la sortie et reprendre le jeu
 */
function cancelQuitSolo() {
    window.audio?.buttonClick();
    hideOverlay('solo-quit-overlay');

    const gameInstance = getActiveGameInstance();
    if (gameInstance) {
        gameInstance.pause(); // Toggle - reprend le jeu
    }
}

// Exposer les fonctions globalement
window.confirmQuitSolo = confirmQuitSolo;
window.cancelQuitSolo = cancelQuitSolo;

// ============================================
// MODE IA - PAUSE & MENU
// ============================================

/**
 * Met en pause / reprend le jeu IA
 */
window.pauseAI = function() {
    if (!window.aiGame) {
        logger.warn('[pauseAI] window.aiGame non défini');
        return;
    }

    window.audio?.buttonClick?.();

    const wasPaused = window.aiGame.paused;
    window.aiGame.pause();

    logger.log(`[pauseAI] Pause toggled: ${!wasPaused} -> ${window.aiGame.paused}`);

    if (window.audioManager) {
        wasPaused ? window.audioManager.resume() : window.audioManager.pause();
    }
};

/**
 * Quitter le mode IA et retourner au menu
 */
window.quitAI = function() {
    window.audio?.buttonClick?.();

    // Mettre le jeu en pause
    if (window.aiGame && window.aiGame.running) {
        window.aiGame.pause();
    }

    showOverlay('ai-quit-overlay');
};

/**
 * Confirmer la sortie du mode IA
 */
function confirmQuitAI() {
    window.audio?.buttonClick?.();
    hideOverlay('ai-quit-overlay');

    window.aiGame?.stop();
    window.screenManager?.show('hub');

    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }

    window.audio?.playMusic?.('menu');
}

/**
 * Annuler la sortie et reprendre le jeu
 */
function cancelQuitAI() {
    window.audio?.buttonClick?.();
    hideOverlay('ai-quit-overlay');
    window.aiGame?.pause();
}

// Exposer les fonctions globalement
window.confirmQuitAI = confirmQuitAI;
window.cancelQuitAI = cancelQuitAI;

/**
 * Gère le game over du mode solo
 * @param {object} stats - Statistiques de la partie
 */
window.handleSoloGameOver = function(stats) {
    // Arrêter audio
    if (window.audioManager) {
        window.audioManager.stopAll();
    }

    // Stocker les stats pour plus tard
    window.lastGameStats = stats;

    // ✅ Réinitialiser les trophées de session
    window.sessionTrophies = [];

    // Mettre à jour les stats de carrière
    updateCareerStats(stats);

    // ✅ TRACKING TROPHÉES CRÉATIFS
    if (window.career && window.save) {
        // KAMIKAZE: Mort en moins de 30 secondes
        const [min, sec] = (stats.timeString || "0:00").split(':').map(Number);
        const totalSeconds = (min * 60) + (sec || 0);
        if (totalSeconds < 30) {
            if (!window.career.quickDeaths) window.career.quickDeaths = 0;
            window.career.quickDeaths++;
        }

        // PHOENIX: Victoire immédiatement après défaite
        // Considérer niveau >= 5 comme victoire (heuristique simple)
        const currentResult = (stats.level >= 5) ? 'win' : 'loss';
        if (window.career.lastGameResult === 'loss' && currentResult === 'win') {
            if (!window.career.phoenixRises) window.career.phoenixRises = 0;
            window.career.phoenixRises++;
        }
        window.career.lastGameResult = currentResult;

        // NOCTURNE: Jouer entre 20h et 8h du matin
        const currentHour = new Date().getHours();
        if (currentHour >= 20 || currentHour < 8) {
            if (!window.career.nightOwlGames) window.career.nightOwlGames = 0;
            window.career.nightOwlGames++;
        }

        // PATIENCE: Attendre 30 secondes sans changer de direction
        if (stats.patienceWaitTime && stats.patienceWaitTime >= 30000) {
            if (!window.career.patienceAchieved) window.career.patienceAchieved = 0;
            window.career.patienceAchieved++;
        }

        // TÉLÉPORTATION: Première fois qu'on traverse un bord
        if (stats.hasTeleported) {
            if (!window.career.firstTeleport) window.career.firstTeleport = 0;
            window.career.firstTeleport++;
        }

        // Sauvegarder les changements
        window.save('career', window.career);
    }

    // ✅ VÉRIFIER TROPHÉES après mise à jour des stats
    if (window.checkTrophy) {
        window.checkTrophy();
    }

    // ✅ VÉRIFIER ACHIEVEMENTS ROGUELIKE (pour first_teleport, etc.)
    if (window.achievementManager?.checkAchievements) {
        window.achievementManager.checkAchievements();
    }

    // ✅ NOUVEAU : Donner des coins pour cette partie
    if (window.boxManager) {
        // Calcul des coins : score/10 + bonus difficulté
        const baseCoins = Math.floor(stats.score / 10);
        const difficultyBonus = {
            'easy': 10,
            'medium': 20,
            'hard': 30
        }[stats.difficulty || 'easy'] || 10;

        const totalCoins = baseCoins + difficultyBonus;
        window.boxManager.addCoins(totalCoins, `partie ${stats.difficulty || 'easy'}`);

        // Vérifier déblocages par niveau (UNIFIÉ via window.career)
        const playerLevel = window.career ? window.career.level : 1;
        window.boxManager.checkLevelUnlocks(playerLevel);
    }

    // Soumettre au leaderboard mondial Firebase
    if (window.firebaseUI) {
        window.firebaseUI.submitAndShowResult('solo', stats.score, {
            level: stats.level,
            maxCombo: stats.maxCombo || 0,
            difficulty: stats.difficulty || 'easy',
            time: stats.timeString || '0:00'
        });
    }

    // Sauvegarder dans le classement (via LeaderboardManager)
    leaderboardManager.saveScore(stats);

    // Afficher overlay progression (via ProgressionManager)
    progressionManager.showProgressionOverlay(stats);
};

// saveScore, getLeaderboard, timeToSeconds, formatSurvivalTime
// -> Déplacés vers managers/LeaderboardManager.js

/**
 * Mettre à jour les statistiques de carrière
 * @param {object} stats - Statistiques de la partie
 * @returns {object} Statistiques de carrière mises à jour
 */
function updateCareerStats(stats) {
    // ✅ UNIFIÉ : Déléguer à window.updateCareer()
    // Cette fonction est conservée pour rétrocompatibilité
    if (window.updateCareer) {
        return window.updateCareer(stats);
    }

    // Fallback si snake.js pas encore chargé
    logger.warn('[updateCareerStats] window.updateCareer non disponible');
    return null;
}

/**
 * Récupérer les statistiques de carrière
 * @returns {object} Statistiques de carrière
 */
function getCareerStats() {
    // ✅ UNIFIÉ : Lecture directe depuis window.career
    return window.career || {
        level: 1,
        xp: 0,
        xpNext: 200, // Formule linéaire: 100 + (level * 100)
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        totalApples: 0,
        maxLevel: 0,
        totalWalls: 0,
        totalPowerups: 0,
        maxSurvivalTime: 0
    };
}

// renderCareerStats supprimée - fonction non utilisée

// showProgressionOverlay, updateProgressBar, showFinalStats,
// syncCareerFromAnimation, returnToHubFromProgression, replayFromProgression,
// returnToMenuFromStats -> Déplacés vers managers/ProgressionManager.js

/**
 * Rejouer une partie solo depuis l'écran Stats
 */
function replaySolo() {
    if (window.audio) window.audio.buttonClick();

    // Cacher écran stats
    window.screenManager.show('game-solo');

    // Redémarrer le jeu
    if (window.start) {
        window.start();
    }
}

// Exposer globalement
window.returnToMenuFromStats = returnToMenuFromStats;
window.replaySolo = replaySolo;

// ============================================
// MODE MULTIJOUEUR
// ============================================

/**
 * Permet de modifier son pseudo depuis l'écran carrière
 * Affiche un prompt pour saisir le nouveau pseudo
 */
window.editPseudoFromCareer = function() {
    logger.log('Modification du pseudo depuis la carrière...');

    // Migration : récupérer l'ancien pseudo si la nouvelle clé n'existe pas
    let currentPseudo = localStorage.getItem('snakeultra_pseudo');
    if (!currentPseudo) {
        const oldPseudo = localStorage.getItem('playerPseudo') || localStorage.getItem('snakeUltraPseudo');
        if (oldPseudo && oldPseudo.length >= 3 && oldPseudo.length <= 12) {
            localStorage.setItem('snakeultra_pseudo', oldPseudo);
            currentPseudo = oldPseudo;
            logger.log('✅ Migration du pseudo depuis ancienne clé:', oldPseudo);
        }
    }

    // Afficher un prompt pour saisir le nouveau pseudo
    const message = currentPseudo
        ? `Pseudo actuel : ${currentPseudo}\n\nEntrez votre nouveau pseudo (3-12 caractères):`
        : 'Entrez votre pseudo (3-12 caractères):';

    const newPseudo = prompt(message, currentPseudo || '');

    // Si l'utilisateur annule
    if (newPseudo === null) {
        logger.log('Modification du pseudo annulée');
        return;
    }

    // Valider le pseudo
    const trimmed = newPseudo.trim();

    if (trimmed.length < 3) {
        if (window.ModalManager) {
            window.ModalManager.warning('Le pseudo doit contenir au moins 3 caractères');
        }
        return;
    }

    if (trimmed.length > 12) {
        if (window.ModalManager) {
            window.ModalManager.warning('Le pseudo ne peut pas dépasser 12 caractères');
        }
        return;
    }

    // Vérifier caractères autorisés
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(trimmed)) {
        if (window.ModalManager) {
            window.ModalManager.warning('Caractères autorisés: lettres, chiffres, _ et -');
        }
        return;
    }

    // Sauvegarder le nouveau pseudo
    localStorage.setItem('snakeultra_pseudo', trimmed);
    localStorage.setItem('playerPseudo', trimmed); // Compatibilité
    localStorage.setItem('snakeUltraPseudo', trimmed); // Compatibilité

    logger.log(`✅ Nouveau pseudo sauvegardé: ${trimmed}`);
    if (window.ModalManager) {
        window.ModalManager.success(`Pseudo modifié avec succès !\n\nNouveau pseudo : ${trimmed}`);
    }
};

/**
 * Sauvegarder le pseudo et aller au menu principal
 * (Nouveau flow : pseudo demandé au premier lancement)
 */
window.savePseudoAndGoToMenu = function() {
    try {
        // 1. RÉCUPÉRER LE PSEUDO
        const pseudoInput = document.getElementById('pseudo-input');
        const pseudo = pseudoInput ? pseudoInput.value.trim() : '';

        // 2. VALIDER LE PSEUDO
        if (!pseudo || pseudo.length < 3 || pseudo.length > 12) {
            const errorSpan = document.getElementById('pseudo-error');
            if (errorSpan) {
                errorSpan.textContent = '⚠️ Pseudo invalide (3-12 caractères)';
                errorSpan.style.display = 'block';
            } else if (window.ModalManager) {
                window.ModalManager.warning('Veuillez entrer un pseudo valide (3-12 caractères)');
            }
            return;
        }

        // Valider le format (lettres, chiffres, _ et -)
        if (!/^[a-zA-Z0-9_-]+$/.test(pseudo)) {
            const errorSpan = document.getElementById('pseudo-error');
            if (errorSpan) {
                errorSpan.textContent = '⚠️ Caractères autorisés : lettres, chiffres, _ et -';
                errorSpan.style.display = 'block';
            } else if (window.ModalManager) {
                window.ModalManager.warning('Caractères autorisés : lettres, chiffres, _ et -');
            }
            return;
        }

        // 3. SAUVEGARDER LE PSEUDO
        try {
            localStorage.setItem('snakeultra_pseudo', pseudo);
            localStorage.setItem('playerPseudo', pseudo); // Compatibilité
            localStorage.setItem('snakeUltraPseudo', pseudo); // Compatibilité
            logger.log('✅ Pseudo sauvegardé:', pseudo);
        } catch (e) {
            logger.warn('⚠️ Échec sauvegarde localStorage (navigation privée)');
        }

        // 4. ALLER AU HUB V6
        window.screenManager.show('hub');

        // ✅ METTRE À JOUR LE NIVEAU ET LE CERCLE D'XP
        if (window.updatePlayerProgress) {
            window.updatePlayerProgress();
        }

        // Initialiser le hub
        if (window.initHub) {
            setTimeout(() => window.initHub(), 100);
        }

    } catch (error) {
        logger.error('❌ Erreur savePseudoAndGoToMenu:', error);
        if (window.ModalManager) {
            window.ModalManager.error('Erreur lors de la sauvegarde du pseudo');
        }
    }
};

/**
 * Démarre le mode multijoueur
 */
window.startLocalMultiplayer = function() {

    try {
        // 1. RÉCUPÉRER LE PSEUDO
        const pseudoInput = document.getElementById('pseudo-input');
        const pseudo = pseudoInput ? pseudoInput.value.trim() : '';

        // 2. VALIDER LE PSEUDO
        if (!pseudo || pseudo.length < 3 || pseudo.length > 12) {
            const errorSpan = document.getElementById('pseudo-error');
            if (errorSpan) {
                errorSpan.textContent = '⚠️ Pseudo invalide (3-12 caractères)';
                errorSpan.style.display = 'block';
            } else if (window.ModalManager) {
                window.ModalManager.warning('Veuillez entrer un pseudo valide (3-12 caractères)');
            }
            return; // NE PAS connecter
        }

        // Valider le format avec la fonction de validation existante (si disponible)
        if (window.getValidPseudo) {
            const validatedPseudo = window.getValidPseudo();
            if (!validatedPseudo) {
                // L'erreur est déjà affichée par getValidPseudo()
                return;
            }
        }

        // 3. SAUVEGARDER LE PSEUDO
        try {
            localStorage.setItem('snakeultra_pseudo', pseudo);
            localStorage.setItem('playerPseudo', pseudo); // Compatibilité
            localStorage.setItem('snakeUltraPseudo', pseudo); // Compatibilité
        } catch (e) {
            // Échec localStorage (navigation privée) - continuer quand même
        }

        // 4. CRÉER LE JEU
        if (!multiGameInstance) {
            try {
                multiGameInstance = new MultiplayerSnakeGame();
                window.multiGame = multiGameInstance;
            } catch (error) {
                if (window.ModalManager) {
                    window.ModalManager.error('Impossible de créer le jeu multijoueur');
                }
                throw error;
            }
        }

        // 4. DÉMARRER avec le pseudo
        multiGameInstance.start(pseudo);

        // ✅ LOBBY PRINCIPAL - Afficher le lobby principal après connexion
        // Le serveur envoie 'lobby_ready' mais ne place plus automatiquement en room
        setTimeout(() => {
            if (window.mainLobby) {
                window.mainLobby.show();
            }
        }, 500);

    } catch (error) {
        if (window.ModalManager) {
            window.ModalManager.error('Erreur critique: ' + error.message);
        }
        throw error;
    }
};

/**
 * Abandonner la partie multijoueur
 * Affiche un overlay de confirmation (comme pour le solo)
 */
window.abandonMulti = function() {
    window.audio?.buttonClick();

    if (multiGameInstance?.running) {
        multiGameInstance.pause();
    }

    showOverlay('multi-quit-overlay');
};

/**
 * Confirmer l'abandon de la partie multijoueur
 */
function confirmAbandonMulti() {
    window.audio?.buttonClick();
    hideOverlay('multi-quit-overlay');

    // Notifier le serveur de l'abandon
    if (multiGameInstance?.client?.ws) {
        multiGameInstance.client.ws.send(JSON.stringify({ type: 'player_abandon' }));
        logger.log('🏳️ Message d\'abandon envoyé au serveur');
    }

    window.quitMulti();
}

/**
 * Annuler l'abandon et reprendre le jeu
 */
function cancelAbandonMulti() {
    window.audio?.buttonClick();
    hideOverlay('multi-quit-overlay');

    if (multiGameInstance?.paused) {
        multiGameInstance.resume();
    }
}

// Exposer les fonctions globalement pour les boutons HTML
window.confirmAbandonMulti = confirmAbandonMulti;
window.cancelAbandonMulti = cancelAbandonMulti;

/**
 * Quitter le mode multijoueur et retourner au menu
 */
window.quitMulti = function() {

    // Arrêter le jeu
    if (multiGameInstance) {
        multiGameInstance.stop();
    }

    // Retourner au HUB V6
    window.screenManager.show('hub');

    // ✅ METTRE À JOUR LE NIVEAU ET LE CERCLE D'XP
    if (window.updatePlayerProgress) {
        window.updatePlayerProgress();
    }

    // Rafraîchir le hub
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }

    // Lancer la musique du menu
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('menu');
    }
};

/**
 * Quitter le lobby et retourner au menu multijoueur
 */
window.leaveLobby = function() {

    // Déconnecter le client multiplayer
    if (multiGameInstance && multiGameInstance.client) {
        multiGameInstance.client.disconnect();
    }

    // ✅ FIX: Retourner au lobby principal au lieu de l'écran de pseudo
    window.screenManager.show('main-lobby-screen');

    // ✅ Réafficher le lobby principal
    if (window.mainLobby) {
        window.mainLobby.show();
    }
};

/**
 * Marquer le joueur comme prêt dans le lobby
 */
window.setReady = function() {
    // Utiliser window.multiGame qui est toujours à jour
    const game = window.multiGame || multiGameInstance;

    if (!game || !game.client) {
        if (window.ModalManager) {
            window.ModalManager.error('Non connecté au serveur');
        }
        return;
    }

    // Utiliser sendReady() qui gère la vérification de connexion
    game.client.sendReady();

    // Désactiver le bouton
    const btn = document.getElementById('btn-ready');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '✅ PRÊT !';
        btn.style.opacity = '0.6';
    }
};

// ============================================
// UTILITAIRES
// ============================================

/**
 * Retourne l'instance du jeu solo
 * @returns {SoloSnakeGame|null}
 */
window.getSoloGame = function() {
    return soloGameInstance;
};

/**
 * Retourne l'instance du jeu multijoueur
 * @returns {MultiplayerSnakeGame|null}
 */
window.getMultiGame = function() {
    return multiGameInstance;
};

/**
 * Retourne la difficulté actuelle
 * @returns {number}
 */
window.getCurrentDifficulty = function() {
    return currentDifficulty;
};

// ============================================
// DÉMARRAGE JEUX AVEC DIFFICULTÉ
// ============================================

/**
 * Démarrer le jeu solo avec une difficulté
 * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
 */
window.startSolo = function(difficulty) {
    currentDifficulty = difficulty;
    window.start(); // Utilise la fonction existante
};

// ============================================
// PROGRESSION JOUEUR (Niveau/XP)
// ============================================

/**
 * Mettre à jour l'affichage de la progression du joueur
 */
window.updatePlayerProgress = function() {
    // ✅ UNIFIÉ : Lecture depuis window.career
    const career = window.career || { level: 1, xp: 0, xpNext: 200 };
    const level = career.level;
    const xp = career.xp;
    const xpForNextLevel = career.xpNext;

    // Mettre à jour le texte niveau dans le cercle SVG
    const levelNum = document.getElementById('player-level-num');
    if (levelNum) {
        levelNum.textContent = level;
    }

    // Mettre à jour le texte XP dans le cercle SVG
    const xpText = document.getElementById('player-xp-text');
    if (xpText) {
        xpText.textContent = `${xp}/${xpForNextLevel} XP`;
    }

    // Animer le cercle XP
    const circleFill = document.getElementById('player-circle-fill');
    if (circleFill) {
        const percentage = (xp / xpForNextLevel);
        const circumference = 2 * Math.PI * 65; // r=65
        const offset = circumference * (1 - percentage);

        circleFill.style.strokeDashoffset = offset;
    }
}

// ============================================
// SYSTÈME XP ET LEVEL UP (UNIFIÉ via window.career)
// ============================================

// ✅ UNIFIÉ : La recalibration n'est plus nécessaire car tout passe par window.career
window.recalibrateLevel = function() {
    // Fonction conservée pour rétrocompatibilité mais ne fait plus rien
    // Les niveaux sont maintenant gérés par window.career avec formule exponentielle
    if (window.career) {
        logger.log(`[recalibrateLevel] Niveau actuel: ${window.career.level}, XP: ${window.career.xp}/${window.career.xpNext}`);
        updatePlayerProgress();
        return { level: window.career.level, xpInCurrentLevel: window.career.xp };
    }
    return { level: 1, xpInCurrentLevel: 0 };
};

// ✅ UNIFIÉ : awardXP utilise CareerManager (source unique de vérité)
window.awardXP = function(amount) {
    // ⚗️ Appliquer le multiplicateur si un booster est actif
    let finalAmount = amount;
    let boosterBonus = 0;
    if (window.boxManager) {
        const multiplier = window.boxManager.getXpMultiplier();
        if (multiplier > 1) {
            finalAmount = Math.floor(amount * multiplier);
            boosterBonus = finalAmount - amount;
            logger.log(`[awardXP] ⚗️ Booster actif! ${amount} × ${multiplier} = ${finalAmount} XP (+${boosterBonus} bonus)`);
        }
    }

    // Utiliser CareerManager si disponible (source unique de vérité)
    if (window.careerManager) {
        const result = window.careerManager.addXP(finalAmount);
        updatePlayerProgress();
        logger.log(`[awardXP] +${finalAmount} XP via CareerManager → Niveau ${result.newLevel}`);
        return { leveledUp: result.leveledUp, newLevel: result.newLevel, xpGained: finalAmount };
    }

    // Fallback si CareerManager non disponible
    if (!window.career) {
        logger.warn('[awardXP] window.career non disponible');
        return { leveledUp: false, newLevel: 1, xpGained: finalAmount };
    }

    const oldLevel = window.career.level;
    window.career.xp += finalAmount;
    let leveledUp = false;

    while (window.career.xp >= window.career.xpNext && window.career.level < 100) {
        window.career.xp -= window.career.xpNext;
        window.career.level++;
        window.career.xpNext = 100 + (window.career.level * 100);
        leveledUp = true;
    }

    if (window.save) {
        window.save('career', window.career);
    }

    updatePlayerProgress();
    logger.log(`[awardXP] +${finalAmount} XP (fallback) → Niveau ${window.career.level}`);

    return { leveledUp, newLevel: window.career.level, xpGained: finalAmount };
};

// ============================================
// BOSS RUSH - FONCTIONS NAVIGATION
// ============================================

/**
 * Démarre le mode Boss Rush - Affiche le menu
 */
window.startBossRush = function() {
    logger.log('[BossRush] Affichage menu Boss Rush...');

    // Mettre à jour les stats dans le menu
    if (window.bossRushManager) {
        const stats = window.bossRushManager.stats || {};
        const runsEl = document.getElementById('brs-total-runs');
        const winsEl = document.getElementById('brs-completed-runs');
        const timeEl = document.getElementById('brs-best-time');

        if (runsEl) runsEl.textContent = stats.totalRuns || 0;
        if (winsEl) winsEl.textContent = stats.completedRuns || 0;
        if (timeEl) {
            if (stats.bestTime) {
                const mins = Math.floor(stats.bestTime / 60);
                const secs = Math.floor(stats.bestTime % 60);
                timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            } else {
                timeEl.textContent = '-';
            }
        }
    }

    // Afficher l'écran menu via screenManager
    if (window.screenManager) {
        window.screenManager.show('menu-boss-rush');
    }
};

/**
 * Rejouer Boss Rush (appelé depuis écran Game Over)
 */
window.replayBossRush = function() {
    logger.log('[BossRush] Rejouer...');

    if (window.audio?.buttonClick) {
        window.audio.buttonClick();
    }

    // Nettoyer les overlays
    if (window.bossRushUI) {
        window.bossRushUI.cleanup();
    }

    // Nettoyer le jeu actuel
    if (window.soloGame) {
        window.soloGame.stop();
        window.soloGame.isBossRushMode = false;
    }

    // Relancer (le manager gère l'affichage de l'écran de jeu)
    if (window.bossRushManager) {
        window.bossRushManager.startNewRun();
    }
};

/**
 * Retour au hub depuis Boss Rush (appelé depuis écran Game Over)
 */
window.returnToHubFromBossRush = function() {
    logger.log('[BossRush] Retour au hub...');

    if (window.audio?.buttonClick) {
        window.audio.buttonClick();
    }

    // Nettoyer tous les overlays Boss Rush
    if (window.bossRushUI) {
        window.bossRushUI.cleanup();
    }

    // Nettoyer le jeu
    if (window.soloGame) {
        window.soloGame.stop();
        window.soloGame.isBossRushMode = false;
    }

    // Retourner au hub
    if (window.screenManager) {
        window.screenManager.show('hub');
    }

    // Rafraîchir le hub
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }
};

// ============================================
// INITIALISATION
// ============================================

// ✅ FIX: Fonction d'initialisation extraite pour pouvoir l'appeler immédiatement si DOM prêt
function initNavigation() {
    updatePlayerProgress();
    loadDarkMode();        // Depuis ui/settings.js
    loadSoundSettings();   // Depuis ui/settings.js

    // Initialiser les contrôles clavier (depuis ui/controls.js)
    initKeyboardControls();

    // Initialiser l'input pseudo
    if (window.initPseudoInput) {
        window.initPseudoInput();
    }

    // Event listener pour le bouton JOUER SOLO
    const soloBtnEl = document.getElementById('solo-btn');
    if (soloBtnEl) {
        soloBtnEl.addEventListener('click', () => {
            startSolo(currentDifficulty);
        });
    }

    // Sélectionner FACILE par défaut au chargement
    setDiff(0);  // Depuis ui/difficulty.js

    logger.log('✅ Navigation initialisée');
}

// ✅ FIX: Avec les imports dynamiques, le DOM peut déjà être chargé
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // DOM déjà prêt, initialiser immédiatement
    initNavigation();
} else {
    // DOM pas encore prêt, attendre l'événement
    document.addEventListener('DOMContentLoaded', initNavigation);
}

// ============================================
// EXPORTS GLOBAUX pour le système de carrière
// ============================================
// saveScore et getLeaderboard -> via LeaderboardManager
window.updateCareerStats = updateCareerStats;
window.getCareerStats = getCareerStats;

// ============================================
// ATTACHER LES FONCTIONS UI AU NAMESPACE
// ============================================
SnakeUltra.ui = {
    // Mode Solo
    start: window.start,
    pauseSolo: window.pauseSolo,
    quitSolo: window.quitSolo,
    confirmQuitSolo: window.confirmQuitSolo,
    cancelQuitSolo: window.cancelQuitSolo,
    handleSoloGameOver: window.handleSoloGameOver,
    replaySolo: window.replaySolo,

    // Mode Multi
    startLocalMultiplayer: window.startLocalMultiplayer,
    abandonMulti: window.abandonMulti,
    quitMulti: window.quitMulti,
    leaveLobby: window.leaveLobby,
    setReady: window.setReady,

    // Navigation
    backToMain: window.backToMain,
    showOptions: window.showOptions,
    showDifficulty: window.showDifficulty,
    showMultiplayer: window.showMultiplayer,
    backToOptions: window.backToOptions,
    showSound: window.showSound,

    // Difficulté
    setDiff: window.setDiff,

    // Contrôles
    d: window.d,
    moveUp: window.moveUp,
    moveDown: window.moveDown,
    moveLeft: window.moveLeft,
    moveRight: window.moveRight,

    // Stats et progression (via ProgressionManager)
    showProgressionOverlay: (stats) => progressionManager.showProgressionOverlay(stats),
    showFinalStats: () => progressionManager.showFinalStats(),
    returnToMenuFromStats: () => progressionManager.returnToMenuFromStats(),

    // Getters
    getSoloGame: window.getSoloGame,
    getMultiGame: window.getMultiGame,
    getCurrentDifficulty: window.getCurrentDifficulty,

    // Carrière (via LeaderboardManager + CareerManager)
    saveScore: (stats) => leaderboardManager.saveScore(stats),
    getLeaderboard: () => leaderboardManager.getLeaderboard(),
    updateCareerStats: window.updateCareerStats,
    getCareerStats: window.getCareerStats,

    // Contrôleurs modulaires
    soloController,
    multiController,
    gameOverHandler,
    menuController
};

logger.log('✅ UI attachée au namespace SnakeUltra');
logger.log('✅ Contrôleurs modulaires chargés');

