/**
 * SNAKE ROGUELIKE - UI des Achievements
 *
 * Gère l'affichage de la page des achievements
 */

import { achievementManager, ACHIEVEMENTS } from './achievements.js';

const CATEGORY_INFO = {
    progression: { name: 'Progression', icon: '📈' },
    combat: { name: 'Combat', icon: '⚔️' },
    collection: { name: 'Collection', icon: '📦' },
    mastery: { name: 'Maîtrise', icon: '🎯' },
    secret: { name: 'Secrets', icon: '🔮' }
};

class AchievementsUI {
    constructor() {
        this.container = null;
    }

    show() {
        // Créer le container s'il n'existe pas
        if (!this.container) {
            this.createPage();
        }

        this.updateContent();
        this.container.classList.add('visible');
    }

    hide() {
        if (this.container) {
            this.container.classList.remove('visible');
        }
    }

    createPage() {
        this.container = document.createElement('div');
        this.container.className = 'achievements-page';
        this.container.id = 'achievements-page';

        this.container.innerHTML = `
            <div class="achievements-close" onclick="achievementsUI.hide()">✕</div>
            <div class="achievements-header">
                <div class="achievements-title">🏆 Achievements</div>
                <div class="achievements-progress" id="achievements-progress-text"></div>
                <div class="achievements-progress-bar">
                    <div class="achievements-progress-fill" id="achievements-progress-fill"></div>
                </div>
            </div>
            <div class="achievements-content" id="achievements-content"></div>
        `;

        document.body.appendChild(this.container);
    }

    updateContent() {
        const progress = achievementManager.getProgress();
        const content = document.getElementById('achievements-content');
        const progressText = document.getElementById('achievements-progress-text');
        const progressFill = document.getElementById('achievements-progress-fill');

        // Mise à jour de la progression
        if (progressText) {
            progressText.textContent = `${progress.unlocked} / ${progress.total} (${progress.percent}%)`;
        }
        if (progressFill) {
            progressFill.style.width = `${progress.percent}%`;
        }

        // Générer le contenu par catégorie
        if (content) {
            content.innerHTML = '';

            for (const [categoryId, categoryInfo] of Object.entries(CATEGORY_INFO)) {
                const achievements = ACHIEVEMENTS.filter(a => a.category === categoryId);
                if (achievements.length === 0) continue;

                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'achievements-category';

                // Compter les débloqués dans cette catégorie
                const unlockedCount = achievements.filter(a => achievementManager.isUnlocked(a.id)).length;

                categoryDiv.innerHTML = `
                    <div class="category-title">
                        <span class="category-icon">${categoryInfo.icon}</span>
                        ${categoryInfo.name}
                        <span style="color: #888; font-size: 14px; margin-left: auto;">${unlockedCount}/${achievements.length}</span>
                    </div>
                    <div class="achievements-grid" id="grid-${categoryId}"></div>
                `;

                content.appendChild(categoryDiv);

                // Ajouter les cartes
                const grid = document.getElementById(`grid-${categoryId}`);
                for (const achievement of achievements) {
                    grid.appendChild(this.createCard(achievement));
                }
            }
        }
    }

    createCard(achievement) {
        const isUnlocked = achievementManager.isUnlocked(achievement.id);
        const unlockData = achievementManager.unlockedAchievements.find(a => a.id === achievement.id);
        const isHidden = achievement.hidden && !isUnlocked;

        const card = document.createElement('div');
        card.className = `achievement-card rarity-${achievement.rarity}`;

        if (!isUnlocked) {
            card.classList.add('locked');
        }

        if (isHidden) {
            card.classList.add('hidden-achievement');
            card.innerHTML = `
                <div class="achievement-card-icon">❓</div>
                <div class="achievement-card-info">
                    <div class="achievement-card-name">Achievement Secret</div>
                    <div class="achievement-card-desc">Continue à jouer pour découvrir...</div>
                </div>
            `;
        } else {
            const dateStr = unlockData ?
                new Date(unlockData.unlockedAt).toLocaleDateString('fr-FR') : '';

            card.innerHTML = `
                <div class="achievement-card-icon">${achievement.icon}</div>
                <div class="achievement-card-info">
                    <div class="achievement-card-name">${achievement.name}</div>
                    <div class="achievement-card-desc">${achievement.description}</div>
                    <div class="achievement-card-reward">+${achievement.xpReward} XP</div>
                    ${dateStr ? `<div class="achievement-card-date">Débloqué le ${dateStr}</div>` : ''}
                </div>
            `;
        }

        return card;
    }
}

// Export singleton
export const achievementsUI = new AchievementsUI();

// Rendre accessible globalement pour le onclick
window.achievementsUI = achievementsUI;

export default achievementsUI;
