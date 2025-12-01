import { logger } from './services/logger.js';
import { SnakeUltra } from './SnakeUltra.js';

/**
 * AudioManager - Gestion centralisée de l'audio
 * Gère les musiques de fond par écran
 */
class AudioManager {
    constructor() {
        this.audios = {};
        this.currentAudio = null;
        this.preloaded = false;
        this.volume = 0.5;
        this.muted = false;

        this.config = {
            menu: 'assets/audio/menu.mp3',
            hub: 'assets/audio/menu.mp3',  // ✅ HUB V6 = musique menu
            'lobby-screen': 'assets/audio/gameover.mp3',  // ✅ Lobby = musique gameover (calme)
            'game-solo': 'assets/audio/game.mp3',
            'game-ai': 'assets/audio/game.mp3',  // ✅ Mode IA = musique de jeu
            'game-multi': 'assets/audio/game.mp3',
            over: 'assets/audio/gameover.mp3',
            gameover: 'assets/audio/gameover.mp3'
        };

        this.log('AudioManager initialisé');
    }

    log(message, level = 'info') {
        // Debug logging désactivé (mode production)
        // Utilise window.diagAudio() pour diagnostiquer
    }

    /**
     * Précharger tous les audios
     */
    async preloadAll() {
        this.log('Préchargement des audios...');
        const promises = [];

        for (const [key, path] of Object.entries(this.config)) {
            // Éviter les doublons
            if (this.audios[key]) continue;

            promises.push(
                this.preloadAudio(key, path)
            );
        }

        await Promise.all(promises);
        this.preloaded = true;
        this.log(`✅ ${Object.keys(this.audios).length} audios préchargés`);
        return true;
    }

    /**
     * Précharger un audio
     */
    async preloadAudio(key, path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = path;
            audio.volume = this.volume;
            audio.loop = true;
            audio.muted = false; // ✅ FIX: Initialiser muted à false

            audio.addEventListener('canplaythrough', () => {
                this.audios[key] = audio;
                this.log(`"${key}" préchargé ✅`);
                resolve();
            }, { once: true });

            audio.addEventListener('error', (e) => {
                this.log(`❌ Erreur chargement "${key}": ${e.message}`, 'error');
                resolve(); // Continue même si erreur
            });

            audio.load();
        });
    }

    /**
     * Changer la musique selon l'écran
     */
    setAudio(screenId) {
        const audioKey = this.config[screenId] ? screenId : null;

        if (!audioKey) {
            this.log(`Pas d'audio pour "${screenId}"`);
            return false;
        }

        const audio = this.audios[audioKey];
        if (!audio) {
            this.log(`❌ Audio "${audioKey}" non trouvé`, 'error');
            return false;
        }

        // Si même audio, ne rien faire
        if (this.currentAudio === audio) {
            this.log(`Audio "${audioKey}" déjà actif`);
            return true;
        }

        // Arrêter l'audio actuel
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }

        // Jouer le nouvel audio
        this.currentAudio = audio;
        audio.muted = this.muted; // ✅ FIX: Synchroniser l'état muted

        if (!this.muted) {
            audio.play().catch(e => {
                this.log(`❌ Erreur play: ${e.message}`, 'error');
            });
        }

        this.log(`Audio actif: "${audioKey}" ✅`);
        return true;
    }

    /**
     * Définir le volume (0.0 à 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));

        // Appliquer à tous les audios
        Object.values(this.audios).forEach(audio => {
            audio.volume = this.volume;
        });

        this.log(`Volume: ${Math.round(this.volume * 100)}%`);
    }

    /**
     * Mute/Unmute
     */
    toggleMute() {
        this.muted = !this.muted;

        if (this.currentAudio) {
            this.currentAudio.muted = this.muted; // ✅ FIX: Synchroniser l'attribut HTML
        }

        if (this.muted && this.currentAudio) {
            this.currentAudio.pause();
        } else if (!this.muted && this.currentAudio) {
            this.currentAudio.play().catch(e => {
                this.log(`❌ Erreur play: ${e.message}`, 'error');
            });
        }

        this.log(`Audio ${this.muted ? 'mute 🔇' : 'unmute 🔊'}`);
        return this.muted;
    }

    /**
     * Définir l'état mute
     */
    setMuted(muted) {
        this.muted = muted;

        // ✅ FIX: Synchroniser l'attribut HTML de TOUS les audios
        Object.values(this.audios).forEach(audio => {
            audio.muted = this.muted;
        });

        if (this.muted && this.currentAudio) {
            this.currentAudio.pause();
        } else if (!this.muted && this.currentAudio) {
            this.currentAudio.play().catch(e => {
                this.log(`❌ Erreur play: ${e.message}`, 'error');
            });
        }

        this.log(`Audio ${this.muted ? 'mute 🔇' : 'unmute 🔊'}`);
    }

    /**
     * Définir le volume de la musique
     */
    setMusicVolume(volume) {
        this.setVolume(volume);
    }

    /**
     * Jouer une musique par type (compatibilité avec window.audio.playMusic)
     * @param {string} type - 'menu', 'game', 'gameover'
     */
    playMusic(type) {
        // Mapper les types vers les écrans
        const typeToScreen = {
            'menu': 'menu',
            'hub': 'hub',
            'game': 'game-solo',
            'gameover': 'over'
        };

        const screenId = typeToScreen[type] || type;
        this.setAudio(screenId);
    }

    /**
     * Mettre en pause la musique actuelle
     */
    pause() {
        // ✅ FIX #11: Guard clause + try/catch
        if (!this.currentAudio) return;

        try {
            if (!this.currentAudio.paused) {
                this.currentAudio.muted = true; // ✅ FIX: Mute l'audio HTML
                this.currentAudio.pause();
                this.log('Musique en pause ⏸️');
            }
        } catch (error) {
            this.log(`❌ Erreur pause: ${error.message}`, 'error');
            this.currentAudio = null; // Reset si erreur
        }
    }

    /**
     * Reprendre la musique en pause
     */
    resume() {
        // ✅ FIX #11: Guard clause + try/catch robuste
        if (!this.currentAudio || this.muted) return;

        try {
            if (this.currentAudio.paused) {
                this.currentAudio.muted = false; // ✅ FIX: Unmute l'audio HTML
                this.currentAudio.play().catch(e => {
                    this.log(`❌ Erreur play: ${e.message}`, 'error');
                });
                this.log('Musique reprise ▶️');
            }
        } catch (error) {
            this.log(`❌ Erreur resume: ${error.message}`, 'error');
            this.currentAudio = null; // Reset si erreur
        }
    }

    /**
     * Arrêter tout
     */
    stopAll() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.log('Tous les audios arrêtés');
    }

}

// Instance globale
const audioManager = new AudioManager();
window.audioManager = audioManager;

// Attacher au namespace
SnakeUltra.managers.audio = audioManager;

// Fonction de diagnostic (retourne un objet au lieu de logger)
window.diagAudio = function() {
    const am = window.audioManager;
    return {
        preloaded: am.preloaded,
        volume: Math.round(am.volume * 100) + '%',
        muted: am.muted,
        audiosLoaded: Object.keys(am.audios),
        currentAudioActive: am.currentAudio ? 'Oui' : 'Non',
        currentAudioPaused: am.currentAudio ? am.currentAudio.paused : null,
        currentAudioSrc: am.currentAudio ? am.currentAudio.src : null
    };
};
