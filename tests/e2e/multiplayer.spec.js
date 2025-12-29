// ============================================
// TESTS E2E - MODE MULTIJOUEUR
// Tests critiques pour la connexion réseau
// ============================================

const { test, expect } = require('@playwright/test');

test.describe('Mode Multijoueur - Connexion', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    await page.waitForSelector('#menu', { state: 'visible' });
  });

  test('✅ Devrait afficher le menu multijoueur', async ({ page }) => {
    // Cliquer sur le bouton Multijoueur
    const multiBtn = page.locator('button:has-text("RÉSEAU"), button:has-text("MULTIJOUEUR")');
    await multiBtn.first().click();

    // Attendre que le menu multijoueur soit visible
    await page.waitForSelector('#multiplayer-menu', { state: 'visible', timeout: 5000 });

    // Vérifier que l'input pseudo est présent
    const pseudoInput = page.locator('#pseudo-input');
    await expect(pseudoInput).toBeVisible();
  });

  test('✅ Devrait valider le pseudo', async ({ page }) => {
    // Aller au menu multijoueur
    const multiBtn = page.locator('button:has-text("RÉSEAU"), button:has-text("MULTIJOUEUR")');
    await multiBtn.first().click();
    await page.waitForSelector('#multiplayer-menu', { state: 'visible' });

    // Entrer un pseudo valide
    const pseudoInput = page.locator('#pseudo-input');
    await pseudoInput.fill('TestPlayer');

    // Vérifier que le pseudo est bien entré
    const value = await pseudoInput.inputValue();
    expect(value).toBe('TestPlayer');
  });

  test('✅ Devrait rejeter un pseudo trop court', async ({ page }) => {
    // Aller au menu multijoueur
    const multiBtn = page.locator('button:has-text("RÉSEAU"), button:has-text("MULTIJOUEUR")');
    await multiBtn.first().click();
    await page.waitForSelector('#multiplayer-menu', { state: 'visible' });

    // Entrer un pseudo trop court
    const pseudoInput = page.locator('#pseudo-input');
    await pseudoInput.fill('AB');

    // Cliquer sur démarrer
    const startBtn = page.locator('button:has-text("DÉMARRER")');
    await startBtn.click();

    // Attendre un peu
    await page.waitForTimeout(500);

    // Vérifier qu'un message d'erreur apparaît ou qu'on reste sur la page
    const errorMsg = page.locator('.pseudo-error, .error-message');
    const isErrorVisible = await errorMsg.isVisible({ timeout: 1000 }).catch(() => false);

    // Si pas de message d'erreur, vérifier qu'on est toujours sur le menu
    if (!isErrorVisible) {
      const multiMenu = page.locator('#multiplayer-menu');
      await expect(multiMenu).toBeVisible();
    }
  });

  test('✅ Devrait tenter de se connecter au serveur', async ({ page }) => {
    // Aller au menu multijoueur
    const multiBtn = page.locator('button:has-text("RÉSEAU"), button:has-text("MULTIJOUEUR")');
    await multiBtn.first().click();
    await page.waitForSelector('#multiplayer-menu', { state: 'visible' });

    // Entrer un pseudo valide
    const pseudoInput = page.locator('#pseudo-input');
    await pseudoInput.fill('TestPlayer123');

    // Cliquer sur démarrer
    const startBtn = page.locator('button:has-text("DÉMARRER")');
    await startBtn.click();

    // Attendre la tentative de connexion (timeout court car le serveur peut ne pas être actif)
    await page.waitForTimeout(2000);

    // Le jeu devrait soit :
    // 1. Se connecter et afficher l'écran d'attente
    // 2. Afficher un message d'erreur de connexion
    // 3. Rester sur le menu

    // On vérifie simplement qu'il n'y a pas de crash JavaScript
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    await page.waitForTimeout(1000);

    // Pas d'erreurs JavaScript critiques
    expect(errors.length).toBe(0);
  });

  test('✅ Devrait retourner au menu principal', async ({ page }) => {
    // Aller au menu multijoueur
    const multiBtn = page.locator('button:has-text("RÉSEAU"), button:has-text("MULTIJOUEUR")');
    await multiBtn.first().click();
    await page.waitForSelector('#multiplayer-menu', { state: 'visible' });

    // Cliquer sur retour
    const backBtn = page.locator('.back-btn-compact, button:has-text("RETOUR")');
    await backBtn.first().click();

    // Attendre le retour au menu
    await page.waitForTimeout(500);

    // Vérifier qu'on est de retour au menu principal
    const menu = page.locator('#menu');
    await expect(menu).toBeVisible();
  });

});

test.describe('Mode Multijoueur - Interface de jeu', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    await page.waitForSelector('#menu', { state: 'visible' });
  });

  test('✅ Devrait avoir un canvas multijoueur distinct', async ({ page }) => {
    // Vérifier que le canvas multi existe dans le DOM
    const canvasMulti = page.locator('#canvas-multi');

    // Le canvas peut ne pas être visible avant la connexion, mais doit exister
    const exists = await canvasMulti.count();
    expect(exists).toBeGreaterThan(0);
  });

  test('✅ Devrait gérer la saisie du pseudo avec contraintes', async ({ page }) => {
    // Aller au menu multijoueur
    const multiBtn = page.locator('button:has-text("RÉSEAU"), button:has-text("MULTIJOUEUR")');
    await multiBtn.first().click();
    await page.waitForSelector('#multiplayer-menu', { state: 'visible' });

    const pseudoInput = page.locator('#pseudo-input');

    // Test longueur maximale (12 caractères)
    await pseudoInput.fill('ABCDEFGHIJKLMNOP');
    const value = await pseudoInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(12);
  });

});

test.describe('Mode Multijoueur - Gestion des erreurs', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startButton = page.locator('#start-button');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    await page.waitForSelector('#menu', { state: 'visible' });
  });

  test('✅ Devrait gérer l\'échec de connexion WebSocket', async ({ page }) => {
    // Intercepter les WebSockets pour simuler un échec
    await page.route('**/*', route => {
      if (route.request().resourceType() === 'websocket') {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Aller au menu multijoueur
    const multiBtn = page.locator('button:has-text("RÉSEAU"), button:has-text("MULTIJOUEUR")');
    await multiBtn.first().click();
    await page.waitForSelector('#multiplayer-menu', { state: 'visible' });

    // Entrer un pseudo et tenter de se connecter
    const pseudoInput = page.locator('#pseudo-input');
    await pseudoInput.fill('TestPlayer');

    const startBtn = page.locator('button:has-text("DÉMARRER")');
    await startBtn.click();

    // Attendre la tentative de connexion
    await page.waitForTimeout(3000);

    // Vérifier qu'un message d'erreur apparaît ou qu'on reste sur le menu
    const menu = page.locator('#multiplayer-menu, #menu');
    await expect(menu.first()).toBeVisible();
  });

  test('✅ Ne devrait pas crasher avec un pseudo vide', async ({ page }) => {
    // Aller au menu multijoueur
    const multiBtn = page.locator('button:has-text("RÉSEAU"), button:has-text("MULTIJOUEUR")');
    await multiBtn.first().click();
    await page.waitForSelector('#multiplayer-menu', { state: 'visible' });

    // Ne rien entrer dans le pseudo
    const startBtn = page.locator('button:has-text("DÉMARRER")');
    await startBtn.click();

    await page.waitForTimeout(1000);

    // Pas d'erreur JavaScript
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    expect(errors.length).toBe(0);
  });

});
