// ============================================
// STATS MANAGER - Gestion écran Stats/Carrière AAA
// ============================================

import { logger } from './services/logger.js';

class StatsManager {
    constructor() {
        this.currentMode = 'solo'; // 'solo' ou 'multi'
        logger.log('[StatsManager] Initialisé');
    }

    /**
     * Affiche l'écran stats (remplace ancien modal showCareer)
     */
    showStats() {
        logger.log('[StatsManager] Affichage écran stats');

        // Afficher l'écran
        window.screenManager.show('stats-screen');

        // Appliquer la bannière équipée
        this.applyStatsBanner();

        // Charger données mode Solo par défaut
        this.currentMode = 'solo';
        this.updateStatsDisplay();
    }

    /**
     * Applique la bannière équipée sur la carte ID
     * @param {object} bannerItem - Item bannière (optionnel, sinon récupère l'équipée)
     */
    applyStatsBanner(bannerItem = null) {
        const bannerEl = document.getElementById('stats-banner');
        const imageEl = document.getElementById('stats-banner-image');

        if (!bannerEl || !imageEl) {
            logger.warn('[StatsManager] Éléments bannière stats non trouvés');
            return;
        }

        // Si pas de bannière passée, récupérer l'équipée
        if (!bannerItem && window.boxManager) {
            bannerItem = window.boxManager.getEquippedBanner();
        }

        if (bannerItem && bannerItem.image) {
            // Bannière avec image
            imageEl.src = bannerItem.image;
            imageEl.style.display = 'block';
            bannerEl.classList.remove('default');
            logger.log(`[StatsManager] Bannière stats appliquée: ${bannerItem.name}`);
        } else {
            // Bannière par défaut (gradient CSS)
            imageEl.src = '';
            imageEl.style.display = 'none';
            bannerEl.classList.add('default');
            logger.log('[StatsManager] Bannière stats par défaut appliquée');
        }
    }

    /**
     * Switche entre Solo et Multi
     */
    switchMode(mode) {
        logger.log(`[StatsManager] Switch mode: ${mode}`);

        this.currentMode = mode;

        // Update UI buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-mode') === mode) {
                btn.classList.add('active');
            }
        });

        // Update stats display
        this.updateStatsDisplay();
    }

    /**
     * Met à jour l'affichage selon le mode
     */
    updateStatsDisplay() {
        if (this.currentMode === 'solo') {
            this.displaySoloStats();
        } else {
            this.displayMultiStats();
        }
    }

    /**
     * Affiche les stats SOLO
     */
    displaySoloStats() {
        logger.log('[StatsManager] Affichage stats Solo');

        // ✅ UNIFIÉ : Lecture depuis window.career uniquement
        const career = window.career || {
            level: 1, xp: 0, xpNext: 100,
            totalGames: 0, totalScore: 0, bestScore: 0,
            maxLevel: 0, totalPowerups: 0, totalWalls: 0,
            maxSurvivalTime: 0
        };
        const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';

        // Récupérer rang actuel
        const rank = window.getCurrentRank ? window.getCurrentRank() : {
            emoji: '🥉',
            title: 'Apprenti',
            color: '#CD7F32'
        };

        // Calculer progression XP (formule exponentielle)
        const progressPercent = Math.min((career.xp / career.xpNext) * 100, 100);

        // Trophées SOLO uniquement
        const tr = JSON.parse(localStorage.getItem('tr') || '{}');
        const soloTrophies = window.TROPHIES ?
            Object.entries(window.TROPHIES).filter(([k, t]) => t.category === 'solo') : [];
        const unlocked = soloTrophies.filter(([k, t]) => tr[k]).length;
        const total = soloTrophies.length || 14;

        // Update UI: Badge - Reset complet puis appliquer le bon style
        const badgeEl = document.getElementById('stats-rank-badge');
        badgeEl.className = 'rank-badge';
        badgeEl.style.borderColor = '';
        badgeEl.style.background = '';
        badgeEl.style.boxShadow = '';

        // Appliquer classe CSS ou style inline selon la couleur du grade
        if (rank.color === '#CD7F32') badgeEl.classList.add('bronze');
        else if (rank.color === '#C0C0C0') badgeEl.classList.add('silver');
        else if (rank.color === '#FFD700') badgeEl.classList.add('gold');
        else {
            // Pour les autres grades (platinum, diamond, elite, legend), style inline
            badgeEl.style.borderColor = rank.color;
            badgeEl.style.background = `linear-gradient(135deg, ${rank.color} 0%, ${rank.color}88 100%)`;
        }

        // Update UI: Icon
        document.getElementById('stats-rank-icon').textContent = rank.emoji;

        // Update UI: Player name
        document.getElementById('stats-player-name').textContent = pseudo;

        // Update UI: Rank name
        const rankNameEl = document.getElementById('stats-rank-name');
        rankNameEl.textContent = `${rank.title} nv ${career.level}`;
        rankNameEl.className = 'rank-name';
        if (badgeEl.classList.contains('bronze')) rankNameEl.classList.add('bronze');
        else if (badgeEl.classList.contains('gold')) rankNameEl.classList.add('gold');

        // Update UI: Progress bar
        document.getElementById('stats-progress-fill').style.width = `${progressPercent}%`;

        // Update UI: Card Stats (4 stats importantes)
        const cardStatsHTML = `
            <div class="rank-stat">
                <div class="rank-stat-label">Stage Max</div>
                <div class="rank-stat-value">${career.maxLevel || 0}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Score Total</div>
                <div class="rank-stat-value">${this.formatNumber(career.totalScore || 0)}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Power-Ups</div>
                <div class="rank-stat-value">${career.totalPowerups || 0}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Murs Détruits</div>
                <div class="rank-stat-value">${career.totalWalls || 0}</div>
            </div>
        `;
        document.getElementById('stats-card-stats').innerHTML = cardStatsHTML;

        // Update UI: Overview Stats (4 stats d'ensemble)
        const maxSurvival = this.formatSurvivalTime(career.maxSurvivalTime || 0);
        const overviewHTML = `
            <div class="overview-stat">
                <div class="overview-stat-label">Parties Jouées</div>
                <div class="overview-stat-value">${career.totalGames || 0}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Survie Max</div>
                <div class="overview-stat-value">${maxSurvival}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Meilleur Score</div>
                <div class="overview-stat-value">${this.formatNumber(career.bestScore || 0)}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Trophées Solo</div>
                <div class="overview-stat-value">${unlocked}/${total}</div>
            </div>
        `;
        document.getElementById('stats-overview').innerHTML = overviewHTML;

        // Update UI: Button text
        document.getElementById('stats-ranking-btn').textContent = 'Classement';
    }

    /**
     * Affiche les stats MULTI
     */
    displayMultiStats() {
        logger.log('[StatsManager] Affichage stats Multi');

        // ✅ UNIFIÉ : Lecture depuis window.career uniquement
        const career = window.career || {
            level: 1,
            multiWins: 0,
            totalMultiGames: 0,
            multiCompleted: 0,
            currentStreak: 0,
            bestStreak: 0
        };
        const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';

        // Calculer grade multi via hub-manager
        const multiGrade = window.calculateMultiGrade ?
            window.calculateMultiGrade(career.multiWins || 0) :
            { emoji: '🥉', color: '#CD7F32', label: 'BRONZE' };

        // Update UI: Badge - Reset complet puis appliquer le bon style
        const badgeEl = document.getElementById('stats-rank-badge');
        badgeEl.className = 'rank-badge';
        badgeEl.style.borderColor = '';
        badgeEl.style.background = '';
        badgeEl.style.boxShadow = '';

        // Ajouter la classe CSS selon le grade
        if (multiGrade.color === '#CD7F32') badgeEl.classList.add('bronze');
        else if (multiGrade.color === '#C0C0C0') badgeEl.classList.add('silver');
        else if (multiGrade.color === '#FFD700') badgeEl.classList.add('gold');
        else {
            // Pour platinum et legend, utiliser style inline
            badgeEl.style.borderColor = multiGrade.color;
            badgeEl.style.background = `linear-gradient(135deg, ${multiGrade.color} 0%, ${multiGrade.color}88 100%)`;
        }

        document.getElementById('stats-rank-icon').textContent = multiGrade.emoji;
        document.getElementById('stats-player-name').textContent = pseudo;

        const rankNameEl = document.getElementById('stats-rank-name');
        rankNameEl.textContent = `${multiGrade.label}`;
        rankNameEl.className = 'rank-name';
        rankNameEl.style.color = multiGrade.color;

        // Progression vers le prochain grade
        const progressPercent = this.calculateMultiProgress(career.multiWins || 0);
        document.getElementById('stats-progress-fill').style.width = `${progressPercent}%`;

        // Card Stats Multi (données existantes dans career)
        const wins = career.multiWins || 0;
        const totalGames = career.totalMultiGames || 0;
        const completed = career.multiCompleted || 0;
        const abandons = totalGames - completed; // Calculé
        const losses = completed - wins; // Défaites = parties finies - victoires
        const bestStreak = career.bestStreak || 0;

        const cardStatsHTML = `
            <div class="rank-stat">
                <div class="rank-stat-label">Victoires</div>
                <div class="rank-stat-value">${wins}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Défaites</div>
                <div class="rank-stat-value">${Math.max(0, losses)}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Abandons</div>
                <div class="rank-stat-value">${Math.max(0, abandons)}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Meilleure Série</div>
                <div class="rank-stat-value">${bestStreak}</div>
            </div>
        `;
        document.getElementById('stats-card-stats').innerHTML = cardStatsHTML;

        // Overview Stats Multi
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
        const currentStreak = career.currentStreak || 0;

        // Trophées multi
        const tr = JSON.parse(localStorage.getItem('tr') || '{}');
        const multiTrophies = window.TROPHIES ?
            Object.entries(window.TROPHIES).filter(([k, t]) => t.category === 'multi' && tr[k]).length : 0;
        const totalMultiTrophies = window.TROPHIES ?
            Object.values(window.TROPHIES).filter(t => t.category === 'multi').length : 9;

        const overviewHTML = `
            <div class="overview-stat">
                <div class="overview-stat-label">Parties Jouées</div>
                <div class="overview-stat-value">${totalGames}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Win Rate</div>
                <div class="overview-stat-value">${winRate}%</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Série Actuelle</div>
                <div class="overview-stat-value">${currentStreak}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Trophées Multi</div>
                <div class="overview-stat-value">${multiTrophies}/${totalMultiTrophies}</div>
            </div>
        `;
        document.getElementById('stats-overview').innerHTML = overviewHTML;

        // Button text
        document.getElementById('stats-ranking-btn').textContent = 'Classement Online';
    }

    /**
     * Retour depuis l'écran stats
     */
    backFromStats() {
        logger.log('[StatsManager] Retour depuis stats');
        // Retourner au HUB
        window.screenManager.show('hub');
    }

    /**
     * Calcule la progression vers le prochain grade multi
     * @param {number} wins - Nombre de victoires
     * @returns {number} Pourcentage de progression (0-100)
     */
    calculateMultiProgress(wins) {
        // Seuils des grades multi (BRONZE→SILVER→GOLD→PLATINUM→LEGEND)
        const thresholds = [0, 10, 20, 30, 50];

        // Trouver le grade actuel et le prochain
        let currentThreshold = 0;
        let nextThreshold = 10;

        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (wins >= thresholds[i]) {
                currentThreshold = thresholds[i];
                nextThreshold = thresholds[i + 1] || thresholds[i]; // Max si dernier grade
                break;
            }
        }

        // Si au max grade (LEGEND), 100%
        if (wins >= 50) return 100;

        // Calculer progression
        const progressInGrade = wins - currentThreshold;
        const gradeRange = nextThreshold - currentThreshold;

        return Math.min(Math.round((progressInGrade / gradeRange) * 100), 100);
    }

    /**
     * Formate les grands nombres (12345 → 12,345)
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Formate le temps de survie (secondes → M:SS)
     */
    formatSurvivalTime(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Instance globale
const statsManager = new StatsManager();
window.statsManager = statsManager;

// Fonctions globales pour compatibilité
window.switchStatsMode = (mode) => statsManager.switchMode(mode);
window.backFromStats = () => statsManager.backFromStats();
window.applyStatsBanner = (bannerItem) => statsManager.applyStatsBanner(bannerItem);

logger.log('✅ StatsManager chargé');

export default statsManager;
