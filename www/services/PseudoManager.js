/**
 * PseudoManager - Gestion du pseudo utilisateur (stockage + UI)
 * Centralise la logique de sauvegarde/chargement du pseudo
 */

import { validatePseudo, formatPseudoError } from '../utils/PseudoValidator.js';
import { logger } from './logger.js';

/**
 * Clés localStorage utilisées (pour compatibilité avec anciennes versions)
 */
const STORAGE_KEYS = {
    PRIMARY: 'snakeultra_pseudo',
    LEGACY_1: 'playerPseudo',
    LEGACY_2: 'snakeUltraPseudo'
};

/**
 * Classe de gestion du pseudo utilisateur
 */
class PseudoManagerClass {
    constructor() {
        this.currentPseudo = null;
        this.errorTimeout = null;
    }

    /**
     * Charge le pseudo depuis le localStorage (avec migration des anciennes clés)
     * @returns {string|null} Le pseudo sauvegardé ou null
     */
    load() {
        // Essayer la clé principale
        let pseudo = localStorage.getItem(STORAGE_KEYS.PRIMARY);

        // Si pas trouvé, essayer les anciennes clés (migration)
        if (!pseudo) {
            pseudo = localStorage.getItem(STORAGE_KEYS.LEGACY_1) ||
                     localStorage.getItem(STORAGE_KEYS.LEGACY_2);

            // Migrer vers la nouvelle clé
            if (pseudo) {
                this.save(pseudo);
                logger.log('[PseudoManager] Migration pseudo depuis ancienne clé');
            }
        }

        this.currentPseudo = pseudo;
        return pseudo;
    }

    /**
     * Sauvegarde le pseudo dans le localStorage
     * @param {string} pseudo - Le pseudo à sauvegarder
     * @returns {boolean} true si sauvegardé avec succès
     */
    save(pseudo) {
        const result = validatePseudo(pseudo);

        if (!result.valid) {
            logger.warn('[PseudoManager] Pseudo invalide, non sauvegardé:', result.error);
            return false;
        }

        // Sauvegarder dans toutes les clés pour compatibilité
        localStorage.setItem(STORAGE_KEYS.PRIMARY, result.pseudo);
        localStorage.setItem(STORAGE_KEYS.LEGACY_1, result.pseudo);
        localStorage.setItem(STORAGE_KEYS.LEGACY_2, result.pseudo);

        this.currentPseudo = result.pseudo;
        logger.log('[PseudoManager] Pseudo sauvegardé:', result.pseudo);

        return true;
    }

    /**
     * Supprime le pseudo du localStorage
     */
    clear() {
        localStorage.removeItem(STORAGE_KEYS.PRIMARY);
        localStorage.removeItem(STORAGE_KEYS.LEGACY_1);
        localStorage.removeItem(STORAGE_KEYS.LEGACY_2);
        this.currentPseudo = null;
        logger.log('[PseudoManager] Pseudo supprimé');
    }

    /**
     * Récupère le pseudo courant (depuis cache ou localStorage)
     * @returns {string|null}
     */
    get() {
        if (!this.currentPseudo) {
            this.currentPseudo = this.load();
        }
        return this.currentPseudo;
    }

    /**
     * Vérifie si un pseudo est déjà sauvegardé
     * @returns {boolean}
     */
    exists() {
        return !!this.get();
    }

    /**
     * Récupère le pseudo depuis l'input et le valide
     * @param {string} inputId - ID de l'élément input (default: 'pseudo-input')
     * @returns {string|null} Le pseudo validé ou null si invalide
     */
    getFromInput(inputId = 'pseudo-input') {
        const input = document.getElementById(inputId);
        if (!input) {
            logger.warn('[PseudoManager] Input non trouvé:', inputId);
            return null;
        }

        const result = validatePseudo(input.value);

        if (!result.valid) {
            this.showError(result.error);
            return null;
        }

        return result.pseudo;
    }

    /**
     * Affiche un message d'erreur
     * @param {string} message - Le message d'erreur
     * @param {string} elementId - ID de l'élément d'erreur (default: 'pseudo-error')
     */
    showError(message, elementId = 'pseudo-error') {
        const errorElement = document.getElementById(elementId);

        if (errorElement) {
            errorElement.textContent = formatPseudoError(message);
            errorElement.style.display = 'block';

            // Masquer après 3 secondes
            if (this.errorTimeout) {
                clearTimeout(this.errorTimeout);
            }
            this.errorTimeout = setTimeout(() => {
                errorElement.style.display = 'none';
            }, 3000);
        } else if (window.ModalManager) {
            window.ModalManager.warning(formatPseudoError(message));
        }
    }

    /**
     * Cache le message d'erreur
     * @param {string} elementId - ID de l'élément d'erreur
     */
    hideError(elementId = 'pseudo-error') {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
            this.errorTimeout = null;
        }
    }

    /**
     * Initialise un input pseudo avec validation en temps réel
     * @param {string} inputId - ID de l'élément input
     */
    initInput(inputId = 'pseudo-input') {
        const input = document.getElementById(inputId);
        if (!input) {
            logger.warn('[PseudoManager] Input non trouvé pour init:', inputId);
            return;
        }

        // Charger le pseudo sauvegardé
        const savedPseudo = this.load();
        if (savedPseudo) {
            input.value = savedPseudo;
            logger.log('[PseudoManager] Pseudo chargé dans input:', savedPseudo);
        }

        // Validation en temps réel
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length > 0) {
                const result = validatePseudo(value);
                if (!result.valid) {
                    this.showError(result.error);
                } else {
                    this.hideError();
                }
            } else {
                this.hideError();
            }
        });

        // Sauvegarder à la validation (blur)
        input.addEventListener('blur', (e) => {
            const value = e.target.value.trim();
            if (value.length > 0) {
                const result = validatePseudo(value);
                if (result.valid) {
                    this.save(result.pseudo);
                    input.value = result.pseudo; // Normaliser (trim)
                }
            }
        });

        logger.log('[PseudoManager] Input initialisé:', inputId);
    }
}

// Instance singleton
export const pseudoManager = new PseudoManagerClass();

// Export pour compatibilité avec window.*
window.pseudoManager = pseudoManager;

export default pseudoManager;
