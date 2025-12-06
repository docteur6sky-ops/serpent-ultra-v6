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

    // ========== STAGE 5 : BOSS 1 ==========
    {
        level: 5,
        world: 1,
        name: "GARDIEN",
        description: "Vole ses segments !",
        objective: {
            type: "boss",
            bossSegments: 15,
            timeLimit: 120  // 2 minutes
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
        // PHASES DU GARDIEN (Boss tutoriel - simple)
        bossPhases: [
            {
                name: "Éveil",
                threshold: 1.0,    // 100% -> 50% HP
                aggression: 0.3,
                speedMultiplier: 1.0,
                behavior: "normal",
                color: "#ff0000"
            },
            {
                name: "Alerte",
                threshold: 0.5,    // 50% -> 25% HP
                aggression: 0.5,
                speedMultiplier: 1.2,
                behavior: "normal",
                color: "#ff4400"
            },
            {
                name: "Rage",
                threshold: 0.25,   // 25% -> 0% HP
                aggression: 0.8,
                speedMultiplier: 1.5,
                behavior: "rage",  // Plus agressif, mouvements erratiques
                color: "#ff8800"
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

    // ========== STAGE 10 : BOSS 2 ==========
    {
        level: 10,
        world: 2,
        name: "VENIN",
        description: "Évite le poison !",
        objective: {
            type: "boss",
            bossSegments: 20,
            timeLimit: 90  // 1 min 30
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
        // PHASES DU VENIN (Boss poison)
        bossPhases: [
            {
                name: "Toxique",
                threshold: 1.0,
                aggression: 0.5,
                speedMultiplier: 1.0,
                behavior: "poison_trail",  // Laisse des traces de poison
                color: "#00ff00",
                special: {
                    type: "poison_trail",
                    duration: 5,           // Le poison reste 5 secondes
                    damage: 1              // Perte 1 segment si touché
                }
            },
            {
                name: "Venimeux",
                threshold: 0.5,
                aggression: 0.65,
                speedMultiplier: 1.15,
                behavior: "poison_spit",   // Crache du poison à distance
                color: "#44ff00",
                special: {
                    type: "poison_spit",
                    interval: 3000,        // Crache toutes les 3 secondes
                    range: 5               // Portée de 5 cases
                }
            },
            {
                name: "Épidémie",
                threshold: 0.25,
                aggression: 0.85,
                speedMultiplier: 1.4,
                behavior: "poison_flood",  // Poison partout, très agressif
                color: "#88ff00",
                special: {
                    type: "poison_flood",
                    spawnRate: 2000        // Spawn poison toutes les 2s
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

    // ========== STAGE 15 : BOSS 3 ==========
    {
        level: 15,
        world: 3,
        name: "TITAN",
        description: "Évite ses charges !",
        objective: {
            type: "boss",
            bossSegments: 25,
            timeLimit: 75  // 1 min 15
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
        // PHASES DU TITAN (Boss charge)
        bossPhases: [
            {
                name: "Colosse",
                threshold: 1.0,
                aggression: 0.6,
                speedMultiplier: 0.8,      // Lent mais...
                behavior: "charge",        // Charge en ligne droite
                color: "#ff4400",
                special: {
                    type: "charge",
                    chargeSpeed: 3.0,      // Très rapide pendant la charge
                    chargeCooldown: 4000,  // Toutes les 4 secondes
                    chargeWarning: 1000    // 1 seconde d'avertissement
                }
            },
            {
                name: "Fureur",
                threshold: 0.5,
                aggression: 0.75,
                speedMultiplier: 1.0,
                behavior: "charge_wall",   // Charge + crée des murs temporaires
                color: "#ff6600",
                special: {
                    type: "charge_wall",
                    chargeSpeed: 3.5,
                    chargeCooldown: 3000,
                    wallDuration: 5,       // Murs temporaires 5 secondes
                    wallCount: 2           // Crée 2 murs après chaque charge
                }
            },
            {
                name: "Apocalypse",
                threshold: 0.25,
                aggression: 0.95,
                speedMultiplier: 1.2,
                behavior: "charge_frenzy", // Charges en série, invincible pendant
                color: "#ff8800",
                special: {
                    type: "charge_frenzy",
                    chargeSpeed: 4.0,
                    chargeCooldown: 2000,
                    chargeCount: 3,        // 3 charges d'affilée
                    invincible: true       // Invincible pendant la charge
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

    // ========== STAGE 20 : BOSS FINAL ==========
    {
        level: 20,
        world: 4,
        name: "NÉMÉSIS",
        description: "Face à ton destin !",
        objective: {
            type: "boss",
            bossSegments: 30,
            timeLimit: 90  // 1 min 30 (boss complexe)
        },
        obstacles: [
            { type: "wall_static", count: 4, pattern: "arena" }
        ],
        modifiers: {
            speedMultiplier: 1.6,
            appleSpawnRate: 1.2,
            powerupChance: 0.6
        },
        visualTheme: "void",
        music: "boss_final",
        isBoss: true,
        isFinalBoss: true,
        bossSpeed: 1.2,
        bossAggression: 0.9,
        bossMoveInterval: 160,
        bossGraceDelay: 3,        // 3 secondes de grâce (boss complexe)
        // PHASES DE NÉMÉSIS (Boss final - toutes les mécaniques)
        bossPhases: [
            {
                name: "Miroir",
                threshold: 1.0,
                aggression: 0.7,
                speedMultiplier: 1.0,
                behavior: "mirror",        // Copie les mouvements du joueur
                color: "#8800ff",
                special: {
                    type: "mirror",
                    delay: 500,            // Copie avec 0.5s de délai
                    perfectCopy: false     // Pas parfait, petites variations
                }
            },
            {
                name: "Division",
                threshold: 0.5,
                aggression: 0.8,
                speedMultiplier: 1.1,
                behavior: "split",         // Se divise en 2 mini-boss
                color: "#aa00ff",
                special: {
                    type: "split",
                    cloneCount: 1,         // 1 clone (total 2 boss)
                    cloneHP: 0.3,          // Le clone a 30% des segments
                    cloneSpeed: 1.3        // Clone plus rapide
                }
            },
            {
                name: "Néant",
                threshold: 0.25,
                aggression: 1.0,           // 100% agressif
                speedMultiplier: 1.4,
                behavior: "teleport",      // Téléportation + attaque surprise
                color: "#ff00ff",
                special: {
                    type: "teleport",
                    teleportCooldown: 2500,// Toutes les 2.5 secondes
                    teleportWarning: 800,  // 0.8s d'avertissement
                    attackAfterTeleport: true
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
