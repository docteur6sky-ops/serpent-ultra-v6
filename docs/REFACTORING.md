# 🔧 REFACTORING ARCHITECTURE - Snake Ultra

## 📊 PROBLÈME IDENTIFIÉ

**server.js** actuel : **1572 lignes** ❌
- Classe `Room` seule : **1115 lignes**
- Mélange de toutes les responsabilités
- Difficile à maintenir, tester, et faire évoluer
- Non scalable pour App Store

---

## ✅ SOLUTION : ARCHITECTURE MODULAIRE

### 📁 Nouvelle Structure

```
snake-ultra/
├── src/
│   ├── config/
│   │   └── gameConfig.js          ✅ CRÉÉ - Configuration centralisée
│   │
│   ├── models/
│   │   ├── PowerUp.js             ✅ CRÉÉ - Modèle Power-Up
│   │   └── Room.js                📝 TODO - Room simplifiée (~200 lignes)
│   │
│   ├── game/
│   │   ├── GameEngine.js          ✅ CRÉÉ - Moteur de jeu principal
│   │   ├── CollisionHandler.js    ✅ CRÉÉ - Gestion collisions
│   │   └── PowerUpManager.js      ✅ CRÉÉ - Gestion power-ups
│   │
│   ├── managers/
│   │   └── RoomManager.js         📝 TODO - Gestion des salles
│   │
│   ├── routes/
│   │   └── apiRoutes.js           📝 TODO - Routes Express
│   │
│   └── websocket/
│       └── wsHandlers.js          📝 TODO - Handlers WebSocket
│
├── server.js                      📝 TODO - Nouveau serveur (~100 lignes)
├── server-old.js                  ⚠️ Backup de l'ancien serveur
└── REFACTORING.md                 📖 Ce fichier

```

---

## 📦 MODULES CRÉÉS

### ✅ 1. `src/config/gameConfig.js`
**Responsabilité** : Configuration centralisée du jeu

**Contenu** :
- `CONFIG` - Paramètres du serveur et du jeu
- `POWERUP_TYPES` - Configuration des 4 power-ups

**Lignes** : ~50

---

### ✅ 2. `src/models/PowerUp.js`
**Responsabilité** : Modèle de données pour les power-ups

**Contenu** :
- Classe `PowerUp`
- Méthodes `setPosition()`, `toJSON()`

**Lignes** : ~30

---

### ✅ 3. `src/game/CollisionHandler.js`
**Responsabilité** : Gestion de toutes les collisions

**Méthodes** :
- `detectHeadToHead()` - Collision tête-à-tête
- `handleHeadToHead()` - Résolution collision tête-à-tête
- `detectHeadToTail()` - Collision tête-queue
- `detectHeadToBody()` - Collision tête-corps
- `checkAllCollisions()` - Vérification globale

**Lignes** : ~180

**TODO** :
- Implémenter logique complète de résolution des collisions
- Ajouter calcul des pénalités
- Gérer invincibilité temporaire

---

### ✅ 4. `src/game/PowerUpManager.js`
**Responsabilité** : Gestion des power-ups

**Méthodes** :
- `generatePowerUp()` - Générer power-up aléatoire
- `activatePowerUp()` - Activer effet power-up
- `checkPowerUpExpiration()` - Vérifier expiration
- `getPlayerTickRate()` - Obtenir vitesse joueur
- `canPhaseThrough()` - Vérifier GHOST actif
- `canDestroy()` - Vérifier ROCK actif

**Lignes** : ~170

---

### ✅ 5. `src/game/GameEngine.js`
**Responsabilité** : Moteur de jeu principal

**Méthodes** :
- `initializeGame()` - Initialiser partie
- `gameLoopTick()` - Boucle de jeu principale
- `moveAllSnakes()` - Déplacer serpents
- `checkFoodCollisions()` - Vérifier nourriture
- `checkPowerUpCollisions()` - Vérifier power-ups
- `handleCollisions()` - Gérer collisions
- `generateFood()` - Générer nourriture
- `buildGameStateUpdate()` - Construire état
- `start()`, `stop()`, `cleanup()` - Cycle de vie

**Lignes** : ~290

---

## 📝 MODULES À CRÉER

### 6. `src/models/Room.js` (TODO)
**Responsabilité** : Gestion d'une salle de jeu

**Méthodes** :
- `addPlayer()`, `removePlayer()`
- `setPlayerReady()`
- `startCountdown()`, `startGame()`, `stopGame()`
- `notifyPlayers()`, `broadcastLobbyUpdate()`

**Lignes cible** : ~200 (vs 1115 actuelles !)

**Dépendances** :
- `GameEngine` pour la logique de jeu
- `CollisionHandler` via GameEngine
- `PowerUpManager` via GameEngine

---

### 7. `src/managers/RoomManager.js` (TODO)
**Responsabilité** : Gestion de toutes les salles

**Méthodes** :
- `createRoom()`
- `findOrCreateRoom()`
- `removePlayerFromRoom()`
- `cleanupAll()`

**Lignes cible** : ~150

---

### 8. `src/routes/apiRoutes.js` (TODO)
**Responsabilité** : Routes Express HTTP

**Routes** :
- `GET /` - Page index.html
- `GET /health` - Santé du serveur
- `GET /security` - Monitoring sécurité

**Lignes cible** : ~80

---

### 9. `src/websocket/wsHandlers.js` (TODO)
**Responsabilité** : Handlers WebSocket

**Événements** :
- `connection` - Nouvelle connexion
- `join_room` - Rejoindre salle
- `set_pseudo` - Définir pseudo
- `ready` - Joueur prêt
- `change_direction` - Changer direction
- `disconnect` - Déconnexion

**Lignes cible** : ~200

---

### 10. Nouveau `server.js` (TODO)
**Responsabilité** : Orchestrateur principal

**Contenu** :
```javascript
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { CONFIG } = require('./src/config/gameConfig');
const RoomManager = require('./src/managers/RoomManager');
const apiRoutes = require('./src/routes/apiRoutes');
const wsHandlers = require('./src/websocket/wsHandlers');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const roomManager = new RoomManager();

// Routes
app.use(apiRoutes(roomManager));

// WebSocket
wsHandlers(wss, roomManager);

// Démarrage
server.listen(CONFIG.PORT, () => {
    console.log(`🚀 Serveur démarré sur port ${CONFIG.PORT}`);
});
```

**Lignes cible** : ~100 (vs 1572 actuelles !)

---

## 📈 BÉNÉFICES

### 🎯 Scalabilité
- **Avant** : 1 fichier de 1572 lignes
- **Après** : 10 modules de 30-300 lignes chacun
- **Gain** : ~85% de réduction par fichier

### 🧪 Testabilité
- **Avant** : Tests difficiles, classe Room gigantesque
- **Après** : Tests unitaires par module
- Exemple : Tester `CollisionHandler` indépendamment

### 🔧 Maintenabilité
- **Avant** : Bug dans Room = chercher dans 1115 lignes
- **Après** : Bug collisions = chercher dans CollisionHandler (180 lignes)

### 📦 Réutilisabilité
- `GameEngine` peut être réutilisé dans d'autres modes (solo, IA)
- `CollisionHandler` peut être testé et amélioré facilement
- `PowerUpManager` extensible pour nouveaux power-ups

### 🚀 App Store Ready
- Architecture professionnelle
- Code modulaire = bundle splitting possible
- Tests unitaires facilités
- Documentation claire

---

## ⚙️ PROCHAINES ÉTAPES

### 🔴 URGENT (Pour terminer refactoring)

1. **Créer `src/models/Room.js`**
   - Extraire gestion joueurs de l'ancien Room
   - Utiliser GameEngine au lieu du code dupliqué
   - Garder seulement logique de salle (ready, countdown, etc.)

2. **Créer `src/managers/RoomManager.js`**
   - Extraire de server.js actuel
   - Simplifier la gestion des salles

3. **Créer `src/routes/apiRoutes.js`**
   - Extraire routes Express
   - Ajouter middleware si nécessaire

4. **Créer `src/websocket/wsHandlers.js`**
   - Extraire handlers WebSocket
   - Utiliser RoomManager

5. **Créer nouveau `server.js`**
   - Importer tous les modules
   - Orchestrer les composants
   - Garder minimal (~100 lignes)

6. **Renommer ancien server**
   ```bash
   mv server.js server-old.js
   ```

7. **Tester**
   ```bash
   node server.js
   ```

---

## 🧪 TESTS

### Tests unitaires recommandés

```javascript
// tests/unit/CollisionHandler.test.js
describe('CollisionHandler', () => {
    it('détecte collision tête-à-tête', () => {
        // Test isolation
    });
});

// tests/unit/PowerUpManager.test.js
describe('PowerUpManager', () => {
    it('génère power-up aléatoire', () => {
        // Test isolation
    });
});

// tests/unit/GameEngine.test.js
describe('GameEngine', () => {
    it('initialise partie correctement', () => {
        // Test isolation
    });
});
```

---

## 📚 RESSOURCES

- **Architecture actuelle** : `server.js` (1572 lignes)
- **Modules créés** : `src/config/`, `src/models/`, `src/game/`
- **Documentation** : Ce fichier `REFACTORING.md`

---

## ✅ CHECKLIST

- [x] Analyser server.js
- [x] Créer structure dossiers src/
- [x] Créer gameConfig.js
- [x] Créer PowerUp.js
- [x] Créer CollisionHandler.js
- [x] Créer PowerUpManager.js
- [x] Créer GameEngine.js
- [ ] Créer Room.js
- [ ] Créer RoomManager.js
- [ ] Créer apiRoutes.js
- [ ] Créer wsHandlers.js
- [ ] Créer nouveau server.js
- [ ] Tester nouvelle architecture
- [ ] Migrer projet principal

---

**Créé par Claude Code - Audit Snake Ultra**
**Date** : 2024-11-18
