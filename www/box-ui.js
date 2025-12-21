/**
 * BOX UI - Interface utilisateur pour la collection d'items
 */

import { logger } from './services/logger.js';
import { getAllItems, getItemsByType } from './data/items.js';
import { drawSkinPreview } from './SkinsRenderer.js';

let currentFilter = 'skins'; // Filtre actif (skins, banners, backgrounds)

/**
 * Ouvre l'écran Box
 */
function openBox() {
    if (window.audio) window.audio.buttonClick();

    // Afficher l'écran
    window.screenManager.show('box-screen');

    // Toujours ouvrir sur l'onglet Skins
    currentFilter = 'skins';
    document.querySelectorAll('.box-tab').forEach(tab => tab.classList.remove('active'));
    const skinsTab = document.querySelector('[data-category="skins"]');
    if (skinsTab) skinsTab.classList.add('active');

    // Rafraîchir les données
    refreshBoxUI();

    // Mettre à jour les boosters dans le header
    if (window.updateBoostersDisplay) {
        window.updateBoostersDisplay();
    }

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

    // Ordre de rareté (du moins rare au plus rare)
    const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };

    if (category === 'all') {
        items = getAllItems();
    } else if (category === 'skins') {
        items = getItemsByType('skin');
    } else if (category === 'banners') {
        items = getItemsByType('banner');
    } else if (category === 'backgrounds') {
        items = getItemsByType('background');
    }

    // Trier par rareté (legendaires en premier)
    if (items && items.length > 0) {
        items.sort((a, b) => {
            const rarityA = rarityOrder[a.rarity] ?? 99;
            const rarityB = rarityOrder[b.rarity] ?? 99;
            return rarityA - rarityB;
        });
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
        // Ajouter classe purchasable pour bordure dorée
        if (item.unlockType === 'coins' && item.price > 0) {
            card.classList.add('purchasable');
        }
    }

    if (isEquipped) {
        card.classList.add('equipped');
    }

    // Preview - toujours afficher l'aperçu (même pour les items verrouillés)
    let previewHTML = '';

    // Badge centré : ACTIF ou cadenas
    const centerBadge = isEquipped
        ? '<div class="center-badge active">ACTIF</div>'
        : (!isUnlocked ? '<div class="center-badge lock">🔒</div>' : '');

    if (item.type === 'skin' && item.colors) {
        // Skins : canvas avec aperçu du serpent
        const canvasId = `skin-preview-${item.id}`;
        previewHTML = `
            <div class="box-item-preview ${!isUnlocked ? 'locked-preview' : ''}">
                <canvas id="${canvasId}" width="180" height="180" class="skin-preview-canvas ${!isUnlocked ? 'locked-skin' : ''}"></canvas>
                ${centerBadge}
            </div>
        `;
    } else if (item.type === 'banner' && item.image) {
        // Bannières avec image
        previewHTML = `
            <div class="box-item-preview banner-preview ${!isUnlocked ? 'locked-preview' : ''}">
                <img src="${item.image}" alt="${item.name}" class="banner-preview-image ${!isUnlocked ? 'locked-banner' : ''}">
                ${centerBadge}
            </div>
        `;
    } else if (item.type === 'background' && item.image) {
        // Backgrounds avec image
        previewHTML = `
            <div class="box-item-preview background-preview ${!isUnlocked ? 'locked-preview' : ''}">
                <img src="${item.image}" alt="${item.name}" class="background-preview-image ${!isUnlocked ? 'locked-background' : ''}">
                ${centerBadge}
            </div>
        `;
    } else {
        // Bannière par défaut (sans emoji) ou autre
        previewHTML = `
            <div class="box-item-preview default-preview">
                ${centerBadge}
            </div>
        `;
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
        statusHTML = '<span class="status-badge equipped">⭐ Équipé</span>';
    } else if (isUnlocked) {
        statusHTML = '<span class="status-badge unlocked">✓ Possédé</span>';
    } else {
        // Afficher le prix ou le moyen de déblocage
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

    // Bouton - Uniformisé : Équiper ou Acheter
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

    // Footer : status + bouton groupés en bas
    const footerHTML = `<div class="box-item-footer">${statusHTML}${buttonHTML}</div>`;

    card.innerHTML = previewHTML + infoHTML + footerHTML;

    // Pour tous les skins (débloqués OU verrouillés), dessiner l'aperçu après l'ajout au DOM
    if (item.type === 'skin' && item.colors) {
        // Attendre que le canvas soit dans le DOM
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
