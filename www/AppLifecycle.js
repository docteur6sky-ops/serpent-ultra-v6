// ═══════════════════════════════════════════════════════════
// APP LIFECYCLE - Pause/Resume automatique mobile
// ═══════════════════════════════════════════════════════════

// Debug mode (mettre à true pour activer les logs)
const DEBUG_LIFECYCLE = false;
const logLife = (...args) => DEBUG_LIFECYCLE && console.log(...args);

class AppLifecycle {
    constructor() {
        this.isAppActive = true;
        this.gameWasRunning = false;
        this.initialized = false;  // ✅ NOUVEAU FLAG

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

            logLife('✅ AppLifecycle : Capacitor listeners actifs');
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

        // ✅ VÉRIFIER SI LE JEU SOLO EST ACTIF
        if (window.soloGame) {
            const isRunning = window.soloGame.running;
            const isPaused = window.soloGame.paused;

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
                    window.soloGame.pause();
                }
            } else {
                this.gameWasRunning = false;
                logLife('🎮 Jeu déjà en pause ou arrêté, rien à faire');
            }
        } else if (window.multiGame && window.multiGame.isActive) {
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
