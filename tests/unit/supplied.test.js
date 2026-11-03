// Ported from the supplied ingredients.test.cjs; see docs/SUPPLIED-TESTS.md.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  analyzeInci,
  parseInci,
  validateDatabase,
  escapeHtml,
} from "../../lib/domain.js";
const db = validateDatabase(
  JSON.parse(
    readFileSync(
      new URL("../fixtures/supplied-ingredients-v2.json", import.meta.url),
    ),
  ),
);
const cases = [
  ["all unknown", "Mystery", 0, 1],
  ["all neutral", "Aqua, Glycerin", 2, 0],
  ["fragrance is recognized without numeric risk", "Parfum, Limonene", 2, 0],
  ["neutral and fragrance", "Aqua, Parfum", 2, 0],
  ["three names", "Aqua, Glycerin, Parfum", 3, 0],
  ["two fragrance names", "Aqua, Parfum, Limonene", 3, 0],
  ["duplicates retained", "Parfum," + Array(7).fill("Aqua").join(","), 8, 0],
  ["unknown remains in submitted total", "Aqua, Parfum, Mystery", 2, 1],
  ["duplicate fragrance names", "Parfum, Parfum, Aqua", 3, 0],
  ["aliases and normalization", " WATER , Fragrance, nIaCiNaMiDe.", 3, 0],
  [
    "numbering and delimiters",
    "Ingredients: 1. Aqua;2) Parfum\n3. Glycerin",
    3,
    0,
  ],
  ["historical note is not evidence", "Isopropyl Myristate, Aqua", 2, 0],
  ["alias and historical list", "Coconut Oil, Aqua", 2, 0],
  ["200 entries accepted", Array(200).fill("Aqua").join(","), 200, 0],
];
for (const [name, input, matched, unknown] of cases)
  test(`supplied: ${name}`, () => {
    const result = analyzeInci(input, db);
    assert.equal(result.matched, matched);
    assert.equal(result.unknown, unknown);
    assert.equal(result.total, matched + unknown);
    assert.equal(result.rated, 0);
    assert.equal(result.missingEvidence, matched + unknown);
  });
test("supplied: entry 201 produces an error, never a truncated report", () =>
  assert.throws(
    () => analyzeInci(Array(200).fill("Aqua").concat("Parfum").join(","), db),
    /200 ingredients/,
  ));
for (const input of ["", " ;,\n ", "Ingredients:"])
  test(`supplied: empty input ${JSON.stringify(input)}`, () =>
    assert.deepEqual(parseInci(input), []));
test("supplied: fragrance cautions never produce a comedogenicity level", () => {
  const r = analyzeInci("Parfum, Limonene, Isopropyl Myristate", db);
  assert.equal(r.rated, 0);
  assert.equal(r.entries[0].ingredient.comedogenicity.rating, null);
  assert.equal(r.entries[2].ingredient.comedogenicity.rating, null);
});
test("supplied: malicious input stays literal and can be HTML encoded", () => {
  const r = analyzeInci("<img src=x onerror=alert(1)>", db);
  assert.equal(r.entries[0].name, "<img src=x onerror=alert(1)>");
  assert.match(escapeHtml(r.entries[0].name), /^&lt;img/);
});
test("supplied: empty reference fails validation instead of a misleading zero", () =>
  assert.throws(() => validateDatabase([]), /Empty/));
test("supplied: malformed reference is rejected", () =>
  assert.throws(
    () =>
      validateDatabase([
        { name: "Aqua", category: "Solvent", note: "No schema" },
      ]),
    /Invalid/,
  ));
test("supplied: real expanded schema preserves all legacy descriptive fields", () => {
  const actual = validateDatabase(
    JSON.parse(
      readFileSync(new URL("../../ingredients-db.json", import.meta.url)),
    ),
  );
  for (const item of actual) {
    for (const key of ["name", "category", "note"])
      assert.ok(typeof item[key] === "string" && item[key].trim());
  }
  const r = analyzeInci("Aqua, Glycerin, Parfum, Missing Ingredient", actual);
  assert.equal(r.matched, 3);
  assert.equal(r.unknown, 1);
  assert.equal(r.rated, 0);
});
