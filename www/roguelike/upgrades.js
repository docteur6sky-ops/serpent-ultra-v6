/**
 * SNAKE ROGUELIKE - Système d'upgrades
 * Upgrades temporaires (run) et permanents (méta-progression)
 */

// ========== UPGRADES DE RUN (temporaires, perdus à la mort) ==========
export const RUN_UPGRADES = {
    // ===== CATÉGORIE : VITESSE =====
    speed_boost: {
        id: "speed_boost",
        name: "Vélocité",
        description: "+15% vitesse de déplacement",
        icon: "⚡",
        category: "speed",
        rarity: "common",
        weight: 10,  // Probabilité d'apparition
        effect: {
            type: "speed_multiplier",
            value: 1.15
        },
        stackable: true,
        maxStacks: 3
    },
    speed_reduction: {
        id: "speed_reduction",
        name: "Zen",
        description: "-10% vitesse (plus de contrôle)",
        icon: "🐢",
        category: "speed",
        rarity: "common",
        weight: 8,
        effect: {
            type: "speed_multiplier",
            value: 0.9
        },
        stackable: true,
        maxStacks: 2
    },
    burst_speed: {
        id: "burst_speed",
        name: "Sprint",
        description: "Double-tap pour boost temporaire",
        icon: "💨",
        category: "speed",
        rarity: "rare",
        weight: 5,
        effect: {
            type: "ability",
            ability: "sprint",
            duration: 2,
            cooldown: 10
        },
        stackable: false
    },

    // ===== CATÉGORIE : SURVIE =====
    extra_life: {
        id: "extra_life",
        name: "Seconde Chance",
        description: "+1 vie",
        icon: "❤️",
        category: "survival",
        rarity: "rare",
        weight: 6,
        effect: {
            type: "lives",
            value: 1
        },
        stackable: true,
        maxStacks: 3
    },
    shield: {
        id: "shield",
        name: "Bouclier",
        description: "Prochain hit = perd 3 segments au lieu de mourir",
        icon: "🛡️",
        category: "survival",
        rarity: "epic",
        weight: 3,
        effect: {
            type: "shield",
            segments_lost: 3
        },
        stackable: true,
        maxStacks: 2
    },
    regeneration: {
        id: "regeneration",
        name: "Régénération",
        description: "+1 segment toutes les 15 secondes",
        icon: "💚",
        category: "survival",
        rarity: "rare",
        weight: 5,
        effect: {
            type: "regen",
            interval: 15,
            amount: 1
        },
        stackable: true,
        maxStacks: 2
    },
    smaller_hitbox: {
        id: "smaller_hitbox",
        name: "Agilité",
        description: "Hitbox réduite de 20%",
        icon: "🎯",
        category: "survival",
        rarity: "epic",
        weight: 3,
        effect: {
            type: "hitbox",
            multiplier: 0.8
        },
        stackable: false
    },

    // ===== CATÉGORIE : POWER-UPS =====
    ice_duration: {
        id: "ice_duration",
        name: "Gel Prolongé",
        description: "Power-up Glace dure 2x plus longtemps",
        icon: "❄️",
        category: "powerup",
        rarity: "common",
        weight: 8,
        effect: {
            type: "powerup_duration",
            powerup: "ice",
            multiplier: 2
        },
        stackable: true,
        maxStacks: 2
    },
    fire_power: {
        id: "fire_power",
        name: "Inferno",
        description: "Feu détruit 2 murs au lieu de 1",
        icon: "🔥",
        category: "powerup",
        rarity: "rare",
        weight: 6,
        effect: {
            type: "powerup_strength",
            powerup: "fire",
            multiplier: 2
        },
        stackable: true,
        maxStacks: 2
    },
    ghost_extended: {
        id: "ghost_extended",
        name: "Spectre",
        description: "Ghost dure 3x plus longtemps",
        icon: "👻",
        category: "powerup",
        rarity: "rare",
        weight: 5,
        effect: {
            type: "powerup_duration",
            powerup: "ghost",
            multiplier: 3
        },
        stackable: false
    },
    powerup_magnet: {
        id: "powerup_magnet",
        name: "Magnétisme",
        description: "Attire les power-ups dans un rayon de 3 cases",
        icon: "🧲",
        category: "powerup",
        rarity: "epic",
        weight: 3,
        effect: {
            type: "magnet",
            radius: 3,
            targets: ["powerup"]
        },
        stackable: false
    },
    double_powerup: {
        id: "double_powerup",
        name: "Dualité",
        description: "Les power-ups ont 50% de chance de spawn en double",
        icon: "✨",
        category: "powerup",
        rarity: "legendary",
        weight: 1,
        effect: {
            type: "double_spawn",
            chance: 0.5,
            targets: ["powerup"]
        },
        stackable: false
    },

    // ===== CATÉGORIE : SCORE / XP =====
    xp_boost: {
        id: "xp_boost",
        name: "Sagesse",
        description: "+25% XP gagné cette run",
        icon: "📚",
        category: "score",
        rarity: "common",
        weight: 8,
        effect: {
            type: "xp_multiplier",
            value: 1.25
        },
        stackable: true,
        maxStacks: 3
    },
    apple_value: {
        id: "apple_value",
        name: "Gourmandise",
        description: "Pommes donnent +2 score au lieu de +1",
        icon: "🍎",
        category: "score",
        rarity: "common",
        weight: 8,
        effect: {
            type: "apple_score",
            value: 2
        },
        stackable: true,
        maxStacks: 3
    },
    golden_apple_chance: {
        id: "golden_apple_chance",
        name: "Fortune",
        description: "10% chance de pomme dorée (+10 score)",
        icon: "🌟",
        category: "score",
        rarity: "rare",
        weight: 5,
        effect: {
            type: "golden_apple",
            chance: 0.1,
            value: 10
        },
        stackable: true,
        maxStacks: 3
    },
    combo_master: {
        id: "combo_master",
        name: "Combo Master",
        description: "Score x2 si 5 pommes en 10 secondes",
        icon: "🔥",
        category: "score",
        rarity: "epic",
        weight: 3,
        effect: {
            type: "combo",
            threshold: 5,
            window: 10,
            multiplier: 2
        },
        stackable: false
    },

    // ===== CATÉGORIE : SEGMENTS =====
    starting_segments: {
        id: "starting_segments",
        name: "Longueur",
        description: "+2 segments au début de chaque niveau",
        icon: "🐍",
        category: "segments",
        rarity: "common",
        weight: 7,
        effect: {
            type: "starting_segments",
            value: 2
        },
        stackable: true,
        maxStacks: 3
    },
    segment_armor: {
        id: "segment_armor",
        name: "Écailles",
        description: "Les 3 derniers segments sont invulnérables",
        icon: "🔰",
        category: "segments",
        rarity: "epic",
        weight: 3,
        effect: {
            type: "tail_armor",
            count: 3
        },
        stackable: false
    },
    segment_steal: {
        id: "segment_steal",
        name: "Vampire",
        description: "Voler 1 segment aux crânes touchés (mode Ghost)",
        icon: "🧛",
        category: "segments",
        rarity: "legendary",
        weight: 1,
        effect: {
            type: "steal_on_ghost",
            amount: 1
        },
        stackable: false
    },

    // ===== CATÉGORIE : SPÉCIAL =====
    time_slow: {
        id: "time_slow",
        name: "Ralenti",
        description: "Tout ralentit pendant 3s quand tu es en danger",
        icon: "⏰",
        category: "special",
        rarity: "epic",
        weight: 3,
        effect: {
            type: "danger_slow",
            duration: 3,
            factor: 0.5,
            cooldown: 30
        },
        stackable: false
    },
    teleport: {
        id: "teleport",
        name: "Téléportation",
        description: "Traverse les bords de l'écran",
        icon: "🌀",
        category: "special",
        rarity: "rare",
        weight: 5,
        effect: {
            type: "wrap_around",
            enabled: true
        },
        stackable: false
    },
    mirror: {
        id: "mirror",
        name: "Miroir",
        description: "Contrôles inversés mais score x1.5",
        icon: "🪞",
        category: "special",
        rarity: "epic",
        weight: 2,
        effect: {
            type: "mirror_controls",
            score_multiplier: 1.5
        },
        stackable: false
    },
    random_upgrade: {
        id: "random_upgrade",
        name: "???",
        description: "Upgrade aléatoire (peut être légendaire !)",
        icon: "❓",
        category: "special",
        rarity: "rare",
        weight: 4,
        effect: {
            type: "random",
            legendary_chance: 0.1
        },
        stackable: false
    }
};

// ========== UPGRADES PERMANENTS (méta-progression) ==========
export const PERMANENT_UPGRADES = {
    // Déblocables avec XP accumulé
    unlock_sprint: {
        id: "unlock_sprint",
        name: "Débloquer Sprint",
        description: "Sprint peut apparaître dans les choix",
        icon: "💨",
        cost: 500,
        requires: null,
        unlocks: "burst_speed"
    },
    unlock_shield: {
        id: "unlock_shield",
        name: "Débloquer Bouclier",
        description: "Bouclier peut apparaître dans les choix",
        icon: "🛡️",
        cost: 750,
        requires: null,
        unlocks: "shield"
    },
    starting_life: {
        id: "starting_life",
        name: "Vie de départ",
        description: "Commencer chaque run avec +1 vie",
        icon: "❤️",
        cost: 1000,
        requires: null,
        effect: { type: "starting_lives", value: 1 }
    },
    better_odds: {
        id: "better_odds",
        name: "Meilleure chance",
        description: "+10% chance d'upgrades rares",
        icon: "🍀",
        cost: 1500,
        requires: null,
        effect: { type: "rarity_boost", value: 0.1 }
    },
    fourth_choice: {
        id: "fourth_choice",
        name: "Quatrième choix",
        description: "4 upgrades proposés au lieu de 3",
        icon: "4️⃣",
        cost: 2000,
        requires: "better_odds",
        effect: { type: "choice_count", value: 4 }
    },
    reroll: {
        id: "reroll",
        name: "Relance",
        description: "1 relance gratuite par niveau",
        icon: "🎲",
        cost: 2500,
        requires: null,
        effect: { type: "free_reroll", value: 1 }
    },
    legendary_hunter: {
        id: "legendary_hunter",
        name: "Chasseur de légendes",
        description: "+5% chance d'upgrades légendaires",
        icon: "👑",
        cost: 5000,
        requires: "better_odds",
        effect: { type: "legendary_boost", value: 0.05 }
    }
};

// ========== RARETÉS ==========
export const RARITIES = {
    common: {
        name: "Commun",
        color: "#9e9e9e",
        glow: "none",
        weight: 60
    },
    rare: {
        name: "Rare",
        color: "#2196f3",
        glow: "0 0 10px #2196f3",
        weight: 25
    },
    epic: {
        name: "Épique",
        color: "#9c27b0",
        glow: "0 0 15px #9c27b0",
        weight: 12
    },
    legendary: {
        name: "Légendaire",
        color: "#ff9800",
        glow: "0 0 20px #ff9800, 0 0 40px #ff9800",
        weight: 3
    }
};

// ========== FONCTIONS UTILITAIRES ==========

/**
 * Sélectionne N upgrades aléatoires selon leur poids et rareté
 */
export function selectRandomUpgrades(count = 3, excludeIds = [], rarityBoost = 0) {
    const available = Object.values(RUN_UPGRADES).filter(u => !excludeIds.includes(u.id));

    // Calculer les poids totaux
    let totalWeight = 0;
    const weighted = available.map(upgrade => {
        let weight = upgrade.weight;
        // Appliquer le boost de rareté
        if (upgrade.rarity === 'rare') weight *= (1 + rarityBoost);
        if (upgrade.rarity === 'epic') weight *= (1 + rarityBoost * 1.5);
        if (upgrade.rarity === 'legendary') weight *= (1 + rarityBoost * 2);
        totalWeight += weight;
        return { upgrade, weight, cumulative: totalWeight };
    });

    // Sélectionner
    const selected = [];
    while (selected.length < count && weighted.length > 0) {
        const roll = Math.random() * totalWeight;
        for (let i = 0; i < weighted.length; i++) {
            if (roll <= weighted[i].cumulative) {
                selected.push(weighted[i].upgrade);
                // Retirer de la liste pour éviter les doublons
                totalWeight -= weighted[i].weight;
                weighted.splice(i, 1);
                // Recalculer les cumulatifs
                let cumul = 0;
                weighted.forEach(w => {
                    cumul += w.weight;
                    w.cumulative = cumul;
                });
                break;
            }
        }
    }

    return selected;
}

/**
 * Applique un upgrade à l'état de la run
 */
export function applyUpgrade(runState, upgradeId) {
    const upgrade = RUN_UPGRADES[upgradeId];
    if (!upgrade) return runState;

    // Vérifier le stacking
    const existing = runState.upgrades.filter(u => u === upgradeId).length;
    if (!upgrade.stackable && existing > 0) return runState;
    if (upgrade.maxStacks && existing >= upgrade.maxStacks) return runState;

    // Ajouter l'upgrade
    runState.upgrades.push(upgradeId);

    // Appliquer l'effet immédiat si nécessaire
    switch (upgrade.effect.type) {
        case 'lives':
            runState.lives += upgrade.effect.value;
            break;
        case 'starting_segments':
            runState.bonusSegments += upgrade.effect.value;
            break;
        // Les autres effets sont appliqués pendant le gameplay
    }

    return runState;
}

/**
 * Calcule les modificateurs actifs d'une run
 */
export function calculateRunModifiers(upgrades) {
    const modifiers = {
        speedMultiplier: 1,
        xpMultiplier: 1,
        scoreMultiplier: 1,
        appleScore: 1,
        powerupDurations: {},
        abilities: [],
        passives: []
    };

    upgrades.forEach(upgradeId => {
        const upgrade = RUN_UPGRADES[upgradeId];
        if (!upgrade) return;

        switch (upgrade.effect.type) {
            case 'speed_multiplier':
                modifiers.speedMultiplier *= upgrade.effect.value;
                break;
            case 'xp_multiplier':
                modifiers.xpMultiplier *= upgrade.effect.value;
                break;
            case 'apple_score':
                modifiers.appleScore += upgrade.effect.value - 1;
                break;
            case 'powerup_duration':
                const pu = upgrade.effect.powerup;
                modifiers.powerupDurations[pu] = (modifiers.powerupDurations[pu] || 1) * upgrade.effect.multiplier;
                break;
            case 'ability':
                modifiers.abilities.push(upgrade.effect);
                break;
            default:
                modifiers.passives.push(upgrade.effect);
        }
    });

    return modifiers;
}

export default RUN_UPGRADES;
