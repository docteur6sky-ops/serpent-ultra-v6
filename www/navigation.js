// ============================================
// NAVIGATION - GESTION DES ÉCRANS ET MODES
// ============================================


// Instances globales des jeux
let soloGameInstance = null;
let multiGameInstance = null;
let currentDifficulty = 0; // 0 = Facile, 1 = Normal, 2 = Difficile

// ============================================
// FONCTIONS DE NAVIGATION
// ============================================

// Utiliser le ScreenManager global
const showScreen = (screenId) => window.screenManager.show(screenId);
const hideAllScreens = () => window.screenManager.hideAll();

// ============================================
// MODE SOLO
// ============================================

/**
 * Démarre le mode solo
 */
window.start = function() {

    // Afficher l'écran de jeu solo
    window.screenManager.show('game-solo');

    // Créer l'instance si elle n'existe pas
    if (!soloGameInstance) {
        try {
            soloGameInstance = new SoloSnakeGame();
            window.soloGame = soloGameInstance; // Exposer globalement pour index.html
        } catch (error) {
            alert('Erreur: Impossible de créer le jeu solo');
            return;
        }
    }

    // Démarrer le jeu avec la difficulté sélectionnée
    soloGameInstance.start(currentDifficulty);

    // Lancer la musique de jeu si disponible
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('game');
    }
};

/**
 * Met en pause / reprend le jeu solo
 */
window.pauseSolo = function() {

    if (soloGameInstance) {
        // Vérifier l'état AVANT de toggler
        const wasPaused = soloGameInstance.paused;

        // Toggle pause
        soloGameInstance.pause();

        // Son de pause
        if (window.audio && window.audio.buttonClick) {
            window.audio.buttonClick();
        }

        // Gérer la musique selon le nouvel état
        if (window.audioManager) {
            if (wasPaused) {
                // Le jeu était en pause, on reprend
                window.audioManager.resume();
            } else {
                // Le jeu tourne, on met en pause
                window.audioManager.pause();
            }
        }
    }
};

/**
 * Quitter le mode solo et retourner au menu
 */
window.quitSolo = function() {
    window.audio.buttonClick();

    // Mettre le jeu en pause
    if (soloGameInstance && soloGameInstance.running) {
        soloGameInstance.pause();
    }

    // Afficher l'overlay
    const overlay = document.getElementById('solo-quit-overlay');
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
};

/**
 * Confirmer la sortie du mode solo
 */
function confirmQuitSolo() {
    window.audio.buttonClick();

    // Cacher l'overlay
    const overlay = document.getElementById('solo-quit-overlay');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';

    // Arrêter le jeu
    if (soloGameInstance) {
        soloGameInstance.stop();
    }

    // Retour au menu
    window.screenManager.show('menu');

    // Lancer la musique du menu
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('menu');
    }
}

/**
 * Annuler la sortie et reprendre le jeu
 */
function cancelQuitSolo() {
    window.audio.buttonClick();

    // Cacher l'overlay
    const overlay = document.getElementById('solo-quit-overlay');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';

    // Reprendre le jeu (pause() est un toggle)
    if (soloGameInstance) {
        soloGameInstance.pause();
    }
}

// Exposer les fonctions globalement
window.confirmQuitSolo = confirmQuitSolo;
window.cancelQuitSolo = cancelQuitSolo;

/**
 * Gère le game over du mode solo
 * @param {object} stats - Statistiques de la partie
 */
window.handleSoloGameOver = function(stats) {
    // Arrêter audio
    if (window.audioManager) {
        window.audioManager.stopAll();
    }

    // Stocker les stats pour plus tard
    window.lastGameStats = stats;

    // Afficher overlay progression (AVANT les stats)
    showProgressionOverlay(stats);
};

/**
 * Affiche l'overlay de progression XP/Niveau
 */
function showProgressionOverlay(stats) {
    // Calculer XP gagné (score ÷ 5 = XP)
    const xpGained = Math.floor(stats.score / 5);

    // Récupérer niveau/XP actuel depuis localStorage
    const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
    const currentLevel = parseInt(localStorage.getItem('playerLevel') || '1');

    // Calculer XP max pour ce niveau
    const xpMax = currentLevel * 100;

    // Nouveau total XP
    const newTotalXP = currentXP + xpGained;

    // Level up ?
    let newLevel = currentLevel;
    let finalXP = newTotalXP;
    let leveledUp = false;

    if (newTotalXP >= xpMax) {
        newLevel = currentLevel + 1;
        finalXP = newTotalXP - xpMax; // Overflow vers nouveau niveau
        leveledUp = true;
    }

    // ✅ NOUVEAU : Mettre à jour la barre circulaire
    const levelNum = document.getElementById('progression-level-num');
    const xpText = document.getElementById('progression-xp-text');
    const circleFill = document.getElementById('progression-circle-fill');

    if (levelNum) levelNum.textContent = newLevel;
    if (xpText) xpText.textContent = `${finalXP}/${newLevel * 100} XP`;

    // Animer le cercle
    if (circleFill) {
        const percentage = finalXP / (newLevel * 100);
        const circumference = 2 * Math.PI * 65;
        const offset = circumference * (1 - percentage);

        setTimeout(() => {
            circleFill.style.strokeDashoffset = offset;
        }, 100);
    }

    // Animation level up
    const levelUpAnim = document.getElementById('level-up-animation');
    const nextBtn = document.getElementById('progression-next-btn');

    if (leveledUp) {
        document.getElementById('new-level').textContent = newLevel;
        levelUpAnim.classList.remove('hidden');
        document.getElementById('progression-btn-text').textContent = `NIVEAU ${newLevel}`;

        if (window.audio && window.audio.powerup) {
            window.audio.powerup();
        }

        nextBtn.disabled = true;
        setTimeout(() => {
            nextBtn.disabled = false;
        }, 2000);
    } else {
        levelUpAnim.classList.add('hidden');
        document.getElementById('progression-btn-text').textContent = 'Suivant';
    }

    // Sauvegarder nouveau XP/niveau
    localStorage.setItem('playerXP', finalXP);
    localStorage.setItem('playerLevel', newLevel);

    // ✅ NOUVEAU : Stocker XP gagné pour les stats
    window.lastGameXPGained = xpGained;

    // Afficher overlay
    const overlay = document.getElementById('progression-overlay');
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
}

/**
 * Cache l'overlay progression et affiche les stats finales
 */
function showFinalStats() {
    if (window.audio) window.audio.buttonClick();

    // Cacher overlay progression
    const progressionOverlay = document.getElementById('progression-overlay');
    progressionOverlay.classList.add('hidden');
    progressionOverlay.style.display = 'none';

    // Afficher écran stats
    window.screenManager.show('over');

    // Récupérer les stats stockées
    const stats = window.lastGameStats;

    // Afficher les stats de jeu
    setTimeout(() => {
        // Mapping emoji difficulté
        const difficultyEmojis = {
            'Facile': '😊',
            'Normal': '😮',
            'Difficile': '😈'
        };

        const elements = {
            fsc: document.getElementById('fsc'),
            fxp: document.getElementById('fxp'),
            flv: document.getElementById('flv'),
            ffood: document.getElementById('ffood'),
            ftime: document.getElementById('ftime'),
            fmaxlength: document.getElementById('fmaxlength'),
            fwalls: document.getElementById('fwalls'),
            fskulls: document.getElementById('fskulls'),
            fdiffEmoji: document.getElementById('fdiff-emoji'),
            fice: document.getElementById('fice'),
            ffire: document.getElementById('ffire'),
            frock: document.getElementById('frock'),
            fghost: document.getElementById('fghost')
        };

        // Mettre à jour les valeurs
        if (elements.fsc) elements.fsc.textContent = stats.score || 0;
        // ✅ NOUVEAU : Afficher XP gagné
        if (elements.fxp) elements.fxp.textContent = `+${window.lastGameXPGained || 0} XP`;
        if (elements.flv) elements.flv.textContent = stats.level || 1;
        if (elements.ffood) elements.ffood.textContent = stats.foodCount || 0;
        if (elements.ftime) elements.ftime.textContent = stats.timeString || '0:00';
        if (elements.fmaxlength) elements.fmaxlength.textContent = stats.maxSnakeLength || 1;
        if (elements.fwalls) elements.fwalls.textContent = stats.wallsDestroyed || 0;
        if (elements.fskulls) elements.fskulls.textContent = stats.skullsEaten || 0;

        // Mettre à jour difficulté avec emoji
        if (elements.fdiffEmoji && stats.difficulty) {
            elements.fdiffEmoji.textContent = difficultyEmojis[stats.difficulty] || '😊';
        }

        // Power-ups (nouveaux IDs)
        if (elements.fice) elements.fice.textContent = stats.slowCount || 0;
        if (elements.ffire) elements.ffire.textContent = stats.doubleCount || 0;
        if (elements.frock) elements.frock.textContent = stats.invincibleCount || 0;
        if (elements.fghost) elements.fghost.textContent = stats.ghostCount || 0;
    }, 100);
}

// Exposer globalement
window.showProgressionOverlay = showProgressionOverlay;
window.showFinalStats = showFinalStats;

// ============================================
// MODE MULTIJOUEUR
// ============================================

/**
 * Démarre le mode multijoueur
 */
window.startLocalMultiplayer = function() {

    try {
        // 1. VALIDER LE PSEUDO
        const pseudoInput = document.getElementById('pseudo-input');
        const pseudo = pseudoInput ? pseudoInput.value.trim() : '';

        if (!pseudo || pseudo.length < 3 || pseudo.length > 12) {
            const errorSpan = document.getElementById('pseudo-error');
            if (errorSpan) {
                errorSpan.textContent = '⚠️ Pseudo invalide (3-12 caractères)';
                errorSpan.style.display = 'block';
            } else {
                alert('Veuillez entrer un pseudo valide (3-12 caractères)');
            }
            return; // NE PAS connecter
        }

        // Valider le format avec la fonction de validation existante
        if (window.getValidPseudo) {
            const validatedPseudo = window.getValidPseudo();
            if (!validatedPseudo) {
                // L'erreur est déjà affichée par getValidPseudo()
                return;
            }
        }

        // 2. SAUVEGARDER LE PSEUDO (tenter, même en navigation privée)
        try {
            localStorage.setItem('snakeUltraPseudo', pseudo);
            localStorage.setItem('playerPseudo', pseudo);
        } catch (e) {
            // Échec localStorage (navigation privée) - continuer quand même
        }

        // 3. CRÉER LE JEU
        if (!multiGameInstance) {
            try {
                multiGameInstance = new MultiplayerSnakeGame();
                window.multiGame = multiGameInstance;
            } catch (error) {
                alert('Erreur: Impossible de créer le jeu multijoueur');
                throw error;
            }
        }

        // 4. DÉMARRER
        // Le serveur enverra 'room_joined' qui affichera le lobby
        multiGameInstance.start();

        // Envoyer le pseudo après la connexion
        setTimeout(() => {
            if (multiGameInstance.client && multiGameInstance.client.connected) {
                multiGameInstance.client.sendPseudo(pseudo);
            }
        }, 500);

        // Lancer la musique de jeu si disponible
        if (window.audio && window.audio.playMusic) {
            window.audio.playMusic('game');
        }

    } catch (error) {
        alert('Erreur critique: ' + error.message);
        throw error;
    }
};

/**
 * Abandonner la partie multijoueur
 */
window.abandonMulti = function() {

    if (!confirm('Abandonner la partie ?')) {
        return;
    }

    window.quitMulti();
};

/**
 * Quitter le mode multijoueur et retourner au menu
 */
window.quitMulti = function() {

    // Arrêter le jeu
    if (multiGameInstance) {
        multiGameInstance.stop();
    }

    // Retourner au menu
    window.screenManager.show('menu');

    // Lancer la musique du menu
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('menu');
    }
};

/**
 * Quitter le lobby et retourner au menu multijoueur
 */
window.leaveLobby = function() {

    // Déconnecter le client multiplayer
    if (multiGameInstance && multiGameInstance.client) {
        multiGameInstance.client.disconnect();
    }

    // Retourner au menu multijoueur
    window.screenManager.show('multiplayer-menu');
};

/**
 * Marquer le joueur comme prêt dans le lobby
 */
window.setReady = function() {

    // Vérifier la connexion
    if (!multiGameInstance || !multiGameInstance.client || !multiGameInstance.client.connected) {
        alert('Erreur: Non connecté au serveur');
        return;
    }

    // Envoyer au serveur
    multiGameInstance.client.ws.send(JSON.stringify({
        type: 'player_ready'
    }));

    // Désactiver le bouton
    const btn = document.getElementById('btn-ready');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '✅ PRÊT !';
        btn.style.opacity = '0.6';
    }
};

// ============================================
// GESTION DE LA DIFFICULTÉ
// ============================================

/**
 * Change la difficulté sélectionnée
 * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
 */
window.setDiff = function(difficulty) {

    currentDifficulty = difficulty;

    // Mettre à jour l'UI des boutons de difficulté
    const buttons = document.querySelectorAll('.diff-btn');
    buttons.forEach((btn, index) => {
        if (index === difficulty) {
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        }
    });

    // Son du bouton
    if (window.audio && window.audio.buttonClick) {
        window.audio.buttonClick();
    }
};

// ============================================
// UTILITAIRES
// ============================================

/**
 * Retourne l'instance du jeu solo
 * @returns {SoloSnakeGame|null}
 */
window.getSoloGame = function() {
    return soloGameInstance;
};

/**
 * Retourne l'instance du jeu multijoueur
 * @returns {MultiplayerSnakeGame|null}
 */
window.getMultiGame = function() {
    return multiGameInstance;
};

/**
 * Retourne la difficulté actuelle
 * @returns {number}
 */
window.getCurrentDifficulty = function() {
    return currentDifficulty;
};

// ============================================
// GESTION DES TOUCHES CLAVIER (MODE SOLO)
// ============================================

document.addEventListener('keydown', (e) => {
    // Si on est en mode solo
    if (soloGameInstance && soloGameInstance.running && !soloGameInstance.paused) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
            case 'z':
            case 'Z':
                e.preventDefault();
                soloGameInstance.changeDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                soloGameInstance.changeDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
            case 'q':
            case 'Q':
                e.preventDefault();
                soloGameInstance.changeDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                soloGameInstance.changeDirection(1, 0);
                break;
            case ' ':
            case 'p':
            case 'P':
                e.preventDefault();
                window.pauseSolo();
                break;
            case 'Escape':
                e.preventDefault();
                window.quitSolo();
                break;
        }
    }

    // Si on est en mode multijoueur
    if (multiGameInstance && multiGameInstance.isActive) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
            case 'z':
            case 'Z':
                e.preventDefault();
                multiGameInstance.changeDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                multiGameInstance.changeDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
            case 'q':
            case 'Q':
                e.preventDefault();
                multiGameInstance.changeDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                multiGameInstance.changeDirection(1, 0);
                break;
            case 'Escape':
                e.preventDefault();
                window.abandonMulti();
                break;
        }
    }
});

// ============================================
// CONTRÔLES DIRECTIONNELS GLOBAUX
// Redirige vers solo ou multi selon le mode actif
// ============================================

window.d = function(dx, dy) {

    if (soloGameInstance && soloGameInstance.running) {
        soloGameInstance.changeDirection(dx, dy);
    } else if (multiGameInstance && multiGameInstance.isActive) {
        multiGameInstance.changeDirection(dx, dy);
    }
};

// Fonctions alternatives (au cas où)
window.moveUp = function() { window.d(0, -1); };
window.moveDown = function() { window.d(0, 1); };
window.moveLeft = function() { window.d(-1, 0); };
window.moveRight = function() { window.d(1, 0); };

// ============================================
// NOUVELLE NAVIGATION MENUS
// ============================================

/**
 * Masquer tous les menus
 */
function hideAllMenus() {
    const menus = [
        'menu', 'difficulty-menu', 'multiplayer-menu', 'options-menu',
        'sound-menu', 'career-menu', 'rules-menu', 'credits-menu', 'language-menu'
    ];
    menus.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
            element.classList.remove('active');
        }
    });
}

/**
 * Afficher un menu avec animation
 * @param {string} menuId - ID du menu à afficher
 * @param {string} direction - Direction de l'animation
 */
function showMenu(menuId, direction = 'slide-in-right') {
    hideAllMenus();
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.remove('hidden');
        // Animation sera gérée par CSS
        setTimeout(() => {
            menu.classList.add('active');
        }, 10);
    }
}

// ============================================
// NAVIGATION - MENU PRINCIPAL
// ============================================

/**
 * Retour au menu principal
 */
window.backToMain = function() {
    showMenu('menu', 'slide-in-left');
    updatePlayerProgress();
};

/**
 * Afficher le menu Options
 */
window.showOptions = function() {
    showMenu('options-menu', 'slide-in-right');
};

/**
 * Afficher le menu Difficulté
 */
window.showDifficulty = function() {
    showMenu('difficulty-menu', 'slide-in-right');
};

/**
 * Afficher le menu Multiplayer
 */
window.showMultiplayer = function() {

    // Afficher l'écran menu multi (c'est un SCREEN, pas un sous-menu)
    if (window.screenManager) {
        window.screenManager.show('multiplayer-menu');
    }

    // NE PAS auto-connecter - on attend que l'utilisateur clique sur DÉMARRER
    // Cela force l'affichage de l'écran de saisie du pseudo même en navigation privée
};

// ============================================
// NAVIGATION - SOUS-MENUS OPTIONS
// ============================================

/**
 * Retour au menu Options
 */
window.backToOptions = function() {
    showMenu('options-menu', 'slide-in-left');
};

/**
 * Afficher le menu Son
 */
window.showSound = function() {
    showMenu('sound-menu', 'slide-in-right');
    loadSoundSettings();
};

/**
 * Afficher le menu Carrière
 */
window.showCareer = function() {
    showMenu('career-menu', 'slide-in-right');
};

/**
 * Afficher le menu Règles
 */
window.showRules = function() {
    showMenu('rules-menu', 'slide-in-right');
};

/**
 * Afficher le menu Crédits
 */
window.showCredits = function() {
    showMenu('credits-menu', 'slide-in-right');
};

/**
 * Afficher le menu Langue
 */
window.showLanguage = function() {
    showMenu('language-menu', 'slide-in-right');
    loadLanguageSettings();
};

/**
 * Retourner au menu Options depuis un sous-menu
 */
window.backToOptions = function() {
    showMenu('options-menu', 'slide-in-left');
};

/**
 * Définir la langue de l'interface
 * @param {string} lang - Code de langue ('fr', 'en', 'es', 'de')
 */
window.setLanguage = function(lang) {

    // Pour l'instant, seul le français est disponible
    if (lang !== 'fr') {
        return;
    }

    // Sauvegarder la préférence
    localStorage.setItem('language', lang);

    // TODO: Implémenter la traduction de l'interface
};

/**
 * Charger les paramètres de langue
 */
function loadLanguageSettings() {
    const savedLang = localStorage.getItem('language') || 'fr';
    // TODO: Appliquer la traduction
}

// ============================================
// DÉMARRAGE JEUX AVEC DIFFICULTÉ
// ============================================

/**
 * Démarrer le jeu solo avec une difficulté
 * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
 */
window.startSolo = function(difficulty) {
    currentDifficulty = difficulty;
    window.start(); // Utilise la fonction existante
};

// ============================================
// PROGRESSION JOUEUR (Niveau/XP)
// ============================================

/**
 * Mettre à jour l'affichage de la progression du joueur
 */
function updatePlayerProgress() {
    // Récupérer du localStorage
    const level = parseInt(localStorage.getItem('playerLevel') || '1');
    const xp = parseInt(localStorage.getItem('playerXP') || '0');
    const xpForNextLevel = level * 100;

    // Mettre à jour le texte niveau dans le cercle SVG
    const levelNum = document.getElementById('player-level-num');
    if (levelNum) {
        levelNum.textContent = level;
    }

    // Mettre à jour le texte XP dans le cercle SVG
    const xpText = document.getElementById('player-xp-text');
    if (xpText) {
        xpText.textContent = `${xp}/${xpForNextLevel} XP`;
    }

    // Animer le cercle XP
    const circleFill = document.getElementById('player-circle-fill');
    if (circleFill) {
        const percentage = (xp / xpForNextLevel);
        const circumference = 2 * Math.PI * 65; // r=65
        const offset = circumference * (1 - percentage);

        circleFill.style.strokeDashoffset = offset;
    }
}

// ============================================
// PARAMÈTRES SON
// ============================================

/**
 * Mettre à jour le volume de la musique
 * @param {number} value - Volume (0-100)
 */
window.updateMusicVolume = function(value) {
    const valueElement = document.getElementById('music-value');
    if (valueElement) valueElement.textContent = value + '%';

    const volume = value / 100; // 0-100 → 0.0-1.0
    localStorage.setItem('musicVolume', volume);

    // Mettre à jour la jauge visuelle via CSS variable
    const slider = document.getElementById('music-volume');
    if (slider) {
        slider.style.setProperty('--slider-value', value + '%');
    }

    // Appliquer avec AudioManager
    if (window.audioManager) {
        window.audioManager.setVolume(volume);
    }
};

/**
 * Mettre à jour le volume des effets sonores
 * @param {number} value - Volume (0-100)
 */
window.updateSFXVolume = function(value) {
    const valueElement = document.getElementById('sfx-value');
    if (valueElement) valueElement.textContent = value + '%';

    const volume = value / 100; // 0-100 → 0.0-1.0
    localStorage.setItem('sfxVolume', volume);

    // Mettre à jour la jauge visuelle via CSS variable
    const slider = document.getElementById('sfx-volume');
    if (slider) {
        slider.style.setProperty('--slider-value', value + '%');
    }

    // Effets sonores gérés par window.audio (beep)
    // Volume des effets reste dans l'ancien système pour l'instant
};

/**
 * Basculer le mode silencieux
 */
window.toggleMute = function() {
    const muteStateElement = document.getElementById('mute-state');
    if (!muteStateElement) return;

    const currentState = muteStateElement.textContent === 'OFF';

    muteStateElement.textContent = currentState ? 'ON' : 'OFF';
    localStorage.setItem('muted', currentState);

    // Appliquer avec AudioManager
    if (window.audioManager) {
        // Toggle seulement si l'état est différent
        if (window.audioManager.muted !== currentState) {
            window.audioManager.toggleMute();
        }
    }
};

/**
 * Charger les paramètres son depuis localStorage
 */
function loadSoundSettings() {
    // Charger depuis localStorage (valeurs en 0.0-1.0)
    const musicVolume = parseFloat(localStorage.getItem('musicVolume')) || 0.5;
    const sfxVolume = parseFloat(localStorage.getItem('sfxVolume')) || 0.85;
    const muted = localStorage.getItem('muted') === 'true';

    // Appliquer aux sliders (convertir 0.0-1.0 → 0-100)
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicValueElement = document.getElementById('music-value');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const sfxValueElement = document.getElementById('sfx-value');
    const muteStateElement = document.getElementById('mute-state');

    const musicVolumePercent = Math.round(musicVolume * 100);
    const sfxVolumePercent = Math.round(sfxVolume * 100);

    if (musicVolumeSlider) {
        musicVolumeSlider.value = musicVolumePercent;
        // Initialiser la jauge visuelle
        musicVolumeSlider.style.setProperty('--slider-value', musicVolumePercent + '%');
    }
    if (musicValueElement) musicValueElement.textContent = musicVolumePercent + '%';

    if (sfxVolumeSlider) {
        sfxVolumeSlider.value = sfxVolumePercent;
        // Initialiser la jauge visuelle
        sfxVolumeSlider.style.setProperty('--slider-value', sfxVolumePercent + '%');
    }
    if (sfxValueElement) sfxValueElement.textContent = sfxVolumePercent + '%';

    if (muteStateElement) muteStateElement.textContent = muted ? 'ON' : 'OFF';

    // Appliquer avec AudioManager
    if (window.audioManager) {
        window.audioManager.setVolume(musicVolume);
        if (muted && !window.audioManager.muted) {
            window.audioManager.toggleMute();
        }
    }
}

// ============================================
// DARK MODE
// ============================================

/**
 * Basculer le mode sombre
 */
window.toggleDarkMode = function() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');

    // Sauvegarder
    localStorage.setItem('darkMode', isDark);

    // Mettre à jour l'indicateur
    const indicator = document.getElementById('dark-mode-indicator');
    if (indicator) indicator.textContent = isDark ? 'ON' : 'OFF';

    // Animation smooth
    body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

};

/**
 * Charger le Dark Mode au démarrage
 */
function loadDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        const indicator = document.getElementById('dark-mode-indicator');
        if (indicator) indicator.textContent = 'ON';
    }
}

// ============================================
// SYSTÈME XP ET LEVEL UP
// ============================================

// Fonction appelée après une partie solo pour gagner XP
window.awardXP = function(amount) {
    let currentXP = parseInt(localStorage.getItem('playerXP') || '0');
    let currentLevel = parseInt(localStorage.getItem('playerLevel') || '1');

    currentXP += amount;
    let leveledUp = false;

    // Vérifier level up
    const xpForNextLevel = currentLevel * 100;
    if (currentXP >= xpForNextLevel) {
        currentLevel++;
        currentXP -= xpForNextLevel;
        leveledUp = true;
    }

    // Sauvegarder
    localStorage.setItem('playerXP', currentXP);
    localStorage.setItem('playerLevel', currentLevel);
    localStorage.setItem('justLeveledUp', leveledUp);

    // Rafraîchir l'affichage
    updatePlayerProgress();


    return { leveledUp, newLevel: currentLevel, xpGained: amount };
};

// ============================================
// INITIALISATION
// ============================================

// Charger les paramètres au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    updatePlayerProgress();
    loadDarkMode();
    loadSoundSettings(); // Charger paramètres audio au démarrage

    // Initialiser l'input pseudo
    if (window.initPseudoInput) {
        window.initPseudoInput();
    }

    // Event listener pour le bouton JOUER SOLO
    const soloBtnEl = document.getElementById('solo-btn');
    if (soloBtnEl) {
        soloBtnEl.addEventListener('click', () => {
            startSolo(currentDifficulty);
        });
    }

    // Event listener pour le bouton IA (placeholder)
    const btnAI = document.getElementById('btn-ai');
    if (btnAI) {
        btnAI.addEventListener('click', () => {

            // Son du bouton
            if (window.audio && window.audio.buttonClick) {
                window.audio.buttonClick();
            }

            // TODO: Implémenter le mode IA dans la Phase 3
            alert('🤖 Mode contre l\'IA - Bientôt disponible !');
        });
    }

    // Sélectionner FACILE par défaut au chargement
    setDiff(0);
});

