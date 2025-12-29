/**
 * ModalManager.js
 * Gestionnaire centralisé des modales pour remplacer les alert() natifs
 *
 * Usage:
 *   window.ModalManager.show('Message', 'info');
 *   window.ModalManager.error('Erreur critique');
 *   window.ModalManager.success('Opération réussie');
 *   window.ModalManager.confirm('Êtes-vous sûr ?', () => { ... });
 *
 * @version 1.0.0
 */

import { logger } from '../services/logger.js';

const ModalManager = (function() {
    'use strict';

    let activeModal = null;
    let modalIdCounter = 0;

    // Styles de base pour les modales
    const MODAL_STYLES = {
        overlay: `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: modalFadeIn 0.2s ease-out;
        `,
        container: `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            max-width: 320px;
            width: 90%;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
            animation: modalSlideIn 0.2s ease-out;
        `,
        title: `
            margin: 0 0 12px 0;
            font-size: 1.3em;
            font-weight: bold;
        `,
        message: `
            color: #C0C0C0;
            margin: 0 0 24px 0;
            line-height: 1.5;
            white-space: pre-line;
        `,
        buttonContainer: `
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        `,
        buttonPrimary: `
            padding: 12px 24px;
            background: linear-gradient(135deg, #00FF87 0%, #00CC6A 100%);
            color: #000;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            min-width: 100px;
        `,
        buttonSecondary: `
            padding: 12px 24px;
            background: #333;
            color: white;
            border: 1px solid #555;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            min-width: 100px;
        `,
        buttonDanger: `
            padding: 12px 24px;
            background: linear-gradient(135deg, #FF6B6B 0%, #CC3636 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            min-width: 100px;
        `
    };

    // Couleurs selon le type
    const TYPE_COLORS = {
        info: '#00A5FF',
        success: '#00FF87',
        warning: '#FFD700',
        error: '#FF6B6B'
    };

    // Icônes selon le type
    const TYPE_ICONS = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };

    /**
     * Injecte les styles CSS pour les animations
     */
    function injectStyles() {
        if (document.getElementById('modal-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'modal-manager-styles';
        style.textContent = `
            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalSlideIn {
                from { transform: scale(0.9) translateY(-20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            @keyframes modalFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Ferme la modale active
     */
    function close() {
        if (!activeModal) return;

        activeModal.style.animation = 'modalFadeOut 0.15s ease-in';
        setTimeout(() => {
            if (activeModal && activeModal.parentNode) {
                activeModal.remove();
            }
            activeModal = null;
        }, 150);
    }

    /**
     * Affiche une modale
     * @param {string} message - Message à afficher
     * @param {string} type - Type: 'info', 'success', 'warning', 'error'
     * @param {Object} options - Options supplémentaires
     */
    function show(message, type = 'info', options = {}) {
        injectStyles();

        // Fermer modale existante
        if (activeModal) {
            activeModal.remove();
            activeModal = null;
        }

        const {
            title = null,
            buttonText = 'OK',
            onClose = null,
            autoClose = 0
        } = options;

        const modalId = 'modal-' + (modalIdCounter++);
        const color = TYPE_COLORS[type] || TYPE_COLORS.info;
        const icon = TYPE_ICONS[type] || TYPE_ICONS.info;

        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.style.cssText = MODAL_STYLES.overlay;

        const displayTitle = title || (type === 'error' ? 'Erreur' : type === 'success' ? 'Succès' : type === 'warning' ? 'Attention' : 'Information');

        overlay.innerHTML = `
            <div style="${MODAL_STYLES.container} border: 2px solid ${color}; box-shadow: 0 0 30px ${color}33;">
                <h2 style="${MODAL_STYLES.title} color: ${color};">${icon} ${displayTitle}</h2>
                <p style="${MODAL_STYLES.message}">${message}</p>
                <div style="${MODAL_STYLES.buttonContainer}">
                    <button id="${modalId}-ok" style="${MODAL_STYLES.buttonPrimary}">${buttonText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        activeModal = overlay;

        // Event listeners
        const okBtn = document.getElementById(`${modalId}-ok`);
        okBtn.addEventListener('click', () => {
            close();
            if (onClose) onClose();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
                if (onClose) onClose();
            }
        });

        // Auto-close si spécifié
        if (autoClose > 0) {
            setTimeout(() => {
                close();
                if (onClose) onClose();
            }, autoClose);
        }

        logger.log(`[ModalManager] Modale ${type}: ${message.substring(0, 50)}...`);
    }

    /**
     * Modale d'erreur
     */
    function error(message, options = {}) {
        show(message, 'error', options);
    }

    /**
     * Modale de succès
     */
    function success(message, options = {}) {
        show(message, 'success', options);
    }

    /**
     * Modale d'avertissement
     */
    function warning(message, options = {}) {
        show(message, 'warning', options);
    }

    /**
     * Modale d'information
     */
    function info(message, options = {}) {
        show(message, 'info', options);
    }

    /**
     * Modale de confirmation avec 2 boutons
     * @param {string} message - Message de confirmation
     * @param {Function} onConfirm - Callback si confirmé
     * @param {Function} onCancel - Callback si annulé
     * @param {Object} options - Options supplémentaires
     */
    function confirm(message, onConfirm, onCancel = null, options = {}) {
        injectStyles();

        if (activeModal) {
            activeModal.remove();
            activeModal = null;
        }

        const {
            title = 'Confirmation',
            confirmText = 'Confirmer',
            cancelText = 'Annuler',
            type = 'warning',
            dangerous = false
        } = options;

        const modalId = 'modal-confirm-' + (modalIdCounter++);
        const color = TYPE_COLORS[type] || TYPE_COLORS.warning;
        const icon = TYPE_ICONS[type] || TYPE_ICONS.warning;

        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.style.cssText = MODAL_STYLES.overlay;

        const confirmBtnStyle = dangerous ? MODAL_STYLES.buttonDanger : MODAL_STYLES.buttonPrimary;

        overlay.innerHTML = `
            <div style="${MODAL_STYLES.container} border: 2px solid ${color}; box-shadow: 0 0 30px ${color}33;">
                <h2 style="${MODAL_STYLES.title} color: ${color};">${icon} ${title}</h2>
                <p style="${MODAL_STYLES.message}">${message}</p>
                <div style="${MODAL_STYLES.buttonContainer}">
                    <button id="${modalId}-cancel" style="${MODAL_STYLES.buttonSecondary}">${cancelText}</button>
                    <button id="${modalId}-confirm" style="${confirmBtnStyle}">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        activeModal = overlay;

        // Event listeners
        document.getElementById(`${modalId}-cancel`).addEventListener('click', () => {
            close();
            if (onCancel) onCancel();
        });

        document.getElementById(`${modalId}-confirm`).addEventListener('click', () => {
            close();
            if (onConfirm) onConfirm();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
                if (onCancel) onCancel();
            }
        });

        logger.log(`[ModalManager] Confirm: ${message.substring(0, 50)}...`);
    }

    // API publique
    return {
        show,
        error,
        success,
        warning,
        info,
        confirm,
        close
    };

})();

// Exposer globalement
window.ModalManager = ModalManager;

export { ModalManager };
