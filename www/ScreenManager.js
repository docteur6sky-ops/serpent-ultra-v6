import { logger } from './services/logger.js';
import { SnakeUltra } from './SnakeUltra.js';
import { state } from './services/StateManager.js';
import { CleanupManager } from './managers/CleanupManager.js';

/**
 * ScreenManager - Gestionnaire centralisé pour tous les écrans
 *
 * Gère l'affichage de tous les écrans et overlays du jeu.
 * Architecture propre qui évite les conflits et facilite le debugging.
 *
 * Usage:
 *   window.screenManager.show('menu');
 *   window.screenManager.registerOverlay('my-overlay-id');
 *   window.diagScreen(); // Diagnostic
 */

class ScreenManager {
    constructor() {
        this.currentScreen = null;
        this.overlays = new Set();
        // ONLY main screens - sub-menus are managed by showMenu/hideAllMenus
        this.screens = [
            'loading',
            'menu',
            'hub',  // ✅ NOUVEAU HUB AAA
            'box-screen',  // ✅ MA BOX (collection d'items)
            'stats-screen',  // ✅ STATS/CARRIÈRE AAA
            'multiplayer-menu',
            'main-lobby-screen',  // ✅ LOBBY PRINCIPAL
            'lobby-screen',
            'game-solo',
            'game-ai',  // ✅ MODE CONTRE IA
            'game-multi',
            'over',
            'over-ai',  // ✅ GAME OVER MODE IA
            'menu-boss-rush',  // ✅ BOSS RUSH - Menu
            'over-boss-rush'   // ✅ BOSS RUSH - Game Over
        ];

        logger.log('🖥️ [ScreenManager] ScreenManager initialisé');
    }

    /**
     * Affiche un écran spécifique
     * @param {string} screenId - ID de l'écran à afficher
     */
    show(screenId) {
        logger.log(`🖥️ [ScreenManager] show("${screenId}") appelé`);

        // ✅ CLEANUP HUB - Nettoyer le timer du coffre si on quitte le hub
        if (this.currentScreen === 'hub' && screenId !== 'hub' && window.cleanupChestTimer) {
            window.cleanupChestTimer();
        }

        // ✅ CLEANUP JEUX - Nettoyer les timers des jeux en cours (via StateManager)
        if (this.currentScreen === 'game-solo' && screenId !== 'game-solo') {
            if (state.soloGame?.cleanupAllTimers) {
                state.soloGame.cleanupAllTimers();
            }
            CleanupManager.cleanup('solo-game');
        }

        if (this.currentScreen === 'game-multi' && screenId !== 'game-multi') {
            if (state.multiGame?.cleanup) {
                state.multiGame.cleanup();
            }
            CleanupManager.cleanup('multi-game');
        }

        if (this.currentScreen === 'game-ai' && screenId !== 'game-ai') {
            if (state.aiGame?.cleanup) {
                state.aiGame.cleanup();
            }
            CleanupManager.cleanup('ai-game');
        }

        // Nettoyer d'abord
        this.cleanupAll();
        this.hideAll();

        // Changer le fond d'écran selon l'écran
        if (window.backgroundManager) {
            window.backgroundManager.setBackground(screenId);
        }

        // Changer l'audio selon l'écran (sauf pour game-multi)
        // La musique de game-multi sera lancée manuellement au countdown GO
        // ✅ Ne pas lancer la musique pendant le loading screen
        if (window.audioManager && screenId !== 'game-multi' && window.loadingComplete) {
            window.audioManager.setAudio(screenId);
        }

        // Afficher l'écran demandé
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
            // Écrans avec display: flex pour centrage
            const flexScreens = ['over-boss-rush', 'menu-boss-rush'];
            screen.style.display = flexScreens.includes(screenId) ? 'flex' : '';
            screen.style.visibility = 'visible';
            screen.style.opacity = '1';
            screen.style.zIndex = '1';

            this.currentScreen = screenId;
            logger.log(`🖥️ [ScreenManager]   - ${screenId} affiché`);

            // ✅ TRACKING ÉCRANS VISITÉS (pour trophée "Explorateur")
            this.trackScreenVisit(screenId);

            // ✅ INIT HUB - Initialiser les données dynamiques du hub
            if (screenId === 'hub' && window.initHub) {
                setTimeout(() => window.initHub(), 100);
            }
        } else {
            logger.warn(`⚠️ [ScreenManager] Écran "${screenId}" introuvable`);
        }
    }

    /**
     * Track les écrans visités (pour trophée "Explorateur")
     * @param {string} screenId - ID de l'écran visité
     */
    trackScreenVisit(screenId) {
        // Charger la career
        if (!window.load) return; // Sécurité: attendre que snake.js soit chargé

        let career = window.load('career', {});

        // Initialiser screensVisited si besoin
        if (!career.screensVisited) {
            career.screensVisited = [];
        }

        // Mapper les IDs d'écrans vers les noms trackés pour le trophée
        const screenMapping = {
            'menu': 'hub',
            'hub': 'hub',
            'game-solo': 'game-solo',
            'game-multi': 'game-multi',
            'game-ai': 'game-ai',
            'multiplayer-menu': 'multiplayer-menu',
            'main-lobby-screen': 'main-lobby-screen',
            'box-screen': 'box-screen',
            'stats-screen': 'stats-screen',
            'options-menu': 'options-menu',
            'rules-menu': 'rules-menu',
            'credits-menu': 'credits-menu'
        };

        const trackedName = screenMapping[screenId];

        // Si c'est un écran à tracker et qu'il n'est pas déjà visité
        if (trackedName && !career.screensVisited.includes(trackedName)) {
            career.screensVisited.push(trackedName);
            window.save('career', career);

            // ✅ SYNC avec window.career pour que TROPHIES.check() voit les changements
            if (window.career) {
                window.career.screensVisited = career.screensVisited;
            }

            logger.log(`🗺️ [ScreenManager] Écran visité: ${trackedName} (Total: ${career.screensVisited.length}/6)`);
            logger.log(`🗺️ [ScreenManager] Écrans visités: ${career.screensVisited.join(', ')}`);

            // Vérifier les trophées
            if (window.checkTrophy) {
                window.checkTrophy();
            }
        }
    }

    /**
     * Cache tous les écrans
     */
    hideAll() {
        logger.log('🖥️ [ScreenManager] hideAll() - Masquage de tous les écrans');

        this.screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.style.opacity = '0';
                element.style.zIndex = '-9999';
                logger.log(`🖥️ [ScreenManager]   - ${id} caché`);
            }
        });
    }

    /**
     * Enregistre un overlay dynamique pour tracking
     * @param {string} overlayId - ID de l'overlay à tracker
     */
    registerOverlay(overlayId) {
        this.overlays.add(overlayId);
        logger.log(`🖥️ [ScreenManager] Overlay "${overlayId}" enregistré`);
    }

    /**
     * Nettoie tous les overlays dynamiques
     */
    cleanupAll() {
        logger.log('🖥️ [ScreenManager] cleanupAll() - Nettoyage des overlays');

        this.overlays.forEach(id => {
            // ✅ FIX: Ne JAMAIS supprimer countdown-overlay (élément HTML permanent)
            if (id === 'countdown-overlay') {
                logger.warn(`⚠️ [ScreenManager] countdown-overlay ne doit PAS être enregistré - ignoré`);
                return;
            }

            const element = document.getElementById(id);
            if (element) {
                element.remove();
                logger.log(`🧹 [ScreenManager] Overlay "${id}" supprimé`);
            }
        });

        // ✅ FIX: Retirer countdown-overlay du Set si présent
        this.overlays.delete('countdown-overlay');
        this.overlays.clear();

        // Nettoyer les notifications actives (fuites mémoire)
        if (window.NotificationManager) {
            window.NotificationManager.cleanup();
        }
    }

    /**
     * Diagnostic complet de l'état des écrans
     * À utiliser dans la console: window.diagScreen()
     */
    diagnostic() {
        logger.log('═══════════════════════════════════════════════════════');
        logger.log('🔍 DIAGNOSTIC SCREENMANAGER');
        logger.log('═══════════════════════════════════════════════════════');
        logger.log(`📌 Écran actuel: ${this.currentScreen || 'AUCUN'}`);
        logger.log(`📌 Overlays enregistrés: ${this.overlays.size}`);

        if (this.overlays.size > 0) {
            logger.log('   Liste:', Array.from(this.overlays));
        }

        logger.log('\n📊 État des écrans:');
        this.screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const isVisible = !el.classList.contains('hidden');
                const display = window.getComputedStyle(el).display;
                const opacity = window.getComputedStyle(el).opacity;
                const zIndex = window.getComputedStyle(el).zIndex;

                logger.log(`   ${isVisible ? '✅' : '❌'} ${id}:`);
                logger.log(`      - display: ${display}`);
                logger.log(`      - opacity: ${opacity}`);
                logger.log(`      - z-index: ${zIndex}`);
                logger.log(`      - classList: ${el.classList}`);
            } else {
                logger.log(`   ⚠️ ${id}: INTROUVABLE`);
            }
        });

        logger.log('\n🔍 Overlays dans le DOM:');
        ['mp-waiting-overlay', 'mp-gameover-overlay', 'mp-message', 'mp-lobby'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                logger.log(`   ⚠️ ${id} existe encore dans le DOM !`);
            }
        });

        logger.log('═══════════════════════════════════════════════════════');
    }
}

// ============================================
// INITIALISATION GLOBALE
// ============================================

// Créer l'instance globale
const screenManager = new ScreenManager();
window.screenManager = screenManager;

// Attacher au namespace
SnakeUltra.managers.screen = screenManager;

// Exposer la fonction de diagnostic
window.diagScreen = () => window.screenManager.diagnostic();

logger.log('✅ ScreenManager chargé');
logger.log('💡 Utilise window.diagScreen() pour diagnostiquer');
