/**
 * DAILY CHALLENGE - Système de défis quotidiens Roguelike
 */

import { logger } from '../services/logger.js';

class DailyChallenge {
    constructor() {
        this.currentChallenge = null;
        this.attemptsLeft = 0;
        this.isLoading = false;
        this.modal = null;

        logger.log('[DailyChallenge] Initialisé');
    }

    /**
     * Affiche le modal du Daily Challenge
     */
    async show() {
        logger.log('[DailyChallenge] Affichage du modal');

        // Créer le modal s'il n'existe pas
        if (!this.modal) {
            this.modal = this.createModal();
            document.body.appendChild(this.modal);
        }

        // Afficher avec loading
        this.modal.style.display = 'flex';
        this.setLoading(true);

        try {
            const pseudo = localStorage.getItem('snakeultra_pseudo') || '';
            const response = await fetch(`/api/roguelike/daily?pseudo=${encodeURIComponent(pseudo)}`);
            const data = await response.json();

            if (data.success) {
                this.currentChallenge = data.challenge;
                this.attemptsLeft = data.attemptsLeft;
                this.renderChallenge(data);
            } else {
                this.renderError('Impossible de charger le défi');
            }
        } catch (error) {
            logger.error('[DailyChallenge] Erreur fetch:', error);
            this.renderError('Erreur de connexion');
        }

        this.setLoading(false);
    }

    /**
     * Crée le modal
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'daily-challenge-modal';
        modal.className = 'daily-modal';
        modal.innerHTML = `
            <div class="daily-backdrop" onclick="window.dailyChallenge.close()"></div>
            <div class="daily-container">
                <div class="daily-header">
                    <h2>🎯 Défi du Jour</h2>
                    <button class="daily-close" onclick="window.dailyChallenge.close()">✕</button>
                </div>
                <div class="daily-content">
                    <!-- Contenu dynamique -->
                </div>
            </div>
        `;

        this.injectStyles();
        return modal;
    }

    /**
     * Affiche le loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        const content = this.modal.querySelector('.daily-content');
        if (loading) {
            content.innerHTML = `
                <div class="daily-loading">
                    <div class="loading-spinner"></div>
                    <p>Chargement du défi...</p>
                </div>
            `;
        }
    }

    /**
     * Affiche une erreur
     */
    renderError(message) {
        const content = this.modal.querySelector('.daily-content');
        content.innerHTML = `
            <div class="daily-error">
                <span class="error-icon">⚠️</span>
                <p>${message}</p>
                <button class="btn-retry" onclick="window.dailyChallenge.show()">Réessayer</button>
            </div>
        `;
    }

    /**
     * Affiche le défi du jour
     */
    renderChallenge(data) {
        const content = this.modal.querySelector('.daily-content');
        const challenge = data.challenge;
        const timeStr = this.formatTimeRemaining(data.timeRemaining);

        content.innerHTML = `
            <div class="daily-challenge-info">
                <div class="challenge-name">${challenge.name}</div>
                <div class="challenge-date">${challenge.date}</div>

                <div class="challenge-modifiers">
                    <div class="modifier">
                        <span class="modifier-icon">⚡</span>
                        <span class="modifier-name">${challenge.modifiers.speed.name}</span>
                        <span class="modifier-desc">${challenge.modifiers.speed.description}</span>
                    </div>
                    <div class="modifier">
                        <span class="modifier-icon">🍎</span>
                        <span class="modifier-name">${challenge.modifiers.apples.name}</span>
                        <span class="modifier-desc">${challenge.modifiers.apples.description}</span>
                    </div>
                    <div class="modifier">
                        <span class="modifier-icon">🧱</span>
                        <span class="modifier-name">${challenge.modifiers.obstacles.name}</span>
                        <span class="modifier-desc">${challenge.modifiers.obstacles.description}</span>
                    </div>
                    <div class="modifier special">
                        <span class="modifier-icon">✨</span>
                        <span class="modifier-name">${challenge.modifiers.special.name}</span>
                        <span class="modifier-desc">${challenge.modifiers.special.description}</span>
                    </div>
                </div>

                <div class="challenge-objective">
                    <div class="objective-label">Objectif</div>
                    <div class="objective-value">Atteindre le niveau ${challenge.targetLevel}</div>
                    <div class="objective-reward">+${challenge.bonusXP} XP bonus</div>
                </div>

                <div class="challenge-attempts">
                    <span class="attempts-label">Tentatives</span>
                    <span class="attempts-value">${data.attemptsLeft}/${data.maxAttempts}</span>
                </div>

                <div class="challenge-timer">
                    <span class="timer-icon">⏰</span>
                    <span class="timer-text">Reset dans ${timeStr}</span>
                </div>
            </div>

            <div class="daily-actions">
                ${data.attemptsLeft > 0 ? `
                    <button class="btn-play-daily" onclick="window.dailyChallenge.startChallenge()">
                        🎮 Jouer le Défi
                    </button>
                ` : `
                    <button class="btn-play-daily disabled" disabled>
                        ❌ Plus de tentatives
                    </button>
                `}
                <button class="btn-daily-leaderboard" onclick="window.dailyChallenge.showLeaderboard()">
                    🏆 Classement du Jour
                </button>
            </div>
        `;
    }

    /**
     * Formate le temps restant
     */
    formatTimeRemaining(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}min`;
    }

    /**
     * Lance le défi
     */
    startChallenge() {
        if (!this.currentChallenge || this.attemptsLeft <= 0) {
            return;
        }

        logger.log('[DailyChallenge] Lancement du défi:', this.currentChallenge.name);

        // Fermer le modal
        this.close();

        // Démarrer le mode daily via RoguelikeManager
        if (window.roguelikeManager) {
            window.roguelikeManager.startDailyRun(this.currentChallenge);
        }
    }

    /**
     * Affiche le leaderboard du jour
     */
    async showLeaderboard() {
        logger.log('[DailyChallenge] Affichage leaderboard');
        this.setLoading(true);

        try {
            const response = await fetch('/api/roguelike/daily/leaderboard');
            const data = await response.json();

            if (data.success) {
                this.renderLeaderboard(data);
            } else {
                this.renderError('Impossible de charger le classement');
            }
        } catch (error) {
            logger.error('[DailyChallenge] Erreur leaderboard:', error);
            this.renderError('Erreur de connexion');
        }

        this.setLoading(false);
    }

    /**
     * Affiche le leaderboard
     */
    renderLeaderboard(data) {
        const content = this.modal.querySelector('.daily-content');
        const pseudo = localStorage.getItem('snakeultra_pseudo') || '';

        let html = `
            <div class="daily-leaderboard">
                <div class="leaderboard-header-info">
                    <span class="challenge-name-small">${data.challenge.name}</span>
                    <span class="objective-small">Objectif: Niveau ${data.challenge.targetLevel}</span>
                </div>

                <div class="leaderboard-table-wrapper">
                    <table class="daily-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Joueur</th>
                                <th>Score</th>
                                <th>Niveau</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (data.data.length === 0) {
            html += `
                <tr class="empty-row">
                    <td colspan="4">
                        <div class="empty-message">
                            <span>🎯</span>
                            <p>Aucun score aujourd'hui</p>
                            <p class="sub">Sois le premier !</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            data.data.forEach(entry => {
                const isMe = pseudo && entry.pseudo.toLowerCase() === pseudo.toLowerCase();
                const reachedTarget = entry.level >= data.challenge.targetLevel;
                html += `
                    <tr class="${isMe ? 'current-player' : ''} ${entry.rank <= 3 ? 'top-' + entry.rank : ''}">
                        <td>${this.getRankDisplay(entry.rank)}</td>
                        <td>${this.escapeHtml(entry.pseudo)} ${reachedTarget ? '🎯' : ''}</td>
                        <td>${entry.score.toLocaleString()}</td>
                        <td>${entry.level}</td>
                    </tr>
                `;
            });
        }

        html += `
                        </tbody>
                    </table>
                </div>

                <button class="btn-back-daily" onclick="window.dailyChallenge.show()">
                    ← Retour au Défi
                </button>
            </div>
        `;

        content.innerHTML = html;
    }

    /**
     * Affiche le rang avec médaille
     */
    getRankDisplay(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    }

    /**
     * Échappe les caractères HTML
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Ferme le modal
     */
    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    /**
     * Soumet un score de daily challenge
     */
    async submitScore(stats) {
        if (!this.currentChallenge) {
            logger.warn('[DailyChallenge] Pas de challenge actif pour soumettre');
            return null;
        }

        try {
            const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Anonyme';

            const response = await fetch('/api/roguelike/daily/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo,
                    score: stats.score,
                    level: stats.level,
                    time: Math.floor(stats.timePlayed),
                    seed: this.currentChallenge.seed
                })
            });

            const result = await response.json();

            if (result.success) {
                logger.log('[DailyChallenge] Score soumis:', result);
                this.attemptsLeft = result.attemptsLeft;

                // Émettre un événement
                window.dispatchEvent(new CustomEvent('daily-score-submitted', {
                    detail: result
                }));

                return result;
            } else {
                logger.warn('[DailyChallenge] Échec soumission:', result.error);
                return null;
            }
        } catch (error) {
            logger.error('[DailyChallenge] Erreur soumission:', error);
            return null;
        }
    }

    /**
     * Injecte les styles CSS
     */
    injectStyles() {
        if (document.getElementById('daily-challenge-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'daily-challenge-styles';
        styles.textContent = `
            .daily-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                align-items: center;
                justify-content: center;
            }

            .daily-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(4px);
            }

            .daily-container {
                position: relative;
                width: 90%;
                max-width: 420px;
                max-height: 85vh;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                border: 2px solid #e94560;
                box-shadow: 0 0 50px rgba(233, 69, 96, 0.3);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .daily-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: linear-gradient(90deg, #e94560 0%, #0f3460 100%);
            }

            .daily-header h2 {
                margin: 0;
                font-size: 1.3rem;
                color: white;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .daily-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                font-size: 1.3rem;
                cursor: pointer;
                transition: all 0.2s;
            }

            .daily-close:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .daily-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            .daily-loading, .daily-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                color: #ccc;
            }

            .challenge-name {
                font-size: 1.6rem;
                font-weight: bold;
                color: #e94560;
                text-align: center;
                text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
                margin-bottom: 4px;
            }

            .challenge-date {
                text-align: center;
                color: #888;
                font-size: 0.85rem;
                margin-bottom: 20px;
            }

            .challenge-modifiers {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 20px;
            }

            .modifier {
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
                padding: 12px;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .modifier.special {
                grid-column: span 2;
                background: rgba(233, 69, 96, 0.1);
                border-color: rgba(233, 69, 96, 0.3);
            }

            .modifier-icon {
                font-size: 1.2rem;
                margin-right: 6px;
            }

            .modifier-name {
                font-weight: bold;
                color: #fff;
                font-size: 0.9rem;
            }

            .modifier-desc {
                display: block;
                color: #888;
                font-size: 0.75rem;
                margin-top: 4px;
            }

            .challenge-objective {
                background: linear-gradient(135deg, rgba(233, 69, 96, 0.2), rgba(15, 52, 96, 0.3));
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                margin-bottom: 16px;
                border: 1px solid rgba(233, 69, 96, 0.3);
            }

            .objective-label {
                color: #888;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .objective-value {
                font-size: 1.2rem;
                font-weight: bold;
                color: #fff;
                margin: 8px 0;
            }

            .objective-reward {
                color: #4ade80;
                font-weight: bold;
            }

            .challenge-attempts {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                margin-bottom: 12px;
            }

            .attempts-label {
                color: #888;
            }

            .attempts-value {
                font-weight: bold;
                color: #e94560;
                font-size: 1.1rem;
            }

            .challenge-timer {
                text-align: center;
                color: #888;
                font-size: 0.85rem;
                margin-bottom: 20px;
            }

            .timer-icon {
                margin-right: 6px;
            }

            .daily-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .btn-play-daily {
                width: 100%;
                padding: 16px;
                font-size: 1.1rem;
                font-weight: bold;
                background: linear-gradient(135deg, #e94560, #0f3460);
                border: none;
                color: white;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
            }

            .btn-play-daily:hover:not(.disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(233, 69, 96, 0.4);
            }

            .btn-play-daily.disabled {
                background: #333;
                color: #666;
                cursor: not-allowed;
                box-shadow: none;
            }

            .btn-daily-leaderboard {
                width: 100%;
                padding: 12px;
                font-size: 0.95rem;
                background: transparent;
                border: 2px solid #e94560;
                color: #e94560;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-daily-leaderboard:hover {
                background: rgba(233, 69, 96, 0.1);
            }

            /* Leaderboard styles */
            .daily-leaderboard {
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .leaderboard-header-info {
                text-align: center;
                margin-bottom: 16px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .challenge-name-small {
                display: block;
                color: #e94560;
                font-weight: bold;
                font-size: 1.1rem;
            }

            .objective-small {
                color: #888;
                font-size: 0.85rem;
            }

            .daily-table {
                width: 100%;
                border-collapse: collapse;
            }

            .daily-table th {
                padding: 10px 8px;
                text-align: left;
                color: #e94560;
                font-size: 0.75rem;
                text-transform: uppercase;
                background: rgba(0,0,0,0.3);
            }

            .daily-table td {
                padding: 12px 8px;
                color: #ddd;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .daily-table .current-player {
                background: rgba(233, 69, 96, 0.2);
            }

            .daily-table .current-player td {
                color: white;
                font-weight: bold;
            }

            .daily-table .top-1 td { color: #ffd700; }
            .daily-table .top-2 td { color: #c0c0c0; }
            .daily-table .top-3 td { color: #cd7f32; }

            .btn-back-daily {
                margin-top: 16px;
                padding: 12px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                color: #888;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-back-daily:hover {
                background: rgba(255,255,255,0.1);
                color: #fff;
            }

            .empty-message {
                text-align: center;
                padding: 30px;
                color: #666;
            }

            .empty-message span {
                font-size: 2.5rem;
                display: block;
                margin-bottom: 10px;
            }

            .empty-message .sub {
                font-size: 0.8rem;
                margin-top: 6px;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Instance globale
const dailyChallenge = new DailyChallenge();
window.dailyChallenge = dailyChallenge;

export default dailyChallenge;
