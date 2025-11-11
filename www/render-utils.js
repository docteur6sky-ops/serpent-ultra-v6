// ============================================
// RENDER UTILS - MODULE DE RENDU PARTAGÉ
// Fonctions pures extraites du mode solo
// ============================================

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
        ctx.lineWidth = 3;
        ctx.strokeStyle = colors.border || '#d8d800ff';
        ctx.strokeRect(1.5, 1.5, canvasSize - 3, canvasSize - 3);
    },

    /**
     * Dessine une étoile (pomme 🍎) - Version solo
     * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
     * @param {number} x - Position X en coordonnées grille
     * @param {number} y - Position Y en coordonnées grille
     * @param {number} cellSize - Taille d'une cellule
     */
    drawStar(ctx, x, y, cellSize) {
        const center = cellSize / 2;

        // Effet de lueur dorée
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';

        // Fond noir
        ctx.fillStyle = '#000000ff';
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);

        // Réinitialiser l'ombre
        ctx.shadowBlur = 0;

        // Emoji pomme
        ctx.font = '12px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍎', x * cellSize + center, y * cellSize + center);
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

        // Emoji crâne
        ctx.font = '12px Arial, sans-serif';
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

        // Emoji mur
        ctx.font = '10px Arial, sans-serif';
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

        // Emoji selon le type
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let emoji = '⏱️'; // slow par défaut
        if (type === 'double') emoji = '💰';
        else if (type === 'invincible') emoji = '🛡️';

        ctx.fillText(emoji, x * cellSize + center, y * cellSize + center);
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
            ctx.fillStyle = fillColor;
            ctx.fillRect(
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
console.log('✅ RenderUtils chargé');
