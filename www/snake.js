// ============================================
// SNAKE ULTRA V6 - FICHIER PRINCIPAL MODULAIRE
// UI & Utilities avec imports ES6
// ============================================

// Imports des modules
import { logger } from './services/logger.js';
import { CONFIG, DIFFICULTY, DIFFICULTY_NAMES, DIFFICULTY_ICONS, MEDALS, KEYS, COLORS } from './config/constants.js';
import { createTrophies, RANKS } from './data/trophies.js';
import { save, load } from './services/storage.js';
import { audioService } from './services/audio.js';

(function() {
    'use strict';

    // Constantes importées depuis ./config/constants.js
    // CONFIG, DIFFICULTY, DIFFICULTY_NAMES, DIFFICULTY_ICONS, MEDALS, KEYS, COLORS

    // TROPHIES et RANKS importés depuis ./data/trophies.js
    // TROPHIES sera initialisé après la définition de career (ligne ~300)

    // ============================================
    // VARIABLES GLOBALES (UI & Données uniquement)
    // ============================================

    let soundEnabled = true;
    let musicStarted = false;

    // ✅ CHARGER CAREER DEPUIS LOCALSTORAGE D'ABORD (sinon TROPHIES check() utilisera career vide!)
    const defaultCareer = {
        level: 1,
        xp: 0,
        xpNext: 100,
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        totalApples: 0,
        maxLevel: 0,
        totalWalls: 0,
        totalPowerups: 0,
        maxSurvivalTime: 0,

        // ✅ NOUVELLES VARIABLES MULTI
        multiWins: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalMultiGames: 0,        // Total parties multi jouées
        multiCompleted: 0,         // Parties finies sans abandon

        // ✅ NOUVELLES VARIABLES IA
        aiWins: 0,                 // Victoires contre l'IA
        aiGames: 0,                // Total parties contre IA

        // ✅ NOUVELLES VARIABLES TROPHÉES CRÉATIFS
        phoenixRises: 0,           // Victoires immédiatement après défaite
        quickDeaths: 0,            // Morts en moins de 10 secondes
        lastGameResult: null,      // 'win' ou 'loss' pour tracking Phoenix

        // ✅ NOUVELLES VARIABLES SECRETS
        screensVisited: []
    };

    let career = { ...defaultCareer, ...load('career', {}) };

    // ✅ Initialisation des trophées AVEC LE VRAI CAREER chargé
    const TROPHIES = createTrophies(career);
    window.TROPHIES = TROPHIES; // ✅ Exposer pour debug
    window.career = career; // ✅ Exposer pour debug console

    // ============================================
    // SYSTÈME UNIFIÉ DE CARRIÈRE
    // ============================================

    /**
     * Met à jour les statistiques de carrière après une partie
     * @param {object} stats - Statistiques de la partie
     * @returns {object} { leveledUp, oldLevel, newLevel, xpGained }
     */
    function updateCareer(stats) {
        const oldLevel = career.level;
        const xpGained = Math.floor((stats.score || 0) / 5);

        // Mise à jour des statistiques de jeu
        career.totalGames++;
        career.totalScore += stats.score || 0;
        career.bestScore = Math.max(career.bestScore, stats.score || 0);
        career.totalApples += stats.foodCount || 0;
        career.maxLevel = Math.max(career.maxLevel, stats.level || 0);
        career.totalWalls += stats.wallsDestroyed || 0;
        career.totalPowerups += (stats.slowCount || 0) + (stats.doubleCount || 0) +
                                (stats.invincibleCount || 0) + (stats.ghostCount || 0);

        // Mise à jour du temps de survie max
        if (stats.timeString) {
            const currentSeconds = timeToSeconds(stats.timeString);
            if (currentSeconds > career.maxSurvivalTime) {
                career.maxSurvivalTime = currentSeconds;
            }
        }

        // Ajout de l'XP
        career.xp += xpGained;

        // Gestion du level up (formule exponentielle × 1.5)
        let leveledUp = false;
        while (career.xp >= career.xpNext && career.level < 100) {
            career.xp -= career.xpNext;
            career.level++;
            career.xpNext = Math.floor(career.xpNext * 1.05);
            leveledUp = true;
        }

        // Sauvegarde unifiée
        save('career', career);

        logger.log(`[Career] Stats mises à jour - Niveau ${career.level}, XP ${career.xp}/${career.xpNext}`);

        return { leveledUp, oldLevel, newLevel: career.level, xpGained };
    }

    // Exposer globalement pour navigation.js et autres
    window.updateCareer = updateCareer;

    /**
     * Convertit un temps "M:SS" en secondes
     */
    function timeToSeconds(timeString) {
        if (!timeString) return 0;
        const parts = timeString.split(':');
        return parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
    }

    /**
     * Récupère les statistiques de carrière (lecture seule)
     * @returns {object} Copie des stats de carrière
     */
    function getCareerStats() {
        return { ...career };
    }
    window.getCareerStats = getCareerStats;

    let tr = {};  // Trophées
    let ss = [];  // Saved scores
    let hi = 0;   // High score
    let diff = DIFFICULTY.NORMAL;  // Difficulté courante

    // ============================================
    // SERVICES IMPORTÉS
    // ============================================

    // Utilisation du service audio importé (compatibilité avec le code existant)
    const audio = audioService;
    window.audio = audio;

    // Fonctions save/load importées depuis ./services/storage.js
    // (Déjà disponibles via les imports en haut du fichier)

    // ============================================
    // UTILITAIRES
    // ============================================

    function getElementSafely(id) {
        const element = document.getElementById(id);
        if (!element) logger.warn(`Element with id '${id}' not found`);
        return element;
    }

    // ============================================
    // FONCTIONS UI & EMOJIS
    // ============================================

    function initMenuEmojis() {
        // Boutons de difficulté
        const diffBtns = document.querySelectorAll('.diff-btn');
        if (diffBtns[0] && !diffBtns[0].textContent.includes('😊')) diffBtns[0].textContent = '😊 FACILE';
        if (diffBtns[1] && !diffBtns[1].textContent.includes('😮')) diffBtns[1].textContent = '😮 NORMAL';
        if (diffBtns[2] && !diffBtns[2].textContent.includes('😈')) diffBtns[2].textContent = '😈 DIFFICILE';

        // Bouton Son
        updateSoundButtonEmoji();

    }

    function updatePlayerInfo() {
        const saved = load('career');
        if (saved) Object.assign(career, saved); // ✅ Modifier EN PLACE pour que TROPHIES.check() voit les changements

        const levelNum = getElementSafely('player-level-num');
        const circleFill = getElementSafely('player-circle-fill');

        if (levelNum) levelNum.textContent = career.level;
        if (circleFill) {
            const percentage = Math.min((career.xp / career.xpNext) * 100, 100);
            const circumference = 283;
            const offset = circumference - (percentage / 100) * circumference;
            circleFill.style.strokeDashoffset = offset;
        }
    }

    function updateSoundButtonEmoji() {
        const soundBtn = document.querySelector('#menu button[aria-label="Activer ou désactiver le son"]');
        const soundStatus = document.getElementById('sound-status');
        if (soundBtn && soundStatus) {
            soundBtn.innerHTML = (soundEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07') + ' SON : <span id="sound-status">' + soundStatus.textContent + '</span>';
        }
    }

    function startMenuMusicOnce() {
        if (!musicStarted && soundEnabled) {
            // Musique gérée par AudioManager maintenant
            musicStarted = true;
        }
    }

    // ============================================
    // MODALES
    // ============================================

    function closeModal() {
        const modal = getElementSafely('modal');
        if (modal) modal.classList.remove('active');
        const confirmModal = getElementSafely('confirmQuitModal');
        if (confirmModal) confirmModal.classList.remove('active');
    }

    function openModal(modalId, focusElementId) {
        const modal = getElementSafely(modalId);
        if (modal) {
            modal.classList.add('active');
            if (focusElementId) {
                const focusElement = getElementSafely(focusElementId);
                if (focusElement) focusElement.focus();
            }
        }
    }

    // ============================================
    // SYSTÈME RANGS
    // ============================================

    function getCurrentRank() {
        const level = (window.career ? window.career.level : career.level) || 1;

        for (let key in RANKS) {
            const rank = RANKS[key];
            if (level >= rank.minLevel && level <= rank.maxLevel) {
                return {
                    ...rank,
                    key: key,
                    progress: level - rank.minLevel,
                    total: rank.maxLevel - rank.minLevel + 1,
                    percentage: Math.round(((level - rank.minLevel) / (rank.maxLevel - rank.minLevel + 1)) * 100)
                };
            }
        }

        return RANKS.legend;
    }

    function getNextRank() {
        const current = getCurrentRank();
        const rankKeys = Object.keys(RANKS);
        const currentIndex = rankKeys.indexOf(current.key);

        if (currentIndex < rankKeys.length - 1) {
            const nextKey = rankKeys[currentIndex + 1];
            return { ...RANKS[nextKey], key: nextKey };
        }

        return null;
    }

    function hasRankChanged(oldLevel, newLevel) {
        const oldRank = Object.values(RANKS).find(r => oldLevel >= r.minLevel && oldLevel <= r.maxLevel);
        const newRank = Object.values(RANKS).find(r => newLevel >= r.minLevel && newLevel <= r.maxLevel);

        return oldRank !== newRank;
    }

    function showRankUpNotification(newRank) {
        // Déléguer au NotificationManager pour gestion propre de la mémoire
        const audioCallback = (audio && audio.rankUp) ? audio.rankUp : null;
        window.NotificationManager.showRankUpNotification(newRank, audioCallback);
    }

    function updateRankDisplay() {
        const rank = getCurrentRank();
        const badge = document.getElementById('rank-badge');

        if (badge) {
            const emojiEl = badge.querySelector('.rank-badge-emoji');
            const nameEl = badge.querySelector('.rank-badge-name');
            const levelEl = badge.querySelector('.rank-badge-level');

            // ✅ Vérifier que les sous-éléments existent avant de modifier
            if (emojiEl) emojiEl.textContent = rank.emoji;
            if (nameEl) nameEl.textContent = rank.title;
            if (levelEl) levelEl.textContent = `Nv. ${career.level}/${rank.maxLevel}`;

            badge.style.borderColor = rank.color;
            badge.style.boxShadow = `0 0 15px ${rank.color}`;
        }
    }

    // ============================================
    // TROPHÉES
    // ============================================

    function checkTrophy() {
        let changed = false;
        let newTrophies = [];

        const oldLevel = career.level; // ✅ Sauvegarder niveau actuel

        for (let key in TROPHIES) {
            const trophy = TROPHIES[key];

            // Ignorer si déjà débloqué
            if (tr[key]) continue;

            // Vérifier condition
            if (trophy.check()) {
                tr[key] = true;
                changed = true;
                newTrophies.push({ key, ...trophy }); // ✅ Inclure la clé du trophée

                // ✅ RÉCOMPENSE XP
                career.xp += trophy.xp;

                // ✅ NOTIFICATION
                showTrophyNotification(trophy);
            }
        }

        // ✅ STOCKER les trophées débloqués pour l'écran de progression
        if (newTrophies.length > 0) {
            window.sessionTrophies = (window.sessionTrophies || []).concat(newTrophies);
        }

        if (changed) {
            // Vérifier level up après gain XP
            while (career.xp >= career.xpNext && career.level < 100) {
                career.xp -= career.xpNext;
                career.level++;
                career.xpNext = Math.floor(career.xpNext * 1.05);
            }

            // ✅ VÉRIFIER RANK UP
            if (hasRankChanged(oldLevel, career.level)) {
                const newRank = getCurrentRank();
                showRankUpNotification(newRank);

                // ✅ HISTORIQUE RANGS
                if (!career.rankHistory) career.rankHistory = [];
                if (!career.rankHistory.includes(newRank.key)) {
                    career.rankHistory.push(newRank.key);
                }
            }

            save('tr', tr);
            save('career', career);
            updateTrophies();
            updatePlayerInfo();
            updateRankDisplay(); // ✅ Mise à jour badge
        }

        return newTrophies;
    }

    function showTrophyNotification(trophy) {
        // Déléguer au NotificationManager pour gestion propre de la mémoire
        const audioCallback = (audio && audio.trophy) ? audio.trophy : null;
        window.NotificationManager.showTrophyNotification(trophy, audioCallback);
    }

    function updateTrophies() {
        let h = '', unlocked = 0, total = Object.keys(TROPHIES).length;
        for (let k in TROPHIES) {
            if (tr[k]) unlocked++;
            const trophy = TROPHIES[k];
            h += `<span class="trophy ${tr[k] ? 'unlocked' : ''}" title="${trophy.name}: ${trophy.description}">${trophy.emoji}</span>`;
        }

        window.careerTrophyHTML = h;
        window.careerTrophyCount = unlocked + '/' + total;
    }

    // ============================================
    // FONCTIONS UI (Menu)
    // ============================================

    function showRules() {
        startMenuMusicOnce();
        let h = '<div class="modal-title">📖 Règles du Jeu</div>';

        h += '<div class="rules-section">';
        h += '<h3>🎯 Objectif</h3>';
        h += '<p>Guidez votre serpent pour manger des pommes 🍎, éviter les obstacles 🧱 et les crânes 💀, et atteignez le score le plus élevé possible !</p>';
        h += '</div>';

        h += '<div class="rules-section">';
        h += '<h3>🕹️ Contrôles</h3>';
        h += '<ul>';
        h += '<li><strong>Flèches directionnelles</strong> ou <strong>D-Pad tactile</strong> : Déplacer le serpent</li>';
        h += '<li><strong>Espace / P</strong> : Mettre en pause</li>';
        h += '</ul>';
        h += '</div>';

        h += '<div class="rules-section">';
        h += '<h3>🎮 Éléments du Jeu</h3>';
        h += '<ul>';
        h += '<li><strong>🍎 Pomme</strong> : +100 points (+200 si Double Score actif)</li>';
        h += '<li><strong>💀 Crâne</strong> : -50 points, réduit votre serpent de 3 segments</li>';
        h += '<li><strong>🧱 Obstacle</strong> : Collision = Game Over (sauf si Invincible)</li>';
        h += '<li><strong>Power-Ups</strong> : ⏱️ Ralentissement, 💰 Double Score, 🛡️ Invincibilité</li>';
        h += '</ul>';
        h += '</div>';

        h += '<div class="rules-section">';
        h += '<h3>🔥 Système de Combo</h3>';
        h += '<p>Mangez des pommes consécutivement sans manger de crânes pour augmenter votre multiplicateur de combo (jusqu\'à x5) !</p>';
        h += '</div>';

        h += '<div class="rules-section">';
        h += '<h3>✨ Power-Ups</h3>';
        h += '<ul>';
        h += '<li><strong>⏱️ Ralentissement</strong> : Réduit la vitesse du jeu pendant 10 secondes</li>';
        h += '<li><strong>💰 Double Score</strong> : Double tous les points pendant 15 secondes</li>';
        h += '<li><strong>🛡️ Invincibilité</strong> : Protège contre les obstacles et crânes pendant 8 secondes</li>';
        h += '</ul>';
        h += '</div>';

        h += '<div class="rules-section">';
        h += '<h3>🎯 Difficultés</h3>';
        h += '<ul>';
        h += '<li><strong>😊 Facile</strong> : Vitesse lente, peu d\'obstacles</li>';
        h += '<li><strong>😮 Normal</strong> : Vitesse moyenne, obstacles modérés</li>';
        h += '<li><strong>😈 Difficile</strong> : Vitesse rapide, nombreux obstacles</li>';
        h += '</ul>';
        h += '</div>';

        h += '<div class="rules-section">';
        h += '<h3>🏆 Progression & Carrière</h3>';
        h += '<p>Gagnez de l\'XP en jouant pour augmenter votre niveau de joueur. Débloquez des trophées en accomplissant des défis spéciaux !</p>';
        h += '</div>';

        h += '<div class="rules-section">';
        h += '<h3>💡 Astuces</h3>';
        h += '<ul>';
        h += '<li>Planifiez vos mouvements à l\'avance</li>';
        h += '<li>Utilisez les power-ups stratégiquement</li>';
        h += '<li>Évitez les crânes pour maintenir votre combo</li>';
        h += '<li>Les obstacles peuvent être détruits en Invincibilité</li>';
        h += '</ul>';
        h += '</div>';

        h += '<div class="close-container"><button class="menu-btn" onclick="audio.buttonClick();closeModal()" aria-label="Fermer la fenêtre des règles">Fermer</button></div>';
        getElementSafely('mcontent').innerHTML = h;
        openModal('modal', 'mcontent');
    }

    function showCredits() {
        startMenuMusicOnce();
        let h = '<div class="modal-title">🎬 Crédits</div>';

        h += '<div class="credits-section">';
        h += '<h3>🎮 Créateur Exécutif</h3>';
        h += '<p><strong>Cyril Laurent</strong></p>';
        h += '<p class="credits-subtitle">Conception, Direction & Développement</p>';
        h += '</div>';

        h += '<div class="credits-section">';
        h += '<h3>🤖 Co-Créateurs IA</h3>';
        h += '<ul>';
        h += '<li><strong>Claude AI (Anthropic)</strong> - Architecture & Logique de jeu</li>';
        h += '<li><strong>Grok (xAI)</strong> - Assistance technique</li>';
        h += '<li><strong>ChatGPT (OpenAI)</strong> - Optimisations & Conseils</li>';
        h += '</ul>';
        h += '</div>';

        h += '<div class="credits-section">';
        h += '<h3>🧪 Bêta Testeurs</h3>';
        h += '<p>Merci à tous les joueurs qui ont testé et amélioré ce jeu !</p>';
        h += '</div>';

        h += '<div class="credits-section">';
        h += '<h3>📊 Statistiques du Jeu</h3>';
        h += '<ul>';
        h += '<li>Version: <strong>6.0 Deluxe Edition</strong></li>';
        h += '<li>Lignes de code: <strong>~2000+</strong></li>';
        h += '<li>Trophées disponibles: <strong>15</strong></li>';
        h += '<li>Modes de jeu: <strong>Solo & Multijoueur</strong></li>';
        h += '</ul>';
        h += '</div>';

        h += '<div class="credits-section">';
        h += '<h3>🎵 Audio & Image</h3>';
        h += '<p>Musiques libres de droits</p>';
        h += '<p>Effets sonores générés via Web Audio API</p>';
        h += '</div>';

        h += '<div class="credits-section">';
        h += '<h3>📧 Contact</h3>';
        h += '<p>Pour toute question ou suggestion :</p>';
        h += '<p><strong>cyril.laurent@example.com</strong></p>';
        h += '</div>';

        h += '<p class="credits-footer">';
        h += '🐍 Snake Ultra - Deluxe Edition 🐍<br>';
        h += '© 2024 Cyril Laurent & IA Collaborateurs';
        h += '</p>';

        h += '<div class="close-container"><button class="menu-btn" onclick="audio.buttonClick();closeModal()" aria-label="Fermer la fenêtre des crédits">Fermer</button></div>';
        getElementSafely('mcontent').innerHTML = h;
        openModal('modal');
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        audioService.setEnabled(soundEnabled);
        save('soundEnabled', soundEnabled);
        updateSoundButton();

        // Musique gérée par AudioManager maintenant
        if (!soundEnabled && window.audioManager) {
            if (!window.audioManager.muted) {
                window.audioManager.toggleMute();
            }
        } else if (soundEnabled && window.audioManager) {
            if (window.audioManager.muted) {
                window.audioManager.toggleMute();
            }
        }
    }

    function updateSoundButton() {
        const soundStatus = getElementSafely('sound-status');
        const soundBtn = getElementSafely('soundToggle');

        if (soundStatus) {
            soundStatus.textContent = soundEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ';
        }

        if (soundBtn) {
            soundBtn.innerHTML = (soundEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07') + ' SON : <span id="sound-status">' + (soundEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ') + '</span>';
        }
    }

    function showCareer() {
        audio.buttonClick();
        startMenuMusicOnce();

        // ✅ NOUVEAU : Utiliser le nouvel écran Stats/Carrière
        if (window.statsManager) {
            window.statsManager.showStats();
        } else {
            // Fallback au cas où le module ne serait pas chargé
            logger.error('[showCareer] statsManager non disponible');
            alert('Erreur : Le système de statistiques n\'est pas chargé.');
        }
    }

    function resetAllStats() {
        if (confirm('⚠️ ATTENTION ⚠️\n\nÊtes-vous SÛR de vouloir TOUT réinitialiser ?\n\n✖️ Niveau et XP\n✖️ Toutes les statistiques\n✖️ Tous les trophées\n✖️ Meilleurs scores\n✖️ Pseudo du joueur\n\nCette action est IRRÉVERSIBLE !')) {

            // Supprimer TOUTES les statistiques (ancien et nouveau système)
            localStorage.removeItem('career');
            localStorage.removeItem('careerStats');
            localStorage.removeItem('tr');
            localStorage.removeItem('ss');
            localStorage.removeItem('hi');
            localStorage.removeItem('leaderboard');
            localStorage.removeItem('playerLevel');
            localStorage.removeItem('playerXP');
            localStorage.removeItem('justLeveledUp');

            // Supprimer le pseudo (toutes les variantes)
            localStorage.removeItem('snakeultra_pseudo');
            localStorage.removeItem('playerPseudo');
            localStorage.removeItem('snakeUltraPseudo');

            // Message de confirmation
            alert('✅ Toutes les statistiques et le pseudo ont été réinitialisés !\n\nLa page va se recharger...');

            // Recharger la page pour réinitialiser complètement
            location.reload();
        }
    }

    // ============================================
    // OVERLAYS CARRIÈRE (Nouveau !)
    // ============================================

    /**
     * Affiche l'overlay Classement (Top 3 scores locaux)
     */
    function showLeaderboardOverlay() {
        // ✅ NOUVEAU : Utiliser le système de leaderboard avec détails
        const topScores = window.getLeaderboard ? window.getLeaderboard() : [];

        let content = `
            <div class="overlay-header">
                <h2>🏅 CLASSEMENT TOP 3</h2>
                <button class="overlay-close" onclick="audio.buttonClick();closeOverlay()">✖</button>
            </div>
        `;

        if (topScores.length === 0) {
            content += `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary); font-size: 14px;">
                    Aucun score enregistré.<br>
                    Jouez pour établir votre premier record !
                </div>
            `;
        } else {
            content += `<div style="margin-top: 20px;">`;
            topScores.forEach((entry, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                const medalColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32';
                const score = entry.score || 0;
                const level = entry.level || 1;
                const difficulty = entry.difficulty || 'FACILE';
                const date = entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : 'Inconnue';
                const time = entry.timeString || '0:00';
                const food = entry.foodCount || 0;
                const combo = entry.maxCombo || 0;

                content += `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                            <span style="font-size: 32px;">${medal}</span>
                            <div style="flex: 1;">
                                <div style="font-size: 18px; font-weight: bold; color: ${medalColor};">#${index + 1} - ${score} points</div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                    📅 ${date} • 🎮 Niveau ${level} • ⚡ ${difficulty}
                                </div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; color: var(--text-secondary);">
                            <div>⏱️ Temps: ${time}</div>
                            <div>🍎 Pommes: ${food}</div>
                            <div>🔥 Combo: ${combo}</div>
                        </div>
                    </div>
                `;
            });
            content += `</div>`;
        }

        showOverlay(content);
    }

    /**
     * Affiche l'overlay Trophées (grille complète)
     */
    function showTrophiesOverlay(category = 'all') {
        logger.log('🏆 showTrophiesOverlay() appelée avec category:', category);

        // Vérifier que TROPHIES est défini
        if (!TROPHIES) {
            logger.log('❌ ERREUR: TROPHIES n\'est pas défini!');
            alert('Erreur: Les trophées ne sont pas chargés. Redémarrez l\'application.');
            return;
        }

        const tr = load('tr', {});

        // Calculer les compteurs par catégorie
        const counts = {
            all: { unlocked: 0, total: 0 },
            solo: { unlocked: 0, total: 0 },
            multi: { unlocked: 0, total: 0 },
            ia: { unlocked: 0, total: 0 },
            secret: { unlocked: 0, total: 0 }
        };

        for (let key in TROPHIES) {
            const trophy = TROPHIES[key];
            const isUnlocked = tr[key] || false;
            const cat = trophy.category || 'solo';

            counts.all.total++;
            counts[cat].total++;

            if (isUnlocked) {
                counts.all.unlocked++;
                counts[cat].unlocked++;
            }
        }

        const unlocked = counts.all.unlocked;
        const total = counts.all.total;

        let content = `
            <div class="overlay-header">
                <h2>🏆 TROPHÉES (${unlocked}/${total})</h2>
                <button class="overlay-close" onclick="window.audio.buttonClick();window.closeOverlay()">✖</button>
            </div>
        `;

        // Tabs de catégories
        content += `
            <div class="trophy-tabs" style="margin-top: 15px;">
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

        // Barre de progression (pour la catégorie sélectionnée)
        const currentCount = counts[category] || counts.all; // Fallback sur 'all' si catégorie inconnue
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
        for (let key in TROPHIES) {
            const trophy = TROPHIES[key];
            const cat = trophy.category || 'solo';

            // Filtrer par catégorie
            if (category !== 'all' && cat !== category) {
                continue;
            }

            trophyList.push({ key, trophy });
        }

        // Trier par rareté (1 étoile → 2 étoiles → 3 étoiles)
        trophyList.sort((a, b) => a.trophy.rarity - b.trophy.rarity);

        // Générer la grille avec labels par niveau de rareté
        content += `<div class="trophy-grid-container" style="margin-top: 20px;">`;

        let currentRarity = 0;
        const rarityLabels = {
            1: '⭐ Trophées 1 étoile',
            2: '⭐⭐ Trophées 2 étoiles',
            3: '⭐⭐⭐ Trophées 3 étoiles'
        };

        for (const { key, trophy } of trophyList) {
            // Ajouter un label séparateur si on change de niveau de rareté
            if (trophy.rarity !== currentRarity) {
                if (currentRarity !== 0) {
                    content += `</div>`; // Fermer la grille précédente
                }
                currentRarity = trophy.rarity;
                content += `
                    <div class="trophy-rarity-label">${rarityLabels[currentRarity] || `⭐ Rareté ${currentRarity}`}</div>
                    <div class="trophy-grid">
                `;
            }

            const isUnlocked = tr[key] || false;
            const stars = '⭐'.repeat(trophy.rarity);

            // Si secret et non débloqué, afficher ???
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

        if (currentRarity !== 0) {
            content += `</div>`; // Fermer la dernière grille
        }
        content += `</div>`; // Fermer le container

        logger.log('🏆 Affichage de l\'overlay trophées avec', trophyList.length, 'trophées');
        showOverlay(content);
    }

    /**
     * Affiche un overlay générique
     */
    function showOverlay(content) {
        // ✅ Supprimer l'ancien overlay s'il existe (évite les empilements)
        const existingOverlay = document.getElementById('career-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.id = 'career-overlay';
        overlay.className = 'career-overlay';
        overlay.innerHTML = `
            <div class="career-overlay-content">
                ${content}
            </div>
        `;

        // Ajouter au DOM
        document.body.appendChild(overlay);

        // ✅ FIX #10: Enregistrer dans ScreenManager pour cleanup automatique
        if (window.screenManager) {
            window.screenManager.registerOverlay('career-overlay');
        }

        // Animation d'apparition
        setTimeout(() => overlay.classList.add('visible'), 10);
    }

    /**
     * Ferme l'overlay actif
     */
    function closeOverlay() {
        const overlay = document.getElementById('career-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    // ============================================
    // ÉCRAN DE CHARGEMENT (géré par main.js)
    // ============================================

    function setupLoadingScreen() {
        // ✅ Le loading screen vidéo est maintenant géré par main.js
        // Cette fonction ne fait plus rien - main.js appelle screenManager.show('hub')
        logger.log('📺 Loading screen géré par main.js (vidéo)');
    }

    function startGame() {
        // ✅ NOUVEAU FLOW : Demander le pseudo au premier lancement
        // Vérifier si le pseudo existe déjà dans localStorage
        const savedPseudo = localStorage.getItem('snakeultra_pseudo');

        if (!savedPseudo) {
            // Première visite → Afficher l'écran de saisie du pseudo
            logger.log('🆕 Première visite → Demande du pseudo');
            window.screenManager.show('multiplayer-menu');

            // Focus sur l'input pseudo
            setTimeout(() => {
                const pseudoInput = document.getElementById('pseudo-input');
                if (pseudoInput) pseudoInput.focus();
            }, 300);
        } else {
            // Pseudo déjà sauvegardé → Aller directement au HUB V6
            logger.log('👤 Pseudo existant:', savedPseudo);
            window.screenManager.show('hub');

            // ✅ METTRE À JOUR LE NIVEAU ET LE CERCLE D'XP
            if (window.updatePlayerProgress) {
                window.updatePlayerProgress();
            }

            // Initialiser le hub (mise à jour des données dynamiques)
            if (window.initHub) {
                setTimeout(() => window.initHub(), 100);
            }
        }
    }

    // ============================================
    // INITIALISATION
    // ============================================

    function init() {

        // Init backgrounds & audio
        if (window.backgroundManager && window.audioManager) {
            Promise.all([
                window.backgroundManager.preloadAll(),
                window.audioManager.preloadAll()
            ]).then(() => {
                window.backgroundManager.setBackground('menu');

                // ✅ NE PAS lancer la musique pendant le loading screen
                // La musique sera lancée par main.js après le loading
                logger.log('🎵 Audio préchargé - En attente fin loading screen');
            }).catch(error => {
                logger.error('❌ Erreur chargement média:', error);
            });
        }

        // 1. Charger les données sauvegardées
        hi = load('hi', 0);
        ss = load('ss', []);
        diff = load('diff', DIFFICULTY.NORMAL);
        tr = load('tr', {});
        const savedSound = load('soundEnabled');
        if (savedSound !== null) {
            soundEnabled = savedSound;
            audioService.setEnabled(savedSound);
        }

        // 2. Initialiser l'audio
        audio.init();

        // 3. Configurer l'écran de chargement
        setupLoadingScreen();

        // 4. Initialiser les emojis et l'UI
        initMenuEmojis();
        updatePlayerInfo();
        updateTrophies();

        // 5. Ajouter emojis au D-pad
        const dpadButtons = document.querySelectorAll('.dpad-btn');
        if (dpadButtons[1]) dpadButtons[1].textContent = '⬆️';
        if (dpadButtons[3]) dpadButtons[3].textContent = '⬅️';
        if (dpadButtons[4]) dpadButtons[4].textContent = '⬇️';
        if (dpadButtons[5]) dpadButtons[5].textContent = '➡️';

    }

    // ============================================
    // EXPORTS GLOBAUX
    // ============================================

    window.init = init;
    window.onload = () => window.init();
    window.startGame = startGame; // ✅ Exposé pour main.js (loading vidéo)

    window.showRules = showRules;
    window.showCredits = showCredits;
    window.showCareer = showCareer; // ✅ RESTAURÉ
    window.resetAllStats = resetAllStats;
    window.toggleSound = toggleSound;
    window.closeModal = closeModal;
    window.save = save;
    window.load = load;
    window.checkTrophy = checkTrophy;
    window.updateTrophies = updateTrophies;
    window.updatePlayerInfo = updatePlayerInfo;
    window.showLeaderboardOverlay = showLeaderboardOverlay;
    window.showTrophiesOverlay = showTrophiesOverlay;
    window.closeOverlay = closeOverlay;
    window.updateRankDisplay = updateRankDisplay;

    // ✅ Log de confirmation du chargement des fonctions trophées
    logger.log('✅ snake.js chargé: showTrophiesOverlay disponible:', typeof window.showTrophiesOverlay);

})();
