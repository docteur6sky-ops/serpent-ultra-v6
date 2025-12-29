# Snake Ultra - API WebSocket

Documentation de l'API WebSocket pour le mode multijoueur.

## Configuration

- **Port** : 3000 (configurable via `PORT` env)
- **Protocol** : WebSocket natif (`ws://`)
- **Format** : JSON

## Architecture

```
Client ──────── WebSocket ──────── Serveur
           JSON messages          Node.js + ws
```

---

## Events Client → Serveur

### Lobby & Salles

| Event | Payload | Description |
|-------|---------|-------------|
| `ping` | `{}` | Keep-alive, retourne `pong` |
| `list_rooms` | `{}` | Demande liste des salles publiques |
| `create_room` | `{ name, isPublic, code?, maxPlayers? }` | Créer une nouvelle salle |
| `join_room` | `{ roomId }` ou `{ code }` | Rejoindre une salle par ID ou code |
| `quick_play` | `{}` | Matchmaking rapide |
| `set_pseudo` | `{ pseudo }` | Définir le pseudo du joueur |
| `player_ready` | `{}` | Signaler que le joueur est prêt |
| `player_abandon` | `{}` | Quitter la partie en cours |

### Gameplay

| Event | Payload | Description |
|-------|---------|-------------|
| `input` | `{ direction }` | Changer direction (`up`, `down`, `left`, `right`) |
| `use_item` | `{}` | Utiliser l'item stocké (power-up ou épée) |
| `boost` | `{}` | Activer le boost de vitesse (cooldown: 10s) |

---

## Events Serveur → Client

### Connexion

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ playerId }` | Connexion établie |
| `lobby_ready` | `{}` | Prêt à recevoir commandes lobby |
| `pong` | `{}` | Réponse au ping |

### Lobby

| Event | Payload | Description |
|-------|---------|-------------|
| `room_list` | `{ rooms: Room[] }` | Liste des salles disponibles |
| `room_created` | `{ roomId, room }` | Salle créée avec succès |
| `room_joined` | `{ roomId, room, playerNumber }` | Salle rejointe |
| `join_error` | `{ message }` | Erreur de connexion salle |
| `room_full` | `{ message }` | Salle pleine |
| `room_closed` | `{ reason }` | Salle fermée |

### Pseudos

| Event | Payload | Description |
|-------|---------|-------------|
| `pseudo_response` | `{ success, pseudo, oldPseudo? }` | Résultat définition pseudo |
| `pseudo_taken` | `{ message }` | Pseudo déjà utilisé |
| `pseudo_updated` | `{ playerId, pseudo }` | Notification changement pseudo |

### Pré-partie

| Event | Payload | Description |
|-------|---------|-------------|
| `lobby_update` | `{ players, allReady }` | État du lobby (joueurs/ready) |
| `game_starting` | `{}` | Countdown commence |
| `countdown_tick` | `{ count }` | Tick du countdown (3, 2, 1) |
| `countdown_go` | `{}` | GO! Partie démarre |
| `player_left` | `{ playerId, playerNumber, reason }` | Joueur parti |

### Gameplay

| Event | Payload | Description |
|-------|---------|-------------|
| `game_start` | `{ gameState }` | Partie initialisée |
| `game_update` | `{ gameState }` | État du jeu (tick) |
| `game_over` | `{ reason, winner, scores, players, message }` | Fin de partie |

### Items & Power-ups

| Event | Payload | Description |
|-------|---------|-------------|
| `mystery_box_collected` | `{ item, isWeapon }` | Mystery box ramassée |
| `item_used` | `{ item }` | Item utilisé |
| `sword_activated` | `{ charge, duration, endTime }` | Épée dégainée |
| `sword_hit_success` | `{ segmentsStolen }` | Touche épée réussie |
| `sword_damage` | `{ damager, segmentsLost }` | Dégâts subis |
| `boost_activated` | `{ endTime, cooldownEnd }` | Boost activé |

### Abandons

| Event | Payload | Description |
|-------|---------|-------------|
| `abandon_confirmed` | `{}` | Abandon confirmé |
| `opponent_abandoned` | `{ playerNumber }` | Adversaire a abandonné |
| `kicked` | `{ reason }` | Expulsé de la salle |
| `opponent_kicked` | `{ playerNumber }` | Adversaire expulsé |

---

## Structures de Données

### Room
```javascript
{
  id: string,           // ID unique salle
  name: string,         // Nom affiché
  isPublic: boolean,    // Visible dans la liste
  code: string | null,  // Code privé (si privée)
  playerCount: number,  // Joueurs actuels
  maxPlayers: number,   // Capacité max (2)
  gameStarted: boolean  // Partie en cours
}
```

### GameState
```javascript
{
  food: { x, y },                    // Position nourriture
  mysteryBox: { x, y } | null,       // Position mystery box
  scores: { [playerId]: number },    // Scores
  segments: { [playerId]: number },  // Longueurs serpents
  matchTimeRemaining: number,        // Temps restant (ms)
  players: {
    [playerId]: {
      number: 1 | 2,                 // Numéro joueur
      pseudo: string,
      snake: Segment[],              // Corps du serpent
      alive: boolean,
      score: number,
      activePowerup: string | null,  // Power-up actif
      powerupEndTime: number,        // Fin power-up (timestamp)
      storedItem: string | null,     // Item en inventaire
      frozen: boolean,               // Gelé par ICE
      hasSword: boolean,             // Épée active
      swordCharge: number,           // Charge épée (0-3)
      boostActive: boolean,          // Boost vitesse actif
      invincible: boolean            // Invincibilité temporaire
    }
  }
}
```

### Power-up Types
| ID | Symbole | Durée | Effet |
|----|---------|-------|-------|
| `fire` | 🔥 | 5s | Vitesse x2 |
| `ice` | ❄️ | 8s | Gèle l'adversaire |
| `ghost` | 👻 | 6s | Traverse les murs |
| `rock` | 🪨 | 8s | Invincibilité |
| `lightning` | ⚡ | 6s | Vitesse x2 + contrôles inversés |

### Game Over Reasons
| Reason | Description |
|--------|-------------|
| `death` | Un joueur est mort |
| `time_up` | Temps écoulé (5 min) |
| `abandoned` | Adversaire a abandonné |
| `disconnected` | Adversaire déconnecté |

---

## Exemple de Connexion

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connecté');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'connected':
      // Connexion réussie
      ws.send(JSON.stringify({ type: 'set_pseudo', pseudo: 'Player1' }));
      break;

    case 'lobby_ready':
      // Demander la liste des salles
      ws.send(JSON.stringify({ type: 'list_rooms' }));
      break;

    case 'room_list':
      // Afficher les salles
      console.log('Salles:', message.rooms);
      break;

    case 'game_update':
      // Mettre à jour l'affichage
      renderGame(message.gameState);
      break;
  }
};

// Envoyer une direction
function move(direction) {
  ws.send(JSON.stringify({ type: 'input', direction }));
}
```

---

## Configuration Serveur

```javascript
const CONFIG = {
  PORT: 3000,
  GRID_SIZE: 30,
  BASE_TICK_RATE: 175,      // ms entre chaque tick
  BOOST_DURATION: 3000,      // Durée boost (3s)
  BOOST_COOLDOWN: 10000,     // Cooldown boost (10s)
  FREEZE_DURATION: 3000,     // Durée gel ICE (3s)
  SWORD_DURATION: 6000,      // Durée épée (6s)
  MATCH_DURATION: 300000,    // Durée match (5 min)
  MAX_PLAYERS_PER_ROOM: 2,
  MAX_SNAKE_LENGTH: 15
};
```
