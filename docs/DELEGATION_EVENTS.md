# 🎯 Système de Délégation d'Événements

## Pourquoi ?

Le système de délégation d'événements résout le problème des fonctions `onclick` qui nécessitent d'être exportées vers `window`.

### ❌ Ancienne méthode (problématique)

```html
<button onclick="audio.buttonClick();resetAllStats()">Reset</button>
```

**Problèmes :**
- Nécessite `window.resetAllStats = resetAllStats` (facile à oublier)
- Erreur "resetAllStats is not defined" si on oublie l'export
- Code audio dupliqué partout
- Mélange HTML et JavaScript

### ✅ Nouvelle méthode (recommandée)

```html
<button data-action="reset-stats">Reset</button>
```

**Avantages :**
- ✅ Pas besoin d'exporter vers window
- ✅ Audio géré automatiquement
- ✅ Un seul endroit pour gérer tous les événements
- ✅ Séparation HTML/JS claire
- ✅ Facile à débugger

## Comment utiliser

### 1. Dans le HTML

Remplacer :
```html
<button onclick="audio.buttonClick();showCareer()">Carrière</button>
```

Par :
```html
<button data-action="show-career">Carrière</button>
```

### 2. Ajouter l'action dans snake.js

Si tu crées une nouvelle fonction, ajoute-la dans l'objet `actions` :

```javascript
const actions = {
    'show-rules': showRules,
    'show-credits': showCredits,
    'show-career': showCareer,
    'reset-stats': resetAllStats,
    'ma-nouvelle-action': maNouvelleFunction,  // ← Ajouter ici
    // ...
};
```

### 3. Actions disponibles

| data-action | Fonction appelée |
|-------------|-----------------|
| `show-rules` | showRules() |
| `show-credits` | showCredits() |
| `show-career` | showCareer() |
| `reset-stats` | resetAllStats() |
| `close-modal` | closeModal() |
| `toggle-sound` | toggleSound() |
| `show-leaderboard` | showLeaderboardOverlay() |
| `show-trophies` | showTrophiesOverlay() |
| `close-overlay` | closeOverlay() |

## Migration progressive

**Les deux systèmes coexistent !**

- ✅ Les `onclick` existants continuent de fonctionner
- ✅ Les nouveaux boutons peuvent utiliser `data-action`
- ✅ Pas besoin de tout migrer d'un coup

**Recommendation :** Utiliser `data-action` pour tout nouveau code.

## Exemples de conversion

### Bouton simple

Avant :
```html
<button onclick="audio.buttonClick();showRules()">📖 Règles</button>
```

Après :
```html
<button data-action="show-rules">📖 Règles</button>
```

### Bouton avec classe

Avant :
```html
<button class="menu-btn" onclick="audio.buttonClick();showCareer()">
    🎮 Carrière
</button>
```

Après :
```html
<button class="menu-btn" data-action="show-career">
    🎮 Carrière
</button>
```

### Bouton de fermeture

Avant :
```html
<button class="overlay-close" onclick="audio.buttonClick();closeOverlay()">✖</button>
```

Après :
```html
<button class="overlay-close" data-action="close-overlay">✖</button>
```

## Débuggage

Si une action ne fonctionne pas :

1. Ouvre la console (F12)
2. Cherche le warning : `⚠️ Action non trouvée : nom-action`
3. Vérifie que l'action existe dans l'objet `actions` dans `snake.js`
4. Vérifie l'orthographe du `data-action` dans le HTML

## Avantages techniques

1. **Performance** : Un seul event listener au lieu de centaines
2. **Maintenabilité** : Toutes les actions dans un seul endroit
3. **Évolutivité** : Facile d'ajouter de nouvelles actions
4. **Cohérence** : Le son est toujours joué automatiquement
5. **Encapsulation** : Plus besoin de polluer l'objet `window`

## Migration recommandée

1. ✅ Les nouveaux boutons utilisent `data-action`
2. 🔄 Migrer progressivement les boutons existants
3. ⏰ À terme, supprimer les exports `window.*` inutilisés
