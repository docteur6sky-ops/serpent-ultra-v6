/**
 * SpawnSystem.js - Génération des éléments du jeu
 * Extrait de solo-game.js pour modularité
 *
 * Responsabilités:
 * - Spawn nourriture (pommes)
 * - Spawn crânes (bad)
 * - Spawn power-ups
 * - Spawn obstacles
 * - Logique de collision lors du spawn (éviter superposition)
 */

import { logger } from '../services/logger.js';

export class SpawnSystem {
    constructor(game) {
        this.game = game;
    }

    /**
     * Vérifie si une position est libre
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {Array} excludePositions - Positions à exclure (optionnel)
     * @returns {boolean} true si la position est libre
     */
    isPositionFree(x, y, excludePositions = []) {
        // Vérifier collision avec le serpent
        if (this.game.snake.some(s => s.x === x && s.y === y)) {
            return false;
        }

        // Vérifier collision avec les obstacles
        if (this.game.obstacles.some(o => o.x === x && o.y === y)) {
            return false;
        }

        // Vérifier collision avec la nourriture
        if (this.game.food && x === this.game.food.x && y === this.game.food.y) {
            return false;
        }

        // Vérifier collision avec le crâne
        if (this.game.bad && x === this.game.bad.x && y === this.game.bad.y) {
            return false;
        }

        // Vérifier collision avec la mystery box
        const mysteryBox = this.game.powerUpSystem?.mysteryBox;
        if (mysteryBox && x === mysteryBox.x && y === mysteryBox.y) {
            return false;
        }

        // Vérifier collision avec le boss
        if (this.game.bossSystem?.boss?.snake.some(s => s.x === x && s.y === y)) {
            return false;
        }

        // Vérifier positions exclues additionnelles
        if (excludePositions.some(p => p.x === x && p.y === y)) {
            return false;
        }

        return true;
    }

    /**
     * Trouve une position libre aléatoire
     * @param {Object} options - Options de spawn
     * @returns {Object|null} Position {x, y} ou null si impossible
     */
    findFreePosition(options = {}) {
        const {
            margin = 0,           // Marge depuis les bords
            maxAttempts = 200,    // Nombre max de tentatives
            excludePositions = [], // Positions à exclure
            safeZone = null       // Zone de sécurité {x, y, radius}
        } = options;

        const gridSize = this.game.GRID_SIZE;
        let attempts = 0;

        // Phase 1: Tentatives aléatoires
        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * (gridSize - 2 * margin)) + margin;
            const y = Math.floor(Math.random() * (gridSize - 2 * margin)) + margin;

            // Vérifier zone de sécurité
            if (safeZone) {
                const inSafeZone = Math.abs(x - safeZone.x) <= safeZone.radius &&
                                   Math.abs(y - safeZone.y) <= safeZone.radius;
                if (inSafeZone) {
                    attempts++;
                    continue;
                }
            }

            if (this.isPositionFree(x, y, excludePositions)) {
                return { x, y };
            }
            attempts++;
        }

        // Phase 2: Recherche exhaustive
        for (let y = margin; y < gridSize - margin; y++) {
            for (let x = margin; x < gridSize - margin; x++) {
                // Vérifier zone de sécurité
                if (safeZone) {
                    const inSafeZone = Math.abs(x - safeZone.x) <= safeZone.radius &&
                                       Math.abs(y - safeZone.y) <= safeZone.radius;
                    if (inSafeZone) continue;
                }

                if (this.isPositionFree(x, y, excludePositions)) {
                    return { x, y };
                }
            }
        }

        logger.warn('[SpawnSystem] Impossible de trouver une position libre');
        return null;
    }

    /**
     * Spawn la nourriture (pomme)
     */
    spawnFood() {
        const position = this.findFreePosition();
        if (position) {
            this.game.food = position;
        }
    }

    /**
     * Spawn le crâne (bad)
     */
    spawnBad() {
        const position = this.findFreePosition();
        if (position) {
            this.game.bad = position;
        }
    }

    /**
     * Spawn une Mystery Box avec une certaine probabilité
     * Le type est déterminé lors du ramassage, pas du spawn
     */
    spawnPowerup() {
        // Probabilité selon difficulté
        let powerupChance = this.game.difficulty === 0 ? 0.08 :
                           this.game.difficulty === 1 ? 0.15 : 0.25;

        // Upgrade Dualité (roguelike) : 50% chance de doubler la probabilité
        if (this.game.isRoguelikeMode && this.game.roguelikeModifiers?.passives) {
            const doubleSpawn = this.game.roguelikeModifiers.passives.find(p => p.type === 'double_spawn');
            if (doubleSpawn && Math.random() < doubleSpawn.chance) {
                powerupChance *= 2;
            }
        }

        // Déléguer au système de mystery box
        this.game.powerUpSystem.spawnMysteryBox(
            (options) => this.findFreePosition(options),
            powerupChance
        );
    }

    /**
     * Spawn des obstacles selon la difficulté et le niveau
     */
    spawnObstacles() {
        let obsCount = 0;

        if (this.game.difficulty === 0) {
            obsCount = this.game.level > 8 ? Math.floor((this.game.level - 8) / 3) : 0;
        } else if (this.game.difficulty === 1) {
            obsCount = this.game.level > 3 ? Math.floor((this.game.level - 3) / 2) : 0;
        } else {
            obsCount = Math.max(0, this.game.level - 1);
        }

        for (let i = 0; i < obsCount; i++) {
            const position = this.findFreePosition();
            if (position) {
                this.game.obstacles.push(position);
            }
        }
    }

    /**
     * Génère les murs de bordure (roguelike)
     * Crée des trous à gauche et droite au niveau du spawn pour éviter game over immédiat
     */
    generateBorderWalls() {
        const gridSize = this.game.GRID_SIZE;
        const spawnY = 15; // Y du spawn du serpent (centre)
        const holeSize = 3; // Taille du trou (3 blocs de haut)

        // Haut et bas
        for (let x = 0; x < gridSize; x++) {
            this.game.obstacles.push({ x: x, y: 0, isBorder: true });
            this.game.obstacles.push({ x: x, y: gridSize - 1, isBorder: true });
        }

        // Gauche et droite (avec trous au niveau du spawn)
        for (let y = 1; y < gridSize - 1; y++) {
            // Vérifier si on est dans la zone du trou (spawnY ± holeSize/2)
            const isInHoleZone = y >= spawnY - Math.floor(holeSize / 2) &&
                                  y <= spawnY + Math.floor(holeSize / 2);

            // Mur gauche (avec trou)
            if (!isInHoleZone) {
                this.game.obstacles.push({ x: 0, y: y, isBorder: true });
            }

            // Mur droit (avec trou)
            if (!isInHoleZone) {
                this.game.obstacles.push({ x: gridSize - 1, y: y, isBorder: true });
            }
        }

        logger.log(`[SpawnSystem] Murs de bordure générés avec trous: ${this.game.obstacles.length} blocs (trou Y=${spawnY}±${Math.floor(holeSize/2)})`);
    }

    /**
     * Génère les obstacles pour un niveau roguelike
     * @param {Object} levelData - Données du niveau
     * @param {boolean} hasTeleport - Le joueur a-t-il l'upgrade téléportation?
     */
    generateRoguelikeObstacles(levelData, hasTeleport = false) {
        this.game.obstacles = [];

        // Murs de bordure (sauf si upgrade Téléportation)
        if (!hasTeleport) {
            this.generateBorderWalls();
        }

        if (!levelData?.obstacles) return;

        // Zone de sécurité autour du serpent
        const head = this.game.snake[0];
        const safeZone = {
            x: head.x,
            y: head.y,
            radius: 5
        };

        // Vérifier si le skin Scanner est actif (danger_preview)
        const run = window.roguelikeManager?.currentRun;
        const dangerPreview = run?.dangerPreview || false;
        const previewDuration = dangerPreview ? 1500 : 0; // 1.5s de clignotement

        for (const obs of levelData.obstacles) {
            if (obs.type === 'wall_static') {
                for (let i = 0; i < obs.count; i++) {
                    const position = this.findFreePosition({
                        margin: 2,
                        maxAttempts: 50,
                        safeZone: safeZone
                    });
                    if (position) {
                        // Ajouter le temps de preview si skin Scanner actif
                        if (dangerPreview) {
                            position.previewUntil = Date.now() + previewDuration;
                        }
                        this.game.obstacles.push(position);
                    }
                }
            }
            // TODO: Ajouter skull, wall_moving, etc.
        }

        logger.log(`[SpawnSystem] ${this.game.obstacles.length} obstacles générés pour le niveau`);
    }
}
