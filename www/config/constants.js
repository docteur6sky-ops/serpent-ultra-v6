// ============================================
// CONSTANTES DE JEU
// Configuration globale du jeu Snake Ultra
// ============================================

// ============================================
// CONFIGURATION SERVEUR
// ============================================
export const SERVER_CONFIG = {
    // URL de production - À MODIFIER avant publication sur Play Store
    PRODUCTION_URL: 'wss://votre-serveur.com',

    // URL de développement local
    DEV_URL: 'ws://localhost:3000',

    // Activer le mode production (mettre à true avant publication)
    USE_PRODUCTION: false
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
    POWERUP_SPAWN_CHANCE: 0.25,
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
// COULEURS DES POWER-UPS (centralisées)
// ============================================
export const POWERUP_SKIN_COLORS = {
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
    slowed: {
        head: { light: '#00A5A5', dark: '#008080' },
        body: { from: '#00A5A5', to: '#006666' },
        tail: { color: '#006666' },
        outline: '#003333',
        glow: '#00A5A5'
    },
    aiDefault: {
        head: { light: '#FF6B6B', dark: '#CC3636' },
        body: { from: '#FF6B6B', to: '#CC3636' },
        tail: { color: '#CC3636' },
        outline: '#8B0000',
        glow: '#FF6B6B'
    }
};
