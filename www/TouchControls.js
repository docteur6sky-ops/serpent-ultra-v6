// ═══════════════════════════════════════════════════════════
// TOUCH CONTROLS - Swipe Detection (complément D-pad)
// ═══════════════════════════════════════════════════════════

// Debug mode (mettre à true pour activer les logs)
import { logger } from './services/logger.js';
const DEBUG_TOUCH = false;
const logTouch = (...args) => DEBUG_TOUCH && logger.log(...args);

class TouchControls {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.minSwipeDistance = 50; // Pixels minimum pour swipe
        this.isEnabled = false;
        this.isInitialized = false;  // ✅ NOUVEAU FLAG
        this.vibrationEnabled = true;
        this.listeners = [];  // ✅ STOCKAGE LISTENERS

        logTouch('🎮 TouchControls (Swipe) initialisé');
    }

    // ═══ INITIALISATION (protégée contre double-init) ═══
    init() {
        // ✅ GARDE : Si déjà initialisé, skip
        if (this.isInitialized) {
            logTouch('⚠️ TouchControls déjà initialisé, skip');
            return;
        }

        if (this.isEnabled) return;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (!isMobile) {
            logTouch('🎮 TouchControls : Desktop détecté, swipe désactivé');
            return;
        }

        logTouch('🎮 TouchControls : Mobile détecté, swipe activé');

        const canvasSolo = document.getElementById('canvas-solo');
        const canvasMulti = document.getElementById('canvas-multi');

        let foundCount = 0;

        // Attacher listeners au canvas SOLO
        if (canvasSolo) {
            logTouch('✅ Canvas SOLO trouvé, installation listeners...');

            const touchStartHandler = this.handleTouchStart.bind(this);
            const touchEndHandler = this.handleTouchEnd.bind(this);

            canvasSolo.addEventListener('touchstart', touchStartHandler, { passive: false });
            canvasSolo.addEventListener('touchend', touchEndHandler, { passive: false });

            // ✅ STOCKER pour cleanup
            this.listeners.push(
                { element: canvasSolo, event: 'touchstart', handler: touchStartHandler },
                { element: canvasSolo, event: 'touchend', handler: touchEndHandler }
            );

            foundCount++;
        }

        // Attacher listeners au canvas MULTI
        if (canvasMulti) {
            logTouch('✅ Canvas MULTI trouvé, installation listeners...');

            const touchStartHandler = this.handleTouchStart.bind(this);
            const touchEndHandler = this.handleTouchEnd.bind(this);

            canvasMulti.addEventListener('touchstart', touchStartHandler, { passive: false });
            canvasMulti.addEventListener('touchend', touchEndHandler, { passive: false });

            // ✅ STOCKER pour cleanup
            this.listeners.push(
                { element: canvasMulti, event: 'touchstart', handler: touchStartHandler },
                { element: canvasMulti, event: 'touchend', handler: touchEndHandler }
            );

            foundCount++;
        }

        if (foundCount === 0) {
            logTouch('⏳ Aucun canvas trouvé, attente du chargement complet');
            // ✅ FIX #6: Pas de retry automatique (géré par auto-init ou appel manuel)
            return;
        }

        this.isEnabled = true;
        this.isInitialized = true;  // ✅ MARQUER INITIALISÉ
        logTouch(`✅ TouchControls activé sur ${foundCount} canvas`);
    }

    // ═══ TOUCH START ═══
    handleTouchStart(e) {
        // Ne pas interférer si c'est un bouton D-pad
        if (e.target.classList.contains('dpad-btn') ||
            e.target.closest('.dpad-container')) {
            return; // Laisser le D-pad gérer
        }

        e.preventDefault();

        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
    }

    // ═══ TOUCH END ═══
    handleTouchEnd(e) {
        // Ne pas interférer avec D-pad
        if (e.target.classList.contains('dpad-btn') ||
            e.target.closest('.dpad-container')) {
            return;
        }

        e.preventDefault();

        const touch = e.changedTouches[0];
        this.endX = touch.clientX;
        this.endY = touch.clientY;

        this.detectSwipe();
    }

    // ═══ DÉTECTION SWIPE ═══
    detectSwipe() {
        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Vérifier distance minimum
        if (absX < this.minSwipeDistance && absY < this.minSwipeDistance) {
            return; // Trop court
        }

        // Déterminer direction dominante
        let direction = null;

        if (absX > absY) {
            // Swipe horizontal
            direction = deltaX > 0 ? 'RIGHT' : 'LEFT';
        } else {
            // Swipe vertical
            direction = deltaY > 0 ? 'DOWN' : 'UP';
        }

        if (direction) {
            this.sendDirection(direction);
            this.vibrate();
        }
    }

    // ═══ ENVOYER DIRECTION ═══
    sendDirection(direction) {
        // Simuler un événement clavier pour compatibilité avec snake.js
        const keyMap = {
            'UP': 'ArrowUp',
            'DOWN': 'ArrowDown',
            'LEFT': 'ArrowLeft',
            'RIGHT': 'ArrowRight'
        };

        const key = keyMap[direction];
        if (!key) return;

        const event = new KeyboardEvent('keydown', {
            key: key,
            keyCode: this.getKeyCode(key),
            code: key,
            bubbles: true
        });

        document.dispatchEvent(event);

        logTouch(`📱 Swipe détecté : ${direction}`);
    }

    // ═══ KEYCODES ═══
    getKeyCode(key) {
        const codes = {
            'ArrowUp': 38,
            'ArrowDown': 40,
            'ArrowLeft': 37,
            'ArrowRight': 39
        };
        return codes[key] || 0;
    }

    // ═══ VIBRATION ═══
    vibrate() {
        if (!this.vibrationEnabled) return;

        if ('vibrate' in navigator) {
            navigator.vibrate(15); // 15ms vibration légère
        }
    }

    // ═══ TOGGLE VIBRATION ═══
    setVibration(enabled) {
        this.vibrationEnabled = enabled;
        logTouch(`📱 Vibration swipe : ${enabled ? 'ON' : 'OFF'}`);
    }

    // ✅ NOUVELLE MÉTHODE : CLEANUP
    cleanup() {
        logTouch('🧹 TouchControls : Nettoyage des listeners...');

        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });

        this.listeners = [];
        this.isEnabled = false;
        this.isInitialized = false;

        logTouch('✅ TouchControls nettoyé');
    }

    // ✅ RÉINITIALISER (avec cleanup)
    reinit() {
        logTouch('🔄 TouchControls : Réinitialisation...');
        this.cleanup();
        this.init();
    }

    // ═══ DÉSACTIVER ═══
    disable() {
        this.cleanup();
        logTouch('📱 TouchControls désactivé');
    }
}

// Instance globale
window.touchControls = new TouchControls();

// Exposer reinit pour le jeu
window.reinitTouchControls = () => {
    if (window.touchControls) {
        window.touchControls.reinit();
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.touchControls.init(), 500);
    });
} else {
    setTimeout(() => window.touchControls.init(), 500);
}
