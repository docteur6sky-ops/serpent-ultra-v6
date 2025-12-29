// ============================================
// RENDER UTILS - MODULE DE RENDU PARTAGÉ
// Fonctions pures extraites du mode solo
// ============================================

import { logger } from './services/logger.js';
const RenderUtils = {
    /**
     * Dessine la grille et la bordure du terrain
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {number} gridSize - Nombre de cellules (ex: 30)
     * @param {number} cellSize - Taille d'une cellule en pixels
     * @param {number} canvasSize - Taille totale du canvas
     * @param {object} colors - Objet {grid, border} pour les couleurs
     */
    drawGrid(ctx, gridSize, cellSize, canvasSize, colors) {
        // Grille de fond
        ctx.strokeStyle = colors.grid || '#404060';
        ctx.lineWidth = 1.5;
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvasSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvasSize, i * cellSize);
            ctx.stroke();
        }

        // Bordure dynamique
        ctx.lineWidth = 1;  // ✅ Affinée: 3px → 1px
        ctx.strokeStyle = colors.border || '#d8d800ff';
        ctx.strokeRect(0.5, 0.5, canvasSize - 1, canvasSize - 1);
    },

    /**
     * Dessine une étoile (pomme 🍎 ou 🍏) - Version solo
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {number} x - Position X en coordonnées grille
     * @param {number} y - Position Y en coordonnées grille
     * @param {number} cellSize - Taille d'une cellule
     * @param {boolean} isGreen - Si true, dessine pomme verte (Gourmandise)
     */
    drawStar(ctx, x, y, cellSize, isGreen = false) {
        const center = cellSize / 2;

        // Effet de lueur (dorée ou verte)
        ctx.shadowBlur = 10;
        ctx.shadowColor = isGreen ? '#39FF14' : '#FFD700';

        // Fond noir
        ctx.fillStyle = '#000000ff';
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);

        // Réinitialiser l'ombre
        ctx.shadowBlur = 0;

        // Emoji pomme (rouge ou verte selon Gourmandise)
        ctx.font = `${Math.floor(cellSize * 0.85)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isGreen ? '🍏' : '🍎', x * cellSize + center, y * cellSize + center);
    },

    /**
     * Dessine un crâne (💀) - Version solo
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {number} x - Position X en coordonnées grille
     * @param {number} y - Position Y en coordonnées grille
     * @param {number} cellSize - Taille d'une cellule
     */
    drawSkull(ctx, x, y, cellSize) {
        const center = cellSize / 2;

        // Effet de lueur rouge
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF1744';

        // Fond noir
        ctx.fillStyle = '#000';
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);

        // Réinitialiser l'ombre
        ctx.shadowBlur = 0;

        // Emoji crâne (taille adaptée à la cellule)
        ctx.font = `${Math.floor(cellSize * 0.85)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', x * cellSize + center, y * cellSize + center);
    },

    /**
     * Dessine un mur (🧱) avec texture - Version solo
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {number} x - Position X en coordonnées grille
     * @param {number} y - Position Y en coordonnées grille
     * @param {number} cellSize - Taille d'une cellule
     */
    drawWall(ctx, x, y, cellSize) {
        const center = cellSize / 2;

        // Effet d'ombre orange
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#D2691E';

        // Fond marron
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);

        // Bordure noire
        ctx.strokeStyle = '#000000ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Réinitialiser l'ombre
        ctx.shadowBlur = 0;

        // Emoji mur (taille adaptée à la cellule)
        ctx.font = `${Math.floor(cellSize * 0.75)}px Arial, sans-serif`;
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧱', x * cellSize + center, y * cellSize + center);
    },

    /**
     * Dessine un power-up animé - Version solo
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {number} x - Position X en coordonnées grille
     * @param {number} y - Position Y en coordonnées grille
     * @param {number} cellSize - Taille d'une cellule
     * @param {string} type - Type de power-up ('slow', 'double', 'invincible')
     */
    drawPowerup(ctx, x, y, cellSize, type) {
        const center = cellSize / 2;

        ctx.save();

        // Couleur de fond (noir pour tous les types)
        const color = '#000000ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        // Animation de pulsation
        const scale = 1 + 0.15 * Math.sin(performance.now() / 400);
        ctx.translate(x * cellSize + center, y * cellSize + center);
        ctx.scale(scale, scale);
        ctx.translate(-center, -center);
        ctx.fillRect(0, 0, cellSize, cellSize);

        ctx.restore();

        // Emoji selon le type (taille adaptée à la cellule)
        ctx.font = `${Math.floor(cellSize * 0.85)}px Arial, sans-serif`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let emoji = '❄️'; // ice par défaut
        if (type === 'lightning') emoji = '⚡';
        else if (type === 'rock') emoji = '🪨';
        else if (type === 'ghost') emoji = '👻';

        ctx.fillText(emoji, x * cellSize + center, y * cellSize + center);
    },

    /**
     * Dessine une Mystery Box animée style Mario Kart
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {number} x - Position X en coordonnées grille
     * @param {number} y - Position Y en coordonnées grille
     * @param {number} cellSize - Taille d'une cellule
     */
    drawMysteryBox(ctx, x, y, cellSize) {
        const center = cellSize / 2;
        const time = performance.now();

        ctx.save();

        // Animation arc-en-ciel pour le glow
        const hue = (time / 10) % 360;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

        // Fond qui pulse
        const scale = 1 + 0.1 * Math.sin(time / 200);
        ctx.translate(x * cellSize + center, y * cellSize + center);
        ctx.scale(scale, scale);
        ctx.translate(-center, -center);

        // Fond dégradé doré
        const gradient = ctx.createRadialGradient(
            center, center, 0,
            center, center, cellSize / 2
        );
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = gradient;

        // Boîte arrondie
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(cellSize - radius, 0);
        ctx.quadraticCurveTo(cellSize, 0, cellSize, radius);
        ctx.lineTo(cellSize, cellSize - radius);
        ctx.quadraticCurveTo(cellSize, cellSize, cellSize - radius, cellSize);
        ctx.lineTo(radius, cellSize);
        ctx.quadraticCurveTo(0, cellSize, 0, cellSize - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.fill();

        // Bordure brillante
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Point d'interrogation animé
        const bounce = Math.sin(time / 150) * 2;
        ctx.font = `bold ${Math.floor(cellSize * 0.7)}px Arial, sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#000';
        ctx.fillText('❓', x * cellSize + center, y * cellSize + center + bounce);
        ctx.shadowBlur = 0;
    },

    /**
     * Dessine la tête du serpent avec les yeux
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {number} x - Position X en coordonnées grille
     * @param {number} y - Position Y en coordonnées grille
     * @param {number} cellSize - Taille d'une cellule
     * @param {string} color - Couleur de la tête
     * @param {number} eyeOffset - Décalage des yeux
     * @param {number} eyeSize - Taille des yeux
     */
    drawSnakeHead(ctx, x, y, cellSize, color, eyeOffset, eyeSize) {
        // Dessiner la tête
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Dessiner les yeux
        ctx.fillStyle = '#000';
        const base = (cellSize - eyeSize) / 2;
        ctx.fillRect(x * cellSize + base - eyeOffset, y * cellSize + base, eyeSize, eyeSize);
        ctx.fillRect(x * cellSize + base + eyeOffset, y * cellSize + base, eyeSize, eyeSize);
    },

    /**
     * Dessine le corps complet du serpent
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {Array} segments - Tableau de segments [{x, y}, ...]
     * @param {number} cellSize - Taille d'une cellule
     * @param {string} color - Couleur du corps
     */
    drawSnakeBody(ctx, segments, cellSize, color) {
        if (!segments || segments.length === 0) return;

        segments.forEach((segment, i) => {
            if (i === 0) {
                // Tête (déjà dessinée avec drawSnakeHead)
                return;
            } else {
                // Corps
                ctx.fillStyle = color;
                ctx.fillRect(
                    segment.x * cellSize,
                    segment.y * cellSize,
                    cellSize,
                    cellSize
                );
            }
        });
    },

    /**
     * Obtenir une couleur plus foncée pour les bordures
     * @param {string} hexColor - Couleur hex (#RRGGBB)
     * @returns {string} Couleur assombrie
     */
    getDarkerColor(hexColor) {
        // Convertit #RRGGBB en version plus foncée
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        // Assombrir de 40%
        const darker = (val) => Math.max(0, Math.floor(val * 0.6));

        const newR = darker(r).toString(16).padStart(2, '0');
        const newG = darker(g).toString(16).padStart(2, '0');
        const newB = darker(b).toString(16).padStart(2, '0');

        return `#${newR}${newG}${newB}`;
    },

    /**
     * Dessine un serpent multijoueur complet
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {Array} segments - Tableau de segments
     * @param {number} cellSize - Taille d'une cellule
     * @param {string} color - Couleur du serpent
     * @param {number} playerNumber - Numéro du joueur (1 ou 2)
     * @param {boolean} isAlive - Si le serpent est vivant
     */
    drawMultiplayerSnake(ctx, segments, cellSize, color, playerNumber, isAlive) {
        if (!segments || segments.length === 0) return;

        const eyeSize = 3 * 0.75;
        const eyeOffset = 4 * 0.5;

        segments.forEach((segment, i) => {
            const fillColor = isAlive ? color : '#666666';

            // ✅ Dessiner le segment
            ctx.fillStyle = fillColor;
            ctx.fillRect(
                segment.x * cellSize,
                segment.y * cellSize,
                cellSize,
                cellSize
            );

            // ✅ BORDURE pour chaque segment (comme en solo)
            ctx.strokeStyle = this.getDarkerColor(fillColor);
            ctx.lineWidth = 2;
            ctx.strokeRect(
                segment.x * cellSize,
                segment.y * cellSize,
                cellSize,
                cellSize
            );

            // Yeux sur la tête
            if (i === 0 && isAlive) {
                ctx.fillStyle = '#000';
                const base = (cellSize - eyeSize) / 2;
                ctx.fillRect(
                    segment.x * cellSize + base - eyeOffset,
                    segment.y * cellSize + base,
                    eyeSize,
                    eyeSize
                );
                ctx.fillRect(
                    segment.x * cellSize + base + eyeOffset,
                    segment.y * cellSize + base,
                    eyeSize,
                    eyeSize
                );
            }
        });
    }
};

// Export global
window.RenderUtils = RenderUtils;
