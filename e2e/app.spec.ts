import { expect, test, type Page } from '@playwright/test';

// Sichert das bestehende Verhalten der App-Hülle ab (Menü, Saison, Teilnehmer-Verwaltung).

async function nav(page: Page, name: string) {
  const burger = page.locator('main button:has(svg path[d^="M4 6h16"])');
  if (await burger.isVisible()) await burger.click();
  await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
}

test('alle öffentlichen Menüpunkte öffnen ohne Fehler', async ({ page }) => {
  const errors: string[] = [];
  // Vite-Live-Reload (HMR) hat im Test keinen Socket – kein App-Fehler
  page.on('pageerror', e => { if (!e.message.includes('WebSocket')) errors.push(e.message); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SKINFIT CUP' })).toBeVisible();
  for (const [item, heading] of [
    ['Reglement', /Reglement/], ['Events', /Events/], ['Strecken', /Strecken/],
    ['Gesamtwertung', /Gesamtwertung/], ['Technik', /Technik/], ['Überblick', /SKINFIT CUP/],
  ] as const) {
    await nav(page, item);
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
  }
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Teilnehmer' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Admin: Saison anlegen, Teilnehmer anlegen und löschen', async ({ page }, info) => {
  const errors: string[] = [];
  // Vite-Live-Reload (HMR) hat im Test keinen Socket – kein App-Fehler
  page.on('pageerror', e => { if (!e.message.includes('WebSocket')) errors.push(e.message); });
  const email = `admin-${info.project.name}@example.com`;
  await page.goto('/');
  const res = await page.request.post('/api/user/register', {
    data: { email, password: 'admin-e2e-123', firstName: 'Ad', lastName: `Min${info.project.name}`, birthYear: 1975, gender: 'M', perfClass: 'A' },
  });
  expect(res.ok()).toBeTruthy();
  await page.reload();

  // Saison anlegen → wird ausgewählt
  const year = info.project.name === 'desktop' ? '2031' : '2032';
  await page.getByRole('button', { name: /Neue Saison|^\+$/ }).click();
  await page.getByPlaceholder('z.B. 2026').fill(year);
  await page.getByRole('button', { name: 'Erstellen' }).click();
  await expect(page.locator('#season-select')).toHaveValue(year);

  // Teilnehmer anlegen
  await nav(page, 'Teilnehmer');
  await page.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByRole('heading', { name: 'Neuen Teilnehmer erstellen' })).toBeVisible();
  const last = `Testfahrer${info.project.name}`;
  await page.locator('#firstName').fill('Erika');
  await page.locator('#lastName').fill(last);
  await page.getByRole('button', { name: 'Speichern' }).click();
  const del = page.getByRole('button', { name: `Teilnehmer Erika ${last} löschen` });
  await expect(del).toBeVisible();

  // löschen mit Bestätigung
  page.once('dialog', d => d.accept());
  await del.click();
  await expect(del).toHaveCount(0);

  // Events-Ansicht der neuen Saison und Event-Dialog öffnen/schließen
  await nav(page, 'Events');
  await expect(page.getByRole('heading', { name: /Events/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
