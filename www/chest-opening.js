/**
 * CHEST OPENING EXPERIENCE - Expérience AAA d'ouverture de coffre
 *
 * Phase 1: Modal + Révélation progressive
 * Phase 2: Particules (à venir)
 * Phase 3: Sons (à venir)
 */

import { logger } from './services/logger.js';
import { drawSkinPreview } from './SkinsRenderer.js';

class ChestOpeningExperience {
    constructor() {
        this.isOpen = false;
        this.currentRewards = null;

        // Canvas pour particules
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrame = null;

        logger.log('[ChestOpening] Initialisé');
    }

    /**
     * Ouvre le coffre et révèle les récompenses
     * @param {Object} data - { xp, coins?, item? }
     */
    async open(data) {
        if (this.isOpen) {
            logger.warn('[ChestOpening] Coffre déjà ouvert');
            return;
        }

        this.isOpen = true;
        this.currentRewards = data;

        logger.log('[ChestOpening] Ouverture du coffre...', data);

        // Créer le modal
        this.createModal();

        // Phase 1: Anticipation (coffre fermé)
        await this.showAnticipation();

        // Phase 2: Animation ouverture
        await this.playOpenAnimation();

        // Phase 3: Révélation progressive des récompenses
        await this.revealRewards();

        // Phase 4: Attendre que l'utilisateur ferme
        // Le bouton "Collecter" fermera le modal
    }

    /**
     * Crée le modal HTML
     */
    createModal() {
        // Créer overlay
        const overlay = document.createElement('div');
        overlay.id = 'chest-modal';
        overlay.className = 'chest-modal-overlay';

        // ✨ Canvas pour particules (en arrière-plan)
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'chest-particles-canvas';
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');
        overlay.appendChild(this.canvas);

        // Conteneur principal
        const container = document.createElement('div');
        container.className = 'chest-container';

        // Zone coffre (pour l'animation)
        const chestZone = document.createElement('div');
        chestZone.className = 'chest-zone';
        chestZone.innerHTML = `
            <div class="chest-box">
                <img src="assets/hub_pictures/hub_chess.webp" alt="Coffre" class="chest-image">
            </div>
            <div class="chest-tap-hint">Appuyez pour ouvrir</div>
        `;

        // Zone récompenses (vide au début)
        const rewardsZone = document.createElement('div');
        rewardsZone.className = 'chest-rewards-zone hidden';

        // Bouton collecter (caché au début)
        const collectBtn = document.createElement('button');
        collectBtn.className = 'chest-collect-btn hidden';
        collectBtn.textContent = 'COLLECTER';
        collectBtn.onclick = () => {
            // 🔊 Son de collecte satisfaisant
            if (window.audio) {
                window.audio.chestCollect();
            }
            this.close();
        };

        container.appendChild(chestZone);
        container.appendChild(rewardsZone);
        container.appendChild(collectBtn);
        overlay.appendChild(container);

        document.body.appendChild(overlay);

        // Démarrer la boucle d'animation particules
        this.startParticleLoop();

        logger.log('[ChestOpening] Modal créé avec canvas particules');
    }

    /**
     * Phase 1: Attendre le clic de l'utilisateur
     */
    async showAnticipation() {
        logger.log('[ChestOpening] Phase 1: Attente du clic');

        const chestBox = document.querySelector('.chest-box');
        const tapHint = document.querySelector('.chest-tap-hint');

        if (chestBox) {
            chestBox.classList.add('chest-pulse');
        }

        // Afficher le hint après 500ms
        await this.wait(500);
        if (tapHint) {
            tapHint.classList.add('visible');
        }

        // 🔊 Son d'anticipation
        if (window.audio) {
            window.audio.chestPulse();
        }

        // Attendre le clic sur le coffre
        return new Promise((resolve) => {
            const chestZone = document.querySelector('.chest-zone');
            if (chestZone) {
                const handleClick = () => {
                    chestZone.removeEventListener('click', handleClick);
                    if (tapHint) tapHint.classList.remove('visible');
                    logger.log('[ChestOpening] Coffre cliqué !');
                    resolve();
                };
                chestZone.addEventListener('click', handleClick);
            } else {
                resolve();
            }
        });
    }

    /**
     * Phase 2: Animation d'ouverture (1 seconde)
     */
    async playOpenAnimation() {
        logger.log('[ChestOpening] Phase 2: Ouverture');

        const chestBox = document.querySelector('.chest-box');
        const chestZone = document.querySelector('.chest-zone');

        if (chestBox) {
            // Retirer pulse
            chestBox.classList.remove('chest-pulse');

            // Ajouter animation ouverture
            chestBox.classList.add('chest-opening');
        }

        // Attendre 500ms avant l'explosion
        await this.wait(500);

        // 🔊 SON D'OUVERTURE ÉPIQUE
        if (window.audio) {
            window.audio.chestOpen();
        }

        // 💥 EXPLOSION DE PARTICULES au centre de l'écran
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.createExplosion(centerX, centerY, '#FFD700', 80);

        // ✨ EFFETS ÉPIQUES
        this.createScreenFlash();
        this.createScreenShake();

        // Attendre fin animation
        await this.wait(500);

        // Cacher le coffre
        if (chestZone) {
            chestZone.classList.add('hidden');
        }
    }

    /**
     * Phase 3: Révélation progressive des récompenses
     * Affiche un item à la fois avec bouton Suivant
     */
    async revealRewards() {
        logger.log('[ChestOpening] Phase 3: Révélation');

        const rewardsZone = document.querySelector('.chest-rewards-zone');
        if (!rewardsZone) return;

        // Afficher la zone
        rewardsZone.classList.remove('hidden');

        // Titre
        const title = document.createElement('h2');
        title.className = 'chest-rewards-title';
        title.textContent = '✨ RÉCOMPENSES ✨';
        rewardsZone.appendChild(title);

        // Ordre de rareté (commun en premier, légendaire en dernier)
        const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };

        // Collecter toutes les récompenses
        this.allRewards = [];

        // XP (toujours common)
        if (this.currentRewards.xp) {
            this.allRewards.push({
                type: 'xp',
                emoji: '✨',
                text: `+${this.currentRewards.xp} XP`,
                rarity: 'common'
            });
        }

        // Coins (toujours common)
        if (this.currentRewards.coins) {
            this.allRewards.push({
                type: 'coins',
                emoji: '💰',
                text: `+${this.currentRewards.coins} COINS`,
                subtext: `Solde: ${window.boxManager?.getCoins() || 0} 💰`,
                rarity: 'common'
            });
        }

        // ⚗️ Booster XP (rare ou epic selon le %)
        if (this.currentRewards.booster) {
            const percent = this.currentRewards.booster;
            const boosters = window.boxManager?.getBoosters() || { boost25: 0, boost50: 0 };
            const totalBoosters = boosters.boost25 + boosters.boost50;
            this.allRewards.push({
                type: 'booster',
                emoji: '⚗️',
                boostPercent: percent,
                text: `Booster +${percent}%`,
                subtext: `Inventaire: ${totalBoosters} booster${totalBoosters > 1 ? 's' : ''}`,
                rarity: percent >= 50 ? 'epic' : 'rare'
            });
        }

        // Item(s) - peut être un seul ou plusieurs
        if (this.currentRewards.item) {
            const item = this.currentRewards.item;
            this.allRewards.push({
                type: 'item',
                itemType: item.type,
                itemId: item.id,
                emoji: item.emoji,
                image: item.image || null,
                text: item.name,
                subtext: item.rarity.toUpperCase(),
                rarity: item.rarity
            });
        }

        // Items multiples (si le système évolue)
        if (this.currentRewards.items && Array.isArray(this.currentRewards.items)) {
            for (const item of this.currentRewards.items) {
                this.allRewards.push({
                    type: 'item',
                    itemType: item.type,
                    itemId: item.id,
                    emoji: item.emoji,
                    image: item.image || null,
                    text: item.name,
                    subtext: item.rarity.toUpperCase(),
                    rarity: item.rarity
                });
            }
        }

        // Trier par rareté (commun → légendaire)
        this.allRewards.sort((a, b) => (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0));

        // Initialiser l'index
        this.currentRewardIndex = 0;

        // Afficher la première récompense
        await this.wait(300);
        await this.showCurrentReward();
    }

    /**
     * Affiche la récompense actuelle
     */
    async showCurrentReward() {
        const rewardsZone = document.querySelector('.chest-rewards-zone');
        if (!rewardsZone) return;

        const reward = this.allRewards[this.currentRewardIndex];
        const isLastReward = this.currentRewardIndex === this.allRewards.length - 1;

        // Supprimer l'ancienne carte si présente
        const oldCard = rewardsZone.querySelector('.chest-reward-card');
        if (oldCard) {
            oldCard.classList.add('chest-card-exit');
            await this.wait(300);
            oldCard.remove();
        }

        // Supprimer l'ancien bouton
        const oldBtn = rewardsZone.querySelector('.chest-next-btn, .chest-collect-btn');
        if (oldBtn) oldBtn.remove();

        // Supprimer l'ancien indicateur de rareté ou texte externe
        const oldRarity = rewardsZone.querySelector('.chest-rarity-indicator');
        if (oldRarity) oldRarity.remove();
        const oldOutsideText = rewardsZone.querySelector('.chest-outside-text');
        if (oldOutsideText) oldOutsideText.remove();

        // Afficher la nouvelle récompense
        await this.revealReward(reward);

        // Ajouter le bouton approprié
        await this.wait(400);
        const btn = document.createElement('button');

        if (isLastReward) {
            btn.className = 'chest-collect-btn chest-btn-appear';
            btn.textContent = 'COLLECTER';
            btn.onclick = () => {
                if (window.audio) window.audio.chestCollect();
                this.close();
            };
        } else {
            btn.className = 'chest-next-btn chest-btn-appear';
            btn.textContent = `SUIVANT (${this.currentRewardIndex + 1}/${this.allRewards.length})`;
            btn.onclick = () => {
                this.currentRewardIndex++;
                this.showCurrentReward();
            };
        }

        rewardsZone.appendChild(btn);
    }

    /**
     * Révèle une récompense individuelle
     */
    async revealReward(reward) {
        const rewardsZone = document.querySelector('.chest-rewards-zone');
        if (!rewardsZone) return;

        // Créer carte récompense
        const card = document.createElement('div');
        card.className = `chest-reward-card chest-rarity-${reward.rarity}`;

        const rarityEmojis = {
            common: '⚪',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡'
        };

        // Déterminer l'affichage selon le type
        let iconHTML = '';
        const uniqueId = `reward-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Déterminer si c'est une bannière (carte paysage) ou autre (carte portrait)
        const isBanner = reward.itemType === 'banner';
        if (isBanner) {
            card.classList.add('chest-card-landscape');
        }

        // Flag pour savoir si le texte va en dehors de la carte
        let textOutside = false;
        let outsideText = '';

        if (reward.type === 'xp') {
            // 🍎 XP - Pommes : petit (≤250) ou gros (>250)
            const xpValue = parseInt(reward.text.replace(/[^\d]/g, '')) || 0;
            const isSmallXp = xpValue <= 250;
            const xpImage = isSmallXp
                ? 'assets/items_chess_pictures/food_apples_small.webp'
                : 'assets/items_chess_pictures/food_apples2.webp';
            const xpLabel = isSmallXp ? 'Panier de Pommes' : 'Coffre de Pommes';

            iconHTML = `<img src="${xpImage}" alt="XP" class="chest-reward-icon chest-reward-xp chest-reward-fullcard">`;
            textOutside = true;
            outsideText = `<div class="chest-outside-text">
                <div class="chest-outside-main">${xpLabel}</div>
                <div class="chest-outside-sub">+${xpValue} XP</div>
            </div>`;
            card.classList.add('chest-card-imageonly');
        } else if (reward.type === 'coins') {
            // 💰 COINS - Seau (≤100) ou Coffre (>100)
            const coinsValue = parseInt(reward.text.replace(/[^\d]/g, '')) || 0;
            const isSmallCoins = coinsValue <= 100;
            const coinsImage = isSmallCoins
                ? 'assets/items_chess_pictures/coins_reward_alt2.webp'
                : 'assets/items_chess_pictures/coins_reward2.webp';
            const coinsLabel = isSmallCoins ? 'Seau de Gold' : 'Coffre de Gold';

            iconHTML = `<img src="${coinsImage}" alt="Coins" class="chest-reward-icon chest-reward-coins chest-reward-fullcard">`;
            textOutside = true;
            outsideText = `<div class="chest-outside-text">
                <div class="chest-outside-main">${coinsLabel}</div>
                <div class="chest-outside-sub">+${coinsValue} Gold</div>
            </div>`;
            card.classList.add('chest-card-imageonly');
        } else if (reward.type === 'booster') {
            // ⚗️ BOOSTER XP - Stocké dans Ma Box (Partie 2)
            const isEpic = reward.boostPercent >= 50;
            const boosterImage = isEpic
                ? 'assets/items_chess_pictures/xp_boost_epic2.webp'
                : 'assets/items_chess_pictures/xp_boost2.webp';

            iconHTML = `<img src="${boosterImage}" alt="Booster" class="chest-reward-icon chest-reward-booster chest-reward-fullcard">`;
            textOutside = true;
            outsideText = `<div class="chest-outside-text">
                <div class="chest-outside-main">Booster XP</div>
                <div class="chest-outside-sub">+${reward.boostPercent}% pendant 1h</div>
            </div>`;
            card.classList.add('chest-card-imageonly');
        } else if (reward.itemType === 'skin') {
            // Skin → Canvas avec drawSkinPreview
            iconHTML = `<canvas id="${uniqueId}" width="100" height="100" class="chest-reward-canvas"></canvas>`;
        } else if (reward.image) {
            // Bannière ou item avec image
            iconHTML = `<img src="${reward.image}" alt="${reward.text}" class="chest-reward-icon ${isBanner ? 'chest-reward-banner' : ''}">`;
        } else {
            // Fallback emoji
            iconHTML = `<div class="chest-reward-emoji">${reward.emoji}</div>`;
        }

        // Contenu de la carte
        if (textOutside) {
            // Carte image uniquement
            card.innerHTML = iconHTML;
        } else {
            // Carte avec texte à l'intérieur
            card.innerHTML = `
                ${iconHTML}
                <div class="chest-reward-text">${reward.text}</div>
                ${reward.subtext ? `<div class="chest-reward-subtext">${reward.subtext}</div>` : ''}
            `;
        }

        // Stocker le texte externe
        card._textOutside = textOutside;
        card._outsideText = outsideText;

        // Si pas de texte externe défini, créer un texte avec le nom de l'item
        if (!textOutside && reward.text) {
            card._outsideText = `<div class="chest-outside-text">
                <div class="chest-outside-main">${reward.text}</div>
                ${reward.subtext ? `<div class="chest-outside-sub">${reward.subtext}</div>` : ''}
            </div>`;
            card._textOutside = true;
        }

        // Si skin, dessiner après ajout au DOM
        if (reward.itemType === 'skin') {
            card._skinId = reward.itemId;
            card._canvasId = uniqueId;
        }

        rewardsZone.appendChild(card);

        // Ajouter le texte externe (nom de l'item) - PAS d'indicateur de rareté emoji
        if (card._textOutside && card._outsideText) {
            const textContainer = document.createElement('div');
            textContainer.innerHTML = card._outsideText;
            rewardsZone.appendChild(textContainer.firstElementChild);
        }

        // Animation apparition
        setTimeout(() => {
            card.classList.add('chest-card-reveal');

            // 🐍 Dessiner le skin si c'est un skin
            if (card._skinId && card._canvasId) {
                const canvas = document.getElementById(card._canvasId);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    drawSkinPreview(ctx, card._skinId, 100);
                }
            }

            // 🔊 SON selon la rareté
            if (window.audio) {
                switch (reward.rarity) {
                    case 'common':
                        window.audio.rewardCommon();
                        break;
                    case 'rare':
                        window.audio.rewardRare();
                        break;
                    case 'epic':
                        window.audio.rewardEpic();
                        break;
                    case 'legendary':
                        window.audio.rewardLegendary();
                        break;
                }
            }

            // ✨ PARTICULES selon la rareté de la récompense
            // Calculer la position de la carte dans la page
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;

            // Créer particules spécifiques à la rareté
            this.createRarityParticles(reward.rarity, cardCenterX, cardCenterY);
        }, 50);

        // Attendre avant prochaine récompense
        await this.wait(800);
    }

    /**
     * Ferme le modal
     */
    close() {
        logger.log('[ChestOpening] Fermeture');

        // Marquer comme ferme (arrete la boucle particules)
        this.isOpen = false;

        // Annuler la boucle d'animation
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Nettoyer les overlays de skin unlock residuels
        const skinOverlay = document.querySelector('.skin-unlock-overlay');
        const skinNotification = document.querySelector('.skin-unlock-notification');
        const confetti = document.querySelector('.confetti-overlay');
        if (skinOverlay) skinOverlay.remove();
        if (skinNotification) skinNotification.remove();
        if (confetti) confetti.remove();

        const modal = document.getElementById('chest-modal');
        if (modal) {
            // FIX: Desactiver immediatement les interactions pour eviter le blocage
            modal.style.pointerEvents = 'none';

            // Animation de sortie
            modal.classList.add('chest-modal-closing');

            setTimeout(() => {
                modal.remove();
                this.currentRewards = null;
                this.particles = []; // Nettoyer les particules
                logger.log('[ChestOpening] Modal supprime du DOM');
            }, 300);
        }
    }

    /**
     * Utilitaire: attendre X millisecondes
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================
    // SYSTÈME DE PARTICULES
    // ============================================

    /**
     * Démarre la boucle d'animation des particules
     */
    startParticleLoop() {
        const animate = () => {
            if (!this.isOpen) {
                // Arrêter la boucle si le modal est fermé
                cancelAnimationFrame(this.animationFrame);
                return;
            }

            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Mettre à jour et dessiner les particules
            this.updateParticles();
            this.drawParticles();

            // Continuer la boucle
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Crée une explosion de particules
     * @param {number} x - Position X en pixels
     * @param {number} y - Position Y en pixels
     * @param {string} color - Couleur des particules
     * @param {number} count - Nombre de particules
     */
    createExplosion(x, y, color, count = 30) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 4;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: color,
                size: 3 + Math.random() * 3
            });
        }

        logger.log(`[ChestOpening] 💥 Explosion créée: ${count} particules`);
    }

    /**
     * Crée des particules selon la rareté
     * @param {string} rarity - common, rare, epic, legendary
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    createRarityParticles(rarity, x, y) {
        const rarityConfig = {
            common: { color: '#FFFFFF', count: 10 },
            rare: { color: '#4A90E2', count: 20 },
            epic: { color: '#9B59B6', count: 30 },
            legendary: { color: '#FFD700', count: 50 }
        };

        const config = rarityConfig[rarity] || rarityConfig.common;

        // Explosion principale
        this.createExplosion(x, y, config.color, config.count);

        // Pour legendary: ajouter des confettis colorés
        if (rarity === 'legendary') {
            const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'];
            for (let i = 0; i < 30; i++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                this.particles.push({
                    x: x,
                    y: y - 50,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 8 - 2,
                    life: 1.0,
                    color: color,
                    size: 4 + Math.random() * 4,
                    rotation: Math.random() * Math.PI * 2
                });
            }
        }

        logger.log(`[ChestOpening] ✨ Particules ${rarity} créées`);
    }

    /**
     * Met à jour toutes les particules
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Mise à jour position
            p.x += p.vx;
            p.y += p.vy;

            // Gravité
            p.vy += 0.3;

            // Friction
            p.vx *= 0.98;

            // Rotation (si définie)
            if (p.rotation !== undefined) {
                p.rotation += 0.1;
            }

            // Diminution vie
            p.life -= 0.015;

            // Retirer si morte
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Dessine toutes les particules
     */
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;

            if (p.rotation !== undefined) {
                // Dessiner avec rotation (confettis)
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
            } else {
                // Particule simple (cercle)
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    /**
     * Crée un flash d'écran (effet épique)
     */
    createScreenFlash() {
        const flash = document.createElement('div');
        flash.className = 'chest-screen-flash';
        document.body.appendChild(flash);

        // Auto-suppression après l'animation
        setTimeout(() => {
            flash.remove();
        }, 500);

        logger.log('[ChestOpening] ⚡ Flash d\'écran');
    }

    /**
     * Crée un screen shake (effet épique)
     */
    createScreenShake() {
        const modal = document.getElementById('chest-modal');
        if (!modal) return;

        modal.classList.add('chest-screen-shake');

        // Retirer la classe après l'animation
        setTimeout(() => {
            modal.classList.remove('chest-screen-shake');
        }, 500);

        logger.log('[ChestOpening] 📳 Screen shake');
    }
}

// Instance globale
window.chestOpening = new ChestOpeningExperience();

logger.log('✅ ChestOpeningExperience chargé');

export { ChestOpeningExperience };
