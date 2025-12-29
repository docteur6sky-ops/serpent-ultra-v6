/**
 * BossHelpers.js
 * Fonctions utilitaires pour le système de boss fight
 *
 * Ces fonctions sont statiques et peuvent être utilisées
 * par solo-game.js sans modifier sa structure
 */

import { logger } from '../services/logger.js';

/**
 * Calcule la direction optimale pour le boss vers une cible
 * @param {Object} bossHead - Position de la tête du boss {x, y}
 * @param {Object} target - Position cible {x, y}
 * @param {number} currentDx - Direction X actuelle
 * @param {number} currentDy - Direction Y actuelle
 * @param {number} gridSize - Taille de la grille
 * @returns {{dx: number, dy: number}} Nouvelle direction
 */
export function calculateBossDirection(bossHead, target, currentDx, currentDy, gridSize) {
    const diffX = target.x - bossHead.x;
    const diffY = target.y - bossHead.y;

    // Tenir compte du wrap-around
    const wrappedDiffX = diffX > gridSize / 2 ? diffX - gridSize :
                         diffX < -gridSize / 2 ? diffX + gridSize : diffX;
    const wrappedDiffY = diffY > gridSize / 2 ? diffY - gridSize :
                         diffY < -gridSize / 2 ? diffY + gridSize : diffY;

    let newDx = currentDx;
    let newDy = currentDy;

    // Prioriser l'axe avec la plus grande distance
    if (Math.abs(wrappedDiffX) > Math.abs(wrappedDiffY)) {
        // Mouvement horizontal
        if (wrappedDiffX > 0 && currentDx !== -1) {
            newDx = 1; newDy = 0;
        } else if (wrappedDiffX < 0 && currentDx !== 1) {
            newDx = -1; newDy = 0;
        }
    } else {
        // Mouvement vertical
        if (wrappedDiffY > 0 && currentDy !== -1) {
            newDx = 0; newDy = 1;
        } else if (wrappedDiffY < 0 && currentDy !== 1) {
            newDx = 0; newDy = -1;
        }
    }

    return { dx: newDx, dy: newDy };
}

/**
 * Vérifie si une position est occupée par le boss
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {Array} bossSnake - Corps du boss [{x, y}, ...]
 * @returns {boolean}
 */
export function isBossPosition(x, y, bossSnake) {
    if (!bossSnake || bossSnake.length === 0) return false;
    return bossSnake.some(segment => segment.x === x && segment.y === y);
}

/**
 * Calcule le ratio de vie du boss
 * @param {Object} boss - Objet boss
 * @returns {number} Ratio entre 0 et 1
 */
export function getBossHealthRatio(boss) {
    if (!boss || !boss.snake || !boss.maxSegments) return 0;
    return boss.snake.length / boss.maxSegments;
}

/**
 * Détermine la phase actuelle du boss basée sur sa vie
 * @param {Object} boss - Objet boss avec phases
 * @returns {Object|null} Phase actuelle ou null
 */
export function getCurrentBossPhase(boss) {
    if (!boss || !boss.phases || boss.phases.length === 0) return null;

    const hpRatio = getBossHealthRatio(boss);

    for (let i = boss.phases.length - 1; i >= 0; i--) {
        if (hpRatio <= boss.phases[i].threshold) {
            return boss.phases[i];
        }
    }

    return boss.phases[0];
}

/**
 * Génère une position aléatoire pour spawn (boss, épée, etc.)
 * @param {number} gridSize - Taille de la grille
 * @param {Array} excludePositions - Positions à éviter [{x, y}, ...]
 * @param {number} margin - Marge depuis les bords
 * @returns {{x: number, y: number}}
 */
export function getRandomSpawnPosition(gridSize, excludePositions = [], margin = 2) {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
        const x = margin + Math.floor(Math.random() * (gridSize - 2 * margin));
        const y = margin + Math.floor(Math.random() * (gridSize - 2 * margin));

        const isExcluded = excludePositions.some(pos =>
            Math.abs(pos.x - x) < 3 && Math.abs(pos.y - y) < 3
        );

        if (!isExcluded) {
            return { x, y };
        }

        attempts++;
    }

    // Fallback au centre si pas de position trouvée
    return { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
}

/**
 * Calcule les dégâts du boss selon la phase
 * @param {Object} boss - Objet boss
 * @param {number} baseDamage - Dégâts de base
 * @returns {number} Dégâts finaux
 */
export function calculateBossDamage(boss, baseDamage = 1) {
    if (!boss) return baseDamage;

    const phase = getCurrentBossPhase(boss);
    const aggressionMultiplier = phase?.aggression || 1;

    return Math.ceil(baseDamage * aggressionMultiplier);
}

logger.debug('[BossHelpers] Module chargé');
