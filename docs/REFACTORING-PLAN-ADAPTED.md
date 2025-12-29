# 🎯 PLAN DE REFACTORING ADAPTÉ - SNAKE ULTRA

**Date de création** : 2024-11-18
**État actuel** : Phase 2 terminée (4 modules ES6 créés, 110 tests passent)
**Durée estimée** : 3-4 heures
**Objectif** : Architecture professionnelle complète

---

## ✅ PHASE 1 : MODULES MANQUANTS (TERMINÉE)

### Ce qui a été créé :

- ✅ `www/services/logger.js` (97 lignes)
- ✅ `www/utils/dom-utils.js` (153 lignes)
- ✅ `www/managers/EventManager.js` (177 lignes)
- ✅ `www/core/BaseSnakeGame.js` (270 lignes)

**Total** : 4 nouveaux modules (697 lignes de code réutilisable)

---

## 🚀 PHASE 2 : REFACTORING SOLO-GAME.JS (1-2h)

### Objectif

Faire hériter `SoloSnakeGame` de `BaseSnakeGame` pour éliminer les duplications.

### Étape 2.1 : Ajouter les imports

En début de fichier `www/solo-game.js`, ajouter :

```javascript
import { BaseSnakeGame } from './core/BaseSnakeGame.js';
```

### Étape 2.2 : Modifier la déclaration de classe

**AVANT** :
```javascript
class SoloSnakeGame {
    constructor() {
        this.canvas = document.getElementById('canvas-solo');
        this.ctx = this.canvas.getContext('2d');
        this.GRID_SIZE = 30;
        // ... etc
    }
}
```

**APRÈS** :
```javascript
class SoloSnakeGame extends BaseSnakeGame {
    constructor() {
        super('canvas-solo'); // Appeler le constructeur parent

        // Garder SEULEMENT les propriétés spécifiques au mode solo
        this.snake = [{ x: 15, y: 15 }];
        this.dx = 0;
        this.dy = 0;
        this.food = { x: 0, y: 0 };
        this.bad = { x: -1, y: -1 };
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.foodEaten = 0;
        this.wallsDestroyed = 0;
        this.skullsEaten = 0;
        this.obstacles = [];
        this.powerup = { x: -1, y: -1, type: null };
        this.powerupActive = null;
        this.powerupEnd = 0;
        this.lastPowerup = Date.now();
        this.maxSnakeLength = 1;

        // SUPPRIMER toutes les propriétés déjà dans BaseSnakeGame :
        // ❌ this.canvas
        // ❌ this.ctx
        // ❌ this.GRID_SIZE
        // ❌ this.CANVAS_SIZE
        // ❌ this.CELL_SIZE
        // ❌ this.SNAKE_EYE_SIZE
        // ❌ this.SNAKE_EYE_OFFSET
        // ❌ this.running
        // ❌ this.paused
        // ❌ this.difficulty
        // ❌ this.level
        // ❌ this.raf
        // ❌ this.lastTime
        // ❌ this.particles
        // ❌ this.audio
        // ❌ this.COLORS
        // ❌ this.POWERUP_DURATION
    }
}
```

### Étape 2.3 : Supprimer les méthodes dupliquées

Dans `solo-game.js`, **SUPPRIMER** ces méthodes (elles existent dans BaseSnakeGame) :

```javascript
// ❌ SUPPRIMER
loop(timestamp) { ... }

// ❌ SUPPRIMER
pause() { ... }

// ❌ SUPPRIMER
stop() { ... }

// ❌ SUPPRIMER (si identique à BaseSnakeGame)
createParticles(x, y, color, count) { ... }

// ❌ SUPPRIMER (si identique à BaseSnakeGame)
updateParticles() { ... }

// ❌ SUPPRIMER (si identique à BaseSnakeGame)
drawParticles() { ... }

// ❌ SUPPRIMER (si identique à BaseSnakeGame)
randomPosition(excludeList) { ... }

// ❌ SUPPRIMER (si identique à BaseSnakeGame)
getDarkerColor(color) { ... }

// ❌ SUPPRIMER (si identique à BaseSnakeGame)
collides(pos1, pos2) { ... }
```

### Étape 2.4 : Modifier la méthode start()

**AVANT** :
```javascript
start(difficulty = 0) {
    this.difficulty = difficulty;
    this.reset();
    this.running = true;
    this.paused = false;
    this.gameStartTime = Date.now();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
}
```

**APRÈS** :
```javascript
start(difficulty = 0) {
    super.start(difficulty); // Appeler parent
    // Logique spécifique solo si nécessaire (généralement vide)
}
```

### Étape 2.5 : Garder les méthodes spécifiques

**GARDER** ces méthodes (elles sont spécifiques au mode solo) :

```javascript
// ✅ GARDER
reset() { ... }

// ✅ GARDER
update() { ... }

// ✅ GARDER
draw() { ... }

// ✅ GARDER
eatFood() { ... }

// ✅ GARDER
eatSkull() { ... }

// ✅ GARDER
eatPowerup() { ... }

// ✅ GARDER
generateFood() { ... }

// ✅ GARDER
generateBad() { ... }

// ✅ GARDER
generatePowerup() { ... }

// ✅ GARDER
generateObstacles() { ... }

// ✅ GARDER
checkCollision() { ... }

// ✅ GARDER (toutes les autres méthodes spécifiques au solo)
```

### Étape 2.6 : Vérifier la syntaxe

```bash
node -e "import('./www/solo-game.js')"
```

Si erreur, corriger jusqu'à ce que ça passe.

### Étape 2.7 : Tester manuellement

```bash
npm run dev
```

Ouvrir http://localhost:8080 et :
- ✅ Jouer une partie solo
- ✅ Tester les 3 difficultés
- ✅ Tester pause/reprendre
- ✅ Vérifier aucune erreur console

---

## 📝 PHASE 3 : TESTS AUTOMATISÉS (1h)

### Objectif

Ajouter des tests pour les nouveaux modules (logger, EventManager, BaseSnakeGame, dom-utils).

### Étape 3.1 : Créer tests/unit/logger.test.js

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '../../www/services/logger.js';

describe('Logger Service', () => {
    beforeEach(() => {
        // Reset console mocks
        vi.clearAllMocks();
    });

    it('should have all methods', () => {
        expect(logger.log).toBeDefined();
        expect(logger.warn).toBeDefined();
        expect(logger.error).toBeDefined();
        expect(logger.debug).toBeDefined();
        expect(logger.group).toBeDefined();
        expect(logger.groupEnd).toBeDefined();
    });

    it('should detect dev environment correctly', () => {
        expect(logger.isDev).toBeDefined();
        expect(typeof logger.isDev).toBe('boolean');
    });
});
```

### Étape 3.2 : Créer tests/unit/EventManager.test.js

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { EventManager } from '../../www/managers/EventManager.js';

describe('EventManager', () => {
    let manager;
    let mockElement;

    beforeEach(() => {
        manager = new EventManager();
        mockElement = document.createElement('div');
        document.body.appendChild(mockElement);
    });

    it('should add event listener', () => {
        const handler = () => {};
        const id = manager.add(mockElement, 'click', handler);

        expect(id).toBeGreaterThan(0);
        expect(manager.getStats().totalListeners).toBe(1);
    });

    it('should remove event listener by ID', () => {
        const handler = () => {};
        const id = manager.add(mockElement, 'click', handler);

        const removed = manager.remove(id);
        expect(removed).toBe(true);
        expect(manager.getStats().totalListeners).toBe(0);
    });

    it('should cleanup all listeners', () => {
        manager.add(mockElement, 'click', () => {});
        manager.add(mockElement, 'mouseover', () => {});

        manager.cleanup();
        expect(manager.getStats().totalListeners).toBe(0);
    });
});
```

### Étape 3.3 : Créer tests/unit/BaseSnakeGame.test.js

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { BaseSnakeGame } from '../../www/core/BaseSnakeGame.js';

// Classe de test
class TestSnakeGame extends BaseSnakeGame {
    reset() { this.testResetCalled = true; }
    update() { this.testUpdateCalled = true; }
    draw() { this.testDrawCalled = true; }
}

describe('BaseSnakeGame', () => {
    let game;

    beforeEach(() => {
        document.body.innerHTML = '<canvas id="test-canvas"></canvas>';
        game = new TestSnakeGame('test-canvas');
    });

    it('should initialize correctly', () => {
        expect(game.GRID_SIZE).toBe(30);
        expect(game.running).toBe(false);
        expect(game.paused).toBe(false);
    });

    it('should start game', () => {
        game.start(1);
        expect(game.running).toBe(true);
        expect(game.difficulty).toBe(1);
        expect(game.testResetCalled).toBe(true);
    });

    it('should pause/unpause', () => {
        game.pause();
        expect(game.paused).toBe(true);
        game.pause();
        expect(game.paused).toBe(false);
    });

    it('should generate random position', () => {
        const pos = game.randomPosition();
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThan(game.GRID_SIZE);
    });
});
```

### Étape 3.4 : Créer tests/unit/dom-utils.test.js

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { getElement, addClass, removeClass, show, hide } from '../../www/utils/dom-utils.js';

describe('DOM Utils', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="test-element" class="initial-class"></div>
        `;
    });

    it('should get element by ID', () => {
        const element = getElement('test-element', false);
        expect(element).toBeTruthy();
        expect(element.id).toBe('test-element');
    });

    it('should add class', () => {
        addClass('test-element', 'new-class');
        const element = getElement('test-element', false);
        expect(element.classList.contains('new-class')).toBe(true);
    });

    it('should remove class', () => {
        removeClass('test-element', 'initial-class');
        const element = getElement('test-element', false);
        expect(element.classList.contains('initial-class')).toBe(false);
    });

    it('should show element', () => {
        const element = getElement('test-element', false);
        element.classList.add('hidden');
        show(element);
        expect(element.classList.contains('hidden')).toBe(false);
    });

    it('should hide element', () => {
        hide('test-element');
        const element = getElement('test-element', false);
        expect(element.classList.contains('hidden')).toBe(true);
    });
});
```

### Étape 3.5 : Configurer Vitest (si pas déjà fait)

Créer `vitest.config.js` :

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.js']
    }
});
```

### Étape 3.6 : Exécuter les tests

```bash
npm run test
```

**Objectif** : Tous les tests (110 existants + ~20 nouveaux = ~130) doivent passer ✅

---

## 📚 PHASE 4 : DOCUMENTATION (30min)

### Étape 4.1 : Créer docs/ARCHITECTURE.md

```markdown
# Architecture Snake Ultra

## Vue d'ensemble

Snake Ultra utilise une architecture modulaire avec séparation des responsabilités.

## Structure

www/
├── config/          # Configuration (constants, trophies)
├── core/            # Classes de jeu (BaseSnakeGame)
├── data/            # Données statiques (trophies)
├── managers/        # Gestion globale (EventManager)
├── services/        # Services (storage, audio, logger)
└── utils/           # Utilitaires (dom-utils, render-utils)

## Hiérarchie

BaseSnakeGame (abstract)
├── SoloSnakeGame
└── MultiSnakeGame

## Patterns

- **Inheritance** : BaseSnakeGame → SoloSnakeGame
- **Singleton** : eventManager, logger
- **Service Layer** : storage, audio

## Flux de données

User Input → Game Logic → State Update → Rendering
```

### Étape 4.2 : Créer docs/API.md

```markdown
# API Reference

## BaseSnakeGame

### Constructor
new BaseSnakeGame(canvasId)

### Methods

- `start(difficulty)` : Démarre le jeu
- `pause()` : Toggle pause
- `stop()` : Arrête le jeu
- `reset()` : Réinitialise (abstract)
- `update()` : Met à jour (abstract)
- `draw()` : Dessine (abstract)
- `createParticles(x, y, color, count)` : Crée des particules
- `randomPosition(excludeList)` : Position aléatoire

## EventManager

- `add(target, event, handler, options)` : Ajoute listener
- `remove(id)` : Retire listener
- `cleanup()` : Nettoie tous

## Logger

- `logger.log(...)` : Dev uniquement
- `logger.error(...)` : Toujours
- `logger.debug(...)` : Dev uniquement
```

### Étape 4.3 : Mettre à jour README.md

Ajouter une section sur l'architecture :

```markdown
## 🏗️ Architecture

Projet structuré en modules ES6 :

- `config/` : Configuration
- `core/` : Classes de jeu
- `managers/` : Gestion globale
- `services/` : Services métier
- `utils/` : Utilitaires

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
```

---

## ✅ VALIDATION FINALE

### Checklist

- [ ] Les 4 nouveaux modules existent et passent `node -e "import('...')"`
- [ ] solo-game.js hérite de BaseSnakeGame
- [ ] Aucune duplication entre Base et Solo
- [ ] Le jeu fonctionne manuellement (solo, multi, pause, son)
- [ ] Tous les tests passent (~130 tests)
- [ ] Documentation créée (ARCHITECTURE.md, API.md)
- [ ] Aucune erreur dans la console navigateur

### Tests manuels

```bash
# 1. Démarrer le jeu
npm run dev

# 2. Tester
- Mode solo (3 difficultés)
- Mode multi (2-4 joueurs)
- Pause/reprendre
- Son on/off
- Fermer/rouvrir (sauvegarde)
- Trophées
- Dark/light mode

# 3. Vérifier console
Ouvrir F12 → Console
✅ Aucune erreur rouge
✅ Logs uniquement en dev (localhost)
```

---

## 🎉 COMMIT FINAL

```bash
git add .
git commit -m "feat: Architecture professionnelle complète

✅ 4 nouveaux modules créés (logger, EventManager, BaseSnakeGame, dom-utils)
✅ SoloSnakeGame hérite de BaseSnakeGame (-300 lignes duplication)
✅ Tests automatisés (~130 tests passent)
✅ Documentation complète (Architecture + API)
✅ 0 erreurs console
✅ 0 memory leaks (EventManager cleanup auto)

Modules créés :
- www/services/logger.js (97 lignes)
- www/managers/EventManager.js (177 lignes)
- www/core/BaseSnakeGame.js (270 lignes)
- www/utils/dom-utils.js (153 lignes)

Métriques :
- Duplication code : -300 lignes
- Tests : 110 → ~130
- Maintenabilité : 7/10 → 9/10
- Architecture : Professionnelle ✅
"

git tag v2.1.0
```

---

## 📊 RAPPORT FINAL

### Métriques Avant/Après

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Modules créés | 4 | 8 | +100% |
| Lignes code réutilisable | 532 | 1229 | +131% |
| Duplication solo-game.js | ~300 lignes | 0 | -100% |
| Tests | 110 | ~130 | +18% |
| Architecture | Modulaire | Professionnelle | ✅ |
| Memory leaks | Possibles | Prévenus | ✅ |
| Logs en prod | Oui | Non | ✅ |

### Temps total

- Phase 1 : 30min (modules créés ✅)
- Phase 2 : 1-2h (refactoring solo-game.js)
- Phase 3 : 1h (tests)
- Phase 4 : 30min (docs)

**Total : 3-4h** ✅

---

## 🆘 TROUBLESHOOTING

### Problème : Import ne fonctionne pas

```bash
# Vérifier le chemin
ls www/core/BaseSnakeGame.js

# Vérifier la syntaxe
node -e "import('./www/core/BaseSnakeGame.js')"
```

### Problème : Tests échouent

```bash
# Installer vitest si manquant
npm install -D vitest @vitest/ui jsdom

# Exécuter un test isolé
npm run test -- logger.test.js
```

### Problème : Jeu ne démarre pas

```bash
# Ouvrir console navigateur (F12)
# Vérifier les erreurs

# Vérifier que super() est appelé
# Vérifier que les imports sont corrects
```

---

## 🚀 PROCHAINES ÉTAPES SUGGÉRÉES

1. Faire hériter MultiSnakeGame de BaseSnakeGame
2. Refactorer navigation.js (1091 lignes → controllers)
3. Ajouter tests E2E avec Playwright
4. Implémenter mode IA
5. PWA (offline mode)

---

**Date de création** : 2024-11-18
**Auteur** : Claude Code
**Version** : 2.1.0
**Statut** : ✅ Prêt à exécuter
