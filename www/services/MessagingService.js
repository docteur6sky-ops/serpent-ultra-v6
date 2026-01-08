// ============================================
// MESSAGING SERVICE - Messages Admin → Joueurs
// Style AAA avec système de récompenses
// ============================================

import { logger } from './logger.js';
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class MessagingService {
    constructor() {
        this.messages = [];
        this.readMessages = new Set();
        this.claimedRewards = new Set();
        this.unreadCount = 0;
        this.initialized = false;

        // Charger l'état local
        this.loadLocalState();
    }

    /**
     * Charge l'état local (messages lus, récompenses réclamées)
     */
    loadLocalState() {
        try {
            const read = JSON.parse(localStorage.getItem('messages_read') || '[]');
            const claimed = JSON.parse(localStorage.getItem('messages_claimed') || '[]');
            this.readMessages = new Set(read);
            this.claimedRewards = new Set(claimed);
        } catch (e) {
            logger.warn('[Messaging] Erreur chargement état local');
        }
    }

    /**
     * Sauvegarde l'état local
     */
    saveLocalState() {
        try {
            localStorage.setItem('messages_read', JSON.stringify([...this.readMessages]));
            localStorage.setItem('messages_claimed', JSON.stringify([...this.claimedRewards]));
        } catch (e) {
            logger.warn('[Messaging] Erreur sauvegarde état local');
        }
    }

    /**
     * Récupère les messages depuis Firebase
     */
    async fetchMessages() {
        try {
            const db = getFirestore();
            const messagesRef = collection(db, 'admin_messages');
            const q = query(
                messagesRef,
                where('active', '==', true),
                orderBy('date', 'desc')
            );

            const snapshot = await getDocs(q);
            this.messages = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                this.messages.push({
                    id: doc.id,
                    title: data.title || 'Message',
                    content: data.content || '',
                    date: data.date?.toDate() || new Date(),
                    reward: data.reward || null,
                    important: data.important || false,
                    icon: data.icon || '📬'
                });
            });

            this.updateUnreadCount();
            this.initialized = true;

            logger.log(`[Messaging] ${this.messages.length} messages récupérés`);
            return this.messages;
        } catch (error) {
            logger.error('[Messaging] Erreur fetch:', error);
            return [];
        }
    }

    /**
     * Met à jour le compteur de messages non lus
     */
    updateUnreadCount() {
        this.unreadCount = this.messages.filter(m => !this.readMessages.has(m.id)).length;
        this.updateBadge();
    }

    /**
     * Met à jour le badge visuel
     */
    updateBadge() {
        const badge = document.getElementById('messages-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    /**
     * Marque un message comme lu
     */
    markAsRead(messageId) {
        if (!this.readMessages.has(messageId)) {
            this.readMessages.add(messageId);
            this.saveLocalState();
            this.updateUnreadCount();
        }
    }

    /**
     * Vérifie si un message est lu
     */
    isRead(messageId) {
        return this.readMessages.has(messageId);
    }

    /**
     * Vérifie si une récompense a été réclamée
     */
    isRewardClaimed(messageId) {
        return this.claimedRewards.has(messageId);
    }

    /**
     * Réclame une récompense
     */
    claimReward(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message || !message.reward || this.isRewardClaimed(messageId)) {
            return null;
        }

        const reward = message.reward;

        // Appliquer les récompenses
        if (reward.coins) {
            if (window.boxManager) {
                window.boxManager.addCoins(reward.coins);
            }
        }

        if (reward.xp) {
            if (window.xpManager) {
                window.xpManager.addXP(reward.xp);
            } else {
                // Fallback: ajouter directement à la career
                const career = window.load?.('career', {}) || {};
                career.xp = (career.xp || 0) + reward.xp;
                window.save?.('career', career);
            }
        }

        if (reward.booster) {
            if (window.boxManager) {
                if (reward.booster === 50) {
                    window.boxManager.addBooster('boost50');
                } else {
                    window.boxManager.addBooster('boost25');
                }
            }
        }

        // 🐍 Skin cadeau
        if (reward.skin) {
            if (window.boxManager) {
                const unlocked = window.boxManager.unlockItem(reward.skin, 'cadeau message', false);
                if (unlocked) {
                    logger.log(`[Messaging] Skin débloqué: ${reward.skin}`);
                }
            }
        }

        // 🎨 Background cadeau
        if (reward.background) {
            if (window.boxManager) {
                const unlocked = window.boxManager.unlockItem(reward.background, 'cadeau message', false);
                if (unlocked) {
                    logger.log(`[Messaging] Background débloqué: ${reward.background}`);
                }
            }
        }

        // Marquer comme réclamé
        this.claimedRewards.add(messageId);
        this.saveLocalState();

        logger.log(`[Messaging] Récompense réclamée:`, reward);
        return reward;
    }

    /**
     * Retourne les messages
     */
    getMessages() {
        return this.messages;
    }

    /**
     * Retourne le nombre de non lus
     */
    getUnreadCount() {
        return this.unreadCount;
    }
}

// Instance singleton
export const messagingService = new MessagingService();
export default messagingService;
