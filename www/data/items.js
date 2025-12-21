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
            name: 'Classique',
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
            description: 'Le snake vert classique avec yeux animés',
            roguelikeBonus: null // Pas de bonus
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
            description: 'Brûle tout sur ton passage',
            roguelikeBonus: {
                type: 'starting_upgrade',
                upgradeId: 'fire_duration',
                bonusName: 'Feu Prolongé',
                bonusDesc: 'Le power-up Feu dure 2x plus longtemps'
            }
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
            description: 'Version glacée du serpent, froid comme la glace',
            roguelikeBonus: {
                type: 'starting_upgrade',
                upgradeId: 'ice_duration',
                bonusName: 'Gel Prolongé',
                bonusDesc: 'Le power-up Glace dure 2x plus longtemps'
            }
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
            description: 'Serpent électrique ultra rapide et lumineux',
            roguelikeBonus: {
                type: 'starting_upgrade',
                upgradeId: 'lightning_duration',
                bonusName: 'Foudre Prolongée',
                bonusDesc: 'Le power-up Foudre dure 2x plus longtemps'
            }
        },

        ghost: {
            id: 'ghost',
            name: 'Fantôme',
            emoji: '👻',
            image: 'assets/skins/skin_ghost.webp',
            type: 'skin',
            rarity: 'rare',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'ghost_master',
            unlockLabel: '👻 Fantôme (traverser 20 murs)',
            colors: {
                head: { light: '#F0F0F0', dark: '#C0C0C0' },
                body: { from: '#E0E0E0', to: '#808080' },
                tail: { color: '#606060' },
                outline: '#404040',
                glow: '#FFFFFF'
            },
            description: 'Serpent spectral et mystérieux',
            roguelikeBonus: {
                type: 'starting_upgrade',
                upgradeId: 'ghost_extended',
                bonusName: 'Spectre',
                bonusDesc: 'Le power-up Ghost dure 2x plus longtemps'
            }
        },

        rock: {
            id: 'rock',
            name: 'Roche',
            emoji: '🪨',
            image: 'assets/skins/skin_rock.webp',
            type: 'skin',
            rarity: 'rare',
            unlocked: false,
            price: 1500,
            unlockType: 'coins',
            colors: {
                head: { light: '#A0826D', dark: '#8B7355' },
                body: { from: '#A0826D', to: '#6B5344' },
                tail: { color: '#5D4037' },
                outline: '#3E2723',
                glow: '#D2B48C'
            },
            description: 'Solide comme la pierre, inébranlable',
            roguelikeBonus: {
                type: 'starting_upgrade',
                upgradeId: 'rock_duration',
                bonusName: 'Roche Prolongée',
                bonusDesc: 'Le power-up Roche dure 2x plus longtemps'
            }
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
            description: 'Toutes les couleurs de l\'arc-en-ciel',
            roguelikeBonus: {
                type: 'starting_upgrades',
                upgradeIds: ['ice_duration', 'fire_duration', 'rock_duration', 'ghost_extended'],
                bonusName: 'Maître Élémentaire',
                bonusDesc: 'Tous les power-ups élémentaires durent 2x plus longtemps'
            }
        },

        diamond: {
            id: 'diamond',
            name: 'Diamant',
            emoji: '💎',
            image: 'assets/skins/skin_diamond.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'boss_flawless',
            unlockLabel: '💎 Sans Égratignure (boss parfait)',
            colors: {
                head: { light: '#E0FFFF', dark: '#B9F2FF' },
                body: { from: '#E0FFFF', to: '#00D9FF' },
                tail: { color: '#00D9FF' },
                outline: '#006688',
                glow: '#B9F2FF'
            },
            description: 'Brillant comme un diamant',
            roguelikeBonus: {
                type: 'starting_shield',
                value: 3,
                bonusName: 'Armure Cristalline',
                bonusDesc: 'Commence avec un bouclier complet (3 charges)'
            }
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
            description: 'Éclaire la nuit avec style',
            roguelikeBonus: {
                type: 'starting_upgrades',
                upgradeIds: ['xp_boost', 'xp_boost', 'xp_boost', 'xp_boost'],
                bonusName: 'Sagesse Ultime',
                bonusDesc: 'Commence avec +100% XP (Sagesse x4)'
            }
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
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'boss_speedrun',
            unlockLabel: '⚡ Speed Demon (boss < 30s)',
            effect: 'scan', // Effet spécial: lumière rouge va-et-vient
            colors: {
                head: { light: '#FF0000', dark: '#CC0000' },
                body: { from: '#FF0000', to: '#660000' },
                tail: { color: '#330000' },
                outline: '#1A0000',
                glow: '#FF0000'
            },
            description: 'Lumière rouge qui scanne de la tête à la queue',
            roguelikeBonus: {
                type: 'danger_preview',
                value: true,
                bonusName: 'Détection',
                bonusDesc: 'Les obstacles clignotent avant d\'apparaître'
            }
        },

        prismatic: {
            id: 'prismatic',
            name: 'Prismatique',
            emoji: '🔮',
            image: 'assets/skins/skin_prismatic.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 6000,
            unlockType: 'coins',
            effect: 'color-shift', // Effet spécial: change de couleur périodiquement
            colors: {
                head: { light: '#FF69B4', dark: '#FF1493' },
                body: { from: '#00FFFF', to: '#FF69B4' },
                tail: { color: '#9400D3' },
                outline: '#4B0082',
                glow: '#FF69B4'
            },
            description: 'Couleurs prismatiques changeantes',
            roguelikeBonus: {
                type: 'powerup_random',
                value: true,
                bonusName: 'Prismes',
                bonusDesc: 'Les power-ups durent +50% plus longtemps'
            }
        },

        // ============================================
        // TIER 5 - LÉGENDAIRE (10000 gold)
        // ============================================
        crown: {
            id: 'crown',
            name: 'Royal',
            emoji: '👑',
            image: 'assets/skins/skin_crown.webp',
            type: 'skin',
            rarity: 'legendary',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'runs_100',
            unlockLabel: '🏆 Légende (100 runs)',
            effect: 'crown', // Effet spécial: accessoire couronne sur la tête
            colors: {
                head: { light: '#DC143C', dark: '#8B0000' },
                body: { from: '#800080', to: '#4B0082' },
                tail: { color: '#2E0854' },
                outline: '#1A0033',
                glow: '#DC143C'
            },
            description: 'Le roi des serpents, pourpre royal',
            roguelikeBonus: {
                type: 'starting_upgrades',
                upgradeIds: ['ice_duration', 'fire_duration', 'rock_duration', 'ghost_extended', 'xp_boost', 'xp_boost', 'xp_boost', 'xp_boost'],
                bonusName: 'Royauté',
                bonusDesc: 'Rainbow + Neon : Élémentaires x2 + Sagesse x4'
            }
        },

        // ============================================
        // TIER 6 - SKINS ROGUELIKE (Achievements)
        // ============================================

        blood: {
            id: 'blood',
            name: 'Sang',
            emoji: '🩸',
            image: 'assets/skins/skin_blood.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'apples_1000',
            unlockLabel: '🥧 Insatiable (1000 pommes)',
            colors: {
                head: { light: '#DC143C', dark: '#8B0000' },
                body: { from: '#DC143C', to: '#4A0000' },
                tail: { color: '#2D0000' },
                outline: '#1A0000',
                glow: '#FF0000'
            },
            description: 'Le serpent assoiffé de sang',
            roguelikeBonus: {
                type: 'sword_damage',
                value: 6,
                bonusName: 'Soif de Sang',
                bonusDesc: 'L\'épée vole 6 segments aux boss (au lieu de 3)'
            }
        },

        void: {
            id: 'void',
            name: 'Néant',
            emoji: '🕳️',
            image: 'assets/skins/skin_void.webp',
            type: 'skin',
            rarity: 'legendary',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'world_4_clear',
            unlockLabel: '👑 Conquérant du Néant (finir le jeu)',
            effect: 'void', // Effet spécial: aura sombre
            colors: {
                head: { light: '#4B0082', dark: '#1A0033' },
                body: { from: '#4B0082', to: '#0D001A' },
                tail: { color: '#050008' },
                outline: '#000000',
                glow: '#8B00FF'
            },
            description: 'Né des ténèbres, maître du vide',
            roguelikeBonus: {
                type: 'combo',
                upgradeIds: ['ice_duration', 'fire_duration', 'rock_duration', 'ghost_extended'],
                shield: 3,
                bonusName: 'Maître du Néant',
                bonusDesc: 'Rainbow + Diamond : Élémentaires x2 + 3 boucliers'
            }
        },

        golden: {
            id: 'golden',
            name: 'Doré',
            emoji: '✨',
            image: 'assets/skins/skin_golden.webp',
            type: 'skin',
            rarity: 'legendary',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'score_100000',
            unlockLabel: '💯 Score Legend (100k points)',
            effect: 'sparkle', // Effet spécial: particules dorées
            colors: {
                head: { light: '#FFD700', dark: '#DAA520' },
                body: { from: '#FFD700', to: '#B8860B' },
                tail: { color: '#8B6914' },
                outline: '#5C4A00',
                glow: '#FFD700'
            },
            description: 'Brillant de mille feux, le serpent doré',
            roguelikeBonus: {
                type: 'starting_upgrades',
                upgradeIds: ['fortune', 'fortune', 'fortune'],
                bonusName: 'Roi Midas',
                bonusDesc: 'Fortune x3 : 30% chance de spawn gold'
            }
        },

        glitch: {
            id: 'glitch',
            name: 'Glitch',
            emoji: '📺',
            image: 'assets/skins/skin_glitch.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'runs_50',
            unlockLabel: '🎖️ Vétéran (50 runs)',
            effect: 'glitch', // Effet spécial: glitch visuel
            colors: {
                head: { light: '#00FFFF', dark: '#FF00FF' },
                body: { from: '#00FFFF', to: '#FF00FF' },
                tail: { color: '#FF0000' },
                outline: '#000000',
                glow: '#FFFFFF'
            },
            description: 'Erreur système, réalité corrompue',
            roguelikeBonus: {
                type: 'combo',
                selfCollisionImmune: true,
                extraLives: 3,
                bonusName: 'Bug Exploit',
                bonusDesc: 'Immunité auto-collision + 3 vies supplémentaires'
            }
        },

        phoenix: {
            id: 'phoenix',
            name: 'Phoenix',
            emoji: '🔥',
            image: 'assets/skins/skin_phoenix.webp',
            type: 'skin',
            rarity: 'legendary',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'boss_all',
            unlockLabel: '🎯 Chasseur Ultime (tous les boss)',
            effect: 'flame', // Effet spécial: flammes animées
            colors: {
                head: { light: '#FF4500', dark: '#FF6347' },
                body: { from: '#FF4500', to: '#FF8C00' },
                tail: { color: '#FFD700' },
                outline: '#8B0000',
                glow: '#FF4500'
            },
            description: 'Renaît de ses cendres, immortel',
            roguelikeBonus: {
                type: 'extra_lives',
                value: 3,
                bonusName: 'Renaissance',
                bonusDesc: 'Commence avec 3 vies supplémentaires'
            }
        },

        cyber: {
            id: 'cyber',
            name: 'Cyber',
            emoji: '🤖',
            image: 'assets/skins/skin_cyber.webp',
            type: 'skin',
            rarity: 'epic',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'endless_25',
            unlockLabel: '♾️ Sans Limites (niveau 25)',
            effect: 'circuit', // Effet spécial: circuits lumineux
            colors: {
                head: { light: '#00BFFF', dark: '#0080FF' },
                body: { from: '#00BFFF', to: '#003366' },
                tail: { color: '#001A33' },
                outline: '#00FFFF',
                glow: '#00BFFF'
            },
            description: 'Technologie avancée, circuits lumineux',
            roguelikeBonus: {
                type: 'self_collision_immune',
                value: true,
                bonusName: 'Firewall',
                bonusDesc: 'Immunité à l\'auto-collision (peut traverser sa queue)'
            }
        },

        spectral: {
            id: 'spectral',
            name: 'Spectral',
            emoji: '💀',
            image: 'assets/skins/skin_spectral.webp',
            type: 'skin',
            rarity: 'legendary',
            unlocked: false,
            price: 0,
            unlockType: 'achievement',
            unlockAchievement: 'endless_30',
            unlockLabel: '⭐ Immortel (niveau 30)',
            effect: 'ethereal', // Effet spécial: translucide fantomatique
            colors: {
                head: { light: 'rgba(200, 200, 255, 0.8)', dark: 'rgba(150, 150, 200, 0.7)' },
                body: { from: 'rgba(180, 180, 220, 0.6)', to: 'rgba(100, 100, 150, 0.4)' },
                tail: { color: 'rgba(80, 80, 120, 0.3)' },
                outline: 'rgba(255, 255, 255, 0.5)',
                glow: '#AAAAFF'
            },
            description: 'Entre les mondes, ni vivant ni mort',
            roguelikeBonus: {
                type: 'ultimate',
                selfCollisionImmune: true,
                extraLives: 3,
                shield: 3,
                upgradeIds: ['ice_duration', 'fire_duration', 'rock_duration', 'ghost_extended', 'xp_boost', 'xp_boost', 'xp_boost', 'xp_boost'],
                bonusName: 'Transcendance',
                bonusDesc: 'ULTIME : Neon + Phoenix + Diamond + Rainbow + Immunité'
            }
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
