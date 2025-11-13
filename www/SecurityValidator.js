const Logger = require('./Logger.js');

class SecurityValidator {
    constructor() {
        this.logger = new Logger(true);

        // Configuration de sécurité
        this.config = {
            MAX_INPUTS_PER_SECOND: 15,      // Max inputs humainement possible
            MIN_INPUT_INTERVAL: 50,         // Min 50ms entre 2 inputs
            MAX_SCORE_PER_SECOND: 500,      // Score max théorique par seconde
            MAX_POSITION_JUMP: 2,           // Max cases de déplacement par tick
            KICK_THRESHOLD: 3,              // 3 violations = kick
            BAN_DURATION: 300000            // 5 minutes de ban
        };

        // Tracking par joueur
        this.playerStats = new Map();
        this.bannedIPs = new Map();
    }

    /**
     * Initialiser le tracking pour un joueur
     */
    initPlayer(playerId, ip = null) {
        this.playerStats.set(playerId, {
            ip: ip,
            inputCount: 0,
            lastInputTime: 0,
            lastDirection: null,        // ✅ Tracker dernière direction pour ignorer répétitions
            inputTimes: [],
            lastPosition: null,
            scoreHistory: [],
            violations: [],
            violationCount: 0,
            joinTime: Date.now()
        });

        this.logger.info('SECURITY', `Tracking initialisé pour ${playerId}`);
    }

    /**
     * Vérifier si une IP est bannie
     */
    isIPBanned(ip) {
        if (!ip) return false;

        const banInfo = this.bannedIPs.get(ip);
        if (!banInfo) return false;

        // Vérifier si le ban a expiré
        if (Date.now() - banInfo.timestamp > this.config.BAN_DURATION) {
            this.bannedIPs.delete(ip);
            this.logger.info('SECURITY', `Ban expiré pour IP ${ip}`);
            return false;
        }

        return true;
    }

    /**
     * Bannir une IP
     */
    banIP(ip, reason) {
        this.bannedIPs.set(ip, {
            reason: reason,
            timestamp: Date.now()
        });

        this.logger.warn('SECURITY', `IP bannie: ${ip}`, { reason });
    }

    /**
     * Valider un input (direction)
     */
    validateInput(playerId, direction) {
        const stats = this.playerStats.get(playerId);
        if (!stats) {
            this.logger.warn('SECURITY', `Stats introuvables pour ${playerId}`);
            return { valid: false, reason: 'No stats' };
        }

        const now = Date.now();

        // 1. Valider la direction
        const validDirections = ['up', 'down', 'left', 'right'];
        if (!validDirections.includes(direction)) {
            this.addViolation(playerId, 'INVALID_DIRECTION', { direction });
            return { valid: false, reason: 'Invalid direction' };
        }

        // ✅ Si même direction, ne pas compter (permet de maintenir touche)
        if (stats.lastDirection === direction) {
            // Même direction répétée = gameplay normal
            // Ne pas compter dans les stats de spam
            return { valid: true };
        }

        // Direction DIFFÉRENTE = changement, on compte

        // 2. Vérifier timing (anti-spam)
        if (stats.lastInputTime) {
            const interval = now - stats.lastInputTime;

            if (interval < this.config.MIN_INPUT_INTERVAL) {
                this.addViolation(playerId, 'INPUT_TOO_FAST', { interval });
                return { valid: false, reason: 'Direction change too fast' };
            }
        }

        // 3. Vérifier rate (changements de direction par seconde)
        stats.inputTimes.push(now);

        // Garder seulement la dernière seconde
        stats.inputTimes = stats.inputTimes.filter(t => now - t < 1000);

        if (stats.inputTimes.length > this.config.MAX_INPUTS_PER_SECOND) {
            this.addViolation(playerId, 'INPUT_SPAM', {
                rate: stats.inputTimes.length
            });
            return { valid: false, reason: 'Too many direction changes' };
        }

        // 4. Mettre à jour les stats
        stats.lastInputTime = now;
        stats.lastDirection = direction;  // ✅ Sauvegarder la nouvelle direction
        stats.inputCount++;

        return { valid: true };
    }

    /**
     * Valider un score
     */
    validateScore(playerId, currentScore, gameStartTime) {
        const stats = this.playerStats.get(playerId);
        if (!stats) return { valid: true }; // Pas de stats = on laisse passer

        const gameDuration = (Date.now() - gameStartTime) / 1000; // en secondes

        // Score maximum théorique
        const maxPossibleScore = gameDuration * this.config.MAX_SCORE_PER_SECOND;

        if (currentScore > maxPossibleScore) {
            this.addViolation(playerId, 'IMPOSSIBLE_SCORE', {
                score: currentScore,
                maxPossible: Math.round(maxPossibleScore),
                gameDuration: Math.round(gameDuration)
            });

            return {
                valid: false,
                reason: 'Score impossible',
                shouldKick: true
            };
        }

        // Enregistrer l'historique
        stats.scoreHistory.push({
            score: currentScore,
            timestamp: Date.now()
        });

        return { valid: true };
    }

    /**
     * Valider une position (détection de téléportation)
     */
    validatePosition(playerId, newPosition, gridSize) {
        const stats = this.playerStats.get(playerId);
        if (!stats) return { valid: true };

        // Si c'est la première position, l'enregistrer
        if (!stats.lastPosition) {
            stats.lastPosition = newPosition;
            return { valid: true };
        }

        // Calculer le déplacement
        const dx = Math.abs(newPosition.x - stats.lastPosition.x);
        const dy = Math.abs(newPosition.y - stats.lastPosition.y);
        const totalMove = dx + dy;

        // Un serpent ne peut bouger que d'1 case par tick (ou 0 si pas bougé)
        if (totalMove > this.config.MAX_POSITION_JUMP) {
            this.addViolation(playerId, 'POSITION_JUMP', {
                from: stats.lastPosition,
                to: newPosition,
                distance: totalMove
            });

            return {
                valid: false,
                reason: 'Teleportation detected'
            };
        }

        // Mettre à jour la position
        stats.lastPosition = newPosition;

        return { valid: true };
    }

    /**
     * Ajouter une violation
     */
    addViolation(playerId, type, data = {}) {
        const stats = this.playerStats.get(playerId);
        if (!stats) return;

        const violation = {
            type: type,
            timestamp: Date.now(),
            data: data
        };

        stats.violations.push(violation);
        stats.violationCount++;

        this.logger.warn('SECURITY', `Violation détectée`, {
            playerId,
            type,
            violationCount: stats.violationCount,
            data
        });

        // Si seuil atteint, marquer pour kick
        if (stats.violationCount >= this.config.KICK_THRESHOLD) {
            this.logger.error('SECURITY', `Seuil de violations atteint`, {
                playerId,
                violations: stats.violations
            });

            // Bannir l'IP si disponible
            if (stats.ip) {
                this.banIP(stats.ip, `Multiple violations: ${type}`);
            }

            return { shouldKick: true, reason: 'Multiple violations' };
        }

        return { shouldKick: false };
    }

    /**
     * Obtenir les stats d'un joueur
     */
    getPlayerStats(playerId) {
        return this.playerStats.get(playerId);
    }

    /**
     * Nettoyer les stats d'un joueur
     */
    cleanupPlayer(playerId) {
        this.playerStats.delete(playerId);
        this.logger.info('SECURITY', `Stats nettoyées pour ${playerId}`);
    }

    /**
     * Obtenir un résumé de sécurité
     */
    getSecuritySummary() {
        const summary = {
            totalPlayers: this.playerStats.size,
            bannedIPs: this.bannedIPs.size,
            playersWithViolations: 0,
            totalViolations: 0
        };

        for (let stats of this.playerStats.values()) {
            if (stats.violationCount > 0) {
                summary.playersWithViolations++;
                summary.totalViolations += stats.violationCount;
            }
        }

        return summary;
    }
}

module.exports = SecurityValidator;
