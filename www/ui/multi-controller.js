/**
 * Contrôleur du mode multijoueur
 */

import { logger } from '../services/logger.js';
import { SnakeUltra } from '../SnakeUltra.js';

export class MultiController {
    constructor() {
        this.gameInstance = null;
        logger.debug('MultiController créé');
    }

    /**
     * Démarre le mode multijoueur
     */
    start() {
        try {
            // 1. VALIDER LE PSEUDO
            const pseudoInput = document.getElementById('pseudo-input');
            const pseudo = pseudoInput ? pseudoInput.value.trim() : '';

            if (!pseudo || pseudo.length < 3 || pseudo.length > 12) {
                const errorSpan = document.getElementById('pseudo-error');
                if (errorSpan) {
                    errorSpan.textContent = '⚠️ Pseudo invalide (3-12 caractères)';
                    errorSpan.style.display = 'block';
                } else if (window.ModalManager) {
                    window.ModalManager.warning('Veuillez entrer un pseudo valide (3-12 caractères)');
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
                logger.warn('Impossible de sauvegarder le pseudo dans localStorage');
            }

            // 3. CRÉER LE JEU
            if (!this.gameInstance) {
                try {
                    this.gameInstance = new window.MultiplayerSnakeGame();
                    window.multiGame = this.gameInstance;
                    SnakeUltra.games.multi = this.gameInstance;
                } catch (error) {
                    logger.error('Erreur création jeu multi:', error);
                    if (window.ModalManager) {
                        window.ModalManager.error('Impossible de créer le jeu multijoueur');
                    }
                    throw error;
                }
            }

            // 4. DÉMARRER
            // Le serveur enverra 'room_joined' qui affichera le lobby
            this.gameInstance.start();

            // Envoyer le pseudo après la connexion
            setTimeout(() => {
                if (this.gameInstance.client && this.gameInstance.client.connected) {
                    this.gameInstance.client.sendPseudo(pseudo);
                }
            }, 500);

            // Lancer la musique de jeu si disponible
            if (window.audio && window.audio.playMusic) {
                window.audio.playMusic('game');
            }

        } catch (error) {
            logger.error('Erreur critique mode multi:', error);
            if (window.ModalManager) {
                window.ModalManager.error('Erreur critique: ' + error.message);
            }
            throw error;
        }
    }

    /**
     * Abandonner la partie multijoueur
     */
    abandon() {
        if (!confirm('Abandonner la partie ?')) {
            return;
        }

        this.quit();
    }

    /**
     * Quitter le mode multijoueur et retourner au menu
     */
    quit() {
        logger.log('Quit mode multi');

        // Arrêter le jeu
        if (this.gameInstance) {
            this.gameInstance.stop();
        }

        // Retourner au menu
        if (SnakeUltra.managers.screen) {
            SnakeUltra.managers.screen.show('menu');
        }

        // Lancer la musique du menu
        if (window.audio && window.audio.playMusic) {
            window.audio.playMusic('menu');
        }
    }

    /**
     * Quitter le lobby et retourner au menu multijoueur
     */
    leaveLobby() {
        logger.log('Quitter le lobby');

        // Déconnecter le client multiplayer
        if (this.gameInstance && this.gameInstance.client) {
            this.gameInstance.client.disconnect();
        }

        // Retourner au menu multijoueur
        if (SnakeUltra.managers.screen) {
            SnakeUltra.managers.screen.show('multiplayer-menu');
        }
    }

    /**
     * Marquer le joueur comme prêt dans le lobby
     */
    setReady() {
        // Vérifier la connexion
        if (!this.gameInstance || !this.gameInstance.client || !this.gameInstance.client.connected) {
            if (window.ModalManager) {
                window.ModalManager.error('Non connecté au serveur');
            }
            return;
        }

        // Envoyer au serveur
        this.gameInstance.client.ws.send(JSON.stringify({
            type: 'player_ready'
        }));

        // Désactiver le bouton
        const btn = document.getElementById('btn-ready');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '✅ PRÊT !';
            btn.style.opacity = '0.6';
        }
    }

    /**
     * Récupérer l'instance du jeu multi
     */
    getGameInstance() {
        return this.gameInstance;
    }
}

// Instance singleton
export const multiController = new MultiController();
