/**
 * BossRenderer.js - Rendu visuel des boss
 * Extrait de solo-game.js pour modularité
 *
 * Responsabilités:
 * - Dessin du boss (corps, tête, yeux, cornes)
 * - Dessin de l'épée
 * - Dessin des zones de glace (Boss 2 CRYO)
 * - Dessin des skulls (Boss 3 SPECTRE)
 * - Dessin des lignes électriques (Boss 4 FOUDRE)
 */

export class BossRenderer {
    constructor(ctx, cellSize, gridSize) {
        this.ctx = ctx;
        this.cellSize = cellSize;
        this.gridSize = gridSize;
    }

    /**
     * Dessine le boss complet
     * @param {Object} boss - Objet boss du BossFightSystem
     */
    drawBoss(boss) {
        if (!boss || boss.snake.length === 0) return;

        // Boss invisible (SPECTRE) - ne pas dessiner
        if (boss.isInvisible) {
            // Dessiner une ombre légère pour indiquer la position
            this.drawInvisibleBossHint(boss);
            return;
        }

        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const now = Date.now();

        const phaseColor = boss.phaseColor || '#ff0000';
        const isInvincible = boss.invincible;

        // Effet de pulsation
        const pulse = 1 + Math.sin(now / 300) * 0.05;

        // Dessiner chaque segment (du dernier au premier pour superposition)
        for (let index = boss.snake.length - 1; index >= 0; index--) {
            const segment = boss.snake[index];
            const x = segment.x * cellSize;
            const y = segment.y * cellSize;

            ctx.save();

            // Taille progressive (queue plus fine)
            const segmentScale = index === 0 ? 1 : 0.85 + (0.15 * (1 - index / boss.snake.length));
            const size = (cellSize - 2) * segmentScale * pulse;

            // Couleur du boss selon phase et état
            let mainColor, glowColor, glowIntensity;

            if (index === 0) {
                // Tête du boss
                if (isInvincible) {
                    mainColor = '#ffffff';
                    glowColor = '#88ccff';
                    glowIntensity = 30;
                } else {
                    mainColor = boss.hasSword ? '#ff3300' : phaseColor;
                    glowColor = boss.hasSword ? '#ff6600' : phaseColor;
                    glowIntensity = boss.hasSword ? 20 : 12;
                }
            } else {
                // Corps - dégradé vers la queue
                const fadeRatio = 1 - (index / boss.snake.length) * 0.4;
                if (isInvincible) {
                    mainColor = `rgba(200, 200, 200, ${fadeRatio})`;
                } else {
                    mainColor = boss.hasSword ?
                        this.darkenColor('#ff3300', index * 3) :
                        this.darkenColor(phaseColor, index * 3);
                }
                glowColor = null;
                glowIntensity = 0;
            }

            // Glow effect
            if (glowIntensity > 0) {
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = glowIntensity;
            }

            // Dessiner le segment
            ctx.fillStyle = mainColor;
            ctx.beginPath();

            if (index === 0) {
                // Tête = ellipse
                ctx.ellipse(
                    x + cellSize / 2,
                    y + cellSize / 2,
                    size / 2 * 1.1,
                    size / 2,
                    0, 0, Math.PI * 2
                );
            } else {
                // Corps = cercles
                ctx.arc(
                    x + cellSize / 2,
                    y + cellSize / 2,
                    size / 2,
                    0, Math.PI * 2
                );
            }
            ctx.fill();

            // Écailles sur le corps
            if (index > 0 && index % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, size / 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.shadowBlur = 0;

            // Détails de la tête
            if (index === 0) {
                this.drawBossHead(ctx, x, y, cellSize, mainColor, boss);
            }

            ctx.restore();
        }
    }

    /**
     * Dessine les détails de la tête du boss
     */
    drawBossHead(ctx, x, y, cellSize, mainColor, boss) {
        // Yeux blancs avec lueur
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffffff';
        const eyeSize = cellSize / 4.5;

        // Yeux en forme d'amande
        ctx.beginPath();
        ctx.ellipse(x + cellSize * 0.32, y + cellSize * 0.4, eyeSize, eyeSize * 0.7, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + cellSize * 0.68, y + cellSize * 0.4, eyeSize, eyeSize * 0.7, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Pupilles fendues
        const pupilColor = boss.hasSword ? '#ff0000' : '#220000';
        ctx.fillStyle = pupilColor;

        const pupilWidth = eyeSize * 0.3;
        const pupilHeight = eyeSize * 0.8;
        ctx.beginPath();
        ctx.ellipse(x + cellSize * 0.32, y + cellSize * 0.4, pupilWidth, pupilHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + cellSize * 0.68, y + cellSize * 0.4, pupilWidth, pupilHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        // Reflets dans les yeux
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x + cellSize * 0.28, y + cellSize * 0.35, eyeSize * 0.2, 0, Math.PI * 2);
        ctx.arc(x + cellSize * 0.64, y + cellSize * 0.35, eyeSize * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Cornes
        ctx.fillStyle = this.darkenColor(mainColor, 20);
        ctx.beginPath();
        ctx.moveTo(x + cellSize * 0.2, y + cellSize * 0.15);
        ctx.lineTo(x + cellSize * 0.35, y + cellSize * 0.3);
        ctx.lineTo(x + cellSize * 0.15, y + cellSize * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + cellSize * 0.8, y + cellSize * 0.15);
        ctx.lineTo(x + cellSize * 0.65, y + cellSize * 0.3);
        ctx.lineTo(x + cellSize * 0.85, y + cellSize * 0.35);
        ctx.closePath();
        ctx.fill();

        // Épée au-dessus si armé
        if (boss.hasSword) {
            ctx.font = `${cellSize * 0.7}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 10;
            ctx.fillText('⚔️', x + cellSize / 2, y - 4);
            ctx.shadowBlur = 0;
        }

        // Bouche menaçante
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize * 0.65, cellSize * 0.2, 0.1 * Math.PI, 0.9 * Math.PI, false);
        ctx.stroke();

        // Crocs
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x + cellSize * 0.38, y + cellSize * 0.62);
        ctx.lineTo(x + cellSize * 0.42, y + cellSize * 0.75);
        ctx.lineTo(x + cellSize * 0.46, y + cellSize * 0.62);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + cellSize * 0.54, y + cellSize * 0.62);
        ctx.lineTo(x + cellSize * 0.58, y + cellSize * 0.75);
        ctx.lineTo(x + cellSize * 0.62, y + cellSize * 0.62);
        ctx.fill();
    }

    /**
     * Dessine l'épée sur le terrain
     * @param {Object} sword - Position {x, y} de l'épée
     */
    drawSword(sword) {
        if (!sword) return;

        const ctx = this.ctx;
        const x = sword.x * this.cellSize + this.cellSize / 2;
        const y = sword.y * this.cellSize + this.cellSize / 2;
        const size = this.cellSize * 0.8;

        // Animation de flottement
        const float = Math.sin(Date.now() / 200) * 3;

        ctx.save();
        ctx.translate(x, y + float);

        // Lueur dorée
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;

        // Dessiner l'épée
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔️', 0, 0);

        ctx.restore();
    }

    /**
     * Dessine une indication subtile quand le boss est invisible
     * @param {Object} boss - Objet boss
     */
    drawInvisibleBossHint(boss) {
        if (!boss || boss.snake.length === 0) return;

        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const head = boss.snake[0];

        // Ombre légère pulsante
        const pulse = 0.2 + Math.sin(Date.now() / 300) * 0.1;

        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#9932CC';
        ctx.shadowColor = '#9932CC';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(head.x * cellSize + cellSize / 2, head.y * cellSize + cellSize / 2, cellSize * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Dessine les zones de glace (Boss 2 CRYO)
     * @param {Array} iceZones - Tableau de zones de glace
     */
    drawIceZones(iceZones) {
        if (!iceZones || iceZones.length === 0) return;

        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const now = Date.now();

        iceZones.forEach(zone => {
            const x = zone.x * cellSize + cellSize / 2;
            const y = zone.y * cellSize + cellSize / 2;
            const radius = zone.radius * cellSize;

            // Opacité basée sur le temps restant
            const elapsed = now - zone.createdAt;
            const remaining = zone.duration - elapsed;
            const opacity = Math.max(0.3, remaining / zone.duration);

            // Pulsation glacée
            const pulse = 1 + Math.sin(now / 400) * 0.1;

            ctx.save();
            ctx.globalAlpha = opacity * 0.6;

            // Zone de glace avec dégradé
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * pulse);
            gradient.addColorStop(0, 'rgba(135, 206, 250, 0.8)');
            gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 191, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Contour gelé
            ctx.strokeStyle = '#00BFFF';
            ctx.lineWidth = 2;
            ctx.globalAlpha = opacity * 0.8;
            ctx.stroke();

            // Cristaux de glace (flocons)
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = opacity * 0.7;
            ctx.font = `${cellSize * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❄️', x, y);

            ctx.restore();
        });
    }

    /**
     * Dessine les skulls (Boss 3 SPECTRE)
     * @param {Array} skulls - Tableau de skulls
     */
    drawSkulls(skulls) {
        if (!skulls || skulls.length === 0) return;

        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const now = Date.now();

        skulls.forEach(skull => {
            const x = skull.x * cellSize + cellSize / 2;
            const y = skull.y * cellSize + cellSize / 2;

            // Opacité basée sur le temps restant
            const elapsed = now - skull.createdAt;
            const remaining = skull.duration - elapsed;
            const opacity = Math.max(0.4, remaining / skull.duration);

            // Flottement et pulsation
            const float = Math.sin(now / 300 + skull.x) * 3;
            const pulse = 1 + Math.sin(now / 200 + skull.y) * 0.1;

            ctx.save();
            ctx.translate(x, y + float);
            ctx.scale(pulse, pulse);
            ctx.globalAlpha = opacity;

            // Lueur violette
            ctx.shadowColor = '#9932CC';
            ctx.shadowBlur = 12;

            // Dessiner le crâne
            ctx.font = `${cellSize * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💀', 0, 0);

            ctx.restore();
        });
    }

    /**
     * Dessine les portails de téléportation (Boss 4 FOUDRE)
     * @param {Array} teleportPortals - Tableau de portails
     */
    drawTeleportPortals(teleportPortals) {
        if (!teleportPortals || teleportPortals.length === 0) return;

        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const now = Date.now();

        teleportPortals.forEach(portal => {
            const age = now - portal.createdAt;
            const remainingTime = portal.duration - age;
            const lifeRatio = remainingTime / portal.duration;

            // Animation de pulsation
            const pulse = Math.sin(now / 200 + portal.pulsePhase) * 0.3 + 0.7;

            // Position centrale du portail
            const centerX = portal.x * cellSize + cellSize / 2;
            const centerY = portal.y * cellSize + cellSize / 2;
            const radius = cellSize * 0.6 * pulse;

            ctx.save();

            // Cercle extérieur (anneau doré)
            const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius);
            gradient.addColorStop(0, 'rgba(153, 50, 204, 0.1)');  // Violet transparent au centre
            gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.4)'); // Or
            gradient.addColorStop(0.8, 'rgba(255, 165, 0, 0.6)'); // Orange
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');     // Transparent

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Anneau rotatif
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 * lifeRatio})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;

            // Rotation basée sur le temps
            const rotation = now / 500;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.8, rotation, rotation + Math.PI * 1.5);
            ctx.stroke();

            // Second anneau (opposé)
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.6, rotation + Math.PI, rotation + Math.PI * 2.5);
            ctx.stroke();

            // Centre du portail (spirale/vortex)
            ctx.fillStyle = `rgba(75, 0, 130, ${0.5 * pulse})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Emoji portail
            ctx.shadowBlur = 0;
            ctx.font = `${cellSize * 0.7}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = lifeRatio;
            ctx.fillText('🌀', centerX, centerY);

            // Indicateur de disparition imminente (dernières 2 secondes)
            if (remainingTime < 2000) {
                const blink = Math.floor(now / 150) % 2 === 0;
                if (blink) {
                    ctx.strokeStyle = '#FF0000';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            ctx.restore();
        });
    }

    /**
     * Assombrit une couleur hex
     * @param {string} hex - Couleur hexadécimale
     * @param {number} percent - Pourcentage d'assombrissement
     * @returns {string} Couleur assombrie
     */
    darkenColor(hex, percent) {
        if (!hex || !hex.startsWith('#')) return hex || '#ff0000';
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }
}
