// ============================================
// MESSAGING UI - Interface Messagerie AAA
// ============================================

import { logger } from '../services/logger.js';
import { messagingService } from '../services/MessagingService.js';
import { getItemById } from '../data/items.js';

/**
 * Affiche l'écran de messagerie
 */
export async function showMessaging() {
    logger.log('[MessagingUI] Ouverture messagerie');

    // Récupérer les messages si pas encore fait
    if (!messagingService.initialized) {
        await messagingService.fetchMessages();
    }

    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.id = 'messaging-overlay';
    overlay.className = 'messaging-overlay';

    const messages = messagingService.getMessages();

    overlay.innerHTML = `
        <div class="messaging-container">
            <div class="messaging-header">
                <h2 class="messaging-title">
                    <span class="messaging-icon">📬</span>
                    MESSAGERIE
                </h2>
                <button class="messaging-close" onclick="window.closeMessaging()">✕</button>
            </div>

            <div class="messaging-content">
                ${messages.length === 0 ? `
                    <div class="messaging-empty">
                        <div class="messaging-empty-icon">📭</div>
                        <div class="messaging-empty-text">Aucun message</div>
                        <div class="messaging-empty-sub">Revenez plus tard !</div>
                    </div>
                ` : `
                    <div class="messaging-list">
                        ${messages.map(msg => renderMessageCard(msg)).join('')}
                    </div>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animation d'entrée
    requestAnimationFrame(() => {
        overlay.classList.add('messaging-visible');
    });

    // Son d'ouverture
    if (window.audio) {
        window.audio.confirm?.();
    }
}

/**
 * Rend une carte de message
 */
function renderMessageCard(msg) {
    const isRead = messagingService.isRead(msg.id);
    const isRewardClaimed = messagingService.isRewardClaimed(msg.id);
    const hasReward = msg.reward && Object.keys(msg.reward).length > 0;

    const dateStr = formatDate(msg.date);

    return `
        <div class="message-card ${isRead ? 'read' : 'unread'} ${msg.important ? 'important' : ''}"
             data-id="${msg.id}"
             onclick="window.openMessage('${msg.id}')">

            <div class="message-card-indicator ${isRead ? 'read' : ''}"></div>

            <div class="message-card-icon">${msg.icon}</div>

            <div class="message-card-body">
                <div class="message-card-title">${msg.title}</div>
                <div class="message-card-preview">${truncate(msg.content, 50)}</div>
                <div class="message-card-date">${dateStr}</div>
            </div>

            ${hasReward ? `
                <div class="message-card-reward ${isRewardClaimed ? 'claimed' : ''}">
                    ${isRewardClaimed ? '✅' : '🎁'}
                </div>
            ` : ''}

            ${msg.important && !isRead ? `
                <div class="message-card-badge">NEW</div>
            ` : ''}
        </div>
    `;
}

/**
 * Ouvre un message en détail
 */
export function openMessage(messageId) {
    const msg = messagingService.getMessages().find(m => m.id === messageId);
    if (!msg) return;

    // Marquer comme lu
    messagingService.markAsRead(messageId);

    // Mettre à jour la carte visuellement
    const card = document.querySelector(`.message-card[data-id="${messageId}"]`);
    if (card) {
        card.classList.remove('unread');
        card.classList.add('read');
        const indicator = card.querySelector('.message-card-indicator');
        if (indicator) indicator.classList.add('read');
        const badge = card.querySelector('.message-card-badge');
        if (badge) badge.remove();
    }

    const hasReward = msg.reward && Object.keys(msg.reward).length > 0;
    const isRewardClaimed = messagingService.isRewardClaimed(messageId);

    // Créer le modal de détail
    const modal = document.createElement('div');
    modal.id = 'message-detail-modal';
    modal.className = 'message-detail-overlay';

    modal.innerHTML = `
        <div class="message-detail-container">
            <div class="message-detail-header ${msg.important ? 'important' : ''}">
                <span class="message-detail-icon">${msg.icon}</span>
                <h3 class="message-detail-title">${msg.title}</h3>
            </div>

            <div class="message-detail-date">${formatDate(msg.date)}</div>

            <div class="message-detail-content">${msg.content}</div>

            ${hasReward ? `
                <div class="message-detail-reward ${isRewardClaimed ? 'claimed' : ''}">
                    <div class="reward-title">${isRewardClaimed ? 'Récompense réclamée' : 'Récompense disponible'}</div>
                    <div class="reward-items">
                        ${renderRewardItems(msg.reward)}
                    </div>
                    ${!isRewardClaimed ? `
                        <button class="reward-claim-btn" onclick="window.claimMessageReward('${messageId}')">
                            🎁 RÉCLAMER
                        </button>
                    ` : ''}
                </div>
            ` : ''}

            <button class="message-detail-close" onclick="window.closeMessageDetail()">
                FERMER
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Animation
    requestAnimationFrame(() => {
        modal.classList.add('visible');
    });

    // Son
    if (window.audio) {
        window.audio.buttonClick?.();
    }
}

/**
 * Rend les items de récompense
 */
function renderRewardItems(reward) {
    const items = [];

    if (reward.coins) {
        items.push(`<div class="reward-item"><span class="reward-emoji">💰</span><span class="reward-value">+${reward.coins}</span></div>`);
    }
    if (reward.xp) {
        items.push(`<div class="reward-item"><span class="reward-emoji">✨</span><span class="reward-value">+${reward.xp} XP</span></div>`);
    }
    if (reward.booster) {
        items.push(`<div class="reward-item"><span class="reward-emoji">⚗️</span><span class="reward-value">Booster +${reward.booster}%</span></div>`);
    }
    if (reward.skin) {
        items.push(`<div class="reward-item"><span class="reward-emoji">🐍</span><span class="reward-value">Skin exclusif</span></div>`);
    }
    if (reward.background) {
        items.push(`<div class="reward-item"><span class="reward-emoji">🎨</span><span class="reward-value">Background exclusif</span></div>`);
    }

    return items.join('');
}

/**
 * Réclame une récompense
 */
export function claimMessageReward(messageId) {
    const reward = messagingService.claimReward(messageId);

    if (reward) {
        // Animation de récompense
        const btn = document.querySelector('.reward-claim-btn');
        if (btn) {
            btn.textContent = '✅ RÉCLAMÉ !';
            btn.disabled = true;
            btn.classList.add('claimed');
        }

        const rewardSection = document.querySelector('.message-detail-reward');
        if (rewardSection) {
            rewardSection.classList.add('claimed');
        }

        // Mettre à jour la carte dans la liste
        const card = document.querySelector(`.message-card[data-id="${messageId}"]`);
        if (card) {
            const rewardIcon = card.querySelector('.message-card-reward');
            if (rewardIcon) {
                rewardIcon.textContent = '✅';
                rewardIcon.classList.add('claimed');
            }
        }

        // 🎁 Si c'est un skin ou background, lancer l'animation de coffre !
        if ((reward.skin || reward.background) && window.chestOpening) {
            // Fermer le modal de message d'abord
            closeMessageDetail();
            closeMessaging();

            // Préparer les données pour le coffre
            const itemId = reward.skin || reward.background;
            const item = getItemById(itemId);

            if (item) {
                // Petit délai pour laisser les modals se fermer
                setTimeout(() => {
                    window.chestOpening.open({
                        item: {
                            type: item.type,
                            id: item.id,
                            name: item.name,
                            emoji: item.emoji,
                            rarity: item.rarity,
                            image: item.image || item.bgValue
                        }
                    });
                }, 400);
            }
            return; // Ne pas afficher la notification standard
        }

        // Son de récompense (pour coins/xp/booster)
        if (window.audio) {
            window.audio.chestCollect?.();
        }

        // Notification (pour coins/xp/booster uniquement)
        if (window.NotificationManager) {
            let text = 'Récompense réclamée : ';
            if (reward.coins) text += `+${reward.coins} 💰 `;
            if (reward.xp) text += `+${reward.xp} XP `;
            if (reward.booster) text += `Booster +${reward.booster}% `;
            window.NotificationManager.show(text, 'success');
        }
    }
}

/**
 * Ferme le modal de détail
 */
export function closeMessageDetail() {
    const modal = document.getElementById('message-detail-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    }

    if (window.audio) {
        window.audio.cancel?.();
    }
}

/**
 * Ferme la messagerie
 */
export function closeMessaging() {
    const overlay = document.getElementById('messaging-overlay');
    if (overlay) {
        overlay.classList.remove('messaging-visible');
        setTimeout(() => overlay.remove(), 300);
    }

    if (window.audio) {
        window.audio.cancel?.();
    }
}

/**
 * Formate une date
 */
function formatDate(date) {
    if (!date) return '';

    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Tronque un texte
 */
function truncate(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// Exposer les fonctions globalement
window.showMessaging = showMessaging;
window.openMessage = openMessage;
window.claimMessageReward = claimMessageReward;
window.closeMessageDetail = closeMessageDetail;
window.closeMessaging = closeMessaging;

logger.log('✅ MessagingUI chargé');
