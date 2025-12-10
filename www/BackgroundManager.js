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
            // Boss Rush (utilise gradient inline, pas besoin d'image)
            'menu-boss-rush': null,
            'over-boss-rush': null,
            // Thèmes du hub (bannières)
            'hub-ice': 'assets/backgrounds/backgrounds_glace_hub.webp',
            'hub-fire': 'assets/backgrounds/backgrounds_feu_hub.webp',
            'hub-lightning': 'assets/backgrounds/backgrounds_foudre_hub.webp',
            'hub-rock': 'assets/backgrounds/backgrounds_roche_hub.webp',
            // Backgrounds dynamiques par stage (Roguelike, Solo, Boss Rush)
            'stage-rock': 'assets/backgrounds/roche_background.webp',      // Stages 1-5, Boss 1
            'stage-ice': 'assets/backgrounds/glace_background.webp',       // Stages 6-10, Boss 2
            'stage-ghost': 'assets/backgrounds/ghost_background.webp',     // Stages 11-15, Boss 3
            'stage-lightning': 'assets/backgrounds/foudre_background.webp' // Stages 16-20, Boss 4
        };
    }

    /**
     * Précharge toutes les images de fond
     * @returns {Promise} Résolu quand toutes les images sont chargées
     */
    preloadAll() {
        if (this.debug) logger.log('[BackgroundManager] Préchargement des images...');

        const promises = Object.entries(this.config).map(([key, path]) => {
            // Ignorer les écrans qui gèrent leur propre fond (path === null)
            if (path === null) {
                if (this.debug) logger.log(`[BackgroundManager] ⏭️ ${key}: gère son propre fond`);
                return Promise.resolve();
            }

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
        // Vérifier si l'écran existe dans la config
        if (!(screenName in this.config)) {
            if (this.debug) logger.warn(`[BackgroundManager] Background introuvable: ${screenName}`);
            return;
        }

        // Les écrans avec config null gèrent leur propre fond (pas d'action requise)
        if (this.config[screenName] === null) {
            if (this.debug) logger.log(`[BackgroundManager] ${screenName} gère son propre fond`);
            return;
        }

        if (!this.backgrounds[screenName]) {
            if (this.debug) logger.warn(`[BackgroundManager] Background non préchargé: ${screenName}`);
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
     * Change le background selon le stage de jeu (Roguelike, Solo, Boss Rush)
     * @param {number} stage - Numéro du stage (1-20) ou boss (1-4)
     * @param {string} mode - 'roguelike', 'solo', ou 'boss-rush'
     */
    setStageBackground(stage, mode = 'roguelike') {
        let backgroundKey;
        let imagePath;

        if (mode === 'boss-rush') {
            // Boss Rush : 1 background par boss (1-4)
            const bossBackgrounds = {
                1: { key: 'stage-rock', path: 'assets/backgrounds/roche_background.webp' },
                2: { key: 'stage-ice', path: 'assets/backgrounds/glace_background.webp' },
                3: { key: 'stage-ghost', path: 'assets/backgrounds/ghost_background.webp' },
                4: { key: 'stage-lightning', path: 'assets/backgrounds/foudre_background.webp' }
            };
            const bg = bossBackgrounds[stage] || bossBackgrounds[1];
            backgroundKey = bg.key;
            imagePath = bg.path;
        } else {
            // Roguelike ou Solo : par paliers de 5 stages
            if (stage <= 5) {
                backgroundKey = 'stage-rock';
                imagePath = 'assets/backgrounds/roche_background.webp';
            } else if (stage <= 10) {
                backgroundKey = 'stage-ice';
                imagePath = 'assets/backgrounds/glace_background.webp';
            } else if (stage <= 15) {
                backgroundKey = 'stage-ghost';
                imagePath = 'assets/backgrounds/ghost_background.webp';
            } else {
                backgroundKey = 'stage-lightning';
                imagePath = 'assets/backgrounds/foudre_background.webp';
            }
        }

        // Appliquer directement le background (bypass préchargement)
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.backgroundImage = `url('${imagePath}')`;
            phone.style.backgroundSize = 'cover';
            phone.style.backgroundPosition = 'center center';
            phone.style.backgroundRepeat = 'no-repeat';
        }

        // 🎨 Changer aussi l'image de fond dans l'écran de jeu (#game-solo .game-bg-image)
        const bgImage = document.querySelector('#game-solo .game-bg-image');
        if (bgImage) {
            bgImage.src = imagePath;
        }

        this.currentBackground = backgroundKey;
        if (this.debug) logger.log(`[BackgroundManager] Stage background: ${backgroundKey} (stage ${stage}, mode ${mode})`);
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
