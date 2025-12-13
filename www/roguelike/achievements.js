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
        xpReward: 50  // Common = 50
    },
    {
        id: 'world_1_clear',
        name: 'Explorateur des Grottes',
        description: 'Terminer le monde 1 - Grotte (niveau 5)',
        icon: '🦇',
        category: 'progression',
        rarity: 'common',
        condition: { type: 'level_complete', value: 5 },
        xpReward: 50  // Common = 50
    },
    {
        id: 'world_2_clear',
        name: 'Alpiniste Glacé',
        description: 'Terminer le monde 2 - Pic Enneigé (niveau 10)',
        icon: '🏔️',
        category: 'progression',
        rarity: 'rare',
        condition: { type: 'level_complete', value: 10 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'world_3_clear',
        name: 'Fossoyeur',
        description: 'Terminer le monde 3 - Cimetière (niveau 15)',
        icon: '⚰️',
        category: 'progression',
        rarity: 'epic',
        condition: { type: 'level_complete', value: 15 },
        xpReward: 350  // Epic = 350
    },
    {
        id: 'world_4_clear',
        name: 'Court-Circuit',
        description: 'Terminer le monde 4 - Centrale Électrique (niveau 20)',
        icon: '🔌',
        category: 'progression',
        rarity: 'legendary',
        condition: { type: 'level_complete', value: 20 },
        xpReward: 750  // Legendary = 750
    },
    {
        id: 'runs_5',
        name: 'Persévérant',
        description: 'Faire 5 runs',
        icon: '🔄',
        category: 'progression',
        rarity: 'common',
        condition: { type: 'total_runs', value: 5 },
        xpReward: 50  // Common = 50
    },
    {
        id: 'runs_15',
        name: 'Vétéran',
        description: 'Faire 15 runs',
        icon: '🎖️',
        category: 'progression',
        rarity: 'rare',
        condition: { type: 'total_runs', value: 15 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'runs_50',
        name: 'Graine de Champion',
        description: 'Faire 50 runs',
        icon: '🏆',
        category: 'progression',
        rarity: 'epic',
        condition: { type: 'total_runs', value: 50 },
        xpReward: 350  // Epic = 350
    },
    {
        id: 'endless_25',
        name: 'Sans Limites',
        description: 'Atteindre le niveau 25',
        icon: '♾️',
        category: 'progression',
        rarity: 'epic',
        condition: { type: 'level_complete', value: 25 },
        xpReward: 350  // Epic = 350
    },
    {
        id: 'endless_30',
        name: 'Immortel',
        description: 'Atteindre le niveau 30',
        icon: '⭐',
        category: 'progression',
        rarity: 'legendary',
        condition: { type: 'level_complete', value: 30 },
        xpReward: 750  // Legendary = 750
    },

    // ===== COMBAT (9) =====
    {
        id: 'boss_titan',
        name: 'Titan Terrassé',
        description: 'Vaincre TITAN (Boss Grotte)',
        icon: '🗿',
        category: 'combat',
        rarity: 'common',
        condition: { type: 'specific_boss', value: 'TITAN' },
        xpReward: 50  // Common = 50
    },
    {
        id: 'boss_cryo',
        name: 'Briseur de Glace',
        description: 'Vaincre CRYO (Boss Pic Enneigé)',
        icon: '❄️',
        category: 'combat',
        rarity: 'rare',
        condition: { type: 'specific_boss', value: 'CRYO' },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'boss_spectre',
        name: 'Chasseur de Fantômes',
        description: 'Vaincre SPECTRE (Boss Cimetière)',
        icon: '👻',
        category: 'combat',
        rarity: 'epic',
        condition: { type: 'specific_boss', value: 'SPECTRE' },
        xpReward: 350  // Epic = 350
    },
    {
        id: 'boss_foudre',
        name: 'Maître de la Foudre',
        description: 'Vaincre FOUDRE (Boss Centrale)',
        icon: '⚡',
        category: 'combat',
        rarity: 'legendary',
        condition: { type: 'specific_boss', value: 'FOUDRE' },
        xpReward: 750  // Legendary = 750
    },
    {
        id: 'boss_flawless',
        name: 'Sans Égratignure',
        description: 'Vaincre un boss sans perdre de segment',
        icon: '💎',
        category: 'combat',
        rarity: 'epic',
        condition: { type: 'boss_flawless', value: 1 },
        xpReward: 350  // Epic = 350
    },
    {
        id: 'boss_speedrun',
        name: 'Tueur à Gage',
        description: 'Vaincre un boss en moins de 1 minute',
        icon: '🏎️',
        category: 'combat',
        rarity: 'epic',
        condition: { type: 'boss_speedrun', value: 60 },
        xpReward: 350  // Epic = 350
    },
    {
        id: 'steal_5_single',
        name: 'Voleur de Segments',
        description: 'Voler 5 segments en un seul coup',
        icon: '🗡️',
        category: 'combat',
        rarity: 'rare',
        condition: { type: 'max_single_hit', value: 5 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'sword_master',
        name: 'Maître de l\'Épée',
        description: 'Ramasser 5 épées contre le même boss',
        icon: '🤺',
        category: 'combat',
        rarity: 'rare',
        condition: { type: 'swords_per_boss', value: 5 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'boss_all',
        name: 'Chasseur Ultime',
        description: 'Vaincre tous les boss',
        icon: '🎯',
        category: 'combat',
        rarity: 'legendary',
        condition: { type: 'all_bosses', value: 4 },
        xpReward: 750  // Legendary = 750
    },

    // ===== COLLECTION (10) =====
    {
        id: 'apples_50',
        name: 'Cueilleur',
        description: 'Manger 50 pommes au total',
        icon: '🍎',
        category: 'collection',
        rarity: 'common',
        condition: { type: 'total_apples', value: 50 },
        xpReward: 50  // Common = 50
    },
    {
        id: 'apples_250',
        name: 'Gourmand',
        description: 'Manger 250 pommes au total',
        icon: '🍏',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'total_apples', value: 250 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'apples_500',
        name: 'Insatiable',
        description: 'Manger 500 pommes au total',
        icon: '🥧',
        category: 'collection',
        rarity: 'epic',
        condition: { type: 'total_apples', value: 500 },
        xpReward: 350  // Epic = 350
    },
    {
        id: 'xp_5000_run',
        name: 'Scorer',
        description: 'Gagner 5 000 XP en une run',
        icon: '📊',
        category: 'collection',
        rarity: 'common',
        condition: { type: 'xp_run', value: 5000 },
        xpReward: 50  // Common = 50
    },
    {
        id: 'xp_10000_run',
        name: 'High Scorer',
        description: 'Gagner 10 000 XP en une run',
        icon: '📈',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'xp_run', value: 10000 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'xp_30000_run',
        name: 'Score Legend',
        description: 'Gagner 30 000 XP en une run',
        icon: '💯',
        category: 'collection',
        rarity: 'epic',
        condition: { type: 'xp_run', value: 30000 },
        xpReward: 350  // Epic = 350
    },
    {
        id: 'upgrades_10',
        name: 'Collecteur',
        description: 'Collecter 10 upgrades en une run',
        icon: '📦',
        category: 'collection',
        rarity: 'common',
        condition: { type: 'upgrades_run', value: 10 },
        xpReward: 50  // Common = 50
    },
    {
        id: 'upgrades_legendary',
        name: 'Chanceux',
        description: 'Obtenir un upgrade légendaire',
        icon: '🎰',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'legendary_upgrade', value: 1 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'powerups_50',
        name: 'Power Hungry',
        description: 'Ramasser 50 power-ups au total',
        icon: '🎁',
        category: 'collection',
        rarity: 'rare',
        condition: { type: 'total_powerups', value: 50 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'xp_500000',
        name: 'Expérimenté',
        description: 'Accumuler 500 000 XP au total',
        icon: '✨',
        category: 'collection',
        rarity: 'legendary',
        condition: { type: 'total_xp', value: 500000 },
        xpReward: 750  // Legendary = 750
    },

    // ===== MAÎTRISE (11) =====
    {
        id: 'no_hit_level',
        name: 'Intouchable',
        description: 'Terminer un niveau sans prendre de dégât',
        icon: '🛡️',
        category: 'mastery',
        rarity: 'common',
        condition: { type: 'no_hit_level', value: 1 },
        xpReward: 50  // Common = 50
    },
    {
        id: 'long_snake',
        name: 'Long Serpent',
        description: 'Avoir 25 segments en même temps',
        icon: '🐍',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'max_segments', value: 25 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'giant_snake',
        name: 'Serpent Géant',
        description: 'Avoir 50 segments en même temps',
        icon: '🐉',
        category: 'mastery',
        rarity: 'epic',
        condition: { type: 'max_segments', value: 50 },
        xpReward: 350  // Epic = 350
    },
    {
        id: 'combo_25',
        name: 'Combo King',
        description: 'Atteindre un combo x25',
        icon: '💥',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'max_combo', value: 25 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'ghost_master',
        name: 'Fantôme',
        description: 'Traverser 20 murs en mode ghost',
        icon: '🌫️',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'walls_ghosted', value: 20 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'fire_destroyer',
        name: 'Pyromane',
        description: 'Détruire 30 murs avec le power-up feu',
        icon: '🔥',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'walls_destroyed', value: 30 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'ice_master',
        name: 'Cryomancien',
        description: 'Geler des ennemis 20 fois',
        icon: '🧊',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'enemies_frozen', value: 20 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'survivor',
        name: 'Survivant',
        description: 'Survivre 5 minutes en une run',
        icon: '⏱️',
        category: 'mastery',
        rarity: 'common',
        condition: { type: 'survival_time', value: 300 },
        xpReward: 50  // Common = 50
    },
    {
        id: 'marathon',
        name: 'Marathon',
        description: 'Survivre 10 minutes en une run',
        icon: '🏃',
        category: 'mastery',
        rarity: 'rare',
        condition: { type: 'survival_time', value: 600 },
        xpReward: 150  // Rare = 150
    },
    {
        id: 'perfect_run',
        name: 'Run Parfaite',
        description: 'Terminer 5 niveaux sans prendre de dégât',
        icon: '💫',
        category: 'mastery',
        rarity: 'epic',
        condition: { type: 'levels_no_death', value: 5 },
        xpReward: 350  // Epic = 350
    },

    // ===== DIVERS (2) =====
    // Achievements uniques roguelike
    {
        id: 'first_teleport',
        name: 'À Travers l\'Écran',
        description: 'Traverser un bord de l\'écran pour la première fois',
        icon: '🧱',
        category: 'mastery',
        rarity: 'common',
        condition: { type: 'first_teleport', value: 1 },
        xpReward: 50
    },
    {
        id: 'kamikaze',
        name: 'Kamikaze',
        description: 'Mourir en moins de 30 secondes',
        icon: '💀',
        category: 'secret',
        rarity: 'legendary',
        condition: { type: 'quick_death', value: 1 },
        xpReward: 750,  // Legendary = 750
        hidden: true
    },

    // ===== SECRETS (6) =====
    {
        id: 'secret_ice',
        name: 'Sang Froid',
        description: 'Vaincre CRYO sans jamais être ralenti',
        icon: '🥶',
        category: 'secret',
        rarity: 'legendary',
        condition: { type: 'cryo_no_slow', value: 1 },
        xpReward: 750,  // Legendary = 750
        hidden: true
    },
    {
        id: 'secret_walls',
        name: 'Démolisseur',
        description: 'Détruire 10 murs du TITAN en une run',
        icon: '🧱',
        category: 'secret',
        rarity: 'legendary',
        condition: { type: 'titan_walls_destroyed', value: 10 },
        xpReward: 750,  // Legendary = 750
        hidden: true
    },
    {
        id: 'secret_ghost',
        name: 'Exorciste',
        description: 'Vaincre SPECTRE en phase Néant sans dégâts',
        icon: '☠️',
        category: 'secret',
        rarity: 'legendary',
        condition: { type: 'spectre_neant_flawless', value: 1 },
        xpReward: 750,  // Legendary = 750
        hidden: true
    },
    {
        id: 'secret_skip',
        name: 'Minimaliste',
        description: 'Terminer une run sans prendre aucun upgrade',
        icon: '🚫',
        category: 'secret',
        rarity: 'legendary',
        condition: { type: 'no_upgrades_run', value: 1 },
        xpReward: 750,  // Legendary = 750
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
        xpReward: 750,  // Legendary = 750
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

            // Secrets
            cryoNoSlowKill: 0,        // Nombre de fois CRYO battu sans ralentissement
            spectreNeantFlawless: 0,  // Nombre de fois SPECTRE battu en Néant sans dégâts

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
            isFirstRun: false,
            // XP tracking
            xpEarned: 0,                // XP gagnée cette run
            // Combat tracking
            maxSingleHitDamage: 0,      // Max dégâts en un seul coup
            swordsThisBoss: 0,          // Épées ramassées contre le boss actuel
            // Secrets tracking
            titanWallsDestroyed: 0,     // Murs du TITAN détruits cette run
            wasSlowedByCryo: false,     // A été ralenti par CRYO?
            spectreNeantDamage: 0       // Dégâts pris en phase Néant
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
        // Track max single hit damage
        if (count > this.stats.currentRun.maxSingleHitDamage) {
            this.stats.currentRun.maxSingleHitDamage = count;
        }
        this.checkAchievements();
    }

    onSwordCollected() {
        this.stats.swordsCollectedTotal++;
        this.stats.currentRun.swordsCollected++;
        this.stats.currentRun.swordsThisBoss++;
        this.checkAchievements();
    }

    onBossFightStart() {
        // Reset compteur épées pour ce boss
        this.stats.currentRun.swordsThisBoss = 0;
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
        this.stats.currentRun.xpEarned += xp;
        this.checkAchievements();
    }

    // ===== TRACKING SECRETS =====

    onTitanWallDestroyed() {
        this.stats.currentRun.titanWallsDestroyed++;
        this.checkAchievements();
    }

    onSlowedByCryo() {
        this.stats.currentRun.wasSlowedByCryo = true;
    }

    onSpectreNeantDamage() {
        this.stats.currentRun.spectreNeantDamage++;
    }

    onCryoKilled() {
        // Si pas ralenti pendant le combat, achievement secret!
        if (!this.stats.currentRun.wasSlowedByCryo) {
            this.stats.cryoNoSlowKill++;
            this.checkAchievements();
        }
    }

    onSpectreKilled() {
        // Si pas de dégâts en phase Néant, achievement secret!
        if (this.stats.currentRun.spectreNeantDamage === 0) {
            this.stats.spectreNeantFlawless++;
            this.checkAchievements();
        }
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

            case 'max_single_hit':
                return run.maxSingleHitDamage >= value;

            case 'swords_per_boss':
                return run.swordsThisBoss >= value;

            case 'total_apples':
                return this.stats.totalApples >= value;

            case 'score_run':
                return run.score >= value;

            case 'xp_run':
                return run.xpEarned >= value;

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

            // ===== CONDITIONS SECRÈTES =====
            case 'cryo_no_slow':
                // Vérifié lors du boss kill - stats.cryoNoSlowKill
                return this.stats.cryoNoSlowKill >= value;

            case 'titan_walls_destroyed':
                // Murs du TITAN détruits pendant la run
                return run.titanWallsDestroyed >= value;

            case 'spectre_neant_flawless':
                // Vérifié lors du boss kill - stats.spectreNeantFlawless
                return this.stats.spectreNeantFlawless >= value;

            case 'no_upgrades_run':
                // Vérifié dans checkRunAchievements
                return false;  // Géré séparément

            case 'first_run_win':
                // Vérifié dans checkRunAchievements
                return false;  // Géré séparément

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
