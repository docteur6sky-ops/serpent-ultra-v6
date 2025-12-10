// ============================================
// SNAKE ULTRA V6 - FICHIER PRINCIPAL
// UI, Overlays et Initialisation
// ============================================

import { logger } from './services/logger.js';
import { CONFIG, DIFFICULTY } from './config/constants.js';
import { save, load } from './services/storage.js';
import { audioService } from './services/audio.js';
import { careerManager } from './services/CareerManager.js';
import { trophyManager } from './managers/TrophyManager.js';

(function() {
    'use strict';

    // ============================================
    // VARIABLES LOCALES
    // ============================================

    let soundEnabled = true;
    let musicStarted = false;
    let diff = DIFFICULTY.NORMAL;

    // Initialiser les trophées avec career
    trophyManager.init(careerManager.career);

    // ============================================
    // SERVICES AUDIO
    // ============================================

    const audio = audioService;
    window.audio = audio;

    // ============================================
    // UTILITAIRES
    // ============================================

    function getElementSafely(id) {
        const element = document.getElementById(id);
        if (!element) logger.warn(`Element with id '${id}' not found`);
        return element;
    }

    // ============================================
    // FONCTIONS UI - EMOJIS
    // ============================================

    function initMenuEmojis() {
        const diffBtns = document.querySelectorAll('.diff-btn');
        if (diffBtns[0] && !diffBtns[0].textContent.includes('😊')) diffBtns[0].textContent = '😊 FACILE';
        if (diffBtns[1] && !diffBtns[1].textContent.includes('😮')) diffBtns[1].textContent = '😮 NORMAL';
        if (diffBtns[2] && !diffBtns[2].textContent.includes('😈')) diffBtns[2].textContent = '😈 DIFFICILE';
        updateSoundButtonEmoji();
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
    // FONCTIONS UI - MENUS
    // ============================================

    function showRules() {
        startMenuMusicOnce();
        let h = '<div class="modal-title">📖 Règles du Jeu</div>';

        h += '<div class="rules-section"><h3>🎯 Objectif</h3>';
        h += '<p>Guidez votre serpent pour manger des pommes 🍎, éviter les obstacles 🧱 et les crânes 💀, et atteignez le score le plus élevé possible !</p></div>';

        h += '<div class="rules-section"><h3>🕹️ Contrôles</h3><ul>';
        h += '<li><strong>Flèches directionnelles</strong> ou <strong>D-Pad tactile</strong> : Déplacer le serpent</li>';
        h += '<li><strong>Espace / P</strong> : Mettre en pause</li></ul></div>';

        h += '<div class="rules-section"><h3>🎮 Éléments du Jeu</h3><ul>';
        h += '<li><strong>🍎 Pomme</strong> : +100 points (+200 si Double Score actif)</li>';
        h += '<li><strong>💀 Crâne</strong> : -50 points, réduit votre serpent de 3 segments</li>';
        h += '<li><strong>🧱 Obstacle</strong> : Collision = Game Over (sauf si Invincible)</li>';
        h += '<li><strong>Power-Ups</strong> : ⏱️ Ralentissement, 💰 Double Score, 🛡️ Invincibilité</li></ul></div>';

        h += '<div class="rules-section"><h3>🔥 Système de Combo</h3>';
        h += '<p>Mangez des pommes consécutivement sans manger de crânes pour augmenter votre multiplicateur de combo (jusqu\'à x5) !</p></div>';

        h += '<div class="rules-section"><h3>✨ Power-Ups</h3><ul>';
        h += '<li><strong>⏱️ Ralentissement</strong> : Réduit la vitesse pendant 10 secondes</li>';
        h += '<li><strong>💰 Double Score</strong> : Double tous les points pendant 15 secondes</li>';
        h += '<li><strong>🛡️ Invincibilité</strong> : Protège contre obstacles/crânes pendant 8 secondes</li></ul></div>';

        h += '<div class="rules-section"><h3>🎯 Difficultés</h3><ul>';
        h += '<li><strong>😊 Facile</strong> : Vitesse lente, peu d\'obstacles</li>';
        h += '<li><strong>😮 Normal</strong> : Vitesse moyenne, obstacles modérés</li>';
        h += '<li><strong>😈 Difficile</strong> : Vitesse rapide, nombreux obstacles</li></ul></div>';

        h += '<div class="rules-section"><h3>🏆 Progression & Carrière</h3>';
        h += '<p>Gagnez de l\'XP en jouant pour augmenter votre niveau. Débloquez des trophées en accomplissant des défis !</p></div>';

        h += '<div class="close-container"><button class="menu-btn" onclick="audio.buttonClick();closeModal()">Fermer</button></div>';
        getElementSafely('mcontent').innerHTML = h;
        openModal('modal', 'mcontent');
    }

    function showCredits() {
        startMenuMusicOnce();
        let h = '<div class="modal-title">🎬 Crédits</div>';

        h += '<div class="credits-section"><h3>🎮 Créateur Exécutif</h3>';
        h += '<p><strong>Cyril Laurent</strong></p>';
        h += '<p class="credits-subtitle">Conception, Direction & Développement</p></div>';

        h += '<div class="credits-section"><h3>🤖 Co-Créateurs IA</h3><ul>';
        h += '<li><strong>Claude AI (Anthropic)</strong> - Architecture & Logique de jeu</li>';
        h += '<li><strong>Grok (xAI)</strong> - Assistance technique</li>';
        h += '<li><strong>ChatGPT (OpenAI)</strong> - Optimisations & Conseils</li></ul></div>';

        h += '<div class="credits-section"><h3>📊 Statistiques du Jeu</h3><ul>';
        h += '<li>Version: <strong>6.0 Deluxe Edition</strong></li>';
        h += '<li>Modes de jeu: <strong>Solo, IA & Multijoueur</strong></li></ul></div>';

        h += '<p class="credits-footer">🐍 Snake Ultra - Deluxe Edition 🐍<br>© 2024 Cyril Laurent & IA Collaborateurs</p>';

        h += '<div class="close-container"><button class="menu-btn" onclick="audio.buttonClick();closeModal()">Fermer</button></div>';
        getElementSafely('mcontent').innerHTML = h;
        openModal('modal');
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        audioService.setEnabled(soundEnabled);
        save('soundEnabled', soundEnabled);
        updateSoundButton();

        if (!soundEnabled && window.audioManager) {
            if (!window.audioManager.muted) window.audioManager.toggleMute();
        } else if (soundEnabled && window.audioManager) {
            if (window.audioManager.muted) window.audioManager.toggleMute();
        }
    }

    function updateSoundButton() {
        const soundStatus = getElementSafely('sound-status');
        const soundBtn = getElementSafely('soundToggle');

        if (soundStatus) soundStatus.textContent = soundEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ';
        if (soundBtn) {
            soundBtn.innerHTML = (soundEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07') + ' SON : <span id="sound-status">' + (soundEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ') + '</span>';
        }
    }

    function showCareer() {
        audio.buttonClick();
        startMenuMusicOnce();

        if (window.statsManager) {
            window.statsManager.showStats();
        } else {
            logger.error('[showCareer] statsManager non disponible');
        }
    }

    function resetAllStats() {
        if (confirm('⚠️ ATTENTION ⚠️\n\nÊtes-vous SÛR de vouloir TOUT réinitialiser ?\n\n✖️ Niveau et XP\n✖️ Toutes les statistiques\n✖️ Tous les trophées\n✖️ Meilleurs scores\n✖️ Stats Roguelike\n✖️ Pseudo du joueur\n✖️ Tutoriel (sera revu)\n\n✅ Votre collection (coins, items, perks) sera CONSERVÉE\n\nCette action est IRRÉVERSIBLE !')) {
            // Reset des managers (PAS la box !)
            if (window.careerManager) careerManager.reset();
            if (window.trophyManager) trophyManager.reset();
            if (window.roguelikeManager) roguelikeManager.resetStats(); // Reset stats mais garde perks
            // boxManager: NE PAS RESET - achats du joueur !

            // Nettoyage localStorage (PAS boxData !)
            localStorage.removeItem('career');
            localStorage.removeItem('careerStats');
            localStorage.removeItem('tr');
            localStorage.removeItem('ss');
            localStorage.removeItem('hi');
            localStorage.removeItem('leaderboard');
            localStorage.removeItem('snakeultra_pseudo');
            localStorage.removeItem('playerPseudo');      // Clé de compatibilité
            localStorage.removeItem('snakeUltraPseudo');  // Clé de compatibilité
            // boxData: NE PAS SUPPRIMER - achats du joueur !
            // snakeRoguelikeMeta: Reset partiel via roguelikeManager.resetStats()

            // Reset du tutoriel Roguelike (sera revu au prochain lancement)
            localStorage.removeItem('roguelike_tutorial_completed');

            if (window.ModalManager) {
                window.ModalManager.success(
                    'Statistiques réinitialisées !\n\nVotre collection et vos perks Roguelike ont été conservés.\nLe tutoriel sera affiché au prochain lancement.',
                    {
                        title: 'Réinitialisation',
                        onClose: () => location.reload()
                    }
                );
            } else {
                location.reload();
            }
        }
    }

    // ============================================
    // OVERLAYS
    // ============================================

    function showOverlay(content) {
        const existingOverlay = document.getElementById('career-overlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.id = 'career-overlay';
        overlay.className = 'career-overlay';
        overlay.innerHTML = `<div class="career-overlay-content">${content}</div>`;

        document.body.appendChild(overlay);

        if (window.screenManager) {
            window.screenManager.registerOverlay('career-overlay');
        }

        setTimeout(() => overlay.classList.add('visible'), 10);
    }

    function closeOverlay() {
        const overlay = document.getElementById('career-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    function showLeaderboardOverlay() {
        const topScores = window.getLeaderboard ? window.getLeaderboard() : [];

        let content = `
            <div class="overlay-header">
                <h2>🏅 CLASSEMENT TOP 3</h2>
                <button class="overlay-close" onclick="audio.buttonClick();closeOverlay()">✖</button>
            </div>
        `;

        if (topScores.length === 0) {
            content += `<div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                Aucun score enregistré.<br>Jouez pour établir votre premier record !
            </div>`;
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

    // ============================================
    // ÉCRAN DE CHARGEMENT & DÉMARRAGE
    // ============================================

    function setupLoadingScreen() {
        logger.log('📺 Loading screen géré par main.js (vidéo)');
    }

    function startGame() {
        const savedPseudo = localStorage.getItem('snakeultra_pseudo');

        if (!savedPseudo) {
            logger.log('🆕 Première visite → Demande du pseudo');
            window.screenManager.show('multiplayer-menu');
            setTimeout(() => {
                const pseudoInput = document.getElementById('pseudo-input');
                if (pseudoInput) pseudoInput.focus();
            }, 300);
        } else {
            logger.log('👤 Pseudo existant:', savedPseudo);
            window.screenManager.show('hub');

            if (window.updatePlayerProgress) window.updatePlayerProgress();
            if (window.initHub) setTimeout(() => window.initHub(), 100);
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
                logger.log('🎵 Audio préchargé - En attente fin loading screen');
            }).catch(error => {
                logger.error('❌ Erreur chargement média:', error);
            });
        }

        // Charger les données sauvegardées
        diff = load('diff', DIFFICULTY.NORMAL);
        const savedSound = load('soundEnabled');
        if (savedSound !== null) {
            soundEnabled = savedSound;
            audioService.setEnabled(savedSound);
        }

        // Initialiser l'audio
        audio.init();

        // Configurer l'écran de chargement
        setupLoadingScreen();

        // Initialiser l'UI
        initMenuEmojis();
        careerManager.updatePlayerInfo();
        trophyManager.updateTrophiesDisplay();

        // D-pad emojis
        const dpadButtons = document.querySelectorAll('.dpad-btn');
        if (dpadButtons[1]) dpadButtons[1].textContent = '⬆️';
        if (dpadButtons[3]) dpadButtons[3].textContent = '⬅️';
        if (dpadButtons[4]) dpadButtons[4].textContent = '⬇️';
        if (dpadButtons[5]) dpadButtons[5].textContent = '➡️';
    }

    // ============================================
    // EXPORTS GLOBAUX
    // ============================================

    // Wrapper init() pour éviter double appel
    const originalInit = init;
    window.init = function() {
        if (window._initCalled) {
            logger.log('⚠️ init() déjà appelé, skip');
            return;
        }
        window._initCalled = true;
        originalInit();
    };

    // Note: L'appel à init() est maintenant géré par main.js après tous les imports

    window.startGame = startGame;

    window.showRules = showRules;
    window.showCredits = showCredits;
    window.showCareer = showCareer;
    window.resetAllStats = resetAllStats;
    window.toggleSound = toggleSound;
    window.closeModal = closeModal;
    window.save = save;
    window.load = load;

    window.showLeaderboardOverlay = showLeaderboardOverlay;
    window.showOverlay = showOverlay;
    window.closeOverlay = closeOverlay;

    logger.log('✅ snake.js chargé (version allégée)');

})();
