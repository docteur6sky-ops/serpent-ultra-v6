/**
 * PROGRESSION MANAGER - Gestion de l'overlay de progression
 *
 * Responsabilités :
 * - Affichage overlay progression XP/Niveau
 * - Animation des trophées débloqués
 * - Écran de stats final
 * - Synchronisation career
 */

import { logger } from '../services/logger.js';

// ============================================
// CLASSE PROGRESSION MANAGER
// ============================================

class ProgressionManager {
    constructor() {
        this.lastGameStats = null;
        this.lastGameXPGained = 0;
        this.lastBoosterBonus = 0;
        this.pendingCareerUpdate = null;
        logger.log('[ProgressionManager] Initialisé');
    }

    /**
     * Affiche l'overlay de progression XP/Niveau avec trophées séquentiels
     * @param {object} stats - Statistiques de la partie
     */
    showProgressionOverlay(stats) {
        // Stocker les stats
        this.lastGameStats = stats;
        window.lastGameStats = stats;

        // Récupérer les trophées débloqués de cette partie
        const trophies = window.sessionTrophies || [];

        // Calculer XP de la partie (score ÷ 5)
        const baseGameXP = Math.floor(stats.score / 5);

        // Calculer le bonus booster si actif
        let boosterBonus = 0;
        let boosterPercent = 0;
        if (window.boxManager && window.boxManager.isBoosterActive()) {
            const multiplier = window.boxManager.getXpMultiplier();
            boosterPercent = Math.round((multiplier - 1) * 100);
            boosterBonus = Math.floor(baseGameXP * (multiplier - 1));
        }
        const gameXP = baseGameXP + boosterBonus;

        // Stocker pour l'écran final
        this.lastGameXPGained = gameXP;
        this.lastBoosterBonus = boosterBonus;
        window.lastGameXPGained = gameXP;
        window.lastBoosterBonus = boosterBonus;

        // Récupérer niveau/XP actuel depuis career
        let currentXP = window.career ? window.career.xp : 0;
        let currentLevel = window.career ? window.career.level : 1;
        let currentXPNext = window.career ? window.career.xpNext : 100;

        // Afficher overlay immédiatement
        const overlay = document.getElementById('progression-overlay');
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';

        // Références aux éléments
        const levelNum = document.getElementById('progression-level-num');
        const xpText = document.getElementById('progression-xp-text');
        const trophiesContainer = document.getElementById('progression-trophies');
        const trophiesList = document.getElementById('progression-trophies-list');
        const levelUpAnim = document.getElementById('level-up-animation');
        const nextBtn = document.getElementById('progression-next-btn');

        // Initialiser l'affichage
        if (levelNum) levelNum.textContent = currentLevel;
        if (xpText) xpText.textContent = `${currentXP}/${currentXPNext} XP`;

        // Masquer section trophées et level up par défaut
        if (trophiesContainer) trophiesContainer.classList.add('hidden');
        if (levelUpAnim) levelUpAnim.classList.add('hidden');
        if (trophiesList) trophiesList.innerHTML = '';

        // Désactiver le bouton pendant l'animation
        if (nextBtn) nextBtn.disabled = true;

        // Variables temporaires pour l'animation
        let tempXP = currentXP;
        let tempLevel = currentLevel;
        let tempXPNext = currentXPNext;
        let delay = 500;

        // ÉTAPE 1 : Afficher et ajouter l'XP de la partie
        if (gameXP > 0) {
            if (trophiesContainer) trophiesContainer.classList.remove('hidden');

            setTimeout(() => {
                // Ajouter l'XP de la partie dans la liste
                const gameXPDiv = document.createElement('div');
                gameXPDiv.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: linear-gradient(135deg, rgba(76,175,80,0.2), rgba(46,125,50,0.1));
                    border: 2px solid rgba(76,175,80,0.5);
                    border-radius: 10px;
                    margin-bottom: 10px;
                    animation: trophySlideIn 0.5s ease-out;
                `;

                // Affichage avec ou sans bonus booster
                const boosterLine = boosterBonus > 0
                    ? `<div style="color: #E040FB; font-size: 12px; margin-top: 2px;">⚗️ Booster +${boosterPercent}%: +${boosterBonus} XP</div>`
                    : '';

                gameXPDiv.innerHTML = `
                    <div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background: rgba(76,175,80,0.3); border-radius: 8px; font-size: 24px;">
                        🎮
                    </div>
                    <div style="flex: 1;">
                        <div style="color: #4CAF50; font-weight: bold; font-size: 15px;">XP de la Partie</div>
                        <div style="color: #aaa; font-size: 13px;">Score: ${stats.score} points${boosterBonus > 0 ? ` (base: ${baseGameXP})` : ''}</div>
                        ${boosterLine}
                    </div>
                    <div style="color: ${boosterBonus > 0 ? '#E040FB' : '#4CAF50'}; font-weight: bold; font-size: 16px;">+${gameXP} XP</div>
                `;

                if (trophiesList) trophiesList.appendChild(gameXPDiv);

                // Ajouter XP et animer
                tempXP += gameXP;

                // Gérer level up
                while (tempXP >= tempXPNext && tempLevel < 100) {
                    tempXP -= tempXPNext;
                    tempLevel++;
                    tempXPNext = 100 + (tempLevel * 100);

                    if (levelUpAnim) {
                        document.getElementById('new-level').textContent = tempLevel;
                        levelUpAnim.classList.remove('hidden');
                        if (window.audio && window.audio.powerup) window.audio.powerup();
                    }
                }

                this._updateProgressBar(tempXP, tempLevel, tempXPNext);
            }, delay);

            delay += 1200;
        }

        // ÉTAPE 2 : Si pas de trophées, terminer ici
        if (trophies.length === 0) {
            setTimeout(() => {
                if (nextBtn) {
                    nextBtn.disabled = false;
                    const btnText = document.getElementById('progression-btn-text');
                    if (btnText) btnText.textContent = 'Voir les Stats';
                }
            }, delay + 800);
            return;
        }

        // ÉTAPE 3 : Afficher les trophées séquentiellement
        if (trophiesContainer) trophiesContainer.classList.remove('hidden');

        trophies.forEach((trophy, index) => {
            setTimeout(() => {
                const trophyDiv = document.createElement('div');
                trophyDiv.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.1));
                    border: 2px solid rgba(255,215,0,0.5);
                    border-radius: 10px;
                    margin-bottom: 10px;
                    animation: trophySlideIn 0.5s ease-out;
                `;

                trophyDiv.innerHTML = `
                    <img src="assets/trophies/${trophy.image}" alt="${trophy.name}"
                         style="width: 50px; height: 50px; border-radius: 8px;">
                    <div style="flex: 1;">
                        <div style="color: #FFD700; font-weight: bold; font-size: 15px;">${trophy.emoji} ${trophy.name}</div>
                        <div style="color: #aaa; font-size: 13px;">${trophy.description}</div>
                    </div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 16px;">+${trophy.xp} XP</div>
                `;

                if (trophiesList) trophiesList.appendChild(trophyDiv);

                // Ajouter XP et animer la barre
                tempXP += trophy.xp;

                // Gérer level up
                while (tempXP >= tempXPNext && tempLevel < 100) {
                    tempXP -= tempXPNext;
                    tempLevel++;
                    tempXPNext = 100 + (tempLevel * 100);

                    if (levelUpAnim) {
                        document.getElementById('new-level').textContent = tempLevel;
                        levelUpAnim.classList.remove('hidden');
                        if (window.audio && window.audio.powerup) window.audio.powerup();
                    }
                }

                this._updateProgressBar(tempXP, tempLevel, tempXPNext);

                // Si c'est le dernier trophée, activer le bouton
                if (index === trophies.length - 1) {
                    setTimeout(() => {
                        if (nextBtn) {
                            nextBtn.disabled = false;
                            const btnText = document.getElementById('progression-btn-text');
                            if (btnText) btnText.textContent = 'Voir les Stats';
                        }
                    }, 800);
                }
            }, delay);

            delay += 1200;
        });

        // Stocker les valeurs finales pour synchronisation
        const totalXPToAdd = gameXP + trophies.reduce((sum, t) => sum + t.xp, 0);
        this.pendingCareerUpdate = {
            totalXP: totalXPToAdd,
            baseLevel: currentLevel,
            baseXP: currentXP,
            baseXPNext: currentXPNext
        };
        window.pendingCareerUpdate = this.pendingCareerUpdate;

        // Réinitialiser sessionTrophies après affichage
        window.sessionTrophies = [];
    }

    /**
     * Met à jour la barre de progression XP
     */
    _updateProgressBar(xp, level, xpNext) {
        const levelNum = document.getElementById('progression-level-num');
        const xpText = document.getElementById('progression-xp-text');
        const circleFill = document.getElementById('progression-circle-fill');

        if (levelNum) levelNum.textContent = level;
        if (xpText) xpText.textContent = `${xp}/${xpNext} XP`;

        if (circleFill) {
            const percentage = xp / xpNext;
            const circumference = 2 * Math.PI * 65;
            const offset = circumference * (1 - percentage);
            circleFill.style.transition = 'stroke-dashoffset 0.8s ease-out';
            circleFill.style.strokeDashoffset = offset;
        }
    }

    /**
     * Cache l'overlay progression et affiche les stats finales
     */
    showFinalStats() {
        if (window.audio) window.audio.buttonClick();

        // Sync career
        this.syncCareerFromAnimation();

        // Cacher overlay progression
        const progressionOverlay = document.getElementById('progression-overlay');
        progressionOverlay.classList.add('hidden');
        progressionOverlay.style.display = 'none';

        // Afficher écran stats
        window.screenManager.show('over');

        // Récupérer les stats stockées
        const stats = this.lastGameStats;

        // Afficher les stats de jeu
        setTimeout(() => {
            const difficultyEmojis = {
                'Facile': '😊',
                'Normal': '😮',
                'Difficile': '😈'
            };

            const elements = {
                fsc: document.getElementById('fsc'),
                fxp: document.getElementById('fxp'),
                flv: document.getElementById('flv'),
                ffood: document.getElementById('ffood'),
                ftime: document.getElementById('ftime'),
                fmaxlength: document.getElementById('fmaxlength'),
                fwalls: document.getElementById('fwalls'),
                fskulls: document.getElementById('fskulls'),
                fdiffEmoji: document.getElementById('fdiff-emoji'),
                fice: document.getElementById('fice'),
                ffire: document.getElementById('ffire'),
                frock: document.getElementById('frock'),
                fghost: document.getElementById('fghost')
            };

            if (elements.fsc) elements.fsc.textContent = stats.score || 0;
            if (elements.fxp) {
                const totalXP = this.lastGameXPGained || 0;
                const bonus = this.lastBoosterBonus || 0;
                if (bonus > 0) {
                    elements.fxp.innerHTML = `+${totalXP} XP <span style="color:#E040FB;font-size:0.8em;">(⚗️+${bonus})</span>`;
                } else {
                    elements.fxp.textContent = `+${totalXP} XP`;
                }
            }
            if (elements.flv) elements.flv.textContent = stats.level || 1;
            if (elements.ffood) elements.ffood.textContent = stats.foodCount || 0;
            if (elements.ftime) elements.ftime.textContent = stats.timeString || '0:00';
            if (elements.fmaxlength) elements.fmaxlength.textContent = stats.maxSnakeLength || 1;
            if (elements.fwalls) elements.fwalls.textContent = stats.wallsDestroyed || 0;
            if (elements.fskulls) elements.fskulls.textContent = stats.skullsEaten || 0;

            if (elements.fdiffEmoji && stats.difficulty) {
                elements.fdiffEmoji.textContent = difficultyEmojis[stats.difficulty] || '😊';
            }

            if (elements.fice) elements.fice.textContent = stats.slowCount || 0;
            if (elements.ffire) elements.ffire.textContent = stats.doubleCount || 0;
            if (elements.frock) elements.frock.textContent = stats.invincibleCount || 0;
            if (elements.fghost) elements.fghost.textContent = stats.ghostCount || 0;
        }, 100);
    }

    /**
     * Synchronise les données career depuis l'animation
     */
    syncCareerFromAnimation() {
        const update = this.pendingCareerUpdate || window.pendingCareerUpdate;
        if (update && window.career) {
            // Recalculer depuis les valeurs de base
            let xp = update.baseXP + update.totalXP;
            let level = update.baseLevel;
            let xpNext = update.baseXPNext;

            // Gérer les level up
            while (xp >= xpNext && level < 100) {
                xp -= xpNext;
                level++;
                xpNext = 100 + (level * 100);
            }

            // Mettre à jour window.career
            window.career.xp = xp;
            window.career.level = level;
            window.career.xpNext = xpNext;

            // Sauvegarder
            if (window.save) {
                window.save('career', window.career);
                logger.log(`[ProgressionManager] Career synced: Level ${level}, XP ${xp}/${xpNext}`);
            }

            // Nettoyer
            this.pendingCareerUpdate = null;
            delete window.pendingCareerUpdate;
        }
    }

    /**
     * Retour au Hub depuis l'overlay Progression
     */
    returnToHubFromProgression() {
        if (window.audio) window.audio.buttonClick();

        // Synchroniser career
        this.syncCareerFromAnimation();

        // Cacher overlay progression
        const progressionOverlay = document.getElementById('progression-overlay');
        if (progressionOverlay) {
            progressionOverlay.classList.add('hidden');
            progressionOverlay.style.display = 'none';
        }

        // Nettoyer le jeu solo si actif
        if (window.soloGame && window.soloGame.stop) {
            window.soloGame.stop();
        }

        // Retour au HUB
        window.screenManager.show('hub');
    }

    /**
     * Rejouer depuis l'overlay Progression
     */
    replayFromProgression() {
        if (window.audio) window.audio.buttonClick();

        // Synchroniser career
        this.syncCareerFromAnimation();

        // Cacher overlay progression
        const progressionOverlay = document.getElementById('progression-overlay');
        if (progressionOverlay) {
            progressionOverlay.classList.add('hidden');
            progressionOverlay.style.display = 'none';
        }

        // Relancer une partie solo
        if (window.replaySolo) {
            window.replaySolo();
        } else if (window.startSoloGame) {
            window.startSoloGame();
        }
    }

    /**
     * Retour au menu depuis l'écran Stats
     */
    returnToMenuFromStats() {
        if (window.audio) window.audio.buttonClick();

        // Nettoyer le jeu solo si actif
        if (window.soloGame && window.soloGame.stop) {
            window.soloGame.stop();
        }

        // Retour au HUB
        window.screenManager.show('hub');

        // Rafraîchir le hub
        if (window.initHub) {
            setTimeout(() => window.initHub(), 100);
        }

        setTimeout(() => {
            if (window.updatePlayerProgress) {
                window.updatePlayerProgress();
            }
            if (window.initHub) {
                window.initHub();
            }
        }, 150);
    }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

const progressionManager = new ProgressionManager();

// Exposer globalement pour compatibilité HTML onclick
window.progressionManager = progressionManager;
window.showProgressionOverlay = (stats) => progressionManager.showProgressionOverlay(stats);
window.showFinalStats = () => progressionManager.showFinalStats();
window.returnToHubFromProgression = () => progressionManager.returnToHubFromProgression();
window.replayFromProgression = () => progressionManager.replayFromProgression();
window.returnToMenuFromStats = () => progressionManager.returnToMenuFromStats();

logger.log('✅ ProgressionManager chargé');

export { progressionManager, ProgressionManager };
