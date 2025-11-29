/**
 * BOX MANAGER - Gestion de la collection d'items
 *
 * Gère :
 * - Système de monnaie (coins)
 * - Items débloqués/équipés
 * - Achat d'items
 * - Déblocage par niveau/achievement
 * - Loot du coffre quotidien
 */

import { logger } from './services/logger.js';
import { ITEMS, getAllItems, getItemById, RARITY } from './data/items.js';

/**
 * CLASS BoxManager
 */
class BoxManager {
    constructor() {
        this.coins = 0;
        this.unlockedItems = [];
        this.equippedSkin = 'classic';
        this.equippedBackground = 'default';
        this.equippedBanner = 'banner_default';

        this.load();

        logger.log('📦 [BoxManager] Initialisé');
    }

    // ============================================
    // 💰 SYSTÈME DE MONNAIE
    // ============================================

    /**
     * Récupère le nombre de coins du joueur
     * @returns {number} Nombre de coins
     */
    getCoins() {
        return this.coins;
    }

    /**
     * Ajoute des coins au joueur
     * @param {number} amount - Montant à ajouter
     * @param {string} reason - Raison du gain (pour logs)
     */
    addCoins(amount, reason = 'unknown') {
        this.coins += amount;
        this.save();

        logger.log(`💰 [BoxManager] +${amount} coins (${reason}) → Total: ${this.coins}`);

        // Notification visuelle
        if (window.NotificationManager && window.NotificationManager.show) {
            window.NotificationManager.show(
                `+${amount} 💰`,
                'success',
                2000
            );
        }
    }

    /**
     * Retire des coins au joueur
     * @param {number} amount - Montant à retirer
     * @returns {boolean} True si succès, false si pas assez de coins
     */
    removeCoins(amount) {
        if (this.coins < amount) {
            logger.warn(`⚠️ [BoxManager] Pas assez de coins (${this.coins} < ${amount})`);
            return false;
        }

        this.coins -= amount;
        this.save();

        logger.log(`💸 [BoxManager] -${amount} coins → Total: ${this.coins}`);

        return true;
    }

    // ============================================
    // 🎁 GESTION DES ITEMS
    // ============================================

    /**
     * Vérifie si un item est débloqué
     * @param {string} itemId - ID de l'item
     * @returns {boolean} True si débloqué
     */
    isUnlocked(itemId) {
        const item = getItemById(itemId);

        // Items gratuits de base
        if (item && item.unlocked === true) {
            return true;
        }

        // Vérifier dans la liste des items débloqués
        return this.unlockedItems.includes(itemId);
    }

    /**
     * Débloque un item
     * @param {string} itemId - ID de l'item
     * @param {string} reason - Raison du déblocage (pour logs)
     */
    unlockItem(itemId, reason = 'unknown') {
        if (this.isUnlocked(itemId)) {
            logger.warn(`⚠️ [BoxManager] Item ${itemId} déjà débloqué`);
            return false;
        }

        const item = getItemById(itemId);
        if (!item) {
            logger.error(`❌ [BoxManager] Item ${itemId} introuvable`);
            return false;
        }

        this.unlockedItems.push(itemId);
        this.save();

        logger.log(`🎁 [BoxManager] Item ${itemId} débloqué (${reason})`);

        // Notification avec emoji de l'item
        if (window.NotificationManager && window.NotificationManager.show) {
            window.NotificationManager.show(
                `${item.emoji} ${item.name} débloqué !`,
                'success',
                3000
            );
        }

        return true;
    }

    /**
     * Achète un item avec des coins
     * @param {string} itemId - ID de l'item
     * @returns {boolean} True si achat réussi
     */
    buyItem(itemId) {
        const item = getItemById(itemId);

        if (!item) {
            logger.error(`❌ [BoxManager] Item ${itemId} introuvable`);
            return false;
        }

        if (this.isUnlocked(itemId)) {
            logger.warn(`⚠️ [BoxManager] Item ${itemId} déjà possédé`);
            if (window.NotificationManager && window.NotificationManager.show) {
                window.NotificationManager.show(
                    'Déjà possédé !',
                    'error',
                    2000
                );
            }
            return false;
        }

        if (item.price === 0 || item.unlockType !== 'coins') {
            logger.warn(`⚠️ [BoxManager] Item ${itemId} non achetable`);
            return false;
        }

        if (this.coins < item.price) {
            logger.warn(`⚠️ [BoxManager] Pas assez de coins (${this.coins} < ${item.price})`);
            if (window.NotificationManager && window.NotificationManager.show) {
                window.NotificationManager.show(
                    `Pas assez de coins ! (${this.coins}/${item.price})`,
                    'error',
                    2000
                );
            }
            return false;
        }

        // Débiter les coins
        this.removeCoins(item.price);

        // Débloquer l'item
        this.unlockItem(itemId, `achat ${item.price} coins`);

        logger.log(`✅ [BoxManager] Achat réussi: ${item.name}`);

        return true;
    }

    /**
     * Équipe un item (skin ou background)
     * @param {string} itemId - ID de l'item
     * @returns {boolean} True si équipement réussi
     */
    equipItem(itemId) {
        const item = getItemById(itemId);

        if (!item) {
            logger.error(`❌ [BoxManager] Item ${itemId} introuvable`);
            return false;
        }

        if (!this.isUnlocked(itemId)) {
            logger.warn(`⚠️ [BoxManager] Item ${itemId} non débloqué`);
            return false;
        }

        if (item.type === 'skin') {
            this.equippedSkin = itemId;
            logger.log(`🐍 [BoxManager] Skin équipé: ${item.name}`);

            // Appliquer le skin au snake
            if (window.applySkin) {
                window.applySkin(item);
            }
        } else if (item.type === 'background') {
            this.equippedBackground = itemId;
            logger.log(`🎨 [BoxManager] Background équipé: ${item.name}`);

            // Appliquer le background au hub
            if (window.applyHubBackground) {
                window.applyHubBackground();
            }
        } else if (item.type === 'banner') {
            this.equippedBanner = itemId;
            logger.log(`🖼️ [BoxManager] Bannière équipée: ${item.name}`);

            // Appliquer la bannière au hub
            if (window.applyHubBanner) {
                window.applyHubBanner(item);
            }
        }

        this.save();

        if (window.NotificationManager && window.NotificationManager.show) {
            window.NotificationManager.show(
                `${item.emoji} ${item.name} équipé !`,
                'success',
                2000
            );
        }

        return true;
    }

    /**
     * Récupère l'item skin équipé
     * @returns {object} Item skin
     */
    getEquippedSkin() {
        return getItemById(this.equippedSkin);
    }

    /**
     * Récupère l'item background équipé
     * @returns {object} Item background
     */
    getEquippedBackground() {
        return getItemById(this.equippedBackground);
    }

    /**
     * Récupère l'item bannière équipé
     * @returns {object} Item banner
     */
    getEquippedBanner() {
        return getItemById(this.equippedBanner);
    }

    // ============================================
    // 🎲 DÉBLOCAGE AUTOMATIQUE
    // ============================================

    /**
     * Vérifie et débloque les items par niveau
     * Appelé quand le joueur monte de niveau
     * @param {number} level - Niveau du joueur
     */
    checkLevelUnlocks(level) {
        const allItems = getAllItems();

        allItems.forEach(item => {
            if (item.unlockType === 'level' && item.unlockLevel === level) {
                if (!this.isUnlocked(item.id)) {
                    this.unlockItem(item.id, `niveau ${level}`);
                }
            }
        });
    }

    /**
     * Vérifie et débloque les items par achievement
     * Appelé quand le joueur obtient un trophée
     * @param {string} trophyKey - Clé du trophée obtenu
     */
    checkAchievementUnlocks(trophyKey) {
        const allItems = getAllItems();

        allItems.forEach(item => {
            if (item.unlockType === 'achievement' && item.unlockTrophy === trophyKey) {
                if (!this.isUnlocked(item.id)) {
                    this.unlockItem(item.id, `trophée ${trophyKey}`);
                }
            }
        });
    }

    // ============================================
    // 📦 COFFRE QUOTIDIEN
    // ============================================

    /**
     * Ouvre le coffre quotidien (coins OU item random)
     * @returns {object} Récompense { type: 'coins'|'item', value: number|itemId }
     */
    openChest() {
        // 50% coins, 50% item
        const isCoinReward = Math.random() < 0.5;

        if (isCoinReward) {
            // Récompense en coins (50-200 coins)
            const amount = Math.floor(Math.random() * 151) + 50;
            this.addCoins(amount, 'coffre quotidien');

            return {
                type: 'coins',
                value: amount
            };
        } else {
            // Récompense item random (selon rareté)
            const item = this.rollRandomItem();

            if (item) {
                this.unlockItem(item.id, 'coffre quotidien');

                return {
                    type: 'item',
                    value: item.id,
                    item: item
                };
            } else {
                // Fallback si pas d'item disponible
                const fallbackCoins = 100;
                this.addCoins(fallbackCoins, 'coffre quotidien (fallback)');

                return {
                    type: 'coins',
                    value: fallbackCoins
                };
            }
        }
    }

    /**
     * Tire un item random selon les taux de rareté
     * @returns {object|null} Item tiré ou null
     */
    rollRandomItem() {
        // Récupérer tous les items non débloqués
        const allItems = getAllItems();
        const lockedItems = allItems.filter(item => !this.isUnlocked(item.id) && !item.unlocked);

        if (lockedItems.length === 0) {
            logger.warn('⚠️ [BoxManager] Tous les items sont déjà débloqués');
            return null;
        }

        // Tirer une rareté selon les drop rates
        const roll = Math.random();
        let cumulativeRate = 0;
        let rolledRarity = 'common';

        for (const [rarity, data] of Object.entries(RARITY)) {
            cumulativeRate += data.dropRate;
            if (roll <= cumulativeRate) {
                rolledRarity = rarity;
                break;
            }
        }

        // Filtrer les items de cette rareté
        const itemsOfRarity = lockedItems.filter(item => item.rarity === rolledRarity);

        if (itemsOfRarity.length === 0) {
            // Si aucun item de cette rareté, fallback sur n'importe quel item non débloqué
            const randomItem = lockedItems[Math.floor(Math.random() * lockedItems.length)];
            logger.log(`🎲 [BoxManager] Aucun item ${rolledRarity}, fallback sur ${randomItem.name}`);
            return randomItem;
        }

        // Tirer un item random parmi ceux de cette rareté
        const randomItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
        logger.log(`🎲 [BoxManager] Item tiré: ${randomItem.name} (${rolledRarity})`);

        return randomItem;
    }

    // ============================================
    // 💾 SAUVEGARDE / CHARGEMENT
    // ============================================

    /**
     * Sauvegarde l'état dans localStorage
     */
    save() {
        const data = {
            coins: this.coins,
            unlockedItems: this.unlockedItems,
            equippedSkin: this.equippedSkin,
            equippedBackground: this.equippedBackground,
            equippedBanner: this.equippedBanner
        };

        localStorage.setItem('boxData', JSON.stringify(data));
    }

    /**
     * Charge l'état depuis localStorage
     */
    load() {
        const saved = localStorage.getItem('boxData');

        if (saved) {
            try {
                const data = JSON.parse(saved);

                this.coins = data.coins || 0;
                this.unlockedItems = data.unlockedItems || [];
                this.equippedSkin = data.equippedSkin || 'classic';
                this.equippedBackground = data.equippedBackground || 'default';
                this.equippedBanner = data.equippedBanner || 'banner_default';

                logger.log(`📦 [BoxManager] Chargé: ${this.coins} coins, ${this.unlockedItems.length} items`);
            } catch (e) {
                logger.error('❌ [BoxManager] Erreur chargement:', e);
            }
        } else {
            logger.log('📦 [BoxManager] Première initialisation');
        }
    }

    /**
     * Réinitialise toutes les données
     */
    reset() {
        this.coins = 0;
        this.unlockedItems = [];
        this.equippedSkin = 'classic';
        this.equippedBackground = 'default';
        this.equippedBanner = 'banner_default';
        this.save();

        logger.log('🔄 [BoxManager] Reset complet');
    }

    // ============================================
    // 📊 STATS
    // ============================================

    /**
     * Récupère les stats de la collection
     * @returns {object} Stats { total, unlocked, locked, percentage }
     */
    getCollectionStats() {
        const allItems = getAllItems();
        const total = allItems.length;
        const unlocked = allItems.filter(item => this.isUnlocked(item.id) || item.unlocked).length;
        const locked = total - unlocked;
        const percentage = Math.round((unlocked / total) * 100);

        return {
            total,
            unlocked,
            locked,
            percentage
        };
    }

    /**
     * Récupère le nombre d'items débloqués
     * @returns {number} Nombre d'items débloqués
     */
    getUnlockedCount() {
        return this.getCollectionStats().unlocked;
    }
}

// ============================================
// INITIALISATION GLOBALE
// ============================================

const boxManager = new BoxManager();
window.boxManager = boxManager;

logger.log('✅ BoxManager chargé');

export { boxManager };
