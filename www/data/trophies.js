// ============================================
// TROPHÉES ET RANGS
// Système de progression et achievements
// Version 3.0 - 30 trophées (14 Solo + 9 Multi + 5 IA + 2 Secrets)
// ============================================

/**
 * Crée l'objet TROPHIES avec les fonctions check liées au career
 * @param {Object} career - L'objet career pour les vérifications
 * @returns {Object} L'objet TROPHIES
 */
export function createTrophies(career) {
    return {
        // ═══════════════════════════════════════
        // SOLO (15) - ⭐ FACILE (3)
        // ═══════════════════════════════════════
        premier_pas: {
            name: 'Premier Pas',
            emoji: '👣',
            image: 'green-worm-earth.png',
            description: 'Terminer ta 1ère partie',
            rarity: 1,
            xp: 100,
            secret: false,
            category: 'solo',
            check: () => career.totalGames >= 1
        },

        ver_de_terre: {
            name: 'Ver de Terre',
            emoji: '🪱',
            image: 'green-worm-earth.png',
            description: 'Atteindre le stage 5',
            rarity: 1,
            xp: 200,
            secret: false,
            category: 'solo',
            check: () => career.maxLevel >= 5
        },

        // ═══════════════════════════════════════
        // SOLO - ⭐⭐ MOYEN (4)
        // ═══════════════════════════════════════
        roi_reptiles: {
            name: 'Roi des Reptiles',
            emoji: '👑',
            image: 'golden-trophy-crown.png',
            description: 'Atteindre le stage 10',
            rarity: 2,
            xp: 500,
            secret: false,
            category: 'solo',
            check: () => career.maxLevel >= 10
        },

        anaconda: {
            name: 'Anaconda',
            emoji: '🦎',
            image: 'coiled-snake-anaconda.png',
            description: 'Atteindre 50 segments',
            rarity: 2,
            xp: 600,
            secret: false,
            category: 'solo',
            check: () => career.bestScore >= 5000  // Proxy : 50 segments ≈ 5000 pts
        },

        tout_puissant: {
            name: 'Tout Puissant',
            emoji: '⚡',
            image: 'golden-lightning-power.png',
            description: 'Collecter 75 power-ups (total carrière)',
            rarity: 2,
            xp: 700,
            secret: false,
            category: 'solo',
            check: () => (career.totalPowerups || 0) >= 75
        },

        survivant: {
            name: 'Survivant',
            emoji: '⏱️',
            image: 'water-droplet-shield.png',
            description: 'Survivre 5 minutes en une partie',
            rarity: 2,
            xp: 800,
            secret: false,
            category: 'solo',
            check: () => {
                const maxSurvival = career.maxSurvival || '0:00';
                const [min, sec] = maxSurvival.split(':').map(Number);
                const totalSeconds = (min * 60) + (sec || 0);
                return totalSeconds >= 300; // 5 minutes
            }
        },

        // ═══════════════════════════════════════
        // SOLO - ⭐⭐⭐ DIFFICILE (4)
        // ═══════════════════════════════════════
        dieu_serpent: {
            name: 'Dieu Serpent',
            emoji: '🌟',
            image: 'mystical-serpent-deity.png',
            description: 'Atteindre le stage 15',
            rarity: 3,
            xp: 1000,
            secret: false,
            category: 'solo',
            check: () => career.maxLevel >= 15
        },

        seigneur_chaos: {
            name: 'Seigneur du Chaos',
            emoji: '🔮',
            image: 'dark-skull-chaos.png',
            description: 'Collecter 150 power-ups (total carrière)',
            rarity: 3,
            xp: 1200,
            secret: false,
            category: 'solo',
            check: () => (career.totalPowerups || 0) >= 150
        },

        puriste: {
            name: 'Puriste',
            emoji: '🚫',
            image: 'glowing-question-mystery.png',
            description: 'Atteindre stage 10 sans power-up',
            rarity: 3,
            xp: 1500,
            secret: false,
            category: 'solo',
            check: () => career.maxLevel >= 10 && career.totalPowerups === 0
        },

        immortel: {
            name: 'Immortel',
            emoji: '💀',
            image: 'water-droplet-shield.png',
            description: 'Survivre 10 minutes en une partie',
            rarity: 3,
            xp: 1500,
            secret: false,
            category: 'solo',
            check: () => {
                const maxSurvival = career.maxSurvival || '0:00';
                const [min, sec] = maxSurvival.split(':').map(Number);
                const totalSeconds = (min * 60) + (sec || 0);
                return totalSeconds >= 600; // 10 minutes
            }
        },

        // ═══════════════════════════════════════
        // SOLO - ⭐⭐⭐⭐ EXPERT (4)
        // ═══════════════════════════════════════
        ouroboros: {
            name: 'Ouroboros',
            emoji: '🐍',
            image: 'mystical-serpent-deity.png',
            description: 'Atteindre le stage 20',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'solo',
            check: () => career.maxLevel >= 20
        },

        kamikaze: {
            name: 'Kamikaze',
            emoji: '💥',
            image: 'dark-skull-chaos.png',
            description: 'Mourir en moins de 10 secondes',
            rarity: 1,
            xp: 200,
            secret: false,
            category: 'solo',
            check: () => (career.quickDeaths || 0) >= 1
        },

        phoenix: {
            name: 'Phoenix',
            emoji: '🔥',
            image: 'golden-trophy-crown.png',
            description: 'Gagner immédiatement après une défaite',
            rarity: 1,
            xp: 300,
            secret: false,
            category: 'solo',
            check: () => (career.phoenixRises || 0) >= 1
        },

        architecte_chaos: {
            name: 'Architecte du Chaos',
            emoji: '🌪️',
            image: 'broken-pillars-chaos.png',
            description: 'Détruire 200 murs (total carrière)',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'solo',
            check: () => (career.totalWalls || 0) >= 200
        },

        // ═══════════════════════════════════════
        // MULTI (15) - ⭐ FACILE (3)
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
            rarity: 1,
            xp: 200,
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

        // ═══════════════════════════════════════
        // MULTI - ⭐⭐ MOYEN (4)
        // ═══════════════════════════════════════
        veteran: {
            name: 'Vétéran',
            emoji: '🎖️',
            image: 'platinum-crown-champion.png',
            description: 'Jouer 20 parties multi',
            rarity: 2,
            xp: 500,
            secret: false,
            category: 'multi',
            check: () => (career.totalMultiGames || 0) >= 20
        },

        vainqueur: {
            name: 'Vainqueur',
            emoji: '🏆',
            image: 'victory-trophy-laurel.png',
            description: 'Gagner 5 parties multi',
            rarity: 2,
            xp: 600,
            secret: false,
            category: 'multi',
            check: () => (career.multiWins || 0) >= 5
        },

        survivant_multi: {
            name: 'Survivant',
            emoji: '✅',
            image: 'water-droplet-shield.png',
            description: 'Finir 10 parties sans abandon',
            rarity: 2,
            xp: 800,
            secret: false,
            category: 'multi',
            check: () => (career.multiCompleted || 0) >= 10
        },

        // ═══════════════════════════════════════
        // MULTI - ⭐⭐⭐ DIFFICILE (4)
        // ═══════════════════════════════════════
        champion: {
            name: 'Champion',
            emoji: '👑',
            image: 'platinum-crown-champion.png',
            description: 'Gagner 20 parties multi',
            rarity: 3,
            xp: 1000,
            secret: false,
            category: 'multi',
            check: () => (career.multiWins || 0) >= 20
        },

        // ═══════════════════════════════════════
        // MULTI - ⭐⭐⭐⭐ EXPERT (2)
        // ═══════════════════════════════════════
        invaincu: {
            name: 'Invaincu',
            emoji: '🔥',
            image: 'water-droplet-shield.png',
            description: 'Gagner 3 parties d\'affilée',
            rarity: 4,
            xp: 2000,
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

        // ═══════════════════════════════════════
        // IA (5) - Contre Intelligence Artificielle
        // ═══════════════════════════════════════
        terminateur: {
            name: 'Terminateur',
            emoji: '🤖',
            image: 'victory-trophy-laurel.png',
            description: 'Battre l\'IA 1 fois',
            rarity: 1,
            xp: 200,
            secret: false,
            category: 'ia',
            check: () => (career.aiWins || 0) >= 1
        },

        chasseur_robots: {
            name: 'Chasseur de Robots',
            emoji: '🎯',
            image: 'platinum-crown-champion.png',
            description: 'Battre l\'IA 10 fois',
            rarity: 2,
            xp: 600,
            secret: false,
            category: 'ia',
            check: () => (career.aiWins || 0) >= 10
        },

        maitre_stratege: {
            name: 'Maître Stratège',
            emoji: '🧠',
            image: 'crescent-moon-master.png',
            description: 'Battre l\'IA 25 fois',
            rarity: 3,
            xp: 1200,
            secret: false,
            category: 'ia',
            check: () => (career.aiWins || 0) >= 25
        },

        nemesis: {
            name: 'Nemesis',
            emoji: '⚡',
            image: 'mystical-serpent-deity.png',
            description: 'Battre l\'IA 50 fois',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'ia',
            check: () => (career.aiWins || 0) >= 50
        },

        glouton: {
            name: 'Glouton',
            emoji: '🍎',
            image: 'golden-lightning-power.png',
            description: 'Manger 100 pommes (total carrière)',
            rarity: 1,
            xp: 300,
            secret: false,
            category: 'ia',
            check: () => (career.totalApples || 0) >= 100
        },

        // ═══════════════════════════════════════
        // SECRETS (2)
        // ═══════════════════════════════════════
        explorateur: {
            name: 'Explorateur',
            emoji: '🗺️',
            image: 'mystical-rune-secret.png',
            description: 'Visiter chaque écran du jeu',
            rarity: 5,
            xp: 3000,
            secret: true,
            hint: 'Explore chaque recoin...',
            category: 'secret',
            check: () => {
                const requiredScreens = [
                    'hub', 'box-screen', 'stats-screen',
                    'game-solo', 'game-ai', 'multiplayer-menu', 'main-lobby-screen',
                    'options-menu', 'rules-menu', 'credits-menu'
                ];
                const visited = career.screensVisited || [];
                return requiredScreens.every(screen => visited.includes(screen));
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
