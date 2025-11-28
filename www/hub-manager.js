/**
 * HUB MANAGER - Gestion des données dynamiques du Hub
 */

import { logger } from './services/logger.js';
import { RANKS } from './data/trophies.js';

/**
 * GRADES MULTI - Basés sur multiWins
 * Couleurs alignées sur les grades Solo
 */
const MULTI_GRADES = {
    LEGEND: { min: 50, emoji: '👑', color: '#9400D3', label: 'LÉGENDE' },
    PLATINUM: { min: 30, emoji: '💎', color: '#E5E4E2', label: 'PLATINE' },
    GOLD: { min: 20, emoji: '🥇', color: '#FFD700', label: 'OR' },
    SILVER: { min: 10, emoji: '🥈', color: '#C0C0C0', label: 'ARGENT' },
    BRONZE: { min: 0, emoji: '🥉', color: '#CD7F32', label: 'BRONZE' }
};

/**
 * Calcule le grade solo basé sur le niveau du joueur
 * @param {number} level - Niveau du joueur
 * @returns {object} Grade { emoji, color, label }
 */
function calculateSoloGrade(level) {
    // Parcourir les grades de RANKS (définis dans trophies.js)
    for (const [key, rank] of Object.entries(RANKS)) {
        if (level >= rank.minLevel && level <= rank.maxLevel) {
            return {
                emoji: rank.emoji,
                color: rank.color,
                label: rank.title
            };
        }
    }

    // Par défaut : BRONZE (Apprenti)
    return {
        emoji: RANKS.bronze.emoji,
        color: RANKS.bronze.color,
        label: RANKS.bronze.title
    };
}

/**
 * Calcule le grade multi basé sur les victoires
 * @param {number} multiWins - Nombre de victoires multi
 * @returns {object} Grade { emoji, color, label }
 */
function calculateMultiGrade(multiWins) {
    for (const [key, grade] of Object.entries(MULTI_GRADES)) {
        if (multiWins >= grade.min) {
            return grade;
        }
    }
    return MULTI_GRADES.BRONZE;
}

/**
 * Récupère les données du joueur depuis window.career (source unique de vérité)
 * @returns {object} Données du joueur
 */
function getPlayerData() {
    // ✅ UNIFIÉ : Lecture depuis window.career uniquement
    const career = window.career || {
        level: 1,
        xp: 0,
        xpNext: 100,
        bestScore: 0,
        multiWins: 0
    };

    // Récupérer pseudo
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
 * Met à jour l'affichage des grades dans le Hub
 */
function updatePlayerGrades() {
    const data = getPlayerData();

    // Calculer les grades
    const soloGrade = calculateSoloGrade(data.level);  // ✅ Basé sur le NIVEAU
    const multiGrade = calculateMultiGrade(data.multiWins);

    // Mettre à jour le DOM
    const soloValueEl = document.getElementById('hub-grade-solo');
    const multiValueEl = document.getElementById('hub-grade-multi');

    if (soloValueEl) {
        soloValueEl.textContent = soloGrade.label;
        soloValueEl.style.color = soloGrade.color;
    }

    if (multiValueEl) {
        multiValueEl.textContent = multiGrade.label;
        multiValueEl.style.color = multiGrade.color;
    }

    logger.log(`[HubManager] Grades mis à jour - Solo: ${soloGrade.label} (niveau ${data.level}), Multi: ${multiGrade.label} (${data.multiWins} victoires)`);
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

    // Barre de progression XP
    const xpMax = data.level * 100;
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

/**
 * TIMER COFFRE QUOTIDIEN
 */
let chestTimerInterval = null;
const CHEST_COOLDOWN = 3600; // 1 heure en secondes

/**
 * Formate les secondes en MM:SS
 * @param {number} seconds - Secondes à formater
 * @returns {string} Format "MM:SS"
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calcule le temps restant avant que le coffre soit prêt
 * @returns {number} Secondes restantes (0 si prêt)
 */
function getChestTimeRemaining() {
    const lastOpen = parseInt(localStorage.getItem('lastChestOpen') || '0');

    if (lastOpen === 0) {
        // Jamais ouvert, prêt immédiatement
        return 0;
    }

    const now = Date.now();
    const elapsed = Math.floor((now - lastOpen) / 1000); // secondes écoulées
    const remaining = CHEST_COOLDOWN - elapsed;

    return remaining > 0 ? remaining : 0;
}

/**
 * Met à jour l'affichage du timer coffre
 */
function updateChestDisplay() {
    const remaining = getChestTimeRemaining();
    const timerEl = document.getElementById('hub-chest-timer');
    const cardEl = document.getElementById('hub-chest-card');

    if (!timerEl || !cardEl) return;

    if (remaining === 0) {
        // Coffre PRÊT !
        timerEl.textContent = 'PRÊT !';
        timerEl.style.color = '#00FF87';
        cardEl.classList.add('ready');
    } else {
        // Afficher le temps restant
        timerEl.textContent = formatTime(remaining);
        timerEl.style.color = 'var(--hub-cyan)';
        cardEl.classList.remove('ready');
    }
}

/**
 * Initialise le timer du coffre (décompte toutes les secondes)
 */
function initChestTimer() {
    // Nettoyer l'ancien interval si existe
    if (chestTimerInterval) {
        clearInterval(chestTimerInterval);
    }

    // Mettre à jour immédiatement
    updateChestDisplay();

    // Puis toutes les secondes
    chestTimerInterval = setInterval(() => {
        updateChestDisplay();
    }, 1000);

    logger.log('[HubManager] Timer coffre initialisé');
}

/**
 * REWARD POOL - Items débloquables via le coffre
 */
const REWARD_POOL = {
    skins: [
        { id: 'rainbow-snake', name: 'Arc-en-ciel', rarity: 'rare', emoji: '🌈' },
        { id: 'golden-snake', name: 'Serpent Doré', rarity: 'epic', emoji: '🟡' },
        { id: 'neon-snake', name: 'Néon', rarity: 'rare', emoji: '💜' },
        { id: 'fire-snake', name: 'Flammes', rarity: 'epic', emoji: '🔥' },
        { id: 'ice-snake', name: 'Glace', rarity: 'rare', emoji: '❄️' },
        { id: 'shadow-snake', name: 'Ombre', rarity: 'legendary', emoji: '🌑' },
        { id: 'cyber-snake', name: 'Cyber', rarity: 'epic', emoji: '🤖' }
    ],
    backgrounds: [
        { id: 'galaxy-bg', name: 'Galaxie', rarity: 'rare', emoji: '🌌' },
        { id: 'ocean-bg', name: 'Océan', rarity: 'common', emoji: '🌊' },
        { id: 'forest-bg', name: 'Forêt', rarity: 'common', emoji: '🌲' },
        { id: 'desert-bg', name: 'Désert', rarity: 'common', emoji: '🏜️' },
        { id: 'volcano-bg', name: 'Volcan', rarity: 'epic', emoji: '🌋' },
        { id: 'space-bg', name: 'Espace', rarity: 'legendary', emoji: '🚀' },
        { id: 'neon-city-bg', name: 'Ville Néon', rarity: 'epic', emoji: '🌃' }
    ],
    musiques: [
        { id: 'synthwave-music', name: 'Synthwave', rarity: 'rare', emoji: '🎹' },
        { id: 'epic-music', name: 'Epic Orchestra', rarity: 'epic', emoji: '🎻' },
        { id: 'chill-music', name: 'Chill Lofi', rarity: 'common', emoji: '🎧' },
        { id: 'battle-music', name: 'Battle Theme', rarity: 'epic', emoji: '⚔️' },
        { id: 'space-music', name: 'Space Ambient', rarity: 'rare', emoji: '🌠' }
    ],
    boosts: [
        { id: 'xp-boost-10', name: 'Boost XP +10%', rarity: 'common', emoji: '⭐' },
        { id: 'xp-boost-25', name: 'Boost XP +25%', rarity: 'rare', emoji: '💫' },
        { id: 'score-boost-10', name: 'Boost Score +10%', rarity: 'common', emoji: '📈' },
        { id: 'score-boost-25', name: 'Boost Score +25%', rarity: 'rare', emoji: '💯' },
        { id: 'speed-boost', name: 'Boost Vitesse', rarity: 'epic', emoji: '⚡' },
        { id: 'lucky-coin', name: 'Pièce Chanceuse', rarity: 'legendary', emoji: '🪙' },
        { id: 'trophy-hunter', name: 'Chasseur de Trophées', rarity: 'epic', emoji: '🏆' },
        { id: 'double-reward', name: 'Récompense Double', rarity: 'legendary', emoji: '💎' }
    ]
};

/**
 * Génère des récompenses aléatoires (1-3 items)
 * @returns {Array} Liste des items générés [{ category, item }]
 */
function generateRewards() {
    const rewards = [];
    const numRewards = Math.floor(Math.random() * 3) + 1; // 1-3 items

    // Pool de toutes les catégories
    const categories = ['skins', 'backgrounds', 'musiques', 'boosts'];

    for (let i = 0; i < numRewards; i++) {
        // Sélectionner une catégorie aléatoire
        const category = categories[Math.floor(Math.random() * categories.length)];
        const pool = REWARD_POOL[category];

        // Sélectionner un item aléatoire dans cette catégorie
        const item = pool[Math.floor(Math.random() * pool.length)];

        rewards.push({ category, item });
    }

    return rewards;
}

/**
 * Débloque un item et l'ajoute au localStorage
 * @param {string} category - Catégorie ('skins', 'backgrounds', 'musiques', 'boosts')
 * @param {object} item - Item à débloquer { id, name, rarity, emoji }
 * @returns {boolean} True si nouvellement débloqué, false si déjà possédé
 */
function unlockItem(category, item) {
    // Mapper category vers localStorage key
    const storageKeys = {
        skins: 'unlockedSkins',
        backgrounds: 'unlockedBackgrounds',
        musiques: 'unlockedMusiques',
        boosts: 'unlockedBoosts'
    };

    const storageKey = storageKeys[category];
    if (!storageKey) {
        logger.warn(`[HubManager] Catégorie inconnue: ${category}`);
        return false;
    }

    try {
        // Récupérer la liste actuelle
        const unlocked = JSON.parse(localStorage.getItem(storageKey) || '[]');

        // Vérifier si déjà débloqué
        if (unlocked.includes(item.id)) {
            logger.log(`[HubManager] Item déjà débloqué: ${item.name}`);
            return false; // Déjà possédé
        }

        // Ajouter l'item
        unlocked.push(item.id);
        localStorage.setItem(storageKey, JSON.stringify(unlocked));

        logger.log(`[HubManager] ✅ Item débloqué: ${item.name} (${category})`);
        return true; // Nouvellement débloqué
    } catch (e) {
        logger.warn(`[HubManager] Erreur déblocage item: ${e.message}`);
        return false;
    }
}

/**
 * Ouvre le coffre et distribue les récompenses
 */
async function openChest() {
    const remaining = getChestTimeRemaining();

    if (remaining > 0) {
        // Pas encore prêt
        alert(`⏰ Le coffre sera prêt dans ${formatTime(remaining)}`);
        return;
    }

    // Coffre prêt, on peut l'ouvrir
    logger.log('[HubManager] Ouverture du coffre...');

    // 1. DONNER DE VRAIS XP
    const xpAmount = 50;
    if (window.awardXP) {
        const result = window.awardXP(xpAmount);
        logger.log(`[HubManager] +${xpAmount} XP donnés (Level up: ${result.leveledUp})`);
    } else {
        logger.warn('[HubManager] window.awardXP non disponible');
    }

    // 2. ✅ Tirer récompense via BoxManager
    const rewardData = {
        xp: xpAmount
    };

    if (window.boxManager) {
        const reward = window.boxManager.openChest();

        if (reward.type === 'coins') {
            rewardData.coins = reward.value;
        } else if (reward.type === 'item') {
            rewardData.item = reward.item;
        }
    } else {
        logger.warn('[HubManager] BoxManager non disponible');
    }

    // 3. ✨ AFFICHER EXPÉRIENCE AAA au lieu de alert()
    if (window.chestOpening) {
        await window.chestOpening.open(rewardData);
    } else {
        logger.warn('[HubManager] ChestOpening non disponible, fallback alert()');
        // Fallback si chestOpening pas chargé
        alert(`🎁 Coffre ouvert!\n+${rewardData.xp} XP${rewardData.coins ? `\n+${rewardData.coins} coins` : ''}${rewardData.item ? `\n${rewardData.item.emoji} ${rewardData.item.name}` : ''}`);
    }

    // 4. RESET LE TIMER
    localStorage.setItem('lastChestOpen', Date.now().toString());

    // 5. METTRE À JOUR L'AFFICHAGE
    updateChestDisplay();
    updateBoxCount(); // Mettre à jour le compteur Ma Box
    updatePlayerInfo(); // Mettre à jour niveau/XP

    logger.log('[HubManager] Coffre ouvert avec succès ✅');
}

/**
 * Nettoie le timer (appelé quand on quitte le hub)
 */
function cleanupChestTimer() {
    if (chestTimerInterval) {
        clearInterval(chestTimerInterval);
        chestTimerInterval = null;
        logger.log('[HubManager] Timer coffre nettoyé');
    }
}

/**
 * MA BOX - COMPTEUR D'ITEMS
 */

/**
 * Compte tous les items débloqués du joueur
 * @returns {number} Nombre total d'items
 */
function countBoxItems() {
    // ✅ CORRECTION: Utiliser les vraies données de BoxManager
    // Les items sont stockés dans boxData.unlockedItems, pas dans des clés séparées

    try {
        // Si BoxManager est disponible, utiliser directement
        if (window.boxManager && window.boxManager.unlockedItems) {
            return window.boxManager.unlockedItems.length;
        }

        // Sinon, charger depuis localStorage
        const boxDataStr = localStorage.getItem('boxData');
        if (boxDataStr) {
            const boxData = JSON.parse(boxDataStr);
            if (boxData.unlockedItems && Array.isArray(boxData.unlockedItems)) {
                return boxData.unlockedItems.length;
            }
        }

        // Aucune donnée trouvée
        return 0;
    } catch (e) {
        logger.warn('[HubManager] Erreur lecture boxData:', e);
        return 0;
    }
}

/**
 * Met à jour l'affichage du compteur Ma Box
 */
function updateBoxCount() {
    const count = countBoxItems();
    const countEl = document.getElementById('hub-box-count');

    if (countEl) {
        countEl.textContent = `${count} item${count > 1 ? 's' : ''}`;
    }

    logger.log(`[HubManager] Ma Box: ${count} items`);
}

/**
 * Récupère les détails d'un item par son ID
 * @param {string} itemId - ID de l'item
 * @returns {object|null} Item trouvé ou null
 */
function getItemDetails(itemId) {
    for (const category in REWARD_POOL) {
        const item = REWARD_POOL[category].find(i => i.id === itemId);
        if (item) return item;
    }
    return null;
}

/**
 * ⚠️ NOTE: La fonction openBox() est maintenant définie dans box-ui.js
 * Elle affiche l'écran Box complet avec interface graphique AAA
 */

/**
 * SYSTÈME D'AMIS
 */

/**
 * Affiche l'écran des amis
 */
function showFriends() {
    // TODO: Créer un vrai système d'amis avec serveur
    // Pour l'instant, affichage basique

    let message = `👥 AMIS\n\n`;

    // Récupérer la liste d'amis depuis localStorage
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

    alert(message);
}

// ============================================
// 🎨 SYSTÈME DE BACKGROUNDS THÉMATIQUES
// ============================================

// Mapping bannière → background du hub
const BANNER_TO_BACKGROUND = {
    'banner_ice': 'assets/backgrounds/backgrounds_glace_hub.webp',
    'banner_fire': 'assets/backgrounds/backgrounds_feu_hub.webp',
    'banner_lightning': 'assets/backgrounds/backgrounds_foudre_hub.webp',
    'banner_rock': 'assets/backgrounds/backgrounds_roche_hub.webp',
    'banner_default': null // Gradient CSS par défaut
};

/**
 * Applique le background thématique du hub selon la bannière équipée
 * Applique directement sur .phone pour être plein écran
 * @param {object} bannerItem - Item bannière { id, name, image, ... }
 */
function applyHubThemeBackground(bannerItem) {
    const phone = document.querySelector('.phone');
    if (!phone) {
        logger.warn('[HubManager] Élément .phone non trouvé');
        return;
    }

    const bgPath = bannerItem ? BANNER_TO_BACKGROUND[bannerItem.id] : null;

    if (bgPath) {
        // Appliquer le thème directement sur .phone
        phone.style.backgroundImage = `url('${bgPath}')`;
        phone.style.backgroundSize = 'cover';
        phone.style.backgroundPosition = 'center';
        // Marquer qu'on a un thème actif
        phone.dataset.hubTheme = bannerItem.id;
        logger.log(`[HubManager] Background thème appliqué sur .phone: ${bgPath}`);
    } else {
        // Revenir au background par défaut via BackgroundManager
        delete phone.dataset.hubTheme;
        if (window.backgroundManager) {
            window.backgroundManager.currentBackground = null;
            window.backgroundManager.setBackground('hub');
        }
        logger.log('[HubManager] Background thème retiré, défaut restauré');
    }
}

// ============================================
// 🖼️ SYSTÈME DE BANNIÈRES
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
        // Bannière avec image
        imageEl.src = bannerItem.image;
        imageEl.style.display = 'block';
        bannerEl.classList.remove('default');
        logger.log(`[HubManager] Bannière appliquée: ${bannerItem.name}`);
    } else {
        // Bannière par défaut (gradient CSS)
        imageEl.src = '';
        imageEl.style.display = 'none';
        bannerEl.classList.add('default');
        logger.log('[HubManager] Bannière par défaut appliquée');
    }

    // Synchroniser avec la carte ID Stats
    if (window.applyStatsBanner) {
        window.applyStatsBanner(bannerItem);
    }

    // Synchroniser le background thématique du hub
    applyHubThemeBackground(bannerItem);
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

/**
 * Initialise le Hub (appelé au chargement)
 */
function initHub() {
    logger.log('[HubManager] Initialisation du Hub...');

    updatePlayerInfo();
    updatePlayerGrades();
    initChestTimer();
    updateBoxCount();
    initHubBanner();

    logger.log('[HubManager] Hub initialisé ✅');
}

/**
 * Affiche la popup des taux de drop du coffre (par dessus le conteneur)
 */
function showChestDropRates() {
    const chestCard = document.getElementById('hub-chest-card');
    if (!chestCard) return;

    // Supprimer si déjà ouvert
    const existing = document.getElementById('chest-drop-rates-popup');
    if (existing) {
        existing.remove();
        chestCard.classList.remove('info-open');
        return;
    }

    // Ajouter classe pour cacher le ℹ️
    chestCard.classList.add('info-open');

    // ✅ STRATÉGIE OVERLAY : Créer un overlay plein écran
    const overlay = document.createElement('div');
    overlay.id = 'chest-drop-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const popup = document.createElement('div');
    popup.id = 'chest-drop-rates-popup';
    // ✅ PAS DE CLASSE CSS - Seulement styles inline avec !important
    popup.style.cssText = `
        position: relative !important;
        z-index: 9999 !important;
        background: linear-gradient(135deg, rgba(40, 40, 80, 0.98), rgba(20, 20, 50, 0.98)) !important;
        border: 3px solid #d8d800 !important;
        border-radius: 20px !important;
        padding: 25px !important;
        max-width: 400px !important;
        width: 90% !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 100px rgba(216, 216, 0, 0.3) !important;
    `;
    popup.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column;">
            <div style="margin-bottom: 20px; text-align: center; position: relative;">
                <h3 style="color: #d8d800 !important; font-size: 24px !important; margin: 0 !important; text-shadow: 0 0 10px rgba(216, 216, 0, 0.5) !important;">📦 Taux de drop</h3>
                <button style="position: absolute !important; top: -10px !important; right: -10px !important; background: rgba(255,0,0,0.3) !important; border: 2px solid #ff0000 !important; color: white !important; font-size: 20px !important; font-weight: bold !important; width: 35px !important; height: 35px !important; border-radius: 50% !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.3s ease !important;" id="close-drop-rates-btn">✖</button>
            </div>
            <div style="display: flex !important; flex-direction: column !important; gap: 12px !important;">
                <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; background: rgba(255,255,255,0.05) !important; padding: 12px 15px !important; border-radius: 10px !important; border-left: 4px solid #aaa !important;">
                    <span style="color: #fff !important; font-size: 16px !important; font-weight: bold !important;">⚪ Commun</span>
                    <span style="color: #d8d800 !important; font-size: 18px !important; font-weight: bold !important;">60%</span>
                </div>
                <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; background: rgba(255,255,255,0.05) !important; padding: 12px 15px !important; border-radius: 10px !important; border-left: 4px solid #4287f5 !important;">
                    <span style="color: #fff !important; font-size: 16px !important; font-weight: bold !important;">🔵 Rare</span>
                    <span style="color: #d8d800 !important; font-size: 18px !important; font-weight: bold !important;">25%</span>
                </div>
                <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; background: rgba(255,255,255,0.05) !important; padding: 12px 15px !important; border-radius: 10px !important; border-left: 4px solid #a855f7 !important;">
                    <span style="color: #fff !important; font-size: 16px !important; font-weight: bold !important;">🟣 Épique</span>
                    <span style="color: #d8d800 !important; font-size: 18px !important; font-weight: bold !important;">12%</span>
                </div>
                <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; background: rgba(255,255,255,0.05) !important; padding: 12px 15px !important; border-radius: 10px !important; border-left: 4px solid #fbbf24 !important;">
                    <span style="color: #fff !important; font-size: 16px !important; font-weight: bold !important;">🟡 Légendaire</span>
                    <span style="color: #d8d800 !important; font-size: 18px !important; font-weight: bold !important;">3%</span>
                </div>
            </div>
        </div>
    `;

    // Ajouter popup dans l'overlay
    overlay.appendChild(popup);

    // Ajouter l'overlay au body (pas dans le chest card)
    document.body.appendChild(overlay);

    // ✅ Fermer au clic sur l'overlay (fond sombre)
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            logger.log('[HubManager] Clic sur overlay - fermeture');
            try {
                window.audio.buttonClick();
            } catch (err) {
                logger.warn('[HubManager] Audio error:', err);
            }
            closeChestDropRates();
        }
    };

    // ✅ Fermer au clic sur le bouton X
    const closeBtn = document.getElementById('close-drop-rates-btn');
    if (closeBtn) {
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            logger.log('[HubManager] Bouton X cliqué');
            try {
                window.audio.buttonClick();
            } catch (err) {
                logger.warn('[HubManager] Audio error:', err);
            }
            closeChestDropRates();
        };
    }

    logger.log('[HubManager] Popup taux de drop affichée avec overlay plein écran');
}

/**
 * Ferme la popup des taux de drop
 */
function closeChestDropRates() {
    logger.log('[HubManager] closeChestDropRates() appelée');

    // Supprimer l'overlay plein écran (qui contient la popup)
    const overlay = document.getElementById('chest-drop-overlay');
    const chestCard = document.getElementById('hub-chest-card');

    if (overlay) {
        overlay.remove();
        logger.log('[HubManager] Overlay popup supprimé');
    } else {
        logger.log('[HubManager] ⚠️ Overlay introuvable');
    }

    if (chestCard) {
        chestCard.classList.remove('info-open');
    }
}

// Exposer globalement
window.initHub = initHub;
window.updatePlayerGrades = updatePlayerGrades;
window.updatePlayerInfo = updatePlayerInfo;
window.calculateSoloGrade = calculateSoloGrade;
window.calculateMultiGrade = calculateMultiGrade;
window.openChest = openChest;
window.cleanupChestTimer = cleanupChestTimer;
window.updateBoxCount = updateBoxCount;
window.applyHubBanner = applyHubBanner;
window.showChestDropRates = showChestDropRates;
window.closeChestDropRates = closeChestDropRates;
// window.openBox est défini dans box-ui.js
window.showFriends = showFriends;

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

export { initHub, updatePlayerGrades, updatePlayerInfo, calculateSoloGrade, calculateMultiGrade, openChest, cleanupChestTimer, updateBoxCount, showFriends, applyHubBanner };
