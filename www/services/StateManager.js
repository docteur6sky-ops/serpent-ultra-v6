/**
 * StateManager.js - Gestionnaire d'état centralisé
 *
 * Wrappe les variables globales window.* existantes sans les casser.
 * Permet une migration progressive vers un pattern plus propre.
 *
 * Usage:
 *   import { state } from './services/StateManager.js';
 *   state.soloGame  // équivalent à window.soloGame
 *   state.career    // équivalent à window.career
 */

class StateManager {
    constructor() {
        this._listeners = new Map();
        this._initialized = false;
    }

    /**
     * Initialise le StateManager (appelé une fois dans main.js)
     */
    init() {
        if (this._initialized) return;
        this._initialized = true;
        // StateManager initialized
    }

    // ============================================
    // GETTERS - Accès aux globals existants
    // ============================================

    get soloGame() {
        return window.soloGame || null;
    }

    get multiGame() {
        return window.multiGame || null;
    }

    get aiGame() {
        return window.aiGame || null;
    }

    get roguelikeManager() {
        return window.roguelikeManager || null;
    }

    get bossRushManager() {
        return window.bossRushManager || null;
    }

    get career() {
        return window.career || null;
    }

    get careerManager() {
        return window.careerManager || null;
    }

    get boxManager() {
        return window.boxManager || null;
    }

    get screenManager() {
        return window.screenManager || null;
    }

    get audioManager() {
        return window.audioManager || null;
    }

    get trophyManager() {
        return window.trophyManager || null;
    }

    get securityManager() {
        return window.securityManager || null;
    }

    // ============================================
    // SETTERS - Pour définir les globals
    // ============================================

    set soloGame(value) {
        window.soloGame = value;
        this._notify('soloGame', value);
    }

    set multiGame(value) {
        window.multiGame = value;
        this._notify('multiGame', value);
    }

    set aiGame(value) {
        window.aiGame = value;
        this._notify('aiGame', value);
    }

    set roguelikeManager(value) {
        window.roguelikeManager = value;
        this._notify('roguelikeManager', value);
    }

    set bossRushManager(value) {
        window.bossRushManager = value;
        this._notify('bossRushManager', value);
    }

    set career(value) {
        window.career = value;
        this._notify('career', value);
    }

    set careerManager(value) {
        window.careerManager = value;
        this._notify('careerManager', value);
    }

    set boxManager(value) {
        window.boxManager = value;
        this._notify('boxManager', value);
    }

    set screenManager(value) {
        window.screenManager = value;
        this._notify('screenManager', value);
    }

    set audioManager(value) {
        window.audioManager = value;
        this._notify('audioManager', value);
    }

    set trophyManager(value) {
        window.trophyManager = value;
        this._notify('trophyManager', value);
    }

    set securityManager(value) {
        window.securityManager = value;
        this._notify('securityManager', value);
    }

    // ============================================
    // OBSERVER PATTERN
    // ============================================

    /**
     * S'abonner aux changements d'un état
     * @param {string} key - Clé de l'état (ex: 'soloGame', 'career')
     * @param {Function} callback - Fonction appelée lors des changements
     * @returns {string} ID de l'abonnement (pour unsubscribe)
     */
    subscribe(key, callback) {
        if (!this._listeners.has(key)) {
            this._listeners.set(key, new Map());
        }
        const id = `${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this._listeners.get(key).set(id, callback);
        return id;
    }

    /**
     * Se désabonner d'un état
     * @param {string} subscriptionId - ID retourné par subscribe()
     */
    unsubscribe(subscriptionId) {
        const key = subscriptionId.split('_')[0];
        if (this._listeners.has(key)) {
            this._listeners.get(key).delete(subscriptionId);
        }
    }

    /**
     * Notifier les listeners d'un changement
     * @private
     */
    _notify(key, value) {
        if (this._listeners.has(key)) {
            this._listeners.get(key).forEach(callback => {
                try {
                    callback(value);
                } catch (error) {
                    console.error(`[StateManager] Error in listener for ${key}:`, error);
                }
            });
        }
    }

    // ============================================
    // UTILITAIRES
    // ============================================

    /**
     * Vérifie si un jeu est en cours
     */
    isGameRunning() {
        return (this.soloGame?.running && !this.soloGame?.paused) ||
               (this.multiGame?.isActive) ||
               (this.aiGame?.running && !this.aiGame?.paused);
    }

    /**
     * Récupère le jeu actif
     */
    getActiveGame() {
        if (this.soloGame?.running) return { type: 'solo', game: this.soloGame };
        if (this.multiGame?.isActive) return { type: 'multi', game: this.multiGame };
        if (this.aiGame?.running) return { type: 'ai', game: this.aiGame };
        return null;
    }

    /**
     * Pause tous les jeux actifs
     */
    pauseAllGames() {
        if (this.soloGame?.running && !this.soloGame?.paused) {
            this.soloGame.pause();
        }
        if (this.aiGame?.running && !this.aiGame?.paused) {
            this.aiGame.pause();
        }
        // Multi n'a pas de pause
    }

    /**
     * Obtient l'écran actuel
     */
    getCurrentScreen() {
        return this.screenManager?.currentScreen || null;
    }

    /**
     * Debug - retourne l'état actuel (utiliser en console)
     * @returns {Object}
     */
    debug() {
        return {
            soloGame: !!this.soloGame,
            multiGame: !!this.multiGame,
            aiGame: !!this.aiGame,
            roguelikeManager: !!this.roguelikeManager,
            bossRushManager: !!this.bossRushManager,
            career: this.career,
            boxManager: !!this.boxManager,
            screenManager: !!this.screenManager,
            currentScreen: this.getCurrentScreen(),
            isGameRunning: this.isGameRunning()
        };
    }
}

// Singleton exporté
export const state = new StateManager();

// Aussi exposé sur window pour compatibilité
window.stateManager = state;

export default state;
