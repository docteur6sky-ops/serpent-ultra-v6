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
            'multiplayer-menu',
            'lobby-screen',
            'game-solo',
            'game-multi',
            'over'
        ];

        console.log('🖥️ [ScreenManager] ScreenManager initialisé');
    }

    /**
     * Affiche un écran spécifique
     * @param {string} screenId - ID de l'écran à afficher
     */
    show(screenId) {
        console.log(`🖥️ [ScreenManager] show("${screenId}") appelé`);

        // Nettoyer d'abord
        this.cleanupAll();
        this.hideAll();

        // Changer le fond d'écran selon l'écran
        if (window.backgroundManager) {
            window.backgroundManager.setBackground(screenId);
        }

        // Changer l'audio selon l'écran (sauf pour game-multi)
        // La musique de game-multi sera lancée manuellement au countdown GO
        if (window.audioManager && screenId !== 'game-multi') {
            window.audioManager.setAudio(screenId);
        }

        // Afficher l'écran demandé
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
            screen.style.display = '';
            screen.style.visibility = 'visible';
            screen.style.opacity = '1';
            screen.style.zIndex = '1';

            this.currentScreen = screenId;
            console.log(`🖥️ [ScreenManager]   - ${screenId} affiché`);

            // ✅ TRACKING ÉCRANS VISITÉS (pour trophée "Explorateur")
            this.trackScreenVisit(screenId);
        } else {
            console.warn(`⚠️ [ScreenManager] Écran "${screenId}" introuvable`);
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
            'menu': 'menu',
            'game-solo': 'game-solo',
            'multiplayer-menu': 'multiplayer-menu',
            'options-menu': 'options-menu',
            'rules-menu': 'rules-menu',
            'credits-menu': 'credits-menu'
        };

        const trackedName = screenMapping[screenId];

        // Si c'est un écran à tracker et qu'il n'est pas déjà visité
        if (trackedName && !career.screensVisited.includes(trackedName)) {
            career.screensVisited.push(trackedName);
            window.save('career', career);

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
        console.log('🖥️ [ScreenManager] hideAll() - Masquage de tous les écrans');

        this.screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.style.opacity = '0';
                element.style.zIndex = '-9999';
                console.log(`🖥️ [ScreenManager]   - ${id} caché`);
            }
        });
    }

    /**
     * Enregistre un overlay dynamique pour tracking
     * @param {string} overlayId - ID de l'overlay à tracker
     */
    registerOverlay(overlayId) {
        this.overlays.add(overlayId);
        console.log(`🖥️ [ScreenManager] Overlay "${overlayId}" enregistré`);
    }

    /**
     * Nettoie tous les overlays dynamiques
     */
    cleanupAll() {
        console.log('🖥️ [ScreenManager] cleanupAll() - Nettoyage des overlays');

        this.overlays.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
                console.log(`🧹 [ScreenManager] Overlay "${id}" supprimé`);
            }
        });

        this.overlays.clear();
    }

    /**
     * Diagnostic complet de l'état des écrans
     * À utiliser dans la console: window.diagScreen()
     */
    diagnostic() {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔍 DIAGNOSTIC SCREENMANAGER');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`📌 Écran actuel: ${this.currentScreen || 'AUCUN'}`);
        console.log(`📌 Overlays enregistrés: ${this.overlays.size}`);

        if (this.overlays.size > 0) {
            console.log('   Liste:', Array.from(this.overlays));
        }

        console.log('\n📊 État des écrans:');
        this.screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const isVisible = !el.classList.contains('hidden');
                const display = window.getComputedStyle(el).display;
                const opacity = window.getComputedStyle(el).opacity;
                const zIndex = window.getComputedStyle(el).zIndex;

                console.log(`   ${isVisible ? '✅' : '❌'} ${id}:`);
                console.log(`      - display: ${display}`);
                console.log(`      - opacity: ${opacity}`);
                console.log(`      - z-index: ${zIndex}`);
                console.log(`      - classList: ${el.classList}`);
            } else {
                console.log(`   ⚠️ ${id}: INTROUVABLE`);
            }
        });

        console.log('\n🔍 Overlays dans le DOM:');
        ['mp-waiting-overlay', 'mp-gameover-overlay', 'mp-message', 'mp-lobby'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                console.log(`   ⚠️ ${id} existe encore dans le DOM !`);
            }
        });

        console.log('═══════════════════════════════════════════════════════');
    }
}

// ============================================
// INITIALISATION GLOBALE
// ============================================

// Créer l'instance globale
window.screenManager = new ScreenManager();

// Exposer la fonction de diagnostic
window.diagScreen = () => window.screenManager.diagnostic();

console.log('✅ ScreenManager chargé');
console.log('💡 Utilise window.diagScreen() pour diagnostiquer');
