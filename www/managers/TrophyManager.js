/**
 * TROPHY MANAGER - Gestion unifiée des trophées
 *
 * Responsabilités :
 * - Vérification des trophées (classiques + roguelike)
 * - Notifications de déblocage
 * - Affichage overlay trophées unifié
 *
 * Total: 82 trophées
 * - 15 Multi + 10 Boss Rush + 5 Secrets (classiques)
 * - 52 Roguelike (progression, combat, collection, mastery, career, secret)
 */

import { logger } from '../services/logger.js';
import { save, load } from '../services/storage.js';
import { createTrophies } from '../data/trophies.js';
import { achievementManager, ACHIEVEMENTS } from '../roguelike/achievements.js';
import { SnakeUltra } from '../SnakeUltra.js';

// ============================================
// MAPPING RARETÉ ROGUELIKE → ÉTOILES
// ============================================
const RARITY_TO_STARS = {
    'common': 1,
    'rare': 2,
    'epic': 3,
    'legendary': 4
};

// ============================================
// CLASSE TROPHY MANAGER
// ============================================

class TrophyManager {
    constructor() {
        this.trophies = null; // Initialisé après chargement career
        this.unlockedTrophies = load('tr', {});
        this.sessionTrophies = []; // Trophées débloqués cette session
        logger.log('[TrophyManager] Initialisé');
    }

    /**
     * Initialise les trophées avec la référence career
     * Doit être appelé après que CareerManager soit chargé
     */
    init(career) {
        this.trophies = createTrophies(career);
        window.TROPHIES = this.trophies;
        logger.log('[TrophyManager] Trophées initialisés:', Object.keys(this.trophies).length);
    }

    /**
     * Vérifie tous les trophées et débloque ceux qui sont accomplis
     * @returns {array} Liste des nouveaux trophées débloqués
     */
    checkTrophies() {
        if (!this.trophies) {
            logger.warn('[TrophyManager] Trophées non initialisés');
            return [];
        }

        let changed = false;
        let newTrophies = [];
        const oldLevel = window.career ? window.career.level : 1;

        for (let key in this.trophies) {
            const trophy = this.trophies[key];

            // Ignorer si déjà débloqué
            if (this.unlockedTrophies[key]) {
                continue;
            }

            // Vérifier condition
            if (trophy.check()) {
                // Marquer comme débloqué ET sauvegarder IMMÉDIATEMENT
                this.unlockedTrophies[key] = true;
                save('tr', this.unlockedTrophies);

                logger.log(`[TrophyManager] ✅ Trophée débloqué: ${key} - ${trophy.name}`);

                changed = true;
                newTrophies.push({ key, ...trophy });

                // Récompense XP via CareerManager
                if (window.careerManager) {
                    window.careerManager.addXP(trophy.xp);
                }

                // Notification
                this.showTrophyNotification(trophy);
            }
        }

        // Stocker pour l'écran de progression
        if (newTrophies.length > 0) {
            this.sessionTrophies = this.sessionTrophies.concat(newTrophies);
            window.sessionTrophies = this.sessionTrophies;
        }

        if (changed) {
            // Vérifier rank up après gain XP
            if (window.careerManager) {
                const newLevel = window.career.level;
                if (window.careerManager.hasRankChanged(oldLevel, newLevel)) {
                    const newRank = window.careerManager.getCurrentRank();
                    window.careerManager.showRankUpNotification(newRank);
                }
                window.careerManager.updatePlayerInfo();
                window.careerManager.updateRankDisplay();
            }

            // Note: save() déjà fait immédiatement à chaque trophée débloqué
            this.updateTrophiesDisplay();
        }

        return newTrophies;
    }

    /**
     * Affiche la notification de déblocage de trophée
     */
    showTrophyNotification(trophy) {
        if (window.NotificationManager && window.NotificationManager.showTrophyNotification) {
            const audioCallback = (window.audio && window.audio.trophy) ? window.audio.trophy : null;
            window.NotificationManager.showTrophyNotification(trophy, audioCallback);
        }
    }

    /**
     * Met à jour l'affichage des trophées (HTML pour écran carrière)
     */
    updateTrophiesDisplay() {
        if (!this.trophies) return;

        let html = '';
        let unlocked = 0;
        const total = Object.keys(this.trophies).length;

        for (let key in this.trophies) {
            if (this.unlockedTrophies[key]) unlocked++;
            const trophy = this.trophies[key];
            html += `<span class="trophy ${this.unlockedTrophies[key] ? 'unlocked' : ''}" title="${trophy.name}: ${trophy.description}">${trophy.emoji}</span>`;
        }

        window.careerTrophyHTML = html;
        window.careerTrophyCount = `${unlocked}/${total}`;
    }

    /**
     * Vérifie si un trophée est débloqué
     */
    isUnlocked(key) {
        return this.unlockedTrophies[key] || false;
    }

    /**
     * Récupère les stats des trophées (classiques + roguelike)
     */
    getStats() {
        const classicTotal = this.trophies ? Object.keys(this.trophies).length : 0;
        const classicUnlocked = Object.keys(this.unlockedTrophies).filter(k => this.unlockedTrophies[k]).length;

        const roguelikeTotal = ACHIEVEMENTS.length;
        const roguelikeUnlocked = achievementManager.unlockedAchievements.length;

        const total = classicTotal + roguelikeTotal;
        const unlocked = classicUnlocked + roguelikeUnlocked;
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

        return { unlocked, total, percentage };
    }

    /**
     * Calcule les compteurs pour tous les trophées (classiques + roguelike)
     */
    calculateAllCounts() {
        const counts = {
            all: { unlocked: 0, total: 0 },
            multi: { unlocked: 0, total: 0 },
            bossrush: { unlocked: 0, total: 0 },
            roguelike: { unlocked: 0, total: 0 },
            secret: { unlocked: 0, total: 0 }
        };

        // Compter trophées classiques
        if (this.trophies) {
            for (let key in this.trophies) {
                const trophy = this.trophies[key];
                const isUnlocked = this.unlockedTrophies[key] || false;
                const cat = trophy.category || 'multi';

                counts.all.total++;
                if (counts[cat]) counts[cat].total++;

                if (isUnlocked) {
                    counts.all.unlocked++;
                    if (counts[cat]) counts[cat].unlocked++;
                }
            }
        }

        // Compter achievements roguelike
        for (const achievement of ACHIEVEMENTS) {
            const isUnlocked = achievementManager.isUnlocked(achievement.id);

            counts.all.total++;
            counts.roguelike.total++;

            if (isUnlocked) {
                counts.all.unlocked++;
                counts.roguelike.unlocked++;
            }
        }

        return counts;
    }

    /**
     * Affiche l'overlay des trophées unifié
     */
    showTrophiesOverlay(category = 'all') {
        logger.log('[TrophyManager] showTrophiesOverlay() category:', category);

        if (!this.trophies) {
            logger.error('[TrophyManager] Trophées non initialisés');
            return;
        }

        // Calculer tous les compteurs
        const counts = this.calculateAllCounts();

        let content = `
            <div class="overlay-header">
                <h2>🏆 TROPHÉES (${counts.all.unlocked}/${counts.all.total})</h2>
                <button class="overlay-close" onclick="window.audio.buttonClick();window.closeOverlay()">✖</button>
            </div>
        `;

        // Tabs de catégories unifiées
        content += `
            <div class="trophy-tabs" style="margin-top: 15px;">
                <button class="trophy-tab ${category === 'all' ? 'active' : ''}" onclick="window.audio.buttonClick();window.showTrophiesOverlay('all')">
                    TOUS (${counts.all.unlocked}/${counts.all.total})
                </button>
                <button class="trophy-tab ${category === 'multi' ? 'active' : ''}" onclick="window.audio.buttonClick();window.showTrophiesOverlay('multi')">
                    MULTI (${counts.multi.unlocked}/${counts.multi.total})
                </button>
                <button class="trophy-tab ${category === 'bossrush' ? 'active' : ''}" onclick="window.audio.buttonClick();window.showTrophiesOverlay('bossrush')">
                    BOSS (${counts.bossrush.unlocked}/${counts.bossrush.total})
                </button>
                <button class="trophy-tab ${category === 'roguelike' ? 'active' : ''}" onclick="window.audio.buttonClick();window.showTrophiesOverlay('roguelike')">
                    ROGUE (${counts.roguelike.unlocked}/${counts.roguelike.total})
                </button>
                <button class="trophy-tab ${category === 'secret' ? 'active' : ''}" onclick="window.audio.buttonClick();window.showTrophiesOverlay('secret')">
                    🔒 (${counts.secret.unlocked}/${counts.secret.total})
                </button>
            </div>
        `;

        // Barre de progression
        const currentCount = counts[category] || counts.all;
        const progressPercent = currentCount.total > 0 ? Math.round((currentCount.unlocked / currentCount.total) * 100) : 0;
        content += `
            <div class="trophy-progress-container" style="margin-top: 15px;">
                <div class="trophy-progress-bar">
                    <div class="trophy-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="trophy-progress-text">${currentCount.unlocked}/${currentCount.total} débloqués (${progressPercent}%)</div>
            </div>
        `;

        // Collecter tous les trophées selon la catégorie
        const allTrophies = this.collectTrophiesForCategory(category);

        // Trier par nombre d'étoiles
        allTrophies.sort((a, b) => a.stars - b.stars);

        // Générer la grille par étoiles
        content += `<div class="trophy-grid-container" style="margin-top: 20px;">`;

        let currentStars = 0;
        const starsLabels = {
            1: '⭐ Trophées 1 étoile',
            2: '⭐⭐ Trophées 2 étoiles',
            3: '⭐⭐⭐ Trophées 3 étoiles',
            4: '⭐⭐⭐⭐ Trophées 4 étoiles',
            5: '⭐⭐⭐⭐⭐ Trophées 5 étoiles'
        };

        for (const item of allTrophies) {
            if (item.stars !== currentStars) {
                if (currentStars !== 0) content += `</div>`;
                currentStars = item.stars;
                content += `
                    <div class="trophy-rarity-label">${starsLabels[currentStars] || `⭐ Rareté ${currentStars}`}</div>
                    <div class="trophy-grid">
                `;
            }

            content += this.renderTrophyCard(item);
        }

        if (currentStars !== 0) content += `</div>`;
        content += `</div>`;

        // Utiliser showOverlay global
        if (window.showOverlay) {
            window.showOverlay(content);
        }
    }

    /**
     * Collecte les trophées pour une catégorie donnée
     */
    collectTrophiesForCategory(category) {
        const items = [];

        // Ajouter trophées classiques
        if (category === 'all' || category === 'multi' || category === 'bossrush' || category === 'secret') {
            for (let key in this.trophies) {
                const trophy = this.trophies[key];
                const cat = trophy.category || 'multi';

                if (category !== 'all' && cat !== category) continue;

                items.push({
                    type: 'classic',
                    key: key,
                    name: trophy.name,
                    description: trophy.description,
                    emoji: trophy.emoji,
                    image: trophy.image,
                    stars: trophy.rarity,
                    xp: trophy.xp,
                    secret: trophy.secret,
                    hint: trophy.hint,
                    isUnlocked: this.unlockedTrophies[key] || false
                });
            }
        }

        // Ajouter achievements roguelike
        if (category === 'all' || category === 'roguelike') {
            for (const achievement of ACHIEVEMENTS) {
                // Filtrer les secrets roguelike pour la catégorie secret classique
                if (category === 'secret' && achievement.category !== 'secret') continue;

                items.push({
                    type: 'roguelike',
                    key: achievement.id,
                    name: achievement.name,
                    description: achievement.description,
                    emoji: achievement.icon,
                    image: null, // Roguelike utilise des emoji, pas d'images
                    stars: RARITY_TO_STARS[achievement.rarity] || 1,
                    xp: achievement.xpReward,
                    secret: achievement.hidden || false,
                    hint: 'Continue à jouer pour découvrir...',
                    isUnlocked: achievementManager.isUnlocked(achievement.id),
                    rarity: achievement.rarity,
                    category: achievement.category
                });
            }
        }

        return items;
    }

    /**
     * Génère le HTML d'une carte trophée
     */
    renderTrophyCard(item) {
        const stars = '⭐'.repeat(item.stars);
        const isSecret = item.secret && !item.isUnlocked;

        const displayName = isSecret ? '???' : item.name;
        const displayDesc = isSecret ? (item.hint || 'Trophée secret...') : item.description;
        const cardClass = `trophy-card ${item.isUnlocked ? 'unlocked' : 'locked'} ${item.type === 'roguelike' ? 'roguelike-card' : ''}`;

        if (item.type === 'roguelike') {
            // Carte style roguelike (avec emoji)
            const displayEmoji = isSecret ? '❓' : item.emoji;
            return `
                <div class="${cardClass}" data-rarity="${item.stars}" data-trophy-id="${item.key}">
                    <div class="achievement-icon">${displayEmoji}</div>
                    <div class="trophy-card-name">${displayName}</div>
                    <div class="trophy-card-desc">${displayDesc}</div>
                    <div class="trophy-card-footer">
                        <div class="trophy-rarity">${stars}</div>
                        <div class="trophy-xp">+${item.xp} XP</div>
                    </div>
                </div>
            `;
        } else {
            // Carte style classique (avec image)
            const displayImage = isSecret ? 'locked-treasure-chest.png' : item.image;
            return `
                <div class="${cardClass}" data-rarity="${item.stars}" data-trophy-id="${item.key}">
                    <img src="assets/trophies/${displayImage}" alt="${displayName}" class="trophy-image" loading="lazy">
                    <div class="trophy-card-name">${displayName}</div>
                    <div class="trophy-card-desc">${displayDesc}</div>
                    <div class="trophy-card-footer">
                        <div class="trophy-rarity">${stars}</div>
                        <div class="trophy-xp">+${item.xp} XP</div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Reset des trophées
     */
    reset() {
        this.unlockedTrophies = {};
        this.sessionTrophies = [];
        save('tr', {});
        logger.log('[TrophyManager] Reset complet');
    }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

const trophyManager = new TrophyManager();

// Exposer globalement pour compatibilité
window.trophyManager = trophyManager;
window.checkTrophy = () => trophyManager.checkTrophies();
window.updateTrophies = () => trophyManager.updateTrophiesDisplay();
window.showTrophiesOverlay = (cat) => trophyManager.showTrophiesOverlay(cat);

// Enregistrer dans SnakeUltra
SnakeUltra.registerManager('trophy', trophyManager);

logger.log('✅ TrophyManager chargé');

export { trophyManager, TrophyManager };
