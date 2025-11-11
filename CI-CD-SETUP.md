# 🐍 Snake Ultra - CI/CD Setup

## Configuration Actuelle

### ✅ GitHub Actions Workflow
**Fichier**: `.github/workflows/tests.yml`

**Déclenchement**:
- Push sur `master`, `main`, `develop`, `feature/*`
- Pull requests vers `master`, `main`, `develop`

**Jobs**:

#### 1. 🧪 Test Job
- **Matrix**: Node.js 16.x, 18.x, 20.x
- **Actions**:
  - Checkout du code
  - Setup Node.js avec cache npm
  - Installation des dépendances (`npm ci`)
  - Exécution de tous les tests (`npm test`)
  - Génération du coverage (`npm run test:coverage`)
  - Archivage des rapports de coverage (7 jours)

#### 2. 🔍 Lint Job
- **Node.js**: 18.x
- **Actions**:
  - Vérification des `console.log` dans le code source
  - Bloque le workflow si des console.log sont détectés

#### 3. 📊 Coverage Check Job
- **Dépend de**: Test Job
- **Actions**:
  - Vérifie que les seuils de coverage sont respectés
  - Seuils configurés dans `jest.config.js`:
    - Global: 70% (statements, branches, functions, lines)
    - SnakeServer.js: 95% (seuil strict)

### ✅ Pre-Commit Hook
**Fichier**: `.git-hooks/pre-commit`

**Exécution automatique** avant chaque commit:

1. **Tests Unitaires** (77 tests)
   - SnakeServer: 40 tests
   - Room: 35 tests

2. **Tests d'Intégration** (24 tests)
   - Flows complets
   - Edge cases
   - Performance

3. **Vérification console.log**
   - Scanne les fichiers stagés
   - Bloque le commit si console.log détecté

**Temps d'exécution**: ~2 secondes

## Installation & Configuration

### Setup Initial (Déjà fait)
```bash
# Rendre le hook exécutable
chmod +x .git-hooks/pre-commit

# Configurer Git pour utiliser .git-hooks
git config core.hooksPath .git-hooks

# Vérifier la configuration
git config core.hooksPath
```

### Pour les Nouveaux Développeurs
Si quelqu'un clone le repo, il doit exécuter:
```bash
cd snake-ultra-v6
chmod +x .git-hooks/pre-commit
git config core.hooksPath .git-hooks
```

## Utilisation

### Commits Locaux
Le pre-commit hook se lance automatiquement:
```bash
git add .
git commit -m "feat: new feature"

# Output attendu:
# 🐍 Snake Ultra - Pre-Commit Tests
# 🧪 Running unit tests...
# ✅ Unit tests passed
# 🔗 Running integration tests...
# ✅ Integration tests passed
# 🔍 Checking for console.log...
# ✅ No console.log found
# ✅ All pre-commit checks passed!
```

### GitHub Actions
Les workflows se lancent automatiquement sur:
- Chaque push vers les branches principales
- Chaque pull request

**Voir les résultats**:
`https://github.com/[username]/snake-ultra/actions`

## Bypass des Hooks (Usage Exceptionnel)

⚠️ **À utiliser uniquement en cas d'urgence**:
```bash
git commit -m "message" --no-verify
```

## Statistiques

| Métrique | Valeur |
|----------|--------|
| **Tests totaux** | 101 |
| **Temps pre-commit** | ~2s |
| **Temps GitHub Actions** | ~3-4 min (3 versions Node) |
| **Branches testées** | master, main, develop, feature/* |
| **Seuil coverage** | 70% global, 95% SnakeServer |

## Maintenance

### Ajouter des Tests
Les nouveaux tests seront automatiquement inclus:
```bash
# Créer le test
touch www/tests/unit/nouveau.test.js

# Commit (les tests seront lancés)
git add .
git commit -m "test: add new tests"
```

### Modifier les Seuils de Coverage
Éditer `www/jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    statements: 70,  // Modifier ici
    branches: 65,
    functions: 70,
    lines: 70
  }
}
```

### Désactiver le Pre-Commit Hook
```bash
# Temporairement
git config core.hooksPath ""

# Réactiver
git config core.hooksPath .git-hooks
```

## Troubleshooting

### Le hook ne se lance pas
```bash
# Vérifier la configuration
git config core.hooksPath

# Reconfigurer
git config core.hooksPath .git-hooks
chmod +x .git-hooks/pre-commit
```

### Les tests échouent localement
```bash
# Tester manuellement
cd www
npm test

# Vérifier les logs détaillés
npm test -- --verbose
```

### GitHub Actions échoue
1. Vérifier les logs dans l'onglet Actions
2. Reproduire localement avec la même version de Node
3. Vérifier que tous les fichiers sont commités

## Architecture CI/CD

```
Développeur
    │
    ├──> git commit
    │         │
    │         └──> Pre-Commit Hook (local)
    │                  ├──> Tests unitaires (77)
    │                  ├──> Tests intégration (24)
    │                  └──> Check console.log
    │
    └──> git push
              │
              └──> GitHub Actions (remote)
                       ├──> Job Test (Node 16, 18, 20)
                       │     ├──> npm ci
                       │     ├──> npm test (101 tests)
                       │     └──> Coverage report
                       │
                       ├──> Job Lint
                       │     └──> console.log check
                       │
                       └──> Job Coverage Check
                             └──> Verify thresholds
```

## Badges (À ajouter dans README.md)

```markdown
![Tests](https://github.com/[username]/snake-ultra/workflows/🐍%20Snake%20Ultra%20-%20Tests%20CI/CD/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![Tests](https://img.shields.io/badge/tests-101%20passed-success)
```

---

**Dernière mise à jour**: 2025-11-11
**Version**: 1.0.0
**Status**: ✅ Production Ready
