// ============================================
// LEADERBOARD UI - Classement Global Firebase
// ============================================

import { logger } from '../services/logger.js';
import { getLeaderboard, submitScoreAuto } from '../services/firebase.js';

class LeaderboardUI {
    constructor() {
        this.modal = null;
        this.currentMode = 'solo';
        this.isLoading = false;
        logger.log('[LeaderboardUI] Initialisé');
    }

    /**
     * Affiche le modal du leaderboard
     * @param {string} mode - 'solo', 'roguelike', 'bossrush'
     */
    async show(mode = 'solo') {
        this.currentMode = mode;
        logger.log(`[LeaderboardUI] Ouverture mode: ${mode}`);

        // Créer le modal s'il n'existe pas
        if (!this.modal) {
            this.modal = this.createModal();
            document.body.appendChild(this.modal);
        }

        // Afficher
        this.modal.style.display = 'flex';
        requestAnimationFrame(() => {
            this.modal.classList.add('visible');
        });

        // Son
        if (window.audio) {
            window.audio.buttonClick?.();
        }

        // Charger les données
        await this.loadLeaderboard(mode);
    }

    /**
     * Crée le modal HTML
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'leaderboard-modal';
        modal.className = 'leaderboard-overlay';

        modal.innerHTML = `
            <div class="leaderboard-backdrop" onclick="window.leaderboardUI.close()"></div>
            <div class="leaderboard-container">
                <div class="leaderboard-header">
                    <h2 class="leaderboard-title">
                        <span class="leaderboard-icon">🏆</span>
                        CLASSEMENT MONDIAL
                    </h2>
                    <button class="leaderboard-close" onclick="window.leaderboardUI.close()">✕</button>
                </div>

                <div class="leaderboard-tabs">
                    <button class="lb-tab active" data-mode="solo" onclick="window.leaderboardUI.switchMode('solo')">
                        🎮 Solo
                    </button>
                    <button class="lb-tab" data-mode="roguelike" onclick="window.leaderboardUI.switchMode('roguelike')">
                        🎲 Roguelike
                    </button>
                    <button class="lb-tab" data-mode="bossrush" onclick="window.leaderboardUI.switchMode('bossrush')">
                        👹 Boss Rush
                    </button>
                </div>

                <div class="leaderboard-content">
                    <div class="leaderboard-loading">
                        <div class="lb-spinner"></div>
                        <p>Chargement...</p>
                    </div>
                </div>
            </div>
        `;

        this.injectStyles();
        return modal;
    }

    /**
     * Change de mode
     */
    async switchMode(mode) {
        if (this.isLoading || this.currentMode === mode) return;

        this.currentMode = mode;

        // Mettre à jour les tabs
        this.modal.querySelectorAll('.lb-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Son
        if (window.audio) {
            window.audio.buttonClick?.();
        }

        await this.loadLeaderboard(mode);
    }

    /**
     * Charge le leaderboard depuis Firebase
     */
    async loadLeaderboard(mode) {
        this.isLoading = true;
        const content = this.modal.querySelector('.leaderboard-content');

        // Afficher loading
        content.innerHTML = `
            <div class="leaderboard-loading">
                <div class="lb-spinner"></div>
                <p>Chargement...</p>
            </div>
        `;

        try {
            const scores = await getLeaderboard(mode, 50);
            this.renderLeaderboard(scores, mode);
        } catch (error) {
            logger.error('[LeaderboardUI] Erreur:', error);
            content.innerHTML = `
                <div class="leaderboard-error">
                    <span class="error-icon">⚠️</span>
                    <p>Erreur de chargement</p>
                    <button class="btn-retry" onclick="window.leaderboardUI.loadLeaderboard('${mode}')">Réessayer</button>
                </div>
            `;
        }

        this.isLoading = false;
    }

    /**
     * Affiche le leaderboard
     */
    renderLeaderboard(scores, mode) {
        const content = this.modal.querySelector('.leaderboard-content');
        const modeNames = {
            solo: 'Solo Classique',
            roguelike: 'Mode Roguelike',
            bossrush: 'Boss Rush'
        };

        if (scores.length === 0) {
            content.innerHTML = `
                <div class="leaderboard-empty">
                    <span class="empty-icon">🎯</span>
                    <p class="empty-title">Aucun score</p>
                    <p class="empty-sub">Sois le premier à apparaître !</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="leaderboard-mode-title">${modeNames[mode] || mode}</div>
            <div class="leaderboard-table-wrapper">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th class="col-rank">#</th>
                            <th class="col-name">Joueur</th>
                            <th class="col-score">Score</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        scores.forEach((entry) => {
            const rankDisplay = this.getRankDisplay(entry.rank);
            const rowClass = entry.isCurrentUser ? 'current-player' : '';
            const topClass = entry.rank <= 3 ? `top-${entry.rank}` : '';

            html += `
                <tr class="${rowClass} ${topClass}">
                    <td class="col-rank">${rankDisplay}</td>
                    <td class="col-name">
                        ${entry.photoURL ? `<img src="${entry.photoURL}" class="player-avatar" alt="">` : ''}
                        <span class="player-name">${this.escapeHtml(entry.displayName)}</span>
                        ${entry.isCurrentUser ? '<span class="you-badge">TOI</span>' : ''}
                    </td>
                    <td class="col-score">${entry.score.toLocaleString()}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
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
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Ferme le modal
     */
    close() {
        if (this.modal) {
            this.modal.classList.remove('visible');
            setTimeout(() => {
                this.modal.style.display = 'none';
            }, 300);
        }

        if (window.audio) {
            window.audio.cancel?.();
        }
    }

    /**
     * Injecte les styles CSS
     */
    injectStyles() {
        if (document.getElementById('leaderboard-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'leaderboard-styles';
        styles.textContent = `
            .leaderboard-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .leaderboard-overlay.visible {
                opacity: 1;
            }

            .leaderboard-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(8px);
            }

            .leaderboard-container {
                position: relative;
                width: 95%;
                max-width: 450px;
                max-height: 85vh;
                background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
                border-radius: 20px;
                border: 2px solid #FFD700;
                box-shadow: 0 0 60px rgba(255, 215, 0, 0.3);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .leaderboard-overlay.visible .leaderboard-container {
                transform: scale(1);
            }

            .leaderboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
            }

            .leaderboard-title {
                margin: 0;
                font-size: 1.2rem;
                color: #1a1a2e;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .leaderboard-icon {
                font-size: 1.4rem;
            }

            .leaderboard-close {
                background: rgba(0, 0, 0, 0.2);
                border: none;
                color: #1a1a2e;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                font-size: 1.3rem;
                cursor: pointer;
                transition: all 0.2s;
            }

            .leaderboard-close:hover {
                background: rgba(0, 0, 0, 0.3);
                transform: scale(1.1);
            }

            .leaderboard-tabs {
                display: flex;
                background: rgba(0, 0, 0, 0.3);
                padding: 8px;
                gap: 6px;
            }

            .lb-tab {
                flex: 1;
                padding: 10px 8px;
                font-size: 0.8rem;
                font-weight: bold;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #888;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .lb-tab:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            .lb-tab.active {
                background: linear-gradient(135deg, #FFD700, #FFA500);
                color: #1a1a2e;
                border-color: #FFD700;
            }

            .leaderboard-content {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                min-height: 300px;
            }

            .leaderboard-loading,
            .leaderboard-error,
            .leaderboard-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                color: #888;
            }

            .lb-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 215, 0, 0.2);
                border-top-color: #FFD700;
                border-radius: 50%;
                animation: lb-spin 1s linear infinite;
                margin-bottom: 16px;
            }

            @keyframes lb-spin {
                to { transform: rotate(360deg); }
            }

            .leaderboard-mode-title {
                text-align: center;
                color: #FFD700;
                font-size: 0.9rem;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .leaderboard-table-wrapper {
                overflow-x: auto;
            }

            .leaderboard-table {
                width: 100%;
                border-collapse: collapse;
            }

            .leaderboard-table th {
                padding: 10px 8px;
                text-align: left;
                color: #FFD700;
                font-size: 0.75rem;
                text-transform: uppercase;
                background: rgba(255, 215, 0, 0.1);
                position: sticky;
                top: 0;
            }

            .leaderboard-table td {
                padding: 12px 8px;
                color: #ddd;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                font-size: 0.9rem;
            }

            .col-rank {
                width: 50px;
                text-align: center;
            }

            .col-score {
                text-align: right;
                font-weight: bold;
                color: #FFD700 !important;
            }

            .col-name {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .player-avatar {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                object-fit: cover;
            }

            .player-name {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .you-badge {
                background: #00FF87;
                color: #000;
                font-size: 0.6rem;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: bold;
            }

            .leaderboard-table .current-player {
                background: rgba(0, 255, 135, 0.15);
            }

            .leaderboard-table .current-player td {
                color: #00FF87;
            }

            .leaderboard-table .top-1 td { color: #FFD700; }
            .leaderboard-table .top-2 td { color: #C0C0C0; }
            .leaderboard-table .top-3 td { color: #CD7F32; }

            .empty-icon, .error-icon {
                font-size: 3rem;
                margin-bottom: 12px;
            }

            .empty-title {
                font-size: 1.2rem;
                color: #fff;
                margin: 0 0 8px 0;
            }

            .empty-sub {
                color: #666;
                font-size: 0.9rem;
            }

            .btn-retry {
                margin-top: 16px;
                padding: 10px 24px;
                background: #FFD700;
                color: #1a1a2e;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Instance globale
const leaderboardUI = new LeaderboardUI();
window.leaderboardUI = leaderboardUI;

// Fonction globale pour ouvrir le leaderboard
window.showLeaderboard = (mode = 'solo') => leaderboardUI.show(mode);

logger.log('✅ LeaderboardUI chargé');

export { leaderboardUI };
