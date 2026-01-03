// ============================================
// LOBBY PRINCIPAL - Gestion de la liste des salons
// ============================================

import { logger } from './services/logger.js';

// ✅ FIX: Fonction d'échappement HTML pour éviter les injections XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 🎖️ GRADE - Obtenir le grade du joueur pour le serveur
function getPlayerGrade() {
    const multiWins = window.career?.multiWins || 0;

    // Mapping victoires → grade (correspond à GradeManager.js)
    if (multiWins >= 60) return 'LEGEND';
    if (multiWins >= 50) return 'PLATINUM';
    if (multiWins >= 40) return 'ELITE';
    if (multiWins >= 30) return 'CHAMPION';
    if (multiWins >= 20) return 'GOLD';
    if (multiWins >= 10) return 'SILVER';
    return 'BRONZE';
}

class MainLobby {
    constructor() {
        this.roomsList = [];
        this.client = null; // Sera assigné depuis l'extérieur
    }

    /**
     * Afficher l'écran du lobby principal
     */
    show() {
        if (window.screenManager) {
            window.screenManager.show('main-lobby-screen');
            this.refreshRoomList();
        }
    }

    /**
     * Demander la liste des salons au serveur
     */
    refreshRoomList() {
        // Silencieux si pas encore connecté (normal au démarrage)
        if (!this.client || !this.client.ws) {
            return;
        }
        logger.log('🔄 Actualisation de la liste des salons...');

        this.client.ws.send(JSON.stringify({
            type: 'list_rooms'
        }));
    }

    /**
     * Afficher la liste des salons reçue du serveur
     */
    displayRoomList(rooms) {
        this.roomsList = rooms;
        const container = document.getElementById('rooms-list');

        if (!container) {
            logger.error('❌ Container rooms-list introuvable');
            return;
        }

        // Si aucun salon - ✅ P3: Design amélioré
        if (rooms.length === 0) {
            container.innerHTML = `
                <div class="empty-lobbies">
                    <div class="empty-icon">🏰</div>
                    <h3>Aucun salon actif</h3>
                    <p>Soyez le premier à en créer un !</p>
                </div>
            `;
            return;
        }

        // Afficher les salons (✅ FIX: escapeHtml pour éviter XSS)
        container.innerHTML = rooms.map(room => `
            <div class="room-item" onclick="window.joinRoomById('${escapeHtml(room.id)}', ${room.hasPassword})">
                <div class="room-info-item">
                    <div class="room-name">
                        ${escapeHtml(room.name)}
                        ${room.hasPassword ? '<span class="room-password-icon">🔒</span>' : ''}
                    </div>
                    <div class="room-details">
                        👥 ${room.playerCount}/${room.maxPlayers} joueurs
                    </div>
                </div>
                <button class="btn-join-room" onclick="event.stopPropagation();window.joinRoomById('${escapeHtml(room.id)}', ${room.hasPassword})">
                    REJOINDRE
                </button>
            </div>
        `).join('');

        logger.log(`✅ ${rooms.length} salon(s) affiché(s)`);
    }

    /**
     * Créer un nouveau salon
     */
    createRoom(name, isPublic = true, code = null) {
        logger.log('🏠 Création d\'un salon...', { name, isPublic, code: code ? '****' : null });

        if (!this.client || !this.client.ws) {
            logger.error('❌ Client WebSocket non disponible');
            return;
        }

        // 🎖️ Inclure le grade du joueur
        const grade = getPlayerGrade();
        logger.log(`🎖️ Grade du joueur: ${grade}`);

        this.client.ws.send(JSON.stringify({
            type: 'create_room',
            name: name,
            isPublic: isPublic,
            code: code,
            grade: grade
        }));

        // 🏠 TRACKING HOSPITALITÉ: Première création de salon
        if (window.load && window.save && window.checkTrophy) {
            let career = window.load('career', {});
            if (typeof career.roomsCreated === 'undefined') career.roomsCreated = 0;
            career.roomsCreated++;
            window.save('career', career);
            if (window.career) window.career.roomsCreated = career.roomsCreated;
            window.checkTrophy();
            logger.log(`🏠 Salons créés: ${career.roomsCreated}`);
        }
    }

    /**
     * Rejoindre un salon par ID
     */
    joinRoom(roomId, code = null) {
        logger.log('🚪 Tentative de rejoindre le salon...', { roomId });

        if (!this.client || !this.client.ws) {
            logger.error('❌ Client WebSocket non disponible');
            return;
        }

        // 🎖️ Inclure le grade du joueur
        const grade = getPlayerGrade();
        logger.log(`🎖️ Grade du joueur: ${grade}`);

        this.client.ws.send(JSON.stringify({
            type: 'join_room',
            roomId: roomId,
            code: code,
            grade: grade
        }));
    }
}

// Instance globale
const mainLobby = new MainLobby();
window.mainLobby = mainLobby;

// ============================================
// FONCTIONS GLOBALES (appelées depuis HTML)
// ============================================

/**
 * Actualiser la liste des salons
 */
window.refreshRoomList = function() {
    mainLobby.refreshRoomList();
};

/**
 * Afficher la boîte de dialogue de création de salon
 */
window.showCreateRoomDialog = function() {
    const name = prompt('🏠 Nom du salon :');
    if (!name) return;

    const isPublic = confirm('🌐 Salon public ?\n\nOui = Visible par tous\nNon = Privé avec code');

    let code = null;
    if (!isPublic) {
        code = prompt('🔒 Code du salon (laisser vide = aucun code) :');
    }

    mainLobby.createRoom(name, isPublic, code);
};

/**
 * Rejoindre un salon par ID
 */
window.joinRoomById = function(roomId, hasPassword) {
    let code = null;

    if (hasPassword) {
        code = prompt('🔒 Ce salon est protégé. Entrez le code :');
        if (!code) return; // Annulé
    }

    mainLobby.joinRoom(roomId, code);
};

/**
 * Quick Play - Rejoindre automatiquement un salon disponible
 */
window.quickPlay = function() {
    logger.log('⚡ Quick Play activé');

    if (!mainLobby.client || !mainLobby.client.ws) {
        logger.error('❌ Client WebSocket non disponible');
        return;
    }

    // 🎖️ Inclure le grade du joueur
    const grade = getPlayerGrade();
    logger.log(`🎖️ Grade du joueur: ${grade}`);

    // Envoyer la requête Quick Play au serveur
    mainLobby.client.ws.send(JSON.stringify({
        type: 'quick_play',
        grade: grade
    }));

    // Feedback visuel
    const btn = document.querySelector('.btn-quick-play');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '🔍 RECHERCHE...';
        btn.disabled = true;

        // Reset après 5 secondes (sécurité)
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 5000);
    }
};

export default mainLobby;
