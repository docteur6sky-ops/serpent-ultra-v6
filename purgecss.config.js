/**
 * Configuration PurgeCSS pour Snake Ultra
 * Safelist générée automatiquement à partir de l'analyse du code JS
 */

module.exports = {
    // Fichiers à analyser pour trouver les classes utilisées
    content: [
        './www/**/*.html',
        './www/**/*.js'
    ],

    // Fichier CSS à purger
    css: ['./www/snake.css'],

    // Fichier de sortie
    output: './www/',

    // Safelist : classes à NE JAMAIS supprimer
    safelist: {
        // Classes exactes (strings)
        standard: [
            // === ÉTATS UI DE BASE ===
            'hidden', 'active', 'visible', 'show', 'fade-out', 'go',
            'disabled', 'enabled', 'loading', 'loaded', 'error',

            // === GAME OVER / RÉSULTATS ===
            'winner', 'loser', 'defeat', 'tie', 'victory',

            // === BOX / ITEMS ===
            'unlocked', 'locked', 'equipped', 'purchasable',
            'locked-preview', 'locked-skin', 'locked-banner', 'locked-background',

            // === RANGS ===
            'bronze', 'silver', 'gold', 'platinum', 'diamond',

            // === POWER-UPS (types dynamiques) ===
            'slow', 'double', 'invincible', 'ghost', 'lightning', 'ice', 'rock',

            // === DIFFICULTÉS ===
            'diff-disabled', 'diff-enabled',

            // === THÈME ===
            'dark-mode', 'light-mode',

            // === HUB ===
            'ready', 'active-glow', 'info-open', 'default',
            'hub-mode-card', 'hub-mode-card-large', 'hub-mode-icon', 'hub-mode-label',
            'mode-icon-img', 'hub-card-bg',

            // === ANIMATIONS COFFRE ===
            'chest-pulse', 'chest-opening', 'chest-card-exit', 'chest-card-reveal',
            'chest-card-landscape', 'chest-card-imageonly', 'chest-modal-closing',
            'chest-screen-shake', 'chest-screen-flash', 'chest-btn-appear',

            // === NOTIFICATIONS ===
            'trophy-notification', 'rank-notification', 'simple-notification',
            'success', 'info', 'warning',

            // === COUNTDOWN ===
            'countdown-visible', 'countdown-hidden',

            // === MODAL ===
            'modal-active', 'modal-closing',

            // === STATS ===
            'ia-mode'
        ],

        // Patterns REGEX pour classes dynamiques
        deep: [
            // Toutes les classes chest-*
            /^chest-/,

            // Toutes les classes mp-* (multiplayer)
            /^mp-/,

            // Toutes les classes box-*
            /^box-/,

            // Status badges
            /^status-badge/,

            // Boutons
            /^btn-/,

            // Cards
            /^card-/,

            // Overlays
            /^overlay-/,

            // Rooms (lobby)
            /^room-/,

            // Trophées
            /^trophy-/,

            // Rangs
            /^rank-/,

            // Règles
            /^rules-/,

            // Crédits
            /^credits-/,

            // Stats
            /^stat-/,

            // Progression
            /^progression-/,

            // Hub
            /^hub-/,

            // Mode cards
            /^mode-/,
            /mode-card/,

            // Game
            /^game-/,

            // Menu
            /^menu-/,

            // Diff (difficultés)
            /^diff-/,

            // Power-up indicators
            /^powerup-/,

            // Animations
            /^anim-/,
            /^fade-/,
            /^slide-/,

            // Center badges
            /^center-badge/,

            // Preview classes
            /-preview$/,

            // Rarity classes
            /^chest-rarity-/,
            /rarity-/,

            // Lobby
            /^lobby-/,

            // Leaderboard
            /^leaderboard-/,

            // Career
            /^career-/,

            // Loading
            /^loading-/,

            // Solo
            /^solo-/,

            // Multi
            /^multi-/,

            // AI
            /^ai-/,
            /^over-ai/,

            // Skin
            /^skin-/,

            // Banner
            /^banner-/,

            // Background
            /^background-/,

            // Empty states
            /^empty-/,

            // Modal
            /^modal-/,

            // Result
            /^result-/,

            // VS screen
            /^vs-/
        ],

        // Classes avec attributs (data-*, aria-*)
        greedy: [
            /data-/,
            /aria-/
        ]
    },

    // Variables CSS à préserver
    variables: true,

    // Keyframes à préserver
    keyframes: true,

    // Font faces à préserver
    fontFace: true,

    // Rejeter les sélecteurs invalides (évite les erreurs)
    rejected: true
};
