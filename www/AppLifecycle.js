// ═══════════════════════════════════════════════════════════
// APP LIFECYCLE - Pause/Resume automatique mobile
// ═══════════════════════════════════════════════════════════

// Debug mode (mettre à true pour activer les logs)
import { logger } from './services/logger.js';
import { state } from './services/StateManager.js';
const DEBUG_LIFECYCLE = false;
const logLife = (...args) => DEBUG_LIFECYCLE && logger.log(...args);

class AppLifecycle {
    constructor() {
        this.isAppActive = true;
        this.gameWasRunning = false;
        this.initialized = false;  // ✅ NOUVEAU FLAG
        this.exitConfirmShown = false; // Pour éviter double confirmation

        logLife('🔄 AppLifecycle initialisé');
    }

    // ═══ INITIALISATION ═══
    init() {
        // ✅ GARDE : Si déjà initialisé
        if (this.initialized) {
            logLife('⚠️ AppLifecycle déjà initialisé, skip');
            return;
        }

        logLife('🔄 AppLifecycle : Configuration des listeners...');

        // ✅ CAPACITOR (si disponible)
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            const { App } = window.Capacitor.Plugins;

            App.addListener('appStateChange', (state) => {
                logLife(`🔄 Capacitor appStateChange : ${state.isActive ? 'ACTIVE' : 'BACKGROUND'}`);

                if (!state.isActive) {
                    this.onPause();
                } else {
                    this.onResume();
                }
            });

            // ✅ GESTION BOUTON RETOUR ANDROID
            App.addListener('backButton', () => {
                logLife('🔙 Bouton retour Android pressé');
                this.handleBackButton();
            });

            logLife('✅ AppLifecycle : Capacitor listeners actifs (+ backButton)');
        } else {
            logLife('⚠️ Capacitor non disponible, fallback web');
        }

        // ✅ FALLBACK WEB : Visibility API
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                logLife('🔄 Document caché (visibilitychange)');
                this.onPause();
            } else {
                logLife('🔄 Document visible (visibilitychange)');
                this.onResume();
            }
        });

        // ✅ FALLBACK WEB : Blur/Focus
        window.addEventListener('blur', () => {
            logLife('🔄 Window blur');
            this.onPause();
        });

        window.addEventListener('focus', () => {
            logLife('🔄 Window focus');
            this.onResume();
        });

        this.initialized = true;  // ✅ MARQUER INITIALISÉ
        logLife('✅ AppLifecycle : Tous les listeners configurés');
    }

    // ═══ APP EN PAUSE ═══
    onPause() {
        if (!this.isAppActive) {
            logLife('⚠️ Déjà en pause, skip');
            return;
        }

        this.isAppActive = false;
        logLife('⏸️ APP EN PAUSE');

        // ✅ VÉRIFIER SI LE JEU SOLO EST ACTIF (via StateManager)
        if (state.soloGame) {
            const isRunning = state.soloGame.running;
            const isPaused = state.soloGame.paused;

            logLife(`🎮 État solo : running=${isRunning}, paused=${isPaused}`);

            // Si le jeu tourne ET n'est pas déjà en pause
            if (isRunning && !isPaused) {
                logLife('🎮 AUTO-PAUSE : Mise en pause du jeu solo');
                this.gameWasRunning = true;

                // Utiliser window.pauseSolo() (exposé par navigation.js)
                if (window.pauseSolo) {
                    window.pauseSolo();
                } else {
                    // Fallback : appeler directement
                    state.soloGame.pause();
                }
            } else {
                this.gameWasRunning = false;
                logLife('🎮 Jeu déjà en pause ou arrêté, rien à faire');
            }
        } else if (state.multiGame?.isActive) {
            // Mode multi actif
            logLife('🎮 Mode MULTI actif (pas de pause en temps réel)');
            this.gameWasRunning = false;
        } else {
            logLife('🎮 Aucun jeu actif');
            this.gameWasRunning = false;
        }
    }

    // ═══ APP REPREND ═══
    onResume() {
        if (this.isAppActive) {
            logLife('⚠️ Déjà actif, skip');
            return;
        }

        this.isAppActive = true;
        logLife('▶️ APP REPREND');

        // NE PAS auto-reprendre le jeu
        // L'utilisateur doit appuyer manuellement sur P
        // Sécurité pour éviter reprises accidentelles

        if (this.gameWasRunning) {
            logLife('ℹ️ Jeu était en cours, mais ne reprend PAS auto (sécurité)');
            logLife('ℹ️ Appuyez sur P pour reprendre');
        }

        this.gameWasRunning = false;
    }

    // ═══ FORCER PAUSE (debug) ═══
    forcePause() {
        logLife('🔧 FORCE PAUSE (manuel)');
        this.onPause();
    }

    // ═══ FORCER RESUME (debug) ═══
    forceResume() {
        logLife('🔧 FORCE RESUME (manuel)');
        this.onResume();
    }

    // ═══ GESTION BOUTON RETOUR ANDROID ═══
    handleBackButton() {
        const currentScreen = state.getCurrentScreen();
        logLife(`🔙 handleBackButton - écran actuel: ${currentScreen}`);

        // CAS 1: En plein jeu solo → Pause
        if (currentScreen === 'game-solo' && state.soloGame?.running && !state.soloGame?.paused) {
            logLife('🔙 En jeu solo → Pause');
            if (window.pauseSolo) {
                window.pauseSolo();
            } else if (state.soloGame) {
                state.soloGame.pause();
            }
            return;
        }

        // CAS 2: En jeu multi → Retour au lobby (avec confirmation)
        if (currentScreen === 'game-multi' && window.multiplayerClient?.gameActive) {
            logLife('🔙 En jeu multi → Quitter partie');
            if (window.multiplayerClient?.leaveRoom) {
                window.multiplayerClient.leaveRoom();
            }
            if (window.backToMain) {
                window.backToMain();
            }
            return;
        }

        // CAS 3: En jeu IA → Pause ou retour
        if (currentScreen === 'game-ai' && state.aiGame?.running) {
            logLife('🔙 En jeu IA → Pause');
            if (state.aiGame.paused) {
                // Déjà en pause, retour au menu
                if (window.backToMain) window.backToMain();
            } else {
                state.aiGame.pause();
            }
            return;
        }

        // CAS 4: Écran game over → Retour au hub
        if (currentScreen === 'over' || currentScreen === 'over-ai') {
            logLife('🔙 Game over → Retour hub');
            if (window.backToMain) window.backToMain();
            return;
        }

        // CAS 5: Sous-menus → Retour au hub
        const subScreens = [
            'multiplayer-menu', 'main-lobby-screen', 'lobby-screen',
            'box-screen', 'stats-screen'
        ];
        if (subScreens.includes(currentScreen)) {
            logLife(`🔙 Sous-menu ${currentScreen} → Retour hub`);
            if (window.backToMain) window.backToMain();
            return;
        }

        // CAS 6: Hub ou menu principal → Confirmation pour quitter l'app
        if (currentScreen === 'hub' || currentScreen === 'menu') {
            logLife('🔙 Hub/Menu → Confirmation quitter');
            this.showExitConfirmation();
            return;
        }

        // CAS 7: Défaut → Retour au hub
        logLife('🔙 Défaut → Retour hub');
        if (window.backToMain) window.backToMain();
    }

    // ═══ CONFIRMATION QUITTER APP ═══
    showExitConfirmation() {
        // Éviter double affichage
        if (this.exitConfirmShown) return;
        this.exitConfirmShown = true;

        // Créer la modale de confirmation
        const overlay = document.createElement('div');
        overlay.id = 'exit-confirm-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        overlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #00FF87;
                border-radius: 16px;
                padding: 24px;
                text-align: center;
                max-width: 300px;
                box-shadow: 0 0 30px rgba(0, 255, 135, 0.3);
            ">
                <h2 style="color: #00FF87; margin: 0 0 16px 0; font-size: 1.3em;">Quitter le jeu ?</h2>
                <p style="color: #C0C0C0; margin: 0 0 24px 0;">Voulez-vous vraiment quitter Snake Ultra ?</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="exit-cancel-btn" style="
                        padding: 12px 24px;
                        background: #333;
                        color: white;
                        border: 1px solid #555;
                        border-radius: 8px;
                        font-size: 1em;
                        cursor: pointer;
                    ">Annuler</button>
                    <button id="exit-confirm-btn" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #FF6B6B 0%, #CC3636 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1em;
                        cursor: pointer;
                    ">Quitter</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Bouton Annuler
        document.getElementById('exit-cancel-btn').addEventListener('click', () => {
            overlay.remove();
            this.exitConfirmShown = false;
        });

        // Bouton Quitter
        document.getElementById('exit-confirm-btn').addEventListener('click', () => {
            overlay.remove();
            this.exitConfirmShown = false;
            // Quitter l'app via Capacitor
            if (window.Capacitor?.Plugins?.App?.exitApp) {
                window.Capacitor.Plugins.App.exitApp();
            }
        });

        // Clic en dehors = annuler
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                this.exitConfirmShown = false;
            }
        });
    }
}

// Instance globale
window.appLifecycle = new AppLifecycle();

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.appLifecycle.init(), 500);
    });
} else {
    setTimeout(() => window.appLifecycle.init(), 500);
}
