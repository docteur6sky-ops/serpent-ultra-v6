/**
 * GRADE MANAGER - Système de grades Solo et Multi
 *
 * Responsabilités :
 * - Calcul des grades Solo (basés sur le niveau)
 * - Calcul des grades Multi (basés sur les victoires)
 * - Mise à jour de l'affichage des grades dans le Hub
 */

import { logger } from '../services/logger.js';
import { RANKS } from '../data/trophies.js';

// ============================================
// CONFIGURATION GRADES MULTI
// ============================================

const MULTI_GRADES = {
    LEGEND: { min: 60, emoji: '👑', color: '#9400D3', label: 'LÉGENDE' },
    PLATINUM: { min: 50, emoji: '💎', color: '#E5E4E2', label: 'PLATINE' },
    ELITE: { min: 40, emoji: '⭐', color: '#4169E1', label: 'ÉLITE' },
    CHAMPION: { min: 30, emoji: '🏆', color: '#FF8C00', label: 'CHAMPION' },
    GOLD: { min: 20, emoji: '🥇', color: '#FFD700', label: 'OR' },
    SILVER: { min: 10, emoji: '🥈', color: '#C0C0C0', label: 'ARGENT' },
    BRONZE: { min: 0, emoji: '🥉', color: '#CD7F32', label: 'BRONZE' }
};

// ============================================
// CLASSE GRADE MANAGER
// ============================================

class GradeManager {
    constructor() {
        logger.log('[GradeManager] Initialisé');
    }

    /**
     * Calcule le grade solo basé sur le niveau du joueur
     * @param {number} level - Niveau du joueur
     * @returns {object} Grade { emoji, color, label }
     */
    calculateSoloGrade(level) {
        // Convertir les RANKS en tableau trié par minLevel
        const sortedRanks = Object.entries(RANKS)
            .map(([key, rank]) => ({ key, ...rank }))
            .sort((a, b) => a.minLevel - b.minLevel);

        // Parcourir les grades triés
        for (const rank of sortedRanks) {
            if (level >= rank.minLevel && level <= rank.maxLevel) {
                return {
                    emoji: rank.emoji,
                    color: rank.color,
                    label: rank.title
                };
            }
        }

        // Par défaut : BRONZE (Apprenti)
        return {
            emoji: RANKS.bronze.emoji,
            color: RANKS.bronze.color,
            label: RANKS.bronze.title
        };
    }

    /**
     * Calcule le grade multi basé sur les victoires
     * @param {number} multiWins - Nombre de victoires multi
     * @returns {object} Grade { emoji, color, label }
     */
    calculateMultiGrade(multiWins) {
        for (const [key, grade] of Object.entries(MULTI_GRADES)) {
            if (multiWins >= grade.min) {
                return grade;
            }
        }
        return MULTI_GRADES.BRONZE;
    }

    /**
     * Met à jour l'affichage des grades dans le Hub
     */
    updatePlayerGrades() {
        const career = window.career || { level: 1, multiWins: 0 };

        // Calculer les grades
        const soloGrade = this.calculateSoloGrade(career.level);
        const multiGrade = this.calculateMultiGrade(career.multiWins || 0);

        // Mettre à jour le DOM - Solo
        const soloValueEl = document.getElementById('hub-grade-solo');
        if (soloValueEl) {
            soloValueEl.textContent = soloGrade.label;
            soloValueEl.style.color = soloGrade.color;

            const soloContainer = soloValueEl.closest('.hub-grade-solo');
            if (soloContainer) {
                soloContainer.style.background = `linear-gradient(135deg, ${soloGrade.color}dd 0%, ${soloGrade.color}88 100%)`;
                soloContainer.style.borderColor = soloGrade.color;
            }
        }

        // Mettre à jour le DOM - Multi
        const multiValueEl = document.getElementById('hub-grade-multi');
        if (multiValueEl) {
            multiValueEl.textContent = multiGrade.label;
            multiValueEl.style.color = multiGrade.color;

            const multiContainer = multiValueEl.closest('.hub-grade-multi');
            if (multiContainer) {
                multiContainer.style.background = `linear-gradient(135deg, ${multiGrade.color}dd 0%, ${multiGrade.color}88 100%)`;
                multiContainer.style.borderColor = multiGrade.color;
            }
        }

        logger.log(`[GradeManager] Grades mis à jour - Solo: ${soloGrade.label}, Multi: ${multiGrade.label}`);
    }

    /**
     * Fonction de test console
     * @param {number} level - Niveau à tester
     * @param {number} multiWins - Victoires à tester
     */
    testGrade(level = null, multiWins = null) {
        if (level !== null && window.career) {
            window.career.level = level;
            logger.log(`[TEST] Niveau solo défini à ${level}`);
        }
        if (multiWins !== null && window.career) {
            window.career.multiWins = multiWins;
            logger.log(`[TEST] Victoires multi définies à ${multiWins}`);
        }

        // Rafraîchir l'affichage
        this.updatePlayerGrades();
        if (window.updatePlayerInfo) window.updatePlayerInfo();

        // Afficher les grades actuels
        const career = window.career || { level: 1, multiWins: 0 };
        const soloGrade = this.calculateSoloGrade(career.level);
        const multiGrade = this.calculateMultiGrade(career.multiWins || 0);

        logger.log('═══════════════════════════════════════');
        logger.log(`📊 GRADES ACTUELS:`);
        logger.log(`  Solo: ${soloGrade.emoji} ${soloGrade.label} (niveau ${career.level})`);
        logger.log(`  Multi: ${multiGrade.emoji} ${multiGrade.label} (${career.multiWins || 0} victoires)`);
        logger.log('═══════════════════════════════════════');

        return { solo: soloGrade, multi: multiGrade };
    }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

const gradeManager = new GradeManager();

// Exposer globalement pour compatibilité HTML
window.gradeManager = gradeManager;
window.calculateSoloGrade = (level) => gradeManager.calculateSoloGrade(level);
window.calculateMultiGrade = (wins) => gradeManager.calculateMultiGrade(wins);
window.updatePlayerGrades = () => gradeManager.updatePlayerGrades();
window.testGrade = (level, wins) => gradeManager.testGrade(level, wins);

logger.log('✅ GradeManager chargé');

export { gradeManager, GradeManager, MULTI_GRADES };
