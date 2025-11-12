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
        first: {i: '😊', n: 'Apprenti Serpent', d: 'Atteindre le niveau 10 en difficulté Facile'},
        millenium: {i: '😮', n: 'Serpent du Millénaire', d: 'Atteindre le niveau 10 en difficulté Normal'},
        speed: {i: '😈', n: 'Serpent Véloce', d: 'Atteindre le niveau 10 en difficulté Difficile'},
        timemaster: {i: '⏱️', n: 'Maître du Temps', d: 'Collecter 5 power-ups Ralentissement'},
        moneysnake: {i: '💰', n: 'Serpent Argenté', d: 'Collecter 5 power-ups Double Score'},
        invincible: {i: '🛡️', n: 'Serpent Indestructible', d: 'Collecter 5 power-ups Invincibilité'},
        wallbreaker: {i: '🧱', n: 'Briseur de Murs', d: 'Détruire 20 obstacles au total'},
        loner: {i: '🎯', n: 'Puriste', d: 'Atteindre le niveau 10 sans utiliser de power-ups'},
        easywin: {i: '🏅', n: 'Vainqueur Facile', d: 'Obtenir 3000 points en difficulté Facile'},
        normalwin: {i: '🎖️', n: 'Vainqueur Normal', d: 'Obtenir 6000 points en difficulté Normal'},
        hardwin: {i: '🏆', n: 'Vainqueur Difficile', d: 'Obtenir 12000 points en difficulté Difficile'},
        kingsnake: {i: '👑', n: 'Roi Serpent', d: 'Atteindre le niveau 20'},
        perfectionist: {i: '💎', n: 'Perfectionniste', d: 'Atteindre le niveau 15 sans manger de crânes'},
        boaroyal: {i: '🐍', n: 'Boa Royal', d: 'Atteindre une longueur de 30 segments'},
        expert: {i: '⭐', n: 'Expert Ultime', d: 'Atteindre le niveau 10 en difficulté Difficile sans power-ups'}
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
        maxSurvivalTime: 0
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
                console.log('✅ AudioContext initialisé (effets sonores)');
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

        console.log('✅ Emojis du menu initialisés');
    }

    function updatePlayerInfo() {
        const saved = load('career');
        if (saved) career = { ...career, ...saved };

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
            soundBtn.innerHTML = (soundEnabled ? '🔊' : '🔇') + ' SON : <span id="sound-status">' + soundStatus.textContent + '</span>';
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
    // TROPHÉES
    // ============================================

    function checkTrophy() {
        // Cette fonction sera appelée par solo-game.js après game over
        // Pour l'instant, on la garde vide pour éviter les erreurs
        console.log('checkTrophy() appelé - sera implémenté par solo-game.js');
    }

    function updateTrophies() {
        let h = '', unlocked = 0, total = Object.keys(TROPHIES).length;
        for (let k in TROPHIES) {
            if (tr[k]) unlocked++;
            h += `<span class="trophy ${tr[k] ? 'unlocked' : ''}" title="${TROPHIES[k].n}: ${TROPHIES[k].d}">${TROPHIES[k].i}</span>`;
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

        h += '<div class="credits-footer">';
        h += '<p style="text-align: center; margin-top: 20px; color: var(--color-gold);">';
        h += '🐍 Snake Ultra - Deluxe Edition 🐍<br>';
        h += '© 2024 Cyril Laurent & IA Collaborateurs';
        h += '</p>';
        h += '</div>';

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
            soundBtn.innerHTML = (soundEnabled ? '🔊' : '🔇') + ' SON : <span id="sound-status">' + (soundEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ') + '</span>';
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

        let h = `<div class="modal-title">🏆 CARRIERE</div>`;
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
        h += `<div class="table-header">🎖️ TROPHÉES (${unlocked}/${total})</div>`;
        h += `<div class="trophy-bar">${window.careerTrophyHTML || ''}</div>`;
        h += `<div style="margin-top: 20px; display: flex; gap: 10px; flex-direction: column;">`;
        h += `<button class="menu-btn" style="background: #f44336; border-color: #f44336;" onclick="audio.buttonClick();resetAllStats()">⚠️ Réinitialiser Tout</button>`;
        h += `<button class="menu-btn" onclick="audio.buttonClick();closeModal()">Fermer</button>`;
        h += `</div>`;

        getElementSafely('mcontent').innerHTML = h;
        openModal('modal');
    }

    function resetAllStats() {
        if (confirm('⚠️ ATTENTION ⚠️\n\nÊtes-vous SÛR de vouloir TOUT réinitialiser ?\n\n✖️ Niveau et XP\n✖️ Toutes les statistiques\n✖️ Tous les trophées\n✖️ Meilleurs scores\n\nCette action est IRRÉVERSIBLE !')) {
            localStorage.removeItem('career');
            localStorage.removeItem('tr');
            localStorage.removeItem('ss');
            localStorage.removeItem('hi');

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
                maxSurvivalTime: 0
            };

            tr = {};
            ss = [];
            hi = 0;

            updatePlayerInfo();
            updateTrophies();
            closeModal();

            alert('✅ Toutes les statistiques ont été réinitialisées !');
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

        console.log('📸 Initialisation image de chargement...');
        startButton.addEventListener('click', () => {
            console.log('🚀 Bouton cliqué, démarrage');
            loadingScreen.style.display = 'none';
            console.log('🏁 Chargement terminé → Menu');
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
        console.log('🎮 Initialisation Snake Ultra...');

        // Init backgrounds & audio
        if (window.backgroundManager && window.audioManager) {
            Promise.all([
                window.backgroundManager.preloadAll(),
                window.audioManager.preloadAll()
            ]).then(() => {
                window.backgroundManager.setBackground('menu');
                window.audioManager.setAudio('menu');
                console.log('✅ Backgrounds et audio prêts');
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
        console.log('✅ Données chargées');

        // 2. Initialiser l'audio
        audio.init();
        console.log('✅ Audio initialisé');

        // 3. Configurer l'écran de chargement
        setupLoadingScreen();
        console.log('✅ Écran de chargement configuré');

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

        console.log('✅ Emojis ajoutés');
        console.log('🎮 Snake Ultra prêt !');
    }

    // ============================================
    // EXPORTS GLOBAUX
    // ============================================

    window.init = init;
    window.onload = () => window.init();

    window.showRules = showRules;
    window.showCredits = showCredits;
    window.career = showCareer;
    window.toggleSound = toggleSound;
    window.closeModal = closeModal;
    window.save = save;
    window.load = load;
    window.checkTrophy = checkTrophy;
    window.updateTrophies = updateTrophies;
    window.updatePlayerInfo = updatePlayerInfo;

    console.log('✅ snake.js (nettoyé) chargé');

})();
