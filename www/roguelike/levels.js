/**
 * SNAKE ROGUELIKE - Définition des niveaux
 * Chaque niveau a des objectifs, obstacles et modificateurs
 */

export const ROGUELIKE_LEVELS = [
    // ========== MONDE 1 : INITIATION (Niveaux 1-3) ==========
    {
        level: 1,
        world: 1,
        name: "Éveil",
        description: "Le serpent s'éveille...",
        objective: {
            type: "apples",
            count: 8,
            timeLimit: null
        },
        obstacles: [],
        modifiers: {
            speedMultiplier: 0.9,  // Plus lent pour commencer
            appleSpawnRate: 1.0,
            powerupChance: 0.1
        },
        visualTheme: "forest",
        music: "calm"
    },
    {
        level: 2,
        world: 1,
        name: "Premiers pas",
        description: "Les murs apparaissent...",
        objective: {
            type: "apples",
            count: 12,
            timeLimit: null
        },
        obstacles: [
            { type: "wall_static", count: 3, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 0.95,
            appleSpawnRate: 1.0,
            powerupChance: 0.15
        },
        visualTheme: "forest",
        music: "calm"
    },
    {
        level: 3,
        world: 1,
        name: "Course",
        description: "Le temps presse !",
        objective: {
            type: "apples",
            count: 10,
            timeLimit: 45  // secondes
        },
        obstacles: [
            { type: "wall_static", count: 4, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.0,
            appleSpawnRate: 1.2,  // Plus de pommes pour compenser le timer
            powerupChance: 0.2
        },
        visualTheme: "forest",
        music: "tense"
    },

    // ========== MONDE 2 : DANGER (Niveaux 4-6) ==========
    {
        level: 4,
        world: 2,
        name: "Toxique",
        description: "Les crânes empoisonnés apparaissent...",
        objective: {
            type: "apples",
            count: 15,
            timeLimit: null
        },
        obstacles: [
            { type: "wall_static", count: 5, pattern: "border" },
            { type: "skull", count: 2, behavior: "static" }
        ],
        modifiers: {
            speedMultiplier: 1.0,
            appleSpawnRate: 1.0,
            powerupChance: 0.25
        },
        visualTheme: "toxic",
        music: "danger"
    },
    {
        level: 5,
        world: 2,
        name: "Labyrinthe",
        description: "Les murs forment un dédale...",
        objective: {
            type: "apples",
            count: 12,
            timeLimit: 60
        },
        obstacles: [
            { type: "wall_static", count: 12, pattern: "maze" },
            { type: "skull", count: 1, behavior: "static" }
        ],
        modifiers: {
            speedMultiplier: 1.05,
            appleSpawnRate: 0.9,
            powerupChance: 0.3
        },
        visualTheme: "toxic",
        music: "danger"
    },
    {
        level: 6,
        world: 2,
        name: "Chasseur chassé",
        description: "Les crânes se déplacent !",
        objective: {
            type: "apples",
            count: 15,
            timeLimit: null
        },
        obstacles: [
            { type: "wall_static", count: 6, pattern: "random" },
            { type: "skull", count: 2, behavior: "moving_slow" }
        ],
        modifiers: {
            speedMultiplier: 1.1,
            appleSpawnRate: 1.0,
            powerupChance: 0.35
        },
        visualTheme: "toxic",
        music: "intense"
    },

    // ========== MONDE 3 : CHAOS (Niveaux 7-9) ==========
    {
        level: 7,
        world: 3,
        name: "Frénésie",
        description: "Tout s'accélère !",
        objective: {
            type: "apples",
            count: 20,
            timeLimit: 50
        },
        obstacles: [
            { type: "wall_static", count: 8, pattern: "random" },
            { type: "skull", count: 3, behavior: "moving_slow" }
        ],
        modifiers: {
            speedMultiplier: 1.2,
            appleSpawnRate: 1.3,
            powerupChance: 0.4
        },
        visualTheme: "fire",
        music: "intense"
    },
    {
        level: 8,
        world: 3,
        name: "Enfer",
        description: "Aucun répit...",
        objective: {
            type: "apples",
            count: 18,
            timeLimit: null
        },
        obstacles: [
            { type: "wall_static", count: 10, pattern: "maze" },
            { type: "skull", count: 4, behavior: "moving_medium" },
            { type: "wall_moving", count: 2, pattern: "horizontal" }
        ],
        modifiers: {
            speedMultiplier: 1.25,
            appleSpawnRate: 1.0,
            powerupChance: 0.45
        },
        visualTheme: "fire",
        music: "boss"
    },
    {
        level: 9,
        world: 3,
        name: "Survie",
        description: "Tiens bon !",
        objective: {
            type: "survival",
            duration: 60,  // Survivre 60 secondes
            appleBonus: true  // Bonus XP par pomme mangée
        },
        obstacles: [
            { type: "wall_static", count: 8, pattern: "random" },
            { type: "skull", count: 5, behavior: "moving_medium" },
            { type: "wall_moving", count: 3, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.3,
            appleSpawnRate: 0.8,
            powerupChance: 0.5
        },
        visualTheme: "fire",
        music: "boss"
    },

    // ========== BOSS : NIVEAU 10 ==========
    {
        level: 10,
        world: 4,
        name: "NÉMÉSIS",
        description: "Face à ton destin !",
        objective: {
            type: "boss",
            bossType: "shadow_snake",  // IA agressive qui te chasse
            appleCount: 25
        },
        obstacles: [
            { type: "wall_static", count: 6, pattern: "arena" }
        ],
        modifiers: {
            speedMultiplier: 1.3,
            appleSpawnRate: 1.2,
            powerupChance: 0.6
        },
        visualTheme: "void",
        music: "boss_final",
        isBoss: true
    },

    // ========== ENDLESS (après niveau 10) ==========
    {
        level: 11,
        world: 5,
        name: "INFINI",
        description: "Plus de limite...",
        objective: {
            type: "endless",
            difficultyScale: 0.05  // +5% difficulté par niveau
        },
        obstacles: [
            { type: "dynamic", scaling: true }
        ],
        modifiers: {
            speedMultiplier: 1.35,
            appleSpawnRate: 1.0,
            powerupChance: 0.5
        },
        visualTheme: "void",
        music: "endless",
        isEndless: true
    }
];

// Monde definitions pour les visuels
export const WORLDS = {
    1: {
        name: "Forêt Ancestrale",
        color: "#2d5a27",
        background: "forest"
    },
    2: {
        name: "Marais Toxique",
        color: "#4a0e4e",
        background: "toxic"
    },
    3: {
        name: "Volcan Infernal",
        color: "#8b0000",
        background: "fire"
    },
    4: {
        name: "Le Néant",
        color: "#0a0a0a",
        background: "void"
    },
    5: {
        name: "Dimension Infinie",
        color: "#1a0a2e",
        background: "endless"
    }
};

// Patterns de murs prédéfinis
export const WALL_PATTERNS = {
    random: (count, gridSize) => {
        // Génère des positions aléatoires
        const walls = [];
        for (let i = 0; i < count; i++) {
            walls.push({
                x: Math.floor(Math.random() * (gridSize - 4)) + 2,
                y: Math.floor(Math.random() * (gridSize - 4)) + 2
            });
        }
        return walls;
    },
    border: (count, gridSize) => {
        // Murs sur les bords
        const walls = [];
        const positions = [];
        for (let i = 2; i < gridSize - 2; i++) {
            positions.push({ x: i, y: 2 });
            positions.push({ x: i, y: gridSize - 3 });
            positions.push({ x: 2, y: i });
            positions.push({ x: gridSize - 3, y: i });
        }
        // Sélectionne aléatoirement
        for (let i = 0; i < Math.min(count, positions.length); i++) {
            const idx = Math.floor(Math.random() * positions.length);
            walls.push(positions.splice(idx, 1)[0]);
        }
        return walls;
    },
    maze: (count, gridSize) => {
        // Pattern labyrinthe simple
        const walls = [];
        const spacing = Math.floor(gridSize / 5);
        for (let i = 0; i < count; i++) {
            const baseX = (i % 3) * spacing + spacing;
            const baseY = Math.floor(i / 3) * spacing + spacing;
            if (baseX < gridSize - 2 && baseY < gridSize - 2) {
                walls.push({ x: baseX, y: baseY });
            }
        }
        return walls;
    },
    arena: (count, gridSize) => {
        // Arène pour boss
        const walls = [];
        const center = Math.floor(gridSize / 2);
        const radius = Math.floor(gridSize / 3);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            walls.push({
                x: Math.floor(center + Math.cos(angle) * radius),
                y: Math.floor(center + Math.sin(angle) * radius)
            });
        }
        return walls;
    }
};

export default ROGUELIKE_LEVELS;
