# 📋 PHASE 3 - ARCHITECTURE MVC : PLAN DÉTAILLÉ

**Date de création** : 2024-11-18
**Statut** : ⏸️ PLANIFIÉE (non démarrée)
**Prérequis** : ✅ Phases 0, 1, 2 terminées

---

## 🎯 Objectif global

Refactorer les fichiers monolithiques restants en appliquant une architecture MVC (Model-View-Controller) pour améliorer la séparation des responsabilités et la maintenabilité.

---

## 📊 Fichiers cibles

### Priorité 1 : Gros fichiers monolithiques

| Fichier | Lignes | Complexité | Impact | Priorité |
|---------|--------|------------|--------|----------|
| **navigation.js** | 1091 | 🔴 Haute | 🔥 Critique | **1** |
| **solo-game.js** | 891 | 🔴 Haute | 🔥 Critique | **2** |
| **multi-game.js** | 714 | 🟡 Moyenne | 🔥 Critique | **3** |
| network-multiplayer.js | 682 | 🟡 Moyenne | 🟢 Faible | 4 |

**Total à refactorer : ~3378 lignes**

### Réduction estimée

- **navigation.js** : 1091 → ~650 lignes (-40%)
- **solo-game.js** : 891 → ~550 lignes (-38%)
- **multi-game.js** : 714 → ~450 lignes (-37%)

**Gain total estimé : -1200 lignes (-35%)**

---

## 🏗️ Architecture MVC proposée

### Nouvelle structure de dossiers

```
www/
├── config/              # ✅ Déjà créé (Phase 2)
├── data/                # ✅ Déjà créé (Phase 2)
├── services/            # ✅ Déjà créé (Phase 2)
│
├── models/              # 🆕 NOUVEAU (Phase 3)
│   ├── GameState.js
│   ├── Player.js
│   ├── Career.js
│   └── Leaderboard.js
│
├── views/               # 🆕 NOUVEAU (Phase 3)
│   ├── MenuView.js
│   ├── GameView.js
│   ├── CareerView.js
│   └── ModalView.js
│
├── controllers/         # 🆕 NOUVEAU (Phase 3)
│   ├── NavigationController.js
│   ├── GameController.js
│   └── UIController.js
│
└── utils/               # 🆕 NOUVEAU (Phase 3)
    ├── dom.js
    ├── formatters.js
    └── validators.js
```

---

## 📋 Plan d'exécution détaillé

### Étape 1 : Analyse de navigation.js (1091 lignes)

**Objectif** : Identifier les responsabilités et préparer l'extraction

#### 1.1 Cartographie du code
- [ ] Lister toutes les fonctions (54+ fonctions globales)
- [ ] Identifier les variables globales
- [ ] Mapper les dépendances entre fonctions
- [ ] Identifier les patterns de manipulation DOM

#### 1.2 Catégorisation des fonctions

**Catégories attendues :**
- 🎮 **Gestion écrans** : showMenu, hideMenu, showGameSolo, etc.
- 🖼️ **Rendu UI** : showCareer, showRules, showCredits, etc.
- 🎯 **Logique métier** : updateCareer, checkTrophies, etc.
- 🔧 **Utilitaires DOM** : getElementSafely, openModal, closeModal, etc.

#### 1.3 Plan d'extraction

**Modules à créer :**

1. **controllers/NavigationController.js** (~300 lignes)
   - Gestion de la navigation entre écrans
   - Transitions d'états
   - Routing logique

2. **views/MenuView.js** (~200 lignes)
   - Affichage menu principal
   - Boutons et interactions
   - Mise à jour UI menu

3. **views/CareerView.js** (~200 lignes)
   - Affichage carrière/trophées
   - Statistiques
   - Progression XP/niveau

4. **views/ModalView.js** (~150 lignes)
   - Gestion des modales
   - Affichage contenu dynamique
   - Règles, crédits, paramètres

5. **utils/dom.js** (~100 lignes)
   - getElementSafely
   - Helpers DOM
   - Utilitaires réutilisables

**navigation.js refactoré** (~250 lignes)
- Initialisation
- Exports principaux
- Glue code

---

### Étape 2 : Refactoring de solo-game.js (891 lignes)

**Objectif** : Séparer logique de jeu et rendu

#### 2.1 Analyse

**Responsabilités actuelles :**
- Gestion du serpent (mouvement, collision)
- Gestion de la nourriture
- Gestion des power-ups
- Gestion des obstacles
- Rendu canvas
- Gestion du score/niveau
- Gestion du timer

#### 2.2 Plan d'extraction

**Modules à créer :**

1. **models/GameState.js** (~200 lignes)
   - État du jeu (running, paused, gameOver)
   - Score, niveau, timer
   - Power-ups actifs
   - Logique métier pure (pas de DOM)

2. **models/Player.js** (~150 lignes)
   - Données joueur
   - Statistiques de partie
   - Historique

3. **views/GameView.js** (~250 lignes)
   - Rendu canvas
   - Affichage score/niveau/timer
   - Animations visuelles
   - Séparé de la logique

4. **controllers/GameController.js** (~200 lignes)
   - Coordination Model ↔ View
   - Gestion des inputs
   - Boucle de jeu
   - Events handlers

**solo-game.js refactoré** (~100 lignes)
- Initialisation
- Export SoloSnakeGame
- Backward compatibility

---

### Étape 3 : Refactoring de multi-game.js (714 lignes)

**Objectif** : Factoriser avec solo-game.js et utiliser les mêmes models/views

#### 3.1 Analyse

**Différences avec solo-game.js :**
- Gestion multi-joueurs (2 serpents)
- Synchronisation WebSocket
- Score comparatif
- Timer de match

**Similitudes :**
- Rendu canvas (90% identique)
- Logique de jeu de base
- Power-ups, obstacles

#### 3.2 Plan d'extraction

**Modules à créer/réutiliser :**

1. **models/MultiplayerGameState.js** (~150 lignes)
   - Étend GameState
   - Gestion multi-joueurs
   - État des 2 serpents

2. **Réutiliser views/GameView.js**
   - Adapter pour 2 serpents
   - Factoriser code commun avec solo

3. **controllers/MultiplayerController.js** (~200 lignes)
   - Coordination multi-joueur
   - WebSocket handlers
   - Synchronisation état

**multi-game.js refactoré** (~100 lignes)
- Initialisation multi
- Export MultiplayerSnakeGame
- Backward compatibility

---

### Étape 4 : Extraction des utilitaires communs

**Objectif** : Créer des helpers réutilisables

#### Modules utilitaires

1. **utils/dom.js** (~100 lignes)
   ```javascript
   export function getElement(id) { ... }
   export function show(element) { ... }
   export function hide(element) { ... }
   export function toggleClass(element, className) { ... }
   ```

2. **utils/formatters.js** (~80 lignes)
   ```javascript
   export function formatTime(ms) { ... }
   export function formatScore(score) { ... }
   export function formatLevel(level) { ... }
   ```

3. **utils/validators.js** (~60 lignes)
   ```javascript
   export function isValidPseudo(pseudo) { ... }
   export function isValidDirection(direction) { ... }
   ```

---

## 🎯 Stratégie d'exécution

### Approche incrémentale (recommandée)

**Principe** : Refactorer 1 fichier à la fois, tester, commiter

**Ordre recommandé :**

1. **Jour 1 : navigation.js**
   - Matin : Analyse + extraction utils/dom.js
   - Après-midi : Extraction views/ (MenuView, CareerView, ModalView)
   - Soir : Extraction controllers/NavigationController.js
   - Tests : 110/110 doivent passer

2. **Jour 2 : solo-game.js**
   - Matin : Extraction models/ (GameState, Player)
   - Après-midi : Extraction views/GameView.js
   - Soir : Extraction controllers/GameController.js
   - Tests : Vérifier jeu solo fonctionne

3. **Jour 3 : multi-game.js + consolidation**
   - Matin : Extraction MultiplayerGameState + MultiplayerController
   - Après-midi : Factorisation code commun solo/multi
   - Soir : Tests complets + documentation

---

## 🧪 Stratégie de tests

### Tests après chaque extraction

**Checklist après chaque module créé :**

1. ✅ `npm test` → 110/110 tests passent
2. ✅ `npm run dev` → Serveur démarre sans erreur
3. ✅ Console navigateur → Aucune erreur
4. ✅ Tests manuels → Fonctionnalité testée fonctionne

### Tests spécifiques par fichier

**navigation.js :**
- [ ] Menu principal s'affiche
- [ ] Changement d'écrans fonctionne
- [ ] Modales s'ouvrent/ferment
- [ ] Carrière affiche trophées
- [ ] Boutons interactifs

**solo-game.js :**
- [ ] Jeu se lance
- [ ] Serpent se déplace
- [ ] Collision détectée
- [ ] Score augmente
- [ ] Level up fonctionne

**multi-game.js :**
- [ ] Connexion WebSocket
- [ ] 2 serpents affichés
- [ ] Synchronisation joueurs
- [ ] Fin de partie correcte

---

## 🎨 Patterns à appliquer

### 1. MVC Pattern

**Model** (models/)
- Données pures
- Logique métier
- Pas de DOM
- Pas de rendu

**View** (views/)
- Rendu uniquement
- Manipulation DOM
- Pas de logique métier
- Émet des events

**Controller** (controllers/)
- Coordination M ↔ V
- Gestion inputs
- Appels API/WebSocket
- Gestion d'état

### 2. Observer Pattern

**Exemple : GameState observable**

```javascript
// models/GameState.js
class GameState {
  constructor() {
    this.listeners = [];
    this.score = 0;
  }

  setScore(newScore) {
    this.score = newScore;
    this.notify('scoreChanged', newScore);
  }

  subscribe(event, callback) {
    this.listeners.push({ event, callback });
  }

  notify(event, data) {
    this.listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data));
  }
}

// controllers/GameController.js
const gameState = new GameState();
const gameView = new GameView();

gameState.subscribe('scoreChanged', (score) => {
  gameView.updateScore(score);
});
```

### 3. Factory Pattern

**Exemple : ViewFactory**

```javascript
// views/ViewFactory.js
export function createView(type, container) {
  switch (type) {
    case 'menu': return new MenuView(container);
    case 'game': return new GameView(container);
    case 'career': return new CareerView(container);
    default: throw new Error(`Unknown view: ${type}`);
  }
}
```

---

## ⚠️ Risques et mitigation

### Risques identifiés

1. **Régression fonctionnelle**
   - **Mitigation** : Tests automatiques + tests manuels après chaque module
   - **Backup** : Créer des backups avant chaque refactoring

2. **Dépendances circulaires**
   - **Mitigation** : Diagramme de dépendances avant extraction
   - **Solution** : Dependency injection si nécessaire

3. **Performance dégradée**
   - **Mitigation** : Profiler avant/après
   - **Benchmark** : Mesurer FPS du jeu

4. **Complexité accrue**
   - **Mitigation** : Documentation claire
   - **Convention** : Naming conventions strictes

---

## 📏 Critères de succès

### Critères techniques

- [ ] Tous les tests passent (110/110)
- [ ] Aucune erreur console navigateur
- [ ] Jeu fonctionne identiquement
- [ ] Performance ≥ version précédente

### Critères de qualité

- [ ] Réduction ≥ 30% code total
- [ ] Modules < 300 lignes chacun
- [ ] Séparation claire M/V/C
- [ ] Réutilisabilité code augmentée

### Critères de maintenabilité

- [ ] Documentation à jour
- [ ] Commentaires JSDoc
- [ ] README par dossier (models/, views/, controllers/)
- [ ] Diagramme d'architecture

---

## 📦 Livrables attendus

### Code

- [ ] 10-15 nouveaux modules ES6
- [ ] 3 fichiers refactorés (navigation, solo-game, multi-game)
- [ ] Réduction -1200 lignes total

### Documentation

- [ ] `PHASE-3-COMPLETE.md`
- [ ] `ARCHITECTURE.md` (diagrammes MVC)
- [ ] `models/README.md`
- [ ] `views/README.md`
- [ ] `controllers/README.md`

### Tests

- [ ] Tests unitaires pour nouveaux models
- [ ] Tests d'intégration M/V/C
- [ ] Tous les tests existants passent

---

## 🚀 Prêt à démarrer ?

### Pré-requis

- ✅ Phase 0, 1, 2 terminées
- ✅ Tests passent (110/110)
- ✅ Serveur dev fonctionne
- ✅ Documentation à jour

### Premier pas

**Commencer par navigation.js** :

1. Lancer l'analyse du fichier
2. Créer utils/dom.js
3. Extraire MenuView
4. Tester immédiatement

**Commande pour démarrer :**
```bash
# Option A : Lancer Phase 3 complète (2-3 jours)
# Option B : Commencer par navigation.js uniquement (1 jour)
```

---

## ❓ Questions à résoudre avant de commencer

1. **Backward compatibility** : Garder exports globaux ?
   - Réponse suggérée : Oui, créer des alias pour window.showMenu, etc.

2. **Tests E2E** : Activer Playwright maintenant ou plus tard ?
   - Réponse suggérée : Plus tard, focus sur refactoring d'abord

3. **TypeScript** : Commencer migration en Phase 3 ou attendre Phase 5 ?
   - Réponse suggérée : Attendre Phase 5, JS pur pour l'instant

4. **Router** : Implémenter en Phase 3 ou Phase 4 séparée ?
   - Réponse suggérée : Phase 4 séparée, trop de scope pour Phase 3

---

## 📊 Estimation de temps

| Tâche | Optimiste | Réaliste | Pessimiste |
|-------|-----------|----------|------------|
| **navigation.js** | 4h | 8h | 12h |
| **solo-game.js** | 4h | 8h | 12h |
| **multi-game.js** | 3h | 6h | 10h |
| **Utilitaires** | 2h | 4h | 6h |
| **Tests** | 2h | 4h | 8h |
| **Documentation** | 1h | 2h | 4h |
| **TOTAL** | **16h** | **32h** | **52h** |

**Estimation réaliste : 2-3 jours** (8h/jour)

---

## ✅ Validation finale Phase 3

**Phase 3 sera considérée terminée quand :**

1. ✅ Les 3 fichiers sont refactorés (navigation, solo-game, multi-game)
2. ✅ 10+ modules créés (models/, views/, controllers/, utils/)
3. ✅ Tous les tests passent (110/110 minimum)
4. ✅ Réduction ≥ 30% code (-1000+ lignes)
5. ✅ Jeu fonctionne identiquement
6. ✅ Documentation complète (PHASE-3-COMPLETE.md)
7. ✅ Commit git propre

---

**Date de création** : 2024-11-18
**Statut** : ⏸️ PLANIFIÉE
**Prêt à démarrer** : ✅ OUI
