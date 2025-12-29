/**
 * UIHelpers.js
 * Fonctions utilitaires pour les effets UI du jeu
 *
 * Ces fonctions créent des effets visuels réutilisables
 * (flash, shake, notifications, overlays)
 */

import { logger } from '../services/logger.js';

/**
 * Crée un flash d'écran temporaire
 * @param {string} color - Couleur CSS du flash
 * @param {number} duration - Durée en ms
 * @param {number} opacity - Opacité initiale (0-1)
 */
export function flashScreen(color, duration = 300, opacity = 0.5) {
    const flash = document.createElement('div');
    flash.className = 'ui-flash-effect';
    flash.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: ${color};
        opacity: ${opacity};
        pointer-events: none;
        z-index: 9999;
        transition: opacity ${duration}ms ease-out;
    `;

    document.body.appendChild(flash);

    // Fade out
    requestAnimationFrame(() => {
        flash.style.opacity = '0';
    });

    setTimeout(() => flash.remove(), duration);
}

/**
 * Affiche une annonce centrée temporaire
 * @param {string} text - Texte à afficher
 * @param {string} color - Couleur du texte
 * @param {number} duration - Durée en ms
 * @param {string} size - Taille de police CSS
 */
export function showAnnouncement(text, color = '#ffffff', duration = 1500, size = '48px') {
    const announcement = document.createElement('div');
    announcement.className = 'ui-announcement';
    announcement.innerHTML = `<span>${text}</span>`;
    announcement.style.cssText = `
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%) scale(0.5);
        font-size: ${size};
        font-weight: bold;
        color: ${color};
        text-shadow: 0 0 20px ${color}, 0 0 40px ${color};
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: all 0.3s ease-out;
    `;

    document.body.appendChild(announcement);

    // Animation entrée
    requestAnimationFrame(() => {
        announcement.style.transform = 'translate(-50%, -50%) scale(1)';
        announcement.style.opacity = '1';
    });

    // Animation sortie
    setTimeout(() => {
        announcement.style.transform = 'translate(-50%, -50%) scale(1.2)';
        announcement.style.opacity = '0';
    }, duration - 300);

    setTimeout(() => announcement.remove(), duration);
}

/**
 * Affiche une notification flottante (toast)
 * @param {string} message - Message à afficher
 * @param {string} type - Type: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Durée en ms
 */
export function showToast(message, type = 'info', duration = 3000) {
    const colors = {
        info: '#4A90E2',
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336'
    };

    const toast = document.createElement('div');
    toast.className = 'ui-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: transform 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    // Animation entrée
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Animation sortie
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(-100px)';
    }, duration - 300);

    setTimeout(() => toast.remove(), duration);
}

/**
 * Crée un overlay de chargement
 * @param {string} message - Message de chargement
 * @returns {HTMLElement} L'élément overlay (pour le supprimer plus tard)
 */
export function showLoadingOverlay(message = 'Chargement...') {
    const overlay = document.createElement('div');
    overlay.id = 'ui-loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    overlay.innerHTML = `
        <div class="loading-spinner" style="
            width: 50px;
            height: 50px;
            border: 4px solid #333;
            border-top-color: #00FF87;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <p style="color: white; margin-top: 20px; font-size: 16px;">${message}</p>
    `;

    // Ajouter animation CSS si pas déjà présente
    if (!document.getElementById('ui-helpers-styles')) {
        const style = document.createElement('style');
        style.id = 'ui-helpers-styles';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    return overlay;
}

/**
 * Cache l'overlay de chargement
 */
export function hideLoadingOverlay() {
    const overlay = document.getElementById('ui-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => overlay.remove(), 300);
    }
}

/**
 * Crée un effet de secousse sur un élément
 * @param {HTMLElement} element - Élément à secouer
 * @param {number} intensity - Intensité (pixels)
 * @param {number} duration - Durée en ms
 */
export function shakeElement(element, intensity = 5, duration = 500) {
    if (!element) return;

    const originalTransform = element.style.transform;
    const startTime = Date.now();

    function shake() {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
            element.style.transform = originalTransform;
            return;
        }

        const decay = 1 - (elapsed / duration);
        const offsetX = (Math.random() - 0.5) * intensity * decay * 2;
        const offsetY = (Math.random() - 0.5) * intensity * decay * 2;

        element.style.transform = `${originalTransform} translate(${offsetX}px, ${offsetY}px)`;
        requestAnimationFrame(shake);
    }

    shake();
}

/**
 * Formate un temps en mm:ss
 * @param {number} seconds - Temps en secondes
 * @returns {string} Format "mm:ss"
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formate un nombre avec séparateurs de milliers
 * @param {number} num - Nombre à formater
 * @returns {string} Nombre formaté
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

logger.debug('[UIHelpers] Module chargé');
