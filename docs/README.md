# Snake Ultra - Deluxe Edition

Jeu de Snake multijoueur en temps réel avec architecture modulaire moderne.

## Caractéristiques

- **Mode Solo** : 3 niveaux de difficulté (Facile, Normal, Difficile)
- **Mode Multi Local** : 2 joueurs sur le même appareil
- **Mode Multi Online** : Matchmaking en temps réel via WebSocket
- **Power-ups** : Slow, Fast, Invincible, Ghost
- **Système de Carrière** : Top 3, statistiques, trophées
- **Architecture Modulaire** : Code réutilisable et maintenable
- **Tests Automatisés** : 109 tests unitaires (Jest)

## Technologies

### Frontend
- **JavaScript ES6+** (Modules)
- **Canvas API** pour le rendu
- **WebSocket** (Socket.IO Client)
- **LocalStorage** pour la persistance

### Backend
- **Node.js** + **Express**
- **Socket.IO** pour le temps réel
- **Système de validation** anti-triche

### Tests & Build
- **Jest** avec jsdom
- **Babel** pour transpilation
- **Vite** pour le bundling (optionnel)

## Installation

```bash
# Cloner le repository
git clone <url>

# Installer les dépendances
cd snake-mobile-audit
npm install
```

## Démarrage

### Mode Développement

```bash
npm run dev
```

Ouvre ton navigateur sur `http://localhost:8080`

### Tests

```bash
# Tous les tests
npm test

# Tests client uniquement
npm test -- --config=jest.config.client.js

# Mode watch
npm test -- --watch
```

## Structure du Projet

```
snake-ultra/
├── www/                      # Frontend
│   ├── config/              # Configuration
│   │   └── constants.js     # Constantes (GRID_SIZE, COLORS, etc.)
│   ├── core/                # Classes de base
│   │   └── BaseSnakeGame.js # Classe abstraite pour modes de jeu
│   ├── managers/            # Gestionnaires
│   │   └── EventManager.js  # Gestion centralisée des événements
│   ├── services/            # Services
│   │   ├── logger.js        # Logging conditionnel
│   │   ├── audio.js         # Gestion audio
│   │   ├── storage.js       # LocalStorage
│   │   └── trophies.js      # Système de trophées
│   ├── utils/               # Utilitaires
│   │   └── dom-utils.js     # Helpers pour DOM
│   ├── solo-game.js         # Mode Solo (extends BaseSnakeGame)
│   ├── multi-game.js        # Mode Multi Local
│   ├── network-multiplayer.js # Mode Online
│   ├── navigation.js        # Navigation entre écrans
│   └── main.js              # Point d'entrée
├── server/                  # Backend
│   ├── Room.js              # Gestion des salles
│   ├── SnakeServer.js       # Logique du jeu
│   └── SecurityValidator.js # Anti-triche
├── tests/                   # Tests
│   ├── unit-client/         # Tests frontend
│   └── unit/                # Tests backend
├── server.js                # Serveur principal
├── ARCHITECTURE.md          # Documentation architecture
└── API.md                   # Documentation API
```

## Architecture

### Hiérarchie des Classes

```
BaseSnakeGame (abstract)
└── SoloSnakeGame

EventManager (singleton)
```

### Modules Clés

#### 1. BaseSnakeGame

Classe abstraite fournissant la logique commune :
- Gestion du canvas
- Boucle de jeu (60 FPS)
- Système de particules
- Calcul de vitesse
- Méthodes utilitaires

**Méthodes abstraites à implémenter** :
- `reset()` : Initialiser le jeu
- `update()` : Logique de jeu
- `draw()` : Rendu visuel

**Exemple** :

```javascript
import { BaseSnakeGame } from './core/BaseSnakeGame.js';

class MyGame extends BaseSnakeGame {
  constructor() {
    super('my-canvas');
  }

  reset() {
    // Initialiser le serpent, etc.
  }

  update() {
    // Déplacer le serpent, vérifier collisions
  }

  draw() {
    // Dessiner le jeu
  }
}

const game = new MyGame();
game.start(0); // Difficulté Facile
```

#### 2. EventManager

Gestionnaire centralisé d'événements avec cleanup automatique.

**Avantages** :
- Prévention des memory leaks
- Tracking de tous les listeners
- Debug facilité

**Exemple** :

```javascript
import { eventManager } from './managers/EventManager.js';

// Ajouter un listener
const id = eventManager.add(button, 'click', handleClick);

// Retirer par ID
eventManager.remove(id);

// Cleanup complet (important!)
eventManager.cleanup();
```

#### 3. Logger Service

Logging conditionnel selon l'environnement.

**Exemple** :

```javascript
import { logger } from './services/logger.js';

logger.log('Info');       // DEV only
logger.warn('Warning');   // DEV only
logger.error('Error');    // Always logged
logger.debug('Debug');    // DEV only
```

#### 4. DOM Utils

Helpers pour manipulation DOM sécurisée.

**Exemple** :

```javascript
import { getElement, addClass, hide } from './utils/dom-utils.js';

const canvas = getElement('canvas-solo');
addClass(canvas, 'active');
hide('loading-screen');
```

## Modes de Jeu

### Solo

3 niveaux de difficulté :
- **Facile** : Vitesse lente, progression douce
- **Normal** : Vitesse moyenne
- **Difficile** : Vitesse rapide, obstacles aléatoires

**Contrôles** :
- Clavier : Flèches directionnelles
- Mobile : Touch controls

### Multi Local

2 joueurs sur le même appareil.

**Contrôles** :
- Joueur 1 : WASD
- Joueur 2 : Flèches

### Multi Online

Matchmaking automatique via WebSocket.

**Fonctionnalités** :
- Salles de 2 joueurs max
- État synchronisé en temps réel
- Système de power-ups
- Anti-triche côté serveur

## Power-ups

| Icon | Nom | Effet |
|------|-----|-------|
| ⏱️ | Slow | Ralentit le serpent |
| ⚡ | Fast | Accélère le serpent |
| 🛡️ | Invincible | Immunité temporaire |
| 👻 | Ghost | Traverse les obstacles |

## Système de Carrière

### Top 3

Les 3 meilleurs scores par difficulté et mode.

### Statistiques

- Parties jouées
- Score total
- Score moyen
- Meilleur score
- Trophées débloqués

### Trophées

- **Première Partie** : Jouer une partie
- **Gourmand** : Manger 100 nourritures
- **Survivant** : Survivre 5 minutes
- **Perfectionniste** : Score > 1000
- Et plus...

## Tests

### Couverture

109 tests unitaires :
- `logger.test.js` : 12 tests
- `dom-utils.test.js` : 28 tests
- `EventManager.test.js` : 35 tests
- `BaseSnakeGame.test.js` : 25 tests
- `solo-game.test.js` : 9 tests

### Exécuter les Tests

```bash
# Tous les tests
npm test

# Tests spécifiques
npm test -- logger.test

# Coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Développement

### Créer un Nouveau Mode de Jeu

```javascript
// 1. Créer une classe qui étend BaseSnakeGame
import { BaseSnakeGame } from './core/BaseSnakeGame.js';

class NewMode extends BaseSnakeGame {
  constructor() {
    super('canvas-new');
    // Propriétés spécifiques
  }

  reset() {
    // Initialiser l'état
  }

  update() {
    // Logique de mise à jour
  }

  draw() {
    // Rendu visuel
    this.drawParticles(); // Particules héritées
  }
}

// 2. Créer le canvas dans index.html
<canvas id="canvas-new" width="360" height="360"></canvas>

// 3. Utiliser
const game = new NewMode();
game.start(0);
```

### Ajouter un Service

```javascript
// services/my-service.js
export const myService = {
  doSomething() {
    // ...
  }
};

// Utilisation
import { myService } from './services/my-service.js';
myService.doSomething();
```

### Guidelines

- **ES6 Modules** : Toujours utiliser `import/export`
- **Const/Let** : Jamais `var`
- **Arrow Functions** : Préférer pour callbacks
- **Logging** : Utiliser `logger` au lieu de `console`
- **Events** : Utiliser `eventManager` pour éviter memory leaks
- **Tests** : Écrire tests pour nouveaux modules

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** : Architecture détaillée
- **[API.md](./API.md)** : Documentation API complète
- **[REFACTORING-PLAN-ADAPTED.md](./REFACTORING-PLAN-ADAPTED.md)** : Plan de refactoring

## Roadmap

### Phase 2 (✅ Complété)

- ✅ Refactoring architecture modulaire
- ✅ Classe abstraite `BaseSnakeGame`
- ✅ `EventManager` pour gestion des événements
- ✅ Service `logger` conditionnel
- ✅ Utilitaires DOM
- ✅ Tests unitaires complets (109 tests)
- ✅ Documentation (ARCHITECTURE.md, API.md)

### Phase 3 (Prévue)

- CI/CD Pipeline (GitHub Actions)
- Tests E2E avec Playwright
- Coverage > 90%

### Phase 4 (Future)

- Refactoring `multi-game.js` (héritage BaseSnakeGame)
- Nouveaux modes de jeu
- Progressive Web App (PWA)
- Leaderboard global (backend)
- Replay système

## Performance

### Optimisations

- **RequestAnimationFrame** : 60 FPS natif
- **Particules limitées** : Nettoyage automatique
- **Event Cleanup** : Prévention memory leaks
- **Canvas rendering** : Double buffering

### Profiling

```javascript
// Debug EventManager
console.log(eventManager.getStats());
// { targets: 5, totalListeners: 12, byType: { click: 8, ... } }

// Debug depuis la console
window.__eventManager.getStats();
```

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Add: ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

### Conventions

- **Commits** : `Type: description`
  - `feat:` Nouvelle fonctionnalité
  - `fix:` Correction de bug
  - `refactor:` Refactoring
  - `docs:` Documentation
  - `test:` Tests

- **Code Style** :
  - Indentation : 2 espaces
  - Strings : Single quotes (`'string'`)
  - Semicolons : Oui

## Licence

MIT License - Voir [LICENSE](./LICENSE) pour détails.

## Auteur

Snake Ultra - Deluxe Edition

## Remerciements

- Socket.IO pour le temps réel
- Jest pour les tests
- Canvas API pour le rendu

---

**Version** : 2.0.0
**Dernière mise à jour** : 2025-11-18
