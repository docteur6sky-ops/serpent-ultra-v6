# 🧪 Guide des Tests - Snake Ultra

## 📋 Vue d'ensemble

Ce projet dispose de **3 types de tests** pour garantir la qualité du code avant tout refactoring :

| Type | Framework | Fichiers | Nombre | Objectif |
|------|-----------|----------|--------|----------|
| **Tests Unitaires (Backend)** | Jest | `tests/unit/` | 35 tests | Logique serveur (Room, Snake) |
| **Tests Intégration (Backend)** | Jest | `tests/integration/` | 24 tests | Flows complets serveur |
| **Tests Unitaires (Frontend)** | Jest + JSDOM | `tests/unit-client/` | ~15 tests | Classes client (SoloSnakeGame) |
| **Tests E2E** | Playwright | `tests/e2e/` | ~20 tests | Interface utilisateur complète |

**Total : 110 tests**

---

## 🚀 Lancer les tests

### Tests Backend (Serveur Node.js)

```bash
# Tous les tests backend
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Mode watch (redémarre automatiquement)
npm run test:watch

# Avec couverture de code
npm run test:coverage
```

### Tests Frontend (Client)

```bash
# Tests unitaires des classes client
npm run test:unit-client
```

### Tests E2E (End-to-End)

```bash
# Lancer tous les tests E2E (headless)
npm run test:e2e

# Avec interface graphique interactive
npm run test:e2e:ui

# Mode debug (step-by-step)
npm run test:e2e:debug

# Voir le navigateur pendant les tests
npm run test:e2e:headed

# Voir le rapport HTML des tests
npm run test:report
```

### Tous les tests

```bash
# Lancer TOUS les tests (Backend + Frontend + E2E)
npm run test:all
```

---

## 📊 Résultats attendus

### ✅ Tests Backend (Existants - Passent déjà)

```
 PASS  tests/unit/Room.test.js
  ✓ Room - Construction et Initialisation (2 tests)
  ✓ Room - Gestion des Joueurs (7 tests)
  ✓ Room - Système Ready (5 tests)
  ✓ Room - Génération de Nourriture (11 tests)
  ✓ Room - Cleanup et Timers (4 tests)
  ✓ Room - Scénarios Complets (10 tests)

 PASS  tests/integration/game-flows.test.js
  ✓ INTÉGRATION - Flow Complet Solo (4 tests)
  ✓ INTÉGRATION - Flow Complet Multijoueur (5 tests)
  ✓ INTÉGRATION - Edge Cases (5 tests)
  ✓ INTÉGRATION - Performance (3 tests)
  ✓ INTÉGRATION - Collisions Complexes (7 tests)

Tests:       101 passed, 101 total
```

### ✅ Tests E2E (Nouveaux)

```
Running 20 tests using 1 worker

  ✓ solo-game.spec.js:10:3 › Mode Solo › Devrait afficher le menu principal
  ✓ solo-game.spec.js:20:3 › Mode Solo › Devrait démarrer le jeu solo
  ✓ solo-game.spec.js:35:3 › Mode Solo › Devrait afficher le serpent
  ✓ solo-game.spec.js:50:3 › Mode Solo › Devrait changer le score
  ✓ solo-game.spec.js:65:3 › Mode Solo › Devrait répondre aux touches
  ✓ solo-game.spec.js:80:3 › Mode Solo › Devrait afficher pause
  ✓ solo-game.spec.js:90:3 › Mode Solo › Devrait mettre en pause
  ✓ solo-game.spec.js:100:3 › Mode Solo › Devrait quitter le jeu
  ✓ solo-game.spec.js:115:3 › Mode Solo › Devrait changer difficulté

  ✓ multiplayer.spec.js:10:3 › Multijoueur › Devrait afficher menu
  ✓ multiplayer.spec.js:20:3 › Multijoueur › Devrait valider pseudo
  ✓ multiplayer.spec.js:30:3 › Multijoueur › Devrait rejeter pseudo court
  ✓ multiplayer.spec.js:45:3 › Multijoueur › Devrait tenter connexion
  ✓ multiplayer.spec.js:60:3 › Multijoueur › Devrait retourner au menu
  ✓ multiplayer.spec.js:70:3 › Multijoueur › Canvas distinct
  ✓ multiplayer.spec.js:80:3 › Multijoueur › Contraintes pseudo
  ✓ multiplayer.spec.js:90:3 › Multijoueur › Échec connexion WebSocket
  ✓ multiplayer.spec.js:105:3 › Multijoueur › Pseudo vide

  20 passed (30s)
```

---

## 🔍 Détails des tests

### 1️⃣ Tests Unitaires Backend (`tests/unit/`)

**Fichier : `Room.test.js`** (35 tests)
- Construction et initialisation
- Ajout/retrait de joueurs
- Système de ready
- Génération de nourriture/obstacles
- Détection de collisions
- Cleanup et gestion mémoire

**Objectif** : Garantir que la logique métier du serveur fonctionne correctement.

---

### 2️⃣ Tests Intégration Backend (`tests/integration/`)

**Fichier : `game-flows.test.js`** (24 tests)
- Flow complet solo : démarrage → mouvement → nourriture
- Flow multijoueur : 2 joueurs simultanés
- Edge cases : serpent très long, wrapping multiple
- Performance : 1000 mouvements, 100 serpents
- Collisions complexes

**Objectif** : Vérifier que les différents composants fonctionnent ensemble.

---

### 3️⃣ Tests Unitaires Frontend (`tests/unit-client/`)

**Fichier : `solo-game.test.js`** (~15 tests)
- Construction de `SoloSnakeGame`
- Initialisation du serpent
- Gestion du score
- Changement de direction
- Détection de collision
- Pause/Resume/Reset

**Objectif** : Tester les classes JavaScript côté client en isolation.

**⚠️ Note** : Ces tests utilisent JSDOM pour simuler le DOM du navigateur.

---

### 4️⃣ Tests E2E (`tests/e2e/`)

#### **Fichier : `solo-game.spec.js`** (~10 tests)

**Tests du mode solo** :
- ✅ Affichage du menu principal
- ✅ Démarrage du jeu solo
- ✅ Affichage du serpent sur le canvas
- ✅ Changement du score quand le serpent mange
- ✅ Réponse aux touches clavier (ArrowUp, ArrowDown, etc.)
- ✅ Affichage du bouton pause
- ✅ Mise en pause du jeu (touche `p`)
- ✅ Quitter le jeu (touche `Escape`)
- ✅ Changement de difficulté (Facile/Normal/Difficile)

**Tests du game over** :
- ✅ Affichage de l'écran game over après collision

#### **Fichier : `multiplayer.spec.js`** (~10 tests)

**Tests de connexion** :
- ✅ Affichage du menu multijoueur
- ✅ Validation du pseudo (3-12 caractères)
- ✅ Rejet d'un pseudo trop court
- ✅ Tentative de connexion au serveur WebSocket
- ✅ Retour au menu principal

**Tests d'interface** :
- ✅ Existence d'un canvas multijoueur distinct
- ✅ Contraintes de saisie du pseudo (max 12 caractères)

**Tests de gestion d'erreurs** :
- ✅ Gestion de l'échec de connexion WebSocket
- ✅ Pas de crash avec un pseudo vide

**Objectif** : Vérifier que l'application fonctionne du point de vue de l'utilisateur final.

---

## 🛠️ Configuration

### Jest (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70
    }
  }
};
```

### Playwright (`playwright.config.js`)

```javascript
module.exports = defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 8080,
  },
});
```

---

## 📈 Utilisation avant refactoring

### 🔴 **Workflow recommandé**

Avant de modifier le code, **lancez tous les tests** :

```bash
# 1. Lancer les tests backend (rapide, ~2s)
npm run test

# 2. Lancer les tests frontend client (rapide, ~3s)
npm run test:unit-client

# 3. Lancer les tests E2E (plus lent, ~30s)
npm run test:e2e
```

✅ **Si tous les tests passent** → Vous pouvez commencer le refactoring en sécurité.

❌ **Si un test échoue** → Corrigez d'abord le bug avant de refactorer.

---

### 🟢 **Workflow pendant le refactoring**

1. **Modifier un fichier** (ex: `snake.js`)
2. **Lancer les tests concernés** :
   ```bash
   npm run test:watch  # Tests backend en watch mode
   ```
3. **Vérifier que les tests passent toujours**
4. **Si un test échoue** → Annuler les modifications ou corriger
5. **Répéter** pour chaque changement

---

### 🔵 **Workflow après refactoring**

Après avoir terminé un module, lancez **TOUS** les tests :

```bash
npm run test:all
```

✅ **Tous les tests passent** → Commit ✅
❌ **Un test échoue** → Ne pas commit, corriger d'abord

---

## 📊 Couverture de code

Pour voir quelles parties du code sont testées :

```bash
npm run test:coverage
```

Ouvrir le rapport HTML :

```
coverage/lcov-report/index.html
```

**Objectif** : Maintenir une couverture > 70%

---

## 🐛 Débugger les tests

### Tests Jest (Backend/Frontend)

```bash
# Lancer un seul fichier de test
npx jest tests/unit/Room.test.js

# Lancer un seul test
npx jest -t "devrait ajouter un joueur"

# Mode debug
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Tests Playwright (E2E)

```bash
# Mode debug avec interface graphique
npm run test:e2e:debug

# Voir le navigateur pendant les tests
npm run test:e2e:headed

# Lancer un seul fichier
npx playwright test tests/e2e/solo-game.spec.js

# Lancer un seul test
npx playwright test -g "Devrait démarrer le jeu solo"
```

---

## 📦 Structure des fichiers de tests

```
tests/
├── unit/                    # Tests unitaires backend
│   ├── Room.test.js         # (35 tests - Serveur)
│   └── SnakeServer.test.js
├── integration/             # Tests intégration backend
│   └── game-flows.test.js   # (24 tests - Flows complets)
├── unit-client/             # Tests unitaires frontend (NOUVEAU)
│   └── solo-game.test.js    # (15 tests - Classes client)
└── e2e/                     # Tests end-to-end (NOUVEAU)
    ├── solo-game.spec.js    # (10 tests - Mode solo)
    └── multiplayer.spec.js  # (10 tests - Multijoueur)
```

---

## ⚡ Commandes rapides

| Besoin | Commande |
|--------|----------|
| Tests rapides (backend) | `npm test` |
| Tests frontend uniquement | `npm run test:unit-client` |
| Tests E2E rapides | `npm run test:e2e` |
| Tests E2E avec UI | `npm run test:e2e:ui` |
| Tous les tests | `npm run test:all` |
| Couverture de code | `npm run test:coverage` |
| Watch mode | `npm run test:watch` |
| Debug E2E | `npm run test:e2e:debug` |

---

## 🎯 Prochaines étapes

### Phase 0 ✅ : Tests (TERMINÉ)

- ✅ Tests unitaires backend (35 tests existants)
- ✅ Tests intégration backend (24 tests existants)
- ✅ Tests unitaires frontend (15 tests créés)
- ✅ Tests E2E critiques (20 tests créés)

**Total : 94 tests**

### Phase 1 : Bundler (Prochain)

Une fois les tests en place, on peut commencer le refactoring en toute sécurité.

---

## 📚 Ressources

- **Jest** : https://jestjs.io/docs/getting-started
- **Playwright** : https://playwright.dev/docs/intro
- **JSDOM** : https://github.com/jsdom/jsdom

---

## ✅ Checklist avant refactoring

- [ ] Tous les tests backend passent (`npm test`)
- [ ] Tous les tests frontend passent (`npm run test:unit-client`)
- [ ] Tous les tests E2E passent (`npm run test:e2e`)
- [ ] Couverture de code > 70% (`npm run test:coverage`)
- [ ] Pas d'erreurs JavaScript dans les tests E2E
- [ ] Le serveur démarre sans erreur (`npm start`)
- [ ] L'interface web charge correctement (`npm run dev`)

**Si toutes les cases sont cochées → Le refactoring peut commencer ! 🚀**
