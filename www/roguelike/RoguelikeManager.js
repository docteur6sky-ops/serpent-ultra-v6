/**
 * SNAKE ROGUELIKE - Manager Principal
 * Gère les runs, la progression, et les transitions entre niveaux
 */

import { ROGUELIKE_LEVELS, WORLDS } from './levels.js';
import { RUN_UPGRADES, PERMANENT_UPGRADES, RARITIES, selectRandomUpgrades, applyUpgrade, calculateRunModifiers } from './upgrades.js';
import { logger } from '../services/logger.js';
import { save, load } from '../services/storage.js';
import { achievementManager } from './achievements.js';
import { getItemById } from '../data/items.js';

// SecurityManager - accès via window pour éviter dépendance circulaire
const getSecurityManager = () => window.securityManager;

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
        // Récupérer le skin équipé et son bonus
        const skinBonus = this.getEquippedSkinBonus();

        // Calculer les vies de départ
        let startingLives = 1 + this.getMetaBonus('starting_lives');

        // Calculer les upgrades de départ
        const startingUpgrades = [];

        // Calculer le bouclier de départ
        let startingShield = 0;

        // Flags spéciaux
        let selfCollisionImmune = false;
        let skullImmunity = false;
        let swordDamage = 3; // Par défaut
        let powerupDurationBonus = 1; // Par défaut x1
        let dangerPreview = false;

        // Appliquer les bonus du skin
        if (skinBonus) {
            switch (skinBonus.type) {
                case 'extra_lives':
                    startingLives += skinBonus.value;
                    break;

                case 'starting_upgrade':
                    if (skinBonus.upgradeId) {
                        startingUpgrades.push(skinBonus.upgradeId);
                    }
                    break;

                case 'starting_upgrades':
                    if (skinBonus.upgradeIds) {
                        startingUpgrades.push(...skinBonus.upgradeIds);
                    }
                    break;

                case 'starting_shield':
                    startingShield = skinBonus.value;
                    break;

                case 'self_collision_immune':
                    selfCollisionImmune = true;
                    break;

                case 'skull_immunity':
                    skullImmunity = true;
                    break;

                case 'sword_damage':
                    swordDamage = skinBonus.value;
                    break;

                case 'powerup_random':
                    powerupDurationBonus = 1.5; // +50%
                    break;

                case 'danger_preview':
                    dangerPreview = true;
                    break;

                case 'combo':
                    // Combinaison de bonus (void, glitch)
                    if (skinBonus.upgradeIds) {
                        startingUpgrades.push(...skinBonus.upgradeIds);
                    }
                    if (skinBonus.shield) {
                        startingShield = skinBonus.shield;
                    }
                    if (skinBonus.extraLives) {
                        startingLives += skinBonus.extraLives;
                    }
                    if (skinBonus.selfCollisionImmune) {
                        selfCollisionImmune = true;
                    }
                    break;

                case 'ultimate':
                    // SPECTRAL - Tout !
                    if (skinBonus.upgradeIds) {
                        startingUpgrades.push(...skinBonus.upgradeIds);
                    }
                    if (skinBonus.shield) {
                        startingShield = skinBonus.shield;
                    }
                    if (skinBonus.extraLives) {
                        startingLives += skinBonus.extraLives;
                    }
                    if (skinBonus.selfCollisionImmune) {
                        selfCollisionImmune = true;
                    }
                    break;
            }
        }

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

            // Upgrades collectés cette run (avec bonus skin)
            upgrades: [...startingUpgrades],

            // État du joueur
            lives: startingLives,

            // Bouclier de départ
            shield: startingShield,

            // Modificateurs calculés
            modifiers: calculateRunModifiers(startingUpgrades),

            // Bonus du skin actif
            skinBonus: skinBonus,

            // Flags spéciaux du skin
            selfCollisionImmune: selfCollisionImmune,
            skullImmunity: skullImmunity,
            swordDamage: swordDamage,
            powerupDurationBonus: powerupDurationBonus,
            dangerPreview: dangerPreview,

            // État du niveau actuel
            currentLevelData: null,
            levelStartTime: null,
            objectiveProgress: 0
        };

        logger.log('[RoguelikeManager] Nouvelle run démarrée', this.currentRun);
        if (skinBonus) {
            logger.log('[RoguelikeManager] Bonus skin appliqué:', skinBonus.bonusName);
        }

        // Achievement tracking
        achievementManager.startNewRun();

        this.startLevel(1);
        return this.currentRun;
    }

    /**
     * Récupère le bonus roguelike du skin équipé
     */
    getEquippedSkinBonus() {
        if (!window.boxManager) return null;

        const equippedSkin = window.boxManager.getEquippedSkin();
        if (!equippedSkin || !equippedSkin.id) return null;

        const skinData = getItemById(equippedSkin.id);
        if (!skinData || !skinData.roguelikeBonus) return null;

        return skinData.roguelikeBonus;
    }

    /**
     * Démarre une run Daily Challenge
     */
    startDailyRun(challenge) {
        logger.log('[RoguelikeManager] Démarrage Daily Challenge:', challenge.name);

        // Calculer les vies selon le modificateur spécial
        let lives = 1 + this.getMetaBonus('starting_lives');
        if (challenge.modifiers.special.effect === 'one_life') {
            lives = 1;
        }

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
            lives: lives,

            // Modificateurs calculés (avec ceux du daily)
            modifiers: {
                ...calculateRunModifiers([]),
                speedMultiplier: challenge.modifiers.speed.value,
                appleSpawnRate: challenge.modifiers.apples.value,
                obstacleLevel: challenge.modifiers.obstacles.value,
                specialEffect: challenge.modifiers.special.effect
            },

            // État du niveau actuel
            currentLevelData: null,
            levelStartTime: null,
            objectiveProgress: 0,

            // Marquer comme Daily Challenge
            isDaily: true,
            dailyChallenge: challenge,
            dailySeed: challenge.seed,
            dailyTargetLevel: challenge.targetLevel
        };

        logger.log('[RoguelikeManager] Daily Run configurée:', {
            speed: challenge.modifiers.speed.name,
            apples: challenge.modifiers.apples.name,
            obstacles: challenge.modifiers.obstacles.name,
            special: challenge.modifiers.special.name,
            targetLevel: challenge.targetLevel
        });

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

        // Debug: afficher les upgrades et passives
        logger.log(`[RoguelikeManager] Niveau ${levelNum} démarré:`, levelData.name);
        logger.log(`[RoguelikeManager] Upgrades actuels:`, this.currentRun.upgrades);
        logger.log(`[RoguelikeManager] Passives:`, JSON.stringify(this.currentRun.modifiers.passives));

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
     * @param {number} points - Points déjà calculés avec combo et multiplicateurs depuis solo-game.js
     */
    onAppleEaten(points = 10) {
        if (!this.currentRun) return;

        // Les points arrivent déjà calculés (avec combo, appleScore, etc.) depuis solo-game.js
        this.currentRun.applesEaten++;
        this.currentRun.score += points;

        // Tracking anti-triche
        const sm = getSecurityManager();
        if (sm) {
            sm.trackGameEvent('apple', {
                points: points,
                total: this.currentRun.score,
                level: this.currentRun.level
            });
        }

        // Vérifier objectif
        const obj = this.currentRun.currentLevelData?.objective;
        if (obj?.type === 'apples') {
            this.currentRun.objectiveProgress++;

            if (this.currentRun.objectiveProgress >= obj.count) {
                this.completeLevel();
            }
        }

        return points;
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

        // Vérifier le bouclier (skin diamond ou upgrade shield)
        const hasShield = this.currentRun.upgrades.includes('shield') || this.currentRun.shield > 0;
        if (hasShield) {
            // Consommer une charge de bouclier
            if (this.currentRun.shield > 0) {
                this.currentRun.shield--;
                logger.log(`[RoguelikeManager] Bouclier skin consommé (restant: ${this.currentRun.shield})`);
            } else {
                const shieldIndex = this.currentRun.upgrades.indexOf('shield');
                this.currentRun.upgrades.splice(shieldIndex, 1);
                logger.log('[RoguelikeManager] Bouclier upgrade consommé');
            }
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

        // 💰 Bonus 10 gold par stage complété
        if (window.soloGame) {
            window.soloGame.goldCollected = (window.soloGame.goldCollected || 0) + 10;
            logger.log(`[RoguelikeManager] 💰 +10 gold bonus stage! Total: ${window.soloGame.goldCollected}`);
        }

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
        this.pendingUpgradeChoices = selectRandomUpgrades(choiceCount, maxedUpgrades, rarityBoost, this.currentRun.upgrades);

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

        // ✅ Supprimer la sauvegarde mid-run (la run est terminee)
        this.deleteSavedRun();

        const finalStats = {
            reason,
            level: this.currentRun.level,
            world: this.currentRun.world,
            score: this.currentRun.score,
            applesEaten: this.currentRun.applesEaten,
            powerupsCollected: this.currentRun.powerupsCollected,
            timePlayed: this.currentRun.timePlayed + (Date.now() - this.currentRun.levelStartTime) / 1000,
            upgradesCollected: this.currentRun.upgrades.length,
            maxCombo: window.soloGame?.maxCombo || 1,
            goldCollected: window.soloGame?.goldCollected || 0  // 💰 Fortune gold
        };

        // Calculer XP gagné
        const xpMultiplier = this.currentRun.modifiers.xpMultiplier;
        const baseXP = Math.floor((finalStats.score + (finalStats.level * 30) + finalStats.applesEaten) * 0.6);
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

        // 💰 Ajouter le gold collecté au BoxManager (pour acheter des coffres)
        if (finalStats.goldCollected > 0) {
            this.metaProgression.totalGold = (this.metaProgression.totalGold || 0) + finalStats.goldCollected;

            // ✅ Ajouter les coins au BoxManager
            if (window.boxManager) {
                window.boxManager.addCoins(finalStats.goldCollected, 'Fortune Roguelike');
                logger.log(`[RoguelikeManager] 💰 +${finalStats.goldCollected} coins ajoutés à la Box`);
            }

            logger.log(`[RoguelikeManager] +${finalStats.goldCollected} gold → Total: ${this.metaProgression.totalGold}`);
        }

        this.saveMetaProgression();

        // ✅ Synchroniser avec CareerManager (source unique de vérité)
        if (window.careerManager) {
            const result = window.careerManager.addXP(earnedXP);
            if (result.leveledUp) {
                logger.log(`[RoguelikeManager] Level UP! Niveau ${result.newLevel}`);
            }
            logger.log(`[RoguelikeManager] Career synced via CareerManager: +${earnedXP} XP → Level ${window.career.level}`);
        } else if (window.career && window.save) {
            // Fallback si CareerManager non disponible
            let careerXP = window.career.xp + earnedXP;
            let careerLevel = window.career.level;
            let careerXPNext = window.career.xpNext || (100 + careerLevel * 100);

            while (careerXP >= careerXPNext && careerLevel < 100) {
                careerXP -= careerXPNext;
                careerLevel++;
                careerXPNext = 100 + (careerLevel * 100);
            }

            window.career.xp = careerXP;
            window.career.level = careerLevel;
            window.career.xpNext = careerXPNext;
            window.save('career', window.career);
            logger.log(`[RoguelikeManager] Career synced (fallback): +${earnedXP} XP`);
        }

        logger.log('[RoguelikeManager] Run terminée:', finalStats);

        // Achievement tracking
        achievementManager.endRun(reason === 'victory');

        // Soumettre le score au leaderboard approprié (asynchrone)
        if (this.currentRun.isDaily) {
            this.submitDailyScore(finalStats);
        } else {
            this.submitScoreToLeaderboard(finalStats);
        }

        // Notifier
        if (this.onRunEnd) {
            this.onRunEnd(finalStats, this.metaProgression);
        }

        this.currentRun = null;

        return finalStats;
    }

    /**
     * Soumet le score au leaderboard en ligne
     */
    async submitScoreToLeaderboard(stats) {
        // Soumettre au leaderboard mondial Firebase
        if (window.firebaseUI) {
            window.firebaseUI.submitAndShowResult('roguelike', stats.score, {
                level: stats.level,
                applesEaten: stats.applesEaten,
                upgradesCollected: stats.upgradesCollected,
                timePlayed: Math.floor(stats.timePlayed)
            });
        }
    }

    /**
     * Soumet le score au Daily Challenge
     */
    async submitDailyScore(stats) {
        if (!this.currentRun?.isDaily || !this.currentRun?.dailySeed) {
            logger.warn('[RoguelikeManager] Pas de daily challenge actif');
            return;
        }

        try {
            const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Anonyme';
            const sm = getSecurityManager();

            // Validation anti-triche (si disponible)
            let validation = { valid: true, trustScore: 100 };
            let verifyToken = null;

            if (sm) {
                validation = sm.validateRunStats(stats);
                verifyToken = sm.generateVerificationToken(stats);
            }

            const response = await fetch('/api/roguelike/daily/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pseudo: pseudo,
                    score: stats.score,
                    level: stats.level,
                    time: Math.floor(stats.timePlayed),
                    seed: this.currentRun.dailySeed,
                    // Données de sécurité
                    trustScore: validation.trustScore,
                    verifyToken: verifyToken,
                    sessionId: sm?.sessionId || null
                })
            });

            const result = await response.json();

            if (result.success) {
                logger.log('[RoguelikeManager] Score Daily soumis:', result);

                // Stocker pour affichage
                this.lastDailyRank = result.entry?.rank || null;
                this.lastDailyMessage = result.message;
                this.lastDailyTargetReached = result.targetReached;
                this.lastDailyBonusXP = result.bonusXP;

                // Ajouter le bonus XP si objectif atteint
                if (result.bonusXP > 0) {
                    this.metaProgression.totalXP += result.bonusXP;
                    this.saveMetaProgression();
                    logger.log(`[RoguelikeManager] +${result.bonusXP} XP bonus daily !`);
                }

                // Émettre un événement pour l'UI
                if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('daily-score-submitted', {
                        detail: result
                    }));
                }
            } else {
                logger.warn('[RoguelikeManager] Échec soumission daily:', result.error);
            }
        } catch (error) {
            logger.error('[RoguelikeManager] Erreur soumission daily:', error);
        }
    }

    // ========== MÉTA-PROGRESSION ==========

    /**
     * Charge la méta-progression depuis le localStorage
     * Utilise storage.js pour bénéficier de la protection SecurityManager
     */
    loadMetaProgression() {
        // Valeurs par défaut
        const defaults = {
            totalXP: 0,
            totalRuns: 0,
            bestLevel: 0,
            bestScore: 0,
            totalGold: 0,  // 💰 Gold accumulé (Fortune)
            unlockedUpgrades: [],
            purchasedPerks: []
        };

        // Utiliser storage.js pour bénéficier de la protection SecurityManager
        const saved = load('snakeRoguelikeMeta', null);
        if (saved) {
            // Fusionner avec les valeurs par défaut (pour anciennes sauvegardes)
            return { ...defaults, ...saved };
        }

        return defaults;
    }

    /**
     * Sauvegarde la méta-progression
     * Utilise storage.js pour bénéficier de la protection SecurityManager
     */
    saveMetaProgression() {
        save('snakeRoguelikeMeta', this.metaProgression);
        logger.log('[RoguelikeManager] Méta-progression sauvegardée');
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

        // Sécurité : purchasedPerks peut être undefined sur anciennes sauvegardes
        const perks = this.metaProgression?.purchasedPerks || [];
        perks.forEach(perkId => {
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

    // ========== SAUVEGARDE MID-RUN ==========

    /**
     * Sauvegarde la run en cours pour pouvoir la reprendre plus tard
     */
    saveRunMidGame() {
        if (!this.currentRun) {
            logger.warn('[RoguelikeManager] Pas de run active a sauvegarder');
            return false;
        }

        // Ne pas sauvegarder les daily challenges (doivent etre termines d'un coup)
        if (this.currentRun.isDaily) {
            logger.warn('[RoguelikeManager] Daily Challenge - sauvegarde mid-run desactivee');
            return false;
        }

        try {
            // Calculer le temps joue jusqu'ici
            const currentTime = Date.now();
            const levelTime = (currentTime - this.currentRun.levelStartTime) / 1000;

            // Sauvegarder l'etat de la run
            const runState = {
                // Progression
                level: this.currentRun.level,
                world: this.currentRun.world,

                // Stats
                score: this.currentRun.score,
                applesEaten: this.currentRun.applesEaten,
                powerupsCollected: this.currentRun.powerupsCollected,
                timePlayed: this.currentRun.timePlayed + levelTime,

                // Upgrades et vies
                upgrades: [...this.currentRun.upgrades],
                lives: this.currentRun.lives,

                // Etat du niveau
                objectiveProgress: this.currentRun.objectiveProgress,

                // Metadonnees
                savedAt: currentTime,
                version: 1
            };

            localStorage.setItem('roguelike_saved_run', JSON.stringify(runState));
            logger.log('[RoguelikeManager] Run sauvegardee au niveau', runState.level);

            // Terminer la run actuelle sans fin de partie
            this.currentRun = null;

            return true;
        } catch (e) {
            logger.error('[RoguelikeManager] Erreur sauvegarde run:', e);
            return false;
        }
    }

    /**
     * Charge et reprend une run sauvegardee
     */
    loadSavedRun() {
        try {
            const saved = localStorage.getItem('roguelike_saved_run');
            if (!saved) {
                logger.log('[RoguelikeManager] Aucune run sauvegardee');
                return null;
            }

            const runState = JSON.parse(saved);

            // Verifier la validite (max 24h)
            const age = Date.now() - runState.savedAt;
            const maxAge = 24 * 60 * 60 * 1000; // 24 heures

            if (age > maxAge) {
                logger.warn('[RoguelikeManager] Run sauvegardee expiree (plus de 24h)');
                this.deleteSavedRun();
                return null;
            }

            logger.log('[RoguelikeManager] Chargement run sauvegardee niveau', runState.level);

            // Recreer la run
            this.currentRun = {
                // Progression
                level: runState.level,
                world: runState.world,

                // Stats
                score: runState.score,
                applesEaten: runState.applesEaten,
                powerupsCollected: runState.powerupsCollected,
                timePlayed: runState.timePlayed,
                startTime: Date.now() - (runState.timePlayed * 1000),

                // Upgrades
                upgrades: runState.upgrades,

                // Etat du joueur
                lives: runState.lives,

                // Modificateurs recalcules
                modifiers: calculateRunModifiers(runState.upgrades),

                // Etat du niveau (sera reinitialise au demarrage)
                currentLevelData: null,
                levelStartTime: null,
                objectiveProgress: 0 // Recommence le niveau du debut
            };

            // Supprimer la sauvegarde (on reprend)
            this.deleteSavedRun();

            // Achievement tracking
            achievementManager.startNewRun();

            // Demarrer le niveau sauvegarde
            this.startLevel(runState.level);

            return this.currentRun;
        } catch (e) {
            logger.error('[RoguelikeManager] Erreur chargement run:', e);
            this.deleteSavedRun();
            return null;
        }
    }

    /**
     * Supprime la run sauvegardee
     */
    deleteSavedRun() {
        localStorage.removeItem('roguelike_saved_run');
        logger.log('[RoguelikeManager] Run sauvegardee supprimee');
    }

    /**
     * Verifie s'il y a une run sauvegardee valide
     */
    get hasSavedRun() {
        try {
            const saved = localStorage.getItem('roguelike_saved_run');
            if (!saved) return false;

            const runState = JSON.parse(saved);
            const age = Date.now() - runState.savedAt;
            const maxAge = 24 * 60 * 60 * 1000; // 24 heures

            return age <= maxAge;
        } catch (e) {
            return false;
        }
    }

    /**
     * Retourne les infos de la run sauvegardee (pour affichage menu)
     */
    getSavedRunInfo() {
        try {
            const saved = localStorage.getItem('roguelike_saved_run');
            if (!saved) return null;

            const runState = JSON.parse(saved);
            const age = Date.now() - runState.savedAt;
            const maxAge = 24 * 60 * 60 * 1000;

            if (age > maxAge) return null;

            return {
                level: runState.level,
                score: runState.score,
                upgrades: runState.upgrades.length,
                savedAt: new Date(runState.savedAt).toLocaleString('fr-FR')
            };
        } catch (e) {
            return null;
        }
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

    /**
     * Reset partiel des stats Roguelike (appelé par resetAllStats)
     * Reset les STATS mais GARDE les ACHATS (perks, upgrades)
     */
    resetStats() {
        // Reset des stats
        this.metaProgression.totalXP = 0;
        this.metaProgression.totalRuns = 0;
        this.metaProgression.bestLevel = 0;
        this.metaProgression.bestScore = 0;
        this.metaProgression.totalGold = 0;

        // GARDER les achats du joueur :
        // - purchasedPerks (perks achetés)
        // - unlockedUpgrades (upgrades débloqués)

        this.saveMetaProgression();
        logger.log('[RoguelikeManager] Stats reset (achats conservés)');
    }
}

// Instance singleton
const roguelikeManager = new RoguelikeManager();

// Exposer globalement
window.roguelikeManager = roguelikeManager;

export default roguelikeManager;
