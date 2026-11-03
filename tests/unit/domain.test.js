import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  normalize,
  escapeHtml,
  validDate,
  parseInci,
  validateDatabase,
  searchIngredients,
  findIngredient,
  analyzeInci,
  validateProduct,
  validateProcedure,
  validateLegacyBackup,
} from "../../lib/domain.js";
const db = JSON.parse(
  readFileSync(new URL("../../ingredients-db.json", import.meta.url)),
);
test("database has unique names and only explicit, unverified ratings", () => {
  assert.equal(validateDatabase(db), db);
  assert.ok(db.length > 100);
  assert.throws(() =>
    validateDatabase([
      {
        ...db[0],
        comedogenicity: {
          rating: 0,
          evidence: "not-established",
          sourceIds: [],
        },
      },
    ]),
  );
});
test("normalization handles case, dots, NFKC and whitespace", () =>
  assert.equal(normalize("  ＡＬＣＯＨＯＬ  Denat. "), "alcohol denat"));
test("full INCI matches and synonyms", () => {
  assert.equal(findIngredient("  water ", db).name, "Aqua");
  assert.equal(findIngredient("NIACINAMIDE", db).name, "Niacinamide");
});
test("partial name and synonym search", () => {
  assert.ok(searchIngredients("hyaluron", db).length >= 2);
  assert.ok(
    searchIngredients("vitamin e", db).some((i) => i.name === "Tocopherol"),
  );
});
test("empty, invalid and absent searches return no results", () => {
  for (const q of ["", null, {}, "not-an-ingredient"])
    assert.deepEqual(searchIngredients(q, db), []);
});
test("INCI parser accepts delimiters and preserves duplicates", () =>
  assert.deepEqual(parseInci("Ingredients: 1. Aqua; Glycerin\nAqua"), [
    "Aqua",
    "Glycerin",
    "Aqua",
  ]));
test("INCI parser rejects overly large and invalid input", () => {
  assert.throws(() => parseInci("a".repeat(20001)));
  assert.throws(() => parseInci(Array(202).fill("Aqua").join(",")));
  assert.throws(() => parseInci(null));
});
test("analysis distinguishes missing names and missing evidence", () => {
  const result = analyzeInci("Aqua, Unknown, Parfum", db);
  assert.equal(result.matched, 2);
  assert.equal(result.unknown, 1);
  assert.equal(result.rated, 0);
  assert.equal(result.missingEvidence, 3);
});
test("fragrance is never counted as comedogenic", () => {
  assert.equal(analyzeInci("Parfum, Linalool", db).rated, 0);
  assert.equal(findIngredient("Parfum", db).comedogenicity.rating, null);
});
test("HTML encoding blocks tags and attribute injection", () =>
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  ));
test("real calendar dates and leap years", () => {
  for (const d of ["2024-02-29", "2026-12-31"]) assert.ok(validDate(d));
  for (const d of [
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-01-01T00:00:00Z",
    "0000-01-01",
  ])
    assert.equal(validDate(d), false);
});
test("local dates remain correct across time zones and DST", () => {
  const module = new URL("../../lib/domain.js", import.meta.url).href;
  for (const [TZ, expected] of [
    ["Pacific/Kiritimati", "2026-03-09"],
    ["America/Los_Angeles", "2026-03-08"],
  ]) {
    const out = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import {localDate} from '${module}';console.log(localDate(new Date('2026-03-09T00:30:00Z')))`,
      ],
      { env: { ...process.env, TZ }, encoding: "utf8" },
    ).trim();
    assert.equal(out, expected);
  }
});
const procedure = {
  id: "legacy-1",
  name: "Mask",
  time: "pm",
  mode: "weekdays",
  weekdays: [0, 6],
  from: "2026-01-01",
  until: "",
  once: "",
};
test("procedure schedules reject impossible dates and weekday values", () => {
  validateProcedure(procedure);
  for (const change of [
    { weekdays: [] },
    { weekdays: [7] },
    { until: "2025-01-01" },
    { mode: "once", once: "2026-02-30" },
  ])
    assert.throws(() => validateProcedure({ ...procedure, ...change }));
});
test("products require valid fields and safe photos", () => {
  const p = {
    name: "My product",
    brand: "Brand",
    category: "skin",
    inci: "Aqua",
    photo: null,
  };
  validateProduct(p);
  for (const change of [
    { name: "" },
    { category: "fake" },
    { photo: "javascript:alert(1)" },
    { photo: "data:image/svg+xml;base64,xxx" },
  ])
    assert.throws(() => validateProduct({ ...p, ...change }));
});
test("legacy backup retains schedules, mood and checkmarks", () => {
  const input = {
    start: "2026-01-01",
    checks: { "2026-01-02|spf": true },
    customItems: [procedure],
    moods: { "2026-01-02": { note: "Saved mood", dryness: 2 } },
  };
  const x = validateLegacyBackup(input, {});
  assert.deepEqual(x.checks, input.checks);
  assert.equal(x.customItems[0].id, "legacy-1");
  assert.equal(x.moods["2026-01-02"].note, "Saved mood");
});
test("backup allowlist ignores unknown keys and dangerous active IDs", () => {
  const input = JSON.parse(
    '{"start":"2026-01-01","checks":{},"__proto__":{"polluted":true},"overrides":{"2026-01-01":["<img onerror=alert(1)>"]}}',
  );
  const x = validateLegacyBackup(input, {});
  assert.deepEqual(x.overrides, {});
  assert.equal({}.polluted, undefined);
  assert.equal(Object.hasOwn(x, "__proto__"), false);
});
test("backup rejects invalid procedure IDs before rendering", () =>
  assert.throws(() =>
    validateLegacyBackup(
      {
        start: "2026-01-01",
        checks: {},
        customItems: [{ ...procedure, id: '" onclick="alert(1)' }],
      },
      {},
    ),
  ));

test("one-off procedures ignore recurring start boundaries", async () => {
  const { procedureApplies } = await import("../../lib/domain.js");
  assert.equal(
    procedureApplies(
      { ...procedure, mode: "once", once: "2025-12-31" },
      "2025-12-31",
    ),
    true,
  );
});
test("recurrence respects inclusive ranges and weekday matching", async () => {
  const { procedureApplies } = await import("../../lib/domain.js");
  const p = { ...procedure, from: "2026-03-02", until: "2026-03-08" };
  assert.equal(procedureApplies(p, "2026-03-02"), true);
  assert.equal(procedureApplies(p, "2026-03-08"), true);
  assert.equal(procedureApplies(p, "2026-03-09"), false);
  assert.equal(procedureApplies(p, "2026-03-03"), false);
});
