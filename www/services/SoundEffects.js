// ============================================
// SOUND EFFECTS SERVICE - SNAKE ULTRA DELUXE
// Effets sonores haute qualité avec Web Audio API
// Techniques avancées : ADSR, filtres, noise, harmoniques
// ============================================

import { logger } from './logger.js';

/**
 * SoundEffectsService - Génération de sons haute qualité
 * Utilise des techniques de synthèse avancées pour des sons professionnels
 */
class SoundEffectsService {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.sfxVolume = 0.7; // Volume global SFX (0-1)
        this.masterGain = null;

        // Cache pour les buffers de bruit
        this.noiseBuffers = {};
    }

    /**
     * Initialise le contexte audio
     */
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain pour contrôle global du volume
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.sfxVolume;
            this.masterGain.connect(this.ctx.destination);

            // Pré-générer les buffers de bruit
            this._generateNoiseBuffers();

            logger.log('SoundEffects initialisé');
        } catch (error) {
            logger.error('Impossible d\'initialiser SoundEffects:', error);
        }
    }

    /**
     * Génère des buffers de bruit réutilisables
     */
    _generateNoiseBuffers() {
        if (!this.ctx) return;

        const sampleRate = this.ctx.sampleRate;
        const duration = 0.5; // 500ms de bruit
        const length = sampleRate * duration;

        // White noise
        this.noiseBuffers.white = this.ctx.createBuffer(1, length, sampleRate);
        const whiteData = this.noiseBuffers.white.getChannelData(0);
        for (let i = 0; i < length; i++) {
            whiteData[i] = Math.random() * 2 - 1;
        }

        // Pink noise (plus doux)
        this.noiseBuffers.pink = this.ctx.createBuffer(1, length, sampleRate);
        const pinkData = this.noiseBuffers.pink.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
    }

    /**
     * Active ou désactive les sons
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Définit le volume global des SFX
     */
    setVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.sfxVolume;
        }
    }

    /**
     * Reprend le contexte audio si suspendu
     */
    _resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // ============================================
    // UTILITAIRES DE SYNTHÈSE
    // ============================================

    /**
     * Crée un oscillateur avec enveloppe ADSR
     */
    _createTone(freq, type, { attack = 0.01, decay = 0.1, sustain = 0.5, release = 0.1, duration = 0.3, volume = 0.3 } = {}) {
        if (!this.enabled || !this.ctx) return null;
        this._resumeContext();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        // Enveloppe ADSR
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + attack);
        gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
        gain.gain.setValueAtTime(volume * sustain, now + duration - release);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.01);

        return { osc, gain };
    }

    /**
     * Crée un bruit filtré
     */
    _createNoise(type, filterFreq, filterType, { attack = 0.01, decay = 0.1, duration = 0.3, volume = 0.2 } = {}) {
        if (!this.enabled || !this.ctx || !this.noiseBuffers[type]) return null;
        this._resumeContext();

        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        source.buffer = this.noiseBuffers[type];
        filter.type = filterType;
        filter.frequency.value = filterFreq;

        // Enveloppe
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start(now);
        source.stop(now + duration);

        return { source, gain };
    }

    /**
     * Crée un sweep de fréquence
     */
    _createSweep(startFreq, endFreq, type, duration, volume = 0.3) {
        if (!this.enabled || !this.ctx) return null;
        this._resumeContext();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.01);

        return { osc, gain };
    }

    // ============================================
    // SONS D'INTERFACE
    // ============================================

    /**
     * Clic de bouton - son satisfaisant
     */
    buttonClick() {
        // Ton principal + harmonique
        this._createTone(880, 'sine', { attack: 0.001, decay: 0.05, sustain: 0.3, release: 0.05, duration: 0.1, volume: 0.15 });
        this._createTone(1320, 'sine', { attack: 0.001, decay: 0.03, sustain: 0.2, release: 0.03, duration: 0.08, volume: 0.08 });
        // Petit "pop"
        this._createNoise('white', 3000, 'highpass', { attack: 0.001, decay: 0.02, duration: 0.03, volume: 0.05 });
    }

    /**
     * Clic D-pad - son directionnel rapide
     */
    dpadClick() {
        this._createTone(600, 'square', { attack: 0.001, decay: 0.02, sustain: 0.1, release: 0.02, duration: 0.04, volume: 0.08 });
    }

    /**
     * Hover sur bouton
     */
    buttonHover() {
        this._createTone(1200, 'sine', { attack: 0.005, decay: 0.03, sustain: 0.2, release: 0.02, duration: 0.06, volume: 0.05 });
    }

    /**
     * Confirmation (OK, validation)
     */
    confirm() {
        this._createTone(523, 'sine', { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.1, duration: 0.15, volume: 0.2 });
        setTimeout(() => {
            this._createTone(659, 'sine', { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.15, duration: 0.2, volume: 0.2 });
        }, 80);
    }

    /**
     * Annulation / Retour
     */
    cancel() {
        this._createTone(440, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1, duration: 0.15, volume: 0.15 });
        setTimeout(() => {
            this._createTone(330, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.15, duration: 0.2, volume: 0.15 });
        }, 80);
    }

    /**
     * Erreur / Action impossible
     */
    error() {
        this._createTone(200, 'sawtooth', { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1, duration: 0.15, volume: 0.2 });
        this._createTone(180, 'square', { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1, duration: 0.2, volume: 0.1 });
    }

    // ============================================
    // SONS DE JEU - SERPENT
    // ============================================

    /**
     * Manger une pomme - son satisfaisant "crunch"
     */
    eat() {
        // "Crunch" avec bruit
        this._createNoise('white', 2500, 'bandpass', { attack: 0.001, decay: 0.03, duration: 0.05, volume: 0.12 });
        // Ton montant satisfaisant
        this._createSweep(400, 800, 'sine', 0.1, 0.2);
        // Harmonique brillante
        this._createTone(1200, 'triangle', { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.05, duration: 0.12, volume: 0.1 });
    }

    /**
     * Manger une pomme dorée - son premium
     */
    eatGolden() {
        // Base
        this.eat();
        // Scintillement
        setTimeout(() => {
            this._createTone(1500, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2, duration: 0.3, volume: 0.15 });
            this._createTone(1800, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.2, duration: 0.25, volume: 0.1 });
        }, 50);
        setTimeout(() => {
            this._createTone(2200, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.15, duration: 0.2, volume: 0.08 });
        }, 150);
    }

    /**
     * Manger un crâne - son négatif
     */
    bad() {
        // Basse menaçante
        this._createTone(80, 'sawtooth', { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.2, duration: 0.35, volume: 0.25 });
        // Dissonance
        this._createTone(95, 'square', { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.15, duration: 0.3, volume: 0.15 });
        // Bruit de crunch négatif
        this._createNoise('white', 800, 'lowpass', { attack: 0.01, decay: 0.1, duration: 0.15, volume: 0.1 });
    }

    /**
     * Collision avec obstacle
     */
    obstacle() {
        // Impact
        this._createNoise('white', 500, 'lowpass', { attack: 0.001, decay: 0.08, duration: 0.1, volume: 0.2 });
        // Ton d'impact
        this._createTone(150, 'square', { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.1, duration: 0.15, volume: 0.2 });
    }

    /**
     * Destruction de mur/roche
     */
    breakWall() {
        // Explosion rocailleuse
        this._createNoise('pink', 1000, 'lowpass', { attack: 0.001, decay: 0.15, duration: 0.2, volume: 0.25 });
        // Débris
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this._createNoise('white', 2000 - i * 500, 'bandpass', { attack: 0.001, decay: 0.05, duration: 0.08, volume: 0.1 });
            }, i * 30);
        }
        // Impact basse
        this._createTone(100, 'sine', { attack: 0.001, decay: 0.15, sustain: 0.2, release: 0.1, duration: 0.2, volume: 0.2 });
    }

    /**
     * Mort du serpent
     */
    die() {
        // Sweep descendant dramatique
        this._createSweep(600, 80, 'sawtooth', 0.5, 0.3);
        // Bruit d'impact
        this._createNoise('white', 400, 'lowpass', { attack: 0.01, decay: 0.3, duration: 0.4, volume: 0.2 });
        // Tons discordants
        setTimeout(() => {
            this._createTone(200, 'square', { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.3, duration: 0.5, volume: 0.15 });
        }, 100);
        setTimeout(() => {
            this._createTone(150, 'sawtooth', { attack: 0.05, decay: 0.3, sustain: 0.2, release: 0.3, duration: 0.5, volume: 0.12 });
        }, 200);
    }

    // ============================================
    // SONS DE PROGRESSION
    // ============================================

    /**
     * Level up - fanfare courte
     */
    lvlup() {
        const notes = [523, 659, 784, 1047]; // Do, Mi, Sol, Do (octave)
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._createTone(freq, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.15, duration: 0.2, volume: 0.25 });
                this._createTone(freq * 1.5, 'triangle', { attack: 0.02, decay: 0.08, sustain: 0.3, release: 0.1, duration: 0.15, volume: 0.1 });
            }, i * 80);
        });
    }

    /**
     * XP gagné
     */
    xpGain() {
        this._createTone(800, 'sine', { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.1, duration: 0.12, volume: 0.15 });
        this._createTone(1000, 'triangle', { attack: 0.02, decay: 0.05, sustain: 0.2, release: 0.08, duration: 0.1, volume: 0.1 });
    }

    /**
     * Combo (enchaînement de pommes)
     */
    combo(level = 1) {
        const baseFreq = 600 + (level * 100);
        this._createTone(baseFreq, 'sine', { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.08, duration: 0.12, volume: 0.2 });
        this._createTone(baseFreq * 1.25, 'triangle', { attack: 0.01, decay: 0.04, sustain: 0.3, release: 0.06, duration: 0.1, volume: 0.12 });
        // Plus le combo est haut, plus le son est brillant
        if (level >= 3) {
            this._createTone(baseFreq * 2, 'sine', { attack: 0.01, decay: 0.03, sustain: 0.2, release: 0.05, duration: 0.08, volume: 0.08 });
        }
    }

    // ============================================
    // SONS DE POWER-UPS
    // ============================================

    /**
     * Ramassage de power-up générique
     */
    powerup() {
        // Sweep ascendant
        this._createSweep(400, 1200, 'triangle', 0.15, 0.25);
        // Brillance
        setTimeout(() => {
            this._createTone(1400, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.15, duration: 0.2, volume: 0.15 });
        }, 100);
        // Scintillement
        this._createNoise('white', 4000, 'highpass', { attack: 0.01, decay: 0.1, duration: 0.15, volume: 0.08 });
    }

    /**
     * Power-up FEU
     */
    powerupFire() {
        this._createSweep(200, 600, 'sawtooth', 0.2, 0.25);
        this._createNoise('white', 1500, 'bandpass', { attack: 0.01, decay: 0.2, duration: 0.3, volume: 0.15 });
        // Crépitement
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this._createNoise('white', 3000, 'highpass', { attack: 0.001, decay: 0.02, duration: 0.03, volume: 0.1 });
            }, i * 40 + Math.random() * 20);
        }
    }

    /**
     * Power-up GLACE
     */
    powerupIce() {
        // Son cristallin
        this._createTone(2000, 'sine', { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.2, duration: 0.3, volume: 0.2 });
        this._createTone(2500, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.15, duration: 0.25, volume: 0.12 });
        // Craquement de glace
        this._createNoise('white', 5000, 'highpass', { attack: 0.001, decay: 0.05, duration: 0.08, volume: 0.1 });
    }

    /**
     * Power-up FANTOME
     */
    powerupGhost() {
        // Son éthéré
        this._createTone(400, 'sine', { attack: 0.1, decay: 0.2, sustain: 0.4, release: 0.3, duration: 0.5, volume: 0.15 });
        this._createTone(600, 'sine', { attack: 0.15, decay: 0.2, sustain: 0.3, release: 0.3, duration: 0.5, volume: 0.1 });
        // Woosh fantomatique
        this._createNoise('pink', 800, 'lowpass', { attack: 0.1, decay: 0.3, duration: 0.4, volume: 0.1 });
    }

    /**
     * Power-up FOUDRE
     */
    powerupLightning() {
        // Craquement électrique
        this._createNoise('white', 3000, 'bandpass', { attack: 0.001, decay: 0.05, duration: 0.1, volume: 0.25 });
        // Buzz électrique
        this._createTone(120, 'sawtooth', { attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.1, duration: 0.2, volume: 0.2 });
        this._createTone(180, 'square', { attack: 0.001, decay: 0.1, sustain: 0.4, release: 0.1, duration: 0.2, volume: 0.15 });
        // Flash
        setTimeout(() => {
            this._createSweep(2000, 500, 'sine', 0.1, 0.15);
        }, 50);
    }

    /**
     * Power-up EPEE
     */
    powerupSword() {
        // Unsheathe metallique
        this._createNoise('white', 4000, 'highpass', { attack: 0.01, decay: 0.15, duration: 0.2, volume: 0.15 });
        // Résonance métallique
        this._createTone(800, 'triangle', { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.2, duration: 0.35, volume: 0.2 });
        this._createTone(1200, 'sine', { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.15, duration: 0.3, volume: 0.12 });
    }

    /**
     * Fin d'effet de power-up
     */
    powerupEnd() {
        this._createSweep(800, 300, 'triangle', 0.2, 0.15);
        this._createTone(250, 'sine', { attack: 0.05, decay: 0.1, sustain: 0.3, release: 0.15, duration: 0.25, volume: 0.1 });
    }

    // ============================================
    // SONS DE COMBAT
    // ============================================

    /**
     * Coup d'épée
     */
    swordSwing() {
        // Woosh
        this._createNoise('white', 2000, 'bandpass', { attack: 0.001, decay: 0.1, duration: 0.15, volume: 0.2 });
        // Sifflement
        this._createSweep(1500, 500, 'sine', 0.1, 0.15);
    }

    /**
     * Touché épée (dégâts)
     */
    swordHit() {
        // Impact
        this._createNoise('white', 800, 'lowpass', { attack: 0.001, decay: 0.08, duration: 0.12, volume: 0.25 });
        // Métallique
        this._createTone(600, 'triangle', { attack: 0.001, decay: 0.1, sustain: 0.3, release: 0.1, duration: 0.15, volume: 0.2 });
        // Résonance
        this._createTone(1200, 'sine', { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.08, duration: 0.12, volume: 0.1 });
    }

    /**
     * Dégâts reçus
     */
    takeDamage() {
        // Impact sourd
        this._createNoise('pink', 400, 'lowpass', { attack: 0.001, decay: 0.15, duration: 0.2, volume: 0.25 });
        // Ton de douleur
        this._createTone(200, 'sawtooth', { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.15, duration: 0.25, volume: 0.2 });
    }

    /**
     * Bloquer une attaque
     */
    block() {
        // Impact métallique
        this._createNoise('white', 3000, 'bandpass', { attack: 0.001, decay: 0.05, duration: 0.08, volume: 0.2 });
        this._createTone(500, 'triangle', { attack: 0.001, decay: 0.08, sustain: 0.3, release: 0.1, duration: 0.12, volume: 0.25 });
    }

    // ============================================
    // SONS DE BOSS
    // ============================================

    /**
     * Apparition du boss
     */
    bossAppear() {
        // Grondement
        this._createTone(60, 'sawtooth', { attack: 0.2, decay: 0.5, sustain: 0.6, release: 0.5, duration: 1.2, volume: 0.3 });
        // Montée dramatique
        setTimeout(() => {
            this._createSweep(100, 400, 'square', 0.8, 0.2);
        }, 200);
        // Impact final
        setTimeout(() => {
            this._createNoise('pink', 300, 'lowpass', { attack: 0.01, decay: 0.3, duration: 0.4, volume: 0.25 });
            this._createTone(80, 'sine', { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3, duration: 0.5, volume: 0.25 });
        }, 800);
    }

    /**
     * Attaque du boss
     */
    bossAttack() {
        // Charge
        this._createSweep(150, 400, 'sawtooth', 0.2, 0.25);
        // Impact
        setTimeout(() => {
            this._createNoise('white', 600, 'lowpass', { attack: 0.001, decay: 0.15, duration: 0.2, volume: 0.3 });
        }, 150);
    }

    /**
     * Boss touché
     */
    bossHurt() {
        this._createTone(150, 'square', { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.15, duration: 0.2, volume: 0.25 });
        this._createNoise('pink', 500, 'lowpass', { attack: 0.01, decay: 0.15, duration: 0.2, volume: 0.2 });
    }

    /**
     * Boss vaincu
     */
    bossDefeat() {
        // Explosion massive
        this._createNoise('pink', 400, 'lowpass', { attack: 0.01, decay: 0.5, duration: 0.8, volume: 0.35 });
        this._createTone(100, 'sawtooth', { attack: 0.05, decay: 0.4, sustain: 0.3, release: 0.4, duration: 0.8, volume: 0.3 });

        // Échos de victoire
        setTimeout(() => {
            this._createSweep(200, 800, 'sine', 0.4, 0.2);
        }, 300);
        setTimeout(() => {
            this._createTone(523, 'sine', { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3, duration: 0.5, volume: 0.25 });
            this._createTone(659, 'sine', { attack: 0.1, decay: 0.2, sustain: 0.4, release: 0.3, duration: 0.45, volume: 0.2 });
        }, 600);
    }

    // ============================================
    // SONS D'AMBIANCE / ALERTES
    // ============================================

    /**
     * Alerte danger
     */
    danger() {
        this._createTone(440, 'square', { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.1, duration: 0.2, volume: 0.2 });
        setTimeout(() => {
            this._createTone(440, 'square', { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.1, duration: 0.2, volume: 0.2 });
        }, 250);
    }

    /**
     * Compte à rebours (tick)
     */
    countdownTick() {
        this._createTone(800, 'sine', { attack: 0.001, decay: 0.05, sustain: 0.3, release: 0.05, duration: 0.1, volume: 0.2 });
    }

    /**
     * Compte à rebours final (GO!)
     */
    countdownGo() {
        this._createTone(523, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2, duration: 0.3, volume: 0.3 });
        this._createTone(784, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.2, duration: 0.3, volume: 0.25 });
        this._createTone(1047, 'triangle', { attack: 0.03, decay: 0.1, sustain: 0.4, release: 0.2, duration: 0.3, volume: 0.2 });
    }

    // ============================================
    // SONS DE VICTOIRE / DÉFAITE
    // ============================================

    /**
     * Victoire
     */
    victory() {
        const melody = [523, 659, 784, 1047, 784, 1047]; // Do Mi Sol Do Sol Do
        melody.forEach((freq, i) => {
            setTimeout(() => {
                this._createTone(freq, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.2, duration: 0.25, volume: 0.25 });
                this._createTone(freq * 1.5, 'triangle', { attack: 0.03, decay: 0.08, sustain: 0.3, release: 0.15, duration: 0.2, volume: 0.12 });
            }, i * 100);
        });
    }

    /**
     * Défaite
     */
    defeat() {
        const melody = [392, 349, 330, 262]; // Sol Fa Mi Do (descendant triste)
        melody.forEach((freq, i) => {
            setTimeout(() => {
                this._createTone(freq, 'sine', { attack: 0.05, decay: 0.15, sustain: 0.4, release: 0.2, duration: 0.3, volume: 0.2 });
            }, i * 200);
        });
    }

    /**
     * Nouveau record
     */
    newRecord() {
        // Fanfare triomphante
        const fanfare = [
            { freq: 523, delay: 0 },
            { freq: 659, delay: 100 },
            { freq: 784, delay: 200 },
            { freq: 1047, delay: 350 },
            { freq: 784, delay: 450 },
            { freq: 1047, delay: 550 },
            { freq: 1319, delay: 700 }
        ];

        fanfare.forEach(({ freq, delay }) => {
            setTimeout(() => {
                this._createTone(freq, 'sine', { attack: 0.02, decay: 0.15, sustain: 0.5, release: 0.2, duration: 0.3, volume: 0.25 });
                this._createTone(freq * 1.5, 'triangle', { attack: 0.03, decay: 0.1, sustain: 0.3, release: 0.15, duration: 0.25, volume: 0.1 });
            }, delay);
        });

        // Scintillement final
        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this._createTone(2000 + Math.random() * 500, 'sine', { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.05, duration: 0.1, volume: 0.08 });
                }, i * 50);
            }
        }, 800);
    }

    // ============================================
    // SONS DE COFFRE (HÉRITAGE AMÉLIORÉ)
    // ============================================

    /**
     * Pulse d'anticipation coffre
     */
    chestPulse() {
        this._createTone(220, 'triangle', { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.2, duration: 0.4, volume: 0.15 });
        setTimeout(() => {
            this._createTone(260, 'triangle', { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.15, duration: 0.35, volume: 0.12 });
        }, 200);
    }

    /**
     * Ouverture du coffre
     */
    chestOpen() {
        // Craquement d'ouverture
        this._createNoise('pink', 1000, 'bandpass', { attack: 0.01, decay: 0.15, duration: 0.2, volume: 0.2 });

        // Montée magique
        this._createSweep(200, 800, 'sine', 0.4, 0.25);

        // Éclat doré
        setTimeout(() => {
            this._createTone(1000, 'sine', { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.3, duration: 0.5, volume: 0.25 });
            this._createTone(1250, 'triangle', { attack: 0.03, decay: 0.15, sustain: 0.3, release: 0.25, duration: 0.45, volume: 0.15 });
        }, 200);

        // Scintillements
        setTimeout(() => {
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    this._createTone(1500 + i * 200, 'sine', { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.1, duration: 0.15, volume: 0.1 });
                }, i * 60);
            }
        }, 400);
    }

    /**
     * Récompense COMMON
     */
    rewardCommon() {
        this._createTone(800, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.15, duration: 0.2, volume: 0.2 });
        this._createTone(1000, 'triangle', { attack: 0.02, decay: 0.08, sustain: 0.3, release: 0.1, duration: 0.15, volume: 0.1 });
    }

    /**
     * Récompense RARE
     */
    rewardRare() {
        this._createTone(800, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.15, duration: 0.2, volume: 0.22 });
        setTimeout(() => {
            this._createTone(1000, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.15, duration: 0.2, volume: 0.2 });
        }, 80);
        setTimeout(() => {
            this._createTone(1200, 'triangle', { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.15, duration: 0.2, volume: 0.15 });
        }, 160);
    }

    /**
     * Récompense EPIC
     */
    rewardEpic() {
        const notes = [800, 1000, 1200, 1400, 1600];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._createTone(freq, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.15, duration: 0.2, volume: 0.22 - i * 0.02 });
                if (i >= 2) {
                    this._createTone(freq * 1.5, 'triangle', { attack: 0.02, decay: 0.08, sustain: 0.3, release: 0.1, duration: 0.15, volume: 0.1 });
                }
            }, i * 70);
        });
    }

    /**
     * Récompense LEGENDARY - Fanfare majestueuse
     */
    rewardLegendary() {
        // Intro puissante
        this._createTone(300, 'sawtooth', { attack: 0.05, decay: 0.15, sustain: 0.5, release: 0.2, duration: 0.3, volume: 0.25 });

        // Montée épique
        const epicNotes = [400, 500, 600, 800, 1000, 1200, 1400, 1600];
        epicNotes.forEach((freq, i) => {
            setTimeout(() => {
                this._createTone(freq, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.15, duration: 0.2, volume: 0.25 });
                this._createTone(freq * 1.5, 'triangle', { attack: 0.03, decay: 0.08, sustain: 0.3, release: 0.1, duration: 0.18, volume: 0.12 });
            }, 100 + i * 60);
        });

        // Climax glorieux
        setTimeout(() => {
            this._createTone(2000, 'sine', { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.3, duration: 0.5, volume: 0.28 });
            this._createTone(2400, 'sine', { attack: 0.03, decay: 0.15, sustain: 0.4, release: 0.25, duration: 0.45, volume: 0.2 });
            this._createTone(2800, 'triangle', { attack: 0.04, decay: 0.1, sustain: 0.3, release: 0.2, duration: 0.4, volume: 0.15 });
        }, 600);

        // Scintillements finaux
        setTimeout(() => {
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const sparkFreq = 2000 + Math.random() * 1000;
                    this._createTone(sparkFreq, 'sine', { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.08, duration: 0.12, volume: 0.1 });
                }, i * 40);
            }
        }, 800);
    }

    /**
     * Collection d'item du coffre
     */
    chestCollect() {
        this._createSweep(800, 1600, 'sine', 0.15, 0.2);
        this._createTone(1200, 'triangle', { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1, duration: 0.2, volume: 0.15 });
    }

    // ============================================
    // SONS ROGUELIKE
    // ============================================

    /**
     * Sélection d'upgrade
     */
    selectUpgrade() {
        this._createTone(600, 'sine', { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.1, duration: 0.15, volume: 0.2 });
        setTimeout(() => {
            this._createTone(900, 'sine', { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.15, duration: 0.2, volume: 0.2 });
        }, 60);
        this._createNoise('white', 4000, 'highpass', { attack: 0.01, decay: 0.05, duration: 0.08, volume: 0.08 });
    }

    /**
     * Nouveau niveau roguelike
     */
    newFloor() {
        // Portail
        this._createSweep(300, 800, 'sine', 0.3, 0.2);
        this._createNoise('pink', 1000, 'bandpass', { attack: 0.1, decay: 0.3, duration: 0.4, volume: 0.15 });
        // Atterrissage
        setTimeout(() => {
            this._createTone(400, 'sine', { attack: 0.05, decay: 0.15, sustain: 0.4, release: 0.2, duration: 0.3, volume: 0.2 });
        }, 250);
    }

    /**
     * Déverrouillage achievement
     */
    achievementUnlock() {
        // Fanfare courte
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._createTone(freq, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.15, duration: 0.25, volume: 0.25 });
            }, i * 100);
        });
        // Éclat final
        setTimeout(() => {
            this._createTone(1319, 'sine', { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.25, duration: 0.35, volume: 0.22 });
            this._createNoise('white', 5000, 'highpass', { attack: 0.01, decay: 0.1, duration: 0.15, volume: 0.1 });
        }, 400);
    }

    // ============================================
    // SONS MULTIJOUEUR
    // ============================================

    /**
     * Joueur rejoint
     */
    playerJoin() {
        this._createTone(600, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.15, duration: 0.2, volume: 0.2 });
        setTimeout(() => {
            this._createTone(800, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.15, duration: 0.2, volume: 0.2 });
        }, 100);
    }

    /**
     * Joueur quitte
     */
    playerLeave() {
        this._createTone(600, 'sine', { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.15, duration: 0.2, volume: 0.18 });
        setTimeout(() => {
            this._createTone(400, 'sine', { attack: 0.02, decay: 0.15, sustain: 0.3, release: 0.15, duration: 0.25, volume: 0.15 });
        }, 100);
    }

    /**
     * Match trouvé
     */
    matchFound() {
        this._createTone(800, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1, duration: 0.15, volume: 0.25 });
        setTimeout(() => {
            this._createTone(1000, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1, duration: 0.15, volume: 0.25 });
        }, 100);
        setTimeout(() => {
            this._createTone(1200, 'sine', { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.2, duration: 0.25, volume: 0.25 });
        }, 200);
    }

    /**
     * Notification message
     */
    notification() {
        this._createTone(880, 'sine', { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.1, duration: 0.15, volume: 0.15 });
        this._createTone(1100, 'triangle', { attack: 0.02, decay: 0.06, sustain: 0.3, release: 0.08, duration: 0.12, volume: 0.08 });
    }
}

// Instance singleton
export const soundEffects = new SoundEffectsService();

// Export par défaut
export default soundEffects;
