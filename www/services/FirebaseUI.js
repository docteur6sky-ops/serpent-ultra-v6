// ============================================
// FIREBASE UI - SNAKE ULTRA
// Interface utilisateur pour Firebase
// ============================================

import {
    initFirebase,
    signInWithGoogle,
    logOut,
    getCurrentUser,
    isLoggedIn,
    getLeaderboard,
    submitScore,
    getUserRank
} from './firebase.js';
import { logger } from './logger.js';
import { audioService } from './audio.js';

class FirebaseUIManager {
    constructor() {
        this.initialized = false;
        this.loginButton = null;
        this.userInfo = null;
        
    }

    /**
     * Initialise Firebase et l'UI
     */
    async init() {
        if (this.initialized) return;

        // Initialiser Firebase
        initFirebase();

        // Créer les éléments UI
        this.createLoginUI();
        this.createLeaderboardModal();

        // Écouter les changements d'auth
        window.addEventListener('firebase-auth-changed', (e) => {
            this.updateLoginUI(e.detail.user, e.detail.isLoggedIn);
            
        });

        this.initialized = true;
        logger.log('[FirebaseUI] Initialisé');
    }

    /**
     * Initialise l'UI (menu options uniquement)
     */
    createLoginUI() {
        // L'UI est dans le menu options, pas de bouton flottant
        this.updateOptionsIndicator();
    }


    /**
    /**
     * Met à jour l'UI (menu options)
     */
    updateLoginUI(user, loggedIn) {
        logger.log('[FirebaseUI] Mise à jour UI, connecté:', loggedIn);
        
        const si = document.getElementById('google-account-status');
        const lo = document.getElementById('google-logged-out');
        const li = document.getElementById('google-logged-in');
        const av = document.getElementById('google-user-avatar');
        const nm = document.getElementById('google-user-name');
        const em = document.getElementById('google-user-email');
        
        if (loggedIn && user) {
            if (si) si.textContent = '✓';
            if (lo) lo.classList.add('hidden');
            if (li) {
                li.classList.remove('hidden');
                if (av) av.src = user.photoURL || '';
                if (nm) nm.textContent = user.displayName || 'Joueur';
                if (em) em.textContent = user.email || '';
            }
        } else {
            if (si) si.textContent = '-';
            if (lo) lo.classList.remove('hidden');
            if (li) li.classList.add('hidden');
        }
        
        // Toujours réinitialiser le bouton de connexion
        this.resetLoginButton();
    }

    updateOptionsIndicator() {
        const u = getCurrentUser();
        const s = document.getElementById('google-account-status');
        if (s) s.textContent = u ? '✓' : '-';
    }

    /**
     * Reset le bouton de connexion
     */
    resetLoginButton() {
        const btn = document.getElementById('google-login-btn');
        if (btn) {
            btn.disabled = false;
            const textSpan = btn.querySelector('span:last-child');
            if (textSpan) {
                textSpan.textContent = 'Se connecter avec Google';
            }
        }
    }

    /**
     * Connexion depuis le menu options
     */
    async loginFromOptions() {
        const btn = document.getElementById('google-login-btn');

        try {
            // Mettre le bouton en état chargement
            if (btn) {
                btn.disabled = true;
                const textSpan = btn.querySelector('span:last-child');
                if (textSpan) {
                    textSpan.textContent = 'Connexion...';
                }
            }

            logger.log('[FirebaseUI] Tentative de connexion Google...');
            const user = await signInWithGoogle();

            if (user) {
                logger.log('[FirebaseUI] Connexion réussie:', user.displayName);
                audioService.confirm();
                // L'UI sera mise à jour par l'événement firebase-auth-changed
            } else {
                logger.log('[FirebaseUI] Connexion annulée');
                this.resetLoginButton();
            }
        } catch (error) {
            logger.error('[FirebaseUI] Erreur connexion:', error);
            this.resetLoginButton();
        }
    }

    /**
     * Déconnexion depuis le menu options
     */
    async logoutFromOptions() {
        try {
            logger.log('[FirebaseUI] Déconnexion...');
            await logOut();
            audioService.cancel();
            logger.log('[FirebaseUI] Déconnexion réussie');
        } catch (error) {
            logger.error('[FirebaseUI] Erreur déconnexion:', error);
        }
    }

    /**
     * Crée la modal de leaderboard
     */
    createLeaderboardModal() {
        const modal = document.createElement('div');
        modal.id = 'leaderboard-modal';
        modal.className = 'leaderboard-modal hidden';
        modal.innerHTML = `
            <div class="leaderboard-modal-content">
                <div class="leaderboard-header">
                    <h2>Classement Mondial</h2>
                    <button class="leaderboard-close-btn" id="leaderboard-close">&times;</button>
                </div>
                <div class="leaderboard-tabs">
                    <button class="leaderboard-tab active" data-mode="solo">Solo</button>
                    <button class="leaderboard-tab" data-mode="roguelike">Roguelike</button>
                    <button class="leaderboard-tab" data-mode="bossrush">Boss Rush</button>
                </div>
                <div class="leaderboard-content" id="leaderboard-content">
                    <div class="leaderboard-loading">Chargement...</div>
                </div>
                <div class="leaderboard-user-rank" id="leaderboard-user-rank"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Events
        document.getElementById('leaderboard-close').addEventListener('click', () => {
            this.hideLeaderboard();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideLeaderboard();
        });

        // Tabs
        modal.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadLeaderboardData(tab.dataset.mode);
            });
        });
    }

    /**
     * Affiche le leaderboard
     */
    async showLeaderboard(mode = 'solo') {
        const modal = document.getElementById('leaderboard-modal');
        if (!modal) return;

        modal.classList.remove('hidden');
        audioService.buttonClick();

        // Sélectionner le bon onglet
        modal.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        await this.loadLeaderboardData(mode);
    }

    /**
     * Cache le leaderboard
     */
    hideLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.classList.add('hidden');
            audioService.cancel();
        }
    }

    /**
     * Charge les données du leaderboard
     */
    async loadLeaderboardData(mode) {
        const content = document.getElementById('leaderboard-content');
        const userRankDiv = document.getElementById('leaderboard-user-rank');

        if (!content) return;

        content.innerHTML = '<div class="leaderboard-loading">Chargement...</div>';

        try {
            const scores = await getLeaderboard(mode, 20);
            const userRank = await getUserRank(mode);

            if (scores.length === 0) {
                content.innerHTML = `
                    <div class="leaderboard-empty">
                        <span class="leaderboard-empty-icon">🏆</span>
                        <p>Aucun score pour le moment</p>
                        <p class="leaderboard-empty-hint">Sois le premier à te classer !</p>
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <div class="leaderboard-list">
                        ${scores.map((entry, index) => `
                            <div class="leaderboard-entry ${entry.isCurrentUser ? 'current-user' : ''} ${index < 3 ? 'top-3' : ''}">
                                <div class="leaderboard-rank">
                                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : entry.rank}
                                </div>
                                <img class="leaderboard-avatar" src="${entry.photoURL || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><circle cx=%2212%22 cy=%2212%22 r=%2210%22 fill=%22%23666%22/></svg>'}" alt="">
                                <div class="leaderboard-name">${entry.displayName || 'Anonyme'}</div>
                                <div class="leaderboard-score">${entry.score.toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Afficher le rang de l'utilisateur
            if (userRank && isLoggedIn()) {
                userRankDiv.innerHTML = `
                    <div class="user-rank-info">
                        Ton classement: <strong>#${userRank}</strong>
                    </div>
                `;
                userRankDiv.classList.remove('hidden');
            } else if (isLoggedIn()) {
                userRankDiv.innerHTML = `
                    <div class="user-rank-info">
                        Joue pour te classer !
                    </div>
                `;
                userRankDiv.classList.remove('hidden');
            } else {
                userRankDiv.classList.add('hidden');
            }

        } catch (error) {
            logger.error('[FirebaseUI] Erreur chargement leaderboard:', error);
            content.innerHTML = `
                <div class="leaderboard-error">
                    <p>Erreur de chargement</p>
                    <button onclick="window.firebaseUI.loadLeaderboardData('${mode}')">Réessayer</button>
                </div>
            `;
        }
    }

    /**
     * Soumet un score et affiche le résultat
     */
    async submitAndShowResult(mode, score, details = {}) {
        if (!isLoggedIn()) {
            logger.log('[FirebaseUI] Non connecté, score non soumis');
            return false;
        }

        const isNewRecord = await submitScore(mode, score, details);

        if (isNewRecord) {
            audioService.newRecord();
            this.showNewRecordNotification(score);
        }

        return isNewRecord;
    }

    /**
     * Affiche une notification de nouveau record
     */
    showNewRecordNotification(score) {
        const notification = document.createElement('div');
        notification.className = 'firebase-notification new-record';
        notification.innerHTML = `
            <div class="notification-icon">🏆</div>
            <div class="notification-text">
                <div class="notification-title">Nouveau Record !</div>
                <div class="notification-score">${score.toLocaleString()} points</div>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Instance singleton
export const firebaseUI = new FirebaseUIManager();

// Exposer globalement
window.firebaseUI = firebaseUI;

export default firebaseUI;
