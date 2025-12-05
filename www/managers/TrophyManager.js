/**
 * TROPHY MANAGER - Gestion des trophées
 *
 * Responsabilités :
 * - Vérification des trophées
 * - Notifications de déblocage
 * - Affichage overlay trophées
 */

import { logger } from '../services/logger.js';
import { save, load } from '../services/storage.js';
import { createTrophies } from '../data/trophies.js';
import { achievementManager, ACHIEVEMENTS } from '../roguelike/achievements.js';

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
            if (this.unlockedTrophies[key]) continue;

            // Vérifier condition
            if (trophy.check()) {
                this.unlockedTrophies[key] = true;
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

            save('tr', this.unlockedTrophies);
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
     * Récupère les stats des trophées
     */
    getStats() {
        if (!this.trophies) return { unlocked: 0, total: 0, percentage: 0 };

        const total = Object.keys(this.trophies).length;
        const unlocked = Object.keys(this.unlockedTrophies).filter(k => this.unlockedTrophies[k]).length;
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

        return { unlocked, total, percentage };
    }

    /**
     * Affiche l'overlay des trophées
     */
    showTrophiesOverlay(category = 'all') {
        logger.log('[TrophyManager] showTrophiesOverlay() category:', category);

        // Calculer les compteurs roguelike
        const roguelikeProgress = achievementManager.getProgress();

        // Si catégorie roguelike, afficher les achievements
        if (category === 'roguelike') {
            this.showRoguelikeAchievements(roguelikeProgress);
            return;
        }

        if (!this.trophies) {
            logger.error('[TrophyManager] Trophées non initialisés');
            return;
        }

        // Calculer les compteurs par catégorie
        const counts = {
            all: { unlocked: 0, total: 0 },
            solo: { unlocked: 0, total: 0 },
            multi: { unlocked: 0, total: 0 },
            ia: { unlocked: 0, total: 0 },
            secret: { unlocked: 0, total: 0 }
        };

        for (let key in this.trophies) {
            const trophy = this.trophies[key];
            const isUnlocked = this.unlockedTrophies[key] || false;
            const cat = trophy.category || 'solo';

            counts.all.total++;
            if (counts[cat]) counts[cat].total++;

            if (isUnlocked) {
                counts.all.unlocked++;
                if (counts[cat]) counts[cat].unlocked++;
            }
        }

        let content = `
            <div class="overlay-header">
                <h2>🏆 TROPHÉES (${counts.all.unlocked}/${counts.all.total})</h2>
                <button class="overlay-close" onclick="window.audio.buttonClick();window.closeOverlay()">✖</button>
            </div>
        `;

        // Tab Roguelike en haut (plus grand)
        content += `
            <div class="trophy-tabs-roguelike" style="margin-top: 15px;">
                <button class="trophy-tab trophy-tab-roguelike" onclick="window.audio.buttonClick();window.showTrophiesOverlay('roguelike')">
                    🎲 ROGUELIKE (${roguelikeProgress.unlocked}/${roguelikeProgress.total})
                </button>
            </div>
        `;

        // Tabs de catégories classiques
        content += `
            <div class="trophy-tabs" style="margin-top: 10px;">
                <button class="trophy-tab ${category === 'all' ? 'active' : ''}" onclick="window.audio.buttonClick();window.showTrophiesOverlay('all')">
                    TOUS (${counts.all.unlocked}/${counts.all.total})
                </button>
                <button class="trophy-tab ${category === 'solo' ? 'active' : ''}" onclick="window.audio.buttonClick();window.showTrophiesOverlay('solo')">
                    SOLO (${counts.solo.unlocked}/${counts.solo.total})
                </button>
                <button class="trophy-tab ${category === 'multi' ? 'active' : ''}" onclick="window.audio.buttonClick();window.showTrophiesOverlay('multi')">
                    MULTI (${counts.multi.unlocked}/${counts.multi.total})
                </button>
                <button class="trophy-tab ${category === 'ia' ? 'active' : ''}" onclick="window.audio.buttonClick();window.showTrophiesOverlay('ia')">
                    IA (${counts.ia.unlocked}/${counts.ia.total})
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

        // Collecter et trier les trophées par rareté
        const trophyList = [];
        for (let key in this.trophies) {
            const trophy = this.trophies[key];
            const cat = trophy.category || 'solo';

            if (category !== 'all' && cat !== category) continue;
            trophyList.push({ key, trophy });
        }

        trophyList.sort((a, b) => a.trophy.rarity - b.trophy.rarity);

        // Générer la grille
        content += `<div class="trophy-grid-container" style="margin-top: 20px;">`;

        let currentRarity = 0;
        const rarityLabels = {
            1: '⭐ Trophées 1 étoile',
            2: '⭐⭐ Trophées 2 étoiles',
            3: '⭐⭐⭐ Trophées 3 étoiles'
        };

        for (const { key, trophy } of trophyList) {
            if (trophy.rarity !== currentRarity) {
                if (currentRarity !== 0) content += `</div>`;
                currentRarity = trophy.rarity;
                content += `
                    <div class="trophy-rarity-label">${rarityLabels[currentRarity] || `⭐ Rareté ${currentRarity}`}</div>
                    <div class="trophy-grid">
                `;
            }

            const isUnlocked = this.unlockedTrophies[key] || false;
            const stars = '⭐'.repeat(trophy.rarity);

            const displayName = (trophy.secret && !isUnlocked) ? '???' : trophy.name;
            const displayImage = (trophy.secret && !isUnlocked) ? 'locked-treasure-chest.png' : trophy.image;
            const displayDesc = (trophy.secret && !isUnlocked)
                ? (trophy.hint || 'Trophée secret...')
                : trophy.description;

            const cardClass = `trophy-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            content += `
                <div class="${cardClass}" data-rarity="${trophy.rarity}" data-trophy-id="${key}">
                    <img src="assets/trophies/${displayImage}" alt="${displayName}" class="trophy-image" loading="lazy">
                    <div class="trophy-card-name">${displayName}</div>
                    <div class="trophy-card-desc">${displayDesc}</div>
                    <div class="trophy-card-footer">
                        <div class="trophy-rarity">${stars}</div>
                        <div class="trophy-xp">+${trophy.xp} XP</div>
                    </div>
                </div>
            `;
        }

        if (currentRarity !== 0) content += `</div>`;
        content += `</div>`;

        // Utiliser showOverlay global
        if (window.showOverlay) {
            window.showOverlay(content);
        }
    }

    /**
     * Affiche les achievements roguelike dans l'overlay
     */
    showRoguelikeAchievements(progress) {
        const CATEGORY_INFO = {
            progression: { name: 'Progression', icon: '📈' },
            combat: { name: 'Combat', icon: '⚔️' },
            collection: { name: 'Collection', icon: '📦' },
            mastery: { name: 'Maîtrise', icon: '🎯' },
            secret: { name: 'Secrets', icon: '🔮' }
        };

        let content = `
            <div class="overlay-header">
                <h2>🎲 ACHIEVEMENTS ROGUELIKE</h2>
                <button class="overlay-close" onclick="window.audio.buttonClick();window.closeOverlay()">✖</button>
            </div>
        `;

        // Bouton retour vers trophées classiques
        content += `
            <div class="trophy-tabs-roguelike" style="margin-top: 15px;">
                <button class="trophy-tab trophy-tab-roguelike active" onclick="window.audio.buttonClick();">
                    🎲 ROGUELIKE (${progress.unlocked}/${progress.total})
                </button>
            </div>
            <div class="trophy-tabs" style="margin-top: 10px;">
                <button class="trophy-tab" onclick="window.audio.buttonClick();window.showTrophiesOverlay('all')">
                    ← TROPHÉES CLASSIQUES
                </button>
            </div>
        `;

        // Barre de progression globale
        content += `
            <div class="trophy-progress-container" style="margin-top: 15px;">
                <div class="trophy-progress-bar">
                    <div class="trophy-progress-fill" style="width: ${progress.percent}%"></div>
                </div>
                <div class="trophy-progress-text">${progress.unlocked}/${progress.total} débloqués (${progress.percent}%)</div>
            </div>
        `;

        // Grille des achievements par catégorie
        content += `<div class="trophy-grid-container roguelike-achievements" style="margin-top: 20px;">`;

        for (const [categoryId, categoryInfo] of Object.entries(CATEGORY_INFO)) {
            const achievements = ACHIEVEMENTS.filter(a => a.category === categoryId);
            if (achievements.length === 0) continue;

            const unlockedCount = achievements.filter(a => achievementManager.isUnlocked(a.id)).length;

            content += `
                <div class="trophy-rarity-label" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${categoryInfo.icon} ${categoryInfo.name}</span>
                    <span style="color: #888; font-size: 12px;">${unlockedCount}/${achievements.length}</span>
                </div>
                <div class="trophy-grid roguelike-grid">
            `;

            for (const achievement of achievements) {
                const isUnlocked = achievementManager.isUnlocked(achievement.id);
                const isHidden = achievement.hidden && !isUnlocked;
                const unlockData = achievementManager.unlockedAchievements.find(a => a.id === achievement.id);

                const cardClass = `trophy-card achievement-card rarity-${achievement.rarity} ${isUnlocked ? 'unlocked' : 'locked'}`;

                if (isHidden) {
                    content += `
                        <div class="${cardClass} hidden-achievement">
                            <div class="achievement-icon">❓</div>
                            <div class="trophy-card-name">???</div>
                            <div class="trophy-card-desc">Continue à jouer pour découvrir...</div>
                        </div>
                    `;
                } else {
                    const dateStr = unlockData ? new Date(unlockData.unlockedAt).toLocaleDateString('fr-FR') : '';
                    content += `
                        <div class="${cardClass}">
                            <div class="achievement-icon">${achievement.icon}</div>
                            <div class="trophy-card-name">${achievement.name}</div>
                            <div class="trophy-card-desc">${achievement.description}</div>
                            <div class="trophy-card-footer">
                                <div class="achievement-rarity rarity-${achievement.rarity}">${achievement.rarity.toUpperCase()}</div>
                                <div class="trophy-xp">+${achievement.xpReward} XP</div>
                            </div>
                            ${dateStr ? `<div class="achievement-date">Débloqué le ${dateStr}</div>` : ''}
                        </div>
                    `;
                }
            }

            content += `</div>`;
        }

        content += `</div>`;

        // Utiliser showOverlay global
        if (window.showOverlay) {
            window.showOverlay(content);
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

logger.log('✅ TrophyManager chargé');

export { trophyManager, TrophyManager };
