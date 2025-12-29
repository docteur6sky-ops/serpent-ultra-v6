# 🎮 CHECKLIST DE TESTS MANUELS - Phase 2

**Date** : 2024-11-18
**URL** : http://localhost:8080/
**Version** : Après refactoring Phase 2 (704 lignes)

---

## 🎯 Objectif

Valider que tous les modules importés fonctionnent correctement dans le navigateur après le refactoring de snake.js.

---

## ⚙️ Pré-requis

- [x] Serveur dev actif sur port 8080 ✅
- [x] Tests automatiques passent (110/110) ✅
- [x] Modules ES6 créés (4 fichiers) ✅

---

## 📋 Tests à effectuer

### 1️⃣ Console du navigateur (F12) - PRIORITÉ HAUTE

**Ouvrir la console AVANT de tester le jeu**

#### ✅ Vérifications console

- [ ] **Pas d'erreurs rouges** au chargement
- [ ] **Imports ES6 réussis** (aucun "Failed to load module")
- [ ] **Messages de démarrage attendus** :
  ```
  🐍 Snake Ultra - Deluxe Edition
  📦 Bundled with Vite
  ✅ All modules loaded
  ```

#### ❌ Erreurs à surveiller (NE DOIVENT PAS APPARAÎTRE)

- ❌ `CONFIG is not defined`
- ❌ `TROPHIES is not defined`
- ❌ `RANKS is not defined`
- ❌ `audio is not defined`
- ❌ `save is not defined`
- ❌ `load is not defined`
- ❌ `Failed to fetch module`
- ❌ `Uncaught TypeError`

#### ⚠️ Warnings acceptables

- ⚠️ `AudioContext was not allowed to start` (normal, disparaît après clic)

---

### 2️⃣ Menu principal

#### Interface

- [ ] Le menu s'affiche correctement
- [ ] Le titre "Snake Ultra" est visible
- [ ] Les boutons sont bien formés
- [ ] Le cercle de progression XP est affiché
- [ ] Le niveau du joueur est visible

#### Boutons de difficulté

- [ ] Bouton "😊 FACILE" affiché
- [ ] Bouton "😮 NORMAL" affiché
- [ ] Bouton "😈 DIFFICILE" affiché
- [ ] Cliquer sur chaque bouton → son "beep" joué ✅ **AUDIO MODULE**

#### Bouton Son

- [ ] Bouton "🔊 SON : ON" affiché
- [ ] Cliquer → passe à "🔇 SON : OFF"
- [ ] Cliquer à nouveau → repasse à "🔊 SON : ON"
- [ ] **Vérifier que les sons sont bien coupés quand OFF** ✅ **AUDIO SERVICE**

---

### 3️⃣ Mode Solo

#### Lancement

- [ ] Cliquer sur "JOUER SOLO"
- [ ] Le jeu se lance sans erreur
- [ ] Le canvas s'affiche
- [ ] Le serpent apparaît au centre

#### Contrôles clavier ✅ **CONFIG.KEYS MODULE**

- [ ] Flèche HAUT → serpent monte
- [ ] Flèche BAS → serpent descend
- [ ] Flèche GAUCHE → serpent va à gauche
- [ ] Flèche DROITE → serpent va à droite
- [ ] Touche P → pause le jeu
- [ ] Touche P à nouveau → reprend le jeu

#### Gameplay

- [ ] Le serpent se déplace automatiquement
- [ ] La nourriture (pomme 🍎) apparaît
- [ ] Manger la nourriture → **son "eat"** ✅ **AUDIO MODULE**
- [ ] Manger la nourriture → **score augmente**
- [ ] Manger la nourriture → **serpent grandit**
- [ ] Le crâne (☠️) apparaît
- [ ] Manger le crâne → **son "bad"** ✅ **AUDIO MODULE**
- [ ] Manger le crâne → **serpent rétrécit**

#### Level up

- [ ] Atteindre un niveau supérieur
- [ ] **Son "lvlup"** joué ✅ **AUDIO MODULE**
- [ ] Le niveau affiché est mis à jour
- [ ] La vitesse augmente (serpent plus rapide)

#### Power-ups (si apparaissent)

- [ ] Power-up apparaît (⚡, 🐌, ou 🛡️)
- [ ] Ramasser power-up → **son "powerup"** ✅ **AUDIO MODULE**
- [ ] Effet du power-up actif (lenteur, double points, invincibilité)

#### Obstacles

- [ ] Les obstacles (🧱) apparaissent après quelques niveaux
- [ ] Toucher un obstacle → **son "obstacle"** ✅ **AUDIO MODULE**
- [ ] Toucher un obstacle → **serpent meurt** ou **mur détruit**

#### Mort

- [ ] Se mordre la queue → **son "die"** ✅ **AUDIO MODULE**
- [ ] Écran de game over s'affiche
- [ ] Le score final est affiché
- [ ] Bouton "REJOUER" disponible

---

### 4️⃣ Système de carrière ✅ **TROPHIES & STORAGE MODULES**

#### Après une partie

- [ ] Ouvrir le menu "CARRIÈRE" (bouton dédié)
- [ ] Les statistiques sont affichées :
  - [ ] Niveau max atteint
  - [ ] Meilleur score
  - [ ] Parties jouées
  - [ ] Pommes mangées
  - [ ] Power-ups collectés
  - [ ] Murs détruits

#### Trophées ✅ **TROPHIES MODULE**

- [ ] La liste des trophées s'affiche
- [ ] Les trophées débloqués sont en couleur
- [ ] Les trophées verrouillés sont grisés
- [ ] Chaque trophée montre :
  - [ ] Nom
  - [ ] Emoji
  - [ ] Description
  - [ ] XP gagné
  - [ ] Rareté (étoiles)

#### Rangs ✅ **RANKS MODULE**

- [ ] Le rang actuel est affiché (Bronze, Argent, Or, etc.)
- [ ] La barre de progression XP fonctionne
- [ ] Le niveau joueur correspond au rang
- [ ] Les couleurs de rang sont correctes :
  - Bronze : #CD7F32
  - Argent : #C0C0C0
  - Or : #FFD700

#### Sauvegarde ✅ **STORAGE MODULE**

- [ ] Fermer le navigateur
- [ ] Rouvrir http://localhost:8080/
- [ ] **Les données sont conservées** :
  - [ ] Niveau joueur
  - [ ] XP total
  - [ ] Trophées débloqués
  - [ ] Meilleurs scores
  - [ ] Statistiques carrière

---

### 5️⃣ Mode Multijoueur (optionnel)

#### Menu multijoueur

- [ ] Cliquer sur "MULTIJOUEUR"
- [ ] Le menu multijoueur s'ouvre
- [ ] L'input pseudo fonctionne
- [ ] Les boutons sont cliquables

#### Connexion (si serveur WebSocket actif)

- [ ] Entrer un pseudo
- [ ] Cliquer "REJOINDRE"
- [ ] Connexion au serveur (ou message d'erreur)

---

### 6️⃣ Options et Menus secondaires

#### Menu Règles

- [ ] Cliquer sur "RÈGLES"
- [ ] Le contenu des règles s'affiche
- [ ] Les emojis sont visibles
- [ ] Bouton retour fonctionne

#### Menu Crédits

- [ ] Cliquer sur "CRÉDITS"
- [ ] Les crédits s'affichent
- [ ] Bouton retour fonctionne

---

## 🎯 Critères de succès

### ✅ Test RÉUSSI si :

1. **Aucune erreur rouge** dans la console
2. **Tous les sons fonctionnent** (beep, eat, die, lvlup, etc.)
3. **Les constantes sont chargées** (CONFIG, COLORS, KEYS)
4. **Les trophées s'affichent** correctement
5. **La sauvegarde fonctionne** (localStorage)
6. **Le jeu est jouable** de bout en bout
7. **Les modules ES6 sont importés** sans erreur

### ❌ Test ÉCHOUÉ si :

1. Erreurs JavaScript dans la console
2. Les sons ne jouent pas
3. Le jeu ne se lance pas
4. Les trophées ne s'affichent pas
5. La sauvegarde ne fonctionne pas
6. Imports de modules échouent

---

## 🐛 En cas de problème

### Si erreurs dans la console

1. **Copier l'erreur complète**
2. Vérifier quel module est concerné
3. Vérifier que les imports sont corrects dans `snake.js` :
   ```javascript
   import { CONFIG, ... } from './config/constants.js';
   import { createTrophies, RANKS } from './data/trophies.js';
   import { save, load } from './services/storage.js';
   import { audioService } from './services/audio.js';
   ```

### Si les sons ne fonctionnent pas

1. Vérifier que `audioService.init()` est appelé
2. Vérifier que `window.audio` existe (ouvrir console, taper `window.audio`)
3. Vérifier que `soundEnabled` est synchronisé avec `audioService`

### Si les trophées ne s'affichent pas

1. Vérifier que `createTrophies(career)` est appelé après la définition de `career`
2. Vérifier que `RANKS` est importé correctement
3. Vérifier dans la console : `console.log(TROPHIES)`

### Si la sauvegarde ne fonctionne pas

1. Vérifier que `save()` et `load()` sont importés
2. Vérifier localStorage (F12 → Application → Local Storage → localhost:8080)
3. Vérifier qu'il n'y a pas d'erreurs de sérialisation JSON

---

## 📊 Rapport de test

### Résumé

- **Date du test** : _____________
- **Navigateur** : _____________
- **Version du navigateur** : _____________

### Résultats

- [ ] ✅ Tous les tests passent
- [ ] ⚠️ Quelques problèmes mineurs (détailler ci-dessous)
- [ ] ❌ Problèmes critiques (détailler ci-dessous)

### Notes :

```
(Écrire vos observations ici)
```

---

## 🎉 Après les tests

Si tous les tests passent ✅, alors la **Phase 2 est validée en production** !

**Prochaines étapes possibles :**

1. **Phase 3** : Refactorer navigation.js, solo-game.js, multi-game.js
2. **Phase 4** : Implémenter un router pattern
3. **Phase 5** : Migration vers TypeScript
4. **Consolider** : Documenter et merger les changements

---

**Bonne chance pour les tests ! 🎮**
