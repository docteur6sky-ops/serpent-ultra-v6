// ============================================
// SHOP MANAGER - Gestion des achats in-app
// Plugin: cordova-plugin-purchase
// ============================================

import { logger } from './logger.js';

// ============================================
// DÉFINITION DES PRODUITS
// ============================================

const PRODUCTS = [
    {
        id: 'chest_pack_5',
        type: 'consumable',
        name: 'Pack 5 Coffres',
        description: '5 coffres mystère à ouvrir',
        price: '0,99 €',
        icon: '📦',
        reward: { type: 'chests', amount: 5 }
    },
    {
        id: 'gold_1000',
        type: 'consumable',
        name: '1000 Gold',
        description: 'Pack de 1000 pièces d\'or',
        price: '0,99 €',
        icon: '💰',
        reward: { type: 'coins', amount: 1000 }
    },
    {
        id: 'gold_4000',
        type: 'consumable',
        name: '4000 Gold',
        description: 'Pack de 4000 pièces d\'or',
        price: '2,99 €',
        icon: '💎',
        bonus: '+33%',
        reward: { type: 'coins', amount: 4000 }
    },
    {
        id: 'gold_10000',
        type: 'consumable',
        name: '10000 Gold',
        description: 'Pack de 10000 pièces d\'or',
        price: '4,99 €',
        icon: '👑',
        bonus: '+100%',
        reward: { type: 'coins', amount: 10000 }
    },
    {
        id: 'no_ads',
        type: 'non_consumable',
        name: 'No Ads',
        description: 'Supprime toutes les publicités',
        price: '2,99 €',
        icon: '🚫',
        reward: { type: 'no_ads' }
    },
    {
        id: 'starter_pack',
        type: 'non_consumable',
        name: 'Starter Pack',
        description: '3 coffres + 2000 gold + No Ads',
        price: '4,99 €',
        icon: '🎁',
        bestValue: true,
        reward: { type: 'starter_pack', chests: 3, coins: 2000, noAds: true }
    }
];

// ============================================
// CLASSE SHOP MANAGER
// ============================================

class ShopManager {
    constructor() {
        this.initialized = false;
        this.store = null;
        this.products = PRODUCTS;
        this.purchasedNoAds = false;

        // Charger l'état No Ads depuis localStorage
        this.loadNoAdsStatus();
    }

    /**
     * Initialise le store IAP
     */
    async init() {
        if (this.initialized) return true;

        // Vérifier si on est sur mobile
        if (!window.Capacitor?.isNativePlatform()) {
            logger.log('[Shop] Mode web - IAP simulé');
            this.initialized = true;
            return true;
        }

        try {
            // Attendre que le plugin soit disponible
            if (!window.CdvPurchase) {
                logger.warn('[Shop] Plugin CdvPurchase non disponible');
                this.initialized = true;
                return false;
            }

            this.store = window.CdvPurchase.store;

            // Enregistrer les produits
            this.products.forEach(product => {
                const productType = product.type === 'consumable'
                    ? window.CdvPurchase.ProductType.CONSUMABLE
                    : window.CdvPurchase.ProductType.NON_CONSUMABLE;

                this.store.register({
                    id: product.id,
                    type: productType,
                    platform: window.CdvPurchase.Platform.GOOGLE_PLAY
                });
            });

            // Handlers
            this.store.when()
                .approved(transaction => this.onApproved(transaction))
                .verified(receipt => this.onVerified(receipt))
                .finished(transaction => this.onFinished(transaction))
                .error(error => this.onError(error));

            // Initialiser
            await this.store.initialize([window.CdvPurchase.Platform.GOOGLE_PLAY]);

            this.initialized = true;
            logger.log('[Shop] Store IAP initialisé');

            // Mettre à jour les prix réels
            this.updatePricesFromStore();

            return true;
        } catch (error) {
            logger.error('[Shop] Erreur initialisation:', error);
            this.initialized = true;
            return false;
        }
    }

    /**
     * Met à jour les prix depuis le store
     */
    updatePricesFromStore() {
        if (!this.store) return;

        this.products.forEach(product => {
            const storeProduct = this.store.get(product.id);
            if (storeProduct?.pricing?.price) {
                product.price = storeProduct.pricing.price;
            }
        });
    }

    /**
     * Achat approuvé
     */
    onApproved(transaction) {
        logger.log('[Shop] Achat approuvé:', transaction.products[0]?.id);
        transaction.verify();
    }

    /**
     * Achat vérifié
     */
    onVerified(receipt) {
        logger.log('[Shop] Achat vérifié');
        receipt.finish();
    }

    /**
     * Achat terminé - donner la récompense
     */
    onFinished(transaction) {
        const productId = transaction.products[0]?.id;
        logger.log('[Shop] Achat terminé:', productId);

        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.giveReward(product);
        }
    }

    /**
     * Erreur d'achat
     */
    onError(error) {
        logger.error('[Shop] Erreur achat:', error);

        if (window.NotificationManager) {
            window.NotificationManager.show('Erreur lors de l\'achat', 'error', 3000);
        }
    }

    /**
     * Donne la récompense d'un produit
     */
    giveReward(product) {
        const reward = product.reward;

        switch (reward.type) {
            case 'coins':
                if (window.boxManager) {
                    window.boxManager.addCoins(reward.amount, `Achat ${product.name}`);
                }
                break;

            case 'chests':
                if (window.boxManager) {
                    window.boxManager.addChests(reward.amount);
                }
                break;

            case 'no_ads':
                this.setNoAds(true);
                break;

            case 'starter_pack':
                // Coffres
                if (window.boxManager && reward.chests) {
                    window.boxManager.addChests(reward.chests);
                }
                // Gold
                if (window.boxManager && reward.coins) {
                    window.boxManager.addCoins(reward.coins, 'Starter Pack');
                }
                // No Ads
                if (reward.noAds) {
                    this.setNoAds(true);
                }
                break;
        }

        // Notification de succès
        if (window.NotificationManager) {
            window.NotificationManager.show(`${product.name} obtenu !`, 'success', 3000);
        }

        // Mettre à jour l'UI
        if (window.updateShopUI) {
            window.updateShopUI();
        }

        logger.log(`[Shop] Récompense donnée: ${product.name}`);
    }

    /**
     * Lance l'achat d'un produit
     */
    async purchase(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            logger.error('[Shop] Produit inconnu:', productId);
            return false;
        }

        // Vérifier si déjà acheté (non-consumable)
        if (product.type === 'non_consumable') {
            if (productId === 'no_ads' && this.purchasedNoAds) {
                if (window.NotificationManager) {
                    window.NotificationManager.show('Déjà acheté !', 'warning', 2000);
                }
                return false;
            }
            if (productId === 'starter_pack' && this.hasStarterPack()) {
                if (window.NotificationManager) {
                    window.NotificationManager.show('Déjà acheté !', 'warning', 2000);
                }
                return false;
            }
        }

        // Mode web (test)
        if (!window.Capacitor?.isNativePlatform()) {
            logger.log('[Shop] Achat simulé:', productId);
            this.giveReward(product);

            // Marquer comme acheté si non-consumable
            if (product.type === 'non_consumable') {
                if (productId === 'no_ads' || productId === 'starter_pack') {
                    this.setNoAds(true);
                }
                if (productId === 'starter_pack') {
                    this.setStarterPack(true);
                }
            }
            return true;
        }

        // Achat réel
        if (!this.store) {
            logger.error('[Shop] Store non initialisé');
            return false;
        }

        try {
            const storeProduct = this.store.get(productId);
            if (!storeProduct) {
                logger.error('[Shop] Produit non trouvé dans le store');
                return false;
            }

            await this.store.order(storeProduct);
            return true;
        } catch (error) {
            logger.error('[Shop] Erreur lors de l\'achat:', error);
            return false;
        }
    }

    /**
     * Restaure les achats (non-consumable)
     */
    async restorePurchases() {
        if (!window.Capacitor?.isNativePlatform()) {
            logger.log('[Shop] Restauration simulée (web)');
            return true;
        }

        if (!this.store) {
            logger.error('[Shop] Store non initialisé');
            return false;
        }

        try {
            await this.store.restorePurchases();
            logger.log('[Shop] Achats restaurés');

            if (window.NotificationManager) {
                window.NotificationManager.show('Achats restaurés !', 'success', 2000);
            }

            return true;
        } catch (error) {
            logger.error('[Shop] Erreur restauration:', error);
            return false;
        }
    }

    // ============================================
    // GESTION NO ADS
    // ============================================

    setNoAds(value) {
        this.purchasedNoAds = value;
        localStorage.setItem('shop_no_ads', value ? '1' : '0');

        // Désactiver AdMob si no ads
        if (value && window.adMobManager) {
            window.adMobManager.setTestMode(true); // Empêche les vraies pubs
        }

        logger.log('[Shop] No Ads:', value);
    }

    loadNoAdsStatus() {
        this.purchasedNoAds = localStorage.getItem('shop_no_ads') === '1';
    }

    hasNoAds() {
        return this.purchasedNoAds;
    }

    // ============================================
    // GESTION STARTER PACK
    // ============================================

    setStarterPack(value) {
        localStorage.setItem('shop_starter_pack', value ? '1' : '0');
    }

    hasStarterPack() {
        return localStorage.getItem('shop_starter_pack') === '1';
    }

    // ============================================
    // GETTERS
    // ============================================

    getProducts() {
        return this.products;
    }

    getProduct(productId) {
        return this.products.find(p => p.id === productId);
    }

    getConsumables() {
        return this.products.filter(p => p.type === 'consumable');
    }

    getNonConsumables() {
        return this.products.filter(p => p.type === 'non_consumable');
    }
}

// ============================================
// INSTANCE SINGLETON & EXPORTS
// ============================================

const shopManager = new ShopManager();

// Exposer globalement
window.shopManager = shopManager;

export { shopManager, ShopManager, PRODUCTS };
export default shopManager;
