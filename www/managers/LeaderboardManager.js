/**
 * LEADERBOARD MANAGER - Gestion des scores et classement
 *
 * Responsabilités :
 * - Sauvegarde des scores
 * - Récupération du Top 3
 * - Utilitaires de formatage
 */

import { logger } from '../services/logger.js';
import { SnakeUltra } from '../SnakeUltra.js';

// ============================================
// CLASSE LEADERBOARD MANAGER
// ============================================

class LeaderboardManager {
    constructor() {
        this.storageKey = 'leaderboard';
        logger.log('[LeaderboardManager] Initialisé');
    }

    /**
     * Sauvegarder un score dans le classement Top 3
     * @param {object} stats - Statistiques de la partie
     * @returns {Array} Classement mis à jour
     */
    saveScore(stats) {
        // Récupérer le classement actuel
        let leaderboard = this.getLeaderboard();

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
        localStorage.setItem(this.storageKey, JSON.stringify(leaderboard));

        logger.log('[LeaderboardManager] Score sauvegardé:', stats.score);
        return leaderboard;
    }

    /**
     * Récupérer le classement Top 3
     * @returns {Array} Tableau des 3 meilleurs scores
     */
    getLeaderboard() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return [];

            const parsed = JSON.parse(raw);

            // Si c'est un objet avec .data (format sécurisé), extraire les données
            if (parsed && parsed.data && Array.isArray(parsed.data)) {
                return parsed.data;
            }

            // Si c'est directement un tableau, le retourner
            if (Array.isArray(parsed)) {
                return parsed;
            }

            // Sinon, retourner un tableau vide
            logger.warn('[LeaderboardManager] Format inattendu, reset du leaderboard');
            return [];
        } catch (e) {
            logger.warn('[LeaderboardManager] Erreur lecture localStorage:', e);
            return [];
        }
    }

    /**
     * Vérifier si un score est dans le Top 3
     * @param {number} score - Score à vérifier
     * @returns {boolean}
     */
    isHighScore(score) {
        const leaderboard = this.getLeaderboard();
        if (leaderboard.length < 3) return true;
        return score > leaderboard[leaderboard.length - 1].score;
    }

    /**
     * Récupérer le meilleur score
     * @returns {number}
     */
    getBestScore() {
        const leaderboard = this.getLeaderboard();
        return leaderboard.length > 0 ? leaderboard[0].score : 0;
    }

    /**
     * Réinitialiser le classement
     */
    reset() {
        localStorage.removeItem(this.storageKey);
        logger.log('[LeaderboardManager] Classement réinitialisé');
    }

    // ============================================
    // UTILITAIRES DE FORMATAGE
    // ============================================

    /**
     * Convertir un temps "MM:SS" en secondes
     * @param {string} timeStr - Temps au format "MM:SS"
     * @returns {number} Temps en secondes
     */
    timeToSeconds(timeStr) {
        if (!timeStr || timeStr === '0:00') return 0;
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
    }

    /**
     * Convertir des secondes en format M:SS
     * @param {number} seconds - Temps en secondes
     * @returns {string} Temps formaté
     */
    formatSurvivalTime(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

const leaderboardManager = new LeaderboardManager();

// Exposer globalement pour compatibilité
window.leaderboardManager = leaderboardManager;
window.saveScore = (stats) => leaderboardManager.saveScore(stats);
window.getLeaderboard = () => leaderboardManager.getLeaderboard();

// Enregistrer dans SnakeUltra
SnakeUltra.registerManager('leaderboard', leaderboardManager);

logger.log('✅ LeaderboardManager chargé');

export { leaderboardManager, LeaderboardManager };
