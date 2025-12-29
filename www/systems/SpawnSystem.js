/**
 * SpawnSystem.js - Génération des éléments du jeu
 * OPTIMISÉ avec cache O(1) pour les vérifications de position
 */

import { logger } from '../services/logger.js';

export class SpawnSystem {
    constructor(game) {
        this.game = game;
        this._occupiedCache = null;
    }

    _posKey(x, y) {
        return (x << 16) | y;
    }

    buildOccupiedCache(excludePositions = []) {
        const cache = new Set();
        for (const s of this.game.snake) cache.add(this._posKey(s.x, s.y));
        for (const o of this.game.obstacles) cache.add(this._posKey(o.x, o.y));
        if (this.game.bossSystem?.boss?.snake) {
            for (const s of this.game.bossSystem.boss.snake) cache.add(this._posKey(s.x, s.y));
        }
        if (this.game.food) cache.add(this._posKey(this.game.food.x, this.game.food.y));
        if (this.game.bad) cache.add(this._posKey(this.game.bad.x, this.game.bad.y));
        if (this.game.scissors) cache.add(this._posKey(this.game.scissors.x, this.game.scissors.y));
        if (this.game.comboMaster) cache.add(this._posKey(this.game.comboMaster.x, this.game.comboMaster.y));
        const mysteryBox = this.game.powerUpSystem?.mysteryBox;
        if (mysteryBox) cache.add(this._posKey(mysteryBox.x, mysteryBox.y));
        for (const p of excludePositions) cache.add(this._posKey(p.x, p.y));
        this._occupiedCache = cache;
        return cache;
    }

    invalidateCache() { this._occupiedCache = null; }

    isPositionFree(x, y, excludePositions = []) {
        if (this.game.snake.some(s => s.x === x && s.y === y)) return false;
        if (this.game.obstacles.some(o => o.x === x && o.y === y)) return false;
        if (this.game.food && x === this.game.food.x && y === this.game.food.y) return false;
        if (this.game.bad && x === this.game.bad.x && y === this.game.bad.y) return false;
        const mysteryBox = this.game.powerUpSystem?.mysteryBox;
        if (mysteryBox && x === mysteryBox.x && y === mysteryBox.y) return false;
        if (this.game.scissors && x === this.game.scissors.x && y === this.game.scissors.y) return false;
        if (this.game.comboMaster && x === this.game.comboMaster.x && y === this.game.comboMaster.y) return false;
        if (this.game.bossSystem?.boss?.snake.some(s => s.x === x && s.y === y)) return false;
        if (excludePositions.some(p => p.x === x && p.y === y)) return false;
        return true;
    }

    findFreePosition(options = {}) {
        const { margin = 0, maxAttempts = 200, excludePositions = [], safeZone = null } = options;
        const gridSize = this.game.GRID_SIZE;
        const cache = this.buildOccupiedCache(excludePositions);
        let attempts = 0;

        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * (gridSize - 2 * margin)) + margin;
            const y = Math.floor(Math.random() * (gridSize - 2 * margin)) + margin;
            if (safeZone && Math.abs(x - safeZone.x) <= safeZone.radius && Math.abs(y - safeZone.y) <= safeZone.radius) {
                attempts++; continue;
            }
            if (!cache.has(this._posKey(x, y))) { this.invalidateCache(); return { x, y }; }
            attempts++;
        }

        for (let y = margin; y < gridSize - margin; y++) {
            for (let x = margin; x < gridSize - margin; x++) {
                if (safeZone && Math.abs(x - safeZone.x) <= safeZone.radius && Math.abs(y - safeZone.y) <= safeZone.radius) continue;
                if (!cache.has(this._posKey(x, y))) { this.invalidateCache(); return { x, y }; }
            }
        }
        logger.warn('[SpawnSystem] Impossible de trouver une position libre');
        this.invalidateCache();
        return null;
    }

    spawnFood() {
        if (this.game.roguelikeSystem?.scissorsPending && !this.game.scissors) {
            const pos = this.findFreePosition();
            if (pos) { this.game.scissors = pos; this.game.food = null; logger.log('[SpawnSystem] Ciseaux spawnes'); }
            return;
        }
        if (this.game.roguelikeSystem?.comboMasterPending && !this.game.comboMaster) {
            const pos = this.findFreePosition();
            if (pos) { this.game.comboMaster = pos; this.game.food = null; logger.log('[SpawnSystem] Combo Master spawne'); }
            return;
        }
        if (!this.game.scissors && !this.game.comboMaster) {
            const pos = this.findFreePosition();
            if (pos) this.game.food = pos;
        }
    }

    spawnBad() {
        const pos = this.findFreePosition();
        if (pos) this.game.bad = pos;
    }

    spawnPowerup() {
        let chance = this.game.difficulty === 0 ? 0.08 : this.game.difficulty === 1 ? 0.15 : 0.25;
        if (this.game.isRoguelikeMode && this.game.roguelikeModifiers?.passives) {
            const ds = this.game.roguelikeModifiers.passives.find(p => p.type === 'double_spawn');
            if (ds && Math.random() < ds.chance) chance *= 2;
        }
        this.game.powerUpSystem.spawnMysteryBox((opts) => this.findFreePosition(opts), chance);
    }

    spawnObstacles() {
        let count = 0;
        if (this.game.difficulty === 0) count = this.game.level > 8 ? Math.floor((this.game.level - 8) / 3) : 0;
        else if (this.game.difficulty === 1) count = this.game.level > 3 ? Math.floor((this.game.level - 3) / 2) : 0;
        else count = Math.max(0, this.game.level - 1);
        for (let i = 0; i < count; i++) {
            const pos = this.findFreePosition();
            if (pos) this.game.obstacles.push(pos);
        }
    }

    generateBorderWalls() {
        const gs = this.game.GRID_SIZE, spawnY = 15, holeSize = 3;
        for (let x = 0; x < gs; x++) {
            this.game.obstacles.push({ x, y: 0, isBorder: true });
            this.game.obstacles.push({ x, y: gs - 1, isBorder: true });
        }
        for (let y = 1; y < gs - 1; y++) {
            const inHole = y >= spawnY - Math.floor(holeSize/2) && y <= spawnY + Math.floor(holeSize/2);
            if (!inHole) {
                this.game.obstacles.push({ x: 0, y, isBorder: true });
                this.game.obstacles.push({ x: gs - 1, y, isBorder: true });
            }
        }
        logger.log('[SpawnSystem] Murs de bordure generes: ' + this.game.obstacles.length);
    }

    generateRoguelikeObstacles(levelData, hasTeleport = false) {
        this.game.obstacles = [];
        if (!hasTeleport) this.generateBorderWalls();
        if (!levelData?.obstacles) return;
        const head = this.game.snake[0];
        const safeZone = { x: head.x, y: head.y, radius: 5 };
        const run = window.roguelikeManager?.currentRun;
        const preview = run?.dangerPreview ? 1500 : 0;
        for (const obs of levelData.obstacles) {
            if (obs.type === 'wall_static') {
                for (let i = 0; i < obs.count; i++) {
                    const pos = this.findFreePosition({ margin: 2, maxAttempts: 50, safeZone });
                    if (pos) {
                        if (preview) pos.previewUntil = Date.now() + preview;
                        this.game.obstacles.push(pos);
                    }
                }
            }
        }
        logger.log('[SpawnSystem] ' + this.game.obstacles.length + ' obstacles generes');
    }
}
