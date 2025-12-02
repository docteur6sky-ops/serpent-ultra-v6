/**
 * CHEST MANAGER - Système de coffre quotidien
 *
 * Responsabilités :
 * - Timer du coffre (cooldown 1h)
 * - Ouverture et récompenses
 * - Pool de rewards
 * - Popup taux de drop
 * - Compteur Ma Box
 */

import { logger } from '../services/logger.js';

// ============================================
// CONFIGURATION
// ============================================

const CHEST_COOLDOWN = 3600; // 1 heure en secondes

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

// ============================================
// CLASSE CHEST MANAGER
// ============================================

class ChestManager {
    constructor() {
        this.timerInterval = null;
        logger.log('[ChestManager] Initialisé');
    }

    // ============================================
    // UTILITAIRES
    // ============================================

    /**
     * Formate les secondes en MM:SS
     * @param {number} seconds - Secondes à formater
     * @returns {string} Format "MM:SS"
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Calcule le temps restant avant que le coffre soit prêt
     * @returns {number} Secondes restantes (0 si prêt)
     */
    getTimeRemaining() {
        const lastOpen = parseInt(localStorage.getItem('lastChestOpen') || '0');

        if (lastOpen === 0) {
            return 0; // Jamais ouvert, prêt immédiatement
        }

        const now = Date.now();
        const elapsed = Math.floor((now - lastOpen) / 1000);
        const remaining = CHEST_COOLDOWN - elapsed;

        return remaining > 0 ? remaining : 0;
    }

    // ============================================
    // TIMER DU COFFRE
    // ============================================

    /**
     * Met à jour l'affichage du timer coffre
     */
    updateDisplay() {
        const remaining = this.getTimeRemaining();
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
            timerEl.textContent = this.formatTime(remaining);
            timerEl.style.color = 'var(--hub-cyan)';
            cardEl.classList.remove('ready');
        }
    }

    /**
     * Initialise le timer du coffre (décompte toutes les secondes)
     */
    initTimer() {
        // Nettoyer l'ancien interval si existe
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Mettre à jour immédiatement
        this.updateDisplay();

        // Puis toutes les secondes
        this.timerInterval = setInterval(() => {
            this.updateDisplay();
        }, 1000);

        logger.log('[ChestManager] Timer coffre initialisé');
    }

    /**
     * Nettoie le timer (appelé quand on quitte le hub)
     */
    cleanup() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            logger.log('[ChestManager] Timer coffre nettoyé');
        }
    }

    // ============================================
    // OUVERTURE DU COFFRE
    // ============================================

    /**
     * Ouvre le coffre et distribue les récompenses
     */
    async open() {
        const remaining = this.getTimeRemaining();

        if (remaining > 0) {
            // Pas encore prêt - pas de message, le timer est visible
            return;
        }

        logger.log('[ChestManager] Ouverture du coffre...');

        // 1. DONNER DE VRAIS XP (250 ou 500 aléatoire)
        const xpAmount = Math.random() < 0.7 ? 250 : 500;
        if (window.awardXP) {
            const result = window.awardXP(xpAmount);
            logger.log(`[ChestManager] +${xpAmount} XP donnés (Level up: ${result.leveledUp})`);
        } else {
            logger.warn('[ChestManager] window.awardXP non disponible');
        }

        // 2. Tirer récompense via BoxManager (coins ou item)
        const rewardData = { xp: xpAmount };

        if (window.boxManager) {
            const reward = window.boxManager.openChest();

            if (reward.type === 'coins') {
                rewardData.coins = reward.value;
            } else if (reward.type === 'item') {
                rewardData.item = reward.item;
            } else if (reward.type === 'booster') {
                rewardData.booster = reward.boostPercent;
            }
        } else {
            logger.warn('[ChestManager] BoxManager non disponible');
        }

        // 3. AFFICHER EXPÉRIENCE AAA au lieu de alert()
        if (window.chestOpening) {
            await window.chestOpening.open(rewardData);
        } else {
            logger.warn('[ChestManager] ChestOpening non disponible, fallback alert()');
            alert(`🎁 Coffre ouvert!\n+${rewardData.xp} XP${rewardData.coins ? `\n+${rewardData.coins} coins` : ''}${rewardData.item ? `\n${rewardData.item.emoji} ${rewardData.item.name}` : ''}`);
        }

        // 4. RESET LE TIMER
        localStorage.setItem('lastChestOpen', Date.now().toString());

        // 5. METTRE À JOUR L'AFFICHAGE
        this.updateDisplay();
        this.updateBoxCount();
        if (window.updatePlayerInfo) window.updatePlayerInfo();
        if (window.updateBoostersDisplay) window.updateBoostersDisplay();

        logger.log('[ChestManager] Coffre ouvert avec succès ✅');
    }

    // ============================================
    // REWARDS
    // ============================================

    /**
     * Génère des récompenses aléatoires (1-3 items)
     * @returns {Array} Liste des items générés [{ category, item }]
     */
    generateRewards() {
        const rewards = [];
        const numRewards = Math.floor(Math.random() * 3) + 1;
        const categories = ['skins', 'backgrounds', 'musiques', 'boosts'];

        for (let i = 0; i < numRewards; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const pool = REWARD_POOL[category];
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
    unlockItem(category, item) {
        const storageKeys = {
            skins: 'unlockedSkins',
            backgrounds: 'unlockedBackgrounds',
            musiques: 'unlockedMusiques',
            boosts: 'unlockedBoosts'
        };

        const storageKey = storageKeys[category];
        if (!storageKey) {
            logger.warn(`[ChestManager] Catégorie inconnue: ${category}`);
            return false;
        }

        try {
            const unlocked = JSON.parse(localStorage.getItem(storageKey) || '[]');

            if (unlocked.includes(item.id)) {
                logger.log(`[ChestManager] Item déjà débloqué: ${item.name}`);
                return false;
            }

            unlocked.push(item.id);
            localStorage.setItem(storageKey, JSON.stringify(unlocked));

            logger.log(`[ChestManager] ✅ Item débloqué: ${item.name} (${category})`);
            return true;
        } catch (e) {
            logger.warn(`[ChestManager] Erreur déblocage item: ${e.message}`);
            return false;
        }
    }

    /**
     * Récupère les détails d'un item par son ID
     * @param {string} itemId - ID de l'item
     * @returns {object|null} Item trouvé ou null
     */
    getItemDetails(itemId) {
        for (const category in REWARD_POOL) {
            const item = REWARD_POOL[category].find(i => i.id === itemId);
            if (item) return item;
        }
        return null;
    }

    // ============================================
    // MA BOX - COMPTEUR D'ITEMS
    // ============================================

    /**
     * Compte tous les items débloqués du joueur
     * @returns {number} Nombre total d'items
     */
    countBoxItems() {
        try {
            if (window.boxManager && window.boxManager.unlockedItems) {
                return window.boxManager.unlockedItems.length;
            }

            const boxDataStr = localStorage.getItem('boxData');
            if (boxDataStr) {
                const boxData = JSON.parse(boxDataStr);
                if (boxData.unlockedItems && Array.isArray(boxData.unlockedItems)) {
                    return boxData.unlockedItems.length;
                }
            }

            return 0;
        } catch (e) {
            logger.warn('[ChestManager] Erreur lecture boxData:', e);
            return 0;
        }
    }

    /**
     * Met à jour l'affichage du compteur Ma Box
     */
    updateBoxCount() {
        const count = this.countBoxItems();
        const countEl = document.getElementById('hub-box-count');

        if (countEl) {
            countEl.textContent = `${count} item${count > 1 ? 's' : ''}`;
        }

        logger.log(`[ChestManager] Ma Box: ${count} items`);
    }

    // ============================================
    // POPUP TAUX DE DROP
    // ============================================

    /**
     * Affiche la popup des taux de drop du coffre
     */
    showDropRates() {
        const chestCard = document.getElementById('hub-chest-card');
        if (!chestCard) return;

        // Supprimer si déjà ouvert
        const existing = document.getElementById('chest-drop-rates-popup');
        if (existing) {
            existing.remove();
            chestCard.classList.remove('info-open');
            return;
        }

        chestCard.classList.add('info-open');

        // Créer overlay plein écran
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

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Fermer au clic sur l'overlay
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                logger.log('[ChestManager] Clic sur overlay - fermeture');
                try {
                    window.audio.buttonClick();
                } catch (err) {
                    logger.warn('[ChestManager] Audio error:', err);
                }
                this.closeDropRates();
            }
        };

        // Fermer au clic sur le bouton X
        const closeBtn = document.getElementById('close-drop-rates-btn');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                logger.log('[ChestManager] Bouton X cliqué');
                try {
                    window.audio.buttonClick();
                } catch (err) {
                    logger.warn('[ChestManager] Audio error:', err);
                }
                this.closeDropRates();
            };
        }

        logger.log('[ChestManager] Popup taux de drop affichée');
    }

    /**
     * Ferme la popup des taux de drop
     */
    closeDropRates() {
        logger.log('[ChestManager] closeDropRates() appelée');

        const overlay = document.getElementById('chest-drop-overlay');
        const chestCard = document.getElementById('hub-chest-card');

        if (overlay) {
            overlay.remove();
            logger.log('[ChestManager] Overlay popup supprimé');
        }

        if (chestCard) {
            chestCard.classList.remove('info-open');
        }
    }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

const chestManager = new ChestManager();

// Exposer globalement pour compatibilité HTML onclick
window.chestManager = chestManager;
window.openChest = () => chestManager.open();
window.initChestTimer = () => chestManager.initTimer();
window.cleanupChestTimer = () => chestManager.cleanup();
window.updateChestDisplay = () => chestManager.updateDisplay();
window.updateBoxCount = () => chestManager.updateBoxCount();
window.showChestDropRates = () => chestManager.showDropRates();
window.closeChestDropRates = () => chestManager.closeDropRates();
window.getChestTimeRemaining = () => chestManager.getTimeRemaining();

logger.log('✅ ChestManager chargé');

export { chestManager, ChestManager, REWARD_POOL, CHEST_COOLDOWN };
