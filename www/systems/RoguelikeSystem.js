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

        // ✅ PERF: Cache des éléments DOM (évite getElementById à chaque frame)
        this._domCache = null;
        this._lastUIUpdate = 0;
        this._uiUpdateInterval = 100; // Update UI max 10x/sec au lieu de 60x/sec
    }

    /**
     * ✅ PERF: Cache les éléments DOM une seule fois
     */
    _cacheDOMElements() {
        if (this._domCache) return;

        this._domCache = {
            objectiveDiv: document.getElementById('roguelike-objective'),
            levelEl: document.getElementById('rl-obj-level'),
            currentEl: document.getElementById('rl-obj-current'),
            targetEl: document.getElementById('rl-obj-target'),
            hud: document.getElementById('rl-powerups-hud'),
            livesEl: document.getElementById('rl-hud-lives'),
            livesCount: document.getElementById('rl-hud-lives-count'),
            shieldsEl: document.getElementById('rl-hud-shields'),
            shieldsCount: document.getElementById('rl-hud-shields-count'),
            sprintEl: document.getElementById('rl-hud-sprint'),
            sprintCdProgress: document.getElementById('rl-sprint-cd-progress'),
            passivesContainer: document.getElementById('rl-hud-passives')
        };
    }

    /**
     * ✅ PERF: Invalide le cache (appeler si DOM change)
     */
    invalidateDOMCache() {
        this._domCache = null;
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

        // Mettre à jour l'UI après syncCombo (pour afficher le bon combo dès le début)
        this.game.updateUI();

        // Appliquer modificateurs
        this.applyModifiers();

        // Générer obstacles
        const hasTeleport = this.modifiers?.passives?.some(p => p.type === 'wrap_around') || false;
        this.game.spawnSystem.generateRoguelikeObstacles(levelData, hasTeleport);

        // Respawn nourriture et crâne APRÈS les obstacles (pour éviter spawn sur les murs)
        this.game.spawnSystem.spawnFood();
        this.game.spawnSystem.spawnBad();

        // Boss fight si niveau boss
        if (this.objective?.type === 'boss') {
            this.game.bossSystem.startBossFight(this.objective, levelData);
        }

        // Afficher écran de jeu
        if (window.screenManager) {
            window.screenManager.show('game-solo');
        }

        // 🎨 Changer le background selon le stage (APRÈS screenManager pour éviter écrasement)
        // Stages 1-5: roche, 6-10: glace, 11-15: ghost, 16-20: foudre
        if (window.backgroundManager) {
            window.backgroundManager.setStageBackground(levelData.level, 'roguelike');
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
     * @param {number} points - Points calculés (avec combo) depuis solo-game.js
     */
    onAppleEaten(points = 10) {
        if (!this.isActive) return;

        // Gourmandise : 1 pomme = 2 pommes
        const hasGourmandise = this.modifiers?.passives?.some(p => p.type === 'apple_double');
        const appleMultiplier = hasGourmandise ? 2 : 1;

        this.progress += appleMultiplier;
        // Passer les points réels (avec combo) au RoguelikeManager
        roguelikeManager.onAppleEaten(points * appleMultiplier);

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

        // Les pommes sont déjà comptées via onAppleEaten() quand mangées
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
     * ✅ PERF: Utilise le cache DOM (sans throttle pour éviter bug compteur)
     */
    updateObjectiveUI() {
        this._cacheDOMElements();
        const { objectiveDiv, levelEl, currentEl, targetEl } = this._domCache;
        if (!objectiveDiv) return;

        if (this.isActive && this.objective) {
            objectiveDiv.classList.remove('hidden');

            if (levelEl) levelEl.textContent = this.levelData?.level || 1;
            if (currentEl) currentEl.textContent = this.progress;
            if (targetEl) targetEl.textContent = this.objective.count || '?';
        } else {
            objectiveDiv.classList.add('hidden');
        }
    }

    /**
     * Force l'animation apple-eaten (appelé uniquement quand pomme mangée)
     */
    triggerAppleAnimation() {
        this._cacheDOMElements();
        const { objectiveDiv } = this._domCache;
        if (objectiveDiv && this.progress > 0) {
            objectiveDiv.classList.add('apple-eaten');
            setTimeout(() => objectiveDiv.classList.remove('apple-eaten'), 300);
        }
    }

    /**
     * Met à jour le HUD des power-ups roguelike
     * ✅ PERF: Utilise le cache DOM
     */
    updateHUD() {
        this._cacheDOMElements();
        const { hud } = this._domCache;
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

        // Passifs (seulement si changement - pas à chaque frame)
        // this.updatePassivesUI(run); // ✅ PERF: Appelé uniquement au changement
    }

    /**
     * ✅ PERF: Utilise le cache DOM
     */
    updateLivesUI(run) {
        const { livesEl, livesCount } = this._domCache;
        if (!livesEl || !livesCount) return;

        const bonusLives = run.lives - 1;
        if (bonusLives > 0) {
            livesEl.classList.remove('hidden');
            livesCount.textContent = bonusLives;
        } else {
            livesEl.classList.add('hidden');
        }
    }

    /**
     * ✅ PERF: Utilise le cache DOM
     */
    updateShieldsUI(run) {
        const { shieldsEl, shieldsCount } = this._domCache;
        if (!shieldsEl || !shieldsCount) return;

        // Compter les boucliers : upgrades + bonus skin diamond
        const upgradeShields = run.upgrades.filter(u => u === 'shield').length;
        const skinShields = run.shield || 0;
        const totalShields = upgradeShields + skinShields;

        if (totalShields > 0) {
            shieldsEl.classList.remove('hidden');
            shieldsCount.textContent = totalShields;
        } else {
            shieldsEl.classList.add('hidden');
        }
    }

    /**
     * ✅ PERF: Utilise le cache DOM
     */
    updateSprintUI() {
        const { sprintEl, sprintCdProgress } = this._domCache;
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

    /**
     * ✅ PERF: Utilise le cache DOM + appelé uniquement au changement d'upgrade
     */
    updatePassivesUI(run) {
        const { passivesContainer } = this._domCache;
        if (!passivesContainer) return;

        const upgradeCounts = {};
        run.upgrades.forEach(upgradeId => {
            if (['extra_life', 'shield', 'burst_speed'].includes(upgradeId)) return;
            upgradeCounts[upgradeId] = (upgradeCounts[upgradeId] || 0) + 1;
        });

        const { RUN_UPGRADES } = window.roguelikeUpgrades || {};
        if (!RUN_UPGRADES) {
            passivesContainer.innerHTML = '';
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
            passivesContainer.innerHTML = html;
            passivesContainer.style.display = 'flex';
        } else {
            passivesContainer.innerHTML = '';
            passivesContainer.style.display = 'none';
        }
    }

    /**
     * Cache l'objectif
     * ✅ PERF: Utilise le cache DOM
     */
    hideObjective() {
        this._cacheDOMElements();
        const { objectiveDiv } = this._domCache;
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
