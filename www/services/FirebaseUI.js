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
     * Crée le bouton de connexion dans le header
     */
    createLoginUI() {
        const placeholder = document.getElementById('firebase-login-placeholder');
        const hubHeader = document.querySelector('.hub-header') || document.querySelector('#hub-screen .screen-header');
        if (!placeholder && !hubHeader) { this.createFloatingLoginButton(); return; }
        const loginContainer = document.createElement('div');
        loginContainer.id = 'firebase-login-container';
        loginContainer.className = 'firebase-login-container';
        loginContainer.innerHTML = '<button id="firebase-login-btn" class="firebase-login-btn"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92" fill="#4285F4"/></svg><span>Connexion</span></button><div id="firebase-user-info" class="firebase-user-info hidden"><img id="firebase-user-avatar" src="" alt=""><span id="firebase-user-name"></span><button id="firebase-logout-btn">X</button></div>';
        if (placeholder) placeholder.appendChild(loginContainer); else hubHeader.appendChild(loginContainer);
        this.setupLoginEvents();
    }




    /**
     * Crée un bouton flottant si pas de header
     */
    createFloatingLoginButton() {
        const floatingBtn = document.createElement('div');
        floatingBtn.id = 'firebase-floating-login';
        floatingBtn.className = 'firebase-floating-login';
        floatingBtn.innerHTML = `
            <button id="firebase-login-btn" class="firebase-login-btn floating">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
            </button>
            <div id="firebase-user-info" class="firebase-user-info hidden">
                <img id="firebase-user-avatar" class="firebase-user-avatar" src="" alt="">
                <button id="firebase-logout-btn" class="firebase-logout-btn" title="Déconnexion">✕</button>
            </div>
        `;
        document.body.appendChild(floatingBtn);
        this.setupLoginEvents();
    }

    /**
     * Configure les événements de connexion
     */
    setupLoginEvents() {
        const loginBtn = document.getElementById('firebase-login-btn');
        const logoutBtn = document.getElementById('firebase-logout-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', async () => {
                audioService.buttonClick();
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<span>Connexion...</span>';

                const user = await signInWithGoogle();

                if (!user) {
                    // Restaurer le bouton si échec ou annulation
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Connexion</span>
                    `;
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                audioService.buttonClick();
                await logOut();
            });
        }
    }

    /**
     * Met à jour l'UI de connexion
     */
    updateLoginUI(user, isLoggedIn) {
        const loginBtn = document.getElementById('firebase-login-btn');
        const userInfo = document.getElementById('firebase-user-info');
        const userAvatar = document.getElementById('firebase-user-avatar');
        const userName = document.getElementById('firebase-user-name');

        if (isLoggedIn && user) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userInfo) {
                userInfo.classList.remove('hidden');
                if (userAvatar) userAvatar.src = user.photoURL || '';
                if (userName) userName.textContent = user.displayName?.split(' ')[0] || 'Joueur';
            }
            audioService.confirm();
        } else {
            if (loginBtn) {
                loginBtn.classList.remove('hidden');
                loginBtn.disabled = false;
            }
            if (userInfo) userInfo.classList.add('hidden');
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
