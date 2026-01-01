// ============================================
// SHOP UI MANAGER
// Interface utilisateur de la boutique
// ============================================

import { logger } from '../services/logger.js';
import { shopManager } from '../services/ShopManager.js';

// ============================================
// FONCTIONS UI
// ============================================

/**
 * Ouvre la boutique
 */
function openShop() {
    logger.log('[ShopUI] Ouverture boutique');

    // Initialiser le shop si pas fait
    if (!shopManager.initialized) {
        shopManager.init();
    }

    // Afficher l'écran
    if (window.screenManager) {
        window.screenManager.show('shop-screen');
    }

    // Mettre à jour l'UI
    updateShopUI();

    // Son
    if (window.audio?.buttonClick) {
        window.audio.buttonClick();
    }
}

/**
 * Ferme la boutique
 */
function closeShop() {
    logger.log('[ShopUI] Fermeture boutique');

    if (window.screenManager) {
        window.screenManager.show('hub');
    }

    if (window.audio?.buttonClick) {
        window.audio.buttonClick();
    }
}

/**
 * Met à jour toute l'UI de la boutique
 */
function updateShopUI() {
    updateGoldDisplay();
    renderGoldProducts();
    renderChestProducts();
    renderPremiumProducts();
}

/**
 * Met à jour l'affichage du gold
 */
function updateGoldDisplay() {
    const goldEl = document.getElementById('shop-gold-display');
    if (goldEl) {
        const gold = window.boxManager?.getCoins() || 0;
        goldEl.textContent = gold.toLocaleString();
    }
}

/**
 * Render les produits Gold
 */
function renderGoldProducts() {
    const grid = document.getElementById('shop-gold-grid');
    if (!grid) return;

    const goldProducts = shopManager.getProducts().filter(p =>
        p.reward.type === 'coins'
    );

    grid.innerHTML = goldProducts.map(product => createProductCard(product, 'gold')).join('');
}

/**
 * Render les produits Coffres
 */
function renderChestProducts() {
    const grid = document.getElementById('shop-chest-grid');
    if (!grid) return;

    const chestProducts = shopManager.getProducts().filter(p =>
        p.reward.type === 'chests'
    );

    grid.innerHTML = chestProducts.map(product => createProductCard(product, '')).join('');
}

/**
 * Render les produits Premium
 */
function renderPremiumProducts() {
    const grid = document.getElementById('shop-premium-grid');
    if (!grid) return;

    const premiumProducts = shopManager.getProducts().filter(p =>
        p.reward.type === 'no_ads' || p.reward.type === 'starter_pack'
    );

    grid.innerHTML = premiumProducts.map(product => {
        const variant = product.bestValue ? 'best-value' : 'premium';
        return createProductCard(product, variant);
    }).join('');
}

/**
 * Crée une carte produit HTML
 */
function createProductCard(product, variant = '') {
    const isPurchased = isPermanentlyPurchased(product);
    const priceClass = isPurchased ? 'purchased' : '';
    const priceText = isPurchased ? '✓ Acheté' : product.price;

    let badges = '';

    if (product.bestValue) {
        badges += '<div class="shop-item-badge">Best Value</div>';
    }

    if (product.bonus) {
        badges += `<div class="shop-item-bonus">${product.bonus}</div>`;
    }

    return `
        <div class="shop-item ${variant}" onclick="purchaseProduct('${product.id}')">
            ${badges}
            <div class="shop-item-icon">${product.icon}</div>
            <div class="shop-item-name">${product.name}</div>
            <div class="shop-item-desc">${product.description}</div>
            <button class="shop-item-price ${priceClass}" ${isPurchased ? 'disabled' : ''}>
                ${priceText}
            </button>
        </div>
    `;
}

/**
 * Vérifie si un produit non-consommable est déjà acheté
 */
function isPermanentlyPurchased(product) {
    if (product.type !== 'non_consumable') return false;

    if (product.id === 'no_ads') {
        return shopManager.hasNoAds();
    }

    if (product.id === 'starter_pack') {
        return shopManager.hasStarterPack();
    }

    return false;
}

/**
 * Lance l'achat d'un produit
 */
async function purchaseProduct(productId) {
    logger.log('[ShopUI] Achat:', productId);

    if (window.audio?.buttonClick) {
        window.audio.buttonClick();
    }

    const product = shopManager.getProduct(productId);
    if (!product) return;

    // Vérifier si déjà acheté (non-consumable)
    if (isPermanentlyPurchased(product)) {
        if (window.NotificationManager) {
            window.NotificationManager.show('Déjà acheté !', 'warning', 2000);
        }
        return;
    }

    // Lancer l'achat
    const success = await shopManager.purchase(productId);

    if (success) {
        // Mettre à jour l'UI
        updateShopUI();
    }
}

/**
 * Restaure les achats
 */
async function restorePurchases() {
    logger.log('[ShopUI] Restauration achats');

    if (window.audio?.buttonClick) {
        window.audio.buttonClick();
    }

    await shopManager.restorePurchases();
    updateShopUI();
}

// ============================================
// EXPORTS GLOBAUX
// ============================================

window.openShop = openShop;
window.closeShop = closeShop;
window.updateShopUI = updateShopUI;
window.purchaseProduct = purchaseProduct;
window.restorePurchases = restorePurchases;

logger.log('[ShopUI] Manager chargé');

export {
    openShop,
    closeShop,
    updateShopUI,
    purchaseProduct,
    restorePurchases
};
