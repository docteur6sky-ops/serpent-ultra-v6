/**
 * GDPR CONSENT MANAGER
 * Gère le consentement RGPD au premier lancement
 * - Popup de consentement
 * - Sauvegarde des préférences
 * - Accès aux paramètres pour modification
 */

import { logger } from '../services/logger.js';

const STORAGE_KEY = 'gdpr_consent';
const PRIVACY_POLICY_URL = 'https://docteur6sky-ops.github.io/serpent-ultra-v6/privacy-policy.html';

class GDPRConsentManager {
    constructor() {
        this.consent = this.loadConsent();
        this.popup = null;
        this.onConsentGiven = null;
    }

    /**
     * Charge le consentement depuis localStorage
     */
    loadConsent() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            logger.warn('[GDPR] Erreur lecture consent:', e);
        }
        return null;
    }

    /**
     * Sauvegarde le consentement
     */
    saveConsent(consent) {
        this.consent = consent;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
            logger.log('[GDPR] Consentement sauvegardé:', consent);
        } catch (e) {
            logger.warn('[GDPR] Erreur sauvegarde consent:', e);
        }
    }

    /**
     * Vérifie si le consentement a déjà été donné
     */
    hasConsent() {
        return this.consent !== null && this.consent.version === 1;
    }

    /**
     * Retourne les préférences actuelles
     */
    getPreferences() {
        return this.consent || {
            analytics: false,
            personalizedAds: false,
            accepted: false
        };
    }

    /**
     * Vérifie si les pubs personnalisées sont autorisées
     */
    canShowPersonalizedAds() {
        return this.consent?.personalizedAds === true;
    }

    /**
     * Vérifie si les analytics sont autorisés
     */
    canUseAnalytics() {
        return this.consent?.analytics === true;
    }

    /**
     * Affiche le popup de consentement si nécessaire
     * @param {Function} callback - Appelé quand le consentement est donné
     * @returns {boolean} true si le popup est affiché
     */
    showIfNeeded(callback) {
        if (this.hasConsent()) {
            logger.log('[GDPR] Consentement déjà donné');
            if (callback) callback(this.consent);
            return false;
        }

        this.onConsentGiven = callback;
        this.showPopup();
        return true;
    }

    /**
     * Force l'affichage du popup (pour les paramètres)
     */
    showSettings() {
        this.showPopup(true);
    }

    /**
     * Crée et affiche le popup
     */
    showPopup(isSettings = false) {
        // Supprimer popup existant
        this.closePopup();

        const currentPrefs = this.getPreferences();

        const overlay = document.createElement('div');
        overlay.className = 'gdpr-overlay';
        overlay.innerHTML = `
            <div class="gdpr-popup">
                <div class="gdpr-header">
                    <span class="gdpr-icon">🔒</span>
                    <h2 class="gdpr-title">${isSettings ? 'Paramètres de confidentialité' : 'Votre vie privée'}</h2>
                </div>

                <div class="gdpr-content">
                    <p class="gdpr-intro">
                        ${isSettings
                            ? 'Modifiez vos préférences de confidentialité à tout moment.'
                            : 'Nous respectons votre vie privée. Choisissez comment vos données sont utilisées.'
                        }
                    </p>

                    <div class="gdpr-options">
                        <label class="gdpr-option">
                            <div class="gdpr-option-info">
                                <span class="gdpr-option-icon">📊</span>
                                <div class="gdpr-option-text">
                                    <span class="gdpr-option-title">Analytics</span>
                                    <span class="gdpr-option-desc">Données anonymes pour améliorer le jeu</span>
                                </div>
                            </div>
                            <input type="checkbox" id="gdpr-analytics" ${currentPrefs.analytics ? 'checked' : ''}>
                            <span class="gdpr-toggle"></span>
                        </label>

                        <label class="gdpr-option">
                            <div class="gdpr-option-info">
                                <span class="gdpr-option-icon">🎯</span>
                                <div class="gdpr-option-text">
                                    <span class="gdpr-option-title">Publicités personnalisées</span>
                                    <span class="gdpr-option-desc">Annonces basées sur vos centres d'intérêt</span>
                                </div>
                            </div>
                            <input type="checkbox" id="gdpr-ads" ${currentPrefs.personalizedAds ? 'checked' : ''}>
                            <span class="gdpr-toggle"></span>
                        </label>
                    </div>

                    <a href="${PRIVACY_POLICY_URL}" target="_blank" class="gdpr-policy-link">
                        📄 Lire notre politique de confidentialité
                    </a>
                </div>

                <div class="gdpr-actions">
                    ${isSettings ? `
                        <button class="gdpr-btn gdpr-btn-secondary" id="gdpr-cancel">Annuler</button>
                        <button class="gdpr-btn gdpr-btn-primary" id="gdpr-save">Sauvegarder</button>
                    ` : `
                        <button class="gdpr-btn gdpr-btn-secondary" id="gdpr-refuse">Refuser tout</button>
                        <button class="gdpr-btn gdpr-btn-primary" id="gdpr-accept">Accepter</button>
                    `}
                </div>

                <p class="gdpr-note">
                    ${isSettings
                        ? 'Vos choix seront appliqués immédiatement.'
                        : 'Vous pouvez modifier ces choix à tout moment dans les paramètres.'
                    }
                </p>
            </div>
        `;

        document.body.appendChild(overlay);
        this.popup = overlay;

        // Animation d'entrée
        requestAnimationFrame(() => {
            overlay.classList.add('gdpr-visible');
        });

        // Event listeners
        if (isSettings) {
            overlay.querySelector('#gdpr-cancel').addEventListener('click', () => this.closePopup());
            overlay.querySelector('#gdpr-save').addEventListener('click', () => this.handleSaveSettings());
        } else {
            overlay.querySelector('#gdpr-refuse').addEventListener('click', () => this.handleRefuse());
            overlay.querySelector('#gdpr-accept').addEventListener('click', () => this.handleAccept());
        }

        // Son
        if (window.audio) window.audio.buttonClick?.();
    }

    /**
     * Ferme le popup
     */
    closePopup() {
        if (this.popup) {
            this.popup.classList.remove('gdpr-visible');
            setTimeout(() => {
                this.popup?.remove();
                this.popup = null;
            }, 300);
        }
    }

    /**
     * Gère l'acceptation
     */
    handleAccept() {
        const analytics = document.getElementById('gdpr-analytics')?.checked || false;
        const personalizedAds = document.getElementById('gdpr-ads')?.checked || false;

        const consent = {
            version: 1,
            accepted: true,
            analytics,
            personalizedAds,
            timestamp: Date.now()
        };

        this.saveConsent(consent);
        this.closePopup();
        this.applyConsent(consent);

        if (this.onConsentGiven) {
            this.onConsentGiven(consent);
        }

        if (window.audio) window.audio.buttonClick?.();
    }

    /**
     * Gère le refus
     */
    handleRefuse() {
        const consent = {
            version: 1,
            accepted: false,
            analytics: false,
            personalizedAds: false,
            timestamp: Date.now()
        };

        this.saveConsent(consent);
        this.closePopup();
        this.applyConsent(consent);

        if (this.onConsentGiven) {
            this.onConsentGiven(consent);
        }

        if (window.audio) window.audio.buttonClick?.();
    }

    /**
     * Gère la sauvegarde des paramètres
     */
    handleSaveSettings() {
        const analytics = document.getElementById('gdpr-analytics')?.checked || false;
        const personalizedAds = document.getElementById('gdpr-ads')?.checked || false;

        const consent = {
            ...this.consent,
            analytics,
            personalizedAds,
            updatedAt: Date.now()
        };

        this.saveConsent(consent);
        this.closePopup();
        this.applyConsent(consent);

        if (window.NotificationManager) {
            window.NotificationManager.show('Préférences sauvegardées', 'success', 2000);
        }

        if (window.audio) window.audio.buttonClick?.();
    }

    /**
     * Applique le consentement aux services
     */
    applyConsent(consent) {
        // Firebase Analytics
        if (window.firebase?.analytics) {
            try {
                window.firebase.analytics().setAnalyticsCollectionEnabled(consent.analytics);
                logger.log('[GDPR] Firebase Analytics:', consent.analytics ? 'activé' : 'désactivé');
            } catch (e) {
                logger.warn('[GDPR] Erreur Firebase Analytics:', e);
            }
        }

        // AdMob (sera utilisé plus tard)
        window.gdprConsent = consent;

        logger.log('[GDPR] Consentement appliqué:', consent);
    }

    /**
     * Réinitialise le consentement (pour debug)
     */
    reset() {
        localStorage.removeItem(STORAGE_KEY);
        this.consent = null;
        logger.log('[GDPR] Consentement réinitialisé');
    }
}

// Instance singleton
const gdprConsentManager = new GDPRConsentManager();

// Exports globaux
window.gdprConsentManager = gdprConsentManager;
window.showGDPRSettings = () => gdprConsentManager.showSettings();

logger.log('[GDPR] GDPRConsentManager chargé');

export { gdprConsentManager, GDPRConsentManager };
