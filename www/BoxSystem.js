/**
 * BOX SYSTEM - Gestion complète de la collection d'items
 *
 * Fusion de box-manager.js + box-ui.js
 *
 * Contient :
 * - BoxManager (classe) : logique métier, données, sauvegarde
 * - BoxUI (fonctions) : interface utilisateur, rendu
 */

import { logger } from './services/logger.js';
import { ITEMS, getAllItems, getItemById, getItemsByType, RARITY } from './data/items.js';
import { drawSkinPreview } from './SkinsRenderer.js';

// ============================================
// CLASSE BOXMANAGER - LOGIQUE MÉTIER
// ============================================

class BoxManager {
    constructor() {
        this.coins = 0;
        this.unlockedItems = [];
        this.equippedSkin = 'classic';
        this.equippedBackground = 'default';
        this.equippedBanner = 'banner_default';

        // ⚗️ Système de boosters XP
        this.boosters = { boost25: 0, boost50: 0 };
        this.activeBooster = null; // { percent: 25|50, expiresAt: timestamp }

        this.load();

        logger.log('📦 [BoxManager] Initialisé');
    }

    // ============================================
    // 💰 SYSTÈME DE MONNAIE
    // ============================================

    getCoins() {
        return this.coins;
    }

    addCoins(amount, reason = 'unknown') {
        this.coins += amount;
        this.save();

        logger.log(`💰 [BoxManager] +${amount} coins (${reason}) → Total: ${this.coins}`);

        if (window.NotificationManager && window.NotificationManager.show) {
            window.NotificationManager.show(`+${amount} 💰`, 'success', 2000);
        }
    }

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
    // ⚗️ SYSTÈME DE BOOSTERS XP
    // ============================================

    addBooster(percent) {
        const key = percent === 50 ? 'boost50' : 'boost25';
        this.boosters[key]++;
        this.save();

        logger.log(`⚗️ [BoxManager] +1 Booster ${percent}% → Total: ${this.boosters[key]}`);

        if (window.NotificationManager && window.NotificationManager.show) {
            window.NotificationManager.show(`⚗️ Booster +${percent}% XP obtenu !`, 'success', 3000);
        }
    }

    getBoosters() {
        return { ...this.boosters };
    }

    activateBooster(percent) {
        if (this.isBoosterActive()) {
            logger.warn('⚗️ [BoxManager] Un booster est déjà actif !');
            if (window.NotificationManager && window.NotificationManager.show) {
                window.NotificationManager.show('⚠️ Un booster est déjà actif !', 'warning', 3000);
            }
            return false;
        }

        const key = percent === 50 ? 'boost50' : 'boost25';

        if (this.boosters[key] <= 0) {
            logger.warn(`⚗️ [BoxManager] Pas de booster ${percent}% disponible`);
            return false;
        }

        this.boosters[key]--;

        const DURATION_MS = 60 * 60 * 1000; // 1 heure
        this.activeBooster = {
            percent: percent,
            expiresAt: Date.now() + DURATION_MS
        };

        this.save();

        logger.log(`⚗️ [BoxManager] Booster ${percent}% activé pour 1h !`);

        if (window.NotificationManager && window.NotificationManager.show) {
            window.NotificationManager.show(`⚗️ Booster +${percent}% XP activé pour 1h !`, 'success', 3000);
        }

        return true;
    }

    isBoosterActive() {
        if (!this.activeBooster) return false;

        if (Date.now() >= this.activeBooster.expiresAt) {
            logger.log('⚗️ [BoxManager] Booster expiré');
            this.activeBooster = null;
            this.save();
            return false;
        }

        return true;
    }

    getActiveBooster() {
        if (!this.isBoosterActive()) return null;

        return {
            percent: this.activeBooster.percent,
            expiresAt: this.activeBooster.expiresAt,
            remainingMs: this.activeBooster.expiresAt - Date.now()
        };
    }

    getXpMultiplier() {
        if (!this.isBoosterActive()) return 1.0;
        return 1 + (this.activeBooster.percent / 100);
    }

    // ============================================
    // 🎁 GESTION DES ITEMS
    // ============================================

    isUnlocked(itemId) {
        const item = getItemById(itemId);

        if (item && item.unlocked === true) {
            return true;
        }

        return this.unlockedItems.includes(itemId);
    }

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

        if (window.NotificationManager && window.NotificationManager.show) {
            window.NotificationManager.show(`${item.emoji} ${item.name} débloqué !`, 'success', 3000);
        }

        return true;
    }

    buyItem(itemId) {
        const item = getItemById(itemId);

        if (!item) {
            logger.error(`❌ [BoxManager] Item ${itemId} introuvable`);
            return false;
        }

        if (this.isUnlocked(itemId)) {
            logger.warn(`⚠️ [BoxManager] Item ${itemId} déjà possédé`);
            if (window.NotificationManager && window.NotificationManager.show) {
                window.NotificationManager.show('Déjà possédé !', 'error', 2000);
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
                window.NotificationManager.show(`Pas assez de coins ! (${this.coins}/${item.price})`, 'error', 2000);
            }
            return false;
        }

        this.removeCoins(item.price);
        this.unlockItem(itemId, `achat ${item.price} coins`);

        logger.log(`✅ [BoxManager] Achat réussi: ${item.name}`);
        return true;
    }

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
            if (window.applySkin) {
                window.applySkin(item);
            }
        } else if (item.type === 'background') {
            this.equippedBackground = itemId;
            logger.log(`🎨 [BoxManager] Background équipé: ${item.name}`);
            if (window.applyHubBackground) {
                window.applyHubBackground();
            }
        } else if (item.type === 'banner') {
            this.equippedBanner = itemId;
            logger.log(`🖼️ [BoxManager] Bannière équipée: ${item.name}`);
            if (window.applyHubBanner) {
                window.applyHubBanner(item);
            }
        }

        this.save();

        if (window.NotificationManager && window.NotificationManager.show) {
            window.NotificationManager.show(`${item.emoji} ${item.name} équipé !`, 'success', 2000);
        }

        return true;
    }

    getEquippedSkin() {
        return getItemById(this.equippedSkin);
    }

    getEquippedBackground() {
        return getItemById(this.equippedBackground);
    }

    getEquippedBanner() {
        return getItemById(this.equippedBanner);
    }

    // ============================================
    // 🎲 DÉBLOCAGE AUTOMATIQUE
    // ============================================

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

    openChest() {
        const roll = Math.random();

        if (roll < 0.4) {
            const amount = Math.random() < 0.7 ? 100 : 250;
            this.addCoins(amount, 'coffre quotidien');
            return { type: 'coins', value: amount };
        } else if (roll < 0.8) {
            const item = this.rollRandomItem();

            if (item) {
                this.unlockItem(item.id, 'coffre quotidien');
                return { type: 'item', value: item.id, item: item };
            } else {
                this.addBooster(25);
                return { type: 'booster', boostPercent: 25 };
            }
        } else {
            const boostPercent = Math.random() < 0.75 ? 25 : 50;
            this.addBooster(boostPercent);
            return { type: 'booster', boostPercent: boostPercent };
        }
    }

    rollRandomItem() {
        const allItems = getAllItems();
        const lockedItems = allItems.filter(item => !this.isUnlocked(item.id) && !item.unlocked);

        if (lockedItems.length === 0) {
            logger.warn('⚠️ [BoxManager] Tous les items sont déjà débloqués');
            return null;
        }

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

        const itemsOfRarity = lockedItems.filter(item => item.rarity === rolledRarity);

        if (itemsOfRarity.length === 0) {
            const randomItem = lockedItems[Math.floor(Math.random() * lockedItems.length)];
            logger.log(`🎲 [BoxManager] Aucun item ${rolledRarity}, fallback sur ${randomItem.name}`);
            return randomItem;
        }

        const randomItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
        logger.log(`🎲 [BoxManager] Item tiré: ${randomItem.name} (${rolledRarity})`);

        return randomItem;
    }

    // ============================================
    // 💾 SAUVEGARDE / CHARGEMENT
    // ============================================

    save() {
        const data = {
            coins: this.coins,
            unlockedItems: this.unlockedItems,
            equippedSkin: this.equippedSkin,
            equippedBackground: this.equippedBackground,
            equippedBanner: this.equippedBanner,
            boosters: this.boosters,
            activeBooster: this.activeBooster
        };

        localStorage.setItem('boxData', JSON.stringify(data));
    }

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
                this.boosters = data.boosters || { boost25: 0, boost50: 0 };
                this.activeBooster = data.activeBooster || null;

                logger.log(`📦 [BoxManager] Chargé: ${this.coins} coins, ${this.unlockedItems.length} items`);
            } catch (e) {
                logger.error('❌ [BoxManager] Erreur chargement:', e);
            }
        } else {
            logger.log('📦 [BoxManager] Première initialisation');
        }
    }

    reset() {
        this.coins = 0;
        this.unlockedItems = [];
        this.equippedSkin = 'classic';
        this.equippedBackground = 'default';
        this.equippedBanner = 'banner_default';
        this.boosters = { boost25: 0, boost50: 0 };
        this.activeBooster = null;
        this.save();

        logger.log('🔄 [BoxManager] Reset complet');
    }

    // ============================================
    // 📊 STATS
    // ============================================

    getCollectionStats() {
        const allItems = getAllItems();
        const total = allItems.length;
        const unlocked = allItems.filter(item => this.isUnlocked(item.id) || item.unlocked).length;
        const locked = total - unlocked;
        const percentage = Math.round((unlocked / total) * 100);

        return { total, unlocked, locked, percentage };
    }

    getUnlockedCount() {
        return this.getCollectionStats().unlocked;
    }
}

// ============================================
// FONCTIONS UI - INTERFACE UTILISATEUR
// ============================================

let currentFilter = 'all';

function openBox() {
    if (window.audio) window.audio.buttonClick();

    window.screenManager.show('box-screen');
    refreshBoxUI();

    if (window.updateBoostersDisplay) {
        window.updateBoostersDisplay();
    }

    logger.log('[BoxUI] Box ouverte');
}

function closeBox() {
    if (window.audio) window.audio.buttonClick();

    window.screenManager.show('hub');

    logger.log('[BoxUI] Box fermée');
}

function refreshBoxUI() {
    updateHeader();
    updateTabs();
    renderItems(currentFilter);
}

function updateHeader() {
    const stats = window.boxManager.getCollectionStats();

    const countEl = document.getElementById('box-count');
    const totalEl = document.getElementById('box-total');
    const percentEl = document.getElementById('box-percentage');
    const coinsEl = document.getElementById('box-coins-value');

    if (countEl) countEl.textContent = stats.unlocked;
    if (totalEl) totalEl.textContent = stats.total;
    if (percentEl) percentEl.textContent = `(${stats.percentage}%)`;
    if (coinsEl) coinsEl.textContent = window.boxManager.getCoins();
}

function updateTabs() {
    const allItems = getAllItems();
    const skins = getItemsByType('skin');
    const banners = getItemsByType('banner');
    const backgrounds = getItemsByType('background');

    const allUnlocked = allItems.filter(item =>
        window.boxManager.isUnlocked(item.id) || item.unlocked
    ).length;

    const skinsUnlocked = skins.filter(item =>
        window.boxManager.isUnlocked(item.id) || item.unlocked
    ).length;

    const bannersUnlocked = banners.filter(item =>
        window.boxManager.isUnlocked(item.id) || item.unlocked
    ).length;

    const backgroundsUnlocked = backgrounds.filter(item =>
        window.boxManager.isUnlocked(item.id) || item.unlocked
    ).length;

    const tabAll = document.getElementById('tab-count-all');
    const tabSkins = document.getElementById('tab-count-skins');
    const tabBanners = document.getElementById('tab-count-banners');
    const tabBg = document.getElementById('tab-count-backgrounds');

    if (tabAll) tabAll.textContent = `(${allUnlocked}/${allItems.length})`;
    if (tabSkins) tabSkins.textContent = `(${skinsUnlocked}/${skins.length})`;
    if (tabBanners) tabBanners.textContent = `(${bannersUnlocked}/${banners.length})`;
    if (tabBg) tabBg.textContent = `(${backgroundsUnlocked}/${backgrounds.length})`;
}

function filterBoxItems(category) {
    if (window.audio) window.audio.buttonClick();

    currentFilter = category;

    document.querySelectorAll('.box-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) activeTab.classList.add('active');

    renderItems(category);

    logger.log(`[BoxUI] Filtre changé: ${category}`);
}

function renderItems(category) {
    let items;

    if (category === 'all') {
        items = getAllItems();
    } else if (category === 'skins') {
        items = getItemsByType('skin');
    } else if (category === 'banners') {
        items = getItemsByType('banner');
    } else if (category === 'backgrounds') {
        items = getItemsByType('background');
    }

    const grid = document.getElementById('boxGrid');
    if (!grid) return;

    grid.innerHTML = '';

    items.forEach(item => {
        const card = createItemCard(item);
        grid.appendChild(card);
    });
}

function createItemCard(item) {
    const isUnlocked = window.boxManager.isUnlocked(item.id) || item.unlocked;
    const isEquipped = (item.type === 'skin' && window.boxManager.equippedSkin === item.id) ||
                       (item.type === 'background' && window.boxManager.equippedBackground === item.id) ||
                       (item.type === 'banner' && window.boxManager.equippedBanner === item.id);

    const card = document.createElement('div');
    card.className = 'box-item';

    if (isUnlocked) {
        card.classList.add('unlocked');
    } else {
        card.classList.add('locked');
        if (item.unlockType === 'coins' && item.price > 0) {
            card.classList.add('purchasable');
        }
    }

    if (isEquipped) {
        card.classList.add('equipped');
    }

    // Preview
    let previewHTML = '';
    const centerBadge = isEquipped
        ? '<div class="center-badge active">ACTIF</div>'
        : (!isUnlocked ? '<div class="center-badge lock">🔒</div>' : '');

    if (item.type === 'skin' && item.colors) {
        const canvasId = `skin-preview-${item.id}`;
        previewHTML = `
            <div class="box-item-preview ${!isUnlocked ? 'locked-preview' : ''}">
                <canvas id="${canvasId}" width="100" height="100" class="skin-preview-canvas ${!isUnlocked ? 'locked-skin' : ''}"></canvas>
                ${centerBadge}
            </div>
        `;
    } else if (item.type === 'banner' && item.image) {
        previewHTML = `
            <div class="box-item-preview banner-preview ${!isUnlocked ? 'locked-preview' : ''}">
                <img src="${item.image}" alt="${item.name}" class="banner-preview-image ${!isUnlocked ? 'locked-banner' : ''}">
                ${centerBadge}
            </div>
        `;
    } else if (item.type === 'background' && item.image) {
        previewHTML = `
            <div class="box-item-preview background-preview ${!isUnlocked ? 'locked-preview' : ''}">
                <img src="${item.image}" alt="${item.name}" class="background-preview-image ${!isUnlocked ? 'locked-background' : ''}">
                ${centerBadge}
            </div>
        `;
    } else {
        previewHTML = `
            <div class="box-item-preview default-preview">
                ${centerBadge}
            </div>
        `;
    }

    // Type label
    const typeLabels = { 'skin': 'Skin', 'background': 'Background', 'banner': 'Bannière' };

    // Info
    const infoHTML = `
        <div class="box-item-info">
            <h4 class="box-item-name">${item.name}</h4>
            <p class="box-item-type">${typeLabels[item.type] || item.type}</p>
        </div>
    `;

    // Status badge
    let statusHTML = '';
    if (isEquipped) {
        statusHTML = '<span class="status-badge equipped">⭐ Équipé</span>';
    } else if (isUnlocked) {
        statusHTML = '<span class="status-badge unlocked">✓ Possédé</span>';
    } else {
        if (item.unlockType === 'coins' && item.price > 0) {
            statusHTML = `<span class="status-badge price">💰 ${item.price}</span>`;
        } else if (item.unlockType === 'level') {
            statusHTML = `<span class="status-badge locked">Niveau ${item.unlockLevel}</span>`;
        } else if (item.unlockType === 'achievement') {
            statusHTML = '<span class="status-badge locked">Trophée</span>';
        } else if (item.unlockType === 'chest') {
            statusHTML = '<span class="status-badge locked">Coffre</span>';
        } else {
            statusHTML = '<span class="status-badge locked">Verrouillé</span>';
        }
    }

    // Button
    let buttonHTML = '';
    if (isEquipped) {
        buttonHTML = '<button class="btn-equipped" disabled>✅ Équipé</button>';
    } else if (isUnlocked) {
        buttonHTML = `<button class="btn-equip" onclick="equipBoxItem('${item.id}')">Équiper</button>`;
    } else if (item.unlockType === 'coins' && item.price > 0) {
        buttonHTML = `<button class="btn-buy" onclick="buyBoxItem('${item.id}')">Acheter</button>`;
    } else {
        buttonHTML = '<button class="btn-locked" disabled>Verrouillé</button>';
    }

    // Footer
    const footerHTML = `<div class="box-item-footer">${statusHTML}${buttonHTML}</div>`;

    card.innerHTML = previewHTML + infoHTML + footerHTML;

    // Draw skin preview after DOM insertion
    if (item.type === 'skin' && item.colors) {
        setTimeout(() => {
            const canvasId = `skin-preview-${item.id}`;
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                drawSkinPreview(ctx, item.id, 100);
            }
        }, 10);
    }

    return card;
}

function buyBoxItem(itemId) {
    if (window.audio) window.audio.buttonClick();

    const success = window.boxManager.buyItem(itemId);

    if (success) {
        refreshBoxUI();
    }
}

function equipBoxItem(itemId) {
    if (window.audio) window.audio.buttonClick();

    const success = window.boxManager.equipItem(itemId);

    if (success) {
        refreshBoxUI();
    }
}

// ============================================
// INITIALISATION GLOBALE
// ============================================

const boxManager = new BoxManager();
window.boxManager = boxManager;

// Exports globaux UI
window.openBox = openBox;
window.closeBox = closeBox;
window.filterBoxItems = filterBoxItems;
window.buyBoxItem = buyBoxItem;
window.equipBoxItem = equipBoxItem;
window.refreshBoxUI = refreshBoxUI;

logger.log('✅ BoxSystem chargé (Manager + UI)');

export {
    boxManager,
    BoxManager,
    openBox,
    closeBox,
    filterBoxItems,
    buyBoxItem,
    equipBoxItem,
    refreshBoxUI
};
