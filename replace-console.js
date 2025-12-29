const fs = require('fs');
const path = require('path');

const filesToModify = [
    'www/solo-game.js',
    'www/multi-game.js',
    'www/navigation.js',
    'www/AudioManager.js',
    'www/BackgroundManager.js',
    'www/ScreenManager.js',
    'www/TouchControls.js',
    'www/AppLifecycle.js',
    'www/render-utils.js',
    'www/network-multiplayer.js',
    'www/main.js',
    'www/services/audio.js',
    'www/services/storage.js',
    'www/snake.js'
];

console.log('🔄 Remplacement console.* → logger...\n');

filesToModify.forEach(filePath => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Vérifier si logger est déjà importé
        if (!content.includes("import { logger }") && !content.includes("from './services/logger.js'") && !content.includes("from './logger.js'")) {
            // Déterminer le chemin relatif correct
            let relativePath;
            if (filePath.startsWith('www/services/')) {
                relativePath = './logger.js';
            } else if (filePath.startsWith('www/managers/') ||
                       filePath.startsWith('www/core/') ||
                       filePath.startsWith('www/utils/')) {
                relativePath = '../services/logger.js';
            } else {
                relativePath = './services/logger.js';
            }

            // Ajouter l'import en début de fichier (après les commentaires initiaux)
            const lines = content.split('\n');
            let insertIndex = 0;

            // Trouver la fin des commentaires de début
            for (let i = 0; i < lines.length; i++) {
                if (!lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*') && lines[i].trim() !== '') {
                    insertIndex = i;
                    break;
                }
            }

            lines.splice(insertIndex, 0, `import { logger } from '${relativePath}';`);
            content = lines.join('\n');
            modified = true;
            console.log(`  ✅ Import ajouté dans ${filePath}`);
        }

        // Compter les occurrences AVANT remplacement
        const consoleLogCount = (content.match(/console\.log\(/g) || []).length;
        const consoleWarnCount = (content.match(/console\.warn\(/g) || []).length;
        const consoleErrorCount = (content.match(/console\.error\(/g) || []).length;
        const consoleDebugCount = (content.match(/console\.debug\(/g) || []).length;

        const totalBefore = consoleLogCount + consoleWarnCount + consoleErrorCount + consoleDebugCount;

        if (totalBefore > 0) {
            // Remplacer console.* par logger.*
            content = content.replace(/console\.log\(/g, 'logger.log(');
            content = content.replace(/console\.warn\(/g, 'logger.warn(');
            content = content.replace(/console\.error\(/g, 'logger.error(');
            content = content.replace(/console\.debug\(/g, 'logger.debug(');

            modified = true;
            console.log(`  ✅ ${filePath}: ${totalBefore} console.* remplacés`);
        }

        // Écrire le fichier modifié
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
        } else {
            console.log(`  ⏭️  ${filePath}: déjà à jour`);
        }

    } catch (error) {
        console.error(`  ❌ ERREUR avec ${filePath}:`, error.message);
    }
});

console.log('\n✅ Remplacement terminé !');
console.log('\n🧪 PROCHAINE ÉTAPE: Exécuter npm test pour valider');
