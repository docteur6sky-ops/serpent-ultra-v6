/**
 * BOSS RUSH MANAGER
 * Mode de jeu : 4 combats de boss enchaînés
 *
 * Réutilise le système de boss du mode roguelike (solo-game.js)
 * mais sans les upgrades entre les niveaux.
 */

import { logger } from '../services/logger.js';
import { ROGUELIKE_LEVELS } from '../roguelike/levels.js';

// ============================================
// CONFIGURATION DES BOSS RUSH
// ============================================

// Les 4 boss du mode Rush - liés aux vrais boss du roguelike (levels 5, 10, 15, 20)
const BOSS_RUSH_STAGES = [
    {
        stage: 1,
        bossLevel: 5,   // TITAN (boss murs) - Phases: wall_spawn
        name: "TITAN",
        subtitle: "Le Bâtisseur",
        difficulty: "Facile",
        color: "#8B4513",
        reward: { xp: 100, coins: 25 }
    },
    {
        stage: 2,
        bossLevel: 10,  // CRYO (boss glace) - Phases: ice_zone
        name: "CRYO",
        subtitle: "Le Serpent de Glace",
        difficulty: "Normal",
        color: "#00BFFF",
        reward: { xp: 200, coins: 50 }
    },
    {
        stage: 3,
        bossLevel: 15,  // SPECTRE (boss fantôme) - Phases: skull_spawn, invisibilité
        name: "SPECTRE",
        subtitle: "Le Fantôme",
        difficulty: "Difficile",
        color: "#9932CC",
        reward: { xp: 300, coins: 75 }
    },
    {
        stage: 4,
        bossLevel: 20,  // FOUDRE (boss final) - Phases: lightning_line
        name: "FOUDRE",
        subtitle: "L'Éclair Ultime",
        difficulty: "Extrême",
        color: "#FFD700",
        reward: { xp: 500, coins: 150 }
    }
];

// ============================================
// CLASSE BOSS RUSH MANAGER
// ============================================

class BossRushManager {
    constructor() {
        this.currentRun = null;
        this.stats = this.loadStats();

        // Callbacks
        this.onStageStart = null;
        this.onStageComplete = null;
        this.onRunEnd = null;

        logger.log('[BossRush] Manager initialisé');
    }

    // ============================================
    // GESTION DES RUNS
    // ============================================

    /**
     * Démarre une nouvelle run Boss Rush
     */
    startNewRun() {
        this.currentRun = {
            stage: 1,
            startTime: Date.now(),
            stageTimes: [],
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            completed: false
        };

        logger.log('[BossRush] Nouvelle run démarrée');

        // Démarrer le premier boss
        this.startStage(1);

        return this.currentRun;
    }

    /**
     * Démarre un stage spécifique
     */
    startStage(stageNum) {
        if (!this.currentRun) {
            logger.error('[BossRush] Pas de run active');
            return;
        }

        const stageConfig = BOSS_RUSH_STAGES.find(s => s.stage === stageNum);
        if (!stageConfig) {
            logger.error(`[BossRush] Stage ${stageNum} introuvable`);
            return;
        }

        // Récupérer les données COMPLÈTES du boss depuis roguelike (avec bossPhases!)
        const bossLevelData = ROGUELIKE_LEVELS.find(l => l.level === stageConfig.bossLevel);
        if (!bossLevelData) {
            logger.error(`[BossRush] Boss level ${stageConfig.bossLevel} introuvable`);
            return;
        }

        this.currentRun.stage = stageNum;
        this.currentRun.stageStartTime = Date.now();
        this.currentRun.currentStageConfig = stageConfig;

        logger.log(`[BossRush] Stage ${stageNum} - ${stageConfig.name}`);
        logger.log(`[BossRush] Boss data:`, {
            bossSpeed: bossLevelData.bossSpeed,
            bossAggression: bossLevelData.bossAggression,
            bossMoveInterval: bossLevelData.bossMoveInterval,
            bossPhases: bossLevelData.bossPhases?.length || 0
        });

        // Créer la config complète pour soloGame.startBossRushBattle()
        // IMPORTANT: Inclure TOUTES les données du boss roguelike (phases, comportements, etc.)
        const fullStageConfig = {
            stage: stageNum,
            name: stageConfig.name,
            subtitle: stageConfig.subtitle,
            difficulty: stageConfig.difficulty,
            color: stageConfig.color,
            reward: stageConfig.reward,
            // Données du boss depuis roguelike levels
            bossSegments: bossLevelData.objective.bossSegments || 15,
            timeLimit: bossLevelData.objective.timeLimit || 120,
            // Paramètres de vitesse et comportement du boss
            bossSpeed: bossLevelData.bossSpeed || 1.0,
            bossAggression: bossLevelData.bossAggression || 0.5,
            bossMoveInterval: bossLevelData.bossMoveInterval || 250,
            bossGraceDelay: bossLevelData.bossGraceDelay || 2,
            // IMPORTANT: Les phases du boss avec comportements spéciaux!
            bossPhases: bossLevelData.bossPhases || null,
            // Thème visuel
            visualTheme: bossLevelData.visualTheme || 'forest',
            playerStartSize: 10,  // Toujours 10 segments en Boss Rush
            modifiers: {}
        };

        // Notifier l'UI
        if (this.onStageStart) {
            this.onStageStart(fullStageConfig);
        }

        // Créer l'instance soloGame si nécessaire
        if (!window.soloGame) {
            if (window.SoloSnakeGame) {
                window.soloGame = new window.SoloSnakeGame();
            } else {
                logger.error('[BossRush] SoloSnakeGame non disponible');
                return;
            }
        }

        // Afficher l'écran de jeu
        if (window.screenManager) {
            window.screenManager.show('game-solo');
        }

        // Démarrer le combat de boss via la nouvelle méthode
        window.soloGame.startBossRushBattle(fullStageConfig);

        return fullStageConfig;
    }

    /**
     * Stage complété (boss vaincu)
     */
    onBossDefeated(bossStats = {}) {
        if (!this.currentRun) return;

        const stageTime = (Date.now() - this.currentRun.stageStartTime) / 1000;
        this.currentRun.stageTimes.push(stageTime);
        this.currentRun.totalDamageDealt += bossStats.damageDealt || 0;
        this.currentRun.totalDamageTaken += bossStats.damageTaken || 0;

        const currentStage = this.currentRun.stage;
        const stageConfig = BOSS_RUSH_STAGES.find(s => s.stage === currentStage);

        logger.log(`[BossRush] Stage ${currentStage} complété en ${stageTime.toFixed(1)}s`);

        // Notifier l'UI
        if (this.onStageComplete) {
            this.onStageComplete(stageConfig, stageTime);
        }

        // Vérifier si c'était le dernier boss
        if (currentStage >= 4) {
            this.completeRun();
        } else {
            // Afficher écran de transition puis passer au boss suivant
            this.showStageTransition(currentStage + 1);
        }
    }

    /**
     * Affiche l'écran de transition entre les boss
     */
    showStageTransition(nextStage) {
        const nextConfig = BOSS_RUSH_STAGES.find(s => s.stage === nextStage);

        // Afficher l'UI de transition
        if (window.bossRushUI) {
            window.bossRushUI.showTransition(nextConfig, () => {
                this.startStage(nextStage);
            });
        } else {
            // Fallback : démarrer directement
            setTimeout(() => this.startStage(nextStage), 2000);
        }
    }

    /**
     * Run complétée (4 boss vaincus)
     */
    completeRun() {
        if (!this.currentRun) return;

        this.currentRun.completed = true;
        const totalTime = (Date.now() - this.currentRun.startTime) / 1000;

        const finalStats = {
            completed: true,
            totalTime,
            stageTimes: this.currentRun.stageTimes,
            totalDamageDealt: this.currentRun.totalDamageDealt,
            totalDamageTaken: this.currentRun.totalDamageTaken
        };

        // Calculer récompenses totales
        const totalReward = BOSS_RUSH_STAGES.reduce((acc, stage) => ({
            xp: acc.xp + stage.reward.xp,
            coins: acc.coins + stage.reward.coins
        }), { xp: 0, coins: 0 });

        finalStats.earnedXP = totalReward.xp;
        finalStats.earnedCoins = totalReward.coins;

        // Mettre à jour les stats
        this.stats.totalRuns++;
        this.stats.completedRuns++;
        if (!this.stats.bestTime || totalTime < this.stats.bestTime) {
            this.stats.bestTime = totalTime;
        }
        this.saveStats();

        // Donner les récompenses
        if (window.careerManager) {
            window.careerManager.addXP(totalReward.xp);
        }
        if (window.boxManager) {
            window.boxManager.addCoins(totalReward.coins, 'Boss Rush complété');
        }

        logger.log('[BossRush] Run complétée!', finalStats);

        // Afficher l'écran de fin
        if (window.bossRushUI) {
            window.bossRushUI.showEndScreen(finalStats);
        }

        // Notifier callback si défini
        if (this.onRunEnd) {
            this.onRunEnd(finalStats);
        }

        this.currentRun = null;
    }

    /**
     * Joueur mort (game over)
     */
    onPlayerDeath() {
        if (!this.currentRun) return;

        const stage = this.currentRun.stage;
        const totalTime = (Date.now() - this.currentRun.startTime) / 1000;

        const finalStats = {
            completed: false,
            stageReached: stage,
            totalTime,
            stageTimes: this.currentRun.stageTimes
        };

        // XP partiel (100 XP par boss vaincu)
        const bossesDefeated = stage - 1;
        const partialXP = bossesDefeated * 100;
        finalStats.earnedXP = partialXP;

        // Mettre à jour stats
        this.stats.totalRuns++;
        if (stage > this.stats.bestStage) {
            this.stats.bestStage = stage;
        }
        this.saveStats();

        // Donner XP partiel
        if (window.careerManager && partialXP > 0) {
            window.careerManager.addXP(partialXP);
        }

        logger.log(`[BossRush] Game Over au stage ${stage}`, finalStats);

        // Afficher l'écran de fin
        if (window.bossRushUI) {
            window.bossRushUI.showEndScreen(finalStats);
        }

        // Notifier callback si défini
        if (this.onRunEnd) {
            this.onRunEnd(finalStats);
        }

        this.currentRun = null;
    }

    // ============================================
    // STATS & SAUVEGARDE
    // ============================================

    loadStats() {
        try {
            const saved = localStorage.getItem('bossRushStats');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            logger.error('[BossRush] Erreur chargement stats:', e);
        }

        return {
            totalRuns: 0,
            completedRuns: 0,
            bestStage: 0,
            bestTime: null
        };
    }

    saveStats() {
        try {
            localStorage.setItem('bossRushStats', JSON.stringify(this.stats));
        } catch (e) {
            logger.error('[BossRush] Erreur sauvegarde stats:', e);
        }
    }

    // ============================================
    // GETTERS
    // ============================================

    get isRunActive() {
        return this.currentRun !== null;
    }

    get currentStage() {
        return this.currentRun?.stage || 0;
    }

    getStageConfig(stageNum) {
        return BOSS_RUSH_STAGES.find(s => s.stage === stageNum);
    }

    getAllStages() {
        return BOSS_RUSH_STAGES;
    }
}

// ============================================
// INSTANCE SINGLETON & EXPORTS
// ============================================

const bossRushManager = new BossRushManager();

// Exposer globalement
window.bossRushManager = bossRushManager;

export { bossRushManager, BossRushManager, BOSS_RUSH_STAGES };
export default bossRushManager;
