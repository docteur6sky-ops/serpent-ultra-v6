/**
 * Utilitaires DOM
 * Helpers pour manipuler le DOM de manière sécurisée
 */

import { logger } from '../services/logger.js';

/**
 * Échappe les caractères HTML dangereux pour prévenir XSS
 * @param {string} str - Chaîne à échapper
 * @returns {string} Chaîne échappée safe pour innerHTML
 */
export function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

/**
 * Échappe un objet de données pour utilisation safe dans innerHTML
 * @param {Object} data - Objet avec des valeurs string
 * @returns {Object} Objet avec valeurs échappées
 */
export function escapeObject(data) {
    const escaped = {};
    for (const [key, value] of Object.entries(data)) {
        escaped[key] = typeof value === 'string' ? escapeHtml(value) : value;
    }
    return escaped;
}

/**
 * Récupère un élément par ID de manière sécurisée
 * @param {string} id - ID de l'élément
 * @param {boolean} warnIfNotFound - Logger un warning si non trouvé
 * @returns {HTMLElement|null}
 */
export function getElement(id, warnIfNotFound = true) {
    const element = document.getElementById(id);
    if (!element && warnIfNotFound) {
        logger.warn(`Element '${id}' non trouvé`);
    }
    return element;
}

/**
 * Récupère plusieurs éléments par sélecteur
 * @param {string} selector - Sélecteur CSS
 * @returns {HTMLElement[]}
 */
export function getElements(selector) {
    return Array.from(document.querySelectorAll(selector));
}

/**
 * Ajoute une classe à un élément
 * @param {string|HTMLElement} elementOrId - Élément ou ID
 * @param {string} className - Classe à ajouter
 */
export function addClass(elementOrId, className) {
    const element = typeof elementOrId === 'string'
        ? getElement(elementOrId, false)
        : elementOrId;

    if (element) {
        element.classList.add(className);
    }
}

/**
 * Retire une classe d'un élément
 * @param {string|HTMLElement} elementOrId - Élément ou ID
 * @param {string} className - Classe à retirer
 */
export function removeClass(elementOrId, className) {
    const element = typeof elementOrId === 'string'
        ? getElement(elementOrId, false)
        : elementOrId;

    if (element) {
        element.classList.remove(className);
    }
}

/**
 * Toggle une classe sur un élément
 * @param {string|HTMLElement} elementOrId - Élément ou ID
 * @param {string} className - Classe à toggler
 * @returns {boolean} true si classe ajoutée, false si retirée
 */
export function toggleClass(elementOrId, className) {
    const element = typeof elementOrId === 'string'
        ? getElement(elementOrId, false)
        : elementOrId;

    if (element) {
        return element.classList.toggle(className);
    }
    return false;
}

/**
 * Vérifie si un élément a une classe
 * @param {string|HTMLElement} elementOrId - Élément ou ID
 * @param {string} className - Classe à vérifier
 * @returns {boolean}
 */
export function hasClass(elementOrId, className) {
    const element = typeof elementOrId === 'string'
        ? getElement(elementOrId, false)
        : elementOrId;

    return element ? element.classList.contains(className) : false;
}

/**
 * Montre un élément
 * @param {string|HTMLElement} elementOrId - Élément ou ID
 */
export function show(elementOrId) {
    const element = typeof elementOrId === 'string'
        ? getElement(elementOrId, false)
        : elementOrId;

    if (element) {
        element.style.display = '';
        removeClass(element, 'hidden');
    }
}

/**
 * Cache un élément
 * @param {string|HTMLElement} elementOrId - Élément ou ID
 */
export function hide(elementOrId) {
    const element = typeof elementOrId === 'string'
        ? getElement(elementOrId, false)
        : elementOrId;

    if (element) {
        addClass(element, 'hidden');
    }
}

/**
 * Crée un élément avec attributs
 * @param {string} tag - Tag HTML
 * @param {Object} attrs - Attributs
 * @param {string} content - Contenu HTML
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, content = '') {
    const element = document.createElement(tag);

    Object.keys(attrs).forEach(key => {
        if (key === 'className') {
            element.className = attrs[key];
        } else if (key === 'dataset') {
            Object.assign(element.dataset, attrs[key]);
        } else {
            element.setAttribute(key, attrs[key]);
        }
    });

    if (content) {
        element.innerHTML = content;
    }

    return element;
}
