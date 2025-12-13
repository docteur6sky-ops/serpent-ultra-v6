/**
 * SNAKE ROGUELIKE - Système d'Achievements
 *
 * Catégories :
 * - Progression : Avancer dans le jeu
 * - Combat : Boss fights
 * - Collection : Ramasser des items
 * - Maîtrise : Compétences spéciales
 * - Secret : Achievements cachés
 */

import { logger } from '../services/logger.js';

// ========== DÉFINITION DES ACHIEVEMENTS ==========

export const ACHIEVEMENTS = [
    // ===== PROGRESSION (10) =====
    {
        id: 'first_step',
        name: 'Premier Pas',
        description: 'Terminer le niveau 1',
        icon: '👣',
        category: 'progression',
        rarity: 'common',
        condition: { type: 'level_complete', value: 1 },
        xpReward: 50
    },
    {
        id: 'world_1_clear',
        name: 'Forêt Conquise',
        description: 'Terminer le monde 1 (niveau 5)',
        icon: '🌲',
        category: 'progression',
        rarity: 'common',
        condition: { type: 'level_complete', value: 5 },
        xpReward: 100
    },
    {
        id: 'world_2_clear',
        name: 'Marais Traversé',
        description: 'Terminer le monde 2 (niveau 10)',
        icon: '🐸',
        category: 'progression',
        rarity: 'rare',
        condition: { type: 'level_complete', value: 10 },
        xpReward: 200
    },
    {
        id: 'world_3_clear',
        name: 'Volcan Dompté',
        description: 'Terminer le monde 3 (niveau 15)',
        icon: '🌋',
        category: 'progression',
        rarity: 'rare',
        condition: { type: 'level_complete', value: 15 },
        xpReward: 300
    },
    {
        id: 'world_4_clear',
        name: 'Conquérant du Néant',
        description: 'Terminer le jeu (niveau 20)',
        icon: '👑',
        category: 'progression',
        rarity: 'legendary',
        condition: { type: 'level_complete', value: 20 },
        xpReward: 1000
    },
    {
        id: 'runs_10',
        name: 'Persévérant',
        description: 'Faire 10 runs',
        icon: '🔄',
        category: 'progression',
        rarity: 'common',
        condition: { type: 'total_runs', value: 10 },
        xpReward: 100
    },
    {
        id: 'runs_50',
        name: 'Vétéran',
        description: 'Faire 50 runs',
        icon: '🎖️',
        category: 'progression',
        rarity: 'rare',
        condition: { type: 'total_runs', value: 50 },
        xpReward: 300
    },
    {
        id: 'runs_100',
        name: 'Légende',
        description: 'Faire 100 runs',
        icon: '🏆',
        category: 'progression',
        rarity: 'epic',
        condition: { type: 'total_runs', value: 100 },
        xpReward: 500
    },
    {
        id: 'endless_25',
        name: 'Sans Limites',
        description: 'Atteindre le niveau 25 (mode endless)',
        icon: '♾️',
        category: 'progression',
        rarity: 'epic',
        condition: { type: 'level_complete', value: 25 },
        xpReward: 500
    },
    {
        id: 'endless_30',
        name: 'Immortel',
        description: 'Atteindre le niveau 30 (mode endless)',
        icon: '⭐',
        category: 'progression',
        rarity: 'legendary',
        condition: { type: 'level_complete', value: 30 },
        xpReward: 1000
    },

    // ===== COMBAT (10) =====
    {
        id: 'first_boss',
        name: 'Chasseur de Boss',
        description: 'Vaincre ton premier boss',
        icon: '⚔️',
        category: 'combat',
        rarity: 'common',
        condition: { type: 'boss_killed', value: 1 },
        xpReward: 100
    },
    {
        id: 'boss_titan',
        name: 'Titan Terrassé',
        description: 'Vaincre TITAN (Boss 1 - Murs)',
        icon: '🗿',
        category: 'combat',
        rarity: 'common',
        condition: { type: 'specific_boss', value: 'TITAN' },
        xpReward: 100
    },
    {
        id: 'boss_cryo',
        name: 'Briseur de Glace',
        description: 'Vaincre CRYO (Boss 2 - Glace)',
        icon: '❄️',
        category: 'combat',
        rarity: 'rare',
        condition: { type: 'specific_boss', value: 'CRYO' },
        xpReward: 200
    },
    {
        id: 'boss_spectre',
        name: 'Chasseur de Fantômes',
        description: 'Vaincre SPECTRE (Boss 3 - Fantôme)',
        icon: '👻',
        category: 'combat',
        rarity: 'rare',
        condition: { type: 'specific_boss', value: 'SPECTRE' },
        xpReward: 300
    },
    {
        id: 'boss_foudre',
        name: 'Maître de la Foudre',
        description: 'Vaincre FOUDRE (Boss Final)',
        icon: '⚡',
        category: 'combat',
        rarity: 'legendary',
        condition: { type: 'specific_boss', value: 'FOUDRE' },
        xpReward: 500
    },
    {
        id: 'boss_flawless',
        name: 'Sans Égratignure',
        description: 'Vaincre un boss sans perdre de segment',
        icon: '💎',
        category: 'combat',
        rarity: 'epic',
        condition: { type: 'boss_flawless', value: 1 },
        xpReward: 400
    },
    {
        id: 'boss_speedrun',
        name: 'Speed Demon',
        description: 'Vaincre un boss en moins de 30 secondes',
        icon: '⚡',
        category: 'combat',
        rarity: 'epic',
        condition: { type: 'boss_speedrun', value: 30 },
        xpReward: 400
    },
    {
        id: 'steal_20',
        name: 'Voleur de Segments',
        description: 'Voler 20 segments aux boss en une run',
        icon: '🗡️',
        category: 'combat',
        rarity: 'rare',
        condition: { type: 'segments_stolen_run', value: 20 },
        xpReward: 200
    },
    {
        id: 'sword_master',
        name: 'Maître de l\'Épée',
        description: 'Ramasser 10 épées en une run',
        icon: '🤺',
        category: 'combat',
        rarity: 'rare',
        condition: { type: 'swords_collected_run', value: 10 },
        xpReward: 200
    },
    {
        id: 'boss_all',
        name: 'Chasseur Ultime',
        description: 'Vaincre tous les boss',
        icon: '🎯',
        category: 'combat',
        rarity: 'legendary',
        condition: { type: 'all_bosses', value: 4 },
        xpReward: 750
    },

    // ===== COLLECTION (10) =====
    {
        id: 'apples_100',
        name: 'Cueilleur',
        description: 'Manger 100 pommes au total',
        icon: '🍎',
        category: 'collection',
        rarity: 'common',
        condition: { type: 'total_apples', value: 100 },
        xpReward: 50
    },
    {
        id: 'apples_500',
        name: 'Gourmand',
        description: 'Manger 500 pommes au total',
        icon: '🍏',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'total_apples', value: 500 },
        xpReward: 150
    },
    {
        id: 'apples_1000',
        name: 'Insatiable',
        description: 'Manger 1000 pommes au total',
        icon: '🥧',
        category: 'collection',
        rarity: 'epic',
        condition: { type: 'total_apples', value: 1000 },
        xpReward: 300
    },
    {
        id: 'score_10000',
        name: 'Scorer',
        description: 'Atteindre 10 000 points en une run',
        icon: '📊',
        category: 'collection',
        rarity: 'common',
        condition: { type: 'score_run', value: 10000 },
        xpReward: 100
    },
    {
        id: 'score_50000',
        name: 'High Scorer',
        description: 'Atteindre 50 000 points en une run',
        icon: '📈',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'score_run', value: 50000 },
        xpReward: 250
    },
    {
        id: 'score_100000',
        name: 'Score Legend',
        description: 'Atteindre 100 000 points en une run',
        icon: '💯',
        category: 'collection',
        rarity: 'epic',
        condition: { type: 'score_run', value: 100000 },
        xpReward: 500
    },
    {
        id: 'upgrades_10',
        name: 'Collecteur',
        description: 'Collecter 10 upgrades en une run',
        icon: '📦',
        category: 'collection',
        rarity: 'common',
        condition: { type: 'upgrades_run', value: 10 },
        xpReward: 100
    },
    {
        id: 'upgrades_legendary',
        name: 'Chanceux',
        description: 'Obtenir un upgrade légendaire',
        icon: '🌟',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'legendary_upgrade', value: 1 },
        xpReward: 200
    },
    {
        id: 'powerups_50',
        name: 'Power Hungry',
        description: 'Ramasser 50 power-ups au total',
        icon: '⚡',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'total_powerups', value: 50 },
        xpReward: 150
    },
    {
        id: 'xp_10000',
        name: 'Expérimenté',
        description: 'Accumuler 10 000 XP au total',
        icon: '✨',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'total_xp', value: 10000 },
        xpReward: 200
    },

    // ===== MAÎTRISE (10) =====
    {
        id: 'no_hit_level',
        name: 'Intouchable',
        description: 'Terminer un niveau sans prendre de dégât',
        icon: '🛡️',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'no_hit_level', value: 1 },
        xpReward: 200
    },
    {
        id: 'long_snake',
        name: 'Long Serpent',
        description: 'Avoir 30 segments en même temps',
        icon: '🐍',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'max_segments', value: 30 },
        xpReward: 200
    },
    {
        id: 'giant_snake',
        name: 'Serpent Géant',
        description: 'Avoir 50 segments en même temps',
        icon: '🐉',
        category: 'mastery',
        rarity: 'epic',
        condition: { type: 'max_segments', value: 50 },
        xpReward: 400
    },
    {
        id: 'combo_10',
        name: 'Combo King',
        description: 'Atteindre un combo x10',
        icon: '🔥',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'max_combo', value: 10 },
        xpReward: 200
    },
    {
        id: 'ghost_master',
        name: 'Fantôme',
        description: 'Traverser 20 murs en mode ghost',
        icon: '👻',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'walls_ghosted', value: 20 },
        xpReward: 150
    },
    {
        id: 'fire_destroyer',
        name: 'Pyromane',
        description: 'Détruire 30 murs avec le power-up feu',
        icon: '🔥',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'walls_destroyed', value: 30 },
        xpReward: 150
    },
    {
        id: 'ice_master',
        name: 'Cryomancien',
        description: 'Geler des ennemis 20 fois',
        icon: '❄️',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'enemies_frozen', value: 20 },
        xpReward: 150
    },
    {
        id: 'survivor',
        name: 'Survivant',
        description: 'Survivre 5 minutes en une run',
        icon: '⏱️',
        category: 'mastery',
        rarity: 'common',
        condition: { type: 'survival_time', value: 300 },
        xpReward: 100
    },
    {
        id: 'marathon',
        name: 'Marathon',
        description: 'Survivre 10 minutes en une run',
        icon: '🏃',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'survival_time', value: 600 },
        xpReward: 250
    },
    {
        id: 'perfect_run',
        name: 'Run Parfaite',
        description: 'Terminer 5 niveaux sans mourir',
        icon: '💫',
        category: 'mastery',
        rarity: 'epic',
        condition: { type: 'levels_no_death', value: 5 },
        xpReward: 400
    },

    // ===== CARRIÈRE GLOBALE (7) =====
    // Ces achievements trackent la progression globale (tous modes confondus)
    {
        id: 'career_silver',
        name: 'Ver de Terre',
        description: 'Atteindre le niveau 11 (Rang Argent)',
        icon: '🪱',
        category: 'career',
        rarity: 'common',
        condition: { type: 'career_level', value: 11 },
        xpReward: 200
    },
    {
        id: 'career_gold',
        name: 'Roi des Reptiles',
        description: 'Atteindre le niveau 26 (Rang Or)',
        icon: '👑',
        category: 'career',
        rarity: 'rare',
        condition: { type: 'career_level', value: 26 },
        xpReward: 500
    },
    {
        id: 'career_platinum',
        name: 'Dieu Serpent',
        description: 'Atteindre le niveau 60 (Rang Platine)',
        icon: '🌟',
        category: 'career',
        rarity: 'epic',
        condition: { type: 'career_level', value: 60 },
        xpReward: 1000
    },
    {
        id: 'career_elite',
        name: 'Ouroboros',
        description: 'Atteindre le niveau 85 (Rang Élite)',
        icon: '🐍',
        category: 'career',
        rarity: 'legendary',
        condition: { type: 'career_level', value: 85 },
        xpReward: 2000
    },
    {
        id: 'career_legend',
        name: 'Try Harder',
        description: 'Atteindre le niveau 100 (Rang Légende)',
        icon: '💪',
        category: 'career',
        rarity: 'legendary',
        condition: { type: 'career_level', value: 100 },
        xpReward: 5000
    },
    {
        id: 'first_teleport',
        name: 'Première Téléportation',
        description: 'Traverser un bord de l\'écran',
        icon: '🌀',
        category: 'career',
        rarity: 'common',
        condition: { type: 'first_teleport', value: 1 },
        xpReward: 150
    },
    {
        id: 'kamikaze',
        name: 'Kamikaze',
        description: 'Mourir en moins de 30 secondes',
        icon: '💥',
        category: 'career',
        rarity: 'common',
        condition: { type: 'quick_death', value: 1 },
        xpReward: 200
    },

    // ===== SECRETS (5) =====
    {
        id: 'secret_ice',
        name: 'Sang Froid',
        description: 'Vaincre CRYO sans jamais être ralenti',
        icon: '🧊',
        category: 'secret',
        rarity: 'legendary',
        condition: { type: 'cryo_no_slow', value: 1 },
        xpReward: 500,
        hidden: true
    },
    {
        id: 'secret_walls',
        name: 'Démolisseur',
        description: 'Détruire 10 murs du TITAN en une run',
        icon: '🧱',
        category: 'secret',
        rarity: 'epic',
        condition: { type: 'titan_walls_destroyed', value: 10 },
        xpReward: 400,
        hidden: true
    },
    {
        id: 'secret_ghost',
        name: 'Exorciste',
        description: 'Vaincre SPECTRE en phase Néant sans prendre de dégâts',
        icon: '👻',
        category: 'secret',
        rarity: 'legendary',
        condition: { type: 'spectre_neant_flawless', value: 1 },
        xpReward: 500,
        hidden: true
    },
    {
        id: 'secret_skip',
        name: 'Minimaliste',
        description: 'Terminer une run en skippant tous les upgrades',
        icon: '🚫',
        category: 'secret',
        rarity: 'legendary',
        condition: { type: 'no_upgrades_run', value: 1 },
        xpReward: 750,
        hidden: true
    },
    {
        id: 'secret_first_try',
        name: 'One Shot',
        description: 'Battre le jeu à ta première run',
        icon: '🎯',
        category: 'secret',
        rarity: 'legendary',
        condition: { type: 'first_run_win', value: 1 },
        xpReward: 1000,
        hidden: true
    }
];

// ========== GESTIONNAIRE D'ACHIEVEMENTS ==========

class AchievementManager {
    constructor() {
        this.unlockedAchievements = [];
        this.stats = this.getDefaultStats();
        this.pendingNotifications = [];
        this.load();
    }

    getDefaultStats() {
        return {
            // Progression
            maxLevelReached: 0,
            totalRuns: 0,
            totalWins: 0,

            // Combat
            bossesKilled: 0,
            bossesKilledByName: {},
            bossFlawlessKills: 0,
            bossSpeedrunKills: 0,
            segmentsStolenTotal: 0,
            swordsCollectedTotal: 0,

            // Collection
            totalApples: 0,
            totalPowerups: 0,
            totalXP: 0,
            bestScore: 0,
            legendaryUpgradesFound: 0,

            // Maîtrise
            maxSegmentsEver: 0,
            maxComboEver: 0,
            wallsGhosted: 0,
            wallsDestroyed: 0,
            enemiesFrozen: 0,
            longestSurvivalTime: 0,

            // Run actuelle (reset à chaque run)
            currentRun: this.getDefaultRunStats()
        };
    }

    getDefaultRunStats() {
        return {
            level: 0,
            score: 0,
            apples: 0,
            upgrades: 0,
            upgradesSkipped: 0,
            segmentsStolen: 0,
            swordsCollected: 0,
            powerupsCollected: 0,
            damageTaken: 0,
            startTime: Date.now(),
            levelsWithoutDeath: 0,
            bossStartSegments: 0,
            poisonHits: 0,
            chargesDodged: 0,
            hadLegendaryUpgrade: false,
            isFirstRun: false
        };
    }

    // ===== PERSISTANCE =====

    load() {
        try {
            const saved = localStorage.getItem('snakeAchievements');
            if (saved) {
                const data = JSON.parse(saved);
                this.unlockedAchievements = data.unlocked || [];
                this.stats = { ...this.getDefaultStats(), ...data.stats };
                this.stats.currentRun = this.getDefaultRunStats();
            }
        } catch (e) {
            console.error('[Achievements] Erreur chargement:', e);
        }
    }

    save() {
        try {
            const data = {
                unlocked: this.unlockedAchievements,
                stats: { ...this.stats, currentRun: null }  // Ne pas sauvegarder la run actuelle
            };
            localStorage.setItem('snakeAchievements', JSON.stringify(data));
        } catch (e) {
            console.error('[Achievements] Erreur sauvegarde:', e);
        }
    }

    // ===== GESTION DES STATS =====

    startNewRun(isFirstRun = false) {
        this.stats.totalRuns++;
        this.stats.currentRun = this.getDefaultRunStats();
        this.stats.currentRun.isFirstRun = isFirstRun && this.stats.totalRuns === 1;
        this.checkAchievements();
        this.save();
    }

    endRun(won = false) {
        const run = this.stats.currentRun;

        // Mettre à jour les stats globales
        if (run.level > this.stats.maxLevelReached) {
            this.stats.maxLevelReached = run.level;
        }
        if (run.score > this.stats.bestScore) {
            this.stats.bestScore = run.score;
        }
        if (won) {
            this.stats.totalWins++;
        }

        // Temps de survie
        const survivalTime = (Date.now() - run.startTime) / 1000;
        if (survivalTime > this.stats.longestSurvivalTime) {
            this.stats.longestSurvivalTime = survivalTime;
        }

        // Vérifier achievements de fin de run
        this.checkRunAchievements(won);

        this.save();
    }

    // ===== MISE À JOUR DES STATS =====

    onLevelComplete(level) {
        this.stats.currentRun.level = level;
        if (level > this.stats.maxLevelReached) {
            this.stats.maxLevelReached = level;
        }
        if (this.stats.currentRun.damageTaken === 0) {
            this.stats.currentRun.levelsWithoutDeath++;
        }
        this.checkAchievements();
        this.save();
    }

    onAppleEaten() {
        this.stats.totalApples++;
        this.stats.currentRun.apples++;
        this.checkAchievements();
    }

    onScoreUpdate(score) {
        this.stats.currentRun.score = score;
        this.checkAchievements();
    }

    onSegmentsUpdate(segments) {
        if (segments > this.stats.maxSegmentsEver) {
            this.stats.maxSegmentsEver = segments;
            this.checkAchievements();
        }
    }

    onComboUpdate(combo) {
        if (combo > this.stats.maxComboEver) {
            this.stats.maxComboEver = combo;
            this.checkAchievements();
        }
    }

    onBossStart(bossSegments) {
        this.stats.currentRun.bossStartSegments = bossSegments;
    }

    onBossKilled(bossName, timeRemaining, playerSegmentsLost) {
        this.stats.bossesKilled++;
        this.stats.bossesKilledByName[bossName] = true;

        // Flawless?
        if (playerSegmentsLost === 0) {
            this.stats.bossFlawlessKills++;
        }

        // Speedrun? (moins de 30s utilisées)
        const timeUsed = this.stats.currentRun.bossStartSegments > 0 ?
            (this.stats.currentRun.bossStartSegments - timeRemaining) : 0;
        // Note: On considère speedrun si le timer restant est > 90s sur un boss de 120s (donc < 30s utilisées)
        if (timeRemaining > 90) {
            this.stats.bossSpeedrunKills++;
        }

        this.checkAchievements();
        this.save();
    }

    onSegmentsStolen(count) {
        this.stats.segmentsStolenTotal += count;
        this.stats.currentRun.segmentsStolen += count;
        this.checkAchievements();
    }

    onSwordCollected() {
        this.stats.swordsCollectedTotal++;
        this.stats.currentRun.swordsCollected++;
        this.checkAchievements();
    }

    onPowerupCollected() {
        this.stats.totalPowerups++;
        this.stats.currentRun.powerupsCollected++;
        this.checkAchievements();
    }

    onUpgradeSelected(upgrade) {
        this.stats.currentRun.upgrades++;
        if (upgrade.rarity === 'legendary') {
            this.stats.legendaryUpgradesFound++;
            this.stats.currentRun.hadLegendaryUpgrade = true;
        }
        this.checkAchievements();
    }

    onUpgradeSkipped() {
        this.stats.currentRun.upgradesSkipped++;
    }

    onDamageTaken() {
        this.stats.currentRun.damageTaken++;
        this.stats.currentRun.levelsWithoutDeath = 0;
    }

    onWallGhosted() {
        this.stats.wallsGhosted++;
        this.checkAchievements();
    }

    onWallDestroyed() {
        this.stats.wallsDestroyed++;
        this.checkAchievements();
    }

    onEnemyFrozen() {
        this.stats.enemiesFrozen++;
        this.checkAchievements();
    }

    onPoisonHit() {
        this.stats.currentRun.poisonHits++;
    }

    onChargeDodged() {
        this.stats.currentRun.chargesDodged++;
        this.checkAchievements();
    }

    onXPEarned(xp) {
        this.stats.totalXP += xp;
        this.checkAchievements();
    }

    // ===== VÉRIFICATION DES ACHIEVEMENTS =====

    checkAchievements() {
        for (const achievement of ACHIEVEMENTS) {
            if (this.isUnlocked(achievement.id)) continue;

            if (this.checkCondition(achievement.condition)) {
                this.unlock(achievement);
            }
        }
    }

    checkRunAchievements(won) {
        const run = this.stats.currentRun;

        // No upgrades run
        if (won && run.upgrades === 0 && run.upgradesSkipped > 0) {
            const ach = ACHIEVEMENTS.find(a => a.id === 'secret_skip');
            if (ach && !this.isUnlocked('secret_skip')) {
                this.unlock(ach);
            }
        }

        // First run win
        if (won && run.isFirstRun) {
            const ach = ACHIEVEMENTS.find(a => a.id === 'secret_first_try');
            if (ach && !this.isUnlocked('secret_first_try')) {
                this.unlock(ach);
            }
        }

        // Note: Les achievements secrets boss sont vérifiés via le système de combat
        // (cryo_no_slow, titan_walls_destroyed, spectre_neant_flawless)

        this.checkAchievements();
    }

    checkCondition(condition) {
        const { type, value } = condition;
        const run = this.stats.currentRun;

        switch (type) {
            case 'level_complete':
                return this.stats.maxLevelReached >= value;

            case 'total_runs':
                return this.stats.totalRuns >= value;

            case 'boss_killed':
                return this.stats.bossesKilled >= value;

            case 'specific_boss':
                return this.stats.bossesKilledByName[value] === true;

            case 'all_bosses':
                return Object.keys(this.stats.bossesKilledByName).length >= value;

            case 'boss_flawless':
                return this.stats.bossFlawlessKills >= value;

            case 'boss_speedrun':
                return this.stats.bossSpeedrunKills >= value;

            case 'segments_stolen_run':
                return run.segmentsStolen >= value;

            case 'swords_collected_run':
                return run.swordsCollected >= value;

            case 'total_apples':
                return this.stats.totalApples >= value;

            case 'score_run':
                return run.score >= value;

            case 'upgrades_run':
                return run.upgrades >= value;

            case 'legendary_upgrade':
                return this.stats.legendaryUpgradesFound >= value;

            case 'total_powerups':
                return this.stats.totalPowerups >= value;

            case 'total_xp':
                return this.stats.totalXP >= value;

            case 'max_segments':
                return this.stats.maxSegmentsEver >= value;

            case 'max_combo':
                return this.stats.maxComboEver >= value;

            case 'walls_ghosted':
                return this.stats.wallsGhosted >= value;

            case 'walls_destroyed':
                return this.stats.wallsDestroyed >= value;

            case 'enemies_frozen':
                return this.stats.enemiesFrozen >= value;

            case 'survival_time':
                return this.stats.longestSurvivalTime >= value;

            case 'levels_no_death':
                // Finir X niveaux sans prendre de dégât dans la run
                return run.level >= value && run.damageTaken === 0;

            case 'no_hit_level':
                return run.levelsWithoutDeath >= 1 && run.damageTaken === 0;

            case 'titan_dodges':
                return run.chargesDodged >= value;

            // ===== CONDITIONS CARRIÈRE GLOBALE =====
            case 'career_level':
                return (window.career?.level || 0) >= value;

            case 'first_teleport':
                return (window.career?.firstTeleport || 0) >= value;

            case 'quick_death':
                return (window.career?.quickDeaths || 0) >= value;

            default:
                return false;
        }
    }

    // ===== UNLOCK =====

    unlock(achievement) {
        // Double-check: ne JAMAIS débloquer un achievement déjà débloqué
        if (this.isUnlocked(achievement.id)) {
            logger.warn(`[Achievements] ⚠️ Tentative de re-déblocage ignorée: ${achievement.id}`);
            return;
        }

        logger.log(`[Achievements] ✅ Déblocage: ${achievement.id} - ${achievement.name}`);

        this.unlockedAchievements.push({
            id: achievement.id,
            unlockedAt: Date.now()
        });

        // Sauvegarder IMMÉDIATEMENT pour éviter les doublons
        this.save();

        // Ajouter à la file de notifications
        this.pendingNotifications.push(achievement);

        // Afficher la notification
        this.showNotification(achievement);

        // Vérifier si des skins sont liés à cet achievement
        if (window.boxManager && window.boxManager.checkAchievementUnlocks) {
            window.boxManager.checkAchievementUnlocks(achievement.id);
        }
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.some(a => a.id === achievementId);
    }

    // ===== NOTIFICATION =====

    showNotification(achievement) {
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = `achievement-notification rarity-${achievement.rarity}`;
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">🏆 Achievement Débloqué!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
                <div class="achievement-xp">+${achievement.xpReward} XP</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => notification.classList.add('show'), 10);

        // Retirer après 4 secondes
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    // ===== GETTERS =====

    getAll() {
        return ACHIEVEMENTS;
    }

    getUnlocked() {
        return ACHIEVEMENTS.filter(a => this.isUnlocked(a.id));
    }

    getLocked() {
        return ACHIEVEMENTS.filter(a => !this.isUnlocked(a.id));
    }

    getByCategory(category) {
        return ACHIEVEMENTS.filter(a => a.category === category);
    }

    getProgress() {
        return {
            unlocked: this.unlockedAchievements.length,
            total: ACHIEVEMENTS.length,
            percent: Math.floor((this.unlockedAchievements.length / ACHIEVEMENTS.length) * 100)
        };
    }

    getStats() {
        return this.stats;
    }
}

// Export singleton
export const achievementManager = new AchievementManager();

// Exposer sur window pour accès global (navigation.js)
window.achievementManager = achievementManager;

export default achievementManager;
