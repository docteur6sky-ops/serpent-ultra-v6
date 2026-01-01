/**
 * BOOSTERS TAB MANAGER
 * Gère l'onglet Boosters dans la Box
 * - Affichage des boosters XP
 * - Achat de coffre premium (500 gold)
 */

import { logger } from '../services/logger.js';

// ============================================
// FONCTIONS UI BOOSTERS
// ============================================

/**
 * Met à jour l'UI de l'onglet Boosters (compteurs boosters + coffres)
 */
function updateBoostersTabUI() {
    const boosters = window.boxManager?.getBoosters() || { boost25: 0, boost50: 0 };
    const chests = window.boxManager?.getChests() || 0;
    const maxBoosters = window.boxManager?.MAX_BOOSTERS || 5;
    const maxChests = window.boxManager?.MAX_CHESTS || 5;

    const count25 = document.getElementById('booster-count-25');
    const count50 = document.getElementById('booster-count-50');

    if (count25) count25.textContent = `x${boosters.boost25}`;
    if (count50) count50.textContent = `x${boosters.boost50}`;

    // Désactiver les boutons si pas de booster
    const btn25 = document.querySelector('#booster-card-25 .btn-booster-activate');
    const btn50 = document.querySelector('#booster-card-50 .btn-booster-activate');

    if (btn25) {
        btn25.disabled = boosters.boost25 <= 0;
        btn25.classList.toggle('disabled', boosters.boost25 <= 0);
    }
    if (btn50) {
        btn50.disabled = boosters.boost50 <= 0;
        btn50.classList.toggle('disabled', boosters.boost50 <= 0);
    }

    // Mettre à jour le compteur de coffres
    updateChestsDisplay();

    logger.log(`[BoostersTab] UI mis à jour: 25%=${boosters.boost25}/${maxBoosters}, 50%=${boosters.boost50}/${maxBoosters}, coffres=${chests}/${maxChests}`);
}

/**
 * Met à jour l'affichage des coffres en stock
 */
function updateChestsDisplay() {
    const chests = window.boxManager?.getChests() || 0;
    const maxChests = window.boxManager?.MAX_CHESTS || 5;

    const countEl = document.getElementById('chest-stack-count');
    const btnOpen = document.getElementById('btn-open-chest');
    const adBtn = document.querySelector('#ad-chest-card .btn-ad-chest');

    if (countEl) countEl.textContent = `x${chests}`;

    // Activer/désactiver le bouton ouvrir
    if (btnOpen) {
        btnOpen.disabled = chests <= 0;
        btnOpen.classList.toggle('disabled', chests <= 0);
    }

    // Désactiver pub si max coffres atteint
    if (adBtn) {
        const canAdd = chests < maxChests;
        adBtn.disabled = !canAdd;
        adBtn.classList.toggle('disabled', !canAdd);
        if (!canAdd) {
            adBtn.innerHTML = '<span>Max atteint</span>';
        } else {
            adBtn.innerHTML = '<span>▶️ Regarder</span>';
        }
    }
}

/**
 * Ouvre un coffre du stock
 */
function openStackedChest() {
    if (window.audio) window.audio.buttonClick();

    if (!window.boxManager?.hasChests()) {
        if (window.NotificationManager) {
            window.NotificationManager.show('Pas de coffre en stock !', 'warning', 2000);
        }
        return;
    }

    // Utiliser le coffre
    const used = window.boxManager.useChest();
    if (!used) return;

    logger.log('[BoostersTab] Ouverture coffre du stock');

    // Fermer la Box pour lancer l'animation
    if (window.closeBox) window.closeBox();

    // Lancer l'ouverture du coffre
    setTimeout(() => {
        if (window.openChestOpening) {
            // Animation d'ouverture de coffre AAA
            window.openChestOpening(true); // true = premium style
        } else {
            // Fallback: donner directement la récompense
            giveDirectReward();
        }
    }, 300);
}

// ============================================
// COFFRE PREMIUM
// ============================================

const CHEST_PRICE = 500;

/**
 * Achète un coffre premium avec du gold
 * N'affecte pas le timer du coffre quotidien
 */
function buyPremiumChest() {
    if (window.audio) window.audio.buttonClick();

    const coins = window.boxManager?.getCoins() || 0;

    if (coins < CHEST_PRICE) {
        if (window.ModalManager) {
            window.ModalManager.info(
                `Pas assez de gold !\n\nTu as ${coins} gold.\nIl te faut ${CHEST_PRICE} gold.`,
                { title: 'Coffre Premium' }
            );
        }
        return;
    }

    // Confirmer l'achat
    if (window.ModalManager) {
        window.ModalManager.confirm(
            `Acheter un Coffre Premium pour ${CHEST_PRICE} gold ?`,
            () => executePremiumChestPurchase(),
            null,
            {
                title: 'Coffre Premium',
                confirmText: 'Acheter',
                cancelText: 'Annuler'
            }
        );
    } else {
        if (confirm(`Acheter un Coffre Premium pour ${CHEST_PRICE} gold ?`)) {
            executePremiumChestPurchase();
        }
    }
}

/**
 * Exécute l'achat du coffre premium
 */
function executePremiumChestPurchase() {
    // Retirer les coins
    const success = window.boxManager?.removeCoins(CHEST_PRICE);
    if (!success) {
        logger.warn('[BoostersTab] Échec retrait coins pour coffre premium');
        return;
    }

    logger.log(`[BoostersTab] Coffre premium acheté pour ${CHEST_PRICE} gold`);

    // Fermer la Box pour lancer l'animation
    if (window.closeBox) window.closeBox();

    // Lancer l'ouverture du coffre
    setTimeout(() => {
        if (window.chestManager && window.chestManager.openPremiumChest) {
            window.chestManager.openPremiumChest();
        } else if (window.openChestOpening) {
            // Animation d'ouverture de coffre AAA
            window.openChestOpening(true); // true = premium
        } else {
            // Fallback: donner directement la récompense
            giveDirectReward();
        }
    }, 300);
}

/**
 * Donne la récompense directement (fallback sans animation)
 */
function giveDirectReward() {
    const reward = window.boxManager?.openChest();

    if (reward && window.NotificationManager) {
        if (reward.type === 'coins') {
            window.NotificationManager.show(`+${reward.value} gold !`, 'success', 3000);
        } else if (reward.type === 'item') {
            window.NotificationManager.show(`${reward.item.name} débloqué !`, 'success', 3000);
        } else if (reward.type === 'booster') {
            window.NotificationManager.show(`Booster +${reward.boostPercent}% XP !`, 'success', 3000);
        }
    }
}

// ============================================
// EXTENSION DE filterBoxItems
// ============================================

/**
 * Étend filterBoxItems pour gérer l'onglet boosters
 * Appelé depuis BoxSystem.js
 */
function handleBoostersTab(category) {
    const boostersContent = document.getElementById('boxBoostersContent');
    const boxGrid = document.getElementById('boxGrid');

    if (category === 'boosters') {
        // Afficher le contenu boosters, cacher la grid
        if (boostersContent) boostersContent.classList.remove('hidden');
        if (boxGrid) boxGrid.classList.add('hidden');
        updateBoostersTabUI();
        return true; // Indique qu'on a géré ce cas
    } else {
        // Cacher le contenu boosters, afficher la grid
        if (boostersContent) boostersContent.classList.add('hidden');
        if (boxGrid) boxGrid.classList.remove('hidden');
        return false; // Laisser BoxSystem gérer
    }
}

// ============================================
// EXPORTS GLOBAUX
// ============================================

window.updateBoostersTabUI = updateBoostersTabUI;
window.updateChestsDisplay = updateChestsDisplay;
window.openStackedChest = openStackedChest;
window.buyPremiumChest = buyPremiumChest;
window.handleBoostersTab = handleBoostersTab;

logger.log('BoostersTabManager chargé');

export {
    updateBoostersTabUI,
    updateChestsDisplay,
    openStackedChest,
    buyPremiumChest,
    handleBoostersTab
};
