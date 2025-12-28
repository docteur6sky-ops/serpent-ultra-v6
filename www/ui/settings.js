// ============================================
// SETTINGS - Son et Dark Mode
// Module extrait de navigation.js
// ============================================

import { logger } from '../services/logger.js';

// ============================================
// PARAMÈTRES SON
// ============================================

/**
 * Mettre à jour le volume de la musique
 * @param {number} value - Volume (0-100)
 */
export function updateMusicVolume(value) {
    const valueElement = document.getElementById('music-value');
    if (valueElement) valueElement.textContent = value + '%';

    const volume = value / 100; // 0-100 → 0.0-1.0
    localStorage.setItem('musicVolume', volume);

    // Mettre à jour la jauge visuelle via CSS variable
    const slider = document.getElementById('music-volume');
    if (slider) {
        slider.style.setProperty('--slider-value', value + '%');
    }

    // Appliquer avec AudioManager
    if (window.audioManager) {
        window.audioManager.setVolume(volume);
    }
}

/**
 * Mettre à jour le volume des effets sonores
 * @param {number} value - Volume (0-100)
 */
export function updateSFXVolume(value) {
    const valueElement = document.getElementById('sfx-value');
    if (valueElement) valueElement.textContent = value + '%';

    const volume = value / 100; // 0-100 → 0.0-1.0
    localStorage.setItem('sfxVolume', volume);

    // Mettre à jour la jauge visuelle via CSS variable
    const slider = document.getElementById('sfx-volume');
    if (slider) {
        slider.style.setProperty('--slider-value', value + '%');
    }

    // Appliquer le volume aux effets sonores
    if (window.audio && window.audio.setVolume) {
        window.audio.setVolume(volume);
    }
}

/**
 * Basculer le mode silencieux
 */
export function toggleMute() {
    const muteStateElement = document.getElementById('mute-state');
    if (!muteStateElement) return;

    const currentState = muteStateElement.textContent === 'OFF'; // OFF -> va devenir ON (muted)
    const newMutedState = currentState; // ON = muted, OFF = not muted

    muteStateElement.textContent = newMutedState ? 'ON' : 'OFF';

    // Synchroniser les deux systèmes de sauvegarde
    localStorage.setItem('muted', newMutedState.toString());
    localStorage.setItem('soundEnabled', (!newMutedState).toString());

    // Appliquer avec AudioManager
    if (window.audioManager) {
        window.audioManager.setMuted(newMutedState);
    }
}

/**
 * Charger les paramètres son depuis localStorage
 */
export function loadSoundSettings() {
    // Charger depuis localStorage (valeurs en 0.0-1.0)
    const musicVolume = parseFloat(localStorage.getItem('musicVolume')) || 0.5;
    const sfxVolume = parseFloat(localStorage.getItem('sfxVolume')) || 0.85;

    // Par défaut, son activé (true)
    const soundEnabledValue = localStorage.getItem('soundEnabled');
    const soundEnabled = soundEnabledValue === null ? true : soundEnabledValue === 'true';
    const muted = !soundEnabled; // Si son activé, alors pas muted

    // Appliquer aux sliders (convertir 0.0-1.0 → 0-100)
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicValueElement = document.getElementById('music-value');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const sfxValueElement = document.getElementById('sfx-value');
    const muteStateElement = document.getElementById('mute-state');

    const musicVolumePercent = Math.round(musicVolume * 100);
    const sfxVolumePercent = Math.round(sfxVolume * 100);

    if (musicVolumeSlider) {
        musicVolumeSlider.value = musicVolumePercent;
        // Initialiser la jauge visuelle
        musicVolumeSlider.style.setProperty('--slider-value', musicVolumePercent + '%');
    }
    if (musicValueElement) musicValueElement.textContent = musicVolumePercent + '%';

    if (sfxVolumeSlider) {
        sfxVolumeSlider.value = sfxVolumePercent;
        // Initialiser la jauge visuelle
        sfxVolumeSlider.style.setProperty('--slider-value', sfxVolumePercent + '%');
    }
    if (sfxValueElement) sfxValueElement.textContent = sfxVolumePercent + '%';

    if (muteStateElement) muteStateElement.textContent = muted ? 'ON' : 'OFF';

    // Appliquer avec AudioManager
    if (window.audioManager) {
        window.audioManager.setVolume(musicVolume);
        window.audioManager.setMuted(muted);
    }

    // Appliquer le volume des effets sonores
    if (window.audio && window.audio.setVolume) {
        window.audio.setVolume(sfxVolume);
    }
}

// ============================================
// DARK MODE
// ============================================

/**
 * Basculer le mode sombre
 */
export function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');

    // Sauvegarder
    localStorage.setItem('darkMode', isDark);

    // Mettre à jour l'indicateur
    const indicator = document.getElementById('dark-mode-indicator');
    if (indicator) indicator.textContent = isDark ? 'ON' : 'OFF';

    // Animation smooth
    body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
}

/**
 * Charger le Dark Mode au démarrage
 */
export function loadDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        const indicator = document.getElementById('dark-mode-indicator');
        if (indicator) indicator.textContent = 'ON';
    }
}

// ============================================
// VIBRATION (Haptic Feedback)
// ============================================

/**
 * Basculer la vibration (haptic feedback)
 */
export function toggleVibration() {
    const indicator = document.getElementById('vibration-indicator');
    const currentState = localStorage.getItem('vibrationEnabled') !== 'false'; // Default ON
    const newState = !currentState;

    localStorage.setItem('vibrationEnabled', newState);

    if (indicator) indicator.textContent = newState ? 'ON' : 'OFF';

    // Test vibration si activée
    if (newState && navigator.vibrate) {
        navigator.vibrate(50);
    }

    logger.log(`[Settings] Vibration: ${newState ? 'ON' : 'OFF'}`);
}

/**
 * Charger les paramètres de vibration
 */
export function loadVibrationSettings() {
    const vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false'; // Default ON
    const indicator = document.getElementById('vibration-indicator');
    if (indicator) indicator.textContent = vibrationEnabled ? 'ON' : 'OFF';
}

/**
 * Déclencher une vibration si activée
 * @param {number} duration - Durée en ms (default 30)
 */
export function vibrate(duration = 30) {
    const vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
    if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// ============================================
// CONTRÔLES TACTILES
// ============================================

/**
 * Mettre à jour la sensibilité tactile
 * @param {number} value - Sensibilité (1-10)
 */
export function updateTouchSensitivity(value) {
    const valueElement = document.getElementById('sensitivity-value');
    if (valueElement) valueElement.textContent = value;

    localStorage.setItem('touchSensitivity', value);

    // Appliquer au TouchControls si disponible
    // Sensibilité inversée : 1 = distance max (moins sensible), 10 = distance min (très sensible)
    if (window.touchControls) {
        const minSwipeDistance = 110 - (value * 10); // 10 -> 10px, 1 -> 100px
        window.touchControls.minSwipeDistance = minSwipeDistance;
    }

    logger.log(`[Settings] Sensibilité tactile: ${value}`);
}

/**
 * Mettre à jour la taille du D-Pad
 * @param {number} value - Taille en % (80-150)
 */
export function updateDpadSize(value) {
    const valueElement = document.getElementById('dpad-size-value');
    if (valueElement) valueElement.textContent = value + '%';

    localStorage.setItem('dpadSize', value);

    // Appliquer à tous les D-Pads
    document.querySelectorAll('.dpad').forEach(dpad => {
        dpad.style.transform = `scale(${value / 100})`;
    });

    logger.log(`[Settings] Taille D-Pad: ${value}%`);
}



/**
 * Charger les paramètres de contrôles
 */
export function loadControlsSettings() {
    // Sensibilité
    const sensitivity = parseInt(localStorage.getItem('touchSensitivity')) || 5;
    const sensitivitySlider = document.getElementById('touch-sensitivity');
    const sensitivityValue = document.getElementById('sensitivity-value');
    if (sensitivitySlider) sensitivitySlider.value = sensitivity;
    if (sensitivityValue) sensitivityValue.textContent = sensitivity;

    // Taille D-Pad
    const dpadSize = parseInt(localStorage.getItem('dpadSize')) || 100;
    const dpadSizeSlider = document.getElementById('dpad-size');
    const dpadSizeValue = document.getElementById('dpad-size-value');
    if (dpadSizeSlider) dpadSizeSlider.value = dpadSize;
    if (dpadSizeValue) dpadSizeValue.textContent = dpadSize + '%';

    // Appliquer la taille à tous les D-Pads
    if (dpadSize !== 100) {
        document.querySelectorAll('.dpad').forEach(dpad => {
            dpad.style.transform = `scale(${dpadSize / 100})`;
        });
    }

    // Appliquer la sensibilité au TouchControls
    if (window.touchControls) {
        const minSwipeDistance = 110 - (sensitivity * 10);
        window.touchControls.minSwipeDistance = minSwipeDistance;
    }
}

// ============================================
// LANGUE
// ============================================

/**
 * Définir la langue de l'interface
 * @param {string} lang - Code de langue ('fr', 'en', 'es', 'de')
 */
export function setLanguage(lang) {
    // Pour l'instant, seul le français est disponible
    if (lang !== 'fr') {
        return;
    }

    // Sauvegarder la préférence
    localStorage.setItem('language', lang);

    // TODO: Implémenter la traduction de l'interface
}

/**
 * Charger les paramètres de langue
 */
export function loadLanguageSettings() {
    const savedLang = localStorage.getItem('language') || 'fr';
    // TODO: Appliquer la traduction
}

// ============================================
// EXPORTS GLOBAUX (compatibilité window.*)
// ============================================

window.updateMusicVolume = updateMusicVolume;
window.updateSFXVolume = updateSFXVolume;
window.toggleMute = toggleMute;
window.toggleDarkMode = toggleDarkMode;
window.setLanguage = setLanguage;

// Vibration
window.toggleVibration = toggleVibration;
window.vibrate = vibrate;

// Contrôles
window.updateTouchSensitivity = updateTouchSensitivity;
window.updateDpadSize = updateDpadSize;

logger.log('✅ Module settings.js chargé');
