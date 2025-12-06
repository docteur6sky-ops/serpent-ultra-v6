import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  // Répertoire racine du projet
  root: './www',

  // Dossier public (assets copiés tels quels)
  publicDir: 'public',

  // Répertoire de sortie (relatif à root)
  build: {
    outDir: '../dist',
    emptyOutDir: true,

    // Minification avec terser (meilleure compression que esbuild)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer les console.log en production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },

    // Optimisation des chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Séparer en chunks logiques basés sur les noms de fichiers
          if (id.includes('AudioManager') || id.includes('BackgroundManager') ||
              id.includes('ScreenManager') || id.includes('AppLifecycle')) {
            return 'managers';
          }
          if (id.includes('solo-game')) {
            return 'game-solo';
          }
          if (id.includes('multi-game') || id.includes('network-multiplayer')) {
            return 'game-multi';
          }
          if (id.includes('snake.js') || id.includes('navigation') ||
              id.includes('render-utils') || id.includes('TouchControls')) {
            return 'core';
          }
        },
        // Noms de fichiers avec hash pour le cache
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Limite de taille pour les warnings
    chunkSizeWarningLimit: 500,

    // Source maps pour le debug (désactivé en production)
    sourcemap: false,
  },

  // Configuration du serveur de développement
  server: {
    port: 8080,
    open: true,
    strictPort: true,
    // Proxy pour les requêtes API vers le serveur backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // Configuration du serveur de prévisualisation
  preview: {
    port: 8080,
    strictPort: true,
  },

  // Plugins
  plugins: [
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          title: 'Snake Ultra - Deluxe Edition',
        },
      },
    }),

    // Support des anciens navigateurs (désactivé pour réduire la taille)
    // Décommenter si besoin de supporter IE11 ou anciens navigateurs
    // legacy({
    //   targets: ['defaults', 'not IE 11'],
    // }),
  ],

  // Optimisation des dépendances
  optimizeDeps: {
    include: [],
  },
});
