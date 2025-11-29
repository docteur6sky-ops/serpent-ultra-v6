// ============================================
// NAVIGATION - GESTION DES ÉCRANS ET MODES
// ============================================

import { logger } from './services/logger.js';
import { SnakeUltra } from './SnakeUltra.js';
import {
    soloController,
    multiController,
    gameOverHandler,
    menuController
} from './ui/index.js';

// Instances globales des jeux
let soloGameInstance = null;
let multiGameInstance = null;
let currentDifficulty = 0; // 0 = Facile, 1 = Normal, 2 = Difficile

// Exposer currentDifficulty globalement pour le HTML
window.currentDifficulty = currentDifficulty;

// ============================================
// FONCTIONS DE NAVIGATION
// ============================================

// Utiliser le ScreenManager global
const showScreen = (screenId) => window.screenManager.show(screenId);
const hideAllScreens = () => window.screenManager.hideAll();

// ============================================
// MODE SOLO
// ============================================

/**
 * Démarre le mode solo
 */
window.start = function() {

    // Afficher l'écran de jeu solo
    window.screenManager.show('game-solo');

    // Créer l'instance si elle n'existe pas
    if (!soloGameInstance) {
        try {
            soloGameInstance = new SoloSnakeGame();
            window.soloGame = soloGameInstance; // Exposer globalement pour index.html
        } catch (error) {
            alert('Erreur: Impossible de créer le jeu solo');
            return;
        }
    }

    // Démarrer le jeu avec la difficulté sélectionnée
    soloGameInstance.start(currentDifficulty);

    // Lancer la musique de jeu si disponible
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('game');
    }
};

/**
 * Met en pause / reprend le jeu solo
 */
window.pauseSolo = function() {

    if (soloGameInstance) {
        // Vérifier l'état AVANT de toggler
        const wasPaused = soloGameInstance.paused;

        // Toggle pause
        soloGameInstance.pause();

        // Son de pause
        if (window.audio && window.audio.buttonClick) {
            window.audio.buttonClick();
        }

        // Gérer la musique selon le nouvel état
        if (window.audioManager) {
            if (wasPaused) {
                // Le jeu était en pause, on reprend
                window.audioManager.resume();
            } else {
                // Le jeu tourne, on met en pause
                window.audioManager.pause();
            }
        }
    }
};

/**
 * Quitter le mode solo et retourner au menu
 */
window.quitSolo = function() {
    window.audio.buttonClick();

    // Mettre le jeu en pause
    if (soloGameInstance && soloGameInstance.running) {
        soloGameInstance.pause();
    }

    // Afficher l'overlay
    const overlay = document.getElementById('solo-quit-overlay');
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
};

/**
 * Confirmer la sortie du mode solo
 */
function confirmQuitSolo() {
    window.audio.buttonClick();

    // Cacher l'overlay
    const overlay = document.getElementById('solo-quit-overlay');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';

    // Arrêter le jeu
    if (soloGameInstance) {
        soloGameInstance.stop();
    }

    // Retour au HUB V6
    window.screenManager.show('hub');

    // ✅ METTRE À JOUR LE NIVEAU ET LE CERCLE D'XP
    if (window.updatePlayerProgress) {
        window.updatePlayerProgress();
    }

    // Rafraîchir le hub
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }

    // Lancer la musique du menu
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('menu');
    }
}

/**
 * Annuler la sortie et reprendre le jeu
 */
function cancelQuitSolo() {
    window.audio.buttonClick();

    // Cacher l'overlay
    const overlay = document.getElementById('solo-quit-overlay');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';

    // Reprendre le jeu (pause() est un toggle)
    if (soloGameInstance) {
        soloGameInstance.pause();
    }
}

// Exposer les fonctions globalement
window.confirmQuitSolo = confirmQuitSolo;
window.cancelQuitSolo = cancelQuitSolo;

// ============================================
// MODE IA - PAUSE & MENU
// ============================================

/**
 * Met en pause / reprend le jeu IA
 */
window.pauseAI = function() {
    if (!window.aiGame) {
        logger.warn('[pauseAI] window.aiGame non défini');
        return;
    }

    // Son du bouton
    if (window.audio && window.audio.buttonClick) {
        window.audio.buttonClick();
    }

    // Vérifier l'état AVANT de toggler
    const wasPaused = window.aiGame.paused;

    // Toggle pause
    window.aiGame.pause();

    logger.log(`[pauseAI] Pause toggled: ${!wasPaused} -> ${window.aiGame.paused}`);

    // Gérer la musique selon le nouvel état
    if (window.audioManager) {
        if (wasPaused) {
            // Le jeu était en pause, on reprend
            window.audioManager.resume();
        } else {
            // Le jeu tourne, on met en pause
            window.audioManager.pause();
        }
    }
};

/**
 * Quitter le mode IA et retourner au menu
 */
window.quitAI = function() {
    if (window.audio && window.audio.buttonClick) {
        window.audio.buttonClick();
    }

    // Mettre le jeu en pause
    if (window.aiGame && window.aiGame.running) {
        window.aiGame.pause();
    }

    // Afficher l'overlay
    const overlay = document.getElementById('ai-quit-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
    }
};

/**
 * Confirmer la sortie du mode IA
 */
function confirmQuitAI() {
    if (window.audio && window.audio.buttonClick) {
        window.audio.buttonClick();
    }

    // Cacher l'overlay
    const overlay = document.getElementById('ai-quit-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }

    // Arrêter le jeu
    if (window.aiGame) {
        window.aiGame.stop();
    }

    // Retour au HUB V6
    if (window.screenManager) {
        window.screenManager.show('hub');
    }

    // Rafraîchir le hub
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }

    // Lancer la musique du hub
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('menu');
    }
}

/**
 * Annuler la sortie et reprendre le jeu
 */
function cancelQuitAI() {
    if (window.audio && window.audio.buttonClick) {
        window.audio.buttonClick();
    }

    // Cacher l'overlay
    const overlay = document.getElementById('ai-quit-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }

    // Reprendre le jeu (pause() est un toggle)
    if (window.aiGame) {
        window.aiGame.pause();
    }
}

// Exposer les fonctions globalement
window.confirmQuitAI = confirmQuitAI;
window.cancelQuitAI = cancelQuitAI;

/**
 * Gère le game over du mode solo
 * @param {object} stats - Statistiques de la partie
 */
window.handleSoloGameOver = function(stats) {
    // Arrêter audio
    if (window.audioManager) {
        window.audioManager.stopAll();
    }

    // Stocker les stats pour plus tard
    window.lastGameStats = stats;

    // ✅ Réinitialiser les trophées de session
    window.sessionTrophies = [];

    // Mettre à jour les stats de carrière
    updateCareerStats(stats);

    // ✅ TRACKING TROPHÉES CRÉATIFS
    if (window.career && window.save) {
        // KAMIKAZE: Mort en moins de 10 secondes
        const [min, sec] = (stats.timeString || "0:00").split(':').map(Number);
        const totalSeconds = (min * 60) + (sec || 0);
        if (totalSeconds < 10) {
            if (!window.career.quickDeaths) window.career.quickDeaths = 0;
            window.career.quickDeaths++;
        }

        // PHOENIX: Victoire immédiatement après défaite
        // Considérer niveau >= 5 comme victoire (heuristique simple)
        const currentResult = (stats.level >= 5) ? 'win' : 'loss';
        if (window.career.lastGameResult === 'loss' && currentResult === 'win') {
            if (!window.career.phoenixRises) window.career.phoenixRises = 0;
            window.career.phoenixRises++;
        }
        window.career.lastGameResult = currentResult;

        // Sauvegarder les changements
        window.save('career', window.career);
    }

    // ✅ VÉRIFIER TROPHÉES après mise à jour des stats
    if (window.checkTrophy) {
        window.checkTrophy();
    }

    // ✅ NOUVEAU : Donner des coins pour cette partie
    if (window.boxManager) {
        // Calcul des coins : score/10 + bonus difficulté
        const baseCoins = Math.floor(stats.score / 10);
        const difficultyBonus = {
            'easy': 10,
            'medium': 20,
            'hard': 30
        }[stats.difficulty || 'easy'] || 10;

        const totalCoins = baseCoins + difficultyBonus;
        window.boxManager.addCoins(totalCoins, `partie ${stats.difficulty || 'easy'}`);

        // Vérifier déblocages par niveau (UNIFIÉ via window.career)
        const playerLevel = window.career ? window.career.level : 1;
        window.boxManager.checkLevelUnlocks(playerLevel);
    }

    // Sauvegarder dans le classement
    saveScore(stats);

    // Afficher overlay progression (AVANT les stats)
    showProgressionOverlay(stats);
};

/**
 * Sauvegarder un score dans le classement Top 3
 * @param {object} stats - Statistiques de la partie
 */
function saveScore(stats) {
    // Récupérer le classement actuel
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');

    // Créer l'entrée
    const entry = {
        score: stats.score,
        level: stats.level,
        difficulty: stats.difficulty,
        date: new Date().toISOString(),
        maxCombo: stats.combo,
        timeString: stats.timeString,
        foodCount: stats.foodCount
    };

    // Ajouter et trier par score décroissant
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);

    // Garder seulement le Top 3
    leaderboard = leaderboard.slice(0, 3);

    // Sauvegarder
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));

    return leaderboard;
}

/**
 * Récupérer le classement Top 3
 * @returns {Array} Tableau des 3 meilleurs scores
 */
function getLeaderboard() {
    return JSON.parse(localStorage.getItem('leaderboard') || '[]');
}

/**
 * Convertir un temps "MM:SS" en secondes
 * @param {string} timeStr - Temps au format "MM:SS"
 * @returns {number} Temps en secondes
 */
function timeToSeconds(timeStr) {
    if (!timeStr || timeStr === '0:00') return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
}

/**
 * Convertit des secondes en format M:SS
 */
function formatSurvivalTime(seconds) {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Mettre à jour les statistiques de carrière
 * @param {object} stats - Statistiques de la partie
 * @returns {object} Statistiques de carrière mises à jour
 */
function updateCareerStats(stats) {
    // ✅ UNIFIÉ : Déléguer à window.updateCareer()
    // Cette fonction est conservée pour rétrocompatibilité
    if (window.updateCareer) {
        return window.updateCareer(stats);
    }

    // Fallback si snake.js pas encore chargé
    logger.warn('[updateCareerStats] window.updateCareer non disponible');
    return null;
}

/**
 * Récupérer les statistiques de carrière
 * @returns {object} Statistiques de carrière
 */
function getCareerStats() {
    // ✅ UNIFIÉ : Lecture directe depuis window.career
    return window.career || {
        level: 1,
        xp: 0,
        xpNext: 200, // Formule linéaire: 100 + (level * 100)
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        totalApples: 0,
        maxLevel: 0,
        totalWalls: 0,
        totalPowerups: 0,
        maxSurvivalTime: 0
    };
}

/**
 * Afficher les statistiques de carrière + classement
 */
function renderCareerStats() {
    const career = getCareerStats();
    const leaderboard = getLeaderboard();
    const container = document.querySelector('#career-menu .career-content');

    if (!container) return;

    // ✅ UNIFIÉ : Lecture depuis window.career
    const careerData = window.career || career;

    let html = '<div class="career-stats-grid">';

    // Grille de stats (même style que l'écran Game Over)
    const stats = [
        { label: '📊 Total Parties', value: careerData.totalGames || 0 },
        { label: '📈 Niveau Joueur', value: careerData.level || 1 },
        { label: '⭐ XP Actuel', value: `${careerData.xp || 0} / ${careerData.xpNext || 100}` },
        { label: '💯 Score Total', value: careerData.totalScore || 0 },
        { label: '🏅 Meilleur Score', value: careerData.bestScore || 0 },
        { label: '🍎 Pommes Totales', value: careerData.totalApples || 0 },
        { label: '📊 Niveau Max', value: careerData.maxLevel || 0 },
        { label: '🧱 Murs Détruits', value: careerData.totalWalls || 0 },
        { label: '✨ Power-Ups', value: careerData.totalPowerups || 0 },
        { label: '⏱️ Survie Max', value: formatSurvivalTime(careerData.maxSurvivalTime || 0) }
    ];

    stats.forEach(stat => {
        html += `
            <div class="stat-card">
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value">${stat.value}</div>
            </div>
        `;
    });

    html += '</div>';

    // Ajouter le Top 3
    html += '<h3 style="margin-top: 40px; margin-bottom: 20px; text-align: center; color: var(--color-gold);">🏆 TOP 3</h3>';

    if (leaderboard.length === 0) {
        html += `
            <div class="empty-leaderboard">
                <p style="font-size: 36px; margin-bottom: 10px;">🎮</p>
                <p>Aucun score enregistré</p>
                <p style="font-size: 14px; opacity: 0.7; margin-top: 10px;">
                    Joue ta première partie solo pour apparaître ici !
                </p>
            </div>
        `;
    } else {
        const medals = ['🥇', '🥈', '🥉'];
        const diffEmojis = ['😊', '😮', '😈'];

        html += '<div class="leaderboard-grid">';

        leaderboard.forEach((entry, index) => {
            html += `
                <div class="leaderboard-entry rank-${index + 1}">
                    <!-- Médaille -->
                    <div class="stat-card rank-medal-card">
                        <div class="stat-value" style="font-size: 48px;">${medals[index]}</div>
                        <div class="stat-label">#${index + 1}</div>
                    </div>

                    <!-- Score principal -->
                    <div class="stat-card score-main-card">
                        <div class="stat-label">🏆 Score</div>
                        <div class="stat-value stat-score">${entry.score}</div>
                    </div>

                    <!-- Niveau -->
                    <div class="stat-card">
                        <div class="stat-label">🎯 Niveau</div>
                        <div class="stat-value stat-level">${entry.level}</div>
                    </div>

                    <!-- Difficulté -->
                    <div class="stat-card">
                        <div class="stat-label">🎮 Difficulté</div>
                        <div class="stat-value stat-difficulty-emoji">${diffEmojis[entry.difficulty]}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    container.innerHTML = html;
}

/**
 * Affiche l'overlay de progression XP/Niveau avec trophées séquentiels
 */
function showProgressionOverlay(stats) {
    // Récupérer les trophées débloqués de cette partie
    const trophies = window.sessionTrophies || [];

    // ✅ Calculer XP de la partie (score ÷ 5)
    const gameXP = Math.floor(stats.score / 5);

    // Récupérer niveau/XP actuel depuis career (pas localStorage)
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
    const circleFill = document.getElementById('progression-circle-fill');
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

    // ✅ Variables temporaires pour l'animation
    let tempXP = currentXP;
    let tempLevel = currentLevel;
    let tempXPNext = currentXPNext;
    let delay = 500;

    // ✅ ÉTAPE 1 : Afficher et ajouter l'XP de la partie
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

            gameXPDiv.innerHTML = `
                <div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background: rgba(76,175,80,0.3); border-radius: 8px; font-size: 24px;">
                    🎮
                </div>
                <div style="flex: 1;">
                    <div style="color: #4CAF50; font-weight: bold; font-size: 15px;">XP de la Partie</div>
                    <div style="color: #aaa; font-size: 13px;">Score: ${stats.score} points</div>
                </div>
                <div style="color: #4CAF50; font-weight: bold; font-size: 16px;">+${gameXP} XP</div>
            `;

            if (trophiesList) trophiesList.appendChild(gameXPDiv);

            // Ajouter XP et animer
            tempXP += gameXP;

            // Gérer level up
            while (tempXP >= tempXPNext && tempLevel < 100) {
                tempXP -= tempXPNext;
                tempLevel++;
                tempXPNext = 100 + (tempLevel * 100); // Formule linéaire

                if (levelUpAnim) {
                    document.getElementById('new-level').textContent = tempLevel;
                    levelUpAnim.classList.remove('hidden');
                    if (window.audio && window.audio.powerup) window.audio.powerup();
                }
            }

            updateProgressBar(tempXP, tempLevel, tempXPNext);
        }, delay);

        delay += 1200; // Attendre 1.2s avant les trophées
    }

    // ✅ ÉTAPE 2 : Si pas de trophées, terminer ici
    if (trophies.length === 0) {
        setTimeout(() => {
            if (nextBtn) {
                nextBtn.disabled = false;
                if (tempLevel > currentLevel) {
                    document.getElementById('progression-btn-text').textContent = 'Menu Principal';
                } else {
                    document.getElementById('progression-btn-text').textContent = 'Menu Principal';
                }
            }
        }, delay + 800);
        return;
    }

    // ✅ ÉTAPE 3 : Afficher les trophées séquentiellement
    if (trophiesContainer) trophiesContainer.classList.remove('hidden');

    trophies.forEach((trophy, index) => {
        setTimeout(() => {
            // Ajouter le trophée à la liste avec animation
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
                tempXPNext = 100 + (tempLevel * 100); // Formule linéaire

                // Afficher animation level up
                if (levelUpAnim) {
                    document.getElementById('new-level').textContent = tempLevel;
                    levelUpAnim.classList.remove('hidden');
                    if (window.audio && window.audio.powerup) window.audio.powerup();
                }
            }

            // Animer la barre de progression
            updateProgressBar(tempXP, tempLevel, tempXPNext);

            // Si c'est le dernier trophée, activer le bouton
            if (index === trophies.length - 1) {
                setTimeout(() => {
                    if (nextBtn) {
                        nextBtn.disabled = false;
                        if (tempLevel > currentLevel) {
                            document.getElementById('progression-btn-text').textContent = 'Menu Principal';
                        } else {
                            document.getElementById('progression-btn-text').textContent = 'Menu Principal';
                        }
                    }
                }, 800);
            }
        }, delay);

        delay += 1200; // 1.2s entre chaque trophée
    });

    // ✅ Stocker les valeurs finales pour synchronisation dans showFinalStats
    // Calculer le total XP à ajouter (gameXP + tous les trophées)
    const totalXPToAdd = gameXP + trophies.reduce((sum, t) => sum + t.xp, 0);
    window.pendingCareerUpdate = {
        totalXP: totalXPToAdd,
        baseLevel: currentLevel,
        baseXP: currentXP,
        baseXPNext: currentXPNext
    };

    // Réinitialiser sessionTrophies après affichage
    window.sessionTrophies = [];
}

/**
 * Met à jour la barre de progression XP
 */
function updateProgressBar(xp, level, xpNext) {
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
function showFinalStats() {
    if (window.audio) window.audio.buttonClick();

    // ✅ SYNC : Appliquer les XP/niveaux accumulés pendant l'animation
    syncCareerFromAnimation();

    // Cacher overlay progression
    const progressionOverlay = document.getElementById('progression-overlay');
    progressionOverlay.classList.add('hidden');
    progressionOverlay.style.display = 'none';

    // Afficher écran stats
    window.screenManager.show('over');

    // Récupérer les stats stockées
    const stats = window.lastGameStats;

    // Afficher les stats de jeu
    setTimeout(() => {
        // Mapping emoji difficulté
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

        // Mettre à jour les valeurs
        if (elements.fsc) elements.fsc.textContent = stats.score || 0;
        // ✅ NOUVEAU : Afficher XP gagné
        if (elements.fxp) elements.fxp.textContent = `+${window.lastGameXPGained || 0} XP`;
        if (elements.flv) elements.flv.textContent = stats.level || 1;
        if (elements.ffood) elements.ffood.textContent = stats.foodCount || 0;
        if (elements.ftime) elements.ftime.textContent = stats.timeString || '0:00';
        if (elements.fmaxlength) elements.fmaxlength.textContent = stats.maxSnakeLength || 1;
        if (elements.fwalls) elements.fwalls.textContent = stats.wallsDestroyed || 0;
        if (elements.fskulls) elements.fskulls.textContent = stats.skullsEaten || 0;

        // Mettre à jour difficulté avec emoji
        if (elements.fdiffEmoji && stats.difficulty) {
            elements.fdiffEmoji.textContent = difficultyEmojis[stats.difficulty] || '😊';
        }

        // Power-ups (nouveaux IDs)
        if (elements.fice) elements.fice.textContent = stats.slowCount || 0;
        if (elements.ffire) elements.ffire.textContent = stats.doubleCount || 0;
        if (elements.frock) elements.frock.textContent = stats.invincibleCount || 0;
        if (elements.fghost) elements.fghost.textContent = stats.ghostCount || 0;
    }, 100);
}

// Exposer globalement
window.showProgressionOverlay = showProgressionOverlay;
window.showFinalStats = showFinalStats;

/**
 * Synchronise les données career depuis l'animation
 */
function syncCareerFromAnimation() {
    if (window.pendingCareerUpdate && window.career) {
        const update = window.pendingCareerUpdate;

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
            logger.log(`[syncCareer] Career synced: Level ${level}, XP ${xp}/${xpNext}`);
        }

        // Nettoyer
        delete window.pendingCareerUpdate;
    }
}

/**
 * Retour au Hub depuis l'overlay Progression (skip écran stats)
 */
function returnToHubFromProgression() {
    if (window.audio) window.audio.buttonClick();

    // Synchroniser career
    syncCareerFromAnimation();

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
window.returnToHubFromProgression = returnToHubFromProgression;

/**
 * Rejouer depuis l'overlay Progression
 */
function replayFromProgression() {
    if (window.audio) window.audio.buttonClick();

    // Synchroniser career
    syncCareerFromAnimation();

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
window.replayFromProgression = replayFromProgression;

/**
 * Retour au menu depuis l'écran Stats
 */
function returnToMenuFromStats() {
    if (window.audio) window.audio.buttonClick();

    // Nettoyer le jeu solo si actif
    if (window.soloGame && window.soloGame.stop) {
        window.soloGame.stop();
    }

    // Retour au HUB V6
    window.screenManager.show('hub');

    // ✅ Rafraîchir le hub pour afficher le nouveau niveau
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }

    // ✅ CORRECTION : Attendre que le DOM soit prêt avant de mettre à jour
    setTimeout(() => {
        if (window.updatePlayerProgress) {
            window.updatePlayerProgress();
        }
        // Rafraîchir le hub
        if (window.initHub) {
            window.initHub();
        }
    }, 150);
}

/**
 * Rejouer une partie solo depuis l'écran Stats
 */
function replaySolo() {
    if (window.audio) window.audio.buttonClick();

    // Cacher écran stats
    window.screenManager.show('game-solo');

    // Redémarrer le jeu
    if (window.start) {
        window.start();
    }
}

// Exposer globalement
window.returnToMenuFromStats = returnToMenuFromStats;
window.replaySolo = replaySolo;

// ============================================
// MODE MULTIJOUEUR
// ============================================

/**
 * Permet de modifier son pseudo depuis l'écran carrière
 * Affiche un prompt pour saisir le nouveau pseudo
 */
window.editPseudoFromCareer = function() {
    logger.log('Modification du pseudo depuis la carrière...');

    // Migration : récupérer l'ancien pseudo si la nouvelle clé n'existe pas
    let currentPseudo = localStorage.getItem('snakeultra_pseudo');
    if (!currentPseudo) {
        const oldPseudo = localStorage.getItem('playerPseudo') || localStorage.getItem('snakeUltraPseudo');
        if (oldPseudo && oldPseudo.length >= 3 && oldPseudo.length <= 12) {
            localStorage.setItem('snakeultra_pseudo', oldPseudo);
            currentPseudo = oldPseudo;
            logger.log('✅ Migration du pseudo depuis ancienne clé:', oldPseudo);
        }
    }

    // Afficher un prompt pour saisir le nouveau pseudo
    const message = currentPseudo
        ? `Pseudo actuel : ${currentPseudo}\n\nEntrez votre nouveau pseudo (3-12 caractères):`
        : 'Entrez votre pseudo (3-12 caractères):';

    const newPseudo = prompt(message, currentPseudo || '');

    // Si l'utilisateur annule
    if (newPseudo === null) {
        logger.log('Modification du pseudo annulée');
        return;
    }

    // Valider le pseudo
    const trimmed = newPseudo.trim();

    if (trimmed.length < 3) {
        alert('⚠️ Le pseudo doit contenir au moins 3 caractères');
        return;
    }

    if (trimmed.length > 12) {
        alert('⚠️ Le pseudo ne peut pas dépasser 12 caractères');
        return;
    }

    // Vérifier caractères autorisés
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(trimmed)) {
        alert('⚠️ Caractères autorisés: lettres, chiffres, _ et -');
        return;
    }

    // Sauvegarder le nouveau pseudo
    localStorage.setItem('snakeultra_pseudo', trimmed);
    localStorage.setItem('playerPseudo', trimmed); // Compatibilité
    localStorage.setItem('snakeUltraPseudo', trimmed); // Compatibilité

    logger.log(`✅ Nouveau pseudo sauvegardé: ${trimmed}`);
    alert(`✅ Pseudo modifié avec succès !\n\nNouveau pseudo : ${trimmed}`);
};

/**
 * Sauvegarder le pseudo et aller au menu principal
 * (Nouveau flow : pseudo demandé au premier lancement)
 */
window.savePseudoAndGoToMenu = function() {
    try {
        // 1. RÉCUPÉRER LE PSEUDO
        const pseudoInput = document.getElementById('pseudo-input');
        const pseudo = pseudoInput ? pseudoInput.value.trim() : '';

        // 2. VALIDER LE PSEUDO
        if (!pseudo || pseudo.length < 3 || pseudo.length > 12) {
            const errorSpan = document.getElementById('pseudo-error');
            if (errorSpan) {
                errorSpan.textContent = '⚠️ Pseudo invalide (3-12 caractères)';
                errorSpan.style.display = 'block';
            } else {
                alert('Veuillez entrer un pseudo valide (3-12 caractères)');
            }
            return;
        }

        // Valider le format (lettres, chiffres, _ et -)
        if (!/^[a-zA-Z0-9_-]+$/.test(pseudo)) {
            const errorSpan = document.getElementById('pseudo-error');
            if (errorSpan) {
                errorSpan.textContent = '⚠️ Caractères autorisés : lettres, chiffres, _ et -';
                errorSpan.style.display = 'block';
            } else {
                alert('Caractères autorisés : lettres, chiffres, _ et -');
            }
            return;
        }

        // 3. SAUVEGARDER LE PSEUDO
        try {
            localStorage.setItem('snakeultra_pseudo', pseudo);
            localStorage.setItem('playerPseudo', pseudo); // Compatibilité
            localStorage.setItem('snakeUltraPseudo', pseudo); // Compatibilité
            logger.log('✅ Pseudo sauvegardé:', pseudo);
        } catch (e) {
            logger.warn('⚠️ Échec sauvegarde localStorage (navigation privée)');
        }

        // 4. ALLER AU HUB V6
        window.screenManager.show('hub');

        // ✅ METTRE À JOUR LE NIVEAU ET LE CERCLE D'XP
        if (window.updatePlayerProgress) {
            window.updatePlayerProgress();
        }

        // Initialiser le hub
        if (window.initHub) {
            setTimeout(() => window.initHub(), 100);
        }

    } catch (error) {
        logger.error('❌ Erreur savePseudoAndGoToMenu:', error);
        alert('Erreur lors de la sauvegarde du pseudo');
    }
};

/**
 * Démarre le mode multijoueur
 */
window.startLocalMultiplayer = function() {

    try {
        // 1. RÉCUPÉRER LE PSEUDO
        const pseudoInput = document.getElementById('pseudo-input');
        const pseudo = pseudoInput ? pseudoInput.value.trim() : '';

        // 2. VALIDER LE PSEUDO
        if (!pseudo || pseudo.length < 3 || pseudo.length > 12) {
            const errorSpan = document.getElementById('pseudo-error');
            if (errorSpan) {
                errorSpan.textContent = '⚠️ Pseudo invalide (3-12 caractères)';
                errorSpan.style.display = 'block';
            } else {
                alert('Veuillez entrer un pseudo valide (3-12 caractères)');
            }
            return; // NE PAS connecter
        }

        // Valider le format avec la fonction de validation existante (si disponible)
        if (window.getValidPseudo) {
            const validatedPseudo = window.getValidPseudo();
            if (!validatedPseudo) {
                // L'erreur est déjà affichée par getValidPseudo()
                return;
            }
        }

        // 3. SAUVEGARDER LE PSEUDO
        try {
            localStorage.setItem('snakeultra_pseudo', pseudo);
            localStorage.setItem('playerPseudo', pseudo); // Compatibilité
            localStorage.setItem('snakeUltraPseudo', pseudo); // Compatibilité
        } catch (e) {
            // Échec localStorage (navigation privée) - continuer quand même
        }

        // 4. CRÉER LE JEU
        if (!multiGameInstance) {
            try {
                multiGameInstance = new MultiplayerSnakeGame();
                window.multiGame = multiGameInstance;
            } catch (error) {
                alert('Erreur: Impossible de créer le jeu multijoueur');
                throw error;
            }
        }

        // 4. DÉMARRER avec le pseudo
        multiGameInstance.start(pseudo);

        // ✅ LOBBY PRINCIPAL - Afficher le lobby principal après connexion
        // Le serveur envoie 'lobby_ready' mais ne place plus automatiquement en room
        setTimeout(() => {
            if (window.mainLobby) {
                window.mainLobby.show();
            }
        }, 500);

    } catch (error) {
        alert('Erreur critique: ' + error.message);
        throw error;
    }
};

/**
 * Abandonner la partie multijoueur
 * Affiche un overlay de confirmation (comme pour le solo)
 */
window.abandonMulti = function() {
    window.audio.buttonClick();

    // Mettre le jeu en pause
    if (multiGameInstance && multiGameInstance.running) {
        multiGameInstance.pause();
    }

    // Afficher l'overlay de confirmation
    const overlay = document.getElementById('multi-quit-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
    }
};

/**
 * Confirmer l'abandon de la partie multijoueur
 */
function confirmAbandonMulti() {
    window.audio.buttonClick();

    // Cacher l'overlay
    const overlay = document.getElementById('multi-quit-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }

    // ✅ ENVOYER UN MESSAGE AU SERVEUR pour notifier l'abandon
    if (multiGameInstance && multiGameInstance.client && multiGameInstance.client.ws) {
        multiGameInstance.client.ws.send(JSON.stringify({
            type: 'player_abandon'
        }));
        logger.log('🏳️ Message d\'abandon envoyé au serveur');
    }

    // Quitter la partie
    window.quitMulti();
}

/**
 * Annuler l'abandon et reprendre le jeu
 */
function cancelAbandonMulti() {
    window.audio.buttonClick();

    // Cacher l'overlay
    const overlay = document.getElementById('multi-quit-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }

    // Reprendre le jeu
    if (multiGameInstance && multiGameInstance.paused) {
        multiGameInstance.resume();
    }
}

// Exposer les fonctions globalement pour les boutons HTML
window.confirmAbandonMulti = confirmAbandonMulti;
window.cancelAbandonMulti = cancelAbandonMulti;

/**
 * Quitter le mode multijoueur et retourner au menu
 */
window.quitMulti = function() {

    // Arrêter le jeu
    if (multiGameInstance) {
        multiGameInstance.stop();
    }

    // Retourner au HUB V6
    window.screenManager.show('hub');

    // ✅ METTRE À JOUR LE NIVEAU ET LE CERCLE D'XP
    if (window.updatePlayerProgress) {
        window.updatePlayerProgress();
    }

    // Rafraîchir le hub
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }

    // Lancer la musique du menu
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('menu');
    }
};

/**
 * Quitter le lobby et retourner au menu multijoueur
 */
window.leaveLobby = function() {

    // Déconnecter le client multiplayer
    if (multiGameInstance && multiGameInstance.client) {
        multiGameInstance.client.disconnect();
    }

    // ✅ FIX: Retourner au lobby principal au lieu de l'écran de pseudo
    window.screenManager.show('main-lobby-screen');

    // ✅ Réafficher le lobby principal
    if (window.mainLobby) {
        window.mainLobby.show();
    }
};

/**
 * Marquer le joueur comme prêt dans le lobby
 */
window.setReady = function() {

    // Vérifier la connexion
    if (!multiGameInstance || !multiGameInstance.client || !multiGameInstance.client.connected) {
        alert('Erreur: Non connecté au serveur');
        return;
    }

    // Envoyer au serveur
    multiGameInstance.client.ws.send(JSON.stringify({
        type: 'player_ready'
    }));

    // Désactiver le bouton
    const btn = document.getElementById('btn-ready');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '✅ PRÊT !';
        btn.style.opacity = '0.6';
    }
};

// ============================================
// GESTION DE LA DIFFICULTÉ
// ============================================

/**
 * Change la difficulté sélectionnée
 * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
 */
window.setDiff = function(difficulty) {

    currentDifficulty = difficulty;
    window.currentDifficulty = difficulty; // Synchroniser avec window pour l'accès HTML

    // Mettre à jour l'UI des tabs de difficulté (nouveau design menu principal)
    const tabs = document.querySelectorAll('.diff-tab');
    tabs.forEach((tab) => {
        const tabDiff = parseInt(tab.getAttribute('data-diff'));
        if (tabDiff === difficulty) {
            tab.classList.add('active');
            tab.setAttribute('aria-checked', 'true');
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-checked', 'false');
        }
    });

    // Mettre à jour l'UI des tabs du HUB V6
    const hubTabs = document.querySelectorAll('.hub-diff-tab');
    hubTabs.forEach((tab) => {
        const tabDiff = parseInt(tab.getAttribute('data-diff'));
        if (tabDiff === difficulty) {
            tab.classList.add('active');
            tab.setAttribute('aria-checked', 'true');
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-checked', 'false');
        }
    });

    // Compatibilité avec les anciens boutons .diff-btn (si présents)
    const oldButtons = document.querySelectorAll('.diff-btn');
    oldButtons.forEach((btn, index) => {
        if (index === difficulty) {
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        }
    });

    // Son du bouton
    if (window.audio && window.audio.buttonClick) {
        window.audio.buttonClick();
    }
};

// ============================================
// UTILITAIRES
// ============================================

/**
 * Retourne l'instance du jeu solo
 * @returns {SoloSnakeGame|null}
 */
window.getSoloGame = function() {
    return soloGameInstance;
};

/**
 * Retourne l'instance du jeu multijoueur
 * @returns {MultiplayerSnakeGame|null}
 */
window.getMultiGame = function() {
    return multiGameInstance;
};

/**
 * Retourne la difficulté actuelle
 * @returns {number}
 */
window.getCurrentDifficulty = function() {
    return currentDifficulty;
};

// ============================================
// GESTION DES TOUCHES CLAVIER (MODE SOLO & IA)
// ============================================

document.addEventListener('keydown', (e) => {
    // Si on est en mode solo
    if (soloGameInstance && soloGameInstance.running && !soloGameInstance.paused) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
            case 'z':
            case 'Z':
                e.preventDefault();
                soloGameInstance.changeDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                soloGameInstance.changeDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
            case 'q':
            case 'Q':
                e.preventDefault();
                soloGameInstance.changeDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                soloGameInstance.changeDirection(1, 0);
                break;
            case ' ':
            case 'p':
            case 'P':
                e.preventDefault();
                window.pauseSolo();
                break;
            case 'Escape':
                e.preventDefault();
                window.quitSolo();
                break;
        }
    }
    // Si on est en mode IA
    else if (window.aiGame && window.aiGame.running && !window.aiGame.paused) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
            case 'z':
            case 'Z':
                e.preventDefault();
                window.aiGame.changeDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                window.aiGame.changeDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
            case 'q':
            case 'Q':
                e.preventDefault();
                window.aiGame.changeDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                window.aiGame.changeDirection(1, 0);
                break;
            case ' ':
            case 'p':
            case 'P':
                e.preventDefault();
                window.pauseAI();
                break;
            case 'Escape':
                e.preventDefault();
                window.quitAI();
                break;
        }
    }

    // Si on est en mode multijoueur
    if (multiGameInstance && multiGameInstance.isActive) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
            case 'z':
            case 'Z':
                e.preventDefault();
                multiGameInstance.changeDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                multiGameInstance.changeDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
            case 'q':
            case 'Q':
                e.preventDefault();
                multiGameInstance.changeDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                multiGameInstance.changeDirection(1, 0);
                break;
            case 'Escape':
                e.preventDefault();
                window.abandonMulti();
                break;
        }
    }
});

// ============================================
// CONTRÔLES DIRECTIONNELS GLOBAUX
// Redirige vers solo ou multi selon le mode actif
// ============================================

window.d = function(dx, dy) {

    if (soloGameInstance && soloGameInstance.running) {
        soloGameInstance.changeDirection(dx, dy);
    } else if (multiGameInstance && multiGameInstance.isActive) {
        multiGameInstance.changeDirection(dx, dy);
    }
};

// Fonctions alternatives (au cas où)
window.moveUp = function() { window.d(0, -1); };
window.moveDown = function() { window.d(0, 1); };
window.moveLeft = function() { window.d(-1, 0); };
window.moveRight = function() { window.d(1, 0); };

// ============================================
// NOUVELLE NAVIGATION MENUS
// ============================================

/**
 * Masquer tous les menus
 */
function hideAllMenus() {
    const menus = [
        'menu', 'difficulty-menu', 'multiplayer-menu', 'options-menu',
        'sound-menu', 'career-menu', 'rules-menu', 'credits-menu', 'language-menu'
    ];
    menus.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
            element.classList.remove('active');
        }
    });
}

/**
 * Afficher un menu avec animation
 * @param {string} menuId - ID du menu à afficher
 * @param {string} direction - Direction de l'animation
 */
function showMenu(menuId, direction = 'slide-in-right') {
    hideAllMenus();

    // ✅ FIX: Cacher le hub quand on affiche un sous-menu
    const hub = document.getElementById('hub');
    if (hub) {
        hub.classList.add('hidden');
    }

    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.remove('hidden');
        // Animation sera gérée par CSS
        setTimeout(() => {
            menu.classList.add('active');
        }, 10);
    }
}

// ============================================
// NAVIGATION - MENU PRINCIPAL
// ============================================

/**
 * Retour au HUB V6 (écran principal)
 */
window.backToMain = function() {
    // Cacher tous les sous-menus
    hideAllMenus();

    // Retour au HUB V6
    window.screenManager.show('hub');

    // Mettre à jour la progression
    updatePlayerProgress();

    // Rafraîchir le hub
    if (window.initHub) {
        setTimeout(() => window.initHub(), 100);
    }
};

/**
 * Afficher le menu Options
 */
window.showOptions = function() {
    showMenu('options-menu', 'slide-in-right');
};

/**
 * Afficher le menu Difficulté
 */
window.showDifficulty = function() {
    showMenu('difficulty-menu', 'slide-in-right');
};

/**
 * Afficher le menu Multiplayer
 * ✅ NOUVEAU : Utilise le pseudo sauvegardé et connecte directement au serveur
 */
window.showMultiplayer = function() {
    try {
        // 1. RÉCUPÉRER LE PSEUDO SAUVEGARDÉ
        const savedPseudo = localStorage.getItem('snakeultra_pseudo');

        if (!savedPseudo) {
            // Sécurité : Si pas de pseudo (ne devrait pas arriver), afficher l'écran pseudo
            logger.warn('⚠️ Pas de pseudo sauvegardé dans showMultiplayer');
            window.screenManager.show('multiplayer-menu');
            return;
        }

        logger.log('🌐 Connexion multiplayer avec pseudo:', savedPseudo);

        // 2. CRÉER LE JEU MULTIPLAYER
        if (!multiGameInstance) {
            try {
                multiGameInstance = new MultiplayerSnakeGame();
                window.multiGame = multiGameInstance;
            } catch (error) {
                logger.error('❌ Erreur création jeu multiplayer:', error);
                alert('Erreur: Impossible de créer le jeu multijoueur');
                return;
            }
        }

        // 3. DÉMARRER AVEC LE PSEUDO SAUVEGARDÉ
        multiGameInstance.start(savedPseudo);

        // 4. AFFICHER LE LOBBY PRINCIPAL (après connexion)
        setTimeout(() => {
            if (window.mainLobby) {
                window.mainLobby.show();
            }
        }, 500);

    } catch (error) {
        logger.error('❌ Erreur showMultiplayer:', error);
        alert('Erreur lors de la connexion multiplayer');
    }
};

// ============================================
// NAVIGATION - SOUS-MENUS OPTIONS
// ============================================

/**
 * Retour au menu Options
 */
window.backToOptions = function() {
    showMenu('options-menu', 'slide-in-left');
};

/**
 * Afficher le menu Son
 */
window.showSound = function() {
    showMenu('sound-menu', 'slide-in-right');
    loadSoundSettings();
};

// Note: window.showCareer est défini dans snake.js

/**
 * Afficher le menu Règles
 */
window.showRules = function() {
    showMenu('rules-menu', 'slide-in-right');
};

/**
 * Afficher le menu Crédits
 */
window.showCredits = function() {
    showMenu('credits-menu', 'slide-in-right');
};

/**
 * Afficher le menu Langue
 */
window.showLanguage = function() {
    showMenu('language-menu', 'slide-in-right');
    loadLanguageSettings();
};

/**
 * Retourner au menu Options depuis un sous-menu
 */
window.backToOptions = function() {
    showMenu('options-menu', 'slide-in-left');
};

/**
 * Définir la langue de l'interface
 * @param {string} lang - Code de langue ('fr', 'en', 'es', 'de')
 */
window.setLanguage = function(lang) {

    // Pour l'instant, seul le français est disponible
    if (lang !== 'fr') {
        return;
    }

    // Sauvegarder la préférence
    localStorage.setItem('language', lang);

    // TODO: Implémenter la traduction de l'interface
};

/**
 * Charger les paramètres de langue
 */
function loadLanguageSettings() {
    const savedLang = localStorage.getItem('language') || 'fr';
    // TODO: Appliquer la traduction
}

// ============================================
// DÉMARRAGE JEUX AVEC DIFFICULTÉ
// ============================================

/**
 * Démarrer le jeu solo avec une difficulté
 * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
 */
window.startSolo = function(difficulty) {
    currentDifficulty = difficulty;
    window.start(); // Utilise la fonction existante
};

// ============================================
// PROGRESSION JOUEUR (Niveau/XP)
// ============================================

/**
 * Mettre à jour l'affichage de la progression du joueur
 */
window.updatePlayerProgress = function() {
    // ✅ UNIFIÉ : Lecture depuis window.career
    const career = window.career || { level: 1, xp: 0, xpNext: 200 };
    const level = career.level;
    const xp = career.xp;
    const xpForNextLevel = career.xpNext;

    // Mettre à jour le texte niveau dans le cercle SVG
    const levelNum = document.getElementById('player-level-num');
    if (levelNum) {
        levelNum.textContent = level;
    }

    // Mettre à jour le texte XP dans le cercle SVG
    const xpText = document.getElementById('player-xp-text');
    if (xpText) {
        xpText.textContent = `${xp}/${xpForNextLevel} XP`;
    }

    // Animer le cercle XP
    const circleFill = document.getElementById('player-circle-fill');
    if (circleFill) {
        const percentage = (xp / xpForNextLevel);
        const circumference = 2 * Math.PI * 65; // r=65
        const offset = circumference * (1 - percentage);

        circleFill.style.strokeDashoffset = offset;
    }
}

// ============================================
// PARAMÈTRES SON
// ============================================

/**
 * Mettre à jour le volume de la musique
 * @param {number} value - Volume (0-100)
 */
window.updateMusicVolume = function(value) {
    const valueElement = document.getElementById('music-value');
    if (valueElement) valueElement.textContent = value + '%';

    const volume = value / 100; // 0-100 → 0.0-1.0
    localStorage.setItem('musicVolume', volume);

    // Mettre à jour la jauge visuelle via CSS variable
    const slider = document.getElementById('music-volume');
    if (slider) {
        slider.style.setProperty('--slider-value', value + '%');
    }

    // Appliquer avec AudioManager
    if (window.audioManager) {
        window.audioManager.setVolume(volume);
    }
};

/**
 * Mettre à jour le volume des effets sonores
 * @param {number} value - Volume (0-100)
 */
window.updateSFXVolume = function(value) {
    const valueElement = document.getElementById('sfx-value');
    if (valueElement) valueElement.textContent = value + '%';

    const volume = value / 100; // 0-100 → 0.0-1.0
    localStorage.setItem('sfxVolume', volume);

    // Mettre à jour la jauge visuelle via CSS variable
    const slider = document.getElementById('sfx-volume');
    if (slider) {
        slider.style.setProperty('--slider-value', value + '%');
    }

    // Effets sonores gérés par window.audio (beep)
    // Volume des effets reste dans l'ancien système pour l'instant
};

/**
 * Basculer le mode silencieux
 */
window.toggleMute = function() {
    const muteStateElement = document.getElementById('mute-state');
    if (!muteStateElement) return;

    const currentState = muteStateElement.textContent === 'OFF'; // OFF -> va devenir ON (muted)
    const newMutedState = currentState; // ON = muted, OFF = not muted

    muteStateElement.textContent = newMutedState ? 'ON' : 'OFF';

    // Synchroniser les deux systèmes de sauvegarde
    localStorage.setItem('muted', newMutedState.toString());
    localStorage.setItem('soundEnabled', (!newMutedState).toString());

    // Appliquer avec AudioManager
    if (window.audioManager) {
        window.audioManager.setMuted(newMutedState);
    }
};

/**
 * Charger les paramètres son depuis localStorage
 */
function loadSoundSettings() {
    // Charger depuis localStorage (valeurs en 0.0-1.0)
    const musicVolume = parseFloat(localStorage.getItem('musicVolume')) || 0.5;
    const sfxVolume = parseFloat(localStorage.getItem('sfxVolume')) || 0.85;

    // ✅ FIX: Par défaut, son activé (true)
    const soundEnabledValue = localStorage.getItem('soundEnabled');
    const soundEnabled = soundEnabledValue === null ? true : soundEnabledValue === 'true';
    const muted = !soundEnabled; // Si son activé, alors pas muted

    // Appliquer aux sliders (convertir 0.0-1.0 → 0-100)
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicValueElement = document.getElementById('music-value');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const sfxValueElement = document.getElementById('sfx-value');
    const muteStateElement = document.getElementById('mute-state');

    const musicVolumePercent = Math.round(musicVolume * 100);
    const sfxVolumePercent = Math.round(sfxVolume * 100);

    if (musicVolumeSlider) {
        musicVolumeSlider.value = musicVolumePercent;
        // Initialiser la jauge visuelle
        musicVolumeSlider.style.setProperty('--slider-value', musicVolumePercent + '%');
    }
    if (musicValueElement) musicValueElement.textContent = musicVolumePercent + '%';

    if (sfxVolumeSlider) {
        sfxVolumeSlider.value = sfxVolumePercent;
        // Initialiser la jauge visuelle
        sfxVolumeSlider.style.setProperty('--slider-value', sfxVolumePercent + '%');
    }
    if (sfxValueElement) sfxValueElement.textContent = sfxVolumePercent + '%';

    if (muteStateElement) muteStateElement.textContent = muted ? 'ON' : 'OFF';

    // Appliquer avec AudioManager
    if (window.audioManager) {
        window.audioManager.setVolume(musicVolume);
        window.audioManager.setMuted(muted);
    }
}

// ============================================
// DARK MODE
// ============================================

/**
 * Basculer le mode sombre
 */
window.toggleDarkMode = function() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');

    // Sauvegarder
    localStorage.setItem('darkMode', isDark);

    // Mettre à jour l'indicateur
    const indicator = document.getElementById('dark-mode-indicator');
    if (indicator) indicator.textContent = isDark ? 'ON' : 'OFF';

    // Animation smooth
    body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

};

/**
 * Charger le Dark Mode au démarrage
 */
function loadDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        const indicator = document.getElementById('dark-mode-indicator');
        if (indicator) indicator.textContent = 'ON';
    }
}

// ============================================
// SYSTÈME XP ET LEVEL UP (UNIFIÉ via window.career)
// ============================================

// ✅ UNIFIÉ : La recalibration n'est plus nécessaire car tout passe par window.career
window.recalibrateLevel = function() {
    // Fonction conservée pour rétrocompatibilité mais ne fait plus rien
    // Les niveaux sont maintenant gérés par window.career avec formule exponentielle
    if (window.career) {
        logger.log(`[recalibrateLevel] Niveau actuel: ${window.career.level}, XP: ${window.career.xp}/${window.career.xpNext}`);
        updatePlayerProgress();
        return { level: window.career.level, xpInCurrentLevel: window.career.xp };
    }
    return { level: 1, xpInCurrentLevel: 0 };
};

// ✅ UNIFIÉ : awardXP utilise maintenant window.career
window.awardXP = function(amount) {
    if (!window.career) {
        logger.warn('[awardXP] window.career non disponible');
        return { leveledUp: false, newLevel: 1, xpGained: amount };
    }

    const oldLevel = window.career.level;
    window.career.xp += amount;
    let leveledUp = false;

    // Formule linéaire : 100 + level×100
    while (window.career.xp >= window.career.xpNext && window.career.level < 100) {
        window.career.xp -= window.career.xpNext;
        window.career.level++;
        window.career.xpNext = 100 + (window.career.level * 100);
        leveledUp = true;
    }

    // Sauvegarder via window.save
    if (window.save) {
        window.save('career', window.career);
    }

    // Rafraîchir l'affichage
    updatePlayerProgress();

    logger.log(`[awardXP] +${amount} XP → Niveau ${window.career.level}, XP ${window.career.xp}/${window.career.xpNext}`);

    return { leveledUp, newLevel: window.career.level, xpGained: amount };
};

// ============================================
// INITIALISATION
// ============================================

// Charger les paramètres au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    updatePlayerProgress();
    loadDarkMode();
    loadSoundSettings(); // Charger paramètres audio au démarrage

    // Initialiser l'input pseudo
    if (window.initPseudoInput) {
        window.initPseudoInput();
    }

    // Event listener pour le bouton JOUER SOLO
    const soloBtnEl = document.getElementById('solo-btn');
    if (soloBtnEl) {
        soloBtnEl.addEventListener('click', () => {
            startSolo(currentDifficulty);
        });
    }

    // ✅ Event listener pour le bouton IA géré dans index.html (onclick="startAIGame()")

    // Sélectionner FACILE par défaut au chargement
    setDiff(0);
});

// ============================================
// EXPORTS GLOBAUX pour le système de carrière
// ============================================
window.saveScore = saveScore;
window.getLeaderboard = getLeaderboard;
window.updateCareerStats = updateCareerStats;
window.getCareerStats = getCareerStats;

// ============================================
// ATTACHER LES FONCTIONS UI AU NAMESPACE
// ============================================
SnakeUltra.ui = {
    // Mode Solo
    start: window.start,
    pauseSolo: window.pauseSolo,
    quitSolo: window.quitSolo,
    confirmQuitSolo: window.confirmQuitSolo,
    cancelQuitSolo: window.cancelQuitSolo,
    handleSoloGameOver: window.handleSoloGameOver,
    replaySolo: window.replaySolo,

    // Mode Multi
    startLocalMultiplayer: window.startLocalMultiplayer,
    abandonMulti: window.abandonMulti,
    quitMulti: window.quitMulti,
    leaveLobby: window.leaveLobby,
    setReady: window.setReady,

    // Navigation
    backToMain: window.backToMain,
    showOptions: window.showOptions,
    showDifficulty: window.showDifficulty,
    showMultiplayer: window.showMultiplayer,
    backToOptions: window.backToOptions,
    showSound: window.showSound,

    // Difficulté
    setDiff: window.setDiff,

    // Contrôles
    d: window.d,
    moveUp: window.moveUp,
    moveDown: window.moveDown,
    moveLeft: window.moveLeft,
    moveRight: window.moveRight,

    // Stats et progression
    showProgressionOverlay: window.showProgressionOverlay,
    showFinalStats: window.showFinalStats,
    returnToMenuFromStats: window.returnToMenuFromStats,

    // Getters
    getSoloGame: window.getSoloGame,
    getMultiGame: window.getMultiGame,
    getCurrentDifficulty: window.getCurrentDifficulty,

    // Carrière
    saveScore: window.saveScore,
    getLeaderboard: window.getLeaderboard,
    updateCareerStats: window.updateCareerStats,
    getCareerStats: window.getCareerStats,

    // Contrôleurs modulaires
    soloController,
    multiController,
    gameOverHandler,
    menuController
};

logger.log('✅ UI attachée au namespace SnakeUltra');
logger.log('✅ Contrôleurs modulaires chargés');


// ============================================

// ============================================
// MODAL SÉLECTION DIFFICULTÉ (SIMPLE)
// ============================================

// Variable pour tracker le mode actuel du modal (solo ou ai)
let currentModalMode = 'solo';

/**
 * Affiche le modal de sélection de difficulté
 * @param {string} mode - 'solo' ou 'ai'
 */
window.showDifficultyModal = function(mode = 'solo') {
    logger.log(`[Navigation] Ouverture modal difficulté (mode: ${mode})`);

    // Stocker le mode actuel
    currentModalMode = mode;

    const modal = document.getElementById('difficulty-modal');
    const title = document.querySelector('.diff-modal-title');
    const btnNormal = document.getElementById('diff-btn-normal');
    const btnHard = document.getElementById('diff-btn-hard');
    const btnEasy = document.getElementById('diff-btn-easy');

    if (!modal) return;

    // Configurer le modal selon le mode
    if (mode === 'ai') {
        // Mode IA : seulement Facile disponible
        if (title) title.textContent = 'Choisis ta difficulté (vs IA)';

        // Désactiver Normal et Hard
        if (btnNormal) {
            btnNormal.classList.add('diff-disabled');
            btnNormal.disabled = true;
        }
        if (btnHard) {
            btnHard.classList.add('diff-disabled');
            btnHard.disabled = true;
        }
        if (btnEasy) {
            btnEasy.classList.remove('diff-disabled');
            btnEasy.disabled = false;
        }

        // Modifier les textes de description
        const normalDesc = document.querySelector('#diff-btn-normal .diff-choice-desc');
        const hardDesc = document.querySelector('#diff-btn-hard .diff-choice-desc');
        if (normalDesc) normalDesc.textContent = 'À venir...';
        if (hardDesc) hardDesc.textContent = 'À venir...';

    } else {
        // Mode Solo : toutes les difficultés disponibles
        if (title) title.textContent = 'Choisis ta difficulté';

        // Réactiver tous les boutons
        if (btnEasy) {
            btnEasy.classList.remove('diff-disabled');
            btnEasy.disabled = false;
        }
        if (btnNormal) {
            btnNormal.classList.remove('diff-disabled');
            btnNormal.disabled = false;
        }
        if (btnHard) {
            btnHard.classList.remove('diff-disabled');
            btnHard.disabled = false;
        }

        // Restaurer les textes originaux
        const normalDesc = document.querySelector('#diff-btn-normal .diff-choice-desc');
        const hardDesc = document.querySelector('#diff-btn-hard .diff-choice-desc');
        if (normalDesc) normalDesc.textContent = 'Équilibré et fun';
        if (hardDesc) hardDesc.textContent = 'Pour les pros';
    }

    // Afficher le modal
    modal.classList.remove('hidden');
};

/**
 * Ferme le modal de sélection de difficulté
 */
window.closeDifficultyModal = function() {
    logger.log('[Navigation] Fermeture modal difficulté');

    const modal = document.getElementById('difficulty-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

/**
 * Lance le jeu avec la difficulté choisie (solo ou IA selon le mode)
 * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
 */
window.launchDifficulty = function(difficulty) {
    logger.log(`[Navigation] Lancement ${currentModalMode} avec difficulté ${difficulty}`);

    // Fermer le modal
    closeDifficultyModal();

    // Mettre à jour la difficulté globale
    window.currentDifficulty = difficulty;
    currentDifficulty = difficulty;

    // Lancer le jeu approprié selon le mode
    if (currentModalMode === 'ai') {
        // Forcer difficulté 0 (Facile) pour l'IA pour l'instant
        if (difficulty !== 0) {
            logger.warn('[Navigation] IA mode: Forçage difficulté 0 (Facile uniquement disponible)');
            difficulty = 0;
        }
        startAIGame(difficulty);
    } else {
        // Mode solo
        startSolo(difficulty);
    }
};

/**
 * Lance le jeu solo avec la difficulté choisie (ancienne fonction, gardée pour compatibilité)
 */
window.launchSoloDifficulty = function(difficulty) {
    logger.log(`[Navigation] Lancement solo avec difficulté ${difficulty}`);

    // Fermer le modal
    closeDifficultyModal();

    // Mettre à jour la difficulté globale
    window.currentDifficulty = difficulty;
    currentDifficulty = difficulty;

    // Lancer le jeu solo
    startSolo(difficulty);
};

// Alias pour compatibilité
window.showDifficultySelection = window.showDifficultyModal;

