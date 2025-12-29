// ============================================
// SNAKE AI - Intelligence Artificielle Greedy
// ============================================

import { logger } from '../services/logger.js';

/**
 * IA pour le serpent adverse
 * Version MVP : Greedy simple (va vers la nourriture)
 */
export class SnakeAI {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.name = "IA";
    }

    /**
     * Calcule le prochain mouvement de l'IA
     * @param {Array} aiSnake - Serpent de l'IA [{x, y}, ...]
     * @param {Array} playerSnake - Serpent du joueur [{x, y}, ...]
     * @param {Object} food - Nourriture {x, y}
     * @param {Array} obstacles - Liste des obstacles [{x, y}, ...]
     * @returns {Object} - Direction {dx, dy}
     */
    getNextMove(aiSnake, playerSnake, food, obstacles = []) {
        if (!aiSnake || aiSnake.length === 0) {
            logger.warn('[SnakeAI] Serpent IA vide');
            return { dx: 1, dy: 0 };
        }

        if (!food) {
            logger.warn('[SnakeAI] Pas de nourriture');
            return { dx: 1, dy: 0 };
        }

        const head = aiSnake[0];

        // Calcul greedy simple : aller vers la nourriture
        const dx = food.x - head.x;
        const dy = food.y - head.y;

        // Choix de direction : prioriser l'axe avec la plus grande distance
        let newDx = 0;
        let newDy = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Bouger horizontalement
            newDx = Math.sign(dx);
            newDy = 0;
        } else {
            // Bouger verticalement
            newDx = 0;
            newDy = Math.sign(dy);
        }

        // Vérification basique : éviter de se mordre immédiatement
        const nextX = head.x + newDx;
        const nextY = head.y + newDy;

        // Si la prochaine position est dans le corps de l'IA, essayer une direction perpendiculaire
        if (aiSnake.slice(1).some(s => s.x === nextX && s.y === nextY)) {
            logger.log('[SnakeAI] Évitement auto-collision');

            // Essayer direction perpendiculaire
            if (newDx !== 0) {
                // Bougeait horizontalement, essayer vertical
                newDx = 0;
                newDy = dy > 0 ? 1 : -1;
            } else {
                // Bougeait verticalement, essayer horizontal
                newDx = dx > 0 ? 1 : -1;
                newDy = 0;
            }
        }

        return { dx: newDx, dy: newDy };
    }
}
