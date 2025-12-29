// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration Playwright pour tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',

  // Timeout pour chaque test
  timeout: 30 * 1000,

  // Nombre de tentatives en cas d'échec
  retries: process.env.CI ? 2 : 0,

  // Tests en parallèle
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Configuration partagée pour tous les projets
  use: {
    // URL de base pour les tests
    baseURL: 'http://localhost:8080',

    // Trace uniquement en cas d'échec
    trace: 'on-first-retry',

    // Screenshots
    screenshot: 'only-on-failure',

    // Vidéo
    video: 'retain-on-failure',
  },

  // Projets de test (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Décommentez pour tester sur d'autres navigateurs
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // Tests mobile
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Serveur web pour les tests
  webServer: {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
