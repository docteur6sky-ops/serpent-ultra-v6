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
import { save, load } from './services/storage.js';
import { ITEMS, getAllItems, getItemById, getItemsByType, RARITY } from './data/items.js';
import { drawSkinPreview } from './SkinsRenderer.js';
import { achievementManager } from './roguelike/achievements.js';
import { SnakeUltra } from './SnakeUltra.js';

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

    unlockItem(itemId, reason = 'unknown', showAnimation = true) {
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

        // ⚠️ Ne pas afficher d'overlay pendant une run roguelike active (bloque le jeu)
        const isRoguelikeRunning = window.roguelikeManager?.isRunActive &&
                                   window.soloGame?.running;

        // Animation de déblocage pour les skins (épique et légendaire)
        // Sauf si une partie roguelike est en cours
        if (showAnimation && item.type === 'skin' && (item.rarity === 'epic' || item.rarity === 'legendary')) {
            if (isRoguelikeRunning) {
                // Pendant roguelike : notification simple sans overlay bloquant
                if (window.NotificationManager && window.NotificationManager.show) {
                    window.NotificationManager.show(`${item.emoji} ${item.name} débloqué !`, 'success', 3000);
                }
                logger.log(`🎁 [BoxManager] Skin unlock overlay différé (roguelike en cours)`);
            } else if (window.showSkinUnlockNotification) {
                window.showSkinUnlockNotification(item);
            }
        } else if (window.NotificationManager && window.NotificationManager.show) {
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

    checkAchievementUnlocks(achievementId = null) {
        const allItems = getAllItems();

        allItems.forEach(item => {
            if (item.unlockType === 'achievement' && item.unlockAchievement) {
                // Vérifier si l'achievement spécifique est débloqué
                const isAchievementUnlocked = achievementManager &&
                    achievementManager.isUnlocked(item.unlockAchievement);

                if (isAchievementUnlocked && !this.isUnlocked(item.id)) {
                    this.unlockItem(item.id, `achievement ${item.unlockAchievement}`);
                }
            }
        });
    }

    // Vérification globale de tous les achievements pour déblocage
    syncWithAchievements() {
        if (!achievementManager) {
            logger.warn('⚠️ [BoxManager] AchievementManager non disponible');
            return;
        }

        const allItems = getAllItems();
        let newUnlocks = 0;

        allItems.forEach(item => {
            if (item.unlockType === 'achievement' && item.unlockAchievement) {
                const isAchievementUnlocked = achievementManager.isUnlocked(item.unlockAchievement);

                if (isAchievementUnlocked && !this.isUnlocked(item.id)) {
                    this.unlockItem(item.id, `sync achievement ${item.unlockAchievement}`);
                    newUnlocks++;
                }
            }
        });

        if (newUnlocks > 0) {
            logger.log(`🔓 [BoxManager] ${newUnlocks} skin(s) débloqué(s) via achievements`);
        }

        return newUnlocks;
    }

    // Vérifie si un achievement est débloqué (pour l'UI)
    isAchievementUnlocked(achievementId) {
        if (!achievementManager) return false;
        return achievementManager.isUnlocked(achievementId);
    }

    // Récupère la progression d'un achievement
    getAchievementProgress(achievementId) {
        if (!achievementManager) return null;

        const stats = achievementManager.getStats();
        const achievement = achievementManager.getAll().find(a => a.id === achievementId);

        if (!achievement) return null;

        const condition = achievement.condition;
        let current = 0;
        let target = condition.value;

        switch (condition.type) {
            case 'total_runs':
                current = stats.totalRuns;
                break;
            case 'level_complete':
                current = stats.maxLevelReached;
                break;
            case 'boss_killed':
                current = stats.bossesKilled;
                break;
            case 'boss_flawless':
                current = stats.bossFlawlessKills;
                break;
            case 'boss_speedrun':
                current = stats.bossSpeedrunKills;
                break;
            case 'total_apples':
                current = stats.totalApples;
                break;
            case 'score_run':
                current = stats.bestScore;
                break;
            case 'walls_ghosted':
                current = stats.wallsGhosted;
                break;
            case 'specific_boss':
                current = stats.bossesKilledByName[condition.value] ? 1 : 0;
                target = 1;
                break;
            case 'all_bosses':
                current = Object.keys(stats.bossesKilledByName).length;
                break;
            default:
                return null;
        }

        return {
            current: Math.min(current, target),
            target: target,
            percent: Math.min(100, Math.round((current / target) * 100))
        };
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

        // Utiliser storage.js pour bénéficier de la protection SecurityManager
        save('boxData', data);
    }

    load() {
        // Utiliser storage.js pour bénéficier de la protection SecurityManager
        const data = load('boxData', null);

        if (data) {
            this.coins = data.coins || 0;
            this.unlockedItems = data.unlockedItems || [];
            this.equippedSkin = data.equippedSkin || 'classic';
            this.equippedBackground = data.equippedBackground || 'default';
            this.equippedBanner = data.equippedBanner || 'banner_default';
            this.boosters = data.boosters || { boost25: 0, boost50: 0 };
            this.activeBooster = data.activeBooster || null;

            logger.log(`📦 [BoxManager] Chargé: ${this.coins} coins, ${this.unlockedItems.length} items`);
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

let currentFilter = 'skins';

function openBox() {
    if (window.audio) window.audio.buttonClick();

    // ✅ Nettoyer tout modal résiduel qui pourrait bloquer les interactions
    const chestModal = document.getElementById('chest-modal');
    const skinOverlay = document.querySelector('.skin-unlock-overlay');
    const skinNotification = document.querySelector('.skin-unlock-notification');
    const confetti = document.querySelector('.confetti-overlay');
    if (chestModal) chestModal.remove();
    if (skinOverlay) skinOverlay.remove();
    if (skinNotification) skinNotification.remove();
    if (confetti) confetti.remove();

    // Synchroniser les achievements avant d'afficher
    if (window.boxManager.syncWithAchievements) {
        window.boxManager.syncWithAchievements();
    }

    // Toujours ouvrir sur l'onglet Skins
    currentFilter = 'skins';
    document.querySelectorAll('.box-tab').forEach(tab => tab.classList.remove('active'));
    const skinsTab = document.querySelector('[data-category="skins"]');
    if (skinsTab) skinsTab.classList.add('active');

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
    updateBoxBackground();
    renderItems(currentFilter);
}

/**
 * Met à jour le background de la Box avec le background équipé
 */
function updateBoxBackground() {
    const bgImage = document.getElementById('box-bg-image');
    if (!bgImage) return;

    const equippedBgId = window.boxManager.equippedBackground;
    const bgItem = getItemById(equippedBgId);

    if (bgItem && bgItem.image) {
        bgImage.src = bgItem.image;
    } else {
        // Background par défaut
        bgImage.src = 'assets/backgrounds/backgrounds_generique.webp';
    }
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

    // Ordre de rareté (du moins rare au plus rare)
    const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
    const rarityNames = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };
    const rarityColors = { common: '#AAAAAA', rare: '#00D9FF', epic: '#9400D3', legendary: '#FFD700' };

    if (category === 'all') {
        items = getAllItems();
    } else if (category === 'skins') {
        items = getItemsByType('skin');
    } else if (category === 'banners') {
        items = getItemsByType('banner');
    } else if (category === 'backgrounds') {
        items = getItemsByType('background');
    }

    // Trier par rareté (common → legendary)
    if (items && items.length > 0) {
        items.sort((a, b) => {
            const rarityA = rarityOrder[a.rarity] ?? 99;
            const rarityB = rarityOrder[b.rarity] ?? 99;
            return rarityA - rarityB;
        });
    }

    const grid = document.getElementById('boxGrid');
    if (!grid) return;

    grid.innerHTML = '';

    // Grouper par rareté et ajouter des séparateurs
    let currentRarity = null;
    items.forEach(item => {
        // Ajouter un séparateur si nouvelle rareté
        if (item.rarity !== currentRarity) {
            currentRarity = item.rarity;
            const separator = document.createElement('div');
            separator.className = 'rarity-separator';
            separator.innerHTML = `
                <div class="rarity-line"></div>
                <span class="rarity-label" style="color: ${rarityColors[currentRarity] || '#FFF'}">${rarityNames[currentRarity] || currentRarity}</span>
                <div class="rarity-line"></div>
            `;
            grid.appendChild(separator);
        }
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

    // 🎨 Classe de rareté AAA
    if (item.rarity) {
        card.classList.add(`rarity-${item.rarity}`);
    }

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

    // Badge de rareté - DÉSACTIVÉ (plus besoin)
    const rarityBadge = '';

    // Preview
    let previewHTML = '';
    const centerBadge = isEquipped
        ? '<div class="center-badge active">ACTIF</div>'
        : (!isUnlocked ? '<div class="center-badge lock">🔒</div>' : '');

    if (item.type === 'skin' && item.colors) {
        const canvasId = `skin-preview-${item.id}`;
        previewHTML = `
            <div class="box-item-preview ${!isUnlocked ? 'locked-preview' : ''}">
                ${rarityBadge}
                <canvas id="${canvasId}" width="180" height="180" class="skin-preview-canvas ${!isUnlocked ? 'locked-skin' : ''}"></canvas>
                ${centerBadge}
            </div>
        `;
    } else if (item.type === 'banner' && item.image) {
        previewHTML = `
            <div class="box-item-preview fullsize-preview banner-preview ${!isUnlocked ? 'locked-preview' : ''}">
                <img src="${item.image}" alt="${item.name}" class="banner-preview-image ${!isUnlocked ? 'locked-banner' : ''}">
                ${centerBadge}
            </div>
        `;
    } else if (item.type === 'background' && item.image) {
        previewHTML = `
            <div class="box-item-preview fullsize-preview background-preview ${!isUnlocked ? 'locked-preview' : ''}">
                <img src="${item.image}" alt="${item.name}" class="background-preview-image ${!isUnlocked ? 'locked-background' : ''}">
                ${centerBadge}
            </div>
        `;
    } else {
        previewHTML = `
            <div class="box-item-preview default-preview">
                ${rarityBadge}
                ${centerBadge}
            </div>
        `;
    }

    // Type label
    const typeLabels = { 'skin': 'Skin', 'background': 'Background', 'banner': 'Bannière' };

    // Bouton info pour tous les skins (bonus roguelike + conditions de déblocage)
    let infoBtnHTML = '';
    if (item.type === 'skin') {
        infoBtnHTML = `
            <button class="skin-info-btn" onclick="window.showSkinBonusInfo('${item.id}', event); return false;" title="Informations">
                <span class="info-icon">ℹ️</span>
            </button>
        `;
    }

    // Info
    const infoHTML = `
        <div class="box-item-info">
            <div class="box-item-header">
                <h4 class="box-item-name">${item.emoji} ${item.name}</h4>
                ${infoBtnHTML}
            </div>
            <p class="box-item-type">${typeLabels[item.type] || item.type}</p>
        </div>
    `;

    // Status badge (uniquement pour level/chest - achievement a son propre bouton)
    let statusHTML = '';

    if (!isEquipped && !isUnlocked) {
        if (item.unlockType === 'level') {
            statusHTML = `<span class="status-badge level">🎮 Niveau ${item.unlockLevel}</span>`;
        } else if (item.unlockType === 'chest') {
            statusHTML = '<span class="status-badge chest">🎁 Coffre</span>';
        } else if (item.unlockType !== 'coins' && item.unlockType !== 'achievement') {
            statusHTML = '<span class="status-badge locked">🔒 Verrouillé</span>';
        }
    }

    // Button - tout fusionné en un seul bouton
    let buttonHTML = '';
    if (isEquipped) {
        buttonHTML = '<button class="btn-equipped" disabled>⭐ Équipé</button>';
    } else if (isUnlocked) {
        buttonHTML = `<button class="btn-equip" onclick="equipBoxItem('${item.id}')">Équiper</button>`;
    } else if (item.unlockType === 'coins' && item.price > 0) {
        const canAfford = window.boxManager.getCoins() >= item.price;
        buttonHTML = `<button class="btn-buy ${!canAfford ? 'cant-afford' : ''}" onclick="buyBoxItem('${item.id}')" ${!canAfford ? 'title="Pas assez de coins"' : ''}>💰 ${item.price}</button>`;
    } else if (item.unlockType === 'achievement') {
        // Vérifier si l'achievement est accompli
        const isAchievementDone = achievementManager && achievementManager.isUnlocked(item.unlockAchievement);
        if (isAchievementDone) {
            // Achievement accompli → bouton Déverrouiller
            buttonHTML = `<button class="btn-unlock-ready" onclick="unlockAchievementItem('${item.id}')">🔓 Déverrouiller</button>`;
        } else {
            // Achievement pas encore accompli → bouton Trophées
            buttonHTML = `<button class="btn-trophy" onclick="window.showTrophiesOverlay()">🏆 Trophées</button>`;
        }
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
                drawSkinPreview(ctx, item.id, 180);
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

/**
 * Débloque un item dont l'achievement est accompli
 */
function unlockAchievementItem(itemId) {
    if (window.audio) window.audio.buttonClick();

    const item = getItemById(itemId);
    if (!item) return;

    // Vérifier que l'achievement est bien accompli
    if (item.unlockType === 'achievement' && achievementManager) {
        const isAchievementDone = achievementManager.isUnlocked(item.unlockAchievement);
        if (isAchievementDone) {
            // Débloquer l'item
            window.boxManager.unlockItem(itemId);
            refreshBoxUI();
        }
    }
}

// ============================================
// INITIALISATION GLOBALE
// ============================================

const boxManager = new BoxManager();
window.boxManager = boxManager;

// Enregistrer dans SnakeUltra
SnakeUltra.registerManager('box', boxManager);

// Exports globaux UI
window.openBox = openBox;
window.closeBox = closeBox;
window.filterBoxItems = filterBoxItems;
window.buyBoxItem = buyBoxItem;
window.equipBoxItem = equipBoxItem;
window.unlockAchievementItem = unlockAchievementItem;
window.refreshBoxUI = refreshBoxUI;

// ============================================
// MODAL BONUS SKIN ROGUELIKE
// ============================================

/**
 * Affiche une popup avec les infos du skin (bonus roguelike + conditions de déblocage)
 */
function showSkinBonusInfo(skinId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    // Fermer toute popup existante
    closeSkinBonusInfo();

    const skin = getItemById(skinId);
    if (!skin) return;

    const bonus = skin.roguelikeBonus;
    const isUnlocked = window.boxManager?.isUnlocked(skinId) || skin.unlocked;

    // Trouver la carte parent
    const btn = event.target.closest('.skin-info-btn');
    const card = btn?.closest('.box-item');
    if (!card) return;

    // Construire le contenu de la popup
    let popupContent = `
        <div class="popup-header">
            <span class="popup-emoji">${skin.emoji}</span>
            <h4 class="popup-title">${skin.name}</h4>
        </div>
    `;

    // Condition de déblocage (si pas encore débloqué)
    if (!isUnlocked && skin.unlockType === 'achievement' && skin.unlockLabel) {
        popupContent += `
            <div class="popup-unlock-section">
                <div class="popup-unlock-title">🔓 Condition</div>
                <div class="popup-unlock-desc">${skin.unlockLabel}</div>
            </div>
        `;
    }

    // Bonus roguelike (si existe)
    if (bonus) {
        popupContent += `
            <div class="popup-bonus-section">
                <div class="popup-bonus-name">✨ ${bonus.bonusName}</div>
                <div class="popup-bonus-desc">${bonus.bonusDesc}</div>
                <div class="popup-footer">Roguelike uniquement</div>
            </div>
        `;
    }

    // Description du skin
    if (skin.description) {
        popupContent += `<div class="popup-description">${skin.description}</div>`;
    }

    // Créer la popup
    const popup = document.createElement('div');
    popup.className = 'skin-bonus-popup';
    popup.id = 'skinBonusPopup';
    popup.innerHTML = popupContent;

    card.appendChild(popup);

    // Fermer en cliquant ailleurs
    setTimeout(() => {
        document.addEventListener('click', closeSkinBonusInfoOnClick);
    }, 10);
}

function closeSkinBonusInfoOnClick(e) {
    const popup = document.getElementById('skinBonusPopup');
    if (popup && !popup.contains(e.target) && !e.target.closest('.skin-info-btn')) {
        closeSkinBonusInfo();
    }
}

/**
 * Ferme la popup de bonus skin
 */
function closeSkinBonusInfo() {
    const popup = document.getElementById('skinBonusPopup');
    if (popup) {
        popup.remove();
    }
    document.removeEventListener('click', closeSkinBonusInfoOnClick);
}

window.showSkinBonusInfo = showSkinBonusInfo;
window.closeSkinBonusInfo = closeSkinBonusInfo;

// ============================================
// ANIMATION DE DÉBLOCAGE
// ============================================

function showSkinUnlockNotification(item) {
    // Supprimer tout overlay résiduel avant d'en créer un nouveau
    const existingOverlay = document.querySelector('.skin-unlock-overlay');
    const existingNotification = document.querySelector('.skin-unlock-notification');
    if (existingOverlay) existingOverlay.remove();
    if (existingNotification) existingNotification.remove();

    // Créer l'overlay de fond
    const overlay = document.createElement('div');
    overlay.className = 'skin-unlock-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9998;
    `;
    // Cliquer sur l'overlay ferme la notification
    overlay.onclick = () => closeSkinUnlockNotification();

    // Créer la notification
    const notification = document.createElement('div');
    notification.className = 'skin-unlock-notification';
    notification.innerHTML = `
        <div class="unlock-icon">${item.emoji}</div>
        <div class="unlock-title">🎉 Nouveau Skin Débloqué !</div>
        <div class="unlock-name">${item.name}</div>
        <div class="unlock-rarity" style="color: ${getRarityColor(item.rarity)}; margin-bottom: 1rem;">
            ${getRarityName(item.rarity)}
        </div>
        <button class="unlock-close" onclick="closeSkinUnlockNotification()">Super !</button>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(notification);

    // Jouer un son si disponible
    if (window.audio && window.audio.chestOpen) {
        window.audio.chestOpen();
    }

    // Créer des confettis
    createConfetti();
}

function closeSkinUnlockNotification() {
    const notification = document.querySelector('.skin-unlock-notification');
    const overlay = document.querySelector('.skin-unlock-overlay');
    const confetti = document.querySelector('.confetti-overlay');

    if (notification) notification.remove();
    if (overlay) overlay.remove();
    if (confetti) confetti.remove();

    if (window.audio) window.audio.buttonClick();
}

function getRarityColor(rarity) {
    const colors = {
        common: '#CCCCCC',
        rare: '#00D9FF',
        epic: '#DA70D6',
        legendary: '#FFD700'
    };
    return colors[rarity] || '#FFFFFF';
}

function getRarityName(rarity) {
    const names = {
        common: 'Commun',
        rare: 'Rare',
        epic: 'Épique',
        legendary: 'Légendaire'
    };
    return names[rarity] || rarity;
}

function createConfetti() {
    const overlay = document.createElement('div');
    overlay.className = 'confetti-overlay';

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -20px;
            opacity: ${Math.random() * 0.5 + 0.5};
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        overlay.appendChild(confetti);
    }

    // Ajouter l'animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confettiFall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Supprimer après l'animation
    setTimeout(() => {
        overlay.remove();
        style.remove();
    }, 4000);
}

// Exports pour l'animation
window.showSkinUnlockNotification = showSkinUnlockNotification;
window.closeSkinUnlockNotification = closeSkinUnlockNotification;

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
