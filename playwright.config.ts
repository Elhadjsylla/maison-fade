import { defineConfig, devices } from '@playwright/test';

// Tests bout-en-bout sur les 5 parcours clés du CDC (§9.3) — s'appuie sur
// l'API et le frontend réels (npm run dev), pas de mocks. reuseExistingServer
// s'attache au serveur déjà lancé plutôt que d'en démarrer un second.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  // Un seul worker : l'API tourne sur un backend argon2id (volontairement
  // coûteux en CPU) partagé par tous les tests — les exécuter en parallèle
  // se traduit par de la contention CPU et des connexions qui expirent,
  // pas par une vraie défaillance applicative.
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4321',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 60_000,
    cwd: '.',
  },
});
