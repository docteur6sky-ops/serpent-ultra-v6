// ============================================
// ADMOB MANAGER - Gestion des publicités
// Plugin: @capacitor-community/admob
// ============================================

import { logger } from './logger.js';

class AdMobManager {
    constructor() {
        this.initialized = false;
        this.AdMob = null;

        // ══════════════════════════════════════════
        // IDs des blocs d'annonces AdMob
        // ══════════════════════════════════════════
        this.adUnits = {
            // Interstitiel - affiché au game over
            interstitial: 'ca-app-pub-6394632710385531/8948620336',
            // Rewarded - pour obtenir des boosters/récompenses
            rewarded: 'ca-app-pub-6394632710385531/9152650371',
            // Banner - affichée dans les menus (optionnel)
            banner: ''    // TODO: Ajouter l'ID quand créé
        };

        // Test IDs pour le développement (Google)
        this.testAdUnits = {
            interstitial: 'ca-app-pub-3940256099942544/1033173712',
            rewarded: 'ca-app-pub-3940256099942544/5224354917',
            banner: 'ca-app-pub-3940256099942544/6300978111'
        };

        // Mode test (à désactiver en production)
        this.testMode = true;
    }

    /**
     * Initialise AdMob
     */
    async init() {
        if (this.initialized) return true;

        try {
            // Import dynamique du plugin Capacitor
            const { AdMob } = await import('@capacitor-community/admob');
            this.AdMob = AdMob;

            // Initialisation AdMob
            await AdMob.initialize({
                // Afficher avertissement en mode test
                testingDevices: this.testMode ? ['EMULATOR'] : [],
                // Consentement RGPD - on utilise notre propre système
                initializeForTesting: this.testMode
            });

            this.initialized = true;
            logger.log('[AdMob] Initialisé avec succès');

            // Précharger les pubs
            await this.preloadAds();

            return true;
        } catch (error) {
            logger.error('[AdMob] Erreur initialisation:', error.message);
            return false;
        }
    }

    /**
     * Précharge les publicités pour affichage instantané
     */
    async preloadAds() {
        try {
            // Précharger interstitiel
            await this.prepareInterstitial();
            logger.log('[AdMob] Interstitiel préchargé');
        } catch (e) {
            logger.warn('[AdMob] Préchargement interstitiel échoué:', e.message);
        }

        try {
            // Précharger rewarded si ID disponible
            const rewardedId = this.getAdUnitId('rewarded');
            if (rewardedId) {
                await this.prepareRewarded();
                logger.log('[AdMob] Rewarded préchargé');
            }
        } catch (e) {
            logger.warn('[AdMob] Préchargement rewarded échoué:', e.message);
        }
    }

    /**
     * Récupère l'ID approprié (test ou production)
     */
    getAdUnitId(type) {
        if (this.testMode) {
            return this.testAdUnits[type];
        }
        return this.adUnits[type];
    }

    // ══════════════════════════════════════════
    // INTERSTITIEL (plein écran entre les parties)
    // ══════════════════════════════════════════

    /**
     * Prépare un interstitiel
     */
    async prepareInterstitial() {
        if (!this.AdMob) return;

        await this.AdMob.prepareInterstitial({
            adId: this.getAdUnitId('interstitial'),
            isTesting: this.testMode
        });
    }

    /**
     * Affiche l'interstitiel (ex: au game over)
     * @returns {Promise<boolean>} true si affiché
     */
    async showInterstitial() {
        if (!this.initialized || !this.AdMob) {
            logger.warn('[AdMob] Non initialisé, interstitiel ignoré');
            return false;
        }

        // Vérifier consentement RGPD
        if (!this.hasAdConsent()) {
            logger.log('[AdMob] Pas de consentement pub, interstitiel ignoré');
            return false;
        }

        try {
            await this.AdMob.showInterstitial();
            logger.log('[AdMob] Interstitiel affiché');

            // Préparer le prochain
            setTimeout(() => this.prepareInterstitial(), 1000);

            return true;
        } catch (error) {
            logger.error('[AdMob] Erreur interstitiel:', error.message);
            // Retenter de préparer
            this.prepareInterstitial();
            return false;
        }
    }

    // ══════════════════════════════════════════
    // REWARDED (récompense après visionnage)
    // ══════════════════════════════════════════

    /**
     * Prépare une pub rewarded
     */
    async prepareRewarded() {
        if (!this.AdMob) return;

        const adId = this.getAdUnitId('rewarded');
        if (!adId) return;

        await this.AdMob.prepareRewardVideoAd({
            adId: adId,
            isTesting: this.testMode
        });
    }

    /**
     * Affiche une pub rewarded et retourne la récompense
     * @param {Function} onReward - Callback appelé si récompense obtenue
     * @returns {Promise<boolean>} true si récompense obtenue
     */
    async showRewarded(onReward) {
        if (!this.initialized || !this.AdMob) {
            logger.warn('[AdMob] Non initialisé, rewarded ignoré');
            return false;
        }

        // Vérifier consentement RGPD
        if (!this.hasAdConsent()) {
            logger.log('[AdMob] Pas de consentement pub, rewarded ignoré');
            return false;
        }

        const adId = this.getAdUnitId('rewarded');
        if (!adId) {
            logger.warn('[AdMob] Rewarded ID non configuré');
            return false;
        }

        try {
            // Ajouter listener pour la récompense
            const rewardListener = this.AdMob.addListener('onRewardedVideoAdReward', (reward) => {
                logger.log('[AdMob] Récompense obtenue:', reward);
                if (onReward) onReward(reward);
                rewardListener.remove();
            });

            await this.AdMob.showRewardVideoAd();
            logger.log('[AdMob] Rewarded affiché');

            // Préparer le prochain
            setTimeout(() => this.prepareRewarded(), 1000);

            return true;
        } catch (error) {
            logger.error('[AdMob] Erreur rewarded:', error.message);
            this.prepareRewarded();
            return false;
        }
    }

    // ══════════════════════════════════════════
    // BANNER (bandeau persistant)
    // ══════════════════════════════════════════

    /**
     * Affiche une bannière en bas de l'écran
     */
    async showBanner() {
        if (!this.initialized || !this.AdMob) return false;

        if (!this.hasAdConsent()) {
            logger.log('[AdMob] Pas de consentement pub, banner ignorée');
            return false;
        }

        const adId = this.getAdUnitId('banner');
        if (!adId) {
            logger.warn('[AdMob] Banner ID non configuré');
            return false;
        }

        try {
            await this.AdMob.showBanner({
                adId: adId,
                isTesting: this.testMode,
                position: 'BOTTOM_CENTER',
                margin: 0
            });
            logger.log('[AdMob] Banner affichée');
            return true;
        } catch (error) {
            logger.error('[AdMob] Erreur banner:', error.message);
            return false;
        }
    }

    /**
     * Cache la bannière
     */
    async hideBanner() {
        if (!this.AdMob) return;

        try {
            await this.AdMob.hideBanner();
            logger.log('[AdMob] Banner cachée');
        } catch (error) {
            logger.warn('[AdMob] Erreur hide banner:', error.message);
        }
    }

    /**
     * Supprime la bannière (libère mémoire)
     */
    async removeBanner() {
        if (!this.AdMob) return;

        try {
            await this.AdMob.removeBanner();
            logger.log('[AdMob] Banner supprimée');
        } catch (error) {
            logger.warn('[AdMob] Erreur remove banner:', error.message);
        }
    }

    // ══════════════════════════════════════════
    // UTILITAIRES
    // ══════════════════════════════════════════

    /**
     * Vérifie si l'utilisateur a consenti aux pubs
     */
    hasAdConsent() {
        try {
            const consent = localStorage.getItem('gdpr_consent');
            if (!consent) return false;

            const data = JSON.parse(consent);
            return data.advertising === true;
        } catch {
            return false;
        }
    }

    /**
     * Met à jour les IDs des blocs (appelé après config)
     */
    setAdUnitIds(ids) {
        if (ids.interstitial) this.adUnits.interstitial = ids.interstitial;
        if (ids.rewarded) this.adUnits.rewarded = ids.rewarded;
        if (ids.banner) this.adUnits.banner = ids.banner;
        logger.log('[AdMob] IDs mis à jour:', this.adUnits);
    }

    /**
     * Active/désactive le mode test
     */
    setTestMode(enabled) {
        this.testMode = enabled;
        logger.log(`[AdMob] Mode test: ${enabled}`);
    }
}

// Export singleton
export const adMobManager = new AdMobManager();

// Exposer globalement pour utilisation depuis snake.js etc.
window.adMobManager = adMobManager;
