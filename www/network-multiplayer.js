// ============================================
// 🎮 CLIENT MULTIJOUEUR SNAKE ULTRA - V5 FINAL
// Avec tableau J1 | Timer | J2 et écran calé
// ============================================

import { logger } from './services/logger.js';
import { SERVER_CONFIG } from './config/constants.js';
class MultiplayerClient {
    constructor() {
        this.ws = null;
        this.playerId = null;
        this.playerNumber = null;
        this.roomId = null;
        this.connected = false;
        this.gameActive = false;
        this.opponents = {};
        this.serverUrl = this.detectServerUrl();
        this.pingInterval = null;
        this.reconnectTimeout = null; // ✅ FIX: Track timeout pour éviter race condition
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.wasKicked = false; // ✅ Nouveau: Tracker si le joueur a été kické

        this.onConnected = null;
        this.onRoomJoined = null;
        this.onRoomFull = null;
        this.onGameStart = null;
        this.onGameUpdate = null;
        this.onGameOver = null;
        this.onPlayerLeft = null;
        this.onError = null;
    }

    detectServerUrl() {
        // Mode production activé dans constants.js
        if (SERVER_CONFIG.USE_PRODUCTION) {
            return SERVER_CONFIG.PRODUCTION_URL;
        }

        // Détection automatique pour app native (Capacitor)
        if (window.Capacitor?.isNativePlatform()) {
            logger.warn('⚠️ App native détectée mais USE_PRODUCTION est false. Configurez SERVER_CONFIG dans constants.js');
            return SERVER_CONFIG.PRODUCTION_URL;
        }

        // Mode développement
        return SERVER_CONFIG.DEV_URL;
    }

    connect(customUrl = null) {
        if (this.connected) {
            logger.log('✅ Déjà connecté');
            return;
        }

        const url = customUrl || this.serverUrl;
        logger.log(`🔌 Connexion: ${url}`);
        
        this.showMessage('Connexion...', 'info');

        try {
            this.ws = new WebSocket(url);
            this.setupWebSocketHandlers();
        } catch (error) {
            logger.error('❌ Erreur:', error);
            this.showMessage('Impossible de se connecter', 'error');
            if (this.onError) this.onError(error);
        }
    }

    setupWebSocketHandlers() {
        this.ws.onopen = () => {
            logger.log('✅ Connecté');
            this.connected = true;
            this.reconnectAttempts = 0;
            // Message supprimé : on arrive directement au lobby
            this.startPing();
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                logger.error('❌ Erreur parsing:', error);
            }
        };

        this.ws.onerror = (error) => {
            logger.error('❌ Erreur WebSocket:', error);
            this.showMessage('Erreur de connexion', 'error');
            if (this.onError) this.onError(error);
        };

        this.ws.onclose = () => {
            logger.log('❌ Connexion fermée');
            this.connected = false;
            this.stopPing();

            // Si kické, ne pas reconnecter
            if (this.wasKicked) {
                logger.log('🚫 Reconnexion désactivée (kické)');
                return;
            }

            if (this.gameActive) {
                this.showMessage('Connexion perdue', 'error');
                this.attemptReconnect();
            }
        };
    }

    handleMessage(message) {
        switch (message.type) {
            case 'connected':
                this.playerId = message.playerId;
                logger.log(`🆔 ID: ${this.playerId}`);
                if (this.onConnected) this.onConnected(message);
                break;

            case 'lobby_ready':
                // ✅ LOBBY PRINCIPAL - Serveur prêt, on est dans le lobby principal
                logger.log('🏠 Lobby principal prêt');
                // Connecter mainLobby au client WebSocket
                if (window.mainLobby) {
                    window.mainLobby.client = this;
                }
                break;

            case 'room_list':
                // ✅ LOBBY PRINCIPAL - Liste des salons reçue
                logger.log('📋 Liste des salons reçue', message.rooms);
                if (window.mainLobby) {
                    window.mainLobby.displayRoomList(message.rooms);
                }
                break;

            case 'room_created':
                // ✅ LOBBY PRINCIPAL - Salon créé et rejoint
                logger.log('✅ Salon créé avec succès', message);
                this.roomId = message.roomId;
                this.playerNumber = message.playerNumber;

                // ✅ FIX PSEUDO: Envoyer le pseudo depuis localStorage
                const savedPseudoCreate = localStorage.getItem('snakeultra_pseudo');
                if (savedPseudoCreate) {
                    this.sendPseudo(savedPseudoCreate);
                    logger.log(`👤 Pseudo envoyé au serveur: "${savedPseudoCreate}"`);
                }

                // Aller au lobby de la room
                if (window.screenManager) {
                    window.screenManager.show('lobby-screen');
                }

                this.updateLobby({
                    roomId: this.roomId,
                    playerCount: message.playersInRoom,
                    myNumber: this.playerNumber
                });
                break;

            case 'join_error':
                // ✅ LOBBY PRINCIPAL - Erreur lors de la tentative de rejoindre
                logger.error('❌ Impossible de rejoindre le salon:', message.error);
                if (window.ModalManager) {
                    window.ModalManager.error(`Impossible de rejoindre le salon:\n${message.error}`);
                }
                break;

            case 'room_joined':
                this.roomId = message.roomId;
                this.playerNumber = message.playerNumber;

                // ✅ FIX PSEUDO: Envoyer le pseudo depuis localStorage
                const savedPseudoJoin = localStorage.getItem('snakeultra_pseudo');
                if (savedPseudoJoin) {
                    this.sendPseudo(savedPseudoJoin);
                    logger.log(`👤 Pseudo envoyé au serveur: "${savedPseudoJoin}"`);
                }

                // Afficher le lobby
                if (window.screenManager) {
                    window.screenManager.show('lobby-screen');
                } else {
                    logger.error('❌ ScreenManager introuvable!');
                }

                // Mettre à jour les infos du lobby
                this.updateLobby({
                    roomId: this.roomId,
                    playerCount: message.playersInRoom,
                    myNumber: this.playerNumber
                });

                if (message.playersInRoom === 2) {
                    this.showMessage('Adversaire trouvé !', 'success');
                }

                if (this.onRoomJoined) this.onRoomJoined(message);
                break;

            case 'room_full':
                this.showMessage(message.message, 'success');
                if (this.onRoomFull) this.onRoomFull(message);
                break;

            case 'game_starting':
                logger.log('🎮 Transition vers le jeu...');

                // Cacher le lobby et afficher l'écran de jeu
                if (window.screenManager) {
                    window.screenManager.show('game-multi');
                }
                break;

            case 'countdown_tick':
                this.showCountdown(message.number);
                break;

            case 'countdown_go':
                this.showCountdownGo();
                break;

            case 'game_start':
                logger.log('🎮 Démarrage');
                this.gameActive = true;
                if (this.onGameStart) this.onGameStart(message);
                break;

            case 'game_update':
                if (this.onGameUpdate) this.onGameUpdate(message.gameState);
                break;

            case 'game_over':
                logger.log('🏁 Fin');
                this.gameActive = false;
                this.showMessage(message.message, 'info');
                if (this.onGameOver) this.onGameOver(message);
                break;

            case 'mystery_box_collected':
                // 🎁 Mystery box collectée - déclencher animation roulette
                logger.log(`🎁 Mystery Box → ${message.item}`);
                if (this.onMysteryBoxCollected) this.onMysteryBoxCollected(message);
                break;

            case 'item_used':
                // 🎁 Item utilisé
                logger.log(`🎁 Item utilisé: ${message.item}`);
                if (this.onItemUsed) this.onItemUsed(message);
                break;

            case 'boost_activated':
                // ⚡ BOOST activé
                logger.log(`⚡ Boost activé (${message.duration}ms, cooldown: ${message.cooldown}ms)`);
                if (this.onBoostActivated) this.onBoostActivated(message);
                break;

            case 'sword_damage':
                // ⚔️ Dégâts d'épée reçus
                logger.log(`⚔️ Dégâts épée reçus: ${message.damage} (health: ${message.health}/15)`);
                if (this.onSwordDamage) this.onSwordDamage(message);
                break;

            case 'sword_activated':
                // ⚔️ Épée activée (nouveau système avec durée)
                logger.log(`⚔️ Épée activée! Charge: ${message.charge}, Durée: ${message.duration}ms`);
                if (this.onSwordActivated) this.onSwordActivated(message);
                break;

            case 'sword_hit_success':
                // ⚔️ Attaque épée réussie
                logger.log(`⚔️ Épée touche! Dégâts: ${message.damage}, Segments gagnés: ${message.segmentsGained}`);
                if (this.onSwordHitSuccess) this.onSwordHitSuccess(message);
                break;

            case 'opponent_abandoned':
                // 🏳️ L'adversaire a abandonné, vous gagnez !
                logger.log('🏳️ Adversaire abandonné - Victoire !');
                this.gameActive = false;

                // Afficher un message de victoire
                this.showMessage('🏆 Victoire ! Votre adversaire a abandonné', 'success');

                // Déclencher le game over avec victoire
                if (this.onGameOver) {
                    this.onGameOver({
                        winner: true,
                        reason: 'abandon',
                        message: 'Victoire par abandon de l\'adversaire'
                    });
                }
                break;

            case 'player_left':
                this.showMessage(message.message, 'warning');
                if (this.onPlayerLeft) this.onPlayerLeft(message);
                break;

            case 'pseudo_updated':
                logger.log(`👤 Pseudo mis à jour: ${message.playerId} → "${message.pseudo}"`);
                // Le pseudo sera automatiquement affiché via le gameState
                break;

            case 'pseudo_taken':
                logger.error('❌ Pseudo déjà pris dans cette salle');

                // Afficher dans l'input d'erreur
                const errorSpan = document.getElementById('pseudo-error');
                if (errorSpan) {
                    errorSpan.textContent = '⚠️ ' + (message.error || 'Ce pseudo est déjà pris dans cette salle');
                    errorSpan.style.display = 'block';
                }

                // Notification visible
                if (window.ModalManager) {
                    window.ModalManager.warning('Ce pseudo est déjà pris dans cette salle. Veuillez en choisir un autre.');
                }

                // Déconnecter proprement
                this.disconnect();

                // Retourner au menu multijoueur
                if (window.screenManager) {
                    window.screenManager.show('multiplayer-menu');
                }
                break;

            case 'pseudo_response':
                if (message.success) {
                    logger.log(`✅ Pseudo accepté: "${message.pseudo}"`);
                } else {
                    logger.warn(`⚠️ Pseudo refusé: ${message.error}`);
                    this.showMessage(message.error, 'error');
                }
                break;

            case 'lobby_update':
                logger.log('🔄 Lobby update:', message);

                message.players.forEach(player => {
                    this.updatePlayerInLobby(
                        player.number,
                        player.pseudo,
                        player.ready ? '✅ PRÊT' : '⏳ En attente...'
                    );
                });

                // ✅ FIX BUG REJOUER: Réactiver le bouton si JE ne suis pas ready
                const myPlayer = message.players.find(p => p.playerId === this.playerId);

                if (myPlayer && !myPlayer.ready) {
                    const btnReady = document.getElementById('btn-ready');
                    if (btnReady) {
                        btnReady.disabled = false;
                        btnReady.textContent = '✅ PRÊT';
                        btnReady.style.opacity = '1';
                        logger.log('✅ Bouton PRÊT réactivé (lobby_update)');
                    }
                }

                // Mettre à jour le compteur
                const countSpan = document.getElementById('lobby-player-count');
                if (countSpan) {
                    countSpan.textContent = `${message.playerCount}/2`;
                }

                // Mettre à jour le message
                const messageDiv = document.getElementById('lobby-message');
                if (messageDiv) {
                    if (message.playerCount === 2) {
                        // Vérifier si tous les joueurs sont prêts
                        const allReady = message.players.every(p => p.ready);
                        if (allReady) {
                            messageDiv.textContent = '🎮 Tous les joueurs sont prêts ! Démarrage dans 3s...';
                            messageDiv.style.color = '#4CAF50';
                            messageDiv.style.fontWeight = 'bold';
                        } else {
                            messageDiv.textContent = '✅ Adversaire trouvé ! Cliquez sur PRÊT pour commencer.';
                            messageDiv.style.color = '';
                            messageDiv.style.fontWeight = '';
                        }
                    } else {
                        messageDiv.textContent = '⏳ En attente d\'un adversaire...';
                        messageDiv.style.color = '';
                        messageDiv.style.fontWeight = '';
                    }
                }
                break;

            case 'error':
                logger.error('⚠️  Erreur:', message.message);
                this.showMessage(message.message, 'error');
                break;

            case 'pong':
                break;

            case 'kicked':
                logger.error('🚨 EXPULSÉ:', message.reason);

                // Marquer comme kické pour éviter la reconnexion
                this.wasKicked = true;

                // Afficher message
                if (window.ModalManager) {
                    window.ModalManager.error(
                        `Raison: ${message.reason}\n\nVous avez été expulsé pour comportement suspect.\nSi vous pensez qu'il s'agit d'une erreur, contactez le support.`,
                        { title: 'Expulsé' }
                    );
                }

                // Déconnecter SANS reconnexion
                this.disconnect();

                // Retour au menu
                if (window.screenManager) {
                    window.screenManager.show('menu');
                }
                break;

            case 'opponent_kicked':
                logger.log('🎉 VICTOIRE - Adversaire expulsé');

                // Afficher message de victoire
                if (window.ModalManager) {
                    window.ModalManager.success(
                        `Votre adversaire a été expulsé pour triche.\n\n+${message.bonusPoints || 500} points bonus !`,
                        { title: 'Victoire !' }
                    );
                }

                // Déconnecter proprement
                this.disconnect();

                // Retour au menu
                if (window.screenManager) {
                    window.screenManager.show('menu');
                }
                break;

            default:
                logger.log('📨 Message:', message);
        }
    }

    sendInput(direction) {
        logger.log(`📡 MultiplayerClient.sendInput()`, {
            direction,
            connected: this.connected,
            wsReady: this.ws?.readyState === WebSocket.OPEN
        });

        if (!this.connected || !this.ws) {
            logger.log('   ❌ Envoi bloqué: client non connecté ou ws null');
            return;
        }

        const message = {
            type: 'input',
            direction: direction
        };
        logger.log('   ✅ Envoi message WebSocket:', message);
        this.ws.send(JSON.stringify(message));
    }

    sendReady() {
        if (!this.connected || !this.ws) return;
        logger.log('✅ Prêt');
        this.ws.send(JSON.stringify({ type: 'player_ready' }));
    }

    sendPseudo(pseudo) {
        if (!this.connected || !this.ws) {
            logger.warn('⚠️ Impossible d\'envoyer le pseudo: non connecté');
            return;
        }
        logger.log(`👤 Envoi pseudo: "${pseudo}"`);
        this.ws.send(JSON.stringify({
            type: 'set_pseudo',
            pseudo: pseudo
        }));
    }

    // 🎁 UTILISER L'ITEM STOCKÉ
    sendUseItem() {
        if (!this.connected || !this.ws) {
            logger.warn('⚠️ Impossible d\'utiliser l\'item: non connecté');
            return;
        }
        logger.log('🎁 Utilisation de l\'item stocké');
        this.ws.send(JSON.stringify({ type: 'use_item' }));
    }

    // ⚡ BOOST - Activer le boost de vitesse
    sendBoost() {
        if (!this.connected || !this.ws) {
            logger.warn('⚠️ Impossible d\'activer le boost: non connecté');
            return;
        }
        logger.log('⚡ Activation du boost');
        this.ws.send(JSON.stringify({ type: 'boost' }));
    }

    startPing() {
        // ✅ FIX #4: Nettoyer l'ancien ping AVANT d'en créer un nouveau
        this.stopPing();

        this.pingInterval = setInterval(() => {
            // ✅ FIX #4: Auto-cleanup si état invalide
            if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.stopPing();
                return;
            }
            this.ws.send(JSON.stringify({ type: 'ping' }));
        }, 30000);
    }

    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.showMessage('Impossible de reconnecter', 'error');
            return;
        }

        // ✅ FIX: Clear ancien timeout pour éviter double reconnection
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.reconnectAttempts++;
        logger.log(`🔄 Reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, 2000);
    }

    disconnect() {
        logger.log('🔌 Déconnexion du serveur');

        this.connected = false;
        this.gameActive = false;

        // ✅ FIX: Annuler tout timeout de reconnection en cours
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // ✅ FIX #4: Arrêter le ping UNE SEULE FOIS (pas de double cleanup)
        this.stopPing();

        // Fermer le WebSocket
        if (this.ws) {
            try {
                this.ws.close();
            } catch (e) {
                logger.warn('Erreur fermeture WebSocket:', e);
            }
            this.ws = null;
        }

        this.playerId = null;
        this.playerNumber = null;
        this.roomId = null;
    }

    showMessage(text, type = 'info') {
        logger.log(`[${type.toUpperCase()}] ${text}`);
        
        const existing = document.getElementById('mp-message');
        if (existing) existing.remove();

        const colors = {
            info: '#4A90E2',
            success: '#4CAF50',
            warning: '#FFC107',
            error: '#F44336'
        };

        const msg = document.createElement('div');
        msg.id = 'mp-message';
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        msg.textContent = text;

        document.body.appendChild(msg);

        // Enregistrer dans le ScreenManager
        window.screenManager.registerOverlay('mp-message');

        setTimeout(() => {
            if (msg && msg.parentNode) {
                msg.remove();
            }
        }, 3000);
    }

    /**
     * Mettre à jour l'affichage du lobby
     */
    updateLobby(data) {
        logger.log('🔄 Mise à jour lobby:', data);

        // Room ID
        const roomIdSpan = document.getElementById('lobby-room-id');
        if (roomIdSpan) {
            roomIdSpan.textContent = data.roomId.substring(0, 8) + '...';
        }

        // Player count
        const countSpan = document.getElementById('lobby-player-count');
        if (countSpan) {
            countSpan.textContent = `${data.playerCount}/2`;
        }

        // Mon pseudo
        const mySlot = document.getElementById(`lobby-player${data.myNumber}-name`);
        if (mySlot) {
            const pseudo = window.getValidPseudo ? window.getValidPseudo() : null;
            mySlot.textContent = pseudo || `Joueur ${data.myNumber}`;
        }

        const myStatus = document.getElementById(`lobby-player${data.myNumber}-status`);
        if (myStatus) {
            myStatus.textContent = '✅ Connecté';
        }

        // ✅ FIX BUG REJOUER: Réinitialiser le bouton PRÊT
        const btnReady = document.getElementById('btn-ready');
        if (btnReady) {
            btnReady.disabled = false;
            btnReady.textContent = '✅ PRÊT';
            btnReady.style.opacity = '1';
            logger.log('✅ Bouton PRÊT réinitialisé');
        }

        // Message
        const messageDiv = document.getElementById('lobby-message');
        if (messageDiv) {
            if (data.playerCount === 1) {
                messageDiv.textContent = '⏳ En attente d\'un adversaire...';
            } else {
                messageDiv.textContent = '✅ Adversaire trouvé ! Préparez-vous...';
            }
        }
    }

    /**
     * Mettre à jour les infos d'un joueur dans le lobby
     */
    updatePlayerInLobby(playerNumber, pseudo, status) {
        const nameElem = document.getElementById(`lobby-player${playerNumber}-name`);
        const statusElem = document.getElementById(`lobby-player${playerNumber}-status`);

        if (nameElem) {
            nameElem.textContent = pseudo || `Joueur ${playerNumber}`;
        }

        if (statusElem) {
            statusElem.textContent = status || '✅ Connecté';
        }
    }

    /**
     * Afficher le countdown avec un nombre (AAA Style)
     */
    showCountdown(number) {
        const overlay = document.getElementById('countdown-overlay');
        const numberElem = document.getElementById('countdown-number');
        const labelElem = overlay?.querySelector('.countdown-label');
        const progressCircle = overlay?.querySelector('.countdown-circle-progress');

        if (!overlay || !numberElem) return;

        // Nettoyer le canvas au début du countdown (nombre = 5)
        if (number === 5 && window.multiGame) {
            window.multiGame.clearCanvas();
        }

        // Afficher l'overlay et reset les classes
        overlay.classList.remove('hidden', 'go');
        numberElem.classList.remove('go');

        // Mettre à jour le label
        if (labelElem) {
            labelElem.textContent = 'PRÉPAREZ-VOUS';
            labelElem.classList.remove('go');
        }

        // Mettre à jour le nombre
        numberElem.textContent = number;

        // Animer le cercle de progression (5 → 1 = 100% → 20%)
        if (progressCircle) {
            const progress = (5 - number) / 5;
            const circumference = 283; // 2 * PI * 45
            progressCircle.style.strokeDashoffset = circumference * (1 - progress);
        }

        // Réinitialiser l'animation du nombre
        numberElem.style.animation = 'none';
        setTimeout(() => {
            numberElem.style.animation = 'countdownNumberPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        }, 10);
    }

    /**
     * Afficher "GO!" puis cacher le countdown (AAA Style)
     */
    showCountdownGo() {
        const overlay = document.getElementById('countdown-overlay');
        const numberElem = document.getElementById('countdown-number');
        const labelElem = overlay?.querySelector('.countdown-label');
        const progressCircle = overlay?.querySelector('.countdown-circle-progress');

        if (!overlay || !numberElem) return;

        // Ajouter classe "go" pour le style vert
        overlay.classList.add('go');
        numberElem.classList.add('go');

        // Mettre à jour le label
        if (labelElem) {
            labelElem.textContent = 'C\'EST PARTI !';
            labelElem.classList.add('go');
        }

        // Cercle complet
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = 0;
        }

        // Afficher "GO!"
        numberElem.textContent = 'GO!';

        // Réinitialiser l'animation
        numberElem.style.animation = 'none';
        setTimeout(() => {
            numberElem.style.animation = 'countdownGoPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        }, 10);

        // Lancer la musique du jeu
        if (window.audioManager) {
            window.audioManager.setAudio('game-multi');
        } else {
            logger.warn('⚠️ AudioManager introuvable pour lancer la musique');
        }

        // Cacher après 1 seconde
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('go');
        }, 1000);
    }
}

// ============================================
// PSEUDO MANAGEMENT
// ============================================

/**
 * Valide un pseudo selon les règles:
 * - 3 à 12 caractères
 * - Lettres, chiffres, _ et - uniquement
 */
function validatePseudo(pseudo) {
    const trimmed = pseudo.trim();

    // Vérifier longueur
    if (trimmed.length < 3) {
        return { valid: false, error: 'Le pseudo doit contenir au moins 3 caractères' };
    }
    if (trimmed.length > 12) {
        return { valid: false, error: 'Le pseudo ne peut pas dépasser 12 caractères' };
    }

    // Vérifier caractères autorisés
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(trimmed)) {
        return { valid: false, error: 'Caractères autorisés: lettres, chiffres, _ et -' };
    }

    return { valid: true, pseudo: trimmed };
}

// ⚠️ loadSavedPseudo() et savePseudo() ont été déplacés dans navigation.js
// Les nouvelles versions gèrent l'affichage des 2 vues (pseudo existant / saisie pseudo)
// et utilisent la clé 'snakeultra_pseudo' au lieu de 'playerPseudo'

/**
 * Affiche un message d'erreur pour le pseudo
 */
function showPseudoError(message) {
    const errorElement = document.getElementById('pseudo-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // Masquer après 3 secondes
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
}

/**
 * Initialise les événements pour l'input pseudo
 */
function initPseudoInput() {
    const input = document.getElementById('pseudo-input');
    if (!input) return;

    // Charger le pseudo sauvegardé (avec migration des anciennes clés)
    let savedPseudo = localStorage.getItem('snakeultra_pseudo');
    if (!savedPseudo) {
        savedPseudo = localStorage.getItem('playerPseudo') || localStorage.getItem('snakeUltraPseudo');
        if (savedPseudo) {
            localStorage.setItem('snakeultra_pseudo', savedPseudo);
        }
    }
    if (savedPseudo) {
        input.value = savedPseudo;
        logger.log('✅ Pseudo chargé:', savedPseudo);
    }

    // Validation en temps réel
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        const result = validatePseudo(value);

        if (value.length > 0 && !result.valid) {
            showPseudoError(result.error);
        } else {
            const errorElement = document.getElementById('pseudo-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    });

    // Sauvegarder à la validation (blur)
    input.addEventListener('blur', (e) => {
        const value = e.target.value.trim();
        if (value.length > 0) {
            const result = validatePseudo(value);
            if (result.valid) {
                // Sauvegarder dans toutes les clés pour compatibilité
                localStorage.setItem('snakeultra_pseudo', result.pseudo);
                localStorage.setItem('playerPseudo', result.pseudo);
                localStorage.setItem('snakeUltraPseudo', result.pseudo);
                input.value = result.pseudo; // Normaliser (trim)
                logger.log('💾 Pseudo sauvegardé:', result.pseudo);
            }
        }
    });

    logger.log('✅ Input pseudo initialisé');
}

/**
 * Récupère le pseudo valide ou null
 */
function getValidPseudo() {
    const input = document.getElementById('pseudo-input');
    if (!input) return null;

    const pseudo = input.value.trim();
    const result = validatePseudo(pseudo);

    if (!result.valid) {
        showPseudoError(result.error || 'Pseudo invalide');
        return null;
    }

    return result.pseudo;
}

// ============================================
// EXPORT
// ============================================

window.MultiplayerClient = MultiplayerClient;
window.validatePseudo = validatePseudo;
// window.loadSavedPseudo et window.savePseudo sont définis dans navigation.js
window.initPseudoInput = initPseudoInput;
window.getValidPseudo = getValidPseudo;

logger.log('✅ MultiplayerClient chargé');