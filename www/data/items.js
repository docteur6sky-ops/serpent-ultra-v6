/**
 * ITEMS.JS - Base de données des items déblocables
 *
 * Types d'items :
 * - skins : Apparence du snake (couleurs, gradients)
 * - backgrounds : Fonds d'écran pendant les parties
 *
 * Déblocage :
 * - coins : Achetable avec la monnaie virtuelle
 * - level : Déblocage automatique à un certain niveau
 * - achievement : Déblocage via trophée/achievement
 * - chest : Peut être obtenu dans le coffre quotidien
 */

export const ITEMS = {
    // ============================================
    // 🐍 SKINS DU SNAKE
    // ============================================

    skins: {
        // ============================================
        // TIER 1 - COMMUN (Gratuit)
        // ============================================
        classic: {
            id: 'classic',
            name: 'Snake Classique',
            emoji: '🐍',
            image: 'assets/skins/skin_classic.webp',
            type: 'skin',
            rarity: 'common',
            unlocked: true, // Débloqué par défaut
            equipped: true,  // Équipé par défaut
            price: 0,
            colors: {
                head: { light: '#00FF87', dark: '#00AA55' },
                body: { from: '#00FF87', to: '#006633' },
                tail: { color: '#006633' },
                outline: '#004422',
                glow: '#00FF87'
            },
            description: 'Le snake vert classique avec yeux animés'
        },

        // ============================================
        // TIER 2 - PEU COMMUN (1500 gold)
        // ============================================
        fire: {
            id: 'fire',
            name: 'Feu',
            emoji: '🔥',
            image: 'assets/skins/skin_fire.webp',
            type: 'skin',
            rarity: 'rare',
            unlocked: false,
            price: 1500,
            unlockType: 'coins',
            colors: {
                head: { light: '#FF6347', dark: '#FF4500' },
                body: { from: '#FF6347', to: '#8B0000' },
                tail: { color: '#8B0000' },
                outline: '#4B0000',
                glow: '#FF4500'
            },
            description: 'Brûle tout sur ton passage'
        },

        ice: {
            id: 'ice',
            name: 'Ice Cube',
            emoji: '🧊',
            image: 'assets/skins/skin_ice.webp',
            type: 'skin',
            rarity: 'rare',
            unlocked: false,
            price: 1500,
            unlockType: 'coins',
            colors: {
                head: { light: '#B0E0FF', dark: '#4DB8FF' },
                body: { from: '#B0E0FF', to: '#1E90FF' },
                tail: { color: '#1E90FF' },
                outline: '#003D66',
                glow: '#00FFFF'
            },
            description: 'Version glacée du serpent, froid comme la glace'
        },

        lightning: {
            id: 'lightning',
            name: 'Foudre',
            emoji: '⚡',
            image: 'assets/skins/skin_lightning.webp',
            type: 'skin',
            rarity: 'rare',
            unlocked: false,
            price: 1500,
            unlockType: 'coins',
            colors: {
                head: { light: '#FFFF00', dark: '#FFD700' },
                body: { from: '#FFFF00', to: '#FF8C00' },
                tail: { color: '#FF8C00' },
                outline: '#664400',
                glow: '#FFFF00'
            },
            description: 'Serpent électrique ultra rapide et lumineux'
        },

        ghost: {
            id: 'ghost',
            name: 'Fantôme',
            emoji: '👻',
            image: 'assets/skins/skin_ghost.webp',
            type: 'skin',
            rarity: 'rare',
            unlocked: false,
            price: 1500,
            unlockType: 'coins',
            colors: {
                head: { light: '#F0F0F0', dark: '#C0C0C0' },
                body: { from: '#E0E0E0', to: '#808080' },
                tail: { color: '#606060' },
                outline: '#404040',
                glow: '#FFFFFF'
            },
            description: 'Serpent spectral et mystérieux'
        },

        // ============================================
        // TIER 3 - RARE (2500 gold)
        // ============================================
        rainbow: {
            id: 'rainbow',
            name: 'Arc-en-ciel',
            emoji: '🌈',
            image: 'assets/skins/skin_rainbow.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 2500,
            unlockType: 'coins',
            colors: {
                head: { light: '#FF0000', dark: '#FF7F00' },
                body: { from: '#FFFF00', to: '#0000FF' },
                tail: { color: '#9400D3' },
                outline: '#4B0082',
                glow: '#00FF00'
            },
            description: 'Toutes les couleurs de l\'arc-en-ciel'
        },

        diamond: {
            id: 'diamond',
            name: 'Diamant',
            emoji: '💎',
            image: 'assets/skins/skin_diamond.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 2500,
            unlockType: 'coins',
            colors: {
                head: { light: '#E0FFFF', dark: '#B9F2FF' },
                body: { from: '#E0FFFF', to: '#00D9FF' },
                tail: { color: '#00D9FF' },
                outline: '#006688',
                glow: '#B9F2FF'
            },
            description: 'Brillant comme un diamant'
        },

        neon: {
            id: 'neon',
            name: 'Néon',
            emoji: '💡',
            image: 'assets/skins/skin_neon.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 2500,
            unlockType: 'coins',
            colors: {
                head: { light: '#FF00FF', dark: '#CC00CC' },
                body: { from: '#FF00FF', to: '#00FFFF' },
                tail: { color: '#00FFFF' },
                outline: '#660066',
                glow: '#FF00FF'
            },
            description: 'Éclaire la nuit avec style'
        },

        // ============================================
        // TIER 4 - ÉPIQUE (6000 gold)
        // ============================================
        scanner: {
            id: 'scanner',
            name: 'Scanner',
            emoji: '📡',
            image: 'assets/skins/skin_scanner.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 6000,
            unlockType: 'coins',
            effect: 'scan', // Effet spécial: lumière rouge va-et-vient
            colors: {
                head: { light: '#FF0000', dark: '#CC0000' },
                body: { from: '#FF0000', to: '#660000' },
                tail: { color: '#330000' },
                outline: '#1A0000',
                glow: '#FF0000'
            },
            description: 'Lumière rouge qui scanne de la tête à la queue'
        },

        chameleon: {
            id: 'chameleon',
            name: 'Caméléon',
            emoji: '🦎',
            image: 'assets/skins/skin_chameleon.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 6000,
            unlockType: 'coins',
            effect: 'color-shift', // Effet spécial: change de couleur périodiquement
            colors: {
                head: { light: '#7FFF00', dark: '#32CD32' },
                body: { from: '#7FFF00', to: '#228B22' },
                tail: { color: '#006400' },
                outline: '#003300',
                glow: '#7FFF00'
            },
            description: 'Change de couleur périodiquement'
        },

        // ============================================
        // TIER 5 - LÉGENDAIRE (10000 gold)
        // ============================================
        crown: {
            id: 'crown',
            name: 'Couronne',
            emoji: '👑',
            image: 'assets/skins/skin_crown.webp',
            type: 'skin',
            rarity: 'legendary',
            unlocked: false,
            price: 10000,
            unlockType: 'coins',
            effect: 'crown', // Effet spécial: accessoire couronne sur la tête
            colors: {
                head: { light: '#FFD700', dark: '#FFA500' },
                body: { from: '#FFD700', to: '#B8860B' },
                tail: { color: '#8B6914' },
                outline: '#654321',
                glow: '#FFD700'
            },
            description: 'Le roi des serpents avec sa couronne royale'
        }
    },

    // ============================================
    // 🎨 BACKGROUNDS (Élémentaires)
    // ============================================

    backgrounds: {
        // Background par défaut (gratuit)
        default: {
            id: 'default',
            name: 'Défaut',
            emoji: '🌃',
            image: 'assets/backgrounds/backgrounds_generique.webp',
            type: 'background',
            rarity: 'common',
            unlocked: true,
            equipped: true,
            price: 0,
            bgType: 'image',
            bgValue: 'assets/backgrounds/backgrounds_generique.webp',
            description: 'Le fond classique'
        },

        // Backgrounds élémentaires (achetables indépendamment des bannières)
        bg_ice: {
            id: 'bg_ice',
            name: 'Glace',
            emoji: '❄️',
            image: 'assets/backgrounds/backgrounds_glace_hub.webp',
            type: 'background',
            rarity: 'rare',
            unlocked: false,
            price: 500,
            unlockType: 'coins',
            bgType: 'image',
            bgValue: 'assets/backgrounds/backgrounds_glace_hub.webp',
            description: 'Ambiance glaciale'
        },

        bg_fire: {
            id: 'bg_fire',
            name: 'Feu',
            emoji: '🔥',
            image: 'assets/backgrounds/backgrounds_feu_hub.webp',
            type: 'background',
            rarity: 'rare',
            unlocked: false,
            price: 500,
            unlockType: 'coins',
            bgType: 'image',
            bgValue: 'assets/backgrounds/backgrounds_feu_hub.webp',
            description: 'Ambiance enflammée'
        },

        bg_lightning: {
            id: 'bg_lightning',
            name: 'Foudre',
            emoji: '⚡',
            image: 'assets/backgrounds/backgrounds_foudre_hub.webp',
            type: 'background',
            rarity: 'epic',
            unlocked: false,
            price: 800,
            unlockType: 'coins',
            bgType: 'image',
            bgValue: 'assets/backgrounds/backgrounds_foudre_hub.webp',
            description: 'Ambiance électrique'
        },

        bg_rock: {
            id: 'bg_rock',
            name: 'Roche',
            emoji: '🪨',
            image: 'assets/backgrounds/backgrounds_roche_hub.webp',
            type: 'background',
            rarity: 'epic',
            unlocked: false,
            price: 800,
            unlockType: 'coins',
            bgType: 'image',
            bgValue: 'assets/backgrounds/backgrounds_roche_hub.webp',
            description: 'Ambiance minérale'
        }
    },

    // ============================================
    // 🖼️ BANNIÈRES DU HUB
    // ============================================

    banners: {
        // Bannière par défaut (gratuite)
        banner_default: {
            id: 'banner_default',
            name: 'Défaut',
            emoji: '🎨',
            type: 'banner',
            rarity: 'common',
            unlocked: true,
            equipped: true,
            price: 0,
            image: null, // Gradient CSS par défaut
            description: 'Bannière par défaut avec gradient'
        },

        // Bannières achetables
        banner_ice: {
            id: 'banner_ice',
            name: 'Glace',
            emoji: '❄️',
            type: 'banner',
            rarity: 'rare',
            unlocked: false,
            price: 1000,
            unlockType: 'coins',
            image: 'assets/banners/banniere_glace.webp',
            description: 'Bannière glaciale aux reflets bleutés'
        },

        banner_fire: {
            id: 'banner_fire',
            name: 'Feu',
            emoji: '🔥',
            type: 'banner',
            rarity: 'rare',
            unlocked: false,
            price: 1000,
            unlockType: 'coins',
            image: 'assets/banners/banniere_feu.webp',
            description: 'Bannière enflammée aux couleurs ardentes'
        },

        banner_lightning: {
            id: 'banner_lightning',
            name: 'Foudre',
            emoji: '⚡',
            type: 'banner',
            rarity: 'epic',
            unlocked: false,
            price: 1000,
            unlockType: 'coins',
            image: 'assets/banners/banniere_foudre.webp',
            description: 'Bannière électrique chargée d\'énergie'
        },

        banner_rock: {
            id: 'banner_rock',
            name: 'Roche',
            emoji: '🪨',
            type: 'banner',
            rarity: 'epic',
            unlocked: false,
            price: 1000,
            unlockType: 'coins',
            image: 'assets/banners/banniere_roche.webp',
            description: 'Bannière minérale aux textures rocheuses'
        }
    }
};

/**
 * Rareté des items (pour le coffre)
 */
export const RARITY = {
    common: {
        name: 'Commun',
        color: '#FFFFFF',
        dropRate: 0.6 // 60%
    },
    rare: {
        name: 'Rare',
        color: '#00D9FF',
        dropRate: 0.25 // 25%
    },
    epic: {
        name: 'Épique',
        color: '#9400D3',
        dropRate: 0.12 // 12%
    },
    legendary: {
        name: 'Légendaire',
        color: '#FFD700',
        dropRate: 0.03 // 3%
    }
};

/**
 * Récupère tous les items (skins + backgrounds + banners)
 * @returns {Array} Liste de tous les items
 */
export function getAllItems() {
    const allItems = [];

    Object.values(ITEMS.skins).forEach(skin => allItems.push(skin));
    Object.values(ITEMS.backgrounds).forEach(bg => allItems.push(bg));
    Object.values(ITEMS.banners).forEach(banner => allItems.push(banner));

    return allItems;
}

/**
 * Récupère un item par son ID
 * @param {string} itemId - ID de l'item
 * @returns {object|null} Item trouvé ou null
 */
export function getItemById(itemId) {
    if (ITEMS.skins[itemId]) return ITEMS.skins[itemId];
    if (ITEMS.backgrounds[itemId]) return ITEMS.backgrounds[itemId];
    if (ITEMS.banners[itemId]) return ITEMS.banners[itemId];
    return null;
}

/**
 * Filtre les items par type
 * @param {string} type - 'skin' ou 'background'
 * @returns {Array} Items du type demandé
 */
export function getItemsByType(type) {
    return getAllItems().filter(item => item.type === type);
}

/**
 * Filtre les items par rareté
 * @param {string} rarity - 'common', 'rare', 'epic', 'legendary'
 * @returns {Array} Items de la rareté demandée
 */
export function getItemsByRarity(rarity) {
    return getAllItems().filter(item => item.rarity === rarity);
}
