// ============================================
// NAVIGATION - GESTION DES ÉCRANS ET MODES
// ============================================

console.log('📱 Chargement du système de navigation...');

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
    console.log('🎮 Démarrage mode SOLO');

    // Afficher l'écran de jeu solo
    window.screenManager.show('game-solo');

    // Créer l'instance si elle n'existe pas
    if (!soloGameInstance) {
        try {
            soloGameInstance = new SoloSnakeGame();
            window.soloGame = soloGameInstance; // Exposer globalement pour index.html
            console.log('✅ SoloSnakeGame créé');
        } catch (error) {
            console.error('❌ Erreur création SoloSnakeGame:', error);
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
 * Met en pause le jeu solo
 */
window.pauseSolo = function() {
    console.log('⏸️ Pause mode SOLO');

    if (soloGameInstance) {
        soloGameInstance.pause();

        // Son de pause
        if (window.audio && window.audio.buttonClick) {
            window.audio.buttonClick();
        }
    }
};

/**
 * Quitter le mode solo et retourner au menu
 */
window.quitSolo = function() {
    console.log('🏠 Quitter mode SOLO');

    if (!confirm('Quitter la partie ? Votre progression sera perdue.')) {
        return;
    }

    // Arrêter le jeu
    if (soloGameInstance) {
        soloGameInstance.stop();
    }

    // Retourner au menu
    window.screenManager.show('menu');

    // Lancer la musique du menu
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('menu');
    }
};

/**
 * Gère le game over du mode solo
 * @param {object} stats - Statistiques de la partie
 */
window.handleSoloGameOver = function(stats) {
    console.log('💀 Game Over SOLO', stats);

    // Calculer l'XP gagné
    const xpGained = Math.floor(stats.score / 10);
    const progressResult = window.awardXP(xpGained);

    // Récupérer les données actuelles
    const currentLevel = parseInt(localStorage.getItem('playerLevel') || '1');
    const currentXP = parseInt(localStorage.getItem('playerXP') || '0');
    const xpForNextLevel = currentLevel * 100;
    const xpPercentage = (currentXP / xpForNextLevel) * 100;

    setTimeout(() => {
        window.screenManager.show('over');

        // Remplir les stats XP
        document.getElementById('xp-gained-value').textContent = `+${xpGained} XP`;
        document.getElementById('current-level-text').textContent = `Niveau ${currentLevel}`;
        document.getElementById('xp-text-overlay').textContent = `${currentXP} / ${xpForNextLevel} XP`;

        // Afficher/masquer le message level up
        const levelUpMsg = document.getElementById('level-up-message');
        if (progressResult.leveledUp) {
            levelUpMsg.style.display = 'block';
            document.getElementById('level-up-text').textContent = `🎉 NIVEAU ${progressResult.newLevel} ATTEINT ! 🎉`;
        } else {
            levelUpMsg.style.display = 'none';
        }

        // Animer la barre XP
        setTimeout(() => {
            const xpBar = document.getElementById('xp-bar-gameover');
            if (xpBar) {
                xpBar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                xpBar.style.width = xpPercentage + '%';
            }
        }, 500);
    }, 500);
};

// ============================================
// MODE MULTIJOUEUR
// ============================================

/**
 * Démarre le mode multijoueur
 */
window.startLocalMultiplayer = function() {
    console.log('🌐 Démarrage mode MULTIJOUEUR');

    // Afficher l'écran multijoueur
    window.screenManager.show('game-multi');

    // Créer l'instance si elle n'existe pas
    if (!multiGameInstance) {
        try {
            multiGameInstance = new MultiplayerSnakeGame();
            window.multiGame = multiGameInstance; // Exposer globalement pour index.html
            console.log('✅ MultiplayerSnakeGame créé');
        } catch (error) {
            console.error('❌ Erreur création MultiplayerSnakeGame:', error);
            alert('Erreur: Impossible de créer le jeu multijoueur');
            return;
        }
    }

    // Démarrer le jeu
    multiGameInstance.start();

    // Lancer la musique de jeu si disponible
    if (window.audio && window.audio.playMusic) {
        window.audio.playMusic('game');
    }
};

/**
 * Abandonner la partie multijoueur
 */
window.abandonMulti = function() {
    console.log('🏳️ Abandon mode MULTIJOUEUR');

    if (!confirm('Abandonner la partie ?')) {
        return;
    }

    window.quitMulti();
};

/**
 * Quitter le mode multijoueur et retourner au menu
 */
window.quitMulti = function() {
    console.log('🏠 Quitter mode MULTIJOUEUR');

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

// ============================================
// GESTION DE LA DIFFICULTÉ
// ============================================

/**
 * Change la difficulté sélectionnée
 * @param {number} difficulty - 0 = Facile, 1 = Normal, 2 = Difficile
 */
window.setDiff = function(difficulty) {
    console.log(`🎚️ Difficulté: ${difficulty}`);

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
    console.log(`🎮 window.d(${dx}, ${dy}) appelé`);

    if (soloGameInstance && soloGameInstance.running) {
        console.log('   → Mode SOLO actif, envoi à soloGameInstance');
        soloGameInstance.changeDirection(dx, dy);
    } else if (multiGameInstance && multiGameInstance.isActive) {
        console.log('   → Mode MULTI actif, envoi à multiGameInstance');
        multiGameInstance.changeDirection(dx, dy);
    } else {
        console.log('   ⚠️  Aucun jeu actif!', {
            soloRunning: soloGameInstance?.running,
            multiActive: multiGameInstance?.isActive
        });
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
        'sound-menu', 'career-menu', 'rules-menu', 'credits-menu'
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
    console.log('🏠 Retour au menu principal');
    showMenu('menu', 'slide-in-left');
    updatePlayerProgress();
};

/**
 * Afficher le menu Options
 */
window.showOptions = function() {
    console.log('⚙️ Menu Options');
    showMenu('options-menu', 'slide-in-right');
};

/**
 * Afficher le menu Difficulté
 */
window.showDifficulty = function() {
    console.log('🎮 Menu Difficulté');
    showMenu('difficulty-menu', 'slide-in-right');
};

/**
 * Afficher le menu Multiplayer
 */
window.showMultiplayer = function() {
    console.log('🌐 Menu Multiplayer');
    showMenu('multiplayer-menu', 'slide-in-right');
};

// ============================================
// NAVIGATION - SOUS-MENUS OPTIONS
// ============================================

/**
 * Retour au menu Options
 */
window.backToOptions = function() {
    console.log('⚙️ Retour Options');
    showMenu('options-menu', 'slide-in-left');
};

/**
 * Afficher le menu Son
 */
window.showSound = function() {
    console.log('🔊 Menu Son');
    showMenu('sound-menu', 'slide-in-right');
    loadSoundSettings();
};

/**
 * Afficher le menu Carrière
 */
window.showCareer = function() {
    console.log('📊 Menu Carrière');
    showMenu('career-menu', 'slide-in-right');
};

/**
 * Afficher le menu Règles
 */
window.showRules = function() {
    console.log('📖 Menu Règles');
    showMenu('rules-menu', 'slide-in-right');
};

/**
 * Afficher le menu Crédits
 */
window.showCredits = function() {
    console.log('ℹ️ Menu Crédits');
    showMenu('credits-menu', 'slide-in-right');
};

/**
 * Afficher le menu Langue
 */
window.showLanguage = function() {
    console.log('🌍 Menu Langue');
    showMenu('language-menu', 'slide-in-right');
    loadLanguageSettings();
};

/**
 * Retourner au menu Options depuis un sous-menu
 */
window.backToOptions = function() {
    console.log('⚙️ Retour au menu Options');
    showMenu('options-menu', 'slide-in-left');
};

/**
 * Définir la langue de l'interface
 * @param {string} lang - Code de langue ('fr', 'en', 'es', 'de')
 */
window.setLanguage = function(lang) {
    console.log(`🌍 Langue sélectionnée: ${lang}`);

    // Pour l'instant, seul le français est disponible
    if (lang !== 'fr') {
        console.log('⚠️ Cette langue n\'est pas encore disponible');
        return;
    }

    // Sauvegarder la préférence
    localStorage.setItem('language', lang);

    // TODO: Implémenter la traduction de l'interface
    console.log('✅ Langue sauvegardée (traduction à venir)');
};

/**
 * Charger les paramètres de langue
 */
function loadLanguageSettings() {
    const savedLang = localStorage.getItem('language') || 'fr';
    console.log(`🌍 Langue chargée: ${savedLang}`);
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
    console.log(`🎮 Démarrer SOLO - Difficulté: ${difficulty}`);
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
    localStorage.setItem('musicVolume', value);

    // Appliquer au système audio
    if (window.audio && window.audio.backgroundMusic) {
        window.audio.backgroundMusic.volume = value / 100;
    }
};

/**
 * Mettre à jour le volume des effets sonores
 * @param {number} value - Volume (0-100)
 */
window.updateSFXVolume = function(value) {
    const valueElement = document.getElementById('sfx-value');
    if (valueElement) valueElement.textContent = value + '%';
    localStorage.setItem('sfxVolume', value);

    // Appliquer au système audio
    if (window.audio) {
        window.audio.sfxVolume = value / 100;
    }
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

    // Appliquer
    if (window.audio) {
        if (currentState) {
            window.audio.muteAll();
        } else {
            window.audio.unmuteAll();
        }
    }
};

/**
 * Charger les paramètres son depuis localStorage
 */
function loadSoundSettings() {
    // Charger depuis localStorage
    const musicVolume = localStorage.getItem('musicVolume') || '70';
    const sfxVolume = localStorage.getItem('sfxVolume') || '85';
    const muted = localStorage.getItem('muted') === 'true';

    // Appliquer aux sliders
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicValueElement = document.getElementById('music-value');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const sfxValueElement = document.getElementById('sfx-value');
    const muteStateElement = document.getElementById('mute-state');

    if (musicVolumeSlider) musicVolumeSlider.value = musicVolume;
    if (musicValueElement) musicValueElement.textContent = musicVolume + '%';

    if (sfxVolumeSlider) sfxVolumeSlider.value = sfxVolume;
    if (sfxValueElement) sfxValueElement.textContent = sfxVolume + '%';

    if (muteStateElement) muteStateElement.textContent = muted ? 'ON' : 'OFF';
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

    console.log(`🌓 Mode ${isDark ? 'BLEU ÉLECTRIQUE' : 'OR'} activé`);
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

    console.log(`✨ XP awarded: +${amount} (Total: ${currentXP}/${xpForNextLevel})`);

    return { leveledUp, newLevel: currentLevel, xpGained: amount };
};

// ============================================
// INITIALISATION
// ============================================

// Charger les paramètres au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Initialisation des menus...');
    updatePlayerProgress();
    loadDarkMode();
});

console.log('✅ Système de navigation chargé');
console.log('📌 Fonctions disponibles:');
console.log('   - window.start() : Démarrer mode solo');
console.log('   - window.startLocalMultiplayer() : Démarrer mode multijoueur');
console.log('   - window.pauseSolo() : Pause solo');
console.log('   - window.quitSolo() : Quitter solo');
console.log('   - window.abandonMulti() : Abandonner multi');
console.log('   - window.quitMulti() : Quitter multi');
console.log('   - window.setDiff(n) : Changer difficulté');
console.log('   - window.showOptions() : Menu Options');
console.log('   - window.showSound() : Menu Son');
console.log('   - window.toggleDarkMode() : Mode sombre');
