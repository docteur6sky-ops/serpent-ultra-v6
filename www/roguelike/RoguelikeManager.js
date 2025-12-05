/**
 * SNAKE ROGUELIKE - Manager Principal
 * Gère les runs, la progression, et les transitions entre niveaux
 */

import { ROGUELIKE_LEVELS, WORLDS } from './levels.js';
import { RUN_UPGRADES, PERMANENT_UPGRADES, RARITIES, selectRandomUpgrades, applyUpgrade, calculateRunModifiers } from './upgrades.js';
import { logger } from '../services/logger.js';
import { achievementManager } from './achievements.js';

class RoguelikeManager {
    constructor() {
        // État de la run actuelle
        this.currentRun = null;

        // Méta-progression (sauvegardée)
        this.metaProgression = this.loadMetaProgression();

        // Callbacks pour communiquer avec le jeu
        this.onLevelStart = null;
        this.onLevelComplete = null;
        this.onRunEnd = null;
        this.onUpgradeChoice = null;

        // État UI
        this.isShowingUpgradeChoice = false;
        this.pendingUpgradeChoices = [];

        logger.log('[RoguelikeManager] Initialisé');
    }

    // ========== GESTION DES RUNS ==========

    /**
     * Démarre une nouvelle run
     */
    startNewRun() {
        this.currentRun = {
            // Progression
            level: 1,
            world: 1,

            // Stats de la run
            score: 0,
            applesEaten: 0,
            powerupsCollected: 0,
            timePlayed: 0,
            startTime: Date.now(),

            // Upgrades collectés cette run
            upgrades: [],

            // État du joueur
            lives: 1 + this.getMetaBonus('starting_lives'),
            bonusSegments: 0,

            // Modificateurs calculés
            modifiers: calculateRunModifiers([]),

            // État du niveau actuel
            currentLevelData: null,
            levelStartTime: null,
            objectiveProgress: 0
        };

        logger.log('[RoguelikeManager] Nouvelle run démarrée', this.currentRun);

        // Achievement tracking
        achievementManager.startNewRun();

        this.startLevel(1);
        return this.currentRun;
    }

    /**
     * Démarre un niveau spécifique
     */
    startLevel(levelNum) {
        if (!this.currentRun) {
            logger.error('[RoguelikeManager] Pas de run active');
            return;
        }

        // Récupérer les données du niveau
        let levelData = ROGUELIKE_LEVELS.find(l => l.level === levelNum);

        // Si niveau > 20, le jeu est terminé (victoire au boss final)
        if (!levelData && levelNum > 20) {
            logger.log('[RoguelikeManager] Victoire finale! Tous les boss vaincus.');
            this.endRun('victory');
            return;
        }

        if (!levelData) {
            logger.error(`[RoguelikeManager] Niveau ${levelNum} introuvable`);
            return;
        }

        this.currentRun.level = levelNum;
        this.currentRun.world = levelData.world;
        this.currentRun.currentLevelData = levelData;
        this.currentRun.levelStartTime = Date.now();
        this.currentRun.objectiveProgress = 0;

        // Recalculer les modificateurs avec les upgrades
        this.currentRun.modifiers = calculateRunModifiers(this.currentRun.upgrades);

        logger.log(`[RoguelikeManager] Niveau ${levelNum} démarré:`, levelData.name);

        // Notifier le jeu
        if (this.onLevelStart) {
            this.onLevelStart(levelData, this.currentRun);
        }

        // Créer l'instance soloGame si elle n'existe pas
        if (!window.soloGame) {
            if (window.SoloSnakeGame) {
                window.soloGame = new window.SoloSnakeGame();
                logger.log('[RoguelikeManager] Instance soloGame créée');
            } else {
                logger.error('[RoguelikeManager] SoloSnakeGame non disponible');
                return;
            }
        }

        // Démarrer le niveau dans le jeu solo
        window.soloGame.startRoguelikeLevel(levelData, this.currentRun.modifiers);

        return levelData;
    }

    /**
     * Génère un niveau endless (après niveau 10)
     */
    generateEndlessLevel(levelNum) {
        const baseLevel = ROGUELIKE_LEVELS.find(l => l.isEndless);
        const scaling = 1 + (levelNum - 10) * 0.05;

        return {
            ...baseLevel,
            level: levelNum,
            name: `INFINI ${levelNum - 10}`,
            objective: {
                type: "apples",
                count: Math.floor(15 + (levelNum - 10) * 3),
                timeLimit: Math.max(30, 60 - (levelNum - 10) * 2)
            },
            obstacles: [
                { type: "wall_static", count: Math.min(15, 6 + levelNum - 10), pattern: "random" },
                { type: "skull", count: Math.min(8, 2 + Math.floor((levelNum - 10) / 2)), behavior: "moving_medium" }
            ],
            modifiers: {
                speedMultiplier: Math.min(2, 1.35 + (levelNum - 10) * 0.05),
                appleSpawnRate: 1.0,
                powerupChance: 0.5
            }
        };
    }

    /**
     * Appelé quand une pomme est mangée
     */
    onAppleEaten(points = 1) {
        if (!this.currentRun) return;

        const modifiedPoints = points * this.currentRun.modifiers.appleScore;
        this.currentRun.applesEaten++;
        this.currentRun.score += modifiedPoints;

        // Vérifier objectif
        const obj = this.currentRun.currentLevelData?.objective;
        if (obj?.type === 'apples') {
            this.currentRun.objectiveProgress++;

            if (this.currentRun.objectiveProgress >= obj.count) {
                this.completeLevel();
            }
        }

        return modifiedPoints;
    }

    /**
     * Appelé quand un power-up est collecté
     */
    onPowerupCollected(powerupType) {
        if (!this.currentRun) return;

        this.currentRun.powerupsCollected++;

        // Calculer la durée modifiée
        const baseDuration = 5; // secondes par défaut
        const multiplier = this.currentRun.modifiers.powerupDurations[powerupType] || 1;

        return baseDuration * multiplier;
    }

    /**
     * Appelé quand le joueur meurt
     */
    onPlayerDeath() {
        if (!this.currentRun) return;

        // Vérifier les vies
        if (this.currentRun.lives > 1) {
            this.currentRun.lives--;
            logger.log(`[RoguelikeManager] Vie perdue, reste: ${this.currentRun.lives}`);
            return { continueRun: true, livesLeft: this.currentRun.lives };
        }

        // Vérifier le bouclier
        const hasShield = this.currentRun.upgrades.includes('shield');
        if (hasShield) {
            // Retirer le bouclier et infliger des dégâts
            const shieldIndex = this.currentRun.upgrades.indexOf('shield');
            this.currentRun.upgrades.splice(shieldIndex, 1);
            logger.log('[RoguelikeManager] Bouclier consommé');
            return { continueRun: true, shieldUsed: true, segmentsLost: 3 };
        }

        // Fin de run
        return this.endRun('death');
    }

    /**
     * Niveau complété
     */
    completeLevel() {
        if (!this.currentRun) return;

        const levelData = this.currentRun.currentLevelData;
        logger.log(`[RoguelikeManager] Niveau ${this.currentRun.level} complété!`);

        // Calculer le temps
        const levelTime = (Date.now() - this.currentRun.levelStartTime) / 1000;
        this.currentRun.timePlayed += levelTime;

        // Achievement tracking
        achievementManager.onLevelComplete(this.currentRun.level, levelData.isBoss, levelTime);

        // Notifier
        if (this.onLevelComplete) {
            this.onLevelComplete(levelData, this.currentRun);
        }

        // Vérifier si c'est un boss
        if (levelData.isBoss) {
            this.showBossVictory();
            return;
        }

        // Afficher le choix d'upgrade
        this.showUpgradeChoice();
    }

    /**
     * Affiche la victoire contre le boss puis les upgrades
     */
    showBossVictory() {
        logger.log('[RoguelikeManager] Boss vaincu! Affichage des upgrades...');

        // Bonus XP pour avoir vaincu le boss
        const bossXP = 200;
        this.currentRun.score += bossXP;

        // Afficher le choix d'upgrade normalement
        this.showUpgradeChoice();
    }

    /**
     * Affiche l'écran de choix d'upgrade
     */
    showUpgradeChoice() {
        this.isShowingUpgradeChoice = true;

        // Déterminer le nombre de choix
        const choiceCount = 3 + this.getMetaBonus('choice_count');

        // Upgrades déjà au max
        const maxedUpgrades = this.getMaxedUpgrades();

        // Sélectionner les upgrades
        const rarityBoost = this.getMetaBonus('rarity_boost');
        this.pendingUpgradeChoices = selectRandomUpgrades(choiceCount, maxedUpgrades, rarityBoost);

        logger.log('[RoguelikeManager] Choix d\'upgrades:', this.pendingUpgradeChoices.map(u => u.name));

        // Notifier l'UI
        if (this.onUpgradeChoice) {
            this.onUpgradeChoice(this.pendingUpgradeChoices, this.currentRun);
        }
    }

    /**
     * Joueur sélectionne un upgrade
     */
    selectUpgrade(upgradeId) {
        if (!this.isShowingUpgradeChoice) return;

        const upgrade = RUN_UPGRADES[upgradeId];
        if (!upgrade) {
            logger.error(`[RoguelikeManager] Upgrade inconnu: ${upgradeId}`);
            return;
        }

        // Appliquer l'upgrade
        this.currentRun = applyUpgrade(this.currentRun, upgradeId);
        this.currentRun.modifiers = calculateRunModifiers(this.currentRun.upgrades);

        logger.log(`[RoguelikeManager] Upgrade sélectionné: ${upgrade.name}`);

        this.isShowingUpgradeChoice = false;
        this.pendingUpgradeChoices = [];

        // Passer au niveau suivant
        this.startLevel(this.currentRun.level + 1);
    }

    /**
     * Passer l'upgrade (bonus XP)
     */
    skipUpgrade() {
        if (!this.isShowingUpgradeChoice) return;

        // Bonus XP pour skip
        const bonusXP = 50;
        this.currentRun.score += bonusXP;

        logger.log(`[RoguelikeManager] Upgrade passé, +${bonusXP} XP`);

        this.isShowingUpgradeChoice = false;
        this.pendingUpgradeChoices = [];

        // Passer au niveau suivant
        this.startLevel(this.currentRun.level + 1);
    }

    /**
     * Relancer les choix d'upgrades
     */
    rerollUpgrades() {
        const freeRerolls = this.getMetaBonus('free_reroll');

        // Vérifier si on a des relances
        if (!this.currentRun.usedReroll && freeRerolls > 0) {
            this.currentRun.usedReroll = true;
            this.showUpgradeChoice();
            return true;
        }

        return false;
    }

    /**
     * Fin de run
     */
    endRun(reason = 'death') {
        if (!this.currentRun) return;

        const finalStats = {
            reason,
            level: this.currentRun.level,
            world: this.currentRun.world,
            score: this.currentRun.score,
            applesEaten: this.currentRun.applesEaten,
            powerupsCollected: this.currentRun.powerupsCollected,
            timePlayed: this.currentRun.timePlayed + (Date.now() - this.currentRun.levelStartTime) / 1000,
            upgradesCollected: this.currentRun.upgrades.length
        };

        // Calculer XP gagné
        const xpMultiplier = this.currentRun.modifiers.xpMultiplier;
        const baseXP = finalStats.score + (finalStats.level * 50) + (finalStats.applesEaten * 2);
        const earnedXP = Math.floor(baseXP * xpMultiplier);

        finalStats.earnedXP = earnedXP;

        // Mettre à jour la méta-progression
        this.metaProgression.totalXP += earnedXP;
        this.metaProgression.totalRuns++;
        if (finalStats.level > this.metaProgression.bestLevel) {
            this.metaProgression.bestLevel = finalStats.level;
        }
        if (finalStats.score > this.metaProgression.bestScore) {
            this.metaProgression.bestScore = finalStats.score;
        }

        this.saveMetaProgression();

        logger.log('[RoguelikeManager] Run terminée:', finalStats);

        // Achievement tracking
        achievementManager.endRun(reason === 'victory');

        // Notifier
        if (this.onRunEnd) {
            this.onRunEnd(finalStats, this.metaProgression);
        }

        this.currentRun = null;

        return finalStats;
    }

    // ========== MÉTA-PROGRESSION ==========

    /**
     * Charge la méta-progression depuis le localStorage
     */
    loadMetaProgression() {
        try {
            const saved = localStorage.getItem('snakeRoguelikeMeta');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            logger.error('[RoguelikeManager] Erreur chargement méta:', e);
        }

        // Valeurs par défaut
        return {
            totalXP: 0,
            totalRuns: 0,
            bestLevel: 0,
            bestScore: 0,
            unlockedUpgrades: [],
            purchasedPerks: []
        };
    }

    /**
     * Sauvegarde la méta-progression
     */
    saveMetaProgression() {
        try {
            localStorage.setItem('snakeRoguelikeMeta', JSON.stringify(this.metaProgression));
            logger.log('[RoguelikeManager] Méta-progression sauvegardée');
        } catch (e) {
            logger.error('[RoguelikeManager] Erreur sauvegarde méta:', e);
        }
    }

    /**
     * Achète un upgrade permanent
     */
    purchasePermanentUpgrade(upgradeId) {
        const upgrade = PERMANENT_UPGRADES[upgradeId];
        if (!upgrade) return { success: false, reason: 'unknown' };

        // Vérifier si déjà acheté
        if (this.metaProgression.purchasedPerks.includes(upgradeId)) {
            return { success: false, reason: 'already_owned' };
        }

        // Vérifier les prérequis
        if (upgrade.requires && !this.metaProgression.purchasedPerks.includes(upgrade.requires)) {
            return { success: false, reason: 'missing_requirement' };
        }

        // Vérifier le coût
        if (this.metaProgression.totalXP < upgrade.cost) {
            return { success: false, reason: 'not_enough_xp' };
        }

        // Acheter
        this.metaProgression.totalXP -= upgrade.cost;
        this.metaProgression.purchasedPerks.push(upgradeId);

        // Débloquer l'upgrade si applicable
        if (upgrade.unlocks) {
            this.metaProgression.unlockedUpgrades.push(upgrade.unlocks);
        }

        this.saveMetaProgression();

        return { success: true, upgrade };
    }

    /**
     * Récupère un bonus de méta-progression
     */
    getMetaBonus(type) {
        let bonus = 0;

        this.metaProgression.purchasedPerks.forEach(perkId => {
            const perk = PERMANENT_UPGRADES[perkId];
            if (perk?.effect?.type === type) {
                bonus += perk.effect.value;
            }
        });

        return bonus;
    }

    /**
     * Retourne les upgrades qui sont au max de stacks
     */
    getMaxedUpgrades() {
        if (!this.currentRun) return [];

        const counts = {};
        this.currentRun.upgrades.forEach(id => {
            counts[id] = (counts[id] || 0) + 1;
        });

        return Object.keys(counts).filter(id => {
            const upgrade = RUN_UPGRADES[id];
            if (!upgrade) return true;
            if (!upgrade.stackable) return true;
            return counts[id] >= upgrade.maxStacks;
        });
    }

    // ========== GETTERS ==========

    get isRunActive() {
        return this.currentRun !== null;
    }

    get currentLevel() {
        return this.currentRun?.level || 0;
    }

    get currentWorld() {
        return this.currentRun?.world || 0;
    }

    get currentWorldData() {
        return WORLDS[this.currentWorld];
    }

    get runScore() {
        return this.currentRun?.score || 0;
    }

    get runUpgrades() {
        return this.currentRun?.upgrades || [];
    }

    get availableXP() {
        return this.metaProgression.totalXP;
    }
}

// Instance singleton
const roguelikeManager = new RoguelikeManager();

// Exposer globalement
window.roguelikeManager = roguelikeManager;

export default roguelikeManager;
