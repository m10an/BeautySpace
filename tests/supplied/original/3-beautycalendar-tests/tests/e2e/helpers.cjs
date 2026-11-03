const { expect } = require('@playwright/test');
const fixture = require('../fixtures/ingredients.json');
async function prepare(page, { realDatabase = false } = {}) {
  await page.clock.install({ time: new Date('2026-11-03T12:00:00Z') });
  await page.addInitScript(() => { Math.random = () => 0.25; });
  // Explicit offline font mode avoids variable network and host-font downloads.
  await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//, r => r.abort());
  if (!realDatabase) await page.route('**/ingredients-db.json', r => r.fulfill({ json: fixture }));
  const loaded = page.waitForResponse('**/ingredients-db.json');
  await page.goto('/'); await loaded;
  // Ensure the response has been parsed by the application, not only received.
  await page.locator('[data-tab="ingredients"]').click();
  await page.locator('#inciInput').fill('Aqua');
  await expect(async () => {
    await page.locator('#inciAnalyze').click();
    await expect(page.locator('#inciResults')).toContainText('1 of 1 matched');
  }).toPass();
  await page.locator('#inciClear').click();
  await page.evaluate(() => document.fonts.ready);
}
async function analyze(page, text) {
  await page.locator('#inciInput').fill(text);
  await page.locator('#inciAnalyze').click();
}
module.exports = { prepare, analyze };
