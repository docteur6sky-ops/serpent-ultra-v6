/**
 * AudioManager - Gestion centralisée de l'audio
 * Gère les musiques de fond par écran
 */
class AudioManager {
    constructor() {
        this.audios = {};
        this.currentAudio = null;
        this.preloaded = false;
        this.debug = true;
        this.volume = 0.5;
        this.muted = false;

        this.config = {
            menu: 'assets/audio/menu.mp3',
            'game-solo': 'assets/audio/game.mp3',
            'game-multi': 'assets/audio/game.mp3',
            over: 'assets/audio/gameover.mp3',
            gameover: 'assets/audio/gameover.mp3'
        };

        this.log('AudioManager initialisé');
    }

    log(message, level = 'info') {
        if (!this.debug) return;
        const prefix = '🎵 [AudioManager]';
        console.log(`${prefix} ${message}`);
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

    /**
     * Active/désactive le mode debug
     */
    setDebug(enabled) {
        this.debug = enabled;
    }
}

// Instance globale
window.audioManager = new AudioManager();
console.log('✅ AudioManager chargé');
console.log('💡 Utilise window.diagAudio() pour diagnostiquer');

// Fonction de diagnostic
window.diagAudio = function() {
    const am = window.audioManager;
    console.log('═══════════════════════════════════════');
    console.log('🎵 DIAGNOSTIC AUDIOMANAGER');
    console.log('═══════════════════════════════════════');
    console.log('Préchargé:', am.preloaded);
    console.log('Volume:', Math.round(am.volume * 100) + '%');
    console.log('Muted:', am.muted);
    console.log('Audios chargés:', Object.keys(am.audios));
    console.log('Audio actif:', am.currentAudio ? 'Oui' : 'Non');
    console.log('═══════════════════════════════════════');
};
