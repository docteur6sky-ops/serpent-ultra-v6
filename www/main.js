// ============================================
// POINT D'ENTRÉE PRINCIPAL - SNAKE ULTRA
// Chargement optimisé avec Vite
// ============================================

// Import des modules dans l'ordre de dépendance
// (ordre critique pour éviter les erreurs de référence)

// 1. Services de base (pas de dépendances)
import { logger } from './services/logger.js';
import { state } from './services/StateManager.js';
import { ErrorBoundary } from './services/ErrorBoundary.js';

// ============================================
// GESTION D'ERREUR GLOBALE
// ErrorBoundary avec déduplication et notifications user-friendly
// ============================================
ErrorBoundary.init();

// ============================================
// ACCESSIBILITÉ CLAVIER
// Permet d'activer les éléments role="button" avec Entrée/Espace
// ============================================
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target;
        if (target.getAttribute('role') === 'button' && target.onclick) {
            event.preventDefault();
            target.click();
        }
    }
});

/**
 * Import dynamique avec gestion d'erreur
 * @param {string} modulePath - Chemin du module
 * @param {string} moduleName - Nom pour le logging
 * @returns {Promise<any>}
 */
async function safeImport(modulePath, moduleName) {
    try {
        const module = await import(modulePath);
        return module;
    } catch (e) {
        logger.error(`[Main] Échec import ${moduleName}:`, e.message);
        return null;
    }
}

// ============================================
// PHASE 1: Initialisation SecurityManager + Storage
// DOIT être fait AVANT tout manager qui utilise storage.js
// ============================================
let securityManager = null;
try {
    const secModule = await import('./services/SecurityManager.js');
    securityManager = secModule.securityManager;

    const storageModule = await import('./services/storage.js');
    storageModule.initSecureStorage(securityManager);
    securityManager.initializeProtection();
    logger.log('[Main] SecurityManager initialisé');
} catch (e) {
    logger.warn('[Main] SecurityManager désactivé:', e.message);
}

// ============================================
// PHASE 2: Managers qui utilisent storage.js (imports dynamiques)
// Ces imports DOIVENT attendre que storage.js soit initialisé
// ============================================
await import('./services/CareerManager.js');  // ✅ Gestion carrière/XP/rangs
await import('./managers/TrophyManager.js');  // ✅ Gestion trophées
await import('./managers/ProgressionManager.js');  // ✅ Overlay progression XP
await import('./managers/LeaderboardManager.js');  // ✅ Scores et classement
await import('./managers/GradeManager.js');  // ✅ Grades Solo/Multi
await import('./managers/BoosterManager.js');  // ✅ Boosters XP
await import('./managers/ChestManager.js');  // ✅ Coffre quotidien
await import('./managers/BoostersTabManager.js');  // ✅ Onglet Boosters dans Box
await import('./managers/GDPRConsentManager.js');  // ✅ Consentement RGPD
await import('./managers/ModalManager.js');  // ✅ Modales pour remplacer alert()
await import('./managers/CleanupManager.js');  // ✅ Gestion mémoire centralisée

// Boutique IAP
await safeImport('./services/ShopManager.js', 'ShopManager');
await safeImport('./managers/ShopUIManager.js', 'ShopUIManager');

// ============================================
// PHASE 3: Managers UI (peuvent être statiques)
// ============================================
await import('./ScreenManager.js');
await import('./BackgroundManager.js');
await import('./AudioManager.js');
await import('./NotificationManager.js');
await import('./hub-manager.js');
await import('./managers/CarouselManager.js');  // ✅ Carrousel modes de jeu
await import('./BoxSystem.js');  // ✅ Système Box unifié (manager + UI)
await import('./chest-opening.js');  // ✅ Expérience AAA ouverture coffre
await import('./stats-manager.js');  // ✅ Gestionnaire écran Stats/Carrière

// Utilitaires
await import('./render-utils.js');

// ============================================
// PHASE 4: Classes de jeu
// ============================================
await import('./solo-game.js');
await import('./ai-game.js');
await import('./network-multiplayer.js');
await import('./main-lobby.js'); // ✅ LOBBY PRINCIPAL
await import('./multi-game.js');

// Mode Roguelike
const roguelikeModule = await import('./roguelike/index.js');
roguelikeModule.initRoguelike();

// Mode Boss Rush
await import('./modes/BossRushManager.js');
await import('./ui/boss-rush-ui.js');

// AdMob - Gestion publicités
const adMobModule = await safeImport('./services/AdMobManager.js', 'AdMobManager');
if (adMobModule) {
    // Initialiser AdMob sur mobile uniquement
    if (window.Capacitor?.isNativePlatform()) {
        adMobModule.adMobManager.init();
        logger.log('[Main] AdMob initialisé');
    } else {
        logger.log('[Main] AdMob ignoré (web)');
    }
}

// ============================================
// PHASE 5: Navigation et contrôles
// ============================================
await import('./navigation.js');
await import('./TouchControls.js');
await import('./AppLifecycle.js');

// ============================================
// PHASE 6: Initialisation principale
// ============================================
await import('./snake.js');

// Initialiser StateManager
state.init();

// Log de démarrage
logger.log('🐍 Snake Ultra - Deluxe Edition');
logger.log('📦 Bundled with Vite');
logger.log('✅ All modules loaded');

// ============================================
// FIREBASE UI - Initialisation
// ============================================
import { firebaseUI } from './services/FirebaseUI.js';

// Initialiser Firebase UI après le chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => firebaseUI.init());
} else {
    setTimeout(() => firebaseUI.init(), 100);
}
logger.log('🔥 Firebase UI module loaded');


// ✅ FIX: S'assurer que l'initialisation se fait après tous les imports dynamiques
// Le DOM est probablement déjà prêt à ce stade
if (window.init) {
    window.init();
    logger.log('✅ window.init() appelé depuis main.js');
}

// ============================================
// FIX HAUTEUR MOBILE - Calcul précis du viewport
// ============================================
// Sur mobile, 100vh inclut les barres du navigateur.
// On calcule la vraie hauteur et on la stocke dans une variable CSS --vh

function setMobileViewportHeight() {
    // Calculer 1% de la hauteur du viewport
    const vh = window.innerHeight * 0.01;
    // Définir la variable CSS --vh
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    logger.log(`📐 Viewport height set: ${window.innerHeight}px (--vh: ${vh}px)`);
}

// Initialiser au chargement
setMobileViewportHeight();

// Recalculer si l'orientation change ou si la fenêtre est redimensionnée
window.addEventListener('resize', setMobileViewportHeight);
window.addEventListener('orientationchange', setMobileViewportHeight);

// ============================================
// ÉCRAN DE CHARGEMENT VIDEO - Transition automatique
// ============================================

// ✅ Flag pour bloquer la musique pendant le loading
window.loadingComplete = false;

let loadingSkipped = false;

function hideLoadingScreen() {
    if (loadingSkipped) return; // Éviter double appel
    loadingSkipped = true;

    const loadingScreen = document.getElementById('loading');
    const video = document.getElementById('loading-video');

    if (loadingScreen) {
        // Stopper la vidéo si elle joue encore
        if (video) {
            video.pause();
        }

        loadingScreen.classList.add('fade-out');

        // Supprimer complètement après la transition
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            // Libérer la mémoire vidéo
            if (video) {
                video.src = '';
                video.load();
            }
        }, 500);

        // ✅ Marquer le loading comme terminé (autorise la musique)
        window.loadingComplete = true;

        // ✅ Vérifier le consentement RGPD avant de démarrer
        const startAfterConsent = () => {
            // Utiliser startGame() qui gère la logique du pseudo
            if (window.startGame) {
                window.startGame();
            } else if (window.screenManager) {
                // Fallback si startGame pas encore chargé
                window.screenManager.show('hub');
            }

            // ✅ Lancer la musique du menu maintenant que le loading est terminé
            if (window.audioManager) {
                window.audioManager.setAudio('hub');
            }

            // ✅ Synchroniser le registre SnakeUltra avec les variables globales
            if (window.SnakeUltra?.sync) {
                window.SnakeUltra.sync();
            }

            logger.log('🎬 Écran de chargement terminé');
        };

        // Afficher popup RGPD si premier lancement
        if (window.gdprConsentManager && !window.gdprConsentManager.hasConsent()) {
            window.gdprConsentManager.showIfNeeded(startAfterConsent);
        } else {
            startAfterConsent();
        }
    }


}

function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading');
    const video = document.getElementById('loading-video');
    const skipHint = document.getElementById('loading-skip-hint');

    if (!video) {
        // Fallback si pas de vidéo : timeout classique
        logger.log('⚠️ Vidéo loading non trouvée, fallback timeout');
        setTimeout(hideLoadingScreen, 2500);
        return;
    }

    let videoEnded = false;
    let canSkip = false;

    // La vidéo peut jouer
    video.addEventListener('canplay', () => {
        logger.log('🎬 Vidéo prête à jouer');
    });

    // À la fin de la vidéo : afficher hint et attendre clic
    video.addEventListener('ended', () => {
        logger.log('🎬 Vidéo terminée - En attente du clic');
        videoEnded = true;
        canSkip = true;
        if (skipHint) {
            skipHint.textContent = 'Appuyez pour continuer';
            skipHint.classList.add('visible');
        }
    });

    // Erreur sur la source vidéo (pas sur le poster)
    const source = video.querySelector('source');
    if (source) {
        source.addEventListener('error', () => {
            logger.log('⚠️ Erreur source vidéo, fallback timeout');
            setTimeout(hideLoadingScreen, 2500);
        });
    }

    // Afficher "Appuyez pour passer" après 2 secondes (pendant la vidéo)
    setTimeout(() => {
        if (!loadingSkipped && skipHint && !videoEnded) {
            skipHint.classList.add('visible');
        }
        canSkip = true;
    }, 2000);

    // Clic pour passer (après 2s ou après fin vidéo)
    loadingScreen.addEventListener('click', () => {
        if (canSkip && !loadingSkipped) {
            logger.log('🎬 Transition par clic');
            hideLoadingScreen();
        }
    });

    // Fallback timeout max (si vidéo bloque) - mais n'auto-skip pas
    setTimeout(() => {
        if (!loadingSkipped && !videoEnded) {
            logger.log('⚠️ Timeout max - vidéo bloquée, activation skip');
            canSkip = true;
            if (skipHint) {
                skipHint.textContent = 'Appuyez pour continuer';
                skipHint.classList.add('visible');
            }
        }
    }, 15000);
}

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoadingScreen);
} else {
    initLoadingScreen();
}
