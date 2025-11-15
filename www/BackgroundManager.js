/**
 * BackgroundManager - Gère les fonds d'écran de l'application
 * Modifie directement le CSS du body pour afficher les backgrounds
 */

class BackgroundManager {
    constructor() {
        this.backgrounds = {};
        this.currentBackground = null;
        this.preloaded = false;
        this.debug = true;

        this.config = {
            menu: 'assets/backgrounds/menu.jpg',
            'lobby-screen': 'assets/backgrounds/gameover.jpg',  // ✅ Lobby = fond gameover (calme)
            'game-solo': 'assets/backgrounds/game.jpg',
            'game-multi': 'assets/backgrounds/game.jpg',
            over: 'assets/backgrounds/gameover.jpg',
            gameover: 'assets/backgrounds/gameover.jpg',
            loading: 'assets/backgrounds/loading.jpg'
        };
    }

    /**
     * Précharge toutes les images de fond
     * @returns {Promise} Résolu quand toutes les images sont chargées
     */
    preloadAll() {
        if (this.debug) console.log('[BackgroundManager] Préchargement des images...');

        const promises = Object.entries(this.config).map(([key, path]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.backgrounds[key] = path;
                    if (this.debug) console.log(`[BackgroundManager] ✅ ${key}: ${path}`);
                    resolve();
                };
                img.onerror = () => {
                    if (this.debug) console.warn(`[BackgroundManager] ❌ Échec: ${key} (${path})`);
                    resolve(); // On continue même si une image échoue
                };
                img.src = path;
            });
        });

        return Promise.all(promises).then(() => {
            this.preloaded = true;
            if (this.debug) console.log('[BackgroundManager] Toutes les images sont préchargées');
        });
    }

    /**
     * Définit le fond d'écran actif
     * Modifie directement le CSS du body
     * @param {string} screenName - Nom de l'écran (menu, game-solo, game-multi, gameover, loading)
     */
    setBackground(screenName) {
        if (!this.backgrounds[screenName]) {
            if (this.debug) console.warn(`[BackgroundManager] Background introuvable: ${screenName}`);
            return;
        }

        if (this.currentBackground === screenName) {
            if (this.debug) console.log(`[BackgroundManager] Background déjà actif: ${screenName}`);
            return; // Déjà affiché
        }

        const imagePath = this.backgrounds[screenName];

        // ✅ SOLUTION FINALE : Appliquer sur .phone (qui bouge quand body scroll)
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.backgroundImage = `url('${imagePath}')`;
            phone.style.backgroundSize = 'cover';
            phone.style.backgroundPosition = 'center center';
            phone.style.backgroundRepeat = 'no-repeat';
            phone.style.backgroundAttachment = 'scroll';
        }

        // Ne plus toucher document.body

        this.currentBackground = screenName;
        if (this.debug) console.log(`[BackgroundManager] ✅ Background activé: ${screenName}`);
    }

    /**
     * Ajoute un nouveau fond d'écran personnalisé
     * @param {string} name - Nom du fond
     * @param {string} path - Chemin vers l'image
     */
    addBackground(name, path) {
        this.config[name] = path;
        this.backgrounds[name] = path;
        if (this.debug) console.log(`[BackgroundManager] Background ajouté: ${name} → ${path}`);
    }

    /**
     * Masque le fond d'écran (fade out)
     */
    hide() {
        if (document.body) {
            document.body.style.transition = 'opacity 0.3s ease-in-out';
            document.body.style.opacity = '0';
        }
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.transition = 'opacity 0.3s ease-in-out';
            phone.style.opacity = '0';
        }
        if (this.debug) console.log('[BackgroundManager] Background masqué');
    }

    /**
     * Affiche le fond d'écran (fade in)
     */
    show() {
        if (document.body) {
            document.body.style.transition = 'opacity 0.3s ease-in-out';
            document.body.style.opacity = '1';
        }
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.transition = 'opacity 0.3s ease-in-out';
            phone.style.opacity = '1';
        }
        if (this.debug) console.log('[BackgroundManager] Background affiché');
    }

    /**
     * Supprime le fond d'écran
     */
    clear() {
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.backgroundImage = 'none';
        }
        this.currentBackground = null;
        if (this.debug) console.log('[BackgroundManager] Background effacé');
    }

    /**
     * Active/désactive le mode debug
     * @param {boolean} enabled
     */
    setDebug(enabled) {
        this.debug = enabled;
    }
}

// Instance globale
window.backgroundManager = new BackgroundManager();
