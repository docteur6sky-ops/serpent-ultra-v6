/**
 * CAREER MANAGER - Gestion de la progression du joueur
 *
 * Responsabilités :
 * - Données de carrière (XP, niveau, stats)
 * - Système de rangs
 * - Sauvegarde/chargement
 */

import { logger } from './logger.js';
import { save, load } from './storage.js';
import { RANKS } from '../data/trophies.js';

// ============================================
// CONFIGURATION CARRIÈRE
// ============================================

const defaultCareer = {
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
    maxSurvivalTime: 0,

    // Stats Multi
    multiWins: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalMultiGames: 0,
    multiCompleted: 0,

    // Stats IA
    aiWins: 0,
    aiGames: 0,

    // Trophées créatifs
    phoenixRises: 0,
    quickDeaths: 0,
    lastGameResult: null,

    // Secrets
    screensVisited: [],
    rankHistory: []
};

// ============================================
// CLASSE CAREER MANAGER
// ============================================

class CareerManager {
    constructor() {
        this.career = this.load();
        logger.log('[CareerManager] Initialisé - Niveau', this.career.level);
    }

    // ============================================
    // CHARGEMENT / SAUVEGARDE
    // ============================================

    load() {
        const saved = load('career', {});
        const career = { ...defaultCareer, ...saved };

        // Recalculer xpNext selon la formule linéaire
        career.xpNext = 100 + (career.level * 100);

        // Vérifier si level up nécessaire (au cas où XP > xpNext)
        let needsSave = false;
        while (career.xp >= career.xpNext && career.level < 100) {
            career.xp -= career.xpNext;
            career.level++;
            career.xpNext = 100 + (career.level * 100);
            needsSave = true;
        }

        if (needsSave) {
            save('career', career);
            logger.log('[CareerManager] Niveau corrigé au chargement:', career.level);
        }

        return career;
    }

    save() {
        save('career', this.career);
    }

    // ============================================
    // MISE À JOUR CARRIÈRE
    // ============================================

    /**
     * Met à jour les statistiques de carrière après une partie
     * @param {object} stats - Statistiques de la partie
     * @returns {object} { leveledUp, oldLevel, newLevel, xpGained }
     */
    updateCareer(stats) {
        const oldLevel = this.career.level;
        const xpGained = Math.floor((stats.score || 0) / 5);

        // Mise à jour des statistiques de jeu
        this.career.totalGames++;
        this.career.totalScore += stats.score || 0;
        this.career.bestScore = Math.max(this.career.bestScore, stats.score || 0);
        this.career.totalApples += stats.foodCount || 0;
        this.career.maxLevel = Math.max(this.career.maxLevel, stats.level || 0);
        this.career.totalWalls += stats.wallsDestroyed || 0;
        this.career.totalPowerups += (stats.slowCount || 0) + (stats.doubleCount || 0) +
                                     (stats.invincibleCount || 0) + (stats.ghostCount || 0);

        // Mise à jour du temps de survie max
        if (stats.timeString) {
            const currentSeconds = this.timeToSeconds(stats.timeString);
            if (currentSeconds > this.career.maxSurvivalTime) {
                this.career.maxSurvivalTime = currentSeconds;
            }
        }

        // Ajout de l'XP
        this.career.xp += xpGained;

        // Gestion du level up
        let leveledUp = false;
        while (this.career.xp >= this.career.xpNext && this.career.level < 100) {
            this.career.xp -= this.career.xpNext;
            this.career.level++;
            this.career.xpNext = 100 + (this.career.level * 100);
            leveledUp = true;
        }

        // Sauvegarde
        this.save();

        logger.log(`[CareerManager] Stats mises à jour - Niveau ${this.career.level}, XP ${this.career.xp}/${this.career.xpNext}`);

        return { leveledUp, oldLevel, newLevel: this.career.level, xpGained };
    }

    /**
     * Ajoute de l'XP directement (pour trophées, etc.)
     * @param {number} amount - Montant d'XP
     * @returns {object} { leveledUp, oldLevel, newLevel }
     */
    addXP(amount) {
        const oldLevel = this.career.level;
        this.career.xp += amount;

        let leveledUp = false;
        while (this.career.xp >= this.career.xpNext && this.career.level < 100) {
            this.career.xp -= this.career.xpNext;
            this.career.level++;
            this.career.xpNext = 100 + (this.career.level * 100);
            leveledUp = true;
        }

        this.save();

        return { leveledUp, oldLevel, newLevel: this.career.level };
    }

    /**
     * Convertit un temps "M:SS" en secondes
     */
    timeToSeconds(timeString) {
        if (!timeString) return 0;
        const parts = timeString.split(':');
        return parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
    }

    /**
     * Récupère les statistiques de carrière (lecture seule)
     * @returns {object} Copie des stats de carrière
     */
    getStats() {
        return { ...this.career };
    }

    // ============================================
    // SYSTÈME DE RANGS
    // ============================================

    /**
     * Récupère le rang actuel du joueur
     */
    getCurrentRank() {
        const level = this.career.level || 1;

        for (let key in RANKS) {
            const rank = RANKS[key];
            if (level >= rank.minLevel && level <= rank.maxLevel) {
                return {
                    ...rank,
                    key: key,
                    progress: level - rank.minLevel,
                    total: rank.maxLevel - rank.minLevel + 1,
                    percentage: Math.round(((level - rank.minLevel) / (rank.maxLevel - rank.minLevel + 1)) * 100)
                };
            }
        }

        return RANKS.legend;
    }

    /**
     * Récupère le prochain rang
     */
    getNextRank() {
        const current = this.getCurrentRank();
        const rankKeys = Object.keys(RANKS);
        const currentIndex = rankKeys.indexOf(current.key);

        if (currentIndex < rankKeys.length - 1) {
            const nextKey = rankKeys[currentIndex + 1];
            return { ...RANKS[nextKey], key: nextKey };
        }

        return null;
    }

    /**
     * Vérifie si le rang a changé entre deux niveaux
     */
    hasRankChanged(oldLevel, newLevel) {
        const oldRank = Object.values(RANKS).find(r => oldLevel >= r.minLevel && oldLevel <= r.maxLevel);
        const newRank = Object.values(RANKS).find(r => newLevel >= r.minLevel && newLevel <= r.maxLevel);
        return oldRank !== newRank;
    }

    /**
     * Affiche la notification de rank up
     */
    showRankUpNotification(newRank) {
        if (window.NotificationManager && window.NotificationManager.showRankUpNotification) {
            const audioCallback = (window.audio && window.audio.rankUp) ? window.audio.rankUp : null;
            window.NotificationManager.showRankUpNotification(newRank, audioCallback);
        }

        // Historique des rangs
        if (!this.career.rankHistory) this.career.rankHistory = [];
        if (!this.career.rankHistory.includes(newRank.key)) {
            this.career.rankHistory.push(newRank.key);
            this.save();
        }
    }

    /**
     * Met à jour l'affichage du badge de rang
     */
    updateRankDisplay() {
        const rank = this.getCurrentRank();
        const badge = document.getElementById('rank-badge');

        if (badge) {
            const emojiEl = badge.querySelector('.rank-badge-emoji');
            const nameEl = badge.querySelector('.rank-badge-name');
            const levelEl = badge.querySelector('.rank-badge-level');

            if (emojiEl) emojiEl.textContent = rank.emoji;
            if (nameEl) nameEl.textContent = rank.title;
            if (levelEl) levelEl.textContent = `Nv. ${this.career.level}/${rank.maxLevel}`;

            badge.style.borderColor = rank.color;
            badge.style.boxShadow = `0 0 15px ${rank.color}`;
        }
    }

    /**
     * Met à jour l'affichage du niveau/XP dans le cercle
     */
    updatePlayerInfo() {
        const levelNum = document.getElementById('player-level-num');
        const circleFill = document.getElementById('player-circle-fill');

        if (levelNum) levelNum.textContent = this.career.level;
        if (circleFill) {
            const percentage = Math.min((this.career.xp / this.career.xpNext) * 100, 100);
            const circumference = 283;
            const offset = circumference - (percentage / 100) * circumference;
            circleFill.style.strokeDashoffset = offset;
        }
    }

    /**
     * Reset complet de la carrière
     */
    reset() {
        this.career = { ...defaultCareer };
        this.save();
        logger.log('[CareerManager] Reset complet');
    }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

const careerManager = new CareerManager();

// Exposer globalement pour compatibilité
window.career = careerManager.career;
window.careerManager = careerManager;
window.updateCareer = (stats) => careerManager.updateCareer(stats);
window.getCareerStats = () => careerManager.getStats();
window.getCurrentRank = () => careerManager.getCurrentRank();
window.getNextRank = () => careerManager.getNextRank();
window.updateRankDisplay = () => careerManager.updateRankDisplay();
window.updatePlayerInfo = () => careerManager.updatePlayerInfo();

logger.log('✅ CareerManager chargé');

export { careerManager, CareerManager, defaultCareer };
