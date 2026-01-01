/**
 * BOSS RUSH UI
 * Interface utilisateur pour le mode Boss Rush
 *
 * - Écran de sélection/démarrage
 * - Transitions entre les boss
 * - Écran de fin de run
 */

import { logger } from '../services/logger.js';
import { BOSS_RUSH_STAGES } from '../modes/BossRushManager.js';

// ============================================
// CLASSE BOSS RUSH UI
// ============================================

// Données des boss pour l'écran pré-boss
const BOSS_DATA = {
    titan: {
        id: 'titan',
        name: 'TITAN',
        subtitle: 'Cœur de Pierre',
        element: 'rock',
        icon: '🪨',
        image: 'assets/backgrounds/backgrounds_roche_hub.webp',
        color: '#FF8C00',
        gradient: 'linear-gradient(135deg, #8B4513, #FF8C00)',
        segments: 15,
        timer: '2:00',
        tips: [
            'Évite les murs qui apparaissent',
            'Attaque quand le boss est vulnérable',
            'Garde ton calme, le temps est suffisant'
        ]
    },
    cryo: {
        id: 'cryo',
        name: 'CRYO',
        subtitle: 'Gardien du Givre',
        element: 'ice',
        icon: '❄️',
        image: 'assets/backgrounds/backgrounds_glace_hub.webp',
        color: '#00FFFF',
        gradient: 'linear-gradient(135deg, #0066CC, #00FFFF)',
        segments: 15,
        timer: '2:00',
        tips: [
            'Attention aux zones de glace',
            'Le boss ralentit tes mouvements',
            'Reste mobile pour ne pas geler'
        ]
    },
    spectre: {
        id: 'spectre',
        name: 'SPECTRE',
        subtitle: "L'Âme Errante",
        element: 'ghost',
        icon: '👻',
        image: 'assets/backgrounds/backgrounds_ghost_hub.webp',
        color: '#9370DB',
        gradient: 'linear-gradient(135deg, #4B0082, #9370DB)',
        segments: 15,
        timer: '2:00',
        tips: [
            'Le boss devient invisible parfois',
            'Évite les crânes fantômes',
            'Anticipe ses mouvements'
        ]
    },
    foudre: {
        id: 'foudre',
        name: 'FOUDRE',
        subtitle: 'Fureur du Ciel',
        element: 'lightning',
        icon: '⚡',
        image: 'assets/backgrounds/backgrounds_foudre_hub.webp',
        color: '#FFD700',
        gradient: 'linear-gradient(135deg, #FF8C00, #FFD700)',
        segments: 15,
        timer: '2:00',
        tips: [
            'Évite les lignes d\'éclairs',
            'Le boss est très agressif',
            'C\'est le combat final, donne tout!'
        ]
    }
};

class BossRushUI {
    constructor() {
        this.transitionCallback = null;
        this.preBossFightCallback = null;
        this.currentBossId = null;
        logger.log('[BossRushUI] Initialisé');
    }

    // ============================================
    // ÉCRAN PRÉ-BOSS
    // ============================================

    /**
     * Affiche l'écran pré-boss avant le combat
     * @param {string} bossId - ID du boss (titan, cryo, spectre, foudre)
     * @param {object} stageConfig - Config du stage (segments, timer, etc.)
     * @param {Function} onFight - Callback quand le joueur clique "COMBATTRE"
     */
    showPreBossScreen(bossId, stageConfig, onFight) {
        const bossData = BOSS_DATA[bossId.toLowerCase()] || BOSS_DATA.titan;
        this.currentBossId = bossId;
        this.preBossFightCallback = onFight;

        // Récupérer les éléments
        const screen = document.getElementById('pre-boss-screen');
        const bgImg = document.getElementById('preboss-bg-img');
        const portraitImg = document.getElementById('preboss-portrait-img');
        const card = document.getElementById('preboss-card');
        const element = document.getElementById('preboss-element');
        const name = document.getElementById('preboss-name');
        const subtitle = document.getElementById('preboss-subtitle');
        const segments = document.getElementById('preboss-segments');
        const timer = document.getElementById('preboss-timer');
        const tipsList = document.getElementById('preboss-tips-list');
        const fightBtn = document.getElementById('preboss-fight-btn');

        if (!screen) {
            logger.error('[BossRushUI] Écran pré-boss introuvable');
            if (onFight) onFight();
            return;
        }

        // Appliquer le thème du boss
        screen.className = `screen boss-${bossId.toLowerCase()}`;
        card.className = `preboss-card boss-${bossId.toLowerCase()}`;

        // Images
        bgImg.src = bossData.image;
        portraitImg.src = bossData.image;

        // Infos
        element.textContent = bossData.icon;
        name.textContent = bossData.name;
        name.style.color = bossData.color;
        subtitle.textContent = `"${bossData.subtitle}"`;

        // Stats (utiliser stageConfig si disponible)
        segments.textContent = stageConfig?.bossSegments || bossData.segments;
        const timeLimit = stageConfig?.timeLimit || 120;
        const mins = Math.floor(timeLimit / 60);
        const secs = timeLimit % 60;
        timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        // Tips
        tipsList.innerHTML = bossData.tips.map(tip => `<li>${tip}</li>`).join('');

        // Réinitialiser les tips (fermés)
        const tipsContent = document.getElementById('preboss-tips-content');
        const tipsArrow = document.getElementById('preboss-tips-arrow');
        if (tipsContent) tipsContent.classList.add('hidden');
        if (tipsArrow) tipsArrow.classList.remove('expanded');

        // Style du bouton selon le boss
        fightBtn.style.background = bossData.gradient;
        fightBtn.style.setProperty('--boss-glow', bossData.color + '66');

        // Afficher l'écran
        if (window.screenManager) {
            window.screenManager.show('pre-boss-screen');
        } else {
            screen.classList.remove('hidden');
        }

        // Son d'ambiance
        if (window.audio?.bossIntro) {
            window.audio.bossIntro();
        }

        logger.log(`[BossRushUI] Écran pré-boss affiché: ${bossData.name}`);
    }

    /**
     * Lance le combat depuis l'écran pré-boss
     */
    startFightFromPreBoss() {
        // Flash blanc
        this.flashWhite();

        // Son
        if (window.audio?.buttonClick) {
            window.audio.buttonClick();
        }

        // Cacher immédiatement l'écran pré-boss
        this.hidePreBossScreen();

        // Attendre le flash puis lancer le combat
        setTimeout(() => {
            if (this.preBossFightCallback) {
                this.preBossFightCallback();
                this.preBossFightCallback = null;
            }
        }, 150);
    }

    /**
     * Cache l'écran pré-boss
     */
    hidePreBossScreen() {
        const screen = document.getElementById('pre-boss-screen');
        if (screen) {
            screen.classList.add('hidden');
            screen.style.display = 'none';
        }
        this.currentBossId = null;
    }

    /**
     * Flash blanc rapide pour la transition
     */
    flashWhite() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: white;
            z-index: 99999;
            opacity: 0;
            pointer-events: none;
            animation: prebossFlash 0.15s ease-out forwards;
        `;

        // Ajouter l'animation CSS temporairement
        const style = document.createElement('style');
        style.textContent = `
            @keyframes prebossFlash {
                0% { opacity: 0; }
                50% { opacity: 0.8; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(flash);

        setTimeout(() => {
            flash.remove();
            style.remove();
        }, 200);
    }

    // ============================================
    // ÉCRAN DE TRANSITION ENTRE BOSS
    // ============================================

    /**
     * Affiche l'écran de transition vers le prochain boss
     */
    showTransition(nextStageConfig, onContinue) {
        this.transitionCallback = onContinue;

        // Créer ou récupérer l'overlay
        let overlay = document.getElementById('boss-rush-transition');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'boss-rush-transition';
            overlay.className = 'boss-rush-transition';
            // Styles inline pour garantir le plein écran
            overlay.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                background: rgba(0, 0, 0, 0.95) !important;
                z-index: 99999 !important;
                display: none;
                justify-content: center;
                align-items: center;
            `;
            document.body.appendChild(overlay);
        }

        const stageNum = nextStageConfig.stage;
        const prevStage = stageNum - 1;

        // Écran de transition style AAA
        overlay.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #4caf50; border-radius: 20px; padding: 30px 40px; box-shadow: 0 0 40px rgba(76,175,80,0.3); max-width: 480px; width: 90%; text-align: center; color: white;">

                <!-- Victoire -->
                <div style="margin-bottom: 25px;">
                    <div style="font-size: 70px; margin-bottom: 15px;">⚔️</div>
                    <div style="font-size: 28px; font-weight: bold; color: #4caf50; text-shadow: 0 0 20px rgba(76,175,80,0.5);">
                        BOSS VAINCU !
                    </div>
                </div>

                <!-- Progression des boss -->
                <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 25px;">
                    ${this.renderBossCardsProgress(prevStage)}
                </div>

                <!-- Prochain boss -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                    <div style="font-size: 14px; color: #888; margin-bottom: 12px;">PROCHAIN ADVERSAIRE</div>
                    <div style="font-size: 32px; font-weight: bold; color: ${nextStageConfig.color}; text-shadow: 0 0 20px ${nextStageConfig.color};">
                        ${nextStageConfig.name}
                    </div>
                    <div style="font-size: 18px; color: #aaa; margin-top: 8px;">${nextStageConfig.subtitle}</div>
                    <div style="font-size: 14px; color: #888; margin-top: 12px;">
                        Difficulté: <span style="color: ${nextStageConfig.color}; font-weight: bold;">${nextStageConfig.difficulty}</span>
                    </div>
                </div>

                <!-- Bouton -->
                <button onclick="bossRushUI.continueToNextBoss()" style="
                    background: linear-gradient(135deg, #ff4400 0%, #ff6600 100%);
                    border: none;
                    color: white;
                    width: 100%;
                    padding: 18px;
                    font-size: 20px;
                    font-weight: bold;
                    border-radius: 12px;
                    cursor: pointer;
                    box-shadow: 0 0 20px rgba(255, 68, 0, 0.4);
                ">
                    ⚔️ CONTINUER
                </button>
            </div>
        `;

        // Afficher l'overlay en forçant display: flex
        overlay.style.display = 'flex';
        overlay.classList.add('visible');

        // Son de victoire
        if (window.audio?.victory) {
            window.audio.victory();
        }
    }

    /**
     * Rend les cartes de progression des boss (style AAA)
     */
    renderBossCardsProgress(completedStages) {
        const bosses = [
            { num: 1, name: 'TITAN', color: '#8B4513' },
            { num: 2, name: 'CRYO', color: '#00BFFF' },
            { num: 3, name: 'SPECTRE', color: '#9932CC' },
            { num: 4, name: 'FOUDRE', color: '#FFD700' }
        ];

        return bosses.map(boss => {
            const isCompleted = boss.num <= completedStages;
            const opacity = isCompleted ? '1' : '0.4';
            const boxShadow = isCompleted ? `0 0 15px ${boss.color}` : 'none';

            return `
                <div style="background: rgba(${this.hexToRgb(boss.color)},0.1); border: 3px solid ${boss.color}; border-radius: 12px; padding: 12px 16px; text-align: center; min-width: 60px; opacity: ${opacity}; box-shadow: ${boxShadow};">
                    <div style="font-size: 24px; font-weight: bold; color: ${boss.color};">${boss.num}</div>
                    <div style="font-size: 9px; color: #fff;">${boss.name}</div>
                    ${isCompleted ? '<div style="font-size: 12px; color: #4caf50; margin-top: 4px;">✓</div>' : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Convertit hex en rgb pour rgba()
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
        }
        return '255,255,255';
    }

    /**
     * Rend les points de progression (1-4) - Version avec styles inline (legacy)
     */
    renderProgressDotsStyled(completedStages) {
        let html = '';
        const stageColors = ['#00ff00', '#00ff88', '#ff4400', '#8800ff'];

        for (let i = 1; i <= 4; i++) {
            const color = stageColors[i - 1];
            const isCompleted = i <= completedStages;
            const isCurrent = i === completedStages + 1;

            const bgColor = isCompleted ? color : (isCurrent ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)');
            const borderColor = isCompleted ? color : (isCurrent ? color : '#444');
            const boxShadow = isCompleted || isCurrent ? `0 0 15px ${color}` : 'none';

            html += `
                <div style="
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: ${bgColor};
                    border: 3px solid ${borderColor};
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    box-shadow: ${boxShadow};
                    transition: all 0.3s;
                ">
                    <span style="font-size: 16px; font-weight: bold; color: ${isCompleted ? '#000' : '#fff'};">${i}</span>
                    ${isCompleted ? `<span style="position: absolute; top: -5px; right: -5px; font-size: 14px; color: ${color};">✓</span>` : ''}
                </div>
            `;
        }
        return html;
    }

    /**
     * Rend les points de progression (1-4) - Version CSS classes (fallback)
     */
    renderProgressDots(completedStages) {
        return this.renderProgressDotsStyled(completedStages);
    }

    /**
     * Continue vers le prochain boss
     */
    continueToNextBoss() {
        const overlay = document.getElementById('boss-rush-transition');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.remove('visible');
            overlay.remove();
        }

        if (window.audio?.buttonClick) {
            window.audio.buttonClick();
        }

        if (this.transitionCallback) {
            this.transitionCallback();
            this.transitionCallback = null;
        }
    }

    /**
     * Nettoie tous les overlays Boss Rush
     */
    cleanup() {
        const overlays = ['boss-rush-start', 'boss-rush-transition', 'boss-intro-screen'];
        overlays.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        // Cacher l'écran pré-boss
        this.hidePreBossScreen();
    }

    // ============================================
    // ÉCRAN DE FIN DE RUN
    // ============================================

    /**
     * Affiche l'écran de fin (victoire ou défaite)
     */
    showEndScreen(stats) {
        const isVictory = stats.completed;

        // Nettoyer tous les overlays Boss Rush résiduels
        this.cleanup();

        // Utiliser l'écran over-boss-rush
        const screen = document.getElementById('over-boss-rush');
        if (!screen) {
            logger.error('[BossRushUI] Écran over-boss-rush introuvable');
            // Fallback : retour au hub
            if (window.screenManager) {
                window.screenManager.show('hub');
            }
            return;
        }

        // Icône (par ID)
        const icon = document.getElementById('br-result-icon');
        if (icon) {
            icon.textContent = isVictory ? '🏆' : '💀';
        }

        // Titre (par ID)
        const title = document.getElementById('br-result-title');
        if (title) {
            title.textContent = isVictory ? 'VICTOIRE !' : 'DÉFAITE';
            title.style.color = isVictory ? '#4caf50' : '#ff4444';
            title.style.textShadow = isVictory
                ? '0 0 20px rgba(76,175,80,0.5)'
                : '0 0 20px rgba(255,68,68,0.5)';
        }

        // Sous-titre (par ID)
        const subtitle = document.getElementById('br-result-subtitle');
        if (subtitle) {
            subtitle.textContent = isVictory
                ? 'Tu as vaincu les 4 boss légendaires !'
                : 'Le Boss Rush t\'a vaincu';
        }

        // Stats
        this.updateEndScreenStats(screen, stats);

        // Afficher l'écran via screenManager (gère le z-index et les autres écrans)
        if (window.screenManager) {
            window.screenManager.show('over-boss-rush');
        }
    }

    /**
     * Met à jour les stats de l'écran de fin
     */
    updateEndScreenStats(screen, stats) {
        const bossesDefeated = stats.completed ? 4 : (stats.stageReached - 1);

        // Stage atteint
        const stageEl = screen.querySelector('#br-stage-reached');
        if (stageEl) {
            stageEl.textContent = `${bossesDefeated}/4`;
        }

        // Temps total
        const timeEl = screen.querySelector('#br-total-time');
        if (timeEl) {
            const mins = Math.floor(stats.totalTime / 60);
            const secs = Math.floor(stats.totalTime % 60);
            timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // XP gagné
        const xpEl = screen.querySelector('#br-xp-earned');
        if (xpEl) {
            xpEl.textContent = `+${stats.earnedXP || 0} XP`;
        }

        // Coins gagnés
        const coinsEl = screen.querySelector('#br-coins-earned');
        if (coinsEl) {
            coinsEl.textContent = `+${stats.earnedCoins || 0}`;
        }

        // Progression visuelle des boss (opacity pour montrer lesquels sont vaincus)
        for (let i = 1; i <= 4; i++) {
            const bossEl = document.getElementById(`br-boss-${i}`);
            if (bossEl) {
                if (i <= bossesDefeated) {
                    // Boss vaincu - pleine opacité + checkmark
                    bossEl.style.opacity = '1';
                    bossEl.style.boxShadow = '0 0 15px currentColor';
                } else {
                    // Boss non vaincu - faible opacité
                    bossEl.style.opacity = '0.4';
                    bossEl.style.boxShadow = 'none';
                }
            }
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// ============================================
// INSTANCE SINGLETON & EXPORTS
// ============================================

const bossRushUI = new BossRushUI();

// Exposer globalement
window.bossRushUI = bossRushUI;

// Fonctions globales pour l'écran pré-boss (appelées depuis HTML onclick)
window.togglePreBossTips = function() {
    const content = document.getElementById('preboss-tips-content');
    const arrow = document.getElementById('preboss-tips-arrow');

    if (content && arrow) {
        content.classList.toggle('hidden');
        arrow.classList.toggle('expanded');

        if (window.audio?.buttonClick) {
            window.audio.buttonClick();
        }
    }
};

window.startPreBossFight = function() {
    if (window.bossRushUI) {
        window.bossRushUI.startFightFromPreBoss();
    }
};

export { bossRushUI, BossRushUI, BOSS_DATA };
export default bossRushUI;
