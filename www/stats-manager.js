// ============================================
// STATS MANAGER - Gestion écran Stats/Carrière AAA
// ============================================

import { logger } from './services/logger.js';
import { achievementManager } from './roguelike/achievements.js';
import roguelikeManager from './roguelike/RoguelikeManager.js';

class StatsManager {
    constructor() {
        this.currentMode = 'aventure'; // 'aventure' (Solo+Roguelike) ou 'arene' (Multi+BossRush)
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

        // Charger données mode AVENTURE par défaut
        this.currentMode = 'aventure';
        this.updateStatsDisplay();

        // Mettre à jour les onglets visuellement
        document.querySelectorAll('.stats-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-mode') === 'aventure') {
                btn.classList.add('active');
            }
        });
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
     * Switche entre AVENTURE et ARÈNE
     */
    switchMode(mode) {
        logger.log(`[StatsManager] Switch mode: ${mode}`);

        this.currentMode = mode;

        // Update UI tabs
        document.querySelectorAll('.stats-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-mode') === mode) {
                btn.classList.add('active');
            }
        });

        // Update stats display
        this.updateStatsDisplay();
    }

    /**
     * Met à jour l'affichage selon le mode unifié
     */
    updateStatsDisplay() {
        if (this.currentMode === 'aventure') {
            this.displayAventureStats(); // Solo + Roguelike
        } else if (this.currentMode === 'arene') {
            this.displayAreneStats(); // Multi + Boss Rush
        }
    }

    /**
     * Affiche les stats AVENTURE (Solo + Roguelike unifiés)
     */
    displayAventureStats() {
        logger.log('[StatsManager] Affichage stats AVENTURE (Solo+Roguelike)');

        const career = window.career || { level: 1 };
        const meta = roguelikeManager.metaProgression || {};
        const stats = achievementManager.getStats();
        const progress = achievementManager.getProgress();
        const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';

        // Utiliser le grade Solo existant (Apprenti, Combattant, etc.)
        const soloGrade = window.calculateSoloGrade ?
            window.calculateSoloGrade(career.level || 1) :
            { emoji: '🥉', color: '#CD7F32', label: 'Apprenti' };

        // Calculer le prochain grade
        const nextGrade = window.calculateSoloGrade ?
            window.calculateSoloGrade((career.level || 1) + 10) :
            { emoji: '🥈', label: 'Combattant' };

        // Update badge
        const badgeEl = document.getElementById('stats-rank-badge');
        badgeEl.className = 'rank-badge aventure-mode';
        badgeEl.style.borderColor = soloGrade.color;
        badgeEl.style.background = `linear-gradient(135deg, ${soloGrade.color}dd 0%, ${soloGrade.color}66 100%)`;

        document.getElementById('stats-rank-icon').textContent = soloGrade.emoji;
        document.getElementById('stats-player-name').textContent = pseudo;

        // Niveau dans le badge (juste le chiffre)
        const levelEl = document.getElementById('stats-rank-level');
        if (levelEl) levelEl.textContent = career.level || 1;

        const gradeContainer = document.getElementById('stats-grade-container');
        document.getElementById('stats-rank-name').textContent = soloGrade.label;
        if (gradeContainer) {
            gradeContainer.style.borderColor = soloGrade.color;
            gradeContainer.style.background = `linear-gradient(135deg, ${soloGrade.color}dd 0%, ${soloGrade.color}66 100%)`;
        }

        // Progression XP vers prochain niveau
        const xp = career.xp || 0;
        const xpNext = career.xpNext || 200;
        const progressPercent = Math.min((xp / xpNext) * 100, 100);
        document.getElementById('stats-progress-fill').style.width = `${progressPercent}%`;

        // Mini stats sur la carte (2x2 comme l'ancien design)
        const miniStatsEl = document.getElementById('stats-card-mini');
        if (miniStatsEl) {
            miniStatsEl.innerHTML = `
                <div class="card-mini-stat">
                    <div class="mini-label">Stage Max</div>
                    <div class="mini-value">${career.maxLevel || 0}</div>
                </div>
                <div class="card-mini-stat">
                    <div class="mini-label">Score Total</div>
                    <div class="mini-value">${this.formatNumber(career.totalScore || 0)}</div>
                </div>
                <div class="card-mini-stat">
                    <div class="mini-label">Power-Ups</div>
                    <div class="mini-value">${career.totalPowerups || 0}</div>
                </div>
                <div class="card-mini-stat">
                    <div class="mini-label">Murs Détruits</div>
                    <div class="mini-value">${career.totalWalls || 0}</div>
                </div>
            `;
        }

        // Grille de stats unifiée AAA (8 stats: 4 Solo + 4 Roguelike)
        const gridHTML = `
            <div class="stats-section">
                <div class="stats-section-title">🎮 Solo Classique</div>
                <div class="stats-row">
                    <div class="stat-item" data-stat="games">
                        <span class="stat-icon">🕹️</span>
                        <span class="stat-value">${career.totalGames || 0}</span>
                        <span class="stat-label">Parties</span>
                    </div>
                    <div class="stat-item" data-stat="best-score">
                        <span class="stat-icon">🏆</span>
                        <span class="stat-value">${this.formatNumber(career.bestScore || 0)}</span>
                        <span class="stat-label">Record</span>
                    </div>
                    <div class="stat-item" data-stat="max-stage">
                        <span class="stat-icon">📈</span>
                        <span class="stat-value">${career.maxLevel || 0}</span>
                        <span class="stat-label">Stage</span>
                    </div>
                    <div class="stat-item" data-stat="survival">
                        <span class="stat-icon">⏱️</span>
                        <span class="stat-value">${this.formatSurvivalTime(career.maxSurvivalTime || 0)}</span>
                        <span class="stat-label">Survie</span>
                    </div>
                </div>
            </div>
            <div class="stats-section">
                <div class="stats-section-title">🎲 Roguelike</div>
                <div class="stats-row">
                    <div class="stat-item" data-stat="runs">
                        <span class="stat-icon">🔄</span>
                        <span class="stat-value">${meta.totalRuns || 0}</span>
                        <span class="stat-label">Runs</span>
                    </div>
                    <div class="stat-item" data-stat="max-stage">
                        <span class="stat-icon">🎯</span>
                        <span class="stat-value">${meta.bestLevel || 0}</span>
                        <span class="stat-label">Stage</span>
                    </div>
                    <div class="stat-item" data-stat="boss">
                        <span class="stat-icon">👹</span>
                        <span class="stat-value">${stats.bossesKilled || 0}</span>
                        <span class="stat-label">Boss</span>
                    </div>
                    <div class="stat-item" data-stat="achievements">
                        <span class="stat-icon">🏅</span>
                        <span class="stat-value">${progress.unlocked}/${progress.total}</span>
                        <span class="stat-label">Succès</span>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('stats-grid-unified').innerHTML = gridHTML;

        // Bouton leaderboard roguelike
        const rankingBtn = document.getElementById('stats-ranking-btn');
        rankingBtn.textContent = '🏆 Leaderboard Roguelike';
        rankingBtn.style.display = '';
        rankingBtn.onclick = () => {
            window.audio?.buttonClick();
            this.showRoguelikeLeaderboard();
        };
    }

    /**
     * Affiche les stats ARÈNE (Multi + Boss Rush unifiés)
     */
    displayAreneStats() {
        logger.log('[StatsManager] Affichage stats ARÈNE (Multi+BossRush)');

        const career = window.career || {};
        const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';

        // Utiliser le grade Multi existant (Bronze, Argent, Or, Platine, Légende)
        const multiWins = career.multiWins || 0;
        const multiGrade = window.calculateMultiGrade ?
            window.calculateMultiGrade(multiWins) :
            { emoji: '🥉', color: '#CD7F32', label: 'BRONZE' };

        // Calculer le prochain grade multi
        const nextMultiGrade = window.calculateMultiGrade ?
            window.calculateMultiGrade(multiWins + 10) :
            { emoji: '🥈', label: 'ARGENT' };

        // Seuils pour afficher victoires restantes
        const multiThresholds = { BRONZE: 0, ARGENT: 10, OR: 20, PLATINE: 30, LÉGENDE: 50 };
        const nextThreshold = Object.entries(multiThresholds).find(([_, v]) => v > multiWins)?.[1] || 50;
        const winsToNext = nextThreshold - multiWins;

        // Update badge
        const badgeEl = document.getElementById('stats-rank-badge');
        badgeEl.className = 'rank-badge arene-mode';
        badgeEl.style.borderColor = multiGrade.color;
        badgeEl.style.background = `linear-gradient(135deg, ${multiGrade.color}dd 0%, ${multiGrade.color}66 100%)`;

        document.getElementById('stats-rank-icon').textContent = multiGrade.emoji;
        document.getElementById('stats-player-name').textContent = pseudo;

        // Victoires dans le badge (juste le chiffre)
        const levelEl = document.getElementById('stats-rank-level');
        if (levelEl) levelEl.textContent = multiWins;

        const gradeContainer = document.getElementById('stats-grade-container');
        document.getElementById('stats-rank-name').textContent = multiGrade.label;
        if (gradeContainer) {
            gradeContainer.style.borderColor = multiGrade.color;
            gradeContainer.style.background = `linear-gradient(135deg, ${multiGrade.color}dd 0%, ${multiGrade.color}66 100%)`;
        }

        // Progression vers le prochain grade multi
        const progressPercent = this.calculateMultiProgress(multiWins);
        document.getElementById('stats-progress-fill').style.width = `${progressPercent}%`;

        // Stats Multi - calculer winRate en premier
        const winRate = (career.totalMultiGames || 0) > 0 ?
            Math.round(((career.multiWins || 0) / (career.totalMultiGames || 1)) * 100) : 0;

        // Mini stats sur la carte (2x2 comme l'ancien design) - Multi
        const miniStatsEl = document.getElementById('stats-card-mini');
        if (miniStatsEl) {
            miniStatsEl.innerHTML = `
                <div class="card-mini-stat">
                    <div class="mini-label">Victoires</div>
                    <div class="mini-value">${career.multiWins || 0}</div>
                </div>
                <div class="card-mini-stat">
                    <div class="mini-label">Défaites</div>
                    <div class="mini-value">${Math.max(0, (career.multiCompleted || 0) - (career.multiWins || 0))}</div>
                </div>
                <div class="card-mini-stat">
                    <div class="mini-label">Win Rate</div>
                    <div class="mini-value">${winRate}%</div>
                </div>
                <div class="card-mini-stat">
                    <div class="mini-label">Série Max</div>
                    <div class="mini-value">${career.bestStreak || 0}</div>
                </div>
            `;
        }

        // Stats Boss Rush
        const bestTimeStr = career.bossRushBestTime ? this.formatBossRushTime(career.bossRushBestTime) : '--:--';
        const totalBossKills = (career.bossRushTitanKills || 0) + (career.bossRushCryoKills || 0) +
                              (career.bossRushSpectreKills || 0) + (career.bossRushFoudreKills || 0);

        // Grille de stats unifiée AAA
        const gridHTML = `
            <div class="stats-section">
                <div class="stats-section-title">🌐 Multijoueur</div>
                <div class="stats-row">
                    <div class="stat-item" data-stat="wins">
                        <span class="stat-icon">🏆</span>
                        <span class="stat-value">${career.multiWins || 0}</span>
                        <span class="stat-label">Victoires</span>
                    </div>
                    <div class="stat-item" data-stat="games">
                        <span class="stat-icon">🎮</span>
                        <span class="stat-value">${career.totalMultiGames || 0}</span>
                        <span class="stat-label">Parties</span>
                    </div>
                    <div class="stat-item" data-stat="winrate">
                        <span class="stat-icon">📊</span>
                        <span class="stat-value">${winRate}%</span>
                        <span class="stat-label">Win Rate</span>
                    </div>
                    <div class="stat-item" data-stat="streak">
                        <span class="stat-icon">🔥</span>
                        <span class="stat-value">${career.bestStreak || 0}</span>
                        <span class="stat-label">Série</span>
                    </div>
                </div>
            </div>
            <div class="stats-section">
                <div class="stats-section-title">👹 Boss Rush</div>
                <div class="stats-row">
                    <div class="stat-item" data-stat="completions">
                        <span class="stat-icon">✅</span>
                        <span class="stat-value">${career.bossRushCompletions || 0}</span>
                        <span class="stat-label">Complètes</span>
                    </div>
                    <div class="stat-item" data-stat="time">
                        <span class="stat-icon">⏱️</span>
                        <span class="stat-value">${bestTimeStr}</span>
                        <span class="stat-label">Record</span>
                    </div>
                    <div class="stat-item" data-stat="boss">
                        <span class="stat-icon">💀</span>
                        <span class="stat-value">${totalBossKills}</span>
                        <span class="stat-label">Boss</span>
                    </div>
                    <div class="stat-item" data-stat="perfect">
                        <span class="stat-icon">⭐</span>
                        <span class="stat-value">${career.bossRushPerfectRuns || 0}</span>
                        <span class="stat-label">Parfaites</span>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('stats-grid-unified').innerHTML = gridHTML;

        // Bouton leaderboard multi
        const rankingBtn = document.getElementById('stats-ranking-btn');
        rankingBtn.textContent = '🏆 Classement Online';
        rankingBtn.style.display = '';
        rankingBtn.onclick = () => {
            window.audio?.buttonClick();
            window.showLeaderboardOverlay?.();
        };
    }

    /**
     * Affiche les stats SOLO (legacy - pour compatibilité)
     */
    displaySoloStats() {
        logger.log('[StatsManager] Affichage stats Solo');

        // ✅ UNIFIÉ : Lecture depuis window.career uniquement
        const career = window.career || {
            level: 1, xp: 0, xpNext: 200,
            totalGames: 0, totalScore: 0, bestScore: 0,
            maxLevel: 0, totalPowerups: 0, totalWalls: 0,
            maxSurvivalTime: 0
        };
        const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';

        // ✅ Utiliser calculateSoloGrade (avec tri correct) au lieu de getCurrentRank
        const gradeData = window.calculateSoloGrade ? window.calculateSoloGrade(career.level) : {
            emoji: '🥉',
            label: 'Apprenti',
            color: '#CD7F32'
        };
        // Adapter le format pour compatibilité (label → title)
        const rank = {
            emoji: gradeData.emoji,
            title: gradeData.label,
            color: gradeData.color
        };

        // Calculer progression XP (formule exponentielle)
        const progressPercent = Math.min((career.xp / career.xpNext) * 100, 100);

        // Achievements Carrière (anciennement trophées solo, maintenant dans roguelike)
        const careerAchievements = achievementManager.getByCategory('career');
        const unlocked = careerAchievements.filter(a => achievementManager.isUnlocked(a.id)).length;
        const total = careerAchievements.length || 7;

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

        // Update UI: Rank name avec conteneur coloré (style hub)
        const rankNameEl = document.getElementById('stats-rank-name');
        const gradeContainer = document.getElementById('stats-grade-container');
        rankNameEl.textContent = rank.title;

        // Appliquer la couleur du grade au conteneur
        if (gradeContainer) {
            gradeContainer.style.borderColor = rank.color;
            gradeContainer.style.background = `linear-gradient(135deg, ${rank.color}66 0%, ${rank.color}33 100%)`;
        }

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
                <div class="overview-stat-label">Achievements</div>
                <div class="overview-stat-value">${unlocked}/${total}</div>
            </div>
        `;
        document.getElementById('stats-overview').innerHTML = overviewHTML;

        // Update UI: Button text
        document.getElementById('stats-ranking-btn').textContent = 'Classement';
        document.getElementById('stats-ranking-btn').style.display = '';

        // Cacher le bouton Daily (visible uniquement en Roguelike)
        const dailyBtn = document.getElementById('stats-daily-btn');
        if (dailyBtn) dailyBtn.style.display = 'none';
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

        // Update UI: Rank name avec conteneur coloré (style hub)
        const rankNameEl = document.getElementById('stats-rank-name');
        const gradeContainer = document.getElementById('stats-grade-container');
        rankNameEl.textContent = multiGrade.label;

        // Appliquer la couleur du grade au conteneur
        if (gradeContainer) {
            gradeContainer.style.borderColor = multiGrade.color;
            gradeContainer.style.background = `linear-gradient(135deg, ${multiGrade.color}66 0%, ${multiGrade.color}33 100%)`;
        }

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
        document.getElementById('stats-ranking-btn').style.display = '';

        // Cacher le bouton Daily
        const dailyBtn = document.getElementById('stats-daily-btn');
        if (dailyBtn) dailyBtn.style.display = 'none';
    }

    /**
     * Affiche les stats Boss Rush
     */
    displayBossRushStats() {
        logger.log('[StatsManager] Affichage stats Boss Rush');

        // Lecture depuis window.career
        const career = window.career || {
            bossRushRuns: 0,
            bossRushCompletions: 0,
            bossRushBestTime: null,
            bossRushTitanKills: 0,
            bossRushCryoKills: 0,
            bossRushSpectreKills: 0,
            bossRushFoudreKills: 0,
            bossRushPerfectRuns: 0,
            bossRushFastRuns: 0
        };
        const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';

        // Calculer le rang Boss Rush basé sur les completions
        const bossRushRank = this.getBossRushRank(career.bossRushCompletions || 0);

        // Update UI: Badge - Style orange/rouge Boss Rush
        const badgeEl = document.getElementById('stats-rank-badge');
        badgeEl.className = 'rank-badge bossrush-mode';
        badgeEl.style.borderColor = bossRushRank.color;
        badgeEl.style.background = `linear-gradient(135deg, ${bossRushRank.color}66 0%, ${bossRushRank.color}33 100%)`;
        badgeEl.style.boxShadow = `0 0 20px ${bossRushRank.color}66`;

        document.getElementById('stats-rank-icon').textContent = bossRushRank.emoji;
        document.getElementById('stats-player-name').textContent = pseudo;

        // Update UI: Rank name avec conteneur coloré
        const rankNameEl = document.getElementById('stats-rank-name');
        const gradeContainer = document.getElementById('stats-grade-container');
        rankNameEl.textContent = bossRushRank.label;

        if (gradeContainer) {
            gradeContainer.style.borderColor = bossRushRank.color;
            gradeContainer.style.background = `linear-gradient(135deg, ${bossRushRank.color}66 0%, ${bossRushRank.color}33 100%)`;
        }

        // Progression vers le prochain rang
        const progressPercent = this.calculateBossRushProgress(career.bossRushCompletions || 0);
        document.getElementById('stats-progress-fill').style.width = `${progressPercent}%`;

        // Card Stats Boss Rush (4 stats principales)
        const totalBossKills = (career.bossRushTitanKills || 0) + (career.bossRushCryoKills || 0) +
                              (career.bossRushSpectreKills || 0) + (career.bossRushFoudreKills || 0);
        const bestTimeStr = career.bossRushBestTime ? this.formatBossRushTime(career.bossRushBestTime) : '--:--';

        const cardStatsHTML = `
            <div class="rank-stat">
                <div class="rank-stat-label">Runs Complètes</div>
                <div class="rank-stat-value">${career.bossRushCompletions || 0}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Meilleur Temps</div>
                <div class="rank-stat-value">${bestTimeStr}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Boss Vaincus</div>
                <div class="rank-stat-value">${totalBossKills}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Runs Parfaites</div>
                <div class="rank-stat-value">${career.bossRushPerfectRuns || 0}</div>
            </div>
        `;
        document.getElementById('stats-card-stats').innerHTML = cardStatsHTML;

        // Trophées Boss Rush
        const tr = JSON.parse(localStorage.getItem('tr') || '{}');
        const bossRushTrophies = window.TROPHIES ?
            Object.entries(window.TROPHIES).filter(([k, t]) => t.category === 'bossrush' && tr[k]).length : 0;
        const totalBossRushTrophies = window.TROPHIES ?
            Object.values(window.TROPHIES).filter(t => t.category === 'bossrush').length : 10;

        // Overview Stats Boss Rush
        const completionRate = (career.bossRushRuns || 0) > 0 ?
            Math.round(((career.bossRushCompletions || 0) / (career.bossRushRuns || 1)) * 100) : 0;

        const overviewHTML = `
            <div class="overview-stat">
                <div class="overview-stat-label">Runs Totales</div>
                <div class="overview-stat-value">${career.bossRushRuns || 0}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Taux Réussite</div>
                <div class="overview-stat-value">${completionRate}%</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Runs Rapides</div>
                <div class="overview-stat-value">${career.bossRushFastRuns || 0}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Trophées Boss</div>
                <div class="overview-stat-value">${bossRushTrophies}/${totalBossRushTrophies}</div>
            </div>
        `;
        document.getElementById('stats-overview').innerHTML = overviewHTML;

        // Button text (pas de classement pour Boss Rush)
        document.getElementById('stats-ranking-btn').textContent = 'Classement';
        document.getElementById('stats-ranking-btn').style.display = 'none';

        // Cacher le bouton Daily
        const dailyBtn = document.getElementById('stats-daily-btn');
        if (dailyBtn) dailyBtn.style.display = 'none';
    }

    /**
     * Retourne le rang Boss Rush basé sur les completions
     */
    getBossRushRank(completions) {
        if (completions >= 20) return { label: 'LÉGENDE', color: '#ff5722', emoji: '👑' };
        if (completions >= 10) return { label: 'CHAMPION', color: '#9c27b0', emoji: '💎' };
        if (completions >= 5) return { label: 'EXPERT', color: '#2196f3', emoji: '⚔️' };
        if (completions >= 1) return { label: 'CHASSEUR', color: '#4caf50', emoji: '🎯' };
        return { label: 'NOVICE', color: '#9e9e9e', emoji: '🔰' };
    }

    /**
     * Calcule la progression vers le prochain rang Boss Rush
     */
    calculateBossRushProgress(completions) {
        const thresholds = [0, 1, 5, 10, 20];

        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (completions >= thresholds[i]) {
                if (i === thresholds.length - 1) return 100;
                const current = thresholds[i];
                const next = thresholds[i + 1];
                return Math.round(((completions - current) / (next - current)) * 100);
            }
        }
        return 0;
    }

    /**
     * Formate le temps Boss Rush (secondes → M:SS)
     */
    formatBossRushTime(seconds) {
        if (!seconds || seconds === 0) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Affiche les stats ROGUELIKE
     */
    displayRoguelikeStats() {
        logger.log('[StatsManager] Affichage stats Roguelike');

        // Récupérer les données roguelike
        const meta = roguelikeManager.metaProgression || {
            totalXP: 0,
            totalRuns: 0,
            bestLevel: 0,
            bestScore: 0
        };
        const stats = achievementManager.getStats();
        const progress = achievementManager.getProgress();
        const pseudo = localStorage.getItem('snakeultra_pseudo') || 'Joueur';

        // Update UI: Badge - Style violet roguelike
        const badgeEl = document.getElementById('stats-rank-badge');
        badgeEl.className = 'rank-badge roguelike-mode';
        badgeEl.style.borderColor = '#9c27b0';
        badgeEl.style.background = 'linear-gradient(135deg, #1a0a2e 0%, #4a2c7a 100%)';
        badgeEl.style.boxShadow = '0 0 20px rgba(156, 39, 176, 0.4)';

        document.getElementById('stats-rank-icon').textContent = '🎲';
        document.getElementById('stats-player-name').textContent = pseudo;

        // Update UI: Rank name avec conteneur violet
        const rankNameEl = document.getElementById('stats-rank-name');
        const gradeContainer = document.getElementById('stats-grade-container');

        // Calculer le rang roguelike basé sur le niveau max atteint
        const roguelikeRank = this.getRoguelikeRank(meta.bestLevel);
        rankNameEl.textContent = roguelikeRank.label;

        if (gradeContainer) {
            gradeContainer.style.borderColor = roguelikeRank.color;
            gradeContainer.style.background = `linear-gradient(135deg, ${roguelikeRank.color}66 0%, ${roguelikeRank.color}33 100%)`;
        }

        // Progression vers le prochain rang
        const progressPercent = this.calculateRoguelikeProgress(meta.bestLevel);
        document.getElementById('stats-progress-fill').style.width = `${progressPercent}%`;

        // Card Stats Roguelike (4 stats principales)
        const cardStatsHTML = `
            <div class="rank-stat">
                <div class="rank-stat-label">Meilleur Stage</div>
                <div class="rank-stat-value">${meta.bestLevel || 0}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Meilleur Score</div>
                <div class="rank-stat-value">${this.formatNumber(meta.bestScore || 0)}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">Runs Totales</div>
                <div class="rank-stat-value">${meta.totalRuns || 0}</div>
            </div>
            <div class="rank-stat">
                <div class="rank-stat-label">XP Total</div>
                <div class="rank-stat-value">${this.formatNumber(meta.totalXP || 0)}</div>
            </div>
        `;
        document.getElementById('stats-card-stats').innerHTML = cardStatsHTML;

        // Overview Stats Roguelike
        const overviewHTML = `
            <div class="overview-stat">
                <div class="overview-stat-label">Boss Vaincus</div>
                <div class="overview-stat-value">${stats.bossesKilled || 0}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Pommes Totales</div>
                <div class="overview-stat-value">${stats.totalApples || 0}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Combo Max</div>
                <div class="overview-stat-value">${stats.maxComboEver || 0}</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-label">Achievements</div>
                <div class="overview-stat-value">${progress.unlocked}/${progress.total}</div>
            </div>
        `;
        document.getElementById('stats-overview').innerHTML = overviewHTML;

        // Button text - Leaderboard Roguelike
        const rankingBtn = document.getElementById('stats-ranking-btn');
        rankingBtn.textContent = '🏆 Leaderboard Roguelike';
        rankingBtn.style.display = '';
        rankingBtn.onclick = () => {
            window.audio?.buttonClick();
            this.showRoguelikeLeaderboard();
        };

        // Afficher le bouton Daily Challenge
        const dailyBtn = document.getElementById('stats-daily-btn');
        if (dailyBtn) {
            dailyBtn.style.display = '';
        }
    }

    /**
     * Retourne le rang roguelike basé sur le niveau max
     */
    getRoguelikeRank(bestLevel) {
        if (bestLevel >= 20) return { label: 'LÉGENDE', color: '#ff5722', emoji: '🔥' };
        if (bestLevel >= 15) return { label: 'MAÎTRE', color: '#9c27b0', emoji: '👑' };
        if (bestLevel >= 10) return { label: 'EXPERT', color: '#2196f3', emoji: '💎' };
        if (bestLevel >= 5) return { label: 'AVENTURIER', color: '#4caf50', emoji: '⚔️' };
        return { label: 'DÉBUTANT', color: '#9e9e9e', emoji: '🌱' };
    }

    /**
     * Calcule la progression vers le prochain rang roguelike
     */
    calculateRoguelikeProgress(bestLevel) {
        const thresholds = [0, 5, 10, 15, 20];

        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (bestLevel >= thresholds[i]) {
                if (i === thresholds.length - 1) return 100; // Max rang
                const current = thresholds[i];
                const next = thresholds[i + 1];
                return Math.round(((bestLevel - current) / (next - current)) * 100);
            }
        }
        return 0;
    }

    /**
     * Affiche le leaderboard roguelike
     */
    async showRoguelikeLeaderboard() {
        logger.log('[StatsManager] Affichage leaderboard roguelike');

        // Créer le modal s'il n'existe pas
        let modal = document.getElementById('leaderboard-modal');
        if (!modal) {
            modal = this.createLeaderboardModal();
            document.body.appendChild(modal);
        }

        // Afficher le modal avec loading
        modal.style.display = 'flex';
        const content = modal.querySelector('.leaderboard-content');
        content.innerHTML = `
            <div class="leaderboard-loading">
                <div class="loading-spinner"></div>
                <p>Chargement du classement...</p>
            </div>
        `;

        try {
            // Récupérer les données
            const response = await fetch('/api/roguelike/leaderboard?limit=50');
            const data = await response.json();

            if (data.success) {
                this.renderLeaderboard(content, data.data, data.total);
            } else {
                content.innerHTML = `
                    <div class="leaderboard-error">
                        <span class="error-icon">⚠️</span>
                        <p>Erreur lors du chargement</p>
                        <button class="btn-retry" onclick="window.statsManager.showRoguelikeLeaderboard()">Réessayer</button>
                    </div>
                `;
            }
        } catch (error) {
            logger.error('[StatsManager] Erreur fetch leaderboard:', error);
            content.innerHTML = `
                <div class="leaderboard-error">
                    <span class="error-icon">🔌</span>
                    <p>Impossible de se connecter au serveur</p>
                    <button class="btn-retry" onclick="window.statsManager.showRoguelikeLeaderboard()">Réessayer</button>
                </div>
            `;
        }
    }

    /**
     * Crée le modal du leaderboard
     */
    createLeaderboardModal() {
        const modal = document.createElement('div');
        modal.id = 'leaderboard-modal';
        modal.className = 'leaderboard-modal';
        modal.innerHTML = `
            <div class="leaderboard-backdrop" onclick="window.statsManager.closeLeaderboard()"></div>
            <div class="leaderboard-container">
                <div class="leaderboard-header">
                    <h2>🏆 Leaderboard Roguelike</h2>
                    <button class="leaderboard-close" onclick="window.statsManager.closeLeaderboard()">✕</button>
                </div>
                <div class="leaderboard-content">
                    <!-- Contenu dynamique -->
                </div>
            </div>
        `;

        // Ajouter les styles
        this.injectLeaderboardStyles();

        return modal;
    }

    /**
     * Ferme le modal leaderboard
     */
    closeLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Affiche les données du leaderboard
     */
    renderLeaderboard(container, entries, total) {
        const pseudo = localStorage.getItem('snakeultra_pseudo') || '';

        // Trouver le rang du joueur actuel
        const playerEntry = entries.find(e => e.pseudo.toLowerCase() === pseudo.toLowerCase());

        let html = `
            <div class="leaderboard-stats">
                <span>Total: ${total} joueurs</span>
                ${playerEntry ? `<span class="player-rank">Ton rang: #${playerEntry.rank}</span>` : ''}
            </div>
            <div class="leaderboard-table-wrapper">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th class="col-rank">#</th>
                            <th class="col-pseudo">Joueur</th>
                            <th class="col-score">Score</th>
                            <th class="col-level">Niveau</th>
                            <th class="col-date">Date</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (entries.length === 0) {
            html += `
                <tr class="empty-row">
                    <td colspan="5">
                        <div class="empty-message">
                            <span>🎲</span>
                            <p>Aucun score enregistré</p>
                            <p class="sub">Sois le premier à jouer !</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            entries.forEach(entry => {
                const isCurrentPlayer = pseudo && entry.pseudo.toLowerCase() === pseudo.toLowerCase();
                const rankIcon = this.getRankIcon(entry.rank);
                const dateStr = this.formatLeaderboardDate(entry.date);

                html += `
                    <tr class="${isCurrentPlayer ? 'current-player' : ''} ${entry.rank <= 3 ? 'top-' + entry.rank : ''}">
                        <td class="col-rank">
                            ${rankIcon ? `<span class="rank-icon">${rankIcon}</span>` : entry.rank}
                        </td>
                        <td class="col-pseudo">${this.escapeHtml(entry.pseudo)}</td>
                        <td class="col-score">${this.formatNumber(entry.score)}</td>
                        <td class="col-level">${entry.level}</td>
                        <td class="col-date">${dateStr}</td>
                    </tr>
                `;
            });
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Retourne l'icône pour les top 3
     */
    getRankIcon(rank) {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return null;
        }
    }

    /**
     * Formate la date pour le leaderboard
     */
    formatLeaderboardDate(isoDate) {
        if (!isoDate) return '-';
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Auj.";
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `${diffDays}j`;

        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }

    /**
     * Échappe les caractères HTML
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Injecte les styles du leaderboard
     */
    injectLeaderboardStyles() {
        if (document.getElementById('leaderboard-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'leaderboard-styles';
        styles.textContent = `
            .leaderboard-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                align-items: center;
                justify-content: center;
            }

            .leaderboard-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(4px);
            }

            .leaderboard-container {
                position: relative;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%);
                border-radius: 16px;
                border: 2px solid #9c27b0;
                box-shadow: 0 0 40px rgba(156, 39, 176, 0.4);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .leaderboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: linear-gradient(90deg, #9c27b0 0%, #7b1fa2 100%);
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .leaderboard-header h2 {
                margin: 0;
                font-size: 1.2rem;
                color: white;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .leaderboard-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.2s;
            }

            .leaderboard-close:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .leaderboard-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
            }

            .leaderboard-loading,
            .leaderboard-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                color: #ccc;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(156, 39, 176, 0.3);
                border-top-color: #9c27b0;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .error-icon {
                font-size: 3rem;
                margin-bottom: 12px;
            }

            .btn-retry {
                margin-top: 16px;
                padding: 10px 24px;
                background: #9c27b0;
                border: none;
                color: white;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
            }

            .btn-retry:hover {
                background: #7b1fa2;
            }

            .leaderboard-stats {
                display: flex;
                justify-content: space-between;
                padding: 12px 16px;
                background: rgba(0,0,0,0.2);
                color: #aaa;
                font-size: 0.85rem;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .player-rank {
                color: #9c27b0;
                font-weight: bold;
            }

            .leaderboard-table-wrapper {
                overflow-x: auto;
            }

            .leaderboard-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }

            .leaderboard-table thead {
                background: rgba(0,0,0,0.3);
                position: sticky;
                top: 0;
            }

            .leaderboard-table th {
                padding: 12px 8px;
                text-align: left;
                color: #9c27b0;
                font-weight: 600;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .leaderboard-table td {
                padding: 12px 8px;
                color: #ddd;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .leaderboard-table tr:hover {
                background: rgba(156, 39, 176, 0.1);
            }

            .leaderboard-table .current-player {
                background: rgba(156, 39, 176, 0.2) !important;
            }

            .leaderboard-table .current-player td {
                color: white;
                font-weight: bold;
            }

            .leaderboard-table .top-1 td { color: #ffd700; }
            .leaderboard-table .top-2 td { color: #c0c0c0; }
            .leaderboard-table .top-3 td { color: #cd7f32; }

            .col-rank { width: 50px; text-align: center; }
            .col-pseudo { min-width: 100px; }
            .col-score { width: 80px; text-align: right; font-family: monospace; }
            .col-level { width: 60px; text-align: center; }
            .col-date { width: 80px; text-align: right; font-size: 0.8rem; color: #888; }

            .rank-icon {
                font-size: 1.2rem;
            }

            .empty-row td {
                padding: 40px;
            }

            .empty-message {
                text-align: center;
                color: #888;
            }

            .empty-message span {
                font-size: 3rem;
                display: block;
                margin-bottom: 12px;
            }

            .empty-message .sub {
                font-size: 0.85rem;
                color: #666;
                margin-top: 8px;
            }
        `;
        document.head.appendChild(styles);
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
