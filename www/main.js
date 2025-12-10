// ============================================
// POINT D'ENTRÉE PRINCIPAL - SNAKE ULTRA
// Chargement optimisé avec Vite
// ============================================

// Import des modules dans l'ordre de dépendance
// (ordre critique pour éviter les erreurs de référence)

// 1. Services de base (pas de dépendances)
import { logger } from './services/logger.js';

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
await import('./managers/ModalManager.js');  // ✅ Modales pour remplacer alert()
await import('./managers/CleanupManager.js');  // ✅ Gestion mémoire centralisée

// ============================================
// PHASE 3: Managers UI (peuvent être statiques)
// ============================================
await import('./ScreenManager.js');
await import('./BackgroundManager.js');
await import('./AudioManager.js');
await import('./NotificationManager.js');
await import('./hub-manager.js');
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

// Log de démarrage
logger.log('🐍 Snake Ultra - Deluxe Edition');
logger.log('📦 Bundled with Vite');
logger.log('✅ All modules loaded');

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
