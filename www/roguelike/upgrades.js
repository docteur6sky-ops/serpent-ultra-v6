/**
 * SNAKE ROGUELIKE - Système d'upgrades
 * Upgrades temporaires (run) et permanents (méta-progression)
 */

// ========== UPGRADES DE RUN (temporaires, perdus à la mort) ==========
export const RUN_UPGRADES = {
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
        stackable: false
    },
    fire_duration: {
        id: "fire_duration",
        name: "Feu Prolongé",
        description: "Feu dure 2x plus longtemps (boost infini)",
        icon: "🔥",
        category: "powerup",
        rarity: "rare",
        weight: 6,
        effect: {
            type: "powerup_duration",
            powerup: "fire",
            multiplier: 2
        },
        stackable: false
    },
    rock_duration: {
        id: "rock_duration",
        name: "Roche Prolongée",
        description: "Roche dure 2x plus longtemps (détruit murs)",
        icon: "🪨",
        category: "powerup",
        rarity: "rare",
        weight: 6,
        effect: {
            type: "powerup_duration",
            powerup: "rock",
            multiplier: 2
        },
        stackable: false
    },
    ghost_extended: {
        id: "ghost_extended",
        name: "Spectre",
        description: "Ghost dure 2x plus longtemps",
        icon: "👻",
        category: "powerup",
        rarity: "rare",
        weight: 5,
        effect: {
            type: "powerup_duration",
            powerup: "ghost",
            multiplier: 2
        },
        stackable: false
    },

    // ===== CATÉGORIE : SCORE / XP =====
    xp_boost: {
        id: "xp_boost",
        name: "Sagesse",
        description: "+25% XP par stack (max x2)",
        icon: "📚",
        category: "score",
        rarity: "common",
        weight: 8,
        effect: {
            type: "xp_multiplier",
            value: 0.25  // +0.25 par stack (additif)
        },
        stackable: true,
        maxStacks: 4
    },
    apple_value: {
        id: "apple_value",
        name: "Gourmandise",
        description: "1 pomme mangée = 2 pommes (objectif x2)",
        icon: "🍏",
        category: "score",
        rarity: "legendary",
        weight: 1,
        effect: {
            type: "apple_double",
            multiplier: 2
        },
        stackable: false
    },
    fortune: {
        id: "fortune",
        name: "Fortune",
        description: "Chance de spawn 💰 (+25 gold)",
        icon: "💰",
        category: "score",
        rarity: "rare",
        weight: 5,
        effect: {
            type: "gold_spawn",
            chances: [0.10, 0.15, 0.30],  // 10%, 15%, 30% par stack
            goldValue: 25
        },
        stackable: true,
        maxStacks: 3
    },
    combo_master: {
        id: "combo_master",
        name: "Combo Master",
        description: "+15 combo à la prochaine pomme mangée",
        icon: "🌟",
        category: "score",
        rarity: "epic",
        weight: 3,
        effect: {
            type: "combo_boost_next_apple",
            value: 15
        },
        stackable: false,
        consumedOnUse: true  // Disparaît après utilisation
    },

    // ===== CATÉGORIE : SEGMENTS =====
    scissors: {
        id: "scissors",
        name: "Ciseaux",
        description: "Longueur ÷2, combo inchangé (item à manger)",
        icon: "✂️",
        category: "segments",
        rarity: "rare",
        weight: 5,
        effect: {
            type: "scissors",
            divisor: 2
        },
        stackable: false
    },
    segment_steal: {
        id: "segment_steal",
        name: "Vampire",
        description: "En mode Ghost : crânes = +1 segment et +1 combo",
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
    teleport: {
        id: "teleport",
        name: "Téléportation",
        description: "Supprime les murs de bordure, traverse l'écran",
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
    lightning_duration: {
        id: "lightning_duration",
        name: "Foudre Prolongée",
        description: "Foudre dure 2x plus longtemps (contrôles inversés)",
        icon: "⚡",
        category: "powerup",
        rarity: "rare",
        weight: 5,
        effect: {
            type: "powerup_duration",
            powerup: "lightning",
            multiplier: 2
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
    let upgrade = RUN_UPGRADES[upgradeId];
    if (!upgrade) return runState;

    // Upgrade ??? : remplacer par un upgrade aléatoire
    if (upgrade.effect.type === 'random') {
        const legendaryChance = upgrade.effect.legendary_chance || 0.1;
        const availableUpgrades = Object.values(RUN_UPGRADES).filter(u =>
            u.id !== 'random_upgrade' &&
            !runState.upgrades.includes(u.id)
        );

        if (availableUpgrades.length > 0) {
            // Chance d'obtenir un légendaire
            let pool = availableUpgrades;
            if (Math.random() < legendaryChance) {
                const legendaries = availableUpgrades.filter(u => u.rarity === 'legendary');
                if (legendaries.length > 0) {
                    pool = legendaries;
                }
            }
            const randomUpgrade = pool[Math.floor(Math.random() * pool.length)];
            upgradeId = randomUpgrade.id;
            upgrade = randomUpgrade;
            // Note: ??? transformé en upgrade.name
        }
    }

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
        // Les autres effets sont appliqués pendant le gameplay (scissors, etc.)
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
                // Additif : +0.25 par stack (1 → 1.25 → 1.50 → 1.75 → 2.00)
                modifiers.xpMultiplier += upgrade.effect.value;
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
