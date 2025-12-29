/**
 * HUB MANAGER - Orchestrateur du Hub principal
 *
 * Responsabilités :
 * - Initialisation du Hub
 * - Données joueur (getPlayerData, updatePlayerInfo)
 * - Système de bannières et backgrounds
 * - Système d'amis
 *
 * Délègue à :
 * - GradeManager : Calcul et affichage des grades
 * - BoosterManager : Système de boosters XP
 * - ChestManager : Coffre quotidien et récompenses
 */

import { logger } from './services/logger.js';

// Import des managers délégués
import { gradeManager } from './managers/GradeManager.js';
import { boosterManager } from './managers/BoosterManager.js';
import { chestManager } from './managers/ChestManager.js';

// ============================================
// DONNÉES JOUEUR
// ============================================

/**
 * Récupère les données du joueur depuis window.career (source unique de vérité)
 * @returns {object} Données du joueur
 */
function getPlayerData() {
    const career = window.career || {
        level: 1,
        xp: 0,
        xpNext: 200,
        bestScore: 0,
        multiWins: 0
    };

    const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';

    return {
        pseudo,
        level: career.level,
        xp: career.xp,
        xpNext: career.xpNext,
        bestScore: career.bestScore,
        multiWins: career.multiWins || 0
    };
}

/**
 * Met à jour les informations du joueur (nom, niveau, XP)
 */
function updatePlayerInfo() {
    const data = getPlayerData();

    // Nom du joueur
    const nameEl = document.getElementById('hub-player-name');
    if (nameEl) {
        nameEl.textContent = data.pseudo;
    }

    // Niveau dans le cercle
    const levelNumEl = document.getElementById('hub-level-num');
    if (levelNumEl) {
        levelNumEl.textContent = data.level;
    }

    // Barre de progression XP (formule linéaire: 100 + level*100)
    const xpMax = 100 + (data.level * 100);
    const percentage = (data.xp / xpMax) * 100;

    const progressFillEl = document.getElementById('hub-progress-fill');
    if (progressFillEl) {
        progressFillEl.style.width = `${percentage}%`;
    }

    const xpTextEl = document.getElementById('hub-xp-text');
    if (xpTextEl) {
        xpTextEl.textContent = `${Math.round(percentage)}% → ${data.level + 1}`;
    }

    // Animer le cercle XP
    const circleFill = document.getElementById('hub-circle-fill');
    if (circleFill) {
        const circumference = 2 * Math.PI * 26; // r=26
        const offset = circumference * (1 - (percentage / 100));
        circleFill.style.strokeDashoffset = offset;
    }

    logger.log(`[HubManager] Infos joueur mises à jour - ${data.pseudo}, Niveau ${data.level}, XP ${data.xp}/${xpMax}`);
}

// ============================================
// SYSTÈME D'AMIS
// ============================================

/**
 * Affiche l'écran des amis
 */
function showFriends() {
    let message = `👥 AMIS\n\n`;

    try {
        const friends = JSON.parse(localStorage.getItem('friendsList') || '[]');
        const pending = JSON.parse(localStorage.getItem('friendsPending') || '[]');

        if (friends.length === 0 && pending.length === 0) {
            message += `Vous n'avez pas encore d'amis.\n\n`;
            message += `🔜 Fonctionnalité à venir :\n`;
            message += `• Envoyer des demandes d'amis\n`;
            message += `• Voir qui est en ligne\n`;
            message += `• Inviter des amis en partie\n`;
            message += `• Chat entre amis`;
        } else {
            if (friends.length > 0) {
                message += `✅ AMIS (${friends.length}):\n`;
                friends.forEach(friend => {
                    const status = friend.online ? '🟢' : '⚫';
                    message += `${status} ${friend.pseudo}\n`;
                });
                message += '\n';
            }

            if (pending.length > 0) {
                message += `⏳ EN ATTENTE (${pending.length}):\n`;
                pending.forEach(req => {
                    message += `📨 ${req.pseudo}\n`;
                });
            }
        }
    } catch (e) {
        logger.warn('[HubManager] Erreur lecture amis');
        message += `Erreur de chargement de la liste d'amis.`;
    }

    if (window.ModalManager) {
        window.ModalManager.info(message, { title: 'Amis' });
    }
}

// ============================================
// SYSTÈME DE BACKGROUNDS
// ============================================

/**
 * Applique le background équipé au hub
 */
function applyHubBackground() {
    const phone = document.querySelector('.phone');
    if (!phone) {
        logger.warn('[HubManager] Élément .phone non trouvé');
        return;
    }

    const bgItem = window.boxManager ? window.boxManager.getEquippedBackground() : null;

    if (bgItem && bgItem.bgValue) {
        phone.style.backgroundImage = `url('${bgItem.bgValue}')`;
        phone.style.backgroundSize = 'cover';
        phone.style.backgroundPosition = 'center';
        phone.dataset.hubTheme = bgItem.id;
        logger.log(`[HubManager] Background équipé appliqué: ${bgItem.name}`);
    } else {
        delete phone.dataset.hubTheme;
        phone.style.backgroundImage = '';
        if (window.backgroundManager) {
            window.backgroundManager.currentBackground = null;
            window.backgroundManager.setBackground('hub');
        }
        logger.log('[HubManager] Background par défaut restauré');
    }
}

// ============================================
// SYSTÈME DE BANNIÈRES
// ============================================

/**
 * Applique une bannière au hub
 * @param {object} bannerItem - Item bannière { id, name, image, ... }
 */
function applyHubBanner(bannerItem) {
    const bannerEl = document.getElementById('hub-banner');
    const imageEl = document.getElementById('hub-banner-image');

    if (!bannerEl || !imageEl) {
        logger.warn('[HubManager] Éléments bannière non trouvés');
        return;
    }

    if (bannerItem && bannerItem.image) {
        imageEl.src = bannerItem.image;
        imageEl.style.display = 'block';
        bannerEl.classList.remove('default');
        logger.log(`[HubManager] Bannière appliquée: ${bannerItem.name}`);
    } else {
        imageEl.src = '';
        imageEl.style.display = 'none';
        bannerEl.classList.add('default');
        logger.log('[HubManager] Bannière par défaut appliquée');
    }

    // Synchroniser avec la carte ID Stats
    if (window.applyStatsBanner) {
        window.applyStatsBanner(bannerItem);
    }
}

/**
 * Initialise la bannière équipée au chargement du hub
 */
function initHubBanner() {
    if (window.boxManager) {
        const equippedBanner = window.boxManager.getEquippedBanner();
        applyHubBanner(equippedBanner);
    } else {
        logger.warn('[HubManager] BoxManager non disponible pour bannière');
    }
}

// ============================================
// INITIALISATION HUB
// ============================================

/**
 * Initialise le Hub (appelé au chargement)
 */
function initHub() {
    logger.log('[HubManager] Initialisation du Hub...');

    // Nettoyer les overlays residuels (coffre, skin unlock, confetti)
    const skinOverlay = document.querySelector('.skin-unlock-overlay');
    const skinNotification = document.querySelector('.skin-unlock-notification');
    const confetti = document.querySelector('.confetti-overlay');
    const chestModal = document.getElementById('chest-modal');
    if (skinOverlay) skinOverlay.remove();
    if (skinNotification) skinNotification.remove();
    if (confetti) confetti.remove();
    if (chestModal) chestModal.remove();

    // Donnees joueur
    updatePlayerInfo();

    // Grades (délégué à GradeManager)
    gradeManager.updatePlayerGrades();

    // Coffre quotidien (délégué à ChestManager)
    chestManager.initTimer();
    chestManager.updateBoxCount();

    // Boosters XP (délégué à BoosterManager)
    boosterManager.updateBoostersDisplay();
    boosterManager.initBoosterTimer();

    // Apparence
    initHubBanner();
    applyHubBackground();

    // ✅ Mettre a jour le bouton Roguelike (afficher "Reprendre" si run sauvegardee)
    if (window.updateRoguelikeButton) {
        window.updateRoguelikeButton();
    }

    logger.log('[HubManager] Hub initialisé ✅');
}

// ============================================
// EXPORTS GLOBAUX
// ============================================

// Fonctions principales
window.initHub = initHub;
window.getPlayerData = getPlayerData;
window.updatePlayerInfo = updatePlayerInfo;
window.showFriends = showFriends;

// Apparence
window.applyHubBackground = applyHubBackground;
window.applyHubBanner = applyHubBanner;

// Redirection vers GradeManager (compatibilité)
window.updatePlayerGrades = () => gradeManager.updatePlayerGrades();
window.calculateSoloGrade = (level) => gradeManager.calculateSoloGrade(level);
window.calculateMultiGrade = (wins) => gradeManager.calculateMultiGrade(wins);
window.testGrade = (level, wins) => gradeManager.testGrade(level, wins);

// Note: openChest, updateBoxCount, etc. sont déjà exposés par ChestManager
// Note: activateBooster, updateBoostersDisplay sont déjà exposés par BoosterManager

// Auto-init si le hub est déjà visible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const hubEl = document.getElementById('hub');
        if (hubEl && !hubEl.classList.contains('hidden')) {
            initHub();
        }
    });
}

logger.log('✅ HubManager chargé');

export {
    initHub,
    getPlayerData,
    updatePlayerInfo,
    showFriends,
    applyHubBackground,
    applyHubBanner
};
