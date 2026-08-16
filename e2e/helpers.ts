import { expect, type Page } from '@playwright/test';

// Comptes de démonstration (voir api/.env — bloc #codes).
export const ACCOUNTS = {
  bamba: { login: 'bamba', pin: '1234' },
  fallou: { login: 'fallou', pin: '2345' },
  palaye: { login: 'palaye', pin: '3456' },
  jaz: { login: 'jaz', pin: '4567' },
} as const;

export async function login(page: Page, account: keyof typeof ACCOUNTS) {
  const { login: id, pin } = ACCOUNTS[account];
  await page.goto('/');
  await page.locator('#a-login').fill(id);
  await page.locator('#a-pin').fill(pin);
  await page.locator('#a-submit').click();
  // L'écran verrouillé disparaît une fois la session ouverte. Le hachage
  // argon2id est volontairement coûteux en CPU (résistance au brute-force) —
  // délai généreux pour absorber la latence d'un poste de caisse modeste.
  await expect(page.locator('body')).not.toHaveClass(/locked/, { timeout: 20_000 });
}

// Remplit et valide le modal générique de l'app (openFormModal côté front) —
// remplace prompt()/confirm() du navigateur, jamais utilisés dans l'UI (CDC §9.1).
export async function fillFormModal(page: Page, values: Record<string, string>) {
  await expect(page.locator('#form-modal-overlay')).toHaveClass(/show/, { timeout: 10_000 });
  for (const [id, value] of Object.entries(values)) {
    const field = page.locator(`#fm-${id}`);
    const tag = await field.evaluate((el) => el.tagName);
    if (tag === 'SELECT') await field.selectOption(value);
    else await field.fill(value);
  }
  await page.locator('#form-modal-confirm').click();
  await expect(page.locator('#form-modal-overlay')).not.toHaveClass(/show/, { timeout: 10_000 });
}

// Après un clic sur #pay-btn : la session de caisse peut déjà être ouverte
// (le modal de paiement s'affiche directement) ou non (le modal « fond de
// caisse » s'affiche d'abord) — les deux sont des issues valides selon
// l'état laissé par un test précédent dans la même suite.
export async function handleCashSessionPrompt(page: Page, fond = '10000') {
  await Promise.race([
    page.locator('#pay-overlay.show').waitFor({ state: 'visible', timeout: 15_000 }),
    page.locator('#form-modal-overlay.show').waitFor({ state: 'visible', timeout: 15_000 }),
  ]);
  const formModal = page.locator('#form-modal-overlay');
  if (await formModal.evaluate((el) => el.classList.contains('show'))) {
    await fillFormModal(page, { montant: fond });
    await expect(page.locator('#pay-overlay')).toHaveClass(/show/, { timeout: 15_000 });
  }
}
