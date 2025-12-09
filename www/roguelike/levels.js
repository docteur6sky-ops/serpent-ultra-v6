/**
 * SNAKE ROGUELIKE - Définition des niveaux
 *
 * Structure:
 * - Stage 1-4: 5 pommes chacun
 * - Stage 5: BOSS (120s, 15 segments)
 * - Stage 6-9: 10 pommes chacun
 * - Stage 10: BOSS (90s, 20 segments)
 * - Stage 11-14: 15 pommes chacun
 * - Stage 15: BOSS (75s, 25 segments)
 * - Stage 16-19: 20 pommes chacun
 * - Stage 20: BOSS FINAL (60s, 30 segments) - FIN DU JEU
 */

export const ROGUELIKE_LEVELS = [
    // ========== STAGES 1-4 : INITIATION (5 pommes) ==========
    {
        level: 1,
        world: 1,
        name: "Éveil",
        description: "Le serpent s'éveille...",
        objective: { type: "apples", count: 5 },
        obstacles: [],
        modifiers: {
            speedMultiplier: 1.5,
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
        objective: { type: "apples", count: 5 },
        obstacles: [
            { type: "wall_static", count: 2, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.32,
            appleSpawnRate: 1.0,
            powerupChance: 0.15
        },
        visualTheme: "forest",
        music: "calm"
    },
    {
        level: 3,
        world: 1,
        name: "Progression",
        description: "Continue ton chemin...",
        objective: { type: "apples", count: 5 },
        obstacles: [
            { type: "wall_static", count: 3, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.34,
            appleSpawnRate: 1.0,
            powerupChance: 0.15
        },
        visualTheme: "forest",
        music: "calm"
    },
    {
        level: 4,
        world: 1,
        name: "Préparation",
        description: "Le boss approche...",
        objective: { type: "apples", count: 5 },
        obstacles: [
            { type: "wall_static", count: 4, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.36,
            appleSpawnRate: 1.0,
            powerupChance: 0.2
        },
        visualTheme: "forest",
        music: "tense"
    },

    // ========== STAGE 5 : BOSS 1 - TITAN ==========
    {
        level: 5,
        world: 1,
        name: "TITAN",
        description: "Évite ses murs !",
        objective: {
            type: "boss",
            bossSegments: 15,
            timeLimit: 240  // 4 minutes
        },
        obstacles: [
            { type: "wall_static", count: 4, pattern: "arena" }
        ],
        modifiers: {
            speedMultiplier: 1.3,
            appleSpawnRate: 1.2,
            powerupChance: 0.4
        },
        visualTheme: "forest",
        music: "boss",
        isBoss: true,
        bossSpeed: 0.7,
        bossAggression: 0.3,
        bossMoveInterval: 280,
        bossGraceDelay: 2,
        // PHASES DU TITAN (Boss murs - tutoriel)
        bossPhases: [
            {
                name: "Éveil",
                threshold: 1.0,    // 100% -> 50% HP
                aggression: 0.3,
                speedMultiplier: 1.0,
                behavior: "wall_spawn",
                color: "#8B4513",
                special: {
                    type: "wall_spawn",
                    wallCount: 1,          // 1 mur par spawn
                    wallDuration: 8,       // 8 secondes
                    spawnInterval: 5000    // Toutes les 5 secondes
                }
            },
            {
                name: "Forteresse",
                threshold: 0.5,    // 50% -> 25% HP
                aggression: 0.5,
                speedMultiplier: 1.2,
                behavior: "wall_spawn",
                color: "#A0522D",
                special: {
                    type: "wall_spawn",
                    wallCount: 2,          // 2 murs par spawn
                    wallDuration: 7,
                    spawnInterval: 4000    // Toutes les 4 secondes
                }
            },
            {
                name: "Citadelle",
                threshold: 0.25,   // 25% -> 0% HP
                aggression: 0.7,
                speedMultiplier: 1.4,
                behavior: "wall_spawn",
                color: "#CD853F",
                special: {
                    type: "wall_spawn",
                    wallCount: 3,          // 3 murs par spawn
                    wallDuration: 6,
                    spawnInterval: 3000    // Toutes les 3 secondes
                }
            }
        ]
    },

    // ========== STAGES 6-9 : DANGER (10 pommes) ==========
    {
        level: 6,
        world: 2,
        name: "Toxique",
        description: "L'air devient lourd...",
        objective: { type: "apples", count: 10 },
        obstacles: [
            { type: "wall_static", count: 4, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.4,
            appleSpawnRate: 1.0,
            powerupChance: 0.2
        },
        visualTheme: "toxic",
        music: "danger"
    },
    {
        level: 7,
        world: 2,
        name: "Marécage",
        description: "Attention aux pièges...",
        objective: { type: "apples", count: 10 },
        obstacles: [
            { type: "wall_static", count: 5, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.42,
            appleSpawnRate: 1.0,
            powerupChance: 0.25
        },
        visualTheme: "toxic",
        music: "danger"
    },
    {
        level: 8,
        world: 2,
        name: "Labyrinthe",
        description: "Ne te perds pas...",
        objective: { type: "apples", count: 10 },
        obstacles: [
            { type: "wall_static", count: 8, pattern: "maze" }
        ],
        modifiers: {
            speedMultiplier: 1.44,
            appleSpawnRate: 1.0,
            powerupChance: 0.25
        },
        visualTheme: "toxic",
        music: "danger"
    },
    {
        level: 9,
        world: 2,
        name: "Embuscade",
        description: "Le boss approche...",
        objective: { type: "apples", count: 10 },
        obstacles: [
            { type: "wall_static", count: 6, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.46,
            appleSpawnRate: 1.0,
            powerupChance: 0.3
        },
        visualTheme: "toxic",
        music: "tense"
    },

    // ========== STAGE 10 : BOSS 2 - ICE ==========
    {
        level: 10,
        world: 2,
        name: "CRYO",
        description: "Évite le gel !",
        objective: {
            type: "boss",
            bossSegments: 20,
            timeLimit: 180  // 3 minutes
        },
        obstacles: [
            { type: "wall_static", count: 5, pattern: "arena" }
        ],
        modifiers: {
            speedMultiplier: 1.4,
            appleSpawnRate: 1.2,
            powerupChance: 0.45
        },
        visualTheme: "toxic",
        music: "boss",
        isBoss: true,
        bossSpeed: 0.85,
        bossAggression: 0.5,
        bossMoveInterval: 240,
        bossGraceDelay: 2,
        // PHASES DE CRYO (Boss glace - zones gelées)
        bossPhases: [
            {
                name: "Frimas",
                threshold: 1.0,
                aggression: 0.5,
                speedMultiplier: 1.0,
                behavior: "ice_zone",
                color: "#00BFFF",
                special: {
                    type: "ice_zone",
                    zoneCount: 1,          // 1 zone par spawn
                    zoneRadius: 2,         // Rayon de 2 cases
                    zoneDuration: 6,       // 6 secondes
                    spawnInterval: 5000,   // Toutes les 5 secondes
                    slowFactor: 0.5        // Ralentit de 50%
                }
            },
            {
                name: "Blizzard",
                threshold: 0.5,
                aggression: 0.65,
                speedMultiplier: 1.15,
                behavior: "ice_zone",
                color: "#00CED1",
                special: {
                    type: "ice_zone",
                    zoneCount: 2,          // 2 zones par spawn
                    zoneRadius: 2,
                    zoneDuration: 7,
                    spawnInterval: 4000,
                    slowFactor: 0.5
                }
            },
            {
                name: "Glaciation",
                threshold: 0.25,
                aggression: 0.8,
                speedMultiplier: 1.3,
                behavior: "ice_zone",
                color: "#E0FFFF",
                special: {
                    type: "ice_zone",
                    zoneCount: 3,          // 3 zones par spawn
                    zoneRadius: 3,         // Rayon plus grand
                    zoneDuration: 8,
                    spawnInterval: 3000,
                    slowFactor: 0.4        // Ralentit encore plus
                }
            }
        ]
    },

    // ========== STAGES 11-14 : CHAOS (15 pommes) ==========
    {
        level: 11,
        world: 3,
        name: "Fournaise",
        description: "La chaleur monte...",
        objective: { type: "apples", count: 15 },
        obstacles: [
            { type: "wall_static", count: 6, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.5,
            appleSpawnRate: 1.0,
            powerupChance: 0.3
        },
        visualTheme: "fire",
        music: "intense"
    },
    {
        level: 12,
        world: 3,
        name: "Eruption",
        description: "Évite les coulées...",
        objective: { type: "apples", count: 15 },
        obstacles: [
            { type: "wall_static", count: 7, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.52,
            appleSpawnRate: 1.0,
            powerupChance: 0.3
        },
        visualTheme: "fire",
        music: "intense"
    },
    {
        level: 13,
        world: 3,
        name: "Brasier",
        description: "Tout brûle...",
        objective: { type: "apples", count: 15 },
        obstacles: [
            { type: "wall_static", count: 8, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.54,
            appleSpawnRate: 1.0,
            powerupChance: 0.35
        },
        visualTheme: "fire",
        music: "intense"
    },
    {
        level: 14,
        world: 3,
        name: "Inferno",
        description: "Le boss approche...",
        objective: { type: "apples", count: 15 },
        obstacles: [
            { type: "wall_static", count: 8, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.56,
            appleSpawnRate: 1.0,
            powerupChance: 0.35
        },
        visualTheme: "fire",
        music: "tense"
    },

    // ========== STAGE 15 : BOSS 3 - GHOST ==========
    {
        level: 15,
        world: 3,
        name: "SPECTRE",
        description: "Attention aux crânes !",
        objective: {
            type: "boss",
            bossSegments: 25,
            timeLimit: 150  // 2 min 30
        },
        obstacles: [
            { type: "wall_static", count: 6, pattern: "arena" }
        ],
        modifiers: {
            speedMultiplier: 1.5,
            appleSpawnRate: 1.2,
            powerupChance: 0.5
        },
        visualTheme: "fire",
        music: "boss",
        isBoss: true,
        bossSpeed: 1.0,
        bossAggression: 0.7,
        bossMoveInterval: 200,
        bossGraceDelay: 2,
        // PHASES DU SPECTRE (Boss fantôme - skulls + invisibilité)
        bossPhases: [
            {
                name: "Ombre",
                threshold: 1.0,
                aggression: 0.6,
                speedMultiplier: 1.0,
                behavior: "skull_spawn",
                color: "#9932CC",
                special: {
                    type: "skull_spawn",
                    skullCount: 1,         // 1 skull par spawn
                    skullDuration: 8,      // 8 secondes
                    spawnInterval: 4000,   // Toutes les 4 secondes
                    skullDamage: 1         // Perd 1 segment
                }
            },
            {
                name: "Fantôme",
                threshold: 0.5,
                aggression: 0.75,
                speedMultiplier: 1.1,
                behavior: "skull_invisible",
                color: "#BA55D3",
                special: {
                    type: "skull_invisible",
                    skullCount: 2,         // 2 skulls par spawn
                    skullDuration: 7,
                    spawnInterval: 3500,
                    invisibleDuration: 3,  // Invisible 3 secondes
                    invisibleInterval: 6000 // Toutes les 6 secondes
                }
            },
            {
                name: "Néant",
                threshold: 0.25,
                aggression: 0.9,
                speedMultiplier: 1.3,
                behavior: "skull_invisible",
                color: "#DDA0DD",
                special: {
                    type: "skull_invisible",
                    skullCount: 3,         // 3 skulls par spawn
                    skullDuration: 6,
                    spawnInterval: 3000,
                    invisibleDuration: 4,  // Invisible 4 secondes
                    invisibleInterval: 4000 // Plus souvent invisible
                }
            }
        ]
    },

    // ========== STAGES 16-19 : NÉANT (20 pommes) ==========
    {
        level: 16,
        world: 4,
        name: "Vide",
        description: "Le néant t'appelle...",
        objective: { type: "apples", count: 20 },
        obstacles: [
            { type: "wall_static", count: 8, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.6,
            appleSpawnRate: 1.0,
            powerupChance: 0.35
        },
        visualTheme: "void",
        music: "intense"
    },
    {
        level: 17,
        world: 4,
        name: "Abîme",
        description: "Ne regarde pas en bas...",
        objective: { type: "apples", count: 20 },
        obstacles: [
            { type: "wall_static", count: 9, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.62,
            appleSpawnRate: 1.0,
            powerupChance: 0.35
        },
        visualTheme: "void",
        music: "intense"
    },
    {
        level: 18,
        world: 4,
        name: "Oubli",
        description: "Qui es-tu ?",
        objective: { type: "apples", count: 20 },
        obstacles: [
            { type: "wall_static", count: 10, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.64,
            appleSpawnRate: 1.0,
            powerupChance: 0.4
        },
        visualTheme: "void",
        music: "intense"
    },
    {
        level: 19,
        world: 4,
        name: "Destin",
        description: "Le boss final approche...",
        objective: { type: "apples", count: 20 },
        obstacles: [
            { type: "wall_static", count: 10, pattern: "random" }
        ],
        modifiers: {
            speedMultiplier: 1.66,
            appleSpawnRate: 1.0,
            powerupChance: 0.4
        },
        visualTheme: "void",
        music: "tense"
    },

    // ========== STAGE 20 : BOSS FINAL - PORTAILS DE TÉLÉPORTATION ==========
    {
        level: 20,
        world: 4,
        name: "FOUDRE",
        description: "Évite les portails !",
        objective: {
            type: "boss",
            bossSegments: 30,
            timeLimit: 180  // 3 minutes
        },
        obstacles: [
            { type: "wall_static", count: 4, pattern: "arena" }
        ],
        modifiers: {
            speedMultiplier: 1.4,      // Réduit de 1.6 à 1.4
            appleSpawnRate: 1.2,
            powerupChance: 0.6
        },
        visualTheme: "void",
        music: "boss_final",
        isBoss: true,
        isFinalBoss: true,
        bossSpeed: 1.0,                // Réduit de 1.2 à 1.0 (moins rapide)
        bossAggression: 0.8,           // Réduit de 0.9 à 0.8
        bossMoveInterval: 200,         // Augmenté de 160 à 200 (plus lent)
        bossGraceDelay: 3,
        // PHASES DE FOUDRE (Boss final - portails de téléportation)
        bossPhases: [
            {
                name: "Distorsion",
                threshold: 1.0,
                aggression: 0.6,
                speedMultiplier: 1.0,
                behavior: "teleport_zone",
                color: "#FFD700",
                special: {
                    type: "teleport_zone",
                    portalCount: 2,        // 2 portails à la fois
                    portalDuration: 10,    // Durée de vie 10 secondes
                    spawnInterval: 5000    // Spawn toutes les 5 secondes
                }
            },
            {
                name: "Chaos",
                threshold: 0.5,
                aggression: 0.7,
                speedMultiplier: 1.1,
                behavior: "teleport_zone",
                color: "#FFA500",
                special: {
                    type: "teleport_zone",
                    portalCount: 3,        // 3 portails à la fois
                    portalDuration: 8,     // Durée réduite
                    spawnInterval: 4000    // Plus fréquent
                }
            },
            {
                name: "Néant",
                threshold: 0.25,
                aggression: 0.9,
                speedMultiplier: 1.2,
                behavior: "teleport_zone",
                color: "#9932CC",
                special: {
                    type: "teleport_zone",
                    portalCount: 4,        // 4 portails à la fois
                    portalDuration: 6,     // Durée courte
                    spawnInterval: 3000    // Très fréquent
                }
            }
        ]
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
    }
};

// Patterns de murs prédéfinis
export const WALL_PATTERNS = {
    random: (count, gridSize) => {
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
        const walls = [];
        const positions = [];
        for (let i = 2; i < gridSize - 2; i++) {
            positions.push({ x: i, y: 2 });
            positions.push({ x: i, y: gridSize - 3 });
            positions.push({ x: 2, y: i });
            positions.push({ x: gridSize - 3, y: i });
        }
        for (let i = 0; i < Math.min(count, positions.length); i++) {
            const idx = Math.floor(Math.random() * positions.length);
            walls.push(positions.splice(idx, 1)[0]);
        }
        return walls;
    },
    maze: (count, gridSize) => {
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

/**
 * Récupère le niveau par son numéro
 */
export function getLevelByNumber(levelNum) {
    return ROGUELIKE_LEVELS.find(l => l.level === levelNum) || null;
}

/**
 * Vérifie si c'est un niveau boss
 */
export function isBossLevel(levelNum) {
    return levelNum === 5 || levelNum === 10 || levelNum === 15 || levelNum === 20;
}

export default ROGUELIKE_LEVELS;
