const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const { prepare, analyze } = require('./helpers.cjs');
const tabs = ['calendar', 'hair', 'ritual', 'journal', 'insights', 'inspiration', 'prompts', 'settings', 'ingredients'];
test.beforeEach(async ({ page }) => prepare(page));

test('@audit layout: viewport, centering, seven columns and control overlaps', async ({ page }, info) => {
  const findings = [];
  for (const tab of tabs) {
    await page.locator(`[data-tab="${tab}"]`).click();
    if (tab === 'ingredients') await analyze(page, 'Aqua, Parfum, ' + 'VeryLongUnknownIngredient'.repeat(12));
    const result = await page.evaluate(tab => {
      const errors = [];
      const width = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > width + 1) errors.push('Horizontal document overflow');
      const app = document.querySelector('.app').getBoundingClientRect();
      if (Math.abs(app.left - (width - app.right)) > 1) errors.push('Application is not centered');
      const root = document.getElementById(tab);
      const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
      for (const el of root.querySelectorAll('button,input,select,textarea,.panel,.inci-item-head,strong')) {
        if (!visible(el)) continue;
        const box = el.getBoundingClientRect();
        if (box.left < -1 || box.right > width + 1) errors.push(`Outside viewport: ${el.id || el.className || el.tagName}`);
      }
      const controls = [...root.querySelectorAll('button,input,select,textarea')].filter(visible);
      for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
        const a = controls[i].getBoundingClientRect(), b = controls[j].getBoundingClientRect();
        if (Math.min(a.right,b.right)-Math.max(a.left,b.left)>2 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)
          errors.push(`Controls overlap: ${controls[i].id} / ${controls[j].id}`);
      }
      const grid = root.querySelector('.monthgrid,.hair-grid');
      if (grid && getComputedStyle(grid).gridTemplateColumns.split(' ').length !== 7) errors.push('Calendar must have seven columns');
      return errors;
    }, tab);
    findings.push(...result.map(message => ({ tab, message })));
  }
  await info.attach('layout-findings', { body: JSON.stringify(findings, null, 2), contentType: 'application/json' });
  expect(findings).toEqual([]);
});

test('@audit axe WCAG 2.2 AA, including color contrast, all screens', async ({ page }, info) => {
  const reports = [];
  for (const tab of tabs) {
    await page.locator(`[data-tab="${tab}"]`).click();
    if (tab === 'ingredients') await analyze(page, 'Aqua, Parfum');
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    reports.push({ tab, violations: result.violations, incomplete: result.incomplete });
  }
  await info.attach('axe-results', { body: JSON.stringify(reports, null, 2), contentType: 'application/json' });
  expect(reports.flatMap(r => r.violations.map(v => ({ tab: r.tab, id: v.id, nodes: v.nodes.map(n => n.target) })))) .toEqual([]);
});

test('font fallbacks and current design tokens', async ({ page }, info) => {
  const style = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    heading: getComputedStyle(document.querySelector('.ingredient-hero h2')).fontFamily,
    tokens: Object.fromEntries(['--bg', '--paper', '--ink', '--muted', '--line', '--accent'].map(k =>
      [k, getComputedStyle(document.documentElement).getPropertyValue(k).trim()])),
  }));
  expect(style.body).toContain('Times New Roman');
  expect(style.heading).toContain('GFS Didot');
  expect(style.tokens).toEqual({ '--bg': '#f8f7f3', '--paper': '#faf9f6', '--ink': '#231f1c', '--muted': '#736f6a', '--line': '#dcd9d3', '--accent': '#666e5f' });
});

test('@audit repeat-render visual stability', async ({ page }, info) => {
  const options = { animations: 'disabled', caret: 'hide', fullPage: true };
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  const first = await page.screenshot(options);
  await info.attach('first-render', { body: first, contentType: 'image/png' });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => window.scrollTo(0, 0));
  const second = await page.screenshot(options);
  await info.attach('current-render', { body: second, contentType: 'image/png' });
  expect(second.equals(first)).toBe(true);
});

test('@audit @baseline approved visual comparison', async ({ page }, info) => {
  const filename = 'ingredients.png';
  test.skip(!fs.existsSync(info.snapshotPath(filename)) && process.env.APPROVE_VISUAL_BASELINES !== '1', 'No reviewer-approved baseline exists; see docs/QA.md.');
  await expect(page).toHaveScreenshot(filename, { animations: 'disabled', caret: 'hide', fullPage: true });
});

test('@audit declared Google webfont import survives CSS parsing', async ({ page }, info) => {
  const imports = await page.evaluate(() => [...document.styleSheets].flatMap(sheet => {
    try { return [...sheet.cssRules].filter(rule => rule.type === CSSRule.IMPORT_RULE).map(rule => rule.href); }
    catch { return []; }
  }));
  await info.attach('parsed-font-imports', { body: JSON.stringify(imports), contentType: 'application/json' });
  // README V7 explicitly describes an online Google GFS Didot enhancement.
  // Network is blocked in this fixture; a valid @import should still exist in CSSOM.
  expect(imports.some(href => href.includes('fonts.googleapis.com'))).toBe(true);
});
