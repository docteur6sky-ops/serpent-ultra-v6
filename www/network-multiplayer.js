// ============================================
// 🎮 CLIENT MULTIJOUEUR SNAKE ULTRA - V5 FINAL
// Avec tableau J1 | Timer | J2 et écran calé
// ============================================

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
        return 'ws://localhost:8080';
    }

    connect(customUrl = null) {
        if (this.connected) {
            console.log('✅ Déjà connecté');
            return;
        }

        const url = customUrl || this.serverUrl;
        console.log(`🔌 Connexion: ${url}`);
        
        this.showMessage('Connexion...', 'info');

        try {
            this.ws = new WebSocket(url);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showMessage('Impossible de se connecter', 'error');
            if (this.onError) this.onError(error);
        }
    }

    setupWebSocketHandlers() {
        this.ws.onopen = () => {
            console.log('✅ Connecté');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.showMessage('Recherche adversaire...', 'success');
            this.startPing();
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('❌ Erreur parsing:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('❌ Erreur WebSocket:', error);
            this.showMessage('Erreur de connexion', 'error');
            if (this.onError) this.onError(error);
        };

        this.ws.onclose = () => {
            console.log('❌ Connexion fermée');
            this.connected = false;
            this.stopPing();

            // Si kické, ne pas reconnecter
            if (this.wasKicked) {
                console.log('🚫 Reconnexion désactivée (kické)');
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
                console.log(`🆔 ID: ${this.playerId}`);
                if (this.onConnected) this.onConnected(message);
                break;

            case 'room_joined':
                this.roomId = message.roomId;
                this.playerNumber = message.playerNumber;

                // Afficher le lobby
                if (window.screenManager) {
                    window.screenManager.show('lobby-screen');
                } else {
                    console.error('❌ ScreenManager introuvable!');
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
                console.log('🎮 Transition vers le jeu...');

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
                console.log('🎮 Démarrage');
                this.gameActive = true;
                if (this.onGameStart) this.onGameStart(message);
                break;

            case 'game_update':
                if (this.onGameUpdate) this.onGameUpdate(message.gameState);
                break;

            case 'game_over':
                console.log('🏁 Fin');
                this.gameActive = false;
                this.showMessage(message.message, 'info');
                if (this.onGameOver) this.onGameOver(message);
                break;

            case 'player_left':
                this.showMessage(message.message, 'warning');
                if (this.onPlayerLeft) this.onPlayerLeft(message);
                break;

            case 'pseudo_updated':
                console.log(`👤 Pseudo mis à jour: ${message.playerId} → "${message.pseudo}"`);
                // Le pseudo sera automatiquement affiché via le gameState
                break;

            case 'pseudo_taken':
                console.error('❌ Pseudo déjà pris dans cette salle');

                // Afficher dans l'input d'erreur
                const errorSpan = document.getElementById('pseudo-error');
                if (errorSpan) {
                    errorSpan.textContent = '⚠️ ' + (message.error || 'Ce pseudo est déjà pris dans cette salle');
                    errorSpan.style.display = 'block';
                }

                // Notification visible
                alert('⚠️ Ce pseudo est déjà pris dans cette salle. Veuillez en choisir un autre.');

                // Déconnecter proprement
                this.disconnect();

                // Retourner au menu multijoueur
                if (window.screenManager) {
                    window.screenManager.show('multiplayer-menu');
                }
                break;

            case 'pseudo_response':
                if (message.success) {
                    console.log(`✅ Pseudo accepté: "${message.pseudo}"`);
                } else {
                    console.warn(`⚠️ Pseudo refusé: ${message.error}`);
                    this.showMessage(message.error, 'error');
                }
                break;

            case 'lobby_update':
                console.log('🔄 Lobby update:', message);

                message.players.forEach(player => {
                    this.updatePlayerInLobby(
                        player.number,
                        player.pseudo,
                        player.ready ? '✅ PRÊT' : '⏳ En attente...'
                    );
                });

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
                console.error('⚠️  Erreur:', message.message);
                this.showMessage(message.message, 'error');
                break;

            case 'pong':
                break;

            case 'kicked':
                console.error('🚨 EXPULSÉ:', message.reason);

                // Marquer comme kické pour éviter la reconnexion
                this.wasKicked = true;

                // Afficher message
                alert(`⚠️ EXPULSÉ\n\nRaison: ${message.reason}\n\nVous avez été expulsé pour comportement suspect.\nSi vous pensez qu'il s'agit d'une erreur, contactez le support.`);

                // Déconnecter SANS reconnexion
                this.disconnect();

                // Retour au menu
                if (window.screenManager) {
                    window.screenManager.show('menu');
                }
                break;

            case 'opponent_kicked':
                console.log('🎉 VICTOIRE - Adversaire expulsé');

                // Afficher message de victoire
                alert(`🎉 VICTOIRE !\n\nVotre adversaire a été expulsé pour triche.\n\n+${message.bonusPoints || 500} points bonus !`);

                // Déconnecter proprement
                this.disconnect();

                // Retour au menu
                if (window.screenManager) {
                    window.screenManager.show('menu');
                }
                break;

            default:
                console.log('📨 Message:', message);
        }
    }

    sendInput(direction) {
        console.log(`📡 MultiplayerClient.sendInput()`, {
            direction,
            connected: this.connected,
            wsReady: this.ws?.readyState === WebSocket.OPEN
        });

        if (!this.connected || !this.ws) {
            console.log('   ❌ Envoi bloqué: client non connecté ou ws null');
            return;
        }

        const message = {
            type: 'input',
            direction: direction
        };
        console.log('   ✅ Envoi message WebSocket:', message);
        this.ws.send(JSON.stringify(message));
    }

    sendReady() {
        if (!this.connected || !this.ws) return;
        console.log('✅ Prêt');
        this.ws.send(JSON.stringify({ type: 'ready' }));
    }

    sendPseudo(pseudo) {
        if (!this.connected || !this.ws) {
            console.warn('⚠️ Impossible d\'envoyer le pseudo: non connecté');
            return;
        }
        console.log(`👤 Envoi pseudo: "${pseudo}"`);
        this.ws.send(JSON.stringify({
            type: 'set_pseudo',
            pseudo: pseudo
        }));
    }

    startPing() {
        this.pingInterval = setInterval(() => {
            if (this.connected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
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

        this.reconnectAttempts++;
        console.log(`🔄 Reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => this.connect(), 2000);
    }

    disconnect() {
        console.log('🔌 Déconnexion du serveur');

        this.connected = false;
        this.gameActive = false;

        // Arrêter le ping
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        this.stopPing();

        // Fermer le WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.playerId = null;
        this.playerNumber = null;
        this.roomId = null;
    }

    showMessage(text, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${text}`);
        
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
        console.log('🔄 Mise à jour lobby:', data);

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
     * Afficher le countdown avec un nombre
     */
    showCountdown(number) {
        const overlay = document.getElementById('countdown-overlay');
        const numberElem = document.getElementById('countdown-number');

        if (!overlay || !numberElem) return;

        // Afficher l'overlay
        overlay.classList.remove('hidden');

        // Mettre à jour le nombre
        numberElem.textContent = number;
        numberElem.classList.remove('go');

        // Réinitialiser l'animation
        numberElem.style.animation = 'none';
        setTimeout(() => {
            numberElem.style.animation = 'countdownPulse 1s ease-in-out';
        }, 10);

        // Enregistrer l'overlay dans le ScreenManager
        if (window.screenManager) {
            window.screenManager.registerOverlay('countdown-overlay');
        }
    }

    /**
     * Afficher "GO!" puis cacher le countdown
     */
    showCountdownGo() {
        const overlay = document.getElementById('countdown-overlay');
        const numberElem = document.getElementById('countdown-number');

        if (!overlay || !numberElem) return;

        // Afficher "GO!" avec style spécial
        numberElem.textContent = 'GO!';
        numberElem.classList.add('go');

        // Réinitialiser l'animation
        numberElem.style.animation = 'none';
        setTimeout(() => {
            numberElem.style.animation = 'countdownPulse 1s ease-in-out';
        }, 10);

        // Lancer la musique du jeu
        if (window.audioManager) {
            window.audioManager.setAudio('game-multi');
        } else {
            console.warn('⚠️ AudioManager introuvable pour lancer la musique');
        }

        // Cacher après 1 seconde
        setTimeout(() => {
            overlay.classList.add('hidden');
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

/**
 * Charge le pseudo sauvegardé depuis localStorage
 */
function loadSavedPseudo() {
    const saved = localStorage.getItem('playerPseudo');
    if (saved) {
        const input = document.getElementById('pseudo-input');
        if (input) {
            input.value = saved;
            console.log('✅ Pseudo chargé:', saved);
        }
    }
    return saved;
}

/**
 * Sauvegarde le pseudo dans localStorage
 */
function savePseudo(pseudo) {
    localStorage.setItem('playerPseudo', pseudo);
    console.log('💾 Pseudo sauvegardé:', pseudo);
}

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

    // Charger le pseudo sauvegardé
    loadSavedPseudo();

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
                savePseudo(result.pseudo);
                input.value = result.pseudo; // Normaliser (trim)
            }
        }
    });

    console.log('✅ Input pseudo initialisé');
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
window.loadSavedPseudo = loadSavedPseudo;
window.savePseudo = savePseudo;
window.initPseudoInput = initPseudoInput;
window.getValidPseudo = getValidPseudo;

console.log('✅ MultiplayerClient chargé');