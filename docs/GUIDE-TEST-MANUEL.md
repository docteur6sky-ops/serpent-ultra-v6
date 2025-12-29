# 🧪 GUIDE DE TEST MANUEL - Phase 3 MVC

**Date** : 2025-11-22
**Objectif** : Valider que l'architecture MVC fonctionne correctement

---

## 🚀 Démarrage

### 1. Lancer le serveur de développement

```bash
cd "snake mobile Audit"
npm run dev
```

**Attendu** :
```
VITE v7.2.2  ready in 2424 ms
➜  Local:   http://localhost:8080/
```

### 2. Ouvrir le jeu

Ouvrir dans votre navigateur : **http://localhost:8080**

---

## ✅ Checklist de test

### 🎮 Menu Principal

- [ ] Le menu principal s'affiche correctement
- [ ] Les boutons sont cliquables
- [ ] La navigation entre menus fonctionne (Options, Difficulté, etc.)
- [ ] Le dark mode fonctionne (si implémenté dans l'UI)

### 🎯 Mode Solo

#### Démarrage
- [ ] Cliquer sur "Solo"
- [ ] Sélectionner une difficulté (Facile, Normal, Difficile)
- [ ] Cliquer sur "Jouer"
- [ ] Le jeu se lance sans erreur console

#### Gameplay
- [ ] Le serpent se déplace avec les flèches du clavier
- [ ] Le serpent mange les pommes
- [ ] Le score augmente
- [ ] Le niveau augmente après X pommes
- [ ] Les power-ups apparaissent
- [ ] Pause fonctionne (Escape ou bouton Pause)

#### Game Over
- [ ] Quand le serpent meurt, l'écran Game Over s'affiche
- [ ] **L'overlay de progression XP apparaît** ✨ (NOUVEAU MVC)
- [ ] Le niveau et l'XP s'affichent
- [ ] L'animation de level up fonctionne si applicable
- [ ] Cliquer sur "Suivant" affiche les stats finales

#### Stats finales
- [ ] Les stats de partie s'affichent correctement
- [ ] Score, niveau, temps, combo, etc.
- [ ] XP gagné s'affiche
- [ ] Si top score, la médaille s'affiche (🥇/🥈/🥉)

### 📊 Carrière

#### Navigation
- [ ] Aller dans Menu → Carrière
- [ ] Les statistiques s'affichent :
  - Total parties
  - Niveau joueur
  - XP actuel / XP max
  - Score total
  - Meilleur score
  - Pommes totales
  - etc.

#### Top 3
- [ ] Le classement Top 3 s'affiche
- [ ] Les 3 meilleurs scores apparaissent avec médailles
- [ ] Si aucun score, message "Aucun score enregistré"

### ⚙️ Paramètres

#### Son
- [ ] Menu → Options → Son
- [ ] Slider volume musique fonctionne
- [ ] Slider volume SFX fonctionne
- [ ] Toggle mute fonctionne
- [ ] Les paramètres sont sauvegardés (localStorage)

#### Autres
- [ ] Dark mode toggle fonctionne (si UI implémentée)
- [ ] Sélection langue fonctionne (si UI implémentée)
- [ ] Recalibrer niveau fonctionne

### 🎮 Mode Multi Local (si applicable)

- [ ] Mode multi local se lance
- [ ] 2 joueurs peuvent jouer simultanément
- [ ] Les contrôles fonctionnent (WASD + Flèches)
- [ ] Le jeu ne crash pas

---

## 🐛 Console du navigateur

### Ouvrir la console (F12)

**Vérifier** :
- [ ] Aucune erreur rouge ❌
- [ ] Message de confirmation MVC :
  ```
  ✅ MVC Bridge initialized successfully
  Available via window.__mvc for debugging
  ```

### Tester les modules MVC depuis la console

```javascript
// Vérifier que les modules MVC sont chargés
window.__mvc

// Devrait afficher :
// {
//   careerStats: CareerStats,
//   gameState: GameState,
//   careerView: CareerView,
//   gameController: GameController,
//   navigationController: NavigationController
// }
```

#### Tests carrière
```javascript
// Récupérer stats carrière
window.__mvc.careerStats.getStats()

// Récupérer leaderboard
window.__mvc.careerStats.getLeaderboard()
```

#### Tests niveau/XP
```javascript
// Niveau actuel
window.__mvc.gameState.getPlayerLevel()

// XP actuel
window.__mvc.gameState.getPlayerXP()

// Ajouter 500 XP (test)
window.__mvc.gameState.awardXP(500)
// Devrait afficher level up si XP suffisant
```

#### Tests paramètres
```javascript
// Volume musique
window.__mvc.gameState.getMusicVolume()

// Dark mode
window.__mvc.gameState.isDarkMode()

// Toggle dark mode
window.__mvc.gameState.toggleDarkMode()
```

---

## 🔍 Vérifications localStorage

### Ouvrir les DevTools → Application → Local Storage

**Clés à vérifier** :
- `careerStats` - Statistiques de carrière
- `leaderboard` - Top 3
- `playerLevel` - Niveau joueur
- `playerXP` - XP joueur
- `musicVolume` - Volume musique
- `sfxVolume` - Volume SFX
- `darkMode` - Thème
- `soundEnabled` - Son activé/désactivé

**Tester** :
- [ ] Jouer une partie solo
- [ ] Vérifier que `careerStats` et `leaderboard` sont mis à jour
- [ ] Vérifier que `playerXP` et `playerLevel` augmentent

---

## 🎯 Scénarios de test complets

### Scénario 1 : Première partie

1. Effacer localStorage (DevTools → Application → Clear storage)
2. Rafraîchir la page
3. Jouer une partie solo
4. Mourir volontairement
5. **Vérifier** :
   - [ ] Overlay XP s'affiche
   - [ ] XP gagné = score ÷ 5
   - [ ] Niveau joueur = 1
   - [ ] Stats finales s'affichent
   - [ ] Score sauvegardé dans Top 3
   - [ ] Carrière mise à jour

### Scénario 2 : Level Up

1. Jouer et scorer 500+ points
2. Mourir
3. **Vérifier** :
   - [ ] Animation "LEVEL UP!" s'affiche
   - [ ] Nouveau niveau s'affiche
   - [ ] Son de level up joue
   - [ ] XP overflow vers nouveau niveau

### Scénario 3 : Top 3

1. Jouer 3 parties avec des scores différents
2. Aller dans Carrière
3. **Vérifier** :
   - [ ] Top 3 affiche les 3 scores
   - [ ] Classés du meilleur au pire
   - [ ] Médailles 🥇🥈🥉 correctes

### Scénario 4 : Paramètres persistants

1. Menu → Options → Son
2. Changer volume musique à 0.7
3. Changer volume SFX à 0.8
4. Fermer le jeu (fermer onglet)
5. Rouvrir http://localhost:8080
6. **Vérifier** :
   - [ ] Volume musique = 0.7
   - [ ] Volume SFX = 0.8
   - [ ] Paramètres sauvegardés

---

## ⚠️ Problèmes connus à vérifier

### Si quelque chose ne marche pas :

#### Erreur console "Cannot read property..."
- Vérifier que tous les imports sont corrects
- Vérifier que `initMVCBridge()` est appelé
- Vérifier console pour messages MVC

#### Stats de carrière ne s'affichent pas
- Vérifier `careerView.render()` est appelé
- Vérifier container `#career-menu .career-content` existe
- Console : `window.__mvc.careerView.render()`

#### XP ne s'affiche pas après game over
- Vérifier overlay `#progression-overlay` existe dans HTML
- Vérifier `careerView.showProgressionOverlay()` est appelé
- Console : vérifier `window.lastGameStats`

#### Paramètres ne se sauvegardent pas
- Vérifier localStorage n'est pas désactivé (navigation privée)
- Console : `localStorage.getItem('musicVolume')`
- Vérifier `gameState.setMusicVolume()` est appelé

---

## 📋 Rapport de bug

Si vous trouvez un bug, noter :

**Contexte** :
- Navigateur : Chrome/Firefox/Safari
- Action effectuée :
- Résultat attendu :
- Résultat obtenu :

**Console** :
- Erreurs console (copier-coller)
- Screenshot si applicable

**localStorage** :
- État de localStorage au moment du bug

---

## ✅ Validation finale

**Le test est réussi si** :
- ✅ Aucune erreur console
- ✅ MVC bridge initialisé
- ✅ Jeu solo fonctionne
- ✅ Stats carrière s'affichent
- ✅ Top 3 fonctionne
- ✅ XP/niveau augmentent
- ✅ Paramètres se sauvegardent
- ✅ Navigation fluide

---

**Prêt à tester ?** Lancez `npm run dev` et suivez ce guide ! 🚀

**Questions** : Vérifier `PHASE-3-PROGRESS.md` pour détails techniques
