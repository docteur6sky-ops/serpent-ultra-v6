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
// Total: 2500 XP, 1300 Gold
const BOSS_RUSH_STAGES = [
    {
        stage: 1,
        bossLevel: 5,   // TITAN (boss murs) - Phases: wall_spawn
        name: "TITAN",
        subtitle: "Le Bâtisseur",
        difficulty: "Facile",
        color: "#8B4513",
        reward: { xp: 250, coins: 200 }
    },
    {
        stage: 2,
        bossLevel: 10,  // CRYO (boss glace) - Phases: ice_zone
        name: "CRYO",
        subtitle: "Le Serpent de Glace",
        difficulty: "Normal",
        color: "#00BFFF",
        reward: { xp: 500, coins: 200 }
    },
    {
        stage: 3,
        bossLevel: 15,  // SPECTRE (boss fantôme) - Phases: skull_spawn, invisibilité
        name: "SPECTRE",
        subtitle: "Le Fantôme",
        difficulty: "Difficile",
        color: "#9932CC",
        reward: { xp: 750, coins: 200 }
    },
    {
        stage: 4,
        bossLevel: 20,  // FOUDRE (boss final) - Phases: lightning_line + bonus
        name: "FOUDRE",
        subtitle: "L'Éclair Ultime",
        difficulty: "Extrême",
        color: "#FFD700",
        reward: { xp: 1000, coins: 700 }  // 200 base + 500 bonus
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

        // Mettre à jour stats CareerManager
        this.updateCareerStat('bossRushRuns', 1);

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

        // 🎨 Changer le background selon le boss (APRÈS screenManager pour éviter écrasement)
        // Boss 1: roche, Boss 2: glace, Boss 3: ghost, Boss 4: foudre
        if (window.backgroundManager) {
            window.backgroundManager.setStageBackground(stageNum, 'boss-rush');
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

        // Tracker le kill du boss dans CareerManager
        this.trackBossKill(currentStage);

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

        // Mettre à jour les stats locales
        this.stats.totalRuns++;
        this.stats.completedRuns++;
        if (!this.stats.bestTime || totalTime < this.stats.bestTime) {
            this.stats.bestTime = totalTime;
        }
        this.saveStats();

        // Mettre à jour CareerManager
        this.updateCareerStat('bossRushCompletions', 1);

        // Run parfaite (sans dégâts)
        if (this.currentRun.totalDamageTaken === 0) {
            this.updateCareerStat('bossRushPerfectRuns', 1);
            finalStats.isPerfect = true;
            logger.log('[BossRush] Run parfaite! (0 dégâts)');
        }

        // Run rapide (< 5 minutes = 300 secondes)
        if (totalTime < 300) {
            this.updateCareerStat('bossRushFastRuns', 1);
            finalStats.isFast = true;
            logger.log(`[BossRush] Run rapide! (${totalTime.toFixed(1)}s < 5min)`);
        }

        // Meilleur temps
        this.updateCareerBestTime(totalTime);

        // Donner les récompenses
        if (window.careerManager) {
            window.careerManager.addXP(totalReward.xp);
        }
        if (window.boxManager) {
            window.boxManager.addCoins(totalReward.coins, 'Boss Rush complété');
        }

        // Vérifier les trophées
        if (window.trophyManager) {
            window.trophyManager.checkTrophies();
        }

        logger.log('[BossRush] Run complétée!', finalStats);

        // Soumettre au leaderboard mondial Firebase (victoire = bonus 10000 + temps inversé)
        if (window.firebaseUI) {
            // Score: 10000 (victoire) + bonus temps (plus rapide = plus de points)
            const timeBonus = Math.max(0, Math.floor(600 - totalTime) * 10); // Bonus max si < 10min
            const score = 10000 + timeBonus;
            window.firebaseUI.submitAndShowResult('bossrush', score, {
                stageReached: 4,
                totalTime: Math.floor(totalTime),
                bossesDefeated: 4,
                completed: true,
                isPerfect: finalStats.isPerfect || false
            });
        }

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

        // XP et Gold partiels (récompenses des boss vaincus)
        const bossesDefeated = stage - 1;
        let partialXP = 0;
        let partialCoins = 0;
        for (let i = 0; i < bossesDefeated; i++) {
            partialXP += BOSS_RUSH_STAGES[i].reward.xp;
            partialCoins += BOSS_RUSH_STAGES[i].reward.coins;
        }
        finalStats.earnedXP = partialXP;
        finalStats.earnedCoins = partialCoins;

        // Mettre à jour stats locales
        this.stats.totalRuns++;
        if (stage > this.stats.bestStage) {
            this.stats.bestStage = stage;
        }
        this.saveStats();

        // Donner XP et Gold partiels
        if (window.careerManager && partialXP > 0) {
            window.careerManager.addXP(partialXP);
        }
        if (window.boxManager && partialCoins > 0) {
            window.boxManager.addCoins(partialCoins, 'Boss Rush partiel');
        }

        // Vérifier les trophées
        if (window.trophyManager) {
            window.trophyManager.checkTrophies();
        }

        logger.log(`[BossRush] Game Over au stage ${stage}`, finalStats);

        // Soumettre au leaderboard mondial Firebase
        if (window.firebaseUI) {
            const score = (stage - 1) * 1000 + Math.floor(totalTime); // Score basé sur stage atteint
            window.firebaseUI.submitAndShowResult('bossrush', score, {
                stageReached: stage,
                totalTime: Math.floor(totalTime),
                bossesDefeated: bossesDefeated
            });
        }

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
    // TRACKING CAREER MANAGER
    // ============================================

    /**
     * Met à jour une stat dans CareerManager
     */
    updateCareerStat(statName, increment = 1) {
        if (!window.careerManager || !window.career) return;

        const career = window.career;
        if (typeof career[statName] === 'number') {
            career[statName] += increment;
            window.careerManager.save();
            logger.log(`[BossRush] Career stat ${statName}: ${career[statName]}`);
        }
    }

    /**
     * Track le kill d'un boss spécifique
     */
    trackBossKill(stage) {
        const bossStatMap = {
            1: 'bossRushTitanKills',
            2: 'bossRushCryoKills',
            3: 'bossRushSpectreKills',
            4: 'bossRushFoudreKills'
        };

        const statName = bossStatMap[stage];
        if (statName) {
            this.updateCareerStat(statName, 1);
        }
    }

    /**
     * Met à jour le meilleur temps si amélioration
     */
    updateCareerBestTime(time) {
        if (!window.careerManager || !window.career) return;

        const career = window.career;
        if (career.bossRushBestTime === null || time < career.bossRushBestTime) {
            career.bossRushBestTime = time;
            window.careerManager.save();
            logger.log(`[BossRush] Nouveau meilleur temps: ${time.toFixed(1)}s`);
        }
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
