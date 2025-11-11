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

/**
 * Masque tous les écrans
 */
function hideAllScreens() {
    const screens = ['loading', 'menu', 'game-solo', 'game-multi', 'over'];
    screens.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

/**
 * Affiche un écran spécifique
 * @param {string} screenId - ID de l'écran à afficher
 */
function showScreen(screenId) {
    hideAllScreens();
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
    }
}

// ============================================
// MODE SOLO
// ============================================

/**
 * Démarre le mode solo
 */
window.start = function() {
    console.log('🎮 Démarrage mode SOLO');

    // Masquer tous les écrans et afficher game-solo
    showScreen('game-solo');

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
    showScreen('menu');

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

    // Ici, on pourrait afficher l'écran game over
    // Pour l'instant, retour au menu après 2 secondes

    setTimeout(() => {
        showScreen('over');
        // Afficher les stats dans l'écran game over
        // TODO: Implémenter l'affichage des stats
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

    // Masquer tous les écrans et afficher game-multi
    showScreen('game-multi');

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
    showScreen('menu');

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
// INITIALISATION
// ============================================

console.log('✅ Système de navigation chargé');
console.log('📌 Fonctions disponibles:');
console.log('   - window.start() : Démarrer mode solo');
console.log('   - window.startLocalMultiplayer() : Démarrer mode multijoueur');
console.log('   - window.pauseSolo() : Pause solo');
console.log('   - window.quitSolo() : Quitter solo');
console.log('   - window.abandonMulti() : Abandonner multi');
console.log('   - window.quitMulti() : Quitter multi');
console.log('   - window.setDiff(n) : Changer difficulté');
