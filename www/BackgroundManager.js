import { logger } from './services/logger.js';
import { SnakeUltra } from './SnakeUltra.js';

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

        // ✅ Utilisation des nouveaux fichiers .webp
        this.config = {
            menu: 'assets/backgrounds/backgrounds_generique.webp',
            hub: 'assets/backgrounds/backgrounds_generique.webp',
            'multiplayer-menu': 'assets/backgrounds/backgrounds_generique.webp',
            'lobby-screen': 'assets/backgrounds/backgrounds_versus.webp',
            'main-lobby-screen': 'assets/backgrounds/backgrounds_versus.webp',
            'game-solo': 'assets/backgrounds/backgrounds_generique.webp',
            'game-ai': 'assets/backgrounds/backgrounds_generique.webp',
            'game-multi': 'assets/backgrounds/backgrounds_versus.webp',
            'stats-screen': 'assets/backgrounds/backgrounds_generique.webp',
            over: 'assets/backgrounds/backgrounds_generique.webp',
            gameover: 'assets/backgrounds/backgrounds_generique.webp',
            // Thèmes du hub (bannières)
            'hub-ice': 'assets/backgrounds/backgrounds_glace_hub.webp',
            'hub-fire': 'assets/backgrounds/backgrounds_feu_hub.webp',
            'hub-lightning': 'assets/backgrounds/backgrounds_foudre_hub.webp',
            'hub-rock': 'assets/backgrounds/backgrounds_roche_hub.webp'
        };
    }

    /**
     * Précharge toutes les images de fond
     * @returns {Promise} Résolu quand toutes les images sont chargées
     */
    preloadAll() {
        if (this.debug) logger.log('[BackgroundManager] Préchargement des images...');

        const promises = Object.entries(this.config).map(([key, path]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.backgrounds[key] = path;
                    if (this.debug) logger.log(`[BackgroundManager] ✅ ${key}: ${path}`);
                    resolve();
                };
                img.onerror = () => {
                    if (this.debug) logger.warn(`[BackgroundManager] ❌ Échec: ${key} (${path})`);
                    resolve(); // On continue même si une image échoue
                };
                img.src = path;
            });
        });

        return Promise.all(promises).then(() => {
            this.preloaded = true;
            if (this.debug) logger.log('[BackgroundManager] Toutes les images sont préchargées');
        });
    }

    /**
     * Définit le fond d'écran actif
     * Modifie directement le CSS du body
     * @param {string} screenName - Nom de l'écran (menu, game-solo, game-multi, gameover, loading)
     */
    setBackground(screenName) {
        if (!this.backgrounds[screenName]) {
            if (this.debug) logger.warn(`[BackgroundManager] Background introuvable: ${screenName}`);
            return;
        }

        if (this.currentBackground === screenName) {
            if (this.debug) logger.log(`[BackgroundManager] Background déjà actif: ${screenName}`);
            return; // Déjà affiché
        }

        const imagePath = this.backgrounds[screenName];

        // Appliquer sur .phone
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.backgroundImage = `url('${imagePath}')`;
            phone.style.backgroundSize = 'cover';
            phone.style.backgroundPosition = 'center center';
            phone.style.backgroundRepeat = 'no-repeat';
        }

        this.currentBackground = screenName;
        if (this.debug) logger.log(`[BackgroundManager] ✅ Background activé: ${screenName}`);
    }

    /**
     * Ajoute un nouveau fond d'écran personnalisé
     * @param {string} name - Nom du fond
     * @param {string} path - Chemin vers l'image
     */
    addBackground(name, path) {
        this.config[name] = path;
        this.backgrounds[name] = path;
        if (this.debug) logger.log(`[BackgroundManager] Background ajouté: ${name} → ${path}`);
    }

    /**
     * Change le thème du hub selon la bannière équipée
     * @param {string|null} bannerId - ID de la bannière ('banner_ice', 'banner_fire', etc.) ou null pour défaut
     */
    setHubTheme(bannerId) {
        // Mapping bannière → clé de background
        const themeMap = {
            'banner_ice': 'hub-ice',
            'banner_fire': 'hub-fire',
            'banner_lightning': 'hub-lightning',
            'banner_rock': 'hub-rock'
        };

        const themeKey = bannerId ? themeMap[bannerId] : null;

        if (themeKey && this.backgrounds[themeKey]) {
            // Forcer le changement (bypass le check "déjà actif")
            this.currentBackground = null;
            this.setBackground(themeKey);
            if (this.debug) logger.log(`[BackgroundManager] Thème hub appliqué: ${themeKey}`);
        } else {
            // Revenir au défaut
            this.currentBackground = null;
            this.setBackground('hub');
            if (this.debug) logger.log(`[BackgroundManager] Thème hub par défaut`);
        }
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
        if (this.debug) logger.log('[BackgroundManager] Background masqué');
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
        if (this.debug) logger.log('[BackgroundManager] Background affiché');
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
        if (this.debug) logger.log('[BackgroundManager] Background effacé');
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
const backgroundManager = new BackgroundManager();
window.backgroundManager = backgroundManager;

// Attacher au namespace
SnakeUltra.managers.background = backgroundManager;
