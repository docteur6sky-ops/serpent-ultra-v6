/**
 * MultiplayerUIManager - Gestion de l'UI du mode multiplayer local
 * Centralise le scoreboard, les barres de vie, le timer épée, et les overlays
 */

import { logger } from '../services/logger.js';

/**
 * Emojis des power-ups
 */
const POWERUP_EMOJIS = {
    ice: '❄️',
    fire: '🔥',
    rock: '🪨',
    ghost: '👻',
    lightning: '⚡'
};

/**
 * Classe de gestion de l'UI multiplayer
 */
class MultiplayerUIManagerClass {
    constructor() {
        this.swordTimerRAF = null;
    }

    // ═══════════════════════════════════════════════════════════
    // TIMER DE PARTIE
    // ═══════════════════════════════════════════════════════════

    /**
     * Met à jour l'affichage du timer de partie
     * @param {number} timeRemaining - Temps restant en millisecondes
     */
    updateTimer(timeRemaining) {
        const timerElement = document.getElementById('multi-timer');
        if (!timerElement) return;

        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);

        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Temps critique (< 60s) - Rouge
        if (timeRemaining < 60000) {
            timerElement.style.color = '#FF4444';
        } else {
            timerElement.style.color = '';
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PSEUDOS DES JOUEURS
    // ═══════════════════════════════════════════════════════════

    /**
     * Met à jour les pseudos des joueurs
     * @param {string} p1Pseudo - Pseudo du joueur 1
     * @param {string} p2Pseudo - Pseudo du joueur 2
     */
    updatePlayerNames(p1Pseudo, p2Pseudo) {
        const p1Name = document.getElementById('multi-player1-name');
        const p2Name = document.getElementById('multi-player2-name');

        if (p1Name) p1Name.textContent = p1Pseudo || 'Joueur 1';
        if (p2Name) p2Name.textContent = p2Pseudo || 'Joueur 2';
    }

    // ═══════════════════════════════════════════════════════════
    // BARRES DE VIE
    // ═══════════════════════════════════════════════════════════

    /**
     * Met à jour une barre de vie
     * @param {string} barId - ID de l'élément barre de vie
     * @param {number} health - Points de vie actuels
     */
    updateHealthBar(barId, health) {
        const bar = document.getElementById(barId);
        if (!bar) return;

        const segments = bar.querySelectorAll('.mp-health-segment');
        segments.forEach((seg, index) => {
            if (index < health) {
                seg.classList.remove('empty');
            } else {
                seg.classList.add('empty');
            }
        });

        // Classes de couleur selon niveau de vie
        bar.classList.remove('low', 'critical');
        if (health <= 3) {
            bar.classList.add('critical');
        } else if (health <= 7) {
            bar.classList.add('low');
        }
    }

    /**
     * Met à jour les barres de vie des deux joueurs
     * @param {number} p1Health - Vie du joueur 1
     * @param {number} p2Health - Vie du joueur 2
     */
    updateHealthBars(p1Health, p2Health) {
        this.updateHealthBar('multi-player1-health', p1Health);
        this.updateHealthBar('multi-player2-health', p2Health);
    }

    // ═══════════════════════════════════════════════════════════
    // POWER-UPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Met à jour l'affichage du power-up d'un joueur
     * @param {string} containerId - ID du conteneur power-up
     * @param {Object} playerData - Données du joueur
     */
    updatePlayerPowerup(containerId, playerData) {
        const container = document.getElementById(containerId);
        if (!container || !playerData) return;

        const emoji = container.querySelector('.mp-pw-emoji');
        const fill = container.querySelector('.mp-pw-fill');

        if (!emoji || !fill) return;

        const powerupType = playerData.activePowerup;
        const powerupEndTime = playerData.powerupEndTime;

        if (powerupType && powerupEndTime) {
            const timeRemaining = Math.max(0, powerupEndTime - Date.now());
            const duration = 5000;
            const percentage = (timeRemaining / duration) * 100;

            container.className = `mp-powerup-inline active ${powerupType}`;
            emoji.textContent = POWERUP_EMOJIS[powerupType] || '';
            fill.style.width = Math.max(0, percentage) + '%';
        } else {
            container.className = 'mp-powerup-inline';
            emoji.textContent = '\u00A0';
            fill.style.width = '0%';
        }
    }

    /**
     * Met à jour les power-ups des deux joueurs
     * @param {Object} p1Data - Données du joueur 1
     * @param {Object} p2Data - Données du joueur 2
     */
    updatePowerups(p1Data, p2Data) {
        this.updatePlayerPowerup('multi-player1-powerup', p1Data);
        this.updatePlayerPowerup('multi-player2-powerup', p2Data);
    }

    // ═══════════════════════════════════════════════════════════
    // ÉPÉE (SLOT & TIMER)
    // ═══════════════════════════════════════════════════════════

    /**
     * Met à jour la bordure du slot épée selon la charge
     * @param {Object} playerData - Données du joueur
     */
    updateSwordSlotCharge(playerData) {
        const slot = document.getElementById('multi-sword-slot');
        if (!slot) return;

        // Seulement si l'épée est stockée
        if (playerData?.storedItem !== 'sword') {
            slot.style.borderColor = '';
            slot.style.boxShadow = '';
            slot.removeAttribute('data-charge');
            return;
        }

        const charge = playerData?.swordCharge ?? 0;
        slot.setAttribute('data-charge', charge);

        // Bordure grise (0) → verte progressive (15)
        slot.style.boxShadow = '';
        if (charge === 0) {
            slot.style.borderColor = '#6b7280';
        } else if (charge < 5) {
            slot.style.borderColor = '#84cc16';
        } else if (charge < 10) {
            slot.style.borderColor = '#22c55e';
        } else if (charge < 15) {
            slot.style.borderColor = '#10b981';
        } else {
            slot.style.borderColor = '#00ff88';
            slot.style.boxShadow = '0 0 15px #00ff88, 0 0 30px #00ff88';
        }
    }

    /**
     * Démarre le timer visuel de l'épée active (barre circulaire SVG)
     * @param {number} endTime - Timestamp de fin
     * @param {number} charge - Charge de l'épée
     */
    startSwordTimer(endTime, charge) {
        const slot = document.getElementById('multi-sword-slot');
        const icon = document.getElementById('multi-sword-icon');

        if (!slot || !icon) return;

        // Afficher l'icône épée
        slot.classList.add('sword-active');
        icon.textContent = '⚔️';

        // Créer ou récupérer le SVG circulaire
        let svgTimer = slot.querySelector('.sword-timer-svg');
        if (!svgTimer) {
            svgTimer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgTimer.classList.add('sword-timer-svg');
            svgTimer.setAttribute('viewBox', '0 0 100 100');
            svgTimer.innerHTML = `
                <circle class="sword-timer-bg" cx="50" cy="50" r="45" />
                <circle class="sword-timer-progress" cx="50" cy="50" r="45" />
            `;
            slot.appendChild(svgTimer);
        }

        const progressCircle = svgTimer.querySelector('.sword-timer-progress');
        const circumference = 2 * Math.PI * 45;
        progressCircle.style.strokeDasharray = circumference;

        // Calculer durée totale
        const duration = endTime - Date.now();
        const startTime = Date.now();

        // Animation du timer
        const updateTimer = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const progress = remaining / duration;

            // Mettre à jour le cercle (sens anti-horaire)
            progressCircle.style.strokeDashoffset = circumference * (1 - progress);

            // Couleur selon temps restant
            if (progress < 0.3) {
                progressCircle.style.stroke = '#ff4444';
            } else if (progress < 0.6) {
                progressCircle.style.stroke = '#ffaa00';
            } else {
                progressCircle.style.stroke = '#00ff88';
            }

            if (remaining > 0) {
                this.swordTimerRAF = requestAnimationFrame(updateTimer);
            } else {
                this.clearSwordTimer();
            }
        };

        updateTimer();
    }

    /**
     * Nettoie le timer visuel de l'épée
     */
    clearSwordTimer() {
        if (this.swordTimerRAF) {
            cancelAnimationFrame(this.swordTimerRAF);
            this.swordTimerRAF = null;
        }

        const slot = document.getElementById('multi-sword-slot');
        if (slot) {
            slot.classList.remove('sword-active');
            const svgTimer = slot.querySelector('.sword-timer-svg');
            if (svgTimer) {
                svgTimer.remove();
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // EFFETS VISUELS
    // ═══════════════════════════════════════════════════════════

    /**
     * Effet visuel de dégâts (flash rouge)
     * @param {HTMLCanvasElement} canvas - Canvas du jeu
     * @param {number} damage - Dégâts subis
     * @param {Function} showMessageFn - Fonction pour afficher un message
     */
    showDamageEffect(canvas, damage, showMessageFn) {
        if (!canvas) return;

        // Flash rouge sur le canvas
        canvas.style.boxShadow = `inset 0 0 100px rgba(255, 0, 0, 0.5), 0 0 50px rgba(255, 0, 0, 0.3)`;
        canvas.style.animation = 'damageShake 0.3s ease-out';

        setTimeout(() => {
            canvas.style.boxShadow = '';
            canvas.style.animation = '';
        }, 300);

        // Notification de dégâts
        if (showMessageFn) {
            showMessageFn(`⚔️ -${damage} HP!`, 'error');
        }
    }

    /**
     * Effet visuel quand l'épée touche
     * @param {HTMLCanvasElement} canvas - Canvas du jeu
     * @param {number} damage - Dégâts infligés
     * @param {Function} showMessageFn - Fonction pour afficher un message
     */
    showSwordHitEffect(canvas, damage, showMessageFn) {
        if (canvas) {
            canvas.style.boxShadow = `0 0 50px rgba(255, 215, 0, 0.8), inset 0 0 30px rgba(255, 215, 0, 0.3)`;
            setTimeout(() => {
                canvas.style.boxShadow = '';
            }, 300);
        }

        if (showMessageFn) {
            showMessageFn(`⚔️ +${damage} segments volés!`, 'success');
        }
    }

    // ═══════════════════════════════════════════════════════════
    // OVERLAYS
    // ═══════════════════════════════════════════════════════════

    /**
     * Affiche l'overlay d'attente de matchmaking
     * @param {Function} onCancel - Callback pour annuler le matchmaking
     */
    showWaitingOverlay(onCancel) {
        const overlay = document.createElement('div');
        overlay.id = 'mp-waiting-overlay';
        overlay.innerHTML = `
            <div class="mp-waiting-content">
                <div class="mp-waiting-icon">🎯</div>
                <h2 class="mp-waiting-title">Recherche en cours</h2>
                <p class="mp-waiting-subtitle">Connexion à un adversaire...</p>

                <div class="mp-waiting-spinner-container">
                    <div class="mp-spinner-outer"></div>
                    <div class="mp-spinner-inner"></div>
                    <div class="mp-spinner-dot"></div>
                </div>

                <div class="mp-waiting-status">
                    <div class="mp-status-dot"></div>
                    <span class="mp-status-text">Connecté au serveur</span>
                </div>

                <button class="mp-waiting-cancel" id="mp-cancel-matchmaking">
                    Annuler
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Attacher l'événement d'annulation
        const cancelBtn = document.getElementById('mp-cancel-matchmaking');
        if (cancelBtn && onCancel) {
            cancelBtn.onclick = onCancel;
        }

        // Enregistrer l'overlay dans le ScreenManager
        if (window.screenManager) {
            window.screenManager.registerOverlay('mp-waiting-overlay');
        }
    }

    /**
     * Cache l'overlay d'attente
     */
    hideWaitingOverlay() {
        const overlay = document.getElementById('mp-waiting-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Affiche l'overlay de fin de partie
     * @param {Object} options - Options d'affichage
     * @param {boolean} options.isWinner - Si le joueur a gagné
     * @param {string} options.reason - Raison de la fin
     * @param {string} options.myPseudo - Pseudo du joueur
     * @param {string} options.opponentPseudo - Pseudo de l'adversaire
     * @param {number} options.mySegments - Score du joueur
     * @param {number} options.opponentSegments - Score de l'adversaire
     * @param {boolean} options.isDraw - Si c'est un match nul
     * @param {Object} callbacks - Callbacks pour les boutons
     */
    showGameOverOverlay(options, callbacks = {}) {
        const {
            isWinner,
            reason,
            myPseudo,
            opponentPseudo,
            mySegments,
            opponentSegments,
            isDraw
        } = options;

        const reasonText = reason === 'time_up'
            ? '⏰ Temps écoulé !'
            : reason === 'opponent_died'
                ? '💀 Adversaire éliminé !'
                : reason === 'abandon'
                    ? '🏳️ Adversaire a abandonné !'
                    : '💀 Les deux sont morts !';

        const titleText = isWinner ? 'VICTOIRE' : (isDraw ? 'MATCH NUL' : 'DÉFAITE');
        const titleIcon = isWinner ? '🏆' : (isDraw ? '⚔️' : '💀');
        const overlayClass = isWinner ? 'victory' : (isDraw ? 'draw' : 'defeat');

        const gameOverOverlay = document.createElement('div');
        gameOverOverlay.id = 'mp-gameover-overlay';
        gameOverOverlay.className = overlayClass;

        gameOverOverlay.innerHTML = `
            <div class="mp-gameover-content">
                <div class="mp-gameover-icon">${titleIcon}</div>
                <h1 class="mp-gameover-title ${isWinner ? 'victory' : ''}">${titleText}</h1>
                <p class="mp-gameover-subtitle">${reasonText}</p>

                <div class="mp-gameover-scores">
                    <div class="mp-score-card ${mySegments > opponentSegments ? 'winner' : ''}">
                        <div class="mp-score-avatar">🐍</div>
                        <div class="mp-score-name">${myPseudo}</div>
                        <div class="mp-score-value">${mySegments}</div>
                        <div class="mp-score-label">segments</div>
                    </div>
                    <div class="mp-score-vs">VS</div>
                    <div class="mp-score-card ${opponentSegments > mySegments ? 'winner' : ''}">
                        <div class="mp-score-avatar">🐍</div>
                        <div class="mp-score-name">${opponentPseudo}</div>
                        <div class="mp-score-value">${opponentSegments}</div>
                        <div class="mp-score-label">segments</div>
                    </div>
                </div>

                <div class="mp-gameover-actions">
                    <button id="mp-replay-btn" class="mp-btn-primary">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Rejouer</span>
                    </button>
                    <button id="mp-leaderboard-btn" class="mp-btn-secondary">
                        <span class="btn-icon">🏆</span>
                        <span class="btn-text">Leaderboard</span>
                    </button>
                    <button id="mp-menu-btn" class="mp-btn-tertiary">
                        <span class="btn-icon">🏠</span>
                        <span class="btn-text">Menu</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(gameOverOverlay);

        // Enregistrer l'overlay
        if (window.screenManager) {
            window.screenManager.registerOverlay('mp-gameover-overlay');
        }

        // Attacher les événements
        if (callbacks.onReplay) {
            document.getElementById('mp-replay-btn').onclick = () => {
                gameOverOverlay.remove();
                callbacks.onReplay();
            };
        }

        if (callbacks.onLeaderboard) {
            document.getElementById('mp-leaderboard-btn').onclick = callbacks.onLeaderboard;
        }

        if (callbacks.onMenu) {
            document.getElementById('mp-menu-btn').onclick = () => {
                gameOverOverlay.remove();
                callbacks.onMenu();
            };
        }

        return gameOverOverlay;
    }

    /**
     * Cache l'overlay de fin de partie
     */
    hideGameOverOverlay() {
        const overlay = document.getElementById('mp-gameover-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MISE À JOUR COMPLÈTE DU SCOREBOARD
    // ═══════════════════════════════════════════════════════════

    /**
     * Met à jour tout le scoreboard à partir de l'état serveur
     * @param {Object} serverState - État du serveur
     * @param {string} myId - ID du joueur local
     */
    updateScoreBoard(serverState, myId) {
        if (!serverState || !myId) return;

        const timeRemaining = serverState.matchTimeRemaining || 0;
        this.updateTimer(timeRemaining);

        const players = serverState.players || {};
        const playerIds = Object.keys(players);
        const opponentId = playerIds.find(id => id !== myId);

        if (!opponentId) return;

        const p1Id = myId;
        const p2Id = opponentId;

        // Pseudos
        this.updatePlayerNames(
            players[p1Id]?.pseudo,
            players[p2Id]?.pseudo
        );

        // Power-ups
        this.updatePowerups(players[p1Id], players[p2Id]);

        // Barres de vie
        const p1Health = players[p1Id]?.health ?? 15;
        const p2Health = players[p2Id]?.health ?? 15;
        this.updateHealthBars(p1Health, p2Health);

        // Charge épée
        this.updateSwordSlotCharge(players[myId]);
    }
}

// Instance singleton
export const multiplayerUIManager = new MultiplayerUIManagerClass();

// Export pour compatibilité window.*
window.multiplayerUIManager = multiplayerUIManager;

export default multiplayerUIManager;
