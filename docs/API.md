# API Documentation - Snake Ultra

Documentation complète de l'API des modules principaux du projet.

---

## Table des Matières

1. [Logger Service](#logger-service)
2. [EventManager](#eventmanager)
3. [DOM Utils](#dom-utils)
4. [BaseSnakeGame](#basesnakegame)
5. [Storage Service](#storage-service)
6. [Trophies Service](#trophies-service)

---

## Logger Service

Service de logging avec activation conditionnelle selon l'environnement.

### Import

```javascript
import { logger } from './services/logger.js';
```

### API

#### `logger.log(...args)`

Log d'information générale (DEV uniquement).

```javascript
logger.log('Jeu démarré');
logger.log('Score:', score, 'Niveau:', level);
```

#### `logger.warn(...args)`

Avertissement (DEV uniquement).

```javascript
logger.warn('Élément introuvable:', elementId);
```

#### `logger.error(...args)`

Erreur (TOUJOURS loggé, même en production).

```javascript
logger.error('Erreur critique:', error.message);
```

#### `logger.debug(...args)`

Debug (DEV uniquement).

```javascript
logger.debug('État du serpent:', this.snake);
```

#### `logger.group(title)`

Crée un groupe de logs.

```javascript
logger.group('Initialisation');
logger.log('Étape 1');
logger.log('Étape 2');
logger.groupEnd();
```

#### `logger.groupEnd()`

Ferme le groupe de logs actuel.

#### `logger.table(data)`

Affiche des données sous forme de tableau (DEV uniquement).

```javascript
logger.table([
  { id: 1, nom: 'Player 1', score: 100 },
  { id: 2, nom: 'Player 2', score: 150 }
]);
```

#### `logger.time(label)` / `logger.timeEnd(label)`

Mesure de performance.

```javascript
logger.time('operation');
// ... code à mesurer
logger.timeEnd('operation'); // Affiche le temps écoulé
```

### Détection d'Environnement

Le logger détecte automatiquement l'environnement :

```javascript
const IS_DEV = window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.port === '8080';
```

---

## EventManager

Gestionnaire centralisé d'événements DOM avec cleanup automatique.

### Import

```javascript
import { EventManager, eventManager } from './managers/EventManager.js';
```

### API

#### `add(target, event, handler, options = {})`

Ajoute un event listener avec tracking automatique.

**Paramètres** :
- `target` (EventTarget) : Élément cible
- `event` (string) : Type d'événement
- `handler` (Function) : Fonction callback
- `options` (Object) : Options addEventListener

**Retourne** : `number` - ID du listener

```javascript
const buttonId = eventManager.add(
  document.getElementById('btn'),
  'click',
  (e) => console.log('Clicked!'),
  { once: true }
);
```

#### `remove(id)`

Retire un listener par son ID.

**Paramètres** :
- `id` (number) : ID du listener

**Retourne** : `boolean` - true si retiré, false sinon

```javascript
eventManager.remove(buttonId);
```

#### `removeAll(target)`

Retire tous les listeners d'un élément.

**Paramètres** :
- `target` (EventTarget) : Élément cible

```javascript
eventManager.removeAll(document.getElementById('btn'));
```

#### `removeByType(eventType)`

Retire tous les listeners d'un type spécifique.

**Paramètres** :
- `eventType` (string) : Type d'événement ('click', 'keydown', etc.)

```javascript
eventManager.removeByType('click'); // Retire tous les 'click'
```

#### `cleanup()`

Nettoie TOUS les listeners enregistrés. **Important** pour éviter les memory leaks.

```javascript
// Lors de la fermeture du jeu ou changement de page
eventManager.cleanup();
```

#### `getStats()`

Retourne des statistiques de debug.

**Retourne** : `Object`
- `targets` (number) : Nombre d'éléments avec listeners
- `totalListeners` (number) : Nombre total de listeners
- `byType` (Object) : Répartition par type d'événement

```javascript
const stats = eventManager.getStats();
console.log(stats);
// {
//   targets: 5,
//   totalListeners: 12,
//   byType: { click: 8, keydown: 3, mouseover: 1 }
// }
```

### Singleton

`eventManager` est exporté comme singleton :

```javascript
// Accessible globalement pour debug
window.__eventManager = eventManager;
```

---

## DOM Utils

Utilitaires pour manipulation DOM sécurisée.

### Import

```javascript
import {
  getElement,
  getElements,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  show,
  hide,
  createElement
} from './utils/dom-utils.js';
```

### API

#### `getElement(id, warnIfNotFound = true)`

Récupère un élément par ID de manière sécurisée.

**Paramètres** :
- `id` (string) : ID de l'élément
- `warnIfNotFound` (boolean) : Logger un warning si non trouvé

**Retourne** : `HTMLElement | null`

```javascript
const canvas = getElement('canvas-solo');
const optional = getElement('optional-element', false);
```

#### `getElements(selector)`

Récupère plusieurs éléments par sélecteur CSS.

**Paramètres** :
- `selector` (string) : Sélecteur CSS

**Retourne** : `HTMLElement[]` - Toujours un tableau

```javascript
const buttons = getElements('.btn');
const items = getElements('li.item');
```

#### `addClass(elementOrId, className)`

Ajoute une classe à un élément.

**Paramètres** :
- `elementOrId` (string | HTMLElement) : Élément ou ID
- `className` (string) : Classe à ajouter

```javascript
addClass('my-div', 'active');
addClass(element, 'highlight');
```

#### `removeClass(elementOrId, className)`

Retire une classe d'un élément.

```javascript
removeClass('my-div', 'active');
```

#### `toggleClass(elementOrId, className)`

Toggle une classe sur un élément.

**Retourne** : `boolean` - true si ajoutée, false si retirée

```javascript
const isActive = toggleClass('my-div', 'active');
```

#### `hasClass(elementOrId, className)`

Vérifie si un élément a une classe.

**Retourne** : `boolean`

```javascript
if (hasClass('my-div', 'hidden')) {
  // ...
}
```

#### `show(elementOrId)`

Affiche un élément (retire classe 'hidden' et display='').

```javascript
show('modal');
```

#### `hide(elementOrId)`

Cache un élément (ajoute classe 'hidden').

```javascript
hide('loading-screen');
```

#### `createElement(tag, attrs = {}, content = '')`

Crée un élément avec attributs et contenu.

**Paramètres** :
- `tag` (string) : Tag HTML
- `attrs` (Object) : Attributs
- `content` (string) : Contenu HTML

**Retourne** : `HTMLElement`

```javascript
const button = createElement(
  'button',
  {
    id: 'submit-btn',
    className: 'btn btn-primary',
    dataset: { action: 'submit' },
    type: 'button'
  },
  'Valider'
);

document.body.appendChild(button);
```

**Attributs spéciaux** :
- `className` : Classes CSS
- `dataset` : Data attributes

---

## BaseSnakeGame

Classe abstraite de base pour tous les modes de jeu Snake.

### Import

```javascript
import { BaseSnakeGame } from './core/BaseSnakeGame.js';
```

### Héritage

```javascript
class SoloSnakeGame extends BaseSnakeGame {
  constructor() {
    super('canvas-solo');
  }

  reset() {
    // Implémentation spécifique
  }

  update() {
    // Implémentation spécifique
  }

  draw() {
    // Implémentation spécifique
  }
}
```

### Constructeur

#### `constructor(canvasId)`

**Paramètres** :
- `canvasId` (string) : ID du canvas HTML

**Lance** : `Error` si canvas introuvable

```javascript
super('my-canvas');
```

### Propriétés Héritées

```javascript
// Canvas
this.canvas       // HTMLCanvasElement
this.ctx          // CanvasRenderingContext2D

// Configuration
this.GRID_SIZE    // number (30)
this.CANVAS_SIZE  // number (360)
this.CELL_SIZE    // number (12)

// État du jeu
this.running      // boolean
this.paused       // boolean
this.difficulty   // number (0=Facile, 1=Normal, 2=Difficile)
this.level        // number

// Animation
this.raf          // number (requestAnimationFrame ID)
this.lastTime     // number (timestamp)

// Effets
this.particles    // Array<Particle>

// Services
this.audio        // AudioManager (window.audio)
this.COLORS       // Object (from constants)
```

### Méthodes Abstraites (À IMPLÉMENTER)

#### `reset()`

Réinitialise l'état du jeu.

```javascript
reset() {
  this.snake = [{ x: 15, y: 15 }];
  this.food = this.randomPosition([...this.snake]);
  // ...
}
```

#### `update()`

Met à jour la logique du jeu (appelé chaque frame).

```javascript
update() {
  // Déplacer le serpent
  // Vérifier collisions
  // Gérer la nourriture
}
```

#### `draw()`

Dessine le jeu sur le canvas.

```javascript
draw() {
  this.ctx.fillStyle = '#000';
  this.ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
  // Dessiner serpent, nourriture, etc.
  this.drawParticles();
}
```

### Méthodes Fournies

#### `start(difficulty = 0)`

Démarre le jeu.

**Paramètres** :
- `difficulty` (number) : 0=Facile, 1=Normal, 2=Difficile

```javascript
game.start(1); // Normal
```

#### `stop()`

Arrête le jeu et nettoie.

```javascript
game.stop();
```

#### `pause()`

Met en pause / reprend le jeu (toggle).

```javascript
game.pause(); // Met en pause
game.pause(); // Reprend
```

#### `calculateSpeed()`

Calcule la vitesse selon difficulté et niveau.

**Retourne** : `number` - Délai en ms entre chaque update

```javascript
const speed = this.calculateSpeed();
// Facile niveau 1 : 400ms
// Normal niveau 1 : 200ms
// Difficile niveau 1 : 125ms
```

#### `createParticles(x, y, color, count = 10)`

Crée des particules d'effet.

**Paramètres** :
- `x` (number) : Position X (grille)
- `y` (number) : Position Y (grille)
- `color` (string) : Couleur hex
- `count` (number) : Nombre de particules

```javascript
this.createParticles(food.x, food.y, '#00ff00', 15);
```

#### `updateParticles()`

Met à jour toutes les particules (gravité, fade).

```javascript
this.updateParticles();
```

#### `drawParticles()`

Dessine toutes les particules actives.

```javascript
this.drawParticles();
```

#### `randomPosition(excludeList = [])`

Génère une position aléatoire valide.

**Paramètres** :
- `excludeList` (Array<{x, y}>) : Positions à exclure

**Retourne** : `{x, y}`

```javascript
const pos = this.randomPosition([...this.snake, this.food]);
```

#### `collides(pos1, pos2)`

Vérifie si deux positions sont identiques.

**Retourne** : `boolean`

```javascript
if (this.collides(head, food)) {
  // Manger la nourriture
}
```

#### `getDarkerColor(color)`

Assombrit une couleur hexadécimale.

**Paramètres** :
- `color` (string) : Couleur hex (#RRGGBB)

**Retourne** : `string` - Couleur assombrie

```javascript
const dark = this.getDarkerColor('#ff0000'); // '#990000'
```

### Boucle de Jeu (loop)

Peut être surchargée si besoin de logique spécifique :

```javascript
loop(timestamp) {
  if (!this.running) return;

  this.raf = requestAnimationFrame((t) => this.loop(t));

  if (this.paused) {
    this.draw();
    return;
  }

  let speed = this.calculateSpeed();

  // LOGIQUE SPÉCIFIQUE (ex: power-ups)
  if (this.powerupEffects.slow) {
    speed *= 1.5;
  }

  if (timestamp - this.lastTime > speed) {
    this.lastTime = timestamp;
    this.update();
  }

  this.updateParticles();
  this.draw();
}
```

---

## Storage Service

Encapsulation de localStorage avec gestion d'erreurs.

### Import

```javascript
import { storage } from './services/storage.js';
```

### API

#### `set(key, value)`

Sauvegarde une valeur (JSON.stringify automatique).

```javascript
storage.set('highScore', 1000);
storage.set('settings', { sound: true, music: false });
```

#### `get(key, defaultValue = null)`

Récupère une valeur (JSON.parse automatique).

**Retourne** : Valeur sauvegardée ou `defaultValue`

```javascript
const score = storage.get('highScore', 0);
const settings = storage.get('settings', { sound: true });
```

#### `remove(key)`

Supprime une clé.

```javascript
storage.remove('oldData');
```

#### `clear()`

Vide tout le localStorage.

```javascript
storage.clear();
```

---

## Trophies Service

Système de trophées et statistiques de carrière.

### Import

```javascript
import { trophies } from './services/trophies.js';
```

### API

#### `recordScore(score, difficulty, mode)`

Enregistre un score et met à jour les stats.

**Paramètres** :
- `score` (number) : Score obtenu
- `difficulty` (number) : 0=Facile, 1=Normal, 2=Difficile
- `mode` (string) : 'solo', 'multi', 'network'

**Retourne** : `Object`
- `isTop3` (boolean) : Fait partie du Top 3 ?
- `rank` (number | null) : Position dans le Top 3 (1-3)
- `unlockedTrophies` (Array) : Trophées débloqués

```javascript
const result = trophies.recordScore(500, 1, 'solo');
if (result.isTop3) {
  console.log(`Nouvelle position #${result.rank} !`);
}
```

#### `getTop3(difficulty, mode)`

Récupère le Top 3 pour une difficulté/mode.

**Retourne** : `Array<{score, date}>`

```javascript
const top = trophies.getTop3(1, 'solo');
// [
//   { score: 1000, date: '2025-11-18' },
//   { score: 800, date: '2025-11-17' },
//   { score: 600, date: '2025-11-16' }
// ]
```

#### `getCareerStats()`

Récupère les statistiques globales de carrière.

**Retourne** : `Object`

```javascript
const stats = trophies.getCareerStats();
// {
//   totalGames: 50,
//   totalScore: 25000,
//   averageScore: 500,
//   bestScore: 1200,
//   trophiesUnlocked: 8
// }
```

#### `getTrophies()`

Récupère tous les trophées et leur état.

**Retourne** : `Array<Trophy>`

```javascript
const allTrophies = trophies.getTrophies();
// [
//   {
//     id: 'first_game',
//     name: 'Première Partie',
//     description: 'Jouer votre première partie',
//     unlocked: true,
//     unlockedDate: '2025-11-18'
//   },
//   ...
// ]
```

---

## Exemples d'Utilisation Complets

### Exemple 1 : Créer un Nouveau Mode de Jeu

```javascript
import { BaseSnakeGame } from './core/BaseSnakeGame.js';
import { logger } from './services/logger.js';

class PracticeMode extends BaseSnakeGame {
  constructor() {
    super('canvas-practice');
    this.snake = [];
    this.obstacles = [];
  }

  reset() {
    logger.debug('Reset practice mode');
    this.snake = [{ x: 15, y: 15 }];
    this.obstacles = this.generateObstacles();
  }

  update() {
    // Logique de mise à jour
    this.moveSnake();
    this.checkCollisions();
  }

  draw() {
    // Effacer
    this.ctx.clearRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

    // Dessiner obstacles
    this.obstacles.forEach(obs => {
      this.ctx.fillStyle = this.COLORS.OBSTACLE;
      this.ctx.fillRect(
        obs.x * this.CELL_SIZE,
        obs.y * this.CELL_SIZE,
        this.CELL_SIZE,
        this.CELL_SIZE
      );
    });

    // Dessiner serpent
    this.drawSnake();

    // Particules
    this.drawParticles();
  }

  generateObstacles() {
    // Générer obstacles
    return [];
  }

  moveSnake() {
    // Mouvement
  }

  checkCollisions() {
    // Collisions
  }

  drawSnake() {
    this.snake.forEach((segment, i) => {
      const color = i === 0 ? this.COLORS.SNAKE_HEAD : this.COLORS.SNAKE_BODY;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(
        segment.x * this.CELL_SIZE,
        segment.y * this.CELL_SIZE,
        this.CELL_SIZE,
        this.CELL_SIZE
      );
    });
  }
}

// Utilisation
const practice = new PracticeMode();
practice.start(0); // Facile
```

### Exemple 2 : Gestion Complète des Événements

```javascript
import { eventManager } from './managers/EventManager.js';
import { logger } from './services/logger.js';

class GameController {
  constructor() {
    this.listeners = [];
  }

  init() {
    // Boutons
    const playId = eventManager.add(
      document.getElementById('play-btn'),
      'click',
      () => this.startGame()
    );

    const pauseId = eventManager.add(
      document.getElementById('pause-btn'),
      'click',
      () => this.togglePause()
    );

    // Clavier
    const keyId = eventManager.add(
      document,
      'keydown',
      (e) => this.handleKeyDown(e)
    );

    this.listeners = [playId, pauseId, keyId];

    logger.log('Game controller initialized');
  }

  destroy() {
    // Cleanup automatique
    this.listeners.forEach(id => eventManager.remove(id));
    logger.log('Game controller destroyed');
  }

  startGame() {
    logger.log('Starting game...');
    // ...
  }

  togglePause() {
    logger.log('Toggle pause');
    // ...
  }

  handleKeyDown(e) {
    logger.debug('Key pressed:', e.key);
    // ...
  }
}

const controller = new GameController();
controller.init();

// Plus tard...
controller.destroy(); // Nettoie tous les listeners
```

---

## Notes de Version

### v2.0.0 (Phase 2)

- ✅ Ajout de `BaseSnakeGame` (classe abstraite)
- ✅ Ajout de `EventManager` (gestion centralisée des événements)
- ✅ Ajout de `logger` (logging conditionnel)
- ✅ Ajout de `dom-utils` (helpers DOM)
- ✅ Refactoring `SoloSnakeGame` (héritage de BaseSnakeGame)
- ✅ Tests unitaires complets (109 tests)
- ✅ Documentation API complète

### Prochaines Étapes

- Refactoring de `multi-game.js` (héritage de BaseSnakeGame)
- Ajout de nouveaux modes de jeu
- Amélioration du système de trophées

---

## Support

Pour toute question ou problème, consulter :
- `ARCHITECTURE.md` - Architecture générale
- `README.md` - Guide d'utilisation
- GitHub Issues - Rapporter des bugs
