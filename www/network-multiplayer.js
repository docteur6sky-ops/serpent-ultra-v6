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
                console.log(`🏠 Salle ${this.roomId} (J${this.playerNumber})`);
                this.showMessage(`Joueur ${this.playerNumber}`, 'info');
                
                if (message.playersInRoom === 2) {
                    this.showMessage('Adversaire trouvé !', 'success');
                }
                
                if (this.onRoomJoined) this.onRoomJoined(message);
                break;

            case 'room_full':
                this.showMessage(message.message, 'success');
                if (this.onRoomFull) this.onRoomFull(message);
                break;

            case 'game_start':
                console.log('🎮 Démarrage');
                this.gameActive = true;
                this.showMessage('GO !', 'success');
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

            case 'error':
                console.error('⚠️  Erreur:', message.message);
                this.showMessage(message.message, 'error');
                break;

            case 'pong':
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
}

// ============================================
// EXPORT
// ============================================

window.MultiplayerClient = MultiplayerClient;
console.log('✅ MultiplayerClient chargé');