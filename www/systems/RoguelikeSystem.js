/**
 * RoguelikeSystem.js - Gestion du mode roguelike
 * Extrait de solo-game.js pour modularité
 *
 * Responsabilités:
 * - Gestion des niveaux roguelike
 * - Objectifs (pommes, boss, survie)
 * - Modificateurs et upgrades passifs
 * - Régénération, Ciseaux, Combo Master
 * - HUD roguelike
 */

import { logger } from '../services/logger.js';
import { achievementManager } from '../roguelike/achievements.js';
import roguelikeManager from '../roguelike/RoguelikeManager.js';

export class RoguelikeSystem {
    constructor(game) {
        this.game = game;

        // État roguelike
        this.isActive = false;
        this.levelData = null;
        this.modifiers = null;
        this.objective = null;
        this.progress = 0;

        // Régénération
        this.regenInterval = null;

        // Combo Master (score boost)
        this.scoreBoostActive = false;
        this.scoreBoostMultiplier = 1;
        this.scoreBoostTimer = null;

        // Gold collecté cette run
        this.goldCollected = 0;
    }

    /**
     * Démarre un niveau roguelike
     * @param {Object} levelData - Données du niveau
     * @param {Object} modifiers - Modificateurs (upgrades)
     */
    startLevel(levelData, modifiers) {
        logger.log(`[Roguelike] Démarrage niveau ${levelData.level}: ${levelData.name}`);

        const isNewRun = !this.isActive || levelData.level === 1;
        const previousSnakeLength = isNewRun ? 0 : this.game.snake.length;
        const previousScore = isNewRun ? 0 : this.game.score;
        const previousMaxCombo = isNewRun ? 1 : this.game.maxCombo;

        // Reset gold au début d'une nouvelle run
        if (isNewRun) {
            this.goldCollected = 0;
        }

        this.isActive = true;
        this.levelData = levelData;
        this.modifiers = modifiers || {};
        this.objective = levelData.objective;
        this.progress = 0;

        // Difficulté basée sur le monde
        const worldDifficulty = Math.min(2, levelData.world - 1);
        this.game.difficulty = worldDifficulty;

        // Reset et démarrage
        this.game.reset();
        this.game.running = true;
        this.game.paused = false;
        this.game.gameStartTime = Date.now();
        this.game.lastTime = performance.now();

        // Restaurer score et combo
        if (previousScore > 0) {
            this.game.score = previousScore;
        }
        this.game.maxCombo = previousMaxCombo;

        // Restaurer longueur du serpent
        if (previousSnakeLength > 3) {
            const segmentsToAdd = previousSnakeLength - 3;
            for (let i = 0; i < segmentsToAdd; i++) {
                this.game.snake.push({ ...this.game.snake[this.game.snake.length - 1] });
            }
        }

        // Synchroniser combo
        this.game.syncCombo();

        // Appliquer modificateurs
        this.applyModifiers();

        // Générer obstacles
        const hasTeleport = this.modifiers?.passives?.some(p => p.type === 'wrap_around') || false;
        this.game.spawnSystem.generateRoguelikeObstacles(levelData, hasTeleport);

        // Boss fight si niveau boss
        if (this.objective?.type === 'boss') {
            this.game.bossSystem.startBossFight(this.objective, levelData);
        }

        // Afficher écran de jeu
        if (window.screenManager) {
            window.screenManager.show('game-solo');
        }

        // Démarrer boucle
        this.game.loop(this.game.lastTime);
    }

    /**
     * Applique les modificateurs roguelike
     */
    applyModifiers() {
        if (!this.modifiers) return;

        // Ciseaux
        this.applyScissors();

        // Combo Master
        this.applyComboMaster();

        // Régénération
        this.startRegeneration();

        logger.log('[Roguelike] Modificateurs appliqués:', this.modifiers);
    }

    /**
     * Applique l'upgrade Ciseaux (divise longueur par 2)
     */
    applyScissors() {
        if (!this.modifiers?.passives) return;

        const scissorsUpgrade = this.modifiers.passives.find(p => p.type === 'scissors');
        if (!scissorsUpgrade) return;

        if (this.game.snake.length <= 3) return;

        const savedCombo = this.game.combo;
        const targetLength = Math.max(3, Math.floor(this.game.snake.length / 2));
        const segmentsToRemove = this.game.snake.length - targetLength;

        for (let i = 0; i < segmentsToRemove; i++) {
            this.game.snake.pop();
        }

        // Préserver le combo
        this.game.combo = savedCombo;

        logger.log(`[Roguelike] ✂️ Ciseaux! Longueur: ${this.game.snake.length + segmentsToRemove} → ${this.game.snake.length}`);
    }

    /**
     * Applique l'upgrade Combo Master (double les segments)
     */
    applyComboMaster() {
        if (!this.modifiers?.passives) return;
        if (!window.roguelikeManager?.currentRun) return;

        const comboMaster = this.modifiers.passives.find(p => p.type === 'combo_double_next_stage');
        if (!comboMaster) return;

        const currentSegments = this.game.snake.length;
        const segmentsToAdd = currentSegments;

        for (let i = 0; i < segmentsToAdd; i++) {
            this.game.snake.push({ ...this.game.snake[this.game.snake.length - 1] });
        }

        this.game.syncCombo();
        this.game.createParticles(this.game.snake[0].x, this.game.snake[0].y, '#ff4444', 15);

        // Consommer l'upgrade
        const run = window.roguelikeManager.currentRun;
        const upgradeIndex = run.upgrades.indexOf('combo_master');
        if (upgradeIndex !== -1) {
            run.upgrades.splice(upgradeIndex, 1);
        }

        logger.log(`[Roguelike] 🔥 Combo Master! ${currentSegments} → ${currentSegments * 2} segments`);
    }

    /**
     * Démarre la régénération automatique
     */
    startRegeneration() {
        this.stopRegeneration();

        if (!this.modifiers?.passives) return;

        const regenUpgrades = this.modifiers.passives.filter(p => p.type === 'regen');
        if (regenUpgrades.length === 0) return;

        const totalAmount = regenUpgrades.reduce((sum, r) => sum + r.amount, 0);
        const interval = regenUpgrades[0].interval * 1000;

        logger.log(`[Roguelike] Régénération: +${totalAmount} segment(s) toutes les ${interval / 1000}s`);

        this.regenInterval = setInterval(() => {
            if (this.game.paused || !this.game.running) return;

            for (let i = 0; i < totalAmount; i++) {
                this.game.snake.push({ ...this.game.snake[this.game.snake.length - 1] });
            }

            this.game.syncCombo();
            this.game.createParticles(this.game.snake[0].x, this.game.snake[0].y, '#00ff00', 3);
        }, interval);
    }

    /**
     * Arrête la régénération
     */
    stopRegeneration() {
        if (this.regenInterval) {
            clearInterval(this.regenInterval);
            this.regenInterval = null;
        }
    }

    /**
     * Appelé quand une pomme est mangée
     */
    onAppleEaten() {
        if (!this.isActive) return;

        // Gourmandise : 1 pomme = 2 pommes
        const hasGourmandise = this.modifiers?.passives?.some(p => p.type === 'apple_double');
        const appleMultiplier = hasGourmandise ? 2 : 1;

        this.progress += appleMultiplier;
        roguelikeManager.onAppleEaten(appleMultiplier);

        // Si Gourmandise, ajouter un segment bonus
        if (hasGourmandise) {
            this.game.snake.push({ ...this.game.snake[this.game.snake.length - 1] });
            logger.log('[Roguelike] 🍎 Gourmandise! +2 pommes comptées');
        }

        // Réduire cooldown Sprint
        this.game.powerUpSystem.reduceSprintCooldown(5 * appleMultiplier);

        // Vérifier objectif
        this.checkObjective();
    }

    /**
     * Vérifie si l'objectif est atteint
     */
    checkObjective() {
        if (!this.isActive || !this.objective) return;

        if (this.objective.type === 'apples') {
            if (this.progress >= this.objective.count) {
                this.completeLevel();
            }
        }
    }

    /**
     * Complete le niveau actuel
     */
    completeLevel() {
        logger.log(`[Roguelike] Niveau ${this.levelData.level} complété!`);

        this.game.paused = true;
        this.game.bossSystem.cleanup();

        roguelikeManager.onAppleEaten(this.progress);
        roguelikeManager.completeLevel();
    }

    /**
     * Quitte le mode roguelike
     */
    exit() {
        this.isActive = false;
        this.levelData = null;
        this.modifiers = null;
        this.objective = null;
        this.progress = 0;
        this.stopRegeneration();
        logger.log('[Roguelike] Mode désactivé');
    }

    /**
     * Cleanup complet
     */
    cleanup() {
        this.stopRegeneration();

        if (this.scoreBoostTimer) {
            clearTimeout(this.scoreBoostTimer);
            this.scoreBoostTimer = null;
        }

        this.scoreBoostActive = false;
        this.scoreBoostMultiplier = 1;
    }

    // ============================================
    // UI HUD
    // ============================================

    /**
     * Met à jour l'affichage de l'objectif
     */
    updateObjectiveUI() {
        const objectiveDiv = document.getElementById('roguelike-objective');
        if (!objectiveDiv) return;

        if (this.isActive && this.objective) {
            objectiveDiv.classList.remove('hidden');

            const levelEl = document.getElementById('rl-obj-level');
            if (levelEl) levelEl.textContent = this.levelData?.level || 1;

            const currentEl = document.getElementById('rl-obj-current');
            const targetEl = document.getElementById('rl-obj-target');

            if (currentEl) currentEl.textContent = this.progress;
            if (targetEl) targetEl.textContent = this.objective.count || '?';

            if (this.progress > 0) {
                objectiveDiv.classList.add('apple-eaten');
                setTimeout(() => objectiveDiv.classList.remove('apple-eaten'), 300);
            }
        } else {
            objectiveDiv.classList.add('hidden');
        }
    }

    /**
     * Met à jour le HUD des power-ups roguelike
     */
    updateHUD() {
        const hud = document.getElementById('rl-powerups-hud');
        if (!hud) return;

        if (!this.isActive || !window.roguelikeManager?.currentRun) {
            hud.classList.add('hidden');
            return;
        }

        hud.classList.remove('hidden');
        const run = window.roguelikeManager.currentRun;

        // Vies
        this.updateLivesUI(run);

        // Boucliers
        this.updateShieldsUI(run);

        // Sprint
        this.updateSprintUI();

        // Passifs
        this.updatePassivesUI(run);
    }

    updateLivesUI(run) {
        const livesEl = document.getElementById('rl-hud-lives');
        const livesCount = document.getElementById('rl-hud-lives-count');
        if (!livesEl || !livesCount) return;

        const bonusLives = run.lives - 1;
        if (bonusLives > 0) {
            livesEl.classList.remove('hidden');
            livesCount.textContent = bonusLives;
        } else {
            livesEl.classList.add('hidden');
        }
    }

    updateShieldsUI(run) {
        const shieldsEl = document.getElementById('rl-hud-shields');
        const shieldsCount = document.getElementById('rl-hud-shields-count');
        if (!shieldsEl || !shieldsCount) return;

        const shieldCount = run.upgrades.filter(u => u === 'shield').length;
        if (shieldCount > 0) {
            shieldsEl.classList.remove('hidden');
            shieldsCount.textContent = shieldCount;
        } else {
            shieldsEl.classList.add('hidden');
        }
    }

    updateSprintUI() {
        const sprintEl = document.getElementById('rl-hud-sprint');
        const sprintCdProgress = document.getElementById('rl-sprint-cd-progress');
        if (!sprintEl) return;

        const hasSprint = this.modifiers?.abilities?.some(a => a.ability === 'sprint');
        if (!hasSprint) {
            sprintEl.classList.add('hidden');
            return;
        }

        sprintEl.classList.remove('hidden');
        sprintEl.classList.remove('ready', 'active', 'cooldown');

        const powerUpSystem = this.game.powerUpSystem;

        if (powerUpSystem.sprintActive) {
            sprintEl.classList.add('active');
        } else if (powerUpSystem.sprintCooldown > 0) {
            sprintEl.classList.add('cooldown');
            const ability = this.modifiers.abilities.find(a => a.ability === 'sprint');
            const maxCd = ability?.cooldown || 10;
            const cdPercent = (powerUpSystem.sprintCooldown / maxCd) * 100;
            if (sprintCdProgress) {
                sprintCdProgress.style.strokeDashoffset = 100 - cdPercent;
            }
        } else {
            sprintEl.classList.add('ready');
            if (sprintCdProgress) {
                sprintCdProgress.style.strokeDashoffset = 0;
            }
        }
    }

    updatePassivesUI(run) {
        const passivesEl = document.getElementById('rl-hud-passives');
        if (!passivesEl) return;

        const upgradeCounts = {};
        run.upgrades.forEach(upgradeId => {
            if (['extra_life', 'shield', 'burst_speed'].includes(upgradeId)) return;
            upgradeCounts[upgradeId] = (upgradeCounts[upgradeId] || 0) + 1;
        });

        const { RUN_UPGRADES } = window.roguelikeUpgrades || {};
        if (!RUN_UPGRADES) {
            passivesEl.innerHTML = '';
            return;
        }

        let html = '';
        for (const [upgradeId, count] of Object.entries(upgradeCounts)) {
            const upgrade = RUN_UPGRADES[upgradeId];
            if (!upgrade) continue;
            html += `<div class="rl-hud-passive" title="${upgrade.name}">
                <span class="rl-passive-icon">${upgrade.icon}</span>
                ${count > 1 ? `<span class="rl-passive-count">×${count}</span>` : ''}
            </div>`;
        }

        if (html) {
            passivesEl.innerHTML = html;
            passivesEl.style.display = 'flex';
        } else {
            passivesEl.innerHTML = '';
            passivesEl.style.display = 'none';
        }
    }

    /**
     * Cache l'objectif
     */
    hideObjective() {
        const objectiveDiv = document.getElementById('roguelike-objective');
        if (objectiveDiv) {
            objectiveDiv.classList.add('hidden');
        }
    }

    // ============================================
    // GETTERS
    // ============================================

    get scoreMultiplier() {
        return this.modifiers?.scoreMultiplier || 1;
    }

    get appleScoreMultiplier() {
        return this.modifiers?.appleScore || 1;
    }

    get speedMultiplier() {
        return this.levelData?.modifiers?.speedMultiplier || 1;
    }
}
