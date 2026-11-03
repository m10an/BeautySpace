const { test, expect } = require('@playwright/test');
const { prepare, analyze } = require('./helpers.cjs');

test.beforeEach(async ({ page }) => prepare(page));
for (const [label, text, counts, width] of [
  ['round down', 'Aqua, Glycerin, Parfum', '1 flagged / 3 recognized', '33%'],
  ['round up', 'Aqua, Parfum, Limonene', '2 flagged / 3 recognized', '67%'],
  ['unknown denominator', 'Aqua, Parfum, Mystery', '1 flagged / 2 recognized', '50%'],
  ['all unknown', 'Unlisted product', '0 flagged / 0 recognized', '0%'],
  ['all flagged', 'Parfum, Limonene', '2 flagged / 2 recognized', '100%'],
]) test(`INCI chart ${label}`, async ({ page }) => {
  await analyze(page, text);
  await expect(page.locator('.risk-visual')).toContainText(counts);
  await expect(page.locator('.risk-fill')).toHaveAttribute('style', `width:${width}`);
  const [fill, track] = await Promise.all([page.locator('.risk-fill').boundingBox(), page.locator('.risk-track').boundingBox()]);
  expect(Math.abs(fill.width - track.width * parseInt(width) / 100)).toBeLessThanOrEqual(1);
});
test('aliases, case, numbering, separators, clear and empty query', async ({ page }) => {
  await analyze(page, 'Ingredients: 1. WATER;2) Fragrance\n3. nIaCiNaMiDe.');
  await expect(page.locator('#inciResults')).toContainText('3 of 3 matched');
  await page.locator('#inciClear').click();
  await expect(page.locator('#inciInput')).toHaveValue('');
  await expect(page.locator('#inciResults')).toBeHidden();
  for (const text of ['', ' ;,\n ']) {
    await analyze(page, text);
    await expect(page.locator('#inciResults')).toHaveText('Please paste an INCI list first.');
  }
});
test('unknown and malicious query remain text', async ({ page }) => {
  await analyze(page, '<img src=x onerror=alert(1)>');
  await expect(page.locator('.inci-item')).toContainText('Unknown does not mean unsafe');
  await expect(page.locator('.inci-item img')).toHaveCount(0);
});
test('only first 200 entries are included', async ({ page }) => {
  await analyze(page, Array(200).fill('Aqua').concat('Parfum').join(','));
  await expect(page.locator('.inci-item')).toHaveCount(200);
  await expect(page.locator('.risk-visual')).toContainText('0 flagged / 200 recognized');
});
test('routine, hair, settings and journal survive reload without changing other keys', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('qa-unrelated', 'keep-me'));
  await page.locator('[data-tab="ritual"]').click();
  const check = page.locator('#todayRoutine input[data-key]').first();
  const key = await check.getAttribute('data-key');
  await check.check();
  await page.locator('[data-tab="settings"]').click();
  await page.locator('#startDate').fill('2026-10-01');
  await page.locator('#useNia').uncheck();
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#saveSettings').click();
  await page.locator('[data-tab="hair"]').click();
  await page.locator('#hairName').fill('QA deterministic mask');
  await page.locator('#hairAdd').click();
  await page.locator('[data-tab="prompts"]').click();
  await page.locator('#promptAnswer').fill('QA private reflection');
  await page.locator('#savePromptEntry').click();
  await expect(page.locator('#promptSaveStatus')).toContainText('Saved');
  const before = await page.evaluate(() => ({ ...localStorage }));
  await page.reload();
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  await page.locator('[data-tab="ritual"]').click();
  await expect(page.locator('#todayRoutine input[data-key]').first()).toBeChecked();
  expect(JSON.parse(before['girly-skincare-v1']).checks[key]).toBe(true);
  await page.locator('[data-tab="settings"]').click();
  await expect(page.locator('#startDate')).toHaveValue('2026-10-01');
  await expect(page.locator('#useNia')).not.toBeChecked();
  await page.locator('[data-tab="hair"]').click();
  await expect(page.locator('#hairProducts')).toContainText('QA deterministic mask');
  await page.locator('[data-tab="prompts"]').click();
  await expect(page.locator('#promptEntries')).toContainText('QA private reflection');
});

test('real ingredient database integration', async ({ page }) => {
  await page.unroute('**/ingredients-db.json');
  await page.reload();
  await page.locator('[data-tab="ingredients"]').click();
  await expect(async () => {
    await analyze(page, 'Aqua, Glycerin, Parfum, Missing Ingredient');
    await expect(page.locator('#inciResults')).toContainText('3 of 4 matched');
  }).toPass();
  await expect(page.locator('.risk-fill')).toHaveAttribute('style', 'width:33%');
});

test('database outage is visible', async ({ page }) => {
  await page.route('**/ingredients-db.json', r => r.fulfill({ status: 503, body: 'unavailable' }));
  await page.reload();
  await page.locator('[data-tab="ingredients"]').click();
  await expect(page.locator('#inciResults')).toContainText('Offline ingredient reference is not available');
});

test('mood entries and IndexedDB photos survive reload', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.locator('[data-tab="journal"]').click();
  await page.locator('#inflamed').selectOption('2');
  await page.locator('#moodNote').fill('QA mood note');
  await page.locator('#saveMood').click();
  // Synthetic one-pixel PNG, never a real user's photo.
  await page.locator('#photoInput').setInputFiles({ name: 'qa.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6XZsAAAAASUVORK5CYII=', 'base64') });
  await expect(page.locator('#photoGallery img')).toHaveCount(1);
  const src = await page.locator('#photoGallery img').getAttribute('src');
  await page.reload();
  await page.locator('[data-tab="journal"]').click();
  await expect(page.locator('#inflamed')).toHaveValue('2');
  await expect(page.locator('#moodNote')).toHaveValue('QA mood note');
  await expect(page.locator('#photoGallery img')).toHaveAttribute('src', src);
});
