/**
 * Script de purge + minification CSS pour Snake Ultra
 * Usage: node purge-css.js
 */

const { PurgeCSS } = require('purgecss');
const postcss = require('postcss');
const cssnano = require('cssnano');
const fs = require('fs');
const path = require('path');

const config = require('./purgecss.config.js');

async function runPurge() {
    console.log('🧹 Démarrage du purge + minification CSS...\n');

    // Taille originale
    const originalPath = path.join(__dirname, 'www', 'snake.css');
    const originalSize = fs.statSync(originalPath).size;
    console.log(`📄 Fichier original: snake.css (${(originalSize / 1024).toFixed(1)} KB)`);

    try {
        // ÉTAPE 1: Purge CSS
        console.log('\n🔍 Étape 1: Purge des classes inutilisées...');
        const purgeCSSResult = await new PurgeCSS().purge({
            content: config.content,
            css: config.css,
            safelist: config.safelist,
            variables: config.variables,
            keyframes: config.keyframes,
            fontFace: config.fontFace
        });

        if (!purgeCSSResult || purgeCSSResult.length === 0) {
            console.error('❌ Erreur: Aucun résultat de purge');
            return;
        }

        const purgedCSS = purgeCSSResult[0].css;
        const purgedSize = Buffer.byteLength(purgedCSS, 'utf8');
        console.log(`   ✅ Après purge: ${(purgedSize / 1024).toFixed(1)} KB`);

        // ÉTAPE 2: Minification avec cssnano
        console.log('\n🗜️  Étape 2: Minification (suppression espaces/commentaires)...');
        const minifiedResult = await postcss([
            cssnano({
                preset: ['default', {
                    discardComments: { removeAll: true },
                    normalizeWhitespace: true,
                    minifySelectors: true,
                    minifyParams: true,
                    minifyFontValues: true,
                    colormin: true
                }]
            })
        ]).process(purgedCSS, { from: undefined });

        const minifiedCSS = minifiedResult.css;
        const minifiedSize = Buffer.byteLength(minifiedCSS, 'utf8');
        console.log(`   ✅ Après minification: ${(minifiedSize / 1024).toFixed(1)} KB`);

        // Écrire les fichiers
        const purgedPath = path.join(__dirname, 'www', 'snake.purged.css');
        const minPath = path.join(__dirname, 'www', 'snake.min.css');

        fs.writeFileSync(purgedPath, purgedCSS);
        fs.writeFileSync(minPath, minifiedCSS);

        // Résumé final
        const totalReduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        const savedKB = ((originalSize - minifiedSize) / 1024).toFixed(1);

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📊 RÉSUMÉ FINAL');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`   📄 Original:     snake.css        ${(originalSize / 1024).toFixed(1)} KB`);
        console.log(`   🧹 Purgé:        snake.purged.css ${(purgedSize / 1024).toFixed(1)} KB`);
        console.log(`   🗜️  Minifié:      snake.min.css    ${(minifiedSize / 1024).toFixed(1)} KB`);
        console.log('───────────────────────────────────────────────────────');
        console.log(`   📉 RÉDUCTION TOTALE: ${totalReduction}% (${savedKB} KB économisés)`);
        console.log('═══════════════════════════════════════════════════════');

        console.log('\n⚠️  Le fichier original snake.css n\'a PAS été modifié.');
        console.log('\n📋 PROCHAINE ÉTAPE:');
        console.log('   1. Teste visuellement le jeu (le serveur tourne sur localhost:3000)');
        console.log('   2. Si tout est OK, modifie index.html pour charger snake.min.css');
        console.log('   3. Supprime snake.purged.css (intermédiaire)');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

runPurge();
