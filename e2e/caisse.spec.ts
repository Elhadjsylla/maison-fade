import { test, expect } from '@playwright/test';
import { login, fillFormModal, handleCashSessionPrompt } from './helpers';

// Parcours CDC §9.3 : « Client fidèle qui échange ses points sur un ticket
// avec remise » (échange de points hors scope V1 — voir simplifications
// actées) + « Encaissement complet » côté espèces (Wave nécessite un vrai
// paiement mobile money, non déclenchable depuis un test automatisé).
test('encaissement espèces avec création de client à la volée et remise', async ({ page }) => {
  const phone = `+221 77 ${100 + Math.floor(Math.random() * 800)} ${10 + Math.floor(Math.random() * 80)} ${10 + Math.floor(Math.random() * 80)}`;

  await login(page, 'fallou');
  await page.locator('.nav-item[data-view="caisse"]').click();
  await expect(page.locator('#view-caisse')).toBeVisible();

  await page.locator('#quick-serv .q-item').first().click();
  await expect(page.locator('#ticket-body')).toContainText('F');

  await page.locator('#assign-client').selectOption('new');
  await fillFormModal(page, { nom: 'Client Test E2E', telephone: phone });
  // La fermeture du modal ne garantit pas que l'appel réseau de création du
  // client (et l'affectation de currentClient) soit terminé — sans cette
  // attente, le ticket peut être créé sans clientId (couru trop tôt).
  await page.waitForFunction(
    () => (document.getElementById('assign-client') as HTMLSelectElement)?.selectedOptions[0]?.value !== 'new',
    { timeout: 10_000 },
  );

  const coiffeurOptions = await page.locator('#assign-coiffeur option').count();
  expect(coiffeurOptions).toBeGreaterThan(1);
  await page.locator('#assign-coiffeur').selectOption({ index: 1 });

  await page.locator('#discount').fill('5');

  await page.locator('#pay-btn').click();
  await handleCashSessionPrompt(page);

  await page.locator('#pm-especes').click();
  await page.locator('#cash-in').fill('20000');
  await page.getByRole('button', { name: /Valider l'encaissement/ }).click();

  await expect(page.getByText('Encaissé avec succès')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Points fidélité mis à jour')).toBeVisible();
});
