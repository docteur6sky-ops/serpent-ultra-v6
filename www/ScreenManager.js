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
        } else {
            console.warn(`⚠️ [ScreenManager] Écran "${screenId}" introuvable`);
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
