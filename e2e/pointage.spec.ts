import { test, expect } from '@playwright/test';
import { login } from './helpers';

// Parcours CDC §9.3 : « Journée type de Pa Laye, du pointage au dernier client ».
test('un coiffeur pointe son arrivée depuis son espace personnel', async ({ page }) => {
  await login(page, 'palaye');
  await page.locator('.nav-item[data-view="team"]').click();

  const panel = page.locator('#real-staff-panel');
  await expect(panel).toContainText('Mon pointage', { timeout: 10_000 });

  const arriveeBtn = panel.getByRole('button', { name: "Pointer l'arrivée" });
  if (await arriveeBtn.isEnabled().catch(() => false)) {
    await arriveeBtn.click();
    await expect(panel.getByText(/Arrivé à|Journée terminée/)).toBeVisible({ timeout: 10_000 });
  } else {
    // Déjà pointé aujourd'hui (test relancé) — le panneau doit refléter l'état, pas planter.
    await expect(panel.getByText(/Arrivé à|Journée terminée/)).toBeVisible();
  }
});
