// ============================================
// TROPHÉES ET RANGS
// Système de progression et achievements
// Version 7.0 - 31 trophées
// 15 Multi + 11 Boss Rush + 5 Easter Eggs
// Note: Les trophées Solo/Carrière sont dans achievements.js (Roguelike)
// ============================================

/**
 * Crée l'objet TROPHIES avec les fonctions check liées au career
 * @param {Object} career - L'objet career pour les vérifications
 * @returns {Object} L'objet TROPHIES
 */
export function createTrophies(career) {
    return {
        // ═══════════════════════════════════════
        // MULTI (15) - Grades et Progression
        // ⭐ FACILE (3): bapteme_feu, premiere_victoire, chasseur_bonus_multi
        // ⭐⭐ MOYEN (4): combattant_multi, phoenix, collecteur_multi, grade_argent_multi
        // ⭐⭐⭐ DIFFICILE (3): grade_or_multi, invaincu, survivant_multi
        // ⭐⭐⭐⭐ EXPERT (3): titan, grade_platine_multi, inarretable
        // ⭐⭐⭐⭐⭐ LÉGENDAIRE (2): grade_legende_multi, legende_multi
        // ═══════════════════════════════════════
        bapteme_feu: {
            name: 'Baptême du Feu',
            emoji: '🔥',
            image: 'victory-trophy-laurel.png',
            description: 'Jouer ta 1ère partie multi',
            rarity: 1,
            xp: 100,
            secret: false,
            category: 'multi',
            check: () => (career.totalMultiGames || 0) >= 1
        },

        combattant_multi: {
            name: 'Combattant',
            emoji: '⚔️',
            image: 'victory-trophy-laurel.png',
            description: 'Jouer 5 parties multi',
            rarity: 2,
            xp: 400,
            secret: false,
            category: 'multi',
            check: () => (career.totalMultiGames || 0) >= 5
        },

        premiere_victoire: {
            name: 'Première Victoire',
            emoji: '🎖️',
            image: 'victory-trophy-laurel.png',
            description: 'Gagner 1 partie multi',
            rarity: 1,
            xp: 300,
            secret: false,
            category: 'multi',
            check: () => (career.multiWins || 0) >= 1
        },

        chasseur_bonus_multi: {
            name: 'Chasseur de Bonus',
            emoji: '🎁',
            image: 'golden-lightning-power.png',
            description: 'Collecter 5 power-ups en Multi (total carrière)',
            rarity: 1,
            xp: 250,
            secret: false,
            category: 'multi',
            check: () => (career.multiPowerups || 0) >= 5
        },

        // ═══════════════════════════════════════
        // MULTI - ⭐⭐ MOYEN (4)
        // ═══════════════════════════════════════
        phoenix: {
            name: 'Phoenix',
            emoji: '🔥',
            image: 'golden-trophy-crown.png',
            description: 'Gagner immédiatement après une défaite (multi)',
            rarity: 2,
            xp: 500,
            secret: false,
            category: 'multi',
            check: () => (career.phoenixRisesMulti || 0) >= 1
        },

        collecteur_multi: {
            name: 'Collecteur',
            emoji: '💎',
            image: 'golden-lightning-power.png',
            description: 'Collecter 20 power-ups en Multi (total carrière)',
            rarity: 2,
            xp: 500,
            secret: false,
            category: 'multi',
            check: () => (career.multiPowerups || 0) >= 20
        },

        grade_argent_multi: {
            name: 'Grade Argent',
            emoji: '🥈',
            image: 'victory-trophy-laurel.png',
            description: 'Atteindre le grade Argent en Multi (10 victoires)',
            rarity: 2,
            xp: 600,
            secret: false,
            category: 'multi',
            check: () => (career.multiWins || 0) >= 10
        },

        survivant_multi: {
            name: 'Survivant',
            emoji: '✅',
            image: 'water-droplet-shield.png',
            description: 'Finir 10 parties sans abandon',
            rarity: 3,
            xp: 1000,
            secret: false,
            category: 'multi',
            check: () => (career.multiCompleted || 0) >= 10
        },

        grade_or_multi: {
            name: 'Grade Or',
            emoji: '🥇',
            image: 'golden-trophy-crown.png',
            description: 'Atteindre le grade Or en Multi (20 victoires)',
            rarity: 3,
            xp: 1000,
            secret: false,
            category: 'multi',
            check: () => (career.multiWins || 0) >= 20
        },

        // ═══════════════════════════════════════
        // MULTI - ⭐⭐⭐ DIFFICILE (2)
        // ═══════════════════════════════════════
        grade_platine_multi: {
            name: 'Grade Platine',
            emoji: '💎',
            image: 'platinum-crown-champion.png',
            description: 'Atteindre le grade Platine en Multi (30 victoires)',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'multi',
            check: () => (career.multiWins || 0) >= 30
        },

        titan: {
            name: 'Titan',
            emoji: '🗿',
            image: 'platinum-crown-champion.png',
            description: 'Jouer 50 parties multi',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'multi',
            check: () => (career.totalMultiGames || 0) >= 50
        },

        grade_legende_multi: {
            name: 'Grade Légende',
            emoji: '👑',
            image: 'golden-trophy-crown.png',
            description: 'Atteindre le grade Légende en Multi (50 victoires)',
            rarity: 5,
            xp: 5000,
            secret: false,
            category: 'multi',
            check: () => (career.multiWins || 0) >= 50
        },

        // ═══════════════════════════════════════
        // MULTI - ⭐⭐⭐⭐ EXPERT (4)
        // ═══════════════════════════════════════
        invaincu: {
            name: 'Invaincu',
            emoji: '🔥',
            image: 'water-droplet-shield.png',
            description: 'Gagner 3 parties d\'affilée',
            rarity: 3,
            xp: 1000,
            secret: false,
            category: 'multi',
            check: () => (career.currentStreak || 0) >= 3
        },

        inarretable: {
            name: 'Inarrêtable',
            emoji: '🔥',
            image: 'water-droplet-shield.png',
            description: 'Gagner 5 parties d\'affilée',
            rarity: 4,
            xp: 2500,
            secret: false,
            category: 'multi',
            check: () => (career.currentStreak || 0) >= 5
        },

        legende_multi: {
            name: 'Légende du Multi',
            emoji: '🏆',
            image: 'golden-trophy-crown.png',
            description: 'Débloquer les 14 autres trophées Multi',
            rarity: 5,
            xp: 5000,
            secret: false,
            category: 'multi',
            check: () => {
                const multiTrophies = ['phoenix', 'bapteme_feu', 'combattant_multi', 'premiere_victoire', 'chasseur_bonus_multi',
                    'collecteur_multi', 'grade_argent_multi', 'survivant_multi', 'grade_or_multi',
                    'grade_platine_multi', 'titan', 'grade_legende_multi', 'invaincu', 'inarretable'];
                const unlockedCount = multiTrophies.filter(id => {
                    const trophy = window.TROPHIES?.[id];
                    return trophy && trophy.check();
                }).length;
                return unlockedCount >= 14;
            }
        },

        // ═══════════════════════════════════════
        // BOSS RUSH (11) - Chasse aux Boss
        // ⭐ FACILE (2): premiere_run, tueur_titan
        // ⭐⭐ MOYEN (2): chasseur_boss, duo_mortel
        // ⭐⭐⭐ DIFFICILE (3): trio_infernal, maitre_foudre, completiste
        // ⭐⭐⭐⭐ EXPERT (3): speedrunner, perfectionniste, veterane_boss
        // ⭐⭐⭐⭐⭐ LÉGENDAIRE (1): legende_boss
        // ═══════════════════════════════════════

        // ⭐ FACILE
        premiere_run: {
            name: 'Première Run',
            emoji: '🎯',
            image: 'victory-trophy-laurel.png',
            description: 'Lancer ta 1ère partie Boss Rush',
            rarity: 1,
            xp: 100,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushRuns || 0) >= 1
        },

        tueur_titan: {
            name: 'Brise Roche',
            emoji: '🗿',
            image: 'victory-trophy-laurel.png',
            description: 'Vaincre TITAN',
            rarity: 1,
            xp: 200,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushTitanKills || 0) >= 1
        },

        // ⭐⭐ MOYEN
        chasseur_boss: {
            name: 'Chasseur de Boss',
            emoji: '⚔️',
            image: 'golden-lightning-power.png',
            description: 'Lancer 10 parties Boss Rush',
            rarity: 2,
            xp: 500,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushRuns || 0) >= 10
        },

        duo_mortel: {
            name: 'Brise Glace',
            emoji: '❄️',
            image: 'water-droplet-shield.png',
            description: 'Vaincre CRYO',
            rarity: 2,
            xp: 600,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushCryoKills || 0) >= 1
        },

        // ⭐⭐⭐ DIFFICILE
        trio_infernal: {
            name: 'Plus Mort que Mort',
            emoji: '👻',
            image: 'dark-skull-chaos.png',
            description: 'Vaincre SPECTRE',
            rarity: 3,
            xp: 1000,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushSpectreKills || 0) >= 1
        },

        maitre_foudre: {
            name: 'Maître de la Foudre',
            emoji: '⚡',
            image: 'golden-lightning-power.png',
            description: 'Vaincre FOUDRE (Boss Final)',
            rarity: 3,
            xp: 1200,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushFoudreKills || 0) >= 1
        },

        completiste: {
            name: 'Complétiste',
            emoji: '🏆',
            image: 'golden-trophy-crown.png',
            description: 'Terminer une run Boss Rush (4/4 boss)',
            rarity: 3,
            xp: 1500,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushCompletions || 0) >= 1
        },

        // ⭐⭐⭐⭐ EXPERT
        speedrunner: {
            name: 'Speedrunner',
            emoji: '⚡',
            image: 'golden-lightning-power.png',
            description: 'Terminer une run en moins de 5 minutes',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushFastRuns || 0) >= 1
        },

        perfectionniste: {
            name: 'Perfectionniste',
            emoji: '💎',
            image: 'platinum-crown-champion.png',
            description: 'Terminer une run sans prendre de dégâts',
            rarity: 4,
            xp: 2500,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushPerfectRuns || 0) >= 1
        },

        veterane_boss: {
            name: 'Vétéran des Boss',
            emoji: '🎖️',
            image: 'platinum-crown-champion.png',
            description: 'Terminer 10 runs Boss Rush complètes',
            rarity: 4,
            xp: 2500,
            secret: false,
            category: 'bossrush',
            check: () => (career.bossRushCompletions || 0) >= 10
        },

        // ⭐⭐⭐⭐⭐ LÉGENDAIRE
        legende_boss: {
            name: 'Légende des Boss',
            emoji: '👑',
            image: 'golden-trophy-crown.png',
            description: 'Débloquer les 10 autres trophées Boss Rush',
            rarity: 5,
            xp: 5000,
            secret: false,
            category: 'bossrush',
            check: () => {
                const bossRushTrophies = ['premiere_run', 'tueur_titan', 'chasseur_boss', 'duo_mortel',
                    'trio_infernal', 'maitre_foudre', 'completiste', 'speedrunner', 'perfectionniste', 'veterane_boss'];
                const unlockedCount = bossRushTrophies.filter(id => {
                    const trophy = window.TROPHIES?.[id];
                    return trophy && trophy.check();
                }).length;
                return unlockedCount >= 10;
            }
        },

        // ═══════════════════════════════════════
        // EASTER EGGS (5) - Secrets cachés
        // explorateur, collectionneur, nocturne, patience, hospitalite
        // ═══════════════════════════════════════
        explorateur: {
            name: 'Explorateur',
            emoji: '🗺️',
            image: 'mystical-rune-secret.png',
            description: 'Visiter les écrans principaux du jeu',
            rarity: 5,
            xp: 3000,
            secret: true,
            hint: 'Explore chaque recoin...',
            category: 'secret',
            check: () => {
                // Écrans requis pour le trophée (6 écrans)
                const requiredScreens = [
                    'hub',          // Menu principal
                    'game-solo',    // Partie solo
                    'game-multi',   // Partie multi
                    'game-ai',      // Partie vs IA
                    'box-screen',   // Ma Box
                    'options-menu'  // Options
                ];
                const visited = career.screensVisited || [];
                const allVisited = requiredScreens.every(screen => visited.includes(screen));
                return allVisited;
            }
        },

        collectionneur: {
            name: 'Collectionneur',
            emoji: '🎁',
            image: 'locked-treasure-chest.png',
            description: 'Débloquer 10 items dans Ma Box',
            rarity: 5,
            xp: 3000,
            secret: true,
            hint: 'Les trésors t\'attendent...',
            category: 'secret',
            check: () => {
                const unlockedItems = window.boxManager?.getUnlockedCount() || 0;
                return unlockedItems >= 10;
            }
        },

        nocturne: {
            name: 'Nocturne',
            emoji: '🌙',
            image: 'crescent-moon-master.png',
            description: 'Jouer entre 20h et 8h du matin',
            rarity: 5,
            xp: 2000,
            secret: true,
            hint: 'La nuit porte conseil...',
            category: 'secret',
            check: () => (career.nightOwlGames || 0) >= 1
        },

        patience: {
            name: 'Patience',
            emoji: '🧘',
            image: 'mystical-rune-secret.png',
            description: 'Attendre 30 secondes sans bouger avant de commencer',
            rarity: 5,
            xp: 2000,
            secret: true,
            hint: 'Parfois, ne rien faire est la clé...',
            category: 'secret',
            check: () => (career.patienceAchieved || 0) >= 1
        },

        hospitalite: {
            name: 'Hospitalité',
            emoji: '🏠',
            image: 'locked-treasure-chest.png',
            description: 'Créer un salon dans le lobby multi',
            rarity: 5,
            xp: 2000,
            secret: true,
            hint: 'Tu seras le bienvenu chez moi...',
            category: 'secret',
            check: () => (career.roomsCreated || 0) >= 1
        }
    };
}

export const RANKS = {
    bronze: {
        name: 'BRONZE',
        emoji: '🥉',
        title: 'Apprenti',
        minLevel: 1,
        maxLevel: 10,
        color: '#CD7F32'
    },
    silver: {
        name: 'ARGENT',
        emoji: '🥈',
        title: 'Combattant',
        minLevel: 11,
        maxLevel: 25,
        color: '#C0C0C0'
    },
    gold: {
        name: 'OR',
        emoji: '🥇',
        title: 'Vétéran',
        minLevel: 26,
        maxLevel: 40,
        color: '#FFD700'
    },
    platinum: {
        name: 'PLATINE',
        emoji: '💎',
        title: 'Champion',
        minLevel: 41,
        maxLevel: 60,
        color: '#E5E4E2'
    },
    diamond: {
        name: 'DIAMANT',
        emoji: '💠',
        title: 'Maître',
        minLevel: 61,
        maxLevel: 80,
        color: '#B9F2FF'
    },
    elite: {
        name: 'ÉLITE',
        emoji: '⭐',
        title: 'Élite',
        minLevel: 81,
        maxLevel: 95,
        color: '#FF69B4'
    },
    legend: {
        name: 'LÉGENDE',
        emoji: '👑',
        title: 'Légende',
        minLevel: 96,
        maxLevel: 100,
        color: '#9400D3'
    }
};
