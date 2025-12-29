/**
 * PseudoValidator - Validation des pseudos utilisateur
 * Module pur sans dépendances DOM pour faciliter les tests
 */

/**
 * Règles de validation du pseudo
 */
export const PSEUDO_RULES = {
    MIN_LENGTH: 3,
    MAX_LENGTH: 12,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
    ALLOWED_CHARS: 'lettres, chiffres, _ et -'
};

/**
 * Valide un pseudo selon les règles définies
 * @param {string} pseudo - Le pseudo à valider
 * @returns {{valid: boolean, pseudo?: string, error?: string}}
 */
export function validatePseudo(pseudo) {
    if (!pseudo || typeof pseudo !== 'string') {
        return { valid: false, error: 'Le pseudo est requis' };
    }

    const trimmed = pseudo.trim();

    // Vérifier longueur minimale
    if (trimmed.length < PSEUDO_RULES.MIN_LENGTH) {
        return {
            valid: false,
            error: `Le pseudo doit contenir au moins ${PSEUDO_RULES.MIN_LENGTH} caractères`
        };
    }

    // Vérifier longueur maximale
    if (trimmed.length > PSEUDO_RULES.MAX_LENGTH) {
        return {
            valid: false,
            error: `Le pseudo ne peut pas dépasser ${PSEUDO_RULES.MAX_LENGTH} caractères`
        };
    }

    // Vérifier caractères autorisés
    if (!PSEUDO_RULES.PATTERN.test(trimmed)) {
        return {
            valid: false,
            error: `Caractères autorisés: ${PSEUDO_RULES.ALLOWED_CHARS}`
        };
    }

    return { valid: true, pseudo: trimmed };
}

/**
 * Nettoie un pseudo (trim + normalisation)
 * @param {string} pseudo - Le pseudo à nettoyer
 * @returns {string} Le pseudo nettoyé
 */
export function sanitizePseudo(pseudo) {
    if (!pseudo || typeof pseudo !== 'string') {
        return '';
    }
    return pseudo.trim();
}

/**
 * Vérifie rapidement si un pseudo est valide (sans messages d'erreur détaillés)
 * @param {string} pseudo - Le pseudo à vérifier
 * @returns {boolean}
 */
export function isValidPseudo(pseudo) {
    return validatePseudo(pseudo).valid;
}

/**
 * Génère un message d'erreur formaté pour l'affichage
 * @param {string} error - Le message d'erreur
 * @returns {string} Message formaté avec emoji
 */
export function formatPseudoError(error) {
    return `⚠️ ${error}`;
}

// Export par défaut pour compatibilité
export default {
    PSEUDO_RULES,
    validatePseudo,
    sanitizePseudo,
    isValidPseudo,
    formatPseudoError
};
