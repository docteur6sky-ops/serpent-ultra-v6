/**
 * BOX UI - Interface utilisateur pour la collection d'items
 */

import { logger } from './services/logger.js';
import { getAllItems, getItemsByType } from './data/items.js';
import { drawSkinPreview } from './SkinsRenderer.js';

let currentFilter = 'all'; // Filtre actif (all, skins, backgrounds)

/**
 * Ouvre l'écran Box
 */
function openBox() {
    if (window.audio) window.audio.buttonClick();

    // Afficher l'écran
    window.screenManager.show('box-screen');

    // Rafraîchir les données
    refreshBoxUI();

    logger.log('[BoxUI] Box ouverte');
}

/**
 * Ferme l'écran Box
 */
function closeBox() {
    if (window.audio) window.audio.buttonClick();

    // Retourner au hub
    window.screenManager.show('hub');

    logger.log('[BoxUI] Box fermée');
}

/**
 * Rafraîchit toute l'UI de la Box
 */
function refreshBoxUI() {
    updateHeader();
    updateTabs();
    renderItems(currentFilter);
    updateFooter();
}

/**
 * Met à jour le header (progression + coins)
 */
function updateHeader() {
    const stats = window.boxManager.getCollectionStats();

    document.getElementById('box-count').textContent = stats.unlocked;
    document.getElementById('box-total').textContent = stats.total;
    document.getElementById('box-percentage').textContent = `(${stats.percentage}%)`;

    document.getElementById('box-coins-value').textContent = window.boxManager.getCoins();
}

/**
 * Met à jour les compteurs des tabs
 */
function updateTabs() {
    const allItems = getAllItems();
    const skins = getItemsByType('skin');
    const banners = getItemsByType('banner');
    const backgrounds = getItemsByType('background');

    // Compter les items débloqués par catégorie
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

    // Mettre à jour les compteurs
    document.getElementById('tab-count-all').textContent = `(${allUnlocked}/${allItems.length})`;
    document.getElementById('tab-count-skins').textContent = `(${skinsUnlocked}/${skins.length})`;
    document.getElementById('tab-count-banners').textContent = `(${bannersUnlocked}/${banners.length})`;
    document.getElementById('tab-count-backgrounds').textContent = `(${backgroundsUnlocked}/${backgrounds.length})`;
}

/**
 * Met à jour le footer (stats)
 */
function updateFooter() {
    const stats = window.boxManager.getCollectionStats();

    document.getElementById('box-stat-unlocked').textContent = stats.unlocked;
    document.getElementById('box-stat-locked').textContent = stats.locked;
    document.getElementById('box-stat-percentage').textContent = `${stats.percentage}%`;
}

/**
 * Filtre les items par catégorie
 * @param {string} category - 'all', 'skins', 'banners', ou 'backgrounds'
 */
function filterBoxItems(category) {
    if (window.audio) window.audio.buttonClick();

    currentFilter = category;

    // Mettre à jour les tabs actifs
    document.querySelectorAll('.box-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');

    // Rafraîchir la grid
    renderItems(category);

    logger.log(`[BoxUI] Filtre changé: ${category}`);
}

/**
 * Rend tous les items dans la grid selon le filtre
 * @param {string} category - Catégorie à afficher
 */
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
    grid.innerHTML = ''; // Vider la grid

    // Générer les cartes d'items
    items.forEach(item => {
        const card = createItemCard(item);
        grid.appendChild(card);
    });
}

/**
 * Crée une carte d'item
 * @param {object} item - Données de l'item
 * @returns {HTMLElement} Carte HTML
 */
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
    }

    if (isEquipped) {
        card.classList.add('equipped');
    }

    // Preview
    let previewHTML = '';
    if (isUnlocked) {
        // Pour les skins, afficher un canvas avec l'aperçu du serpent
        if (item.type === 'skin' && item.colors) {
            const canvasId = `skin-preview-${item.id}`;
            previewHTML = `
                <div class="box-item-preview">
                    <canvas id="${canvasId}" width="100" height="100" class="skin-preview-canvas"></canvas>
                    ${isEquipped ? '<div class="equipped-badge">⭐ ACTIF</div>' : ''}
                </div>
            `;
        } else if (item.type === 'banner' && item.image) {
            // Pour les bannières avec image, afficher une miniature
            previewHTML = `
                <div class="box-item-preview banner-preview">
                    <img src="${item.image}" alt="${item.name}" class="banner-preview-image">
                    ${isEquipped ? '<div class="equipped-badge">⭐ ACTIF</div>' : ''}
                </div>
            `;
        } else if (item.type === 'background' && item.image) {
            // Pour les backgrounds avec image, afficher une miniature
            previewHTML = `
                <div class="box-item-preview background-preview">
                    <img src="${item.image}" alt="${item.name}" class="background-preview-image">
                    ${isEquipped ? '<div class="equipped-badge">⭐ ACTIF</div>' : ''}
                </div>
            `;
        } else {
            // Pour les autres (bannière par défaut), utiliser l'emoji
            previewHTML = `
                <div class="box-item-preview">
                    <div class="box-item-emoji">${item.emoji}</div>
                    ${isEquipped ? '<div class="equipped-badge">⭐ ACTIF</div>' : ''}
                </div>
            `;
        }
    } else {
        // Pour les items verrouillés, afficher une preview floue
        if (item.type === 'banner' && item.image) {
            previewHTML = `
                <div class="box-item-preview locked-preview banner-preview">
                    <img src="${item.image}" alt="${item.name}" class="banner-preview-image locked-banner">
                    <div class="lock-icon">🔒</div>
                </div>
            `;
        } else if (item.type === 'background' && item.image) {
            previewHTML = `
                <div class="box-item-preview locked-preview background-preview">
                    <img src="${item.image}" alt="${item.name}" class="background-preview-image locked-background">
                    <div class="lock-icon">🔒</div>
                </div>
            `;
        } else {
            previewHTML = `
                <div class="box-item-preview locked-preview">
                    <div class="lock-icon">🔒</div>
                </div>
            `;
        }
    }

    // Type label
    const typeLabels = {
        'skin': 'Skin',
        'background': 'Background',
        'banner': 'Bannière'
    };

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
        statusHTML = '<div class="box-item-status"><span class="status-badge equipped">⭐ Équipé</span></div>';
    } else if (isUnlocked) {
        statusHTML = '<div class="box-item-status"><span class="status-badge unlocked">✓ Possédé</span></div>';
    } else {
        // Afficher le prix ou le moyen de déblocage
        let priceText = '';
        if (item.unlockType === 'coins' && item.price > 0) {
            priceText = `💰 ${item.price}`;
        } else if (item.unlockType === 'level') {
            priceText = `Niveau ${item.unlockLevel}`;
        } else if (item.unlockType === 'achievement') {
            priceText = 'Trophée';
        } else if (item.unlockType === 'chest') {
            priceText = 'Coffre';
        }
        statusHTML = `<div class="box-item-status"><span class="status-badge locked">${priceText}</span></div>`;
    }

    // Bouton
    let buttonHTML = '';
    if (isEquipped) {
        buttonHTML = '<button class="btn-equipped" disabled>✅ Actif</button>';
    } else if (isUnlocked) {
        buttonHTML = `<button class="btn-equip" onclick="equipBoxItem('${item.id}')">✅ Équiper</button>`;
    } else if (item.unlockType === 'coins' && item.price > 0) {
        buttonHTML = `<button class="btn-buy" onclick="buyBoxItem('${item.id}')">🛒 Acheter</button>`;
    } else {
        buttonHTML = '<button class="btn-equipped" disabled>🔒 Verrouillé</button>';
    }

    card.innerHTML = previewHTML + infoHTML + statusHTML + buttonHTML;

    // Si c'est un skin débloqué, dessiner l'aperçu après l'ajout au DOM
    if (isUnlocked && item.type === 'skin' && item.colors) {
        // Attendre que le canvas soit dans le DOM
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

/**
 * Achète un item
 * @param {string} itemId - ID de l'item à acheter
 */
function buyBoxItem(itemId) {
    if (window.audio) window.audio.buttonClick();

    const success = window.boxManager.buyItem(itemId);

    if (success) {
        // Rafraîchir l'UI
        refreshBoxUI();
    }
}

/**
 * Équipe un item
 * @param {string} itemId - ID de l'item à équiper
 */
function equipBoxItem(itemId) {
    if (window.audio) window.audio.buttonClick();

    const success = window.boxManager.equipItem(itemId);

    if (success) {
        // Rafraîchir l'UI
        refreshBoxUI();
    }
}

// ============================================
// EXPORTS GLOBAUX
// ============================================

window.openBox = openBox;
window.closeBox = closeBox;
window.filterBoxItems = filterBoxItems;
window.buyBoxItem = buyBoxItem;
window.equipBoxItem = equipBoxItem;
window.refreshBoxUI = refreshBoxUI;

logger.log('✅ BoxUI chargé');

export { openBox, closeBox, filterBoxItems, buyBoxItem, equipBoxItem, refreshBoxUI };
