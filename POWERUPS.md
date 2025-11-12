# 🎮 Power-ups Multijoueur - Snake Ultra V6

## Vue d'ensemble

Le système de power-ups ajoute une dimension stratégique au mode multijoueur avec 4 types de power-ups aux effets uniques. Chaque partie contient 2 power-ups actifs sur la grille qui se remplacent automatiquement lorsqu'ils sont ramassés.

## 4 Power-ups Disponibles

### 🔥 FIRE (Speed Boost)
- **Durée**: 5 secondes
- **Effet**: Vitesse x2 (140ms au lieu de 275ms)
- **Stratégie**: Idéal pour l'agression rapide ou la fuite
- **Visuel**: Serpent orange avec particules de feu animées
- **Contre**: Difficile à contrôler à haute vitesse

### ❄️ ICE (Slow)
- **Durée**: 8 secondes
- **Effet**: Vitesse ÷2 (550ms au lieu de 275ms)
- **Stratégie**: Contrôle précis, défense
- **Visuel**: Serpent cyan translucide
- **Contre**: Vulnérable aux attaques rapides
- **Note**: ROCK est immunisé contre ICE

### 👻 GHOST (Intangible)
- **Durée**: 6 secondes
- **Effet**: Traverse tout (serpents, obstacles)
- **Stratégie**: Évasion, repositionnement tactique
- **Visuel**: Serpent gris semi-transparent (opacité 60%)
- **Important**: Peut toujours manger de la nourriture et ramasser des power-ups

### 🪨 ROCK (Tank)
- **Durée**: 8 secondes
- **Effet**: Collision avec adversaire = mange 2 segments au lieu de mourir
- **Immunité**: Non affecté par ICE
- **Stratégie**: Agression directe, domination
- **Visuel**: Serpent marron avec bordure épaisse sur la tête

## Système de Spawn

- **Nombre**: 2 power-ups simultanés sur la grille
- **Distribution**: 25% de chance pour chaque type
- **Remplacement**: Automatique dès qu'un power-up est ramassé
- **Position**: Aléatoire sur la grille (évite les positions occupées)

## Collisions Améliorées

### Collision Tête-à-Tête 💥
Quand deux serpents se rencontrent face à face:
1. **Éjection latérale**: Les deux serpents tournent perpendiculairement (90°)
   - Player 1 tourne à gauche
   - Player 2 tourne à droite
2. **Dommage**: Le plus petit perd 1 segment
3. **Avancement**: Les deux serpents avancent de 2 cases
4. **Invincibilité**: 300ms pour éviter les collisions multiples
5. **Wrapping**: Gère automatiquement les bords de la grille

### Contact Queue 🍴
Quand un serpent touche la queue d'un adversaire:
1. **Vol continu**: 1 segment volé par seconde
2. **Maximum**: 5 segments maximum par contact
3. **Transfert**: L'attaquant grandit pendant que la victime rétrécit
4. **Interruption**: Le contact doit être maintenu (si perdu, le compteur reset)
5. **Élimination**: Si la victime n'a plus qu'1 segment, elle meurt

### Power-ups et Collisions

| Power-up | Collision Adversaire | Collision Queue | Auto-collision |
|----------|---------------------|-----------------|----------------|
| FIRE 🔥  | Meurt              | Vole 1/sec      | Meurt          |
| ICE ❄️   | Meurt              | Vole 1/sec      | Meurt          |
| GHOST 👻 | **Traverse**       | **Traverse**    | **Traverse**   |
| ROCK 🪨  | **Mange 2 seg.**   | Vole 1/sec      | Meurt          |

## Stratégies Recommandées

### Avec FIRE 🔥
- **Offensif**: Attaque rapide pour contact queue
- **Défensif**: Fuite et repositionnement
- **Risque**: Contrôle difficile, auto-collision facile

### Avec ICE ❄️
- **Offensif**: Piégeage et bloquage
- **Défensif**: Mouvements précis dans espaces restreints
- **Risque**: Vulnérable aux attaques FIRE

### Avec GHOST 👻
- **Offensif**: Traversée pour positionnement optimal
- **Défensif**: Évasion totale pendant 6s
- **Astuce**: Ramasser nourriture/power-ups en toute sécurité
- **Risque**: Expiration pendant engagement = mort

### Avec ROCK 🪨
- **Offensif**: Collision frontale intentionnelle
- **Défensif**: Immunité ICE
- **Combo**: Avec FIRE pour domination totale
- **Risque**: Auto-collision toujours active

## Interface Utilisateur

### Power-ups sur la grille
- **Fond coloré** avec 30% de transparence
- **Emoji centré** pour identification rapide
- **Couleurs distinctes** pour chaque type

### Indicateur actif (en haut de l'écran)
- **Format**: `🔥 FIRE 3.2s`
- **Bordure colorée** selon le type
- **Timer décroissant** en temps réel
- **Visible uniquement** pour le joueur local

### Effets visuels
- **FIRE**: Particules orange/rouge animées autour de la tête
- **ICE**: Opacité réduite (translucide)
- **GHOST**: Opacité 60% (semi-transparent)
- **ROCK**: Bordure épaisse marron sur la tête

## Stats de Partie

À la fin de chaque partie, les statistiques suivantes sont loggées:

```javascript
{
  duration: "45.3s",
  players: {
    "Player 1": {
      finalLength: 12,
      alive: true,
      powerupsCollected: 3,
      segmentsEaten: 8,
      segmentsLost: 2,
      headToHeadCollisions: 1
    },
    "Player 2": {
      finalLength: 5,
      alive: false,
      powerupsCollected: 2,
      segmentsEaten: 2,
      segmentsLost: 8,
      headToHeadCollisions: 1
    }
  }
}
```

## Équilibrage

### Durées
Les durées ont été équilibrées pour maintenir un gameplay dynamique:
- **FIRE (5s)**: Court pour limiter le chaos
- **ICE (8s)**: Long pour stratégies défensives
- **GHOST (6s)**: Moyen pour fenêtre d'évasion
- **ROCK (8s)**: Long pour domination contrôlée

### Vitesses
- **Normal**: 275ms (baseline)
- **FIRE**: 140ms (x1.96 plus rapide)
- **ICE**: 550ms (x2 plus lent)

Le game loop s'adapte automatiquement au tick rate le plus rapide parmi les joueurs actifs.

## Points d'Amélioration Future

1. **Power-ups additionnels**:
   - ⚡ LIGHTNING: Téléportation courte distance
   - 🛡️ SHIELD: 1 collision gratuite
   - 💎 DIAMOND: Double les points pendant 5s

2. **Modes de jeu**:
   - Power-ups uniquement (pas de nourriture)
   - Power-ups rares (spawn aléatoire toutes les 30s)
   - Power-ups chaos (4 actifs simultanément)

3. **Améliorations visuelles**:
   - Animations de transition
   - Effets sonores
   - Shake screen sur collision tête-à-tête

4. **Analytics**:
   - Taux de victoire par power-up
   - Graphiques de stats post-partie
   - Replay system

## Tests

Tous les systèmes sont couverts par des tests automatisés:

- **test-powerups.js**: Génération et distribution (4/4 tests)
- **test-powerup-effects.js**: Effets gameplay (6/6 tests)
- **test-collisions.js**: Collisions améliorées (4/4 tests)

Total: **14/14 tests passent** ✅

## Commandes de Test

```bash
# Lancer le serveur
cd www
node server.js

# Tester power-ups
node test-powerups.js

# Tester effets
node test-powerup-effects.js

# Tester collisions
node test-collisions.js
```

## Crédits

Système de power-ups multijoueur développé pour Snake Ultra V6.

- Architecture serveur/client
- WebSocket temps réel
- Canvas HTML5 pour le rendu
- Tests unitaires et d'intégration complets
