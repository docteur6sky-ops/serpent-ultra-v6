// ============================================
// STATS MANAGER - Gestion écran Stats/Carrière AAA
// ============================================

import { logger } from './services/logger.js';
import { achievementManager } from './roguelike/achievements.js';
import roguelikeManager from './roguelike/RoguelikeManager.js';

// Import Firebase dynamique pour éviter les erreurs si non initialisé
let firebaseModule = null;
async function getFirebaseFunctions() {
    if (!firebaseModule) {
        try {
            firebaseModule = await import('./services/firebase.js');
        } catch (e) {
            logger.warn('[StatsManager] Firebase non disponible:', e.message);
            return null;
        }
    }
    return firebaseModule;
}

class StatsManager {
    constructor() {
        this.currentMode = 'aventure'; // 'aventure' (Solo+Roguelike) ou 'arene' (Multi+BossRush)
        this._domCache = null; // Cache DOM initialisé au premier showStats()
        logger.log('[StatsManager] Initialisé');
    }

    /**
     * Cache les éléments DOM fréquemment utilisés
     * Réduit ~70 getElementById par affichage → 1 seule fois
     */
    _cacheDOMElements() {
        if (this._domCache) return this._domCache;

        this._domCache = {
            // Tabs
            tabs: document.querySelectorAll('.stats-tab'),

            // Banner
            banner: document.getElementById('stats-banner'),
            bannerImage: document.getElementById('stats-banner-image'),

            // Badge/Rank
            rankBadge: document.getElementById('stats-rank-badge'),
            rankIcon: document.getElementById('stats-rank-icon'),
            rankLevel: document.getElementById('stats-rank-level'),
            rankName: document.getElementById('stats-rank-name'),
            gradeContainer: document.getElementById('stats-grade-container'),

            // Player
            playerName: document.getElementById('stats-player-name'),
            progressFill: document.getElementById('stats-progress-fill'),

            // Content
            cardMini: document.getElementById('stats-card-mini'),
            cardStats: document.getElementById('stats-card-stats'),
            gridUnified: document.getElementById('stats-grid-unified'),
            overview: document.getElementById('stats-overview'),

            // Buttons
            rankingBtn: document.getElementById('stats-ranking-btn'),
            dailyBtn: document.getElementById('stats-daily-btn')
        };

        logger.log('[StatsManager] Cache DOM initialisé (17 éléments)');
        return this._domCache;
    }

    /**
     * Invalide le cache (appeler si le DOM change)
     */
    invalidateDOMCache() {
        this._domCache = null;
    }

    /**
     * Getter pour accéder au cache
     */
    get dom() {
        return this._cacheDOMElements();
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

        // Mettre à jour les onglets visuellement (utilise cache)
        this.dom.tabs.forEach(btn => {
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
        const { banner: bannerEl, bannerImage: imageEl } = this.dom;

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

        // Update UI tabs (utilise cache)
        this.dom.tabs.forEach(btn => {
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

        // Utiliser le cache DOM
        const { rankBadge, rankIcon, playerName, rankLevel, gradeContainer, rankName, progressFill, cardMini } = this.dom;

        // Update badge
        rankBadge.className = 'rank-badge aventure-mode';
        rankBadge.style.borderColor = soloGrade.color;
        rankBadge.style.background = `linear-gradient(135deg, ${soloGrade.color}dd 0%, ${soloGrade.color}66 100%)`;

        rankIcon.textContent = soloGrade.emoji;
        playerName.textContent = pseudo;

        // Niveau dans le badge (juste le chiffre)
        if (rankLevel) rankLevel.textContent = career.level || 1;

        rankName.textContent = soloGrade.label;
        if (gradeContainer) {
            gradeContainer.style.borderColor = soloGrade.color;
            gradeContainer.style.background = `linear-gradient(135deg, ${soloGrade.color}dd 0%, ${soloGrade.color}66 100%)`;
        }

        // Progression XP vers prochain niveau
        const xp = career.xp || 0;
        const xpNext = career.xpNext || 200;
        const progressPercent = Math.min((xp / xpNext) * 100, 100);
        progressFill.style.width = `${progressPercent}%`;

        // Mini stats sur la carte (2x2 comme l'ancien design)
        if (cardMini) {
            cardMini.innerHTML = `
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
        this.dom.gridUnified.innerHTML = gridHTML;

        // Bouton leaderboard Aventure (Solo + Roguelike)
        const { rankingBtn } = this.dom;
        rankingBtn.textContent = '🏆 Classement Mondial';
        rankingBtn.style.display = '';
        rankingBtn.onclick = () => {
            window.audio?.buttonClick();
            this.showAventureLeaderboard();
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

        // Utiliser le cache DOM
        const { rankBadge, rankIcon, playerName, rankLevel, gradeContainer, rankName, progressFill, cardMini, gridUnified, rankingBtn, dailyBtn } = this.dom;

        // Update badge
        rankBadge.className = 'rank-badge arene-mode';
        rankBadge.style.borderColor = multiGrade.color;
        rankBadge.style.background = `linear-gradient(135deg, ${multiGrade.color}dd 0%, ${multiGrade.color}66 100%)`;

        rankIcon.textContent = multiGrade.emoji;
        playerName.textContent = pseudo;

        // Victoires dans le badge (juste le chiffre)
        if (rankLevel) rankLevel.textContent = multiWins;

        rankName.textContent = multiGrade.label;
        if (gradeContainer) {
            gradeContainer.style.borderColor = multiGrade.color;
            gradeContainer.style.background = `linear-gradient(135deg, ${multiGrade.color}dd 0%, ${multiGrade.color}66 100%)`;
        }

        // Progression vers le prochain grade multi
        const progressPercent = this.calculateMultiProgress(multiWins);
        progressFill.style.width = `${progressPercent}%`;

        // Stats Multi - calculer winRate en premier
        const winRate = (career.totalMultiGames || 0) > 0 ?
            Math.round(((career.multiWins || 0) / (career.totalMultiGames || 1)) * 100) : 0;

        // Mini stats sur la carte (2x2 comme l'ancien design) - Multi
        if (cardMini) {
            cardMini.innerHTML = `
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
        gridUnified.innerHTML = gridHTML;

        // Bouton leaderboard Arène (Multi + Boss Rush)
        rankingBtn.textContent = '🏆 Classement Mondial';
        rankingBtn.style.display = '';
        rankingBtn.onclick = () => {
            window.audio?.buttonClick();
            this.showAreneLeaderboard();
        };
    }

    // ============================================
    // MÉTHODES LEGACY SUPPRIMÉES
    // displaySoloStats, displayMultiStats, displayBossRushStats, displayRoguelikeStats
    // ont été remplacées par displayAventureStats() et displayAreneStats()
    // ============================================

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
     * Affiche le leaderboard pour une catégorie (aventure ou arène)
     */
    async showLeaderboard(category = 'aventure') {
        logger.log(`[StatsManager] Affichage leaderboard ${category}`);
        this.currentLeaderboardCategory = category;

        // Supprimer l'ancien modal s'il existe
        const oldModal = document.getElementById('stats-leaderboard-modal');
        if (oldModal) oldModal.remove();

        // Créer le nouveau modal
        const modal = this.createLeaderboardModal(category);
        document.body.appendChild(modal);

        // Afficher le modal
        modal.style.display = 'flex';

        // Charger le premier onglet
        const firstTab = category === 'aventure' ? 'solo' : 'multi';
        await this.loadLeaderboardData(firstTab);
    }

    /**
     * Change d'onglet dans le leaderboard
     */
    async switchLeaderboardTab(mode) {
        const modal = document.getElementById('stats-leaderboard-modal');
        if (!modal) return;

        // Mettre à jour les onglets actifs
        modal.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Charger les données
        await this.loadLeaderboardData(mode);
    }

    /**
     * Charge les données du leaderboard pour un mode
     */
    async loadLeaderboardData(mode) {
        const modal = document.getElementById('stats-leaderboard-modal');
        if (!modal) return;

        const content = modal.querySelector('.leaderboard-content');
        content.innerHTML = `
            <div class="leaderboard-loading">
                <div class="loading-spinner"></div>
                <p>Chargement du classement mondial...</p>
            </div>
        `;

        // Mapper les modes vers les noms Firebase
        const firebaseMode = {
            'solo': 'solo',
            'roguelike': 'roguelike',
            'multi': 'multi',
            'bossrush': 'bossrush'
        }[mode] || mode;

        try {
            // Récupérer les fonctions Firebase
            const firebase = await getFirebaseFunctions();

            if (!firebase) {
                content.innerHTML = `
                    <div class="leaderboard-error">
                        <span class="error-icon">🔌</span>
                        <p>Firebase non disponible</p>
                        <p class="error-hint">Connecte-toi pour voir le classement mondial</p>
                    </div>
                `;
                return;
            }

            // Récupérer les données depuis Firebase
            const entries = await firebase.getLeaderboard(firebaseMode, 50);
            const userRank = await firebase.getUserRank(firebaseMode);
            const loggedIn = firebase.isLoggedIn();

            if (entries.length > 0) {
                this.renderFirebaseLeaderboard(content, entries, userRank, loggedIn, mode);
            } else {
                content.innerHTML = `
                    <div class="leaderboard-empty">
                        <span class="empty-icon">🏆</span>
                        <p>Aucun score pour le moment</p>
                        <p class="empty-hint">Sois le premier à te classer !</p>
                    </div>
                `;
            }
        } catch (error) {
            logger.error(`[StatsManager] Erreur fetch leaderboard ${mode}:`, error);
            content.innerHTML = `
                <div class="leaderboard-error">
                    <span class="error-icon">🔌</span>
                    <p>Impossible de charger le classement</p>
                    <button class="btn-retry" onclick="window.statsManager.loadLeaderboardData('${mode}')">Réessayer</button>
                </div>
            `;
        }
    }

    /**
     * Raccourci pour le leaderboard Aventure (Solo + Roguelike)
     */
    showAventureLeaderboard() {
        this.showLeaderboard('aventure');
    }

    /**
     * Raccourci pour le leaderboard Arène (Multi + Boss Rush)
     */
    showAreneLeaderboard() {
        this.showLeaderboard('arene');
    }

    /**
     * Alias pour compatibilité (ancien nom)
     */
    showRoguelikeLeaderboard() {
        this.showLeaderboard('aventure');
    }

    /**
     * Affiche le leaderboard Firebase
     */
    renderFirebaseLeaderboard(container, entries, userRank, loggedIn = false, mode = 'solo') {
        // Définir les colonnes selon le mode
        const columns = {
            solo: { detail: 'Niveau', key: 'level' },
            roguelike: { detail: 'Niveau', key: 'level' },
            multi: { detail: 'Victoires', key: 'wins' },
            bossrush: { detail: 'Stage', key: 'stageReached' }
        };
        const col = columns[mode] || columns.solo;

        let html = `
            <div class="leaderboard-stats">
                <span>Top ${entries.length} mondial</span>
                ${userRank ? `<span class="player-rank">Ton rang: #${userRank}</span>` : ''}
            </div>
            <div class="leaderboard-table-wrapper">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th class="col-rank">#</th>
                            <th class="col-pseudo">Joueur</th>
                            <th class="col-score">Score</th>
                            <th class="col-detail">${col.detail}</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        entries.forEach((entry, index) => {
            const isCurrentUser = entry.isCurrentUser;
            const rankDisplay = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : entry.rank;
            const detailValue = entry.details?.[col.key] || '-';

            html += `
                <tr class="${isCurrentUser ? 'current-user' : ''} ${index < 3 ? 'top-3' : ''}">
                    <td class="col-rank">${rankDisplay}</td>
                    <td class="col-pseudo">
                        <div class="player-info">
                            ${entry.photoURL ? `<img class="player-avatar" src="${entry.photoURL}" alt="">` : ''}
                            <span>${entry.displayName || 'Anonyme'}</span>
                        </div>
                    </td>
                    <td class="col-score">${entry.score.toLocaleString()}</td>
                    <td class="col-detail">${detailValue}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        if (!loggedIn) {
            html += `
                <div class="leaderboard-login-hint">
                    <p>Connecte-toi pour apparaître dans le classement !</p>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Crée le modal du leaderboard avec onglets
     */
    createLeaderboardModal(category = 'aventure') {
        const modal = document.createElement('div');
        modal.id = 'stats-leaderboard-modal';
        modal.className = 'stats-leaderboard-modal';

        const isAventure = category === 'aventure';
        const tabs = isAventure
            ? [{ id: 'solo', label: 'Solo' }, { id: 'roguelike', label: 'Roguelike' }]
            : [{ id: 'multi', label: 'Online' }, { id: 'bossrush', label: 'Boss Rush' }];

        modal.innerHTML = `
            <div class="leaderboard-backdrop" onclick="window.statsManager.closeLeaderboard()"></div>
            <div class="leaderboard-container">
                <div class="leaderboard-header">
                    <h2>🏆 Classement ${isAventure ? 'Aventure' : 'Arène'}</h2>
                    <button class="leaderboard-close" onclick="window.statsManager.closeLeaderboard()">✕</button>
                </div>
                <div class="leaderboard-tabs">
                    ${tabs.map((tab, i) => `
                        <button class="leaderboard-tab ${i === 0 ? 'active' : ''}"
                                data-mode="${tab.id}"
                                onclick="window.statsManager.switchLeaderboardTab('${tab.id}')">
                            ${tab.label}
                        </button>
                    `).join('')}
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
        const modal = document.getElementById('stats-leaderboard-modal');
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
            .stats-leaderboard-modal {
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

            .leaderboard-tabs {
                display: flex;
                padding: 10px 15px;
                gap: 8px;
                background: rgba(0,0,0,0.2);
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .leaderboard-tab {
                flex: 1;
                padding: 10px 15px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: #888;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .leaderboard-tab:hover {
                background: rgba(255,255,255,0.1);
                color: white;
            }

            .leaderboard-tab.active {
                background: linear-gradient(180deg, #9c27b0 0%, #7b1fa2 100%);
                border-color: #9c27b0;
                color: white;
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
            .col-detail { width: 70px; text-align: center; }
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

            /* Styles Firebase leaderboard */
            .player-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .player-avatar {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.2);
            }

            .top-3 .player-avatar {
                border-color: #ffd700;
            }

            .current-user {
                background: rgba(76, 175, 80, 0.2) !important;
            }

            .current-user td {
                color: #4CAF50 !important;
                font-weight: bold;
            }

            .leaderboard-empty {
                text-align: center;
                padding: 40px;
                color: #888;
            }

            .leaderboard-empty .empty-icon {
                font-size: 48px;
                display: block;
                margin-bottom: 15px;
            }

            .leaderboard-empty .empty-hint {
                font-size: 0.85rem;
                color: #666;
                margin-top: 8px;
            }

            .leaderboard-login-hint {
                text-align: center;
                padding: 15px;
                background: rgba(66, 133, 244, 0.1);
                border-radius: 8px;
                margin-top: 15px;
                color: #4285f4;
                font-size: 0.9rem;
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
