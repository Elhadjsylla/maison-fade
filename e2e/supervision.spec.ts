import { test, expect } from '@playwright/test';
import { login } from './helpers';

// Parcours CDC §9.3 : « Contrôle du soir par Bamba, depuis son téléphone,
// hors du salon » — on simule un viewport mobile plutôt qu'une vraie
// coupure réseau, ce que Playwright ne permet pas de garantir de façon fiable ici.
test.use({ viewport: { width: 390, height: 844 } });

test('Bamba consulte la supervision 360° depuis un mobile', async ({ page }) => {
  await login(page, 'bamba');
  // Le toast de bienvenue s'efface après 2,2 s — sur un petit viewport il
  // peut recouvrir la barre basse ; on le laisse disparaître avant de cliquer.
  await expect(page.locator('#toast')).not.toHaveClass(/show/, { timeout: 5_000 });
  // À largeur mobile, la navigation passe par la barre basse (#mnav), pas la
  // barre latérale desktop (CDC §9.2 — 5 entrées maximum en bas sur mobile).
  await page.locator('#mnav [data-view="admin"]').click();

  await expect(page.locator('#admin-hero')).toContainText('poste de commande', { timeout: 10_000 });
  await expect(page.locator('#admin-kpis .kpi').first()).toBeVisible();
  // Le panneau d'alertes réelles (GET /admin/360) doit se peupler sans erreur JS.
  await expect(page.locator('#admin-alerts')).not.toBeEmpty({ timeout: 10_000 });
});
