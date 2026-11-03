const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../ingredients.js'), 'utf8');
const fixture = require('../fixtures/ingredients.json');

// Execute the unchanged production closure with only browser I/O replaced.
async function harness(db = fixture, fail = false) {
  const nodes = Object.fromEntries(['inciInput', 'inciResults', 'inciAnalyze', 'inciClear'].map(id => [id, {
    value: '', innerHTML: '', textContent: '', handlers: {}, hidden: true,
    classList: { remove() { nodes.inciResults.hidden = false; }, add() { nodes.inciResults.hidden = true; } },
    addEventListener(event, fn) { this.handlers[event] = fn; },
  }]));
  vm.runInNewContext(source, {
    document: { getElementById: id => nodes[id] },
    fetch: async () => ({ ok: !fail, json: async () => db }),
  });
  await new Promise(resolve => setImmediate(resolve));
  return { nodes, analyze(text) {
    nodes.inciInput.value = text;
    nodes.inciAnalyze.handlers.click();
    return nodes.inciResults.innerHTML;
  } };
}

// Literal, independently chosen expected values: no copy of the production formula.
const cases = [
  ['all unknown', 'Mystery', 0, 0, 0],
  ['all neutral', 'Aqua, Glycerin', 2, 0, 0],
  ['all flagged', 'Parfum, Limonene', 2, 2, 100],
  ['half flagged', 'Aqua, Parfum', 2, 1, 50],
  ['round down one third', 'Aqua, Glycerin, Parfum', 3, 1, 33],
  ['round up two thirds', 'Aqua, Parfum, Limonene', 3, 2, 67],
  ['half percent rounds upward', 'Parfum,' + Array(7).fill('Aqua').join(','), 8, 1, 13],
  ['unknown excluded from denominator', 'Aqua, Parfum, Mystery', 2, 1, 50],
  ['duplicates count separately', 'Parfum, Parfum, Aqua', 3, 2, 67],
  ['aliases and normalization', ' WATER , Fragrance, nIaCiNaMiDe.', 3, 1, 33],
  ['separators numbering and prefix', 'Ingredients: 1. Aqua;2) Parfum\n3. Glycerin', 3, 1, 33],
  ['note-based flag', 'Isopropyl Myristate, Aqua', 2, 1, 50],
  ['list phrase flag via alias', 'Coconut Oil, Aqua', 2, 1, 50],
  ['200 entries retained', Array(200).fill('Aqua').join(','), 200, 0, 0],
  ['201st entry excluded', Array(200).fill('Aqua').concat('Parfum').join(','), 200, 0, 0],
];
for (const [name, input, recognized, flags, percent] of cases) {
  test(name, async () => {
    const h = await harness();
    const html = h.analyze(input);
    assert.ok(html.includes(`${flags} flagged / ${recognized} recognized ingredients`), html);
    assert.ok(html.includes(`style="width:${percent}%"`), html);
    const label = flags === 0 ? 'No flagged matches' : flags <= 2 ? 'A few flagged matches' : 'Several flagged matches';
    assert.ok(html.includes(label));
  });
}
for (const input of ['', ' ;,\n ', 'Ingredients:']) {
  test(`empty input ${JSON.stringify(input)}`, async () => {
    const h = await harness();
    assert.equal(h.analyze(input), '<p>Please paste an INCI list first.</p>');
  });
}
test('three flags change qualitative label', async () => {
  assert.match((await harness()).analyze('Parfum, Limonene, Isopropyl Myristate'), /Several flagged matches/);
});
test('HTML query is escaped', async () => {
  const html = (await harness()).analyze('<img src=x onerror=alert(1)>');
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;img/);
});
test('empty database does not divide by zero', async () => {
  assert.match((await harness([])).analyze('Aqua'), /width:0%/);
});
test('failed database fetch exposes an error', async () => {
  const h = await harness([], true);
  assert.match(h.nodes.inciResults.textContent, /not available/);
});
test('clear hides the results and empties input', async () => {
  const h = await harness(); h.analyze('Aqua'); h.nodes.inciClear.handlers.click();
  assert.equal(h.nodes.inciInput.value, ''); assert.equal(h.nodes.inciResults.hidden, true);
});
test('real database schema, unique normalized names, and known independent example', async () => {
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, '../../ingredients-db.json')));
  const names = new Set();
  for (const record of db) {
    assert.deepEqual(Object.keys(record).sort(), ['category', 'name', 'note']);
    for (const value of Object.values(record)) assert.ok(typeof value === 'string' && value.trim());
    const normalized = record.name.toLowerCase().replace(/\s+/g, ' ').replace(/\./g, '').trim();
    assert.ok(!names.has(normalized), `Duplicate: ${normalized}`); names.add(normalized);
  }
  const html = (await harness(db)).analyze('Aqua, Glycerin, Parfum, Missing Ingredient');
  assert.match(html, /1 flagged \/ 3 recognized/); assert.match(html, /width:33%/);
});
