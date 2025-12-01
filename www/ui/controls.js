// ============================================
// CONTROLS - Gestion des contrôles clavier
// Module extrait de navigation.js
// ============================================

import { logger } from '../services/logger.js';

// ============================================
// CONTRÔLES DIRECTIONNELS GLOBAUX
// Redirige vers solo, IA ou multi selon le mode actif
// ============================================

/**
 * Fonction de direction universelle
 * @param {number} dx - Direction X (-1, 0, 1)
 * @param {number} dy - Direction Y (-1, 0, 1)
 */
export function d(dx, dy) {
    // Mode Solo
    if (window.soloGame && window.soloGame.running) {
        window.soloGame.changeDirection(dx, dy);
    }
    // Mode IA
    else if (window.aiGame && window.aiGame.running) {
        window.aiGame.changeDirection(dx, dy);
    }
    // Mode Multi
    else if (window.multiGame && window.multiGame.isActive) {
        window.multiGame.changeDirection(dx, dy);
    }
}

// Fonctions alternatives
export function moveUp() { d(0, -1); }
export function moveDown() { d(0, 1); }
export function moveLeft() { d(-1, 0); }
export function moveRight() { d(1, 0); }

// ============================================
// GESTION DES TOUCHES CLAVIER
// ============================================

/**
 * Initialise les écouteurs clavier
 */
export function initKeyboardControls() {
    document.addEventListener('keydown', handleKeyDown);
    logger.log('✅ Contrôles clavier initialisés');
}

/**
 * Handler pour les touches clavier
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
    // Mode Solo
    if (window.soloGame && window.soloGame.running && !window.soloGame.paused) {
        handleSoloKeys(e);
    }
    // Mode IA
    else if (window.aiGame && window.aiGame.running && !window.aiGame.paused) {
        handleAIKeys(e);
    }

    // Mode Multijoueur (peut être actif en même temps)
    if (window.multiGame && window.multiGame.isActive) {
        handleMultiKeys(e);
    }
}

/**
 * Gère les touches pour le mode Solo
 */
function handleSoloKeys(e) {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'z':
        case 'Z':
            e.preventDefault();
            window.soloGame.changeDirection(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            window.soloGame.changeDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'q':
        case 'Q':
            e.preventDefault();
            window.soloGame.changeDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            window.soloGame.changeDirection(1, 0);
            break;
        case ' ':
        case 'p':
        case 'P':
            e.preventDefault();
            if (window.pauseSolo) window.pauseSolo();
            break;
        case 'Escape':
            e.preventDefault();
            if (window.quitSolo) window.quitSolo();
            break;
    }
}

/**
 * Gère les touches pour le mode IA
 */
function handleAIKeys(e) {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'z':
        case 'Z':
            e.preventDefault();
            window.aiGame.changeDirection(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            window.aiGame.changeDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'q':
        case 'Q':
            e.preventDefault();
            window.aiGame.changeDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            window.aiGame.changeDirection(1, 0);
            break;
        case ' ':
        case 'p':
        case 'P':
            e.preventDefault();
            if (window.pauseAI) window.pauseAI();
            break;
        case 'Escape':
            e.preventDefault();
            if (window.quitAI) window.quitAI();
            break;
    }
}

/**
 * Gère les touches pour le mode Multijoueur
 */
function handleMultiKeys(e) {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'z':
        case 'Z':
            e.preventDefault();
            window.multiGame.changeDirection(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            window.multiGame.changeDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'q':
        case 'Q':
            e.preventDefault();
            window.multiGame.changeDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            window.multiGame.changeDirection(1, 0);
            break;
        case 'Escape':
            e.preventDefault();
            if (window.abandonMulti) window.abandonMulti();
            break;
    }
}

// ============================================
// EXPORTS GLOBAUX (compatibilité window.*)
// ============================================

window.d = d;
window.moveUp = moveUp;
window.moveDown = moveDown;
window.moveLeft = moveLeft;
window.moveRight = moveRight;

logger.log('✅ Module controls.js chargé');
