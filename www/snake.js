// ============================================
// SNAKE ULTRA V6 - FICHIER PRINCIPAL NETTOYÉ
// Constants, Audio, UI & Utilities uniquement
// ============================================

(function() {
    'use strict';

    // ============================================
    // CONSTANTES DE JEU
    // ============================================

    const CONFIG = {
        GRID_SIZE: 30,
        CANVAS_SIZE: 360,
        CELL_SIZE: 360 / 30,
        ANIMATION_DELAY: 300,
        MAX_SAVED_SCORES: 3,
        SLOW_DURATION: 10000,
        DOUBLE_DURATION: 15000,
        INVINCIBLE_DURATION: 8000,
        POWERUP_SPAWN_CHANCE: 0.08,
        OBSTACLE_SPAWN_INTERVAL: 5,
        BAD_SPAWN_INTERVAL: 3
    };

    const DIFFICULTY = { EASY: 0, NORMAL: 1, HARD: 2 };
    const DIFFICULTY_NAMES = ['😊 Facile', '😮 Normal', '😈 Difficile'];
    const DIFFICULTY_ICONS = ['😊', '😮', '😈'];
    const MEDALS = ['🥇', '🥈', '🥉'];

    const KEYS = {
        UP: 'ArrowUp',
        DOWN: 'ArrowDown',
        LEFT: 'ArrowLeft',
        RIGHT: 'ArrowRight',
        SPACE: ' ',
        PAUSE: 'p'
    };

    const COLORS = {
        GOLD: '#D4AF37',
        SNAKE: '#00FF87',
        FOOD: '#FFD700',
        BAD: '#FF1744',
        BG_DARK: '#0f0f23',
        BG_LIGHT: '#1a1a2e',
        TEXT_LIGHT: '#C0C0C0',
        BORDER: '#d8d800ff'
    };

    const TROPHIES = {
        // ═══════════════════════════════════════
        // SOLO - PROGRESSION (3)
        // ═══════════════════════════════════════
        ver_de_terre: {
            name: 'Ver de Terre',
            emoji: '🪱',
            description: 'Atteindre le niveau 5',
            rarity: 1,
            xp: 500,
            secret: false,
            category: 'progression',
            check: () => career.maxLevel >= 5
        },

        roi_reptiles: {
            name: 'Roi des Reptiles',
            emoji: '👑',
            description: 'Atteindre le niveau 10',
            rarity: 2,
            xp: 1000,
            secret: false,
            category: 'progression',
            check: () => career.maxLevel >= 10
        },

        dieu_serpent: {
            name: 'Dieu Serpent',
            emoji: '🌟',
            description: 'Atteindre le niveau 15',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'progression',
            check: () => career.maxLevel >= 15
        },

        // ═══════════════════════════════════════
        // SOLO - COLLECTION (2) - CUMULATIF
        // ═══════════════════════════════════════
        tout_puissant: {
            name: 'Tout Puissant',
            emoji: '⚡',
            description: 'Collecter 75 power-ups (total carrière)',
            rarity: 2,
            xp: 1000,
            secret: false,
            category: 'collection',
            check: () => career.totalPowerups >= 75
        },

        seigneur_chaos: {
            name: 'Seigneur du Chaos',
            emoji: '🔮',
            description: 'Collecter 150 power-ups (total carrière)',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'collection',
            check: () => career.totalPowerups >= 150
        },

        // ═══════════════════════════════════════
        // SOLO - DESTRUCTION (1) - CUMULATIF
        // ═══════════════════════════════════════
        architecte_chaos: {
            name: 'Architecte du Chaos',
            emoji: '🌪️',
            description: 'Détruire 200 murs (total carrière)',
            rarity: 3,
            xp: 1500,
            secret: false,
            category: 'destruction',
            check: () => career.totalWalls >= 200
        },

        // ═══════════════════════════════════════
        // SOLO - EXPLOITS & MAÎTRISE (4)
        // ═══════════════════════════════════════
        anaconda: {
            name: 'Anaconda',
            emoji: '🦎',
            description: 'Atteindre 50 segments de longueur',
            rarity: 2,
            xp: 1000,
            secret: false,
            category: 'exploits',
            check: () => career.bestScore >= 5000  // Proxy : 50 segments ≈ 5000 pts
        },

        perfectionniste: {
            name: 'Perfectionniste',
            emoji: '💯',
            description: 'Atteindre le niveau 10 sans manger de crâne',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'maitrise',
            check: () => false  // TODO: Nécessite tracking skullsEaten
        },

        puriste: {
            name: 'Puriste',
            emoji: '🚫',
            description: 'Atteindre le niveau 10 sans power-up',
            rarity: 3,
            xp: 1500,
            secret: false,
            category: 'maitrise',
            check: () => career.maxLevel >= 10 && career.totalPowerups === 0
        },

        maitre: {
            name: 'Maître',
            emoji: '🥇',
            description: 'Obtenir 20 000 points en Difficile',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'maitrise',
            check: () => career.bestScore >= 20000  // TODO: Vérifier difficulté
        },

        // ═══════════════════════════════════════
        // MULTI - VICTOIRES (3)
        // ═══════════════════════════════════════
        vainqueur: {
            name: 'Vainqueur',
            emoji: '🏆',
            description: 'Gagner 10 parties multijoueur',
            rarity: 2,
            xp: 1000,
            secret: false,
            category: 'multi',
            check: () => (career.multiWins || 0) >= 10
        },

        champion: {
            name: 'Champion',
            emoji: '👑',
            description: 'Gagner 50 parties multijoueur',
            rarity: 3,
            xp: 1500,
            secret: false,
            category: 'multi',
            check: () => (career.multiWins || 0) >= 50
        },

        invaincu: {
            name: 'Invaincu',
            emoji: '🔥',
            description: 'Gagner 3 parties multijoueur d\'affilée',
            rarity: 4,
            xp: 2000,
            secret: false,
            category: 'multi',
            check: () => (career.currentStreak || 0) >= 3
        },

        // ═══════════════════════════════════════
        // SECRETS (2)
        // ═══════════════════════════════════════
        centenaire: {
            name: 'Centenaire',
            emoji: '💯',
            description: 'Jouer 100 parties (total carrière)',
            rarity: 3,
            xp: 1500,
            secret: true,
            hint: 'L\'expérience compte...',
            category: 'secret',
            check: () => career.totalGames >= 100
        },

        explorateur: {
            name: 'Explorateur',
            emoji: '🗺️',
            description: 'Visiter tous les écrans du jeu',
            rarity: 4,
            xp: 2000,
            secret: true,
            hint: 'Explore chaque recoin...',
            category: 'secret',
            check: () => {
                const requiredScreens = [
                    'menu', 'game-solo', 'multiplayer-menu',
                    'options-menu', 'rules-menu', 'credits-menu'
                ];
                const visited = career.screensVisited || [];
                return requiredScreens.every(screen => visited.includes(screen));
            }
        }
    };

    const RANKS = {
        bronze: {
            name: 'BRONZE',
            emoji: '🥉',
            title: 'Apprenti',
            minLevel: 1,
            maxLevel: 10,
            color: '#CD7F32'
        },
        silver: {
            name: 'ARGENT',
            emoji: '🥈',
            title: 'Combattant',
            minLevel: 11,
            maxLevel: 25,
            color: '#C0C0C0'
        },
        gold: {
            name: 'OR',
            emoji: '🥇',
            title: 'Vétéran',
            minLevel: 26,
            maxLevel: 40,
            color: '#FFD700'
        },
        platinum: {
            name: 'PLATINE',
            emoji: '💎',
            title: 'Champion',
            minLevel: 41,
            maxLevel: 60,
            color: '#E5E4E2'
        },
        diamond: {
            name: 'DIAMANT',
            emoji: '💠',
            title: 'Maître',
            minLevel: 61,
            maxLevel: 80,
            color: '#B9F2FF'
        },
        elite: {
            name: 'ÉLITE',
            emoji: '⭐',
            title: 'Élite',
            minLevel: 81,
            maxLevel: 95,
            color: '#FF69B4'
        },
        legend: {
            name: 'LÉGENDE',
            emoji: '👑',
            title: 'Légende Vivante',
            minLevel: 96,
            maxLevel: 100,
            color: '#9400D3'
        }
    };

    // ============================================
    // VARIABLES GLOBALES (UI & Données uniquement)
    // ============================================

    let soundEnabled = true;
    let musicStarted = false;

    let career = {
        level: 1,
        xp: 0,
        xpNext: 1000,
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

        // ✅ NOUVELLES VARIABLES SECRETS
        screensVisited: []
    };

    let tr = {};  // Trophées
    let ss = [];  // Saved scores
    let hi = 0;   // High score
    let diff = DIFFICULTY.NORMAL;  // Difficulté courante

    // ============================================
    // SYSTÈME AUDIO (Web Audio API pour effets sonores)
    // Note: Musiques gérées par AudioManager.js
    // ============================================

    const audio = {
        ctx: null,

        init() {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.error('❌ Impossible d\'initialiser l\'audio:', error);
            }
        },

        beep(freq, dur, vol = 0.1, type = 'sine') {
            if (!soundEnabled || !this.ctx) return;

            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = type;
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(vol, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur / 1000);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(this.ctx.currentTime);
                osc.stop(this.ctx.currentTime + dur / 1000);
            } catch (error) {
                console.warn('⚠️ Impossible de jouer le son:', error);
            }
        },

        buttonClick() {
            this.beep(600, 50, 0.05);
            setTimeout(() => this.beep(700, 50, 0.05), 50);
        },

        dpadClick() {
            this.beep(500, 30, 0.03);
        },

        eat() {
            this.beep(800, 100, 0.15);
            setTimeout(() => this.beep(1000, 100, 0.15), 50);
        },

        bad() {
            this.beep(200, 200, 0.2, 'sawtooth');
        },

        obstacle() {
            this.beep(150, 150, 0.15, 'square');
        },

        lvlup() {
            this.beep(600, 150, 0.2);
            setTimeout(() => this.beep(800, 150, 0.2), 100);
            setTimeout(() => this.beep(1000, 200, 0.2), 200);
        },

        powerup() {
            this.beep(1200, 200, 0.2, 'triangle');
        },

        die() {
            this.beep(400, 150, 0.25, 'sawtooth');
            setTimeout(() => this.beep(300, 150, 0.25, 'sawtooth'), 100);
            setTimeout(() => this.beep(200, 300, 0.25, 'sawtooth'), 200);
        },

        breakWall() {
            this.beep(300, 100, 0.2, 'square');
            setTimeout(() => this.beep(200, 100, 0.2, 'square'), 50);
            setTimeout(() => this.beep(150, 150, 0.2, 'square'), 100);
        }
    };

    window.audio = audio;

    // ============================================
    // GESTION DU STOCKAGE LOCAL
    // ============================================

    function save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Failed to save ${key}:`, e);
            return false;
        }
    }

    function load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Failed to load ${key}:`, e);
            return defaultValue;
        }
    }

    // ============================================
    // UTILITAIRES
    // ============================================

    function getElementSafely(id) {
        const element = document.getElementById(id);
        if (!element) console.warn(`Element with id '${id}' not found`);
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
        if (saved) career = { ...career, ...saved };

        // ✅ Lire depuis playerXP/playerLevel (nouveau système) ou career (ancien système)
        const playerXP = parseInt(localStorage.getItem('playerXP')) || career.xp || 0;
        const playerLevel = parseInt(localStorage.getItem('playerLevel')) || career.level || 1;

        // Calculer XP pour le prochain niveau (formule: niveau × 1000)
        const xpNext = playerLevel * 1000;

        const levelNum = getElementSafely('player-level-num');
        const circleFill = getElementSafely('player-circle-fill');

        if (levelNum) levelNum.textContent = playerLevel;
        if (circleFill) {
            const percentage = Math.min((playerXP / xpNext) * 100, 100);
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
        const level = career.level || 1;

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
        const notification = document.createElement('div');
        notification.className = 'rank-notification';
        notification.innerHTML = `
            <div class="rank-notif-content">
                <div class="rank-notif-emoji">${newRank.emoji}</div>
                <div class="rank-notif-text">
                    <div class="rank-notif-title">NOUVEAU RANG</div>
                    <div class="rank-notif-name">VOUS ÊTES MAINTENANT ${newRank.name}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);

        if (audio && audio.rankUp) {
            audio.rankUp();
        }
    }

    function updateRankDisplay() {
        const rank = getCurrentRank();
        const badge = document.getElementById('rank-badge');

        if (badge) {
            badge.querySelector('.rank-badge-emoji').textContent = rank.emoji;
            badge.querySelector('.rank-badge-name').textContent = rank.name;
            badge.querySelector('.rank-badge-level').textContent = `Nv. ${career.level}/${rank.maxLevel}`;
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
                newTrophies.push(trophy);

                // ✅ RÉCOMPENSE XP
                career.xp += trophy.xp;

                // ✅ NOTIFICATION
                showTrophyNotification(trophy);
            }
        }

        if (changed) {
            // Vérifier level up après gain XP
            while (career.xp >= career.xpNext && career.level < 100) {
                career.xp -= career.xpNext;
                career.level++;
                career.xpNext = Math.floor(career.xpNext * 1.5);
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
        // Créer notification
        const notification = document.createElement('div');
        notification.className = 'trophy-notification';
        notification.innerHTML = `
            <div class="trophy-notif-content">
                <div class="trophy-notif-emoji">${trophy.emoji}</div>
                <div class="trophy-notif-text">
                    <div class="trophy-notif-title">TROPHÉE DÉBLOQUÉ !</div>
                    <div class="trophy-notif-name">${trophy.name}</div>
                    <div class="trophy-notif-xp">+${trophy.xp} XP</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animation entrée
        setTimeout(() => notification.classList.add('show'), 100);

        // Animation sortie
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);

        // Son si disponible
        if (audio && audio.trophy) {
            audio.trophy();
        }
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

        const saved = load('career');
        if (saved) career = { ...career, ...saved };

        const tr = load('tr', {});
        const unlocked = Object.values(tr).filter(Boolean).length;
        const total = Object.keys(TROPHIES).length;

        // ═══════════════════════════════════════
        // 🎯 CARRIÈRE V2 - ARCHITECTURE SIMPLIFIÉE
        // ═══════════════════════════════════════

        let h = `<div class="modal-title">🏆 CARRIERE</div>`;

        // ═══════════════════════════════════════
        // SECTION RANG (Nouveau !)
        // ═══════════════════════════════════════
        const currentRank = getCurrentRank();
        const nextRank = getNextRank();

        h += `<div class="rank-section">`;
        h += `  <div class="rank-badge" style="background: ${currentRank.color};">`;
        h += `    <div class="rank-emoji">${currentRank.emoji}</div>`;
        h += `    <div class="rank-name">${currentRank.name}</div>`;
        h += `  </div>`;
        h += `  <div class="rank-info">`;
        h += `    <div class="rank-title">${currentRank.title}</div>`;
        h += `    <div class="rank-progress-text">`;
        if (nextRank) {
            h += `Niveau ${currentRank.progress}/${currentRank.total} → ${nextRank.emoji} ${nextRank.name}`;
        } else {
            h += `Rang MAXIMUM atteint ! 🎉`;
        }
        h += `    </div>`;
        h += `    <div class="rank-progress-bar">`;
        h += `      <div class="rank-progress-fill" style="width: ${currentRank.percentage}%; background: ${currentRank.color};"></div>`;
        h += `    </div>`;
        h += `  </div>`;
        h += `</div>`;

        // ═══════════════════════════════════════
        // SECTION STATS
        // ═══════════════════════════════════════
        h += `<div class="table-header">📊 STATISTIQUES GLOBALES</div>`;
        h += `<table class="stats-table">`;
        h += `<tr><td>🎮 Total Parties</td><td>${career.totalGames}</td></tr>`;
        h += `<tr><td>📈 Niveau Joueur</td><td>${career.level}</td></tr>`;
        h += `<tr><td>⭐ XP Actuel</td><td>${career.xp} / ${career.xpNext}</td></tr>`;
        h += `<tr><td>💯 Score Total</td><td>${career.totalScore}</td></tr>`;
        h += `<tr><td>🏅 Meilleur Score</td><td>${career.bestScore}</td></tr>`;
        h += `<tr><td>🍎 Pommes Totales</td><td>${career.totalApples}</td></tr>`;
        h += `<tr><td>📊 Niveau Max</td><td>${career.maxLevel}</td></tr>`;
        h += `<tr><td>🧱 Murs Détruits</td><td>${career.totalWalls}</td></tr>`;
        h += `<tr><td>✨ Power-Ups</td><td>${career.totalPowerups}</td></tr>`;
        h += `<tr><td>⏱️ Survie Max</td><td>${Math.floor((career.maxSurvivalTime || 0) / 60)}:${((career.maxSurvivalTime || 0) % 60).toString().padStart(2, '0')}</td></tr>`;
        h += `</table>`;

        // ═══════════════════════════════════════
        // BOUTONS OVERLAYS (Nouveau !)
        // ═══════════════════════════════════════
        h += `<div class="career-overlay-buttons">`;
        h += `  <button class="menu-btn overlay-btn" onclick="audio.buttonClick();showLeaderboardOverlay()">📈 CLASSEMENT</button>`;
        h += `  <button class="menu-btn overlay-btn" onclick="audio.buttonClick();showTrophiesOverlay()">🏆 TROPHÉES (${unlocked}/${total})</button>`;
        h += `</div>`;

        // ═══════════════════════════════════════
        // BOUTONS ACTIONS
        // ═══════════════════════════════════════
        h += `<div class="career-actions">`;
        h += `<button class="menu-btn career-reset-btn" onclick="audio.buttonClick();resetAllStats()">⚠️ Réinitialiser Tout</button>`;
        h += `<button class="menu-btn" onclick="audio.buttonClick();closeModal()">Fermer</button>`;
        h += `</div>`;

        getElementSafely('mcontent').innerHTML = h;
        openModal('modal');
    }

    function resetAllStats() {
        if (confirm('⚠️ ATTENTION ⚠️\n\nÊtes-vous SÛR de vouloir TOUT réinitialiser ?\n\n✖️ Niveau et XP\n✖️ Toutes les statistiques\n✖️ Tous les trophées\n✖️ Meilleurs scores\n✖️ Pseudo\n\nCette action est IRRÉVERSIBLE !')) {
            // ✅ Supprimer TOUTES les clés liées au jeu
            localStorage.removeItem('career');
            localStorage.removeItem('tr');
            localStorage.removeItem('ss');
            localStorage.removeItem('hi');
            localStorage.removeItem('playerXP');
            localStorage.removeItem('playerLevel');
            localStorage.removeItem('careerStats');
            localStorage.removeItem('leaderboard');
            localStorage.removeItem('justLeveledUp');
            localStorage.removeItem('snakeUltraPseudo');
            localStorage.removeItem('playerPseudo');

            career = {
                level: 1,
                xp: 0,
                xpNext: 1000,
                totalGames: 0,
                totalScore: 0,
                bestScore: 0,
                totalApples: 0,
                maxLevel: 0,
                totalWalls: 0,
                totalPowerups: 0,
                maxSurvivalTime: 0,
                screensVisited: [],
                multiWins: 0,
                currentStreak: 0,
                bestStreak: 0
            };

            tr = {};
            ss = [];
            hi = 0;

            updatePlayerInfo();
            updateTrophies();
            closeModal();

            // ✅ Recharger la page pour réinitialiser complètement l'interface
            alert('✅ Toutes les statistiques ont été réinitialisées !\n\nLa page va se recharger.');
            window.location.reload();
        }
    }

    // ============================================
    // OVERLAYS CARRIÈRE (Nouveau !)
    // ============================================

    /**
     * Affiche l'overlay Classement (Top 3 scores locaux)
     */
    function showLeaderboardOverlay() {
        const savedScores = load('ss', []);
        const topScores = savedScores.slice(0, 3);

        let content = `
            <div class="overlay-header">
                <h2>🏅 CLASSEMENT</h2>
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
            content += `<table class="stats-table" style="margin-top: 20px;">`;
            topScores.forEach((entry, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                const name = entry.n || 'Anonyme';
                const score = entry.s || 0;
                content += `
                    <tr>
                        <td class="stat-label">${medal} ${index + 1}. ${name}</td>
                        <td class="stat-value" style="color: var(--border-color);">${score} pts</td>
                    </tr>
                `;
            });
            content += `</table>`;
        }

        showOverlay(content);
    }

    /**
     * Affiche l'overlay Trophées (grille complète)
     */
    function showTrophiesOverlay() {
        const tr = load('tr', {});
        const unlocked = Object.values(tr).filter(Boolean).length;
        const total = Object.keys(TROPHIES).length;

        let content = `
            <div class="overlay-header">
                <h2>🏆 TROPHÉES (${unlocked}/${total})</h2>
                <button class="overlay-close" onclick="audio.buttonClick();closeOverlay()">✖</button>
            </div>
        `;

        // Barre de progression
        const progressPercent = Math.round((unlocked / total) * 100);
        content += `
            <div class="trophy-progress-container" style="margin-top: 20px;">
                <div class="trophy-progress-bar">
                    <div class="trophy-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="trophy-progress-text">${unlocked}/${total} débloqués (${progressPercent}%)</div>
            </div>
        `;

        // Grille de trophées
        content += `<div class="trophy-grid" style="margin-top: 20px;">`;

        for (let key in TROPHIES) {
            const trophy = TROPHIES[key];
            const isUnlocked = tr[key] || false;
            const stars = '⭐'.repeat(trophy.rarity);

            // Si secret et non débloqué, afficher ???
            const displayName = (trophy.secret && !isUnlocked) ? '???' : trophy.name;
            const displayEmoji = (trophy.secret && !isUnlocked) ? '❓' : trophy.emoji;
            const displayDesc = (trophy.secret && !isUnlocked)
                ? (trophy.hint || 'Trophée secret...')
                : trophy.description;

            const cardClass = `trophy-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            content += `
                <div class="${cardClass}">
                    <div class="trophy-card-emoji">${displayEmoji}</div>
                    <div class="trophy-card-name">${displayName}</div>
                    <div class="trophy-card-desc">${displayDesc}</div>
                    <div class="trophy-card-footer">
                        <span class="trophy-rarity">${stars}</span>
                        ${isUnlocked ? `<span class="trophy-xp">+${trophy.xp} XP</span>` : ''}
                    </div>
                </div>
            `;
        }

        content += `</div>`;

        showOverlay(content);
    }

    /**
     * Affiche un overlay générique
     */
    function showOverlay(content) {
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
    // ÉCRAN DE CHARGEMENT
    // ============================================

    function setupLoadingScreen() {
        const loadingScreen = getElementSafely('loading');
        const loadingImage = getElementSafely('loading-image');
        const startButton = getElementSafely('start-button');

        if (!loadingScreen || !loadingImage || !startButton) {
            console.warn('❌ Écran de chargement non trouvé → Menu direct');
            setTimeout(startGame, 1000);
            return;
        }

        startButton.addEventListener('click', () => {
            loadingScreen.style.display = 'none';
            startGame();
        });
    }

    function startGame() {
        window.screenManager.show('menu');
        initMenuEmojis();

        const firstButton = document.querySelector('#menu .menu-btn');
        if (firstButton) firstButton.focus();
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
                window.audioManager.setAudio('menu');
            }).catch(error => {
                console.error('❌ Erreur chargement média:', error);
            });
        }

        // 1. Charger les données sauvegardées
        hi = load('hi', 0);
        ss = load('ss', []);
        diff = load('diff', DIFFICULTY.NORMAL);
        tr = load('tr', {});
        const savedSound = load('soundEnabled');
        if (savedSound !== null) soundEnabled = savedSound;

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

    window.showRules = showRules;
    window.showCredits = showCredits;
    window.showCareer = showCareer;
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
    window.resetAllStats = resetAllStats;


})();
