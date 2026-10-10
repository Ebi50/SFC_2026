import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'training-e2e-123';

async function registerUser(page: Page, tag: string): Promise<string> {
  const email = `e2e-${tag}-${Date.now()}@example.com`;
  // eigener Request-Kontext: Registrierung ohne die Browser-Session einzuloggen
  const res = await page.context().request.fetch('/api/user/register', {
    method: 'POST',
    data: { email, password: PASSWORD, firstName: 'E2E', lastName: `Test${tag}${Date.now()}`, birthYear: 1985, gender: 'M', perfClass: 'A' },
  });
  expect(res.ok()).toBeTruthy();
  await page.context().request.post('/api/user/logout');
  await page.context().clearCookies();
  return email;
}

async function login(page: Page, email: string) {
  await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
}

test('/training ist öffentlich erreichbar und zeigt Hinweise, Plan und Katalog', async ({ page }) => {
  await page.goto('/training');
  await expect(page.getByRole('heading', { level: 1, name: 'Hüfte & Rücken' })).toBeVisible();
  await expect(page.getByText('Einloggen, um Fortschritt, Einstellungen und Verlauf geräteübergreifend zu speichern.')).toBeVisible();
  await expect(page.getByText(/ersetzen keine ärztliche oder physiotherapeutische Beratung/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Training starten/ })).toBeVisible();
  await expect(page.locator('[data-testid^="card-"]').first()).toBeVisible();

  // Demo-Häkchen bleibt nach dem Neuladen (localStorage)
  const firstCheck = page.locator('[data-testid^="card-"]').first().getByRole('button', { name: /Erledigt/ });
  await firstCheck.click();
  await expect(firstCheck).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('[data-testid^="card-"]').first().getByRole('button', { name: /Erledigt/ })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('tab', { name: 'Übungskatalog' }).click();
  await expect(page.locator('[data-testid^="catalog-"]')).toHaveCount(28);
  await page.getByRole('button', { name: 'Kraft', exact: true }).click();
  const strCount = await page.locator('[data-testid^="catalog-"]').count();
  expect(strCount).toBeGreaterThan(0);
  expect(strCount).toBeLessThan(28);

  // Keine Personenbezüge aus dem Original
  await expect(page.getByText(/Physio-Programm|wie vom Physio|28\.09\.2026/)).toHaveCount(0);
});

test('Timer startet, zeigt die erste Übung und lässt sich beenden', async ({ page }) => {
  await page.goto('/training');
  await page.getByRole('button', { name: /Training starten|Restliche|nochmal/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Bereit machen')).toBeVisible();
  await dialog.getByRole('button', { name: 'Pause' }).click();
  await expect(dialog.getByRole('button', { name: 'Fortsetzen' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Beenden' }).click();
  await expect(dialog).toBeHidden();
});

test('/training/plan leitet ohne Login zum Login um', async ({ page }) => {
  await page.goto('/training/plan');
  await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();
  const res = await page.request.get('/api/training/state?today=2026-10-10');
  expect(res.status()).toBe(401);
});

test('nach Login: abhaken, neu laden, Haken ist noch da; Demo-Daten werden übernommen', async ({ page }, info) => {
  const email = await registerUser(page, info.project.name);

  // im Demo-Modus etwas abhaken – wird beim ersten Login übernommen
  await page.goto('/training');
  await page.locator('[data-testid^="card-"]').first().getByRole('button', { name: /Erledigt/ }).click();

  await page.goto('/training/plan');
  await login(page, email);
  await expect(page).toHaveURL(/\/training\/plan$/);
  await expect(page.getByRole('tab', { name: 'Mein Tagesplan' })).toBeVisible();

  const card = page.locator('[data-testid^="card-"]').filter({ has: page.locator('button[aria-pressed="false"]') }).first();
  const testId = await card.getAttribute('data-testid');
  const check = card.getByRole('button', { name: /Erledigt/ });
  await expect(check).toHaveAttribute('aria-pressed', 'false');
  const saved = page.waitForResponse(r => r.url().includes('/api/training/log') && r.request().method() === 'PUT');
  await check.click();
  expect((await saved).ok()).toBeTruthy();

  await page.reload();
  await expect(page.locator(`[data-testid="${testId}"]`).getByRole('button', { name: /Erledigt/ })).toHaveAttribute('aria-pressed', 'true');

  // Verlauf: Demo-Eintrag + neuer Eintrag
  await page.getByRole('tab', { name: 'Verlauf' }).click();
  await expect(page.getByTestId('streak')).toHaveText('1');
  await expect(page.getByText('Übungen erledigt').locator('..')).toContainText('2');

  // Feedback (Phase 2) wird gespeichert
  await page.getByRole('tab', { name: 'Mein Tagesplan' }).click();
  const fb = page.waitForResponse(r => r.url().includes('/api/training/feedback'));
  await page.locator('[data-testid^="card-"]').first().getByRole('button', { name: 'zu schwer' }).click();
  expect((await fb).ok()).toBeTruthy();
  await expect(page.locator('[data-testid^="card-"]').first()).toContainText('etwas leichter');

  // Trainingsdaten löschen mit Bestätigung in der Oberfläche
  await page.getByRole('tab', { name: 'Meine Daten' }).click();
  await page.getByRole('button', { name: 'Trainingsdaten löschen' }).click();
  await page.getByRole('button', { name: 'Ja, löschen' }).click();
  await page.getByRole('tab', { name: 'Verlauf' }).click();
  await expect(page.getByText('Noch keine erledigten Übungen.')).toBeVisible();
});

test('Schriften kommen lokal, Menü hat die Kategorie Training', async ({ page }, info) => {
  const external: string[] = [];
  page.on('request', r => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) external.push(r.url()); });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(external).toEqual([]);
  // lädt die Schrift explizit – muss von /fonts/ kommen
  const loaded = await page.evaluate(async () => (await document.fonts.load('600 16px Oswald')).length);
  expect(loaded).toBeGreaterThan(0);
  expect(external).toEqual([]);

  if (info.project.name === 'mobile') await page.locator('button:has(svg path[d^="M4 6h16"])').first().click();
  await expect(page.getByRole('heading', { name: 'Training', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hüfte & Rücken' }).click();
  await expect(page).toHaveURL(/\/training$/);
});
