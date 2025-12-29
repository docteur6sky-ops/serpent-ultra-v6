/**
 * SNAKE ULTRA - Registre Central
 *
 * Centralise toutes les références globales pour:
 * - Éviter la pollution de window.*
 * - Faciliter les imports ES6
 * - Améliorer la testabilité
 *
 * Usage:
 *   import { SnakeUltra } from './SnakeUltra.js';
 *   SnakeUltra.managers.audio.playSound('click');
 *
 * Alias global:
 *   window.app.managers.screen.show('hub');
 */

import { logger } from './services/logger.js';

class SnakeUltraApp {
    constructor() {
        // Managers (singletons)
        this.managers = {
            screen: null,      // ScreenManager
            audio: null,       // AudioManager
            background: null,  // BackgroundManager
            event: null,       // EventManager
            box: null,         // BoxManager
            chest: null,       // ChestManager
            booster: null,     // BoosterManager
            trophy: null,      // TrophyManager
            grade: null,       // GradeManager
            leaderboard: null, // LeaderboardManager
            progression: null, // ProgressionManager
            career: null,      // CareerManager
            notification: null,// NotificationManager
            modal: null,       // ModalManager
            cleanup: null      // CleanupManager
        };

        // Instances de jeu (peuvent changer)
        this.games = {
            solo: null,        // SoloSnakeGame
            ai: null,          // AISnakeGame
            multi: null,       // MultiplayerSnakeGame
            roguelike: null    // RoguelikeManager
        };

        // Services (utilitaires)
        this.services = {
            logger: logger,
            audio: null,       // window.audio (raccourci)
            security: null,    // SecurityManager
            storage: null      // Storage utils
        };

        // Données partagées
        this.data = {
            career: null,      // Données carrière joueur
            trophies: null,    // Liste des trophées
            config: null       // Configuration
        };

        // Contrôleurs UI (fonctions de navigation)
        this.ui = {
            // Navigation
            backToMain: null,
            showOptions: null,
            showDifficulty: null,
            showMultiplayer: null,
            // Hub
            initHub: null,
            updatePlayerInfo: null,
            // Box
            openBox: null,
            closeBox: null
        };

        // Fonctions de jeu
        this.actions = {
            // Solo
            startSolo: null,
            pauseSolo: null,
            resumeSolo: null,
            // Multi
            startMulti: null,
            // AI
            startAI: null
        };

        // État global
        this.state = {
            currentScreen: 'loading',
            soundEnabled: true,
            initialized: false,
            loadingComplete: false
        };

        logger.debug('[SnakeUltra] Registre créé');
    }

    /**
     * Enregistre un manager
     * @param {string} name - Nom du manager
     * @param {object} instance - Instance du manager
     */
    registerManager(name, instance) {
        if (this.managers.hasOwnProperty(name)) {
            this.managers[name] = instance;
            logger.debug(`[SnakeUltra] Manager '${name}' enregistré`);
        } else {
            logger.warn(`[SnakeUltra] Manager inconnu: ${name}`);
        }
    }

    /**
     * Enregistre un service
     * @param {string} name - Nom du service
     * @param {object} instance - Instance du service
     */
    registerService(name, instance) {
        if (this.services.hasOwnProperty(name)) {
            this.services[name] = instance;
            logger.debug(`[SnakeUltra] Service '${name}' enregistré`);
        } else {
            logger.warn(`[SnakeUltra] Service inconnu: ${name}`);
        }
    }

    /**
     * Enregistre une instance de jeu
     * @param {string} name - Nom du jeu (solo, ai, multi, roguelike)
     * @param {object} instance - Instance du jeu
     */
    registerGame(name, instance) {
        if (this.games.hasOwnProperty(name)) {
            this.games[name] = instance;
            logger.debug(`[SnakeUltra] Game '${name}' enregistré`);
        } else {
            logger.warn(`[SnakeUltra] Game inconnu: ${name}`);
        }
    }

    /**
     * Raccourci pour accéder aux managers courants
     */
    get audio() { return this.managers.audio; }
    get screen() { return this.managers.screen; }
    get box() { return this.managers.box; }

    /**
     * Initialisation de l'application
     */
    init() {
        if (this.state.initialized) {
            logger.warn('[SnakeUltra] Déjà initialisé');
            return;
        }

        this.state.initialized = true;
        logger.log('[SnakeUltra] ✅ Initialisé');
    }

    /**
     * Synchronise le registre avec les variables window.* existantes
     * Appelé après le chargement de tous les modules
     */
    sync() {
        logger.log('[SnakeUltra] Synchronisation avec window.*...');

        // Managers
        if (window.screenManager) this.managers.screen = window.screenManager;
        if (window.audioManager) this.managers.audio = window.audioManager;
        if (window.backgroundManager) this.managers.background = window.backgroundManager;
        if (window.boxManager) this.managers.box = window.boxManager;
        if (window.chestManager) this.managers.chest = window.chestManager;
        if (window.boosterManager) this.managers.booster = window.boosterManager;
        if (window.trophyManager) this.managers.trophy = window.trophyManager;
        if (window.gradeManager) this.managers.grade = window.gradeManager;
        if (window.leaderboardManager) this.managers.leaderboard = window.leaderboardManager;
        if (window.progressionManager) this.managers.progression = window.progressionManager;
        if (window.NotificationManager) this.managers.notification = window.NotificationManager;
        if (window.ModalManager) this.managers.modal = window.ModalManager;
        if (window.CleanupManager) this.managers.cleanup = window.CleanupManager;

        // Games
        if (window.soloGame) this.games.solo = window.soloGame;
        if (window.aiGame) this.games.ai = window.aiGame;
        if (window.multiGame) this.games.multi = window.multiGame;
        if (window.roguelikeManager) this.games.roguelike = window.roguelikeManager;

        // Services
        if (window.audio) this.services.audio = window.audio;

        // UI Functions
        if (window.backToMain) this.ui.backToMain = window.backToMain;
        if (window.showOptions) this.ui.showOptions = window.showOptions;
        if (window.showDifficulty) this.ui.showDifficulty = window.showDifficulty;
        if (window.showMultiplayer) this.ui.showMultiplayer = window.showMultiplayer;
        if (window.initHub) this.ui.initHub = window.initHub;
        if (window.updatePlayerInfo) this.ui.updatePlayerInfo = window.updatePlayerInfo;
        if (window.openBox) this.ui.openBox = window.openBox;
        if (window.closeBox) this.ui.closeBox = window.closeBox;

        // Actions
        if (window.start) this.actions.startSolo = window.start;
        if (window.pauseSolo) this.actions.pauseSolo = window.pauseSolo;
        if (window.resumeSolo) this.actions.resumeSolo = window.resumeSolo;
        if (window.startLocalMultiplayer) this.actions.startMulti = window.startLocalMultiplayer;
        if (window.startAIGame) this.actions.startAI = window.startAIGame;

        // Data
        if (window.career) this.data.career = window.career;

        // State
        this.state.loadingComplete = window.loadingComplete || false;

        logger.log('[SnakeUltra] ✅ Synchronisation terminée');
        this.diagnostic();
    }

    /**
     * Diagnostic: affiche l'état du registre
     */
    diagnostic() {
        const managersCount = Object.values(this.managers).filter(m => m !== null).length;
        const gamesCount = Object.values(this.games).filter(g => g !== null).length;
        const uiCount = Object.values(this.ui).filter(u => u !== null).length;
        const actionsCount = Object.values(this.actions).filter(a => a !== null).length;

        logger.log('═══════════════════════════════════════════════════════');
        logger.log('[SnakeUltra] DIAGNOSTIC');
        logger.log('═══════════════════════════════════════════════════════');
        logger.log(`Managers: ${managersCount}/${Object.keys(this.managers).length}`);
        logger.log(`Games: ${gamesCount}/${Object.keys(this.games).length}`);
        logger.log(`UI: ${uiCount}/${Object.keys(this.ui).length}`);
        logger.log(`Actions: ${actionsCount}/${Object.keys(this.actions).length}`);
        logger.log(`State: initialized=${this.state.initialized}, loadingComplete=${this.state.loadingComplete}`);
        logger.log('═══════════════════════════════════════════════════════');
    }
}

// Export instance unique (Singleton)
export const SnakeUltra = new SnakeUltraApp();

// Exposer globalement pour compatibilité HTML onclick
if (typeof window !== 'undefined') {
    window.SnakeUltra = SnakeUltra;

    // Alias court pour accès facile
    window.app = SnakeUltra;

    // Fonction de diagnostic en console
    window.diagApp = () => SnakeUltra.diagnostic();

    // Synchronisation automatique après chargement complet
    window.syncApp = () => SnakeUltra.sync();
}
