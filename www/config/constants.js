// ============================================
// CONSTANTES DE JEU
// Configuration globale du jeu Snake Ultra
// ============================================

// ============================================
// CONFIGURATION SERVEUR
// ============================================
export const SERVER_CONFIG = {
    // URL de production - À MODIFIER avant publication sur Play Store
    PRODUCTION_URL: 'wss://railway-up-production-b439.up.railway.app',

    // URL de développement local
    DEV_URL: 'ws://localhost:3000',

    // Activer le mode production (mettre à true avant publication)
    USE_PRODUCTION: true
};

export const CONFIG = {
    GRID_SIZE: 30,           // 30x30 = plus d'espace de jeu
    CANVAS_SIZE: 540,        // Canvas agrandi pour garder cases lisibles
    CELL_SIZE: 540 / 30,     // 18px par case (vs 12px avant)
    ANIMATION_DELAY: 300,
    MAX_SAVED_SCORES: 3,
    SLOW_DURATION: 10000,
    DOUBLE_DURATION: 15000,
    INVINCIBLE_DURATION: 8000,
    POWERUP_SPAWN_CHANCE: 0.35,
    OBSTACLE_SPAWN_INTERVAL: 5,
    BAD_SPAWN_INTERVAL: 3
};

export const DIFFICULTY = {
    EASY: 0,
    NORMAL: 1,
    HARD: 2
};

export const DIFFICULTY_NAMES = ['😊 Facile', '😮 Normal', '😈 Difficile'];
export const DIFFICULTY_ICONS = ['😊', '😮', '😈'];
export const MEDALS = ['🥇', '🥈', '🥉'];

export const KEYS = {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    SPACE: ' ',
    PAUSE: 'p'
};

export const COLORS = {
    GOLD: '#D4AF37',
    SNAKE: '#00FF87',
    FOOD: '#FFD700',
    BAD: '#FF1744',
    BG_DARK: '#0f0f23',
    BG_LIGHT: '#1a1a2e',
    TEXT_LIGHT: '#C0C0C0',
    BORDER: '#d8d800ff'
};

// ============================================
// SYSTÈME DE POWER-UPS V2 - Effets offensifs
// ============================================
export const POWERUP_EFFECTS = {
    fire: {
        id: 'fire',
        icon: '🔥',
        color: '#FF5722',
        duration: 6000,
        passive: {
            type: 'UNLIMITED_BOOST',
            boostSpeed: 125 // Vitesse boost (ms) - x2
        },
        onContact: {
            burnSegments: 1,      // Détruit 1 segment ennemi (pas volé)
            stealSegments: 0,
            debuff: null
        }
    },
    lightning: {
        id: 'lightning',
        icon: '⚡',
        color: '#FFD700',
        duration: 6000,
        passive: {
            type: 'SELF_INVERTED_CONTROLS' // Le joueur a ses contrôles inversés
        },
        onContact: {
            burnSegments: 0,
            stealSegments: 1,     // Vole 1 segment
            debuff: {
                type: 'INVERTED_CONTROLS',
                duration: 6000    // Ennemi inversé 6s
            }
        }
    },
    ice: {
        id: 'ice',
        icon: '❄️',
        color: '#00FFFF',
        duration: 6000,
        passive: null,
        onContact: {
            burnSegments: 0,
            stealSegments: 0,
            debuff: {
                type: 'SLOWED',
                speedMultiplier: 0.5, // 50% vitesse
                duration: 3000        // 3 secondes
            }
        }
    },
    rock: {
        id: 'rock',
        icon: '🪨',
        color: '#D2691E',
        duration: 6000,
        passive: {
            type: 'INVINCIBLE',
            immuneToSteal: true,
            immuneToPowerupSteal: true
        },
        onContact: {
            burnSegments: 0,
            stealSegments: 0,
            debuff: null
        }
    },
    ghost: {
        id: 'ghost',
        icon: '👻',
        color: '#FFFFFF',
        duration: 6000,
        passive: {
            type: 'PHASE_THROUGH',
            throughWalls: true,
            throughEnemy: true
        },
        onContact: {
            burnSegments: 0,
            stealSegments: 1,
            stealEnemyPowerup: true, // Vole le power-up stocké
            debuff: null
        },
        exceptions: {
            vsRock: { stealSegments: 0, stealEnemyPowerup: false }
        }
    },
    sword: {
        id: 'sword',
        icon: '⚔️',
        color: '#DC143C',
        duration: 6000,
        passive: null,
        onContact: {
            burnSegments: 0,
            stealSegments: 2,     // Vole 2 segments
            debuff: null
        }
    }
};

// Types de débuffs
export const DEBUFF_TYPES = {
    SLOWED: 'SLOWED',
    INVERTED_CONTROLS: 'INVERTED_CONTROLS'
};

// ============================================
// COULEURS DES POWER-UPS (centralisées)
// ============================================
export const POWERUP_SKIN_COLORS = {
    fire: {
        head: { light: '#FF5722', dark: '#E64A19' },
        body: { from: '#FF5722', to: '#BF360C' },
        tail: { color: '#BF360C' },
        outline: '#D84315',
        glow: '#FF5722'
    },
    ghost: {
        head: { light: '#FFFFFF', dark: '#CCCCCC' },
        body: { from: '#FFFFFF', to: '#999999' },
        tail: { color: '#999999' },
        outline: '#666666',
        glow: '#FFFFFF'
    },
    rock: {
        head: { light: '#D2B48C', dark: '#A0826D' },
        body: { from: '#D2B48C', to: '#8B7355' },
        tail: { color: '#8B7355' },
        outline: '#654321',
        glow: '#D2B48C'
    },
    lightning: {
        head: { light: '#FFD700', dark: '#FFC107' },
        body: { from: '#FFD700', to: '#FF9800' },
        tail: { color: '#FF9800' },
        outline: '#F57F17',
        glow: '#FFD700'
    },
    ice: {
        head: { light: '#5DC1F9', dark: '#42A5F5' },
        body: { from: '#5DC1F9', to: '#1976D2' },
        tail: { color: '#1976D2' },
        outline: '#0D47A1',
        glow: '#5DC1F9'
    },
    sword: {
        head: { light: '#DC143C', dark: '#B22222' },
        body: { from: '#DC143C', to: '#8B0000' },
        tail: { color: '#8B0000' },
        outline: '#660000',
        glow: '#DC143C'
    },
    slowed: {
        head: { light: '#00A5A5', dark: '#008080' },
        body: { from: '#00A5A5', to: '#006666' },
        tail: { color: '#006666' },
        outline: '#003333',
        glow: '#00A5A5'
    },
    invertedControls: {
        head: { light: '#FFD700', dark: '#FFA000' },
        body: { from: '#FFD700', to: '#FF6F00' },
        tail: { color: '#FF6F00' },
        outline: '#E65100',
        glow: '#FFD700'
    },
    aiDefault: {
        head: { light: '#FF6B6B', dark: '#CC3636' },
        body: { from: '#FF6B6B', to: '#CC3636' },
        tail: { color: '#CC3636' },
        outline: '#8B0000',
        glow: '#FF6B6B'
    }
};
