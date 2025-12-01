/**
 * Point d'entrée pour tous les contrôleurs UI
 * Exporte tous les modules de l'interface utilisateur
 */

// Contrôleurs existants
export { SoloController, soloController } from './solo-controller.js';
export { MultiController, multiController } from './multi-controller.js';
export { GameOverHandler, gameOverHandler } from './game-over-handler.js';
export { MenuController, menuController } from './menu-controller.js';

// Nouveaux modules (extraits de navigation.js)
export * from './settings.js';
export * from './difficulty.js';
export * from './controls.js';
export * from './menus.js';
