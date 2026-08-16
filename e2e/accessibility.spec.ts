import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login, handleCashSessionPrompt } from './helpers';

// CDC §9.2 : contraste AA minimum, navigation clavier complète sur les
// écrans de caisse, libellés ARIA. On s'appuie sur axe-core (règles WCAG
// 2.1 AA) plutôt que sur un calcul de contraste manuel, plus fiable et
// exhaustif sur l'ensemble du DOM rendu.
test('écran de connexion — aucune violation WCAG 2.1 AA critique ou sérieuse', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

test('écran de caisse — aucune violation WCAG 2.1 AA critique ou sérieuse', async ({ page }) => {
  await login(page, 'fallou');
  await page.locator('.nav-item[data-view="caisse"]').click();
  await expect(page.locator('#view-caisse')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include('#view-caisse')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

test('paiement — la sélection du moyen de paiement est accessible au clavier', async ({ page }) => {
  await login(page, 'fallou');
  await page.locator('.nav-item[data-view="caisse"]').click();
  await page.locator('#quick-serv .q-item').first().click();
  await page.locator('#assign-coiffeur').selectOption({ index: 1 });
  await page.locator('#pay-btn').click();
  await handleCashSessionPrompt(page);

  // Les boutons de moyen de paiement doivent être de vrais <button>, donc
  // atteignables au Tab et activables au clavier sans souris.
  await page.locator('#pm-especes').focus();
  await expect(page.locator('#pm-especes')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#pm-especes')).toHaveClass(/sel/);
});

test('modal générique (remplace prompt/confirm) — aucune violation WCAG, navigable au clavier', async ({ page }) => {
  await login(page, 'fallou');
  await page.locator('.nav-item[data-view="stock"]').click();
  await page.getByRole('button', { name: 'Nouveau produit' }).click();
  await expect(page.locator('#form-modal-overlay')).toHaveClass(/show/, { timeout: 10_000 });

  const results = await new AxeBuilder({ page })
    .include('#form-modal-overlay')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);

  // Premier champ focusé automatiquement à l'ouverture, Échap annule sans
  // toucher au réseau (pas de produit créé).
  await expect(page.locator('#fm-nom')).toBeFocused();
  await page.locator('#form-modal-overlay .x-btn').click();
  await expect(page.locator('#form-modal-overlay')).not.toHaveClass(/show/);
});
