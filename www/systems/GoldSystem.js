/**
 * GoldSystem.js - Système de gold (upgrade Fortune)
 * Extrait de solo-game.js pour modularité
 *
 * Responsabilités:
 * - Spawn du gold sur le terrain
 * - Collection du gold
 * - Affichage du gold (rendu et notifications)
 */

import { logger } from '../services/logger.js';

export class GoldSystem {
    constructor(game) {
        this.game = game;

        // Gold sur le terrain
        this.items = [];

        // Gold collecté cette run
        this.collected = 0;

        // Valeur du gold
        this.goldValue = 25;
    }

    /**
     * Reset le système
     */
    reset() {
        this.items = [];
        // Note: collected n'est pas reset pour conserver le gold de la run
    }

    /**
     * Reset complet (nouvelle run)
     */
    resetFull() {
        this.items = [];
        this.collected = 0;
    }

    /**
     * Tente de spawn du gold (appelé après chaque pomme mangée)
     */
    trySpawn() {
        // Uniquement en mode roguelike
        if (!this.game.roguelikeSystem?.isActive) return;

        // Vérifier upgrade Fortune
        const fortuneUpgrade = this.game.roguelikeSystem.modifiers?.passives?.find(p => p.type === 'gold_spawn');
        if (!fortuneUpgrade) return;

        // Nombre de stacks de Fortune
        const fortuneCount = this.game.roguelikeSystem.modifiers.passives.filter(p => p.type === 'gold_spawn').length;

        // Chances : 10%, 15%, 30%
        const chances = fortuneUpgrade.chances || [0.10, 0.15, 0.30];
        const spawnChance = chances[Math.min(fortuneCount - 1, chances.length - 1)];

        if (Math.random() < spawnChance) {
            this.spawn();
        }
    }

    /**
     * Spawn un gold à une position libre
     */
    spawn() {
        const position = this.game.spawnSystem.findFreePosition({
            maxAttempts: 50,
            excludePositions: this.items
        });

        if (position) {
            this.items.push(position);
            logger.log(`[Gold] Gold spawné! (${this.items.length} sur le terrain)`);
        }
    }

    /**
     * Vérifie si le joueur collecte du gold
     * @param {Object} head - Position de la tête {x, y}
     * @returns {boolean} true si gold collecté
     */
    checkCollection(head) {
        const goldIndex = this.items.findIndex(g => g.x === head.x && g.y === head.y);
        if (goldIndex === -1) return false;

        // Collecter
        this.items.splice(goldIndex, 1);
        this.collected += this.goldValue;

        // Effets
        if (this.game.audio) this.game.audio.powerup();
        this.game.createParticles(head.x, head.y, '#FFD700', 10);

        logger.log(`[Gold] 💰 Gold collecté! Total: ${this.collected}`);

        // Notification visuelle
        this.showNotification(this.goldValue);

        return true;
    }

    /**
     * Affiche une notification de gold collecté
     * @param {number} amount - Montant collecté
     */
    showNotification(amount) {
        const notification = document.createElement('div');
        notification.className = 'gold-notification';
        notification.textContent = `+${amount} 💰`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 0 0 10px #FFD700, 0 0 20px #FFA500;
            z-index: 1000;
            pointer-events: none;
            animation: goldFloat 1s ease-out forwards;
        `;

        // Ajouter animation CSS si pas présente
        if (!document.getElementById('gold-notification-style')) {
            const style = document.createElement('style');
            style.id = 'gold-notification-style';
            style.textContent = `
                @keyframes goldFloat {
                    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -100%) scale(1.5); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 1000);
    }

    /**
     * Dessine le gold sur le terrain
     */
    draw() {
        if (this.items.length === 0) return;

        const ctx = this.game.ctx;
        const cellSize = this.game.CELL_SIZE;

        for (const gold of this.items) {
            const x = gold.x * cellSize;
            const y = gold.y * cellSize;

            // Glow doré
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;

            // Emoji 💰
            ctx.font = `${cellSize * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💰', x + cellSize / 2, y + cellSize / 2);

            ctx.shadowBlur = 0;
        }
    }

    // ============================================
    // GETTERS
    // ============================================

    get totalCollected() {
        return this.collected;
    }

    get itemCount() {
        return this.items.length;
    }
}
