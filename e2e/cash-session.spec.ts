import { test, expect } from '@playwright/test';
import { login, fillFormModal, handleCashSessionPrompt } from './helpers';

// Parcours CDC §9.3 : « Ouverture et clôture de caisse avec écart ».
test('ouverture puis clôture de caisse avec écart justifié', async ({ page }) => {
  await login(page, 'fallou');
  await page.locator('.nav-item[data-view="caisse"]').click();

  // Ouvre la session si besoin, en déclenchant le flux via un encaissement.
  await page.locator('#quick-serv .q-item').first().click();
  await page.locator('#assign-coiffeur').selectOption({ index: 1 });
  await page.locator('#pay-btn').click();
  await handleCashSessionPrompt(page);
  await page.locator('#pay-overlay .x-btn').click(); // referme sans encaisser, la session reste ouverte

  await page.locator('button:has-text("Clôturer la caisse")').click();
  // Comptage volontairement à 0 pour garantir un écart, quel que soit
  // l'historique réel de la session (les autres tests y encaissent aussi).
  await fillFormModal(page, { totalCompte: '0' });
  await fillFormModal(page, { motif: 'Test automatisé — écart volontaire' });
  await expect(page.getByText(/Caisse clôturée/)).toBeVisible({ timeout: 10_000 });
});
