/**
 * BossRenderer.js - Rendu visuel des boss (OPTIMISÉ)
 *
 * Optimisations appliquées:
 * - Cache des emojis pré-rendus (évite fillText coûteux)
 * - Table de sinus pré-calculée (évite Math.sin)
 * - shadowBlur désactivé sur mobile (mode performance)
 * - Réduction des ctx.save/restore
 * - Batch rendering pour éléments similaires
 */

// Couleurs des skins pour chaque boss
const BOSS_SKIN_COLORS = {
    TITAN: {
        head: { light: '#CD853F', dark: '#8B4513' },
        body: { from: '#CD853F', to: '#5C3317' },
        tail: { color: '#3D2314' },
        outline: '#2D1810',
        glow: '#8B4513'
    },
    CRYO: {
        head: { light: '#B0E0FF', dark: '#4DB8FF' },
        body: { from: '#B0E0FF', to: '#1E90FF' },
        tail: { color: '#1E90FF' },
        outline: '#003D66',
        glow: '#00FFFF'
    },
    SPECTRE: {
        head: { light: '#F0F0F0', dark: '#C0C0C0' },
        body: { from: '#E0E0E0', to: '#808080' },
        tail: { color: '#606060' },
        outline: '#404040',
        glow: '#FFFFFF'
    },
    FOUDRE: {
        head: { light: '#FFFF00', dark: '#FFD700' },
        body: { from: '#FFFF00', to: '#FF8C00' },
        tail: { color: '#FF8C00' },
        outline: '#664400',
        glow: '#FFFF00'
    }
};

// PERF: Table de sinus pré-calculée (360 valeurs)
const SIN_TABLE_SIZE = 360;
const SIN_TABLE = new Float32Array(SIN_TABLE_SIZE);
for (let i = 0; i < SIN_TABLE_SIZE; i++) {
    SIN_TABLE[i] = Math.sin((i / SIN_TABLE_SIZE) * Math.PI * 2);
}

// PERF: Fonction sinus rapide via table
function fastSin(radians) {
    const normalized = ((radians % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor((normalized / (Math.PI * 2)) * SIN_TABLE_SIZE) % SIN_TABLE_SIZE;
    return SIN_TABLE[index];
}

export class BossRenderer {
    constructor(ctx, cellSize, gridSize) {
        this.ctx = ctx;
        this.cellSize = cellSize;
        this.gridSize = gridSize;
        this._frameTime = 0;
        this.performanceMode = this._detectMobile();
        this._emojiCache = new Map();
        this._initEmojiCache();
        this._colorCache = new Map();
    }

    _detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    }

    _initEmojiCache() {
        const emojis = ['⚔️', '❄️', '💀', '🌀'];
        const sizes = [this.cellSize * 0.5, this.cellSize * 0.7, this.cellSize * 0.8];
        emojis.forEach(emoji => {
            sizes.forEach(size => {
                const key = emoji + '_' + Math.round(size);
                const canvas = document.createElement('canvas');
                const padding = this.performanceMode ? 4 : 16;
                canvas.width = size + padding * 2;
                canvas.height = size + padding * 2;
                const ctx = canvas.getContext('2d');
                ctx.font = size + 'px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (!this.performanceMode) {
                    ctx.shadowColor = this._getEmojiGlowColor(emoji);
                    ctx.shadowBlur = 6;
                }
                ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
                this._emojiCache.set(key, { canvas, offsetX: canvas.width / 2, offsetY: canvas.height / 2 });
            });
        });
    }

    _getEmojiGlowColor(emoji) {
        const colors = { '⚔️': '#ffd700', '❄️': '#00BFFF', '💀': '#9932CC', '🌀': '#FFD700' };
        return colors[emoji] || '#ffffff';
    }

    _drawCachedEmoji(emoji, x, y, size) {
        const key = emoji + '_' + Math.round(size);
        const cached = this._emojiCache.get(key);
        if (cached) {
            this.ctx.drawImage(cached.canvas, x - cached.offsetX, y - cached.offsetY);
        } else {
            this.ctx.font = size + 'px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(emoji, x, y);
        }
    }

    setFrameTime(timestamp) {
        this._frameTime = timestamp || Date.now();
    }

    drawBoss(boss) {
        if (!boss || boss.snake.length === 0) return;
        if (boss.isInvisible) { this.drawInvisibleBossHint(boss); return; }

        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const now = this._frameTime;
        const skinColors = BOSS_SKIN_COLORS[boss.name] || BOSS_SKIN_COLORS.TITAN;
        const isInvincible = boss.invincible;
        const pulse = 1 + fastSin(now / 300) * 0.05;
        const halfCell = cellSize / 2;
        const snakeLen = boss.snake.length;

        ctx.save();

        for (let index = snakeLen - 1; index > 0; index--) {
            const segment = boss.snake[index];
            const x = segment.x * cellSize + halfCell;
            const y = segment.y * cellSize + halfCell;
            const segmentScale = 0.85 + (0.15 * (1 - index / snakeLen));
            const size = (cellSize - 2) * segmentScale * pulse;
            const ratio = index / snakeLen;

            let mainColor;
            if (isInvincible) mainColor = 'rgba(200, 200, 200, ' + (1 - ratio * 0.4) + ')';
            else if (boss.hasSword) mainColor = this.darkenColor('#ff3300', index * 3);
            else mainColor = this._getCachedBodyColor(skinColors, ratio);

            ctx.fillStyle = mainColor;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();

            if (index % 3 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.beginPath();
                ctx.arc(x, y, size / 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const head = boss.snake[0];
        const headX = head.x * cellSize;
        const headY = head.y * cellSize;
        const headSize = (cellSize - 2) * pulse;
        const headColor = isInvincible ? '#ffffff' : (boss.hasSword ? '#ff3300' : skinColors.head.light);

        if (!this.performanceMode && !isInvincible) {
            ctx.shadowColor = boss.hasSword ? '#ff6600' : skinColors.glow;
            ctx.shadowBlur = boss.hasSword ? 12 : 8;
        }

        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.ellipse(headX + halfCell, headY + halfCell, headSize / 2 * 1.1, headSize / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        this.drawBossHead(ctx, headX, headY, cellSize, headColor, boss, skinColors);
        ctx.restore();
    }

    _getCachedBodyColor(skinColors, ratio) {
        const key = skinColors.body.from + '_' + skinColors.body.to + '_' + Math.round(ratio * 20);
        if (!this._colorCache.has(key)) {
            this._colorCache.set(key, this.interpolateColor(skinColors.body.from, skinColors.body.to, ratio));
        }
        return this._colorCache.get(key);
    }

    drawBossHead(ctx, x, y, cellSize, mainColor, boss, skinColors) {
        const eyeSize = cellSize / 4.5;
        if (!this.performanceMode) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 3; }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + cellSize * 0.32, y + cellSize * 0.4, eyeSize, eyeSize * 0.7, -0.2, 0, Math.PI * 2);
        ctx.ellipse(x + cellSize * 0.68, y + cellSize * 0.4, eyeSize, eyeSize * 0.7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = boss.hasSword ? '#ff0000' : '#220000';
        const pw = eyeSize * 0.3, ph = eyeSize * 0.8;
        ctx.beginPath();
        ctx.ellipse(x + cellSize * 0.32, y + cellSize * 0.4, pw, ph, 0, 0, Math.PI * 2);
        ctx.ellipse(x + cellSize * 0.68, y + cellSize * 0.4, pw, ph, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x + cellSize * 0.28, y + cellSize * 0.35, eyeSize * 0.2, 0, Math.PI * 2);
        ctx.arc(x + cellSize * 0.64, y + cellSize * 0.35, eyeSize * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = skinColors ? skinColors.outline : this.darkenColor(mainColor, 20);
        ctx.beginPath();
        ctx.moveTo(x + cellSize * 0.2, y + cellSize * 0.15);
        ctx.lineTo(x + cellSize * 0.35, y + cellSize * 0.3);
        ctx.lineTo(x + cellSize * 0.15, y + cellSize * 0.35);
        ctx.closePath();
        ctx.moveTo(x + cellSize * 0.8, y + cellSize * 0.15);
        ctx.lineTo(x + cellSize * 0.65, y + cellSize * 0.3);
        ctx.lineTo(x + cellSize * 0.85, y + cellSize * 0.35);
        ctx.closePath();
        ctx.fill();

        if (boss.hasSword) this._drawCachedEmoji('⚔️', x + cellSize / 2, y - 4, this.cellSize * 0.7);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize * 0.65, cellSize * 0.2, 0.1 * Math.PI, 0.9 * Math.PI, false);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x + cellSize * 0.38, y + cellSize * 0.62);
        ctx.lineTo(x + cellSize * 0.42, y + cellSize * 0.75);
        ctx.lineTo(x + cellSize * 0.46, y + cellSize * 0.62);
        ctx.moveTo(x + cellSize * 0.54, y + cellSize * 0.62);
        ctx.lineTo(x + cellSize * 0.58, y + cellSize * 0.75);
        ctx.lineTo(x + cellSize * 0.62, y + cellSize * 0.62);
        ctx.fill();
    }

    drawSword(sword) {
        if (!sword) return;
        const x = sword.x * this.cellSize + this.cellSize / 2;
        const y = sword.y * this.cellSize + this.cellSize / 2;
        const float = fastSin(this._frameTime / 200) * 3;
        this.ctx.save();
        this.ctx.translate(x, y + float);
        this._drawCachedEmoji('⚔️', 0, 0, this.cellSize * 0.8);
        this.ctx.restore();
    }

    drawInvisibleBossHint(boss) {
        if (!boss || boss.snake.length === 0) return;
        const ctx = this.ctx, cellSize = this.cellSize, head = boss.snake[0];
        const pulse = 0.2 + fastSin(this._frameTime / 300) * 0.1;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#9932CC';
        ctx.beginPath();
        ctx.arc(head.x * cellSize + cellSize / 2, head.y * cellSize + cellSize / 2, cellSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawIceZones(iceZones) {
        if (!iceZones || iceZones.length === 0) return;
        const ctx = this.ctx, cellSize = this.cellSize, now = this._frameTime;
        ctx.save();
        for (let i = 0; i < iceZones.length; i++) {
            const zone = iceZones[i];
            const x = zone.x * cellSize + cellSize / 2;
            const y = zone.y * cellSize + cellSize / 2;
            const radius = zone.radius * cellSize;
            const elapsed = now - zone.createdAt;
            const remaining = zone.duration - elapsed;
            const opacity = Math.max(0.3, remaining / zone.duration);
            const pulse = 1 + fastSin(now / 400) * 0.1;
            const finalRadius = radius * pulse;

            ctx.globalAlpha = opacity * 0.6;
            if (this.performanceMode) {
                ctx.fillStyle = 'rgba(0, 191, 255, 0.4)';
            } else {
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, finalRadius);
                gradient.addColorStop(0, 'rgba(135, 206, 250, 0.8)');
                gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.5)');
                gradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
                ctx.fillStyle = gradient;
            }
            ctx.beginPath();
            ctx.arc(x, y, finalRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#00BFFF';
            ctx.lineWidth = 2;
            ctx.globalAlpha = opacity * 0.8;
            ctx.stroke();
            ctx.globalAlpha = opacity * 0.7;
            this._drawCachedEmoji('❄️', x, y, cellSize * 0.5);
        }
        ctx.restore();
    }

    drawSkulls(skulls) {
        if (!skulls || skulls.length === 0) return;
        const ctx = this.ctx, cellSize = this.cellSize, now = this._frameTime;
        ctx.save();
        for (let i = 0; i < skulls.length; i++) {
            const skull = skulls[i];
            const x = skull.x * cellSize + cellSize / 2;
            const y = skull.y * cellSize + cellSize / 2;
            const elapsed = now - skull.createdAt;
            const remaining = skull.duration - elapsed;
            const opacity = Math.max(0.4, remaining / skull.duration);
            const float = fastSin(now / 300 + skull.x) * 3;
            ctx.globalAlpha = opacity;
            this._drawCachedEmoji('💀', x, y + float, cellSize * 0.8);
        }
        ctx.restore();
    }

    drawTeleportPortals(teleportPortals) {
        if (!teleportPortals || teleportPortals.length === 0) return;
        const ctx = this.ctx, cellSize = this.cellSize, now = this._frameTime;
        ctx.save();
        for (let i = 0; i < teleportPortals.length; i++) {
            const portal = teleportPortals[i];
            const age = now - portal.createdAt;
            const remainingTime = portal.duration - age;
            const lifeRatio = remainingTime / portal.duration;
            const pulse = fastSin(now / 200 + portal.pulsePhase) * 0.3 + 0.7;
            const centerX = portal.x * cellSize + cellSize / 2;
            const centerY = portal.y * cellSize + cellSize / 2;
            const radius = cellSize * 0.6 * pulse;

            if (this.performanceMode) {
                ctx.globalAlpha = lifeRatio * 0.5;
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius);
                gradient.addColorStop(0, 'rgba(153, 50, 204, 0.1)');
                gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.4)');
                gradient.addColorStop(0.8, 'rgba(255, 165, 0, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 215, 0, ' + (0.6 * lifeRatio) + ')';
                ctx.lineWidth = 3;
                const rotation = now / 500;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * 0.8, rotation, rotation + Math.PI * 1.5);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * 0.6, rotation + Math.PI, rotation + Math.PI * 2.5);
                ctx.stroke();
                ctx.fillStyle = 'rgba(75, 0, 130, ' + (0.5 * pulse) + ')';
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = lifeRatio;
            this._drawCachedEmoji('🌀', centerX, centerY, cellSize * 0.7);

            if (remainingTime < 2000 && Math.floor(now / 150) % 2 === 0) {
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    setPerformanceMode(enabled) {
        this.performanceMode = enabled;
        this._emojiCache.clear();
        this._initEmojiCache();
    }

    darkenColor(hex, percent) {
        if (!hex || !hex.startsWith('#')) return hex || '#ff0000';
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1);
    }

    interpolateColor(color1, color2, ratio) {
        const c1 = this.hexToRgb(color1), c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
        const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
        const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
        return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }

    hexToRgb(hex) {
        if (!hex || !hex.startsWith('#')) return { r: 255, g: 0, b: 0 };
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 255, g: 0, b: 0 };
    }
}
