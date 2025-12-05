/**
 * SNAKE ROGUELIKE - Interface Utilisateur
 * Gère l'affichage des écrans roguelike (choix upgrades, fin de run, HUD)
 */

import { RARITIES } from './upgrades.js';
import { WORLDS } from './levels.js';
import roguelikeManager from './RoguelikeManager.js';
import { logger } from '../services/logger.js';
import { achievementsUI } from './AchievementsUI.js';

class RoguelikeUI {
    constructor() {
        this.upgradeScreen = null;
        this.runEndScreen = null;
        this.gameHUD = null;

        this.init();
    }

    init() {
        // Créer les éléments DOM
        this.createUpgradeScreen();
        this.createRunEndScreen();

        // Connecter au manager
        roguelikeManager.onUpgradeChoice = (choices, run) => this.showUpgradeChoice(choices, run);
        roguelikeManager.onRunEnd = (stats, meta) => this.showRunEnd(stats, meta);
        roguelikeManager.onLevelStart = (level, run) => this.updateHUD(level, run);

        logger.log('[RoguelikeUI] Initialisé');
    }

    // ========== ÉCRAN CHOIX UPGRADE ==========

    createUpgradeScreen() {
        this.upgradeScreen = document.createElement('div');
        this.upgradeScreen.id = 'roguelike-upgrade-screen';
        this.upgradeScreen.className = 'roguelike-upgrade-screen hidden';
        this.upgradeScreen.innerHTML = `
            <div class="rl-upgrade-header">
                <div class="rl-level-complete">STAGE COMPLÉTÉ</div>
                <div class="rl-level-number" id="rl-completed-level">1</div>
                <div class="rl-choose-text">Choisis ton amélioration</div>
            </div>

            <div class="rl-upgrade-choices" id="rl-upgrade-choices">
                <!-- Cartes générées dynamiquement -->
            </div>

            <div class="rl-upgrade-actions">
                <button class="rl-btn-skip" id="rl-btn-skip">
                    Passer (+50 XP)
                </button>
                <button class="rl-btn-reroll" id="rl-btn-reroll">
                    <span>🎲</span> Relancer
                </button>
            </div>
        `;

        document.body.appendChild(this.upgradeScreen);

        // Event listeners
        document.getElementById('rl-btn-skip').addEventListener('click', () => {
            this.hideUpgradeChoice();
            roguelikeManager.skipUpgrade();
        });

        document.getElementById('rl-btn-reroll').addEventListener('click', () => {
            const success = roguelikeManager.rerollUpgrades();
            if (!success) {
                // Désactiver le bouton
                document.getElementById('rl-btn-reroll').disabled = true;
            }
        });
    }

    showUpgradeChoice(choices, run) {
        const container = document.getElementById('rl-upgrade-choices');
        container.innerHTML = '';

        // Mettre à jour le niveau
        document.getElementById('rl-completed-level').textContent = run.level;

        // Créer les cartes
        choices.forEach((upgrade, index) => {
            const card = this.createUpgradeCard(upgrade, index);
            container.appendChild(card);
        });

        // Vérifier si relance disponible
        const rerollBtn = document.getElementById('rl-btn-reroll');
        const hasReroll = roguelikeManager.getMetaBonus('free_reroll') > 0 && !run.usedReroll;
        rerollBtn.disabled = !hasReroll;
        rerollBtn.style.display = hasReroll ? 'flex' : 'none';

        // Afficher
        this.upgradeScreen.classList.remove('hidden');

        // Son
        if (window.audio) {
            window.audio.levelComplete?.();
        }
    }

    createUpgradeCard(upgrade, index) {
        const card = document.createElement('div');
        card.className = `rl-upgrade-card rarity-${upgrade.rarity}`;
        card.style.animationDelay = `${0.1 + index * 0.1}s`;

        const rarity = RARITIES[upgrade.rarity];

        card.innerHTML = `
            <div class="rl-upgrade-icon">${upgrade.icon}</div>
            <div class="rl-upgrade-name">${upgrade.name}</div>
            <div class="rl-upgrade-desc">${upgrade.description}</div>
            <div class="rl-upgrade-rarity">${rarity.name}</div>
        `;

        card.addEventListener('click', () => {
            this.selectUpgrade(upgrade.id, card);
        });

        return card;
    }

    selectUpgrade(upgradeId, cardElement) {
        // Animation de sélection
        cardElement.style.transform = 'scale(1.1)';
        cardElement.style.boxShadow = '0 0 40px var(--card-color)';

        // Son
        if (window.audio) {
            window.audio.powerup?.();
        }

        // Délai pour l'animation
        setTimeout(() => {
            this.hideUpgradeChoice();
            roguelikeManager.selectUpgrade(upgradeId);
        }, 300);
    }

    hideUpgradeChoice() {
        this.upgradeScreen.classList.add('hidden');
    }

    // ========== ÉCRAN FIN DE RUN ==========

    createRunEndScreen() {
        this.runEndScreen = document.createElement('div');
        this.runEndScreen.id = 'roguelike-run-end';
        this.runEndScreen.className = 'roguelike-run-end hidden';
        this.runEndScreen.innerHTML = `
            <div class="rl-run-end-title" id="rl-run-end-title">RUN TERMINÉE</div>
            <div class="rl-run-end-subtitle" id="rl-run-end-subtitle">Tu as atteint le stage 5</div>

            <div class="rl-run-stats" id="rl-run-stats">
                <!-- Stats générées dynamiquement -->
            </div>

            <div class="rl-xp-earned">
                <div class="rl-xp-value" id="rl-xp-earned">+250</div>
                <div class="rl-xp-label">XP GAGNÉ</div>
            </div>

            <div class="rl-daily-result" id="rl-daily-result" style="display: none;">
                <!-- Résultat daily affiché dynamiquement -->
            </div>

            <div class="rl-run-end-actions">
                <button class="rl-btn-retry" id="rl-btn-retry">
                    🔄 NOUVELLE RUN
                </button>
                <button class="rl-btn-daily" id="rl-btn-daily">
                    🎯 DÉFI DU JOUR
                </button>
                <button class="rl-btn-achievements" id="rl-btn-achievements">
                    🏆 Achievements
                </button>
                <button class="rl-btn-menu" id="rl-btn-menu">
                    🏠 Menu Principal
                </button>
            </div>
        `;

        document.body.appendChild(this.runEndScreen);

        // Event listeners
        document.getElementById('rl-btn-retry').addEventListener('click', () => {
            this.hideRunEnd();
            roguelikeManager.startNewRun();
        });

        document.getElementById('rl-btn-achievements').addEventListener('click', () => {
            achievementsUI.show();
        });

        document.getElementById('rl-btn-daily').addEventListener('click', () => {
            this.hideRunEnd();
            if (window.dailyChallenge) {
                window.dailyChallenge.show();
            }
        });

        document.getElementById('rl-btn-menu').addEventListener('click', () => {
            this.hideRunEnd();
            if (window.screenManager) {
                window.screenManager.show('hub');
            }
        });
    }

    showRunEnd(stats, meta) {
        // Titre
        const title = document.getElementById('rl-run-end-title');
        const subtitle = document.getElementById('rl-run-end-subtitle');

        // Vérifier si c'est un Daily Challenge
        const isDaily = roguelikeManager.lastDailyRank !== undefined && roguelikeManager.lastDailyRank !== null;

        if (isDaily) {
            title.textContent = '🎯 DÉFI DU JOUR';
            title.classList.remove('victory');
            subtitle.textContent = `Tu as atteint le stage ${stats.level}`;
        } else if (stats.reason === 'victory') {
            title.textContent = 'VICTOIRE !';
            title.classList.add('victory');
            subtitle.textContent = 'Tu as conquis le Néant !';
        } else {
            title.textContent = 'RUN TERMINÉE';
            title.classList.remove('victory');
            subtitle.textContent = `Tu as atteint le stage ${stats.level}`;
        }

        // Afficher résultat Daily si applicable
        const dailyResult = document.getElementById('rl-daily-result');
        if (isDaily) {
            const rank = roguelikeManager.lastDailyRank;
            const targetReached = roguelikeManager.lastDailyTargetReached;
            const bonusXP = roguelikeManager.lastDailyBonusXP || 0;

            dailyResult.innerHTML = `
                <div class="daily-result-card ${targetReached ? 'success' : ''}">
                    <div class="daily-rank">
                        <span class="rank-label">Classement du jour</span>
                        <span class="rank-value">#${rank}</span>
                    </div>
                    ${targetReached ? `
                        <div class="daily-bonus">
                            <span class="bonus-icon">🎯</span>
                            <span class="bonus-text">Objectif atteint ! +${bonusXP} XP</span>
                        </div>
                    ` : `
                        <div class="daily-miss">
                            <span class="miss-text">Objectif non atteint</span>
                        </div>
                    `}
                </div>
            `;
            dailyResult.style.display = 'block';

            // Reset les valeurs
            roguelikeManager.lastDailyRank = null;
            roguelikeManager.lastDailyTargetReached = null;
            roguelikeManager.lastDailyBonusXP = null;
        } else {
            dailyResult.style.display = 'none';
        }

        // Stats
        const statsContainer = document.getElementById('rl-run-stats');
        statsContainer.innerHTML = `
            <div class="rl-stat-card">
                <div class="rl-stat-value">${stats.level}</div>
                <div class="rl-stat-label">Stage</div>
            </div>
            <div class="rl-stat-card">
                <div class="rl-stat-value">${stats.score}</div>
                <div class="rl-stat-label">Score</div>
            </div>
            <div class="rl-stat-card">
                <div class="rl-stat-value">${stats.applesEaten}</div>
                <div class="rl-stat-label">Pommes</div>
            </div>
            <div class="rl-stat-card">
                <div class="rl-stat-value">${stats.upgradesCollected}</div>
                <div class="rl-stat-label">Upgrades</div>
            </div>
            <div class="rl-stat-card">
                <div class="rl-stat-value">${this.formatTime(stats.timePlayed)}</div>
                <div class="rl-stat-label">Temps</div>
            </div>
            <div class="rl-stat-card">
                <div class="rl-stat-value">${stats.powerupsCollected}</div>
                <div class="rl-stat-label">Power-ups</div>
            </div>
        `;

        // XP
        document.getElementById('rl-xp-earned').textContent = `+${stats.earnedXP}`;

        // Afficher
        this.runEndScreen.classList.remove('hidden');

        // Son
        if (window.audio) {
            if (stats.reason === 'victory') {
                window.audio.victory?.();
            } else {
                window.audio.gameOver?.();
            }
        }
    }

    hideRunEnd() {
        this.runEndScreen.classList.add('hidden');
    }

    // ========== HUD IN-GAME ==========

    updateHUD(levelData, run) {
        // Le HUD sera intégré dans l'écran de jeu existant
        // Pour l'instant, on log juste
        logger.log(`[RoguelikeUI] HUD mis à jour - Niveau ${run.level}: ${levelData.name}`);
    }

    // ========== UTILITAIRES ==========

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Instance singleton
const roguelikeUI = new RoguelikeUI();

// Exposer globalement
window.roguelikeUI = roguelikeUI;

export default roguelikeUI;
