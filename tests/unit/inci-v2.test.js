import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseInci,
  findIngredient,
  searchIngredients,
  analyzeInci,
} from "../../lib/domain.js";
import {
  validateNames,
  validateEvidence,
  combineReference,
} from "../../lib/inci-reference.js";
const names = validateNames(
    JSON.parse(readFileSync("data/ingredient-names.json")),
  ),
  legacy = JSON.parse(readFileSync("ingredients-db.json")),
  db = combineReference(names, legacy);
test("licensed name catalog contains over 20,000 unique normalized entries", () => {
  assert.ok(names.entries.length > 20000);
  assert.equal(names.source.license, "MIT");
  assert.equal(names.source.commit.length, 40);
});
for (const [input, canonical] of [
  ["VASELINE", "Petrolatum"],
  ["petroleum jelly", "Petrolatum"],
  ["Olive Oil", "olea europaea fruit oil"],
  ["Grape Seed Oil", "vitis vinifera seed oil"],
  ["Grapeseed Oil", "vitis vinifera seed oil"],
  ["Olea Europaea (Olive) Fruit Oil", "olea europaea fruit oil"],
])
  test(`recognize ${input}`, () =>
    assert.equal(
      findIngredient(input, db).name.toLowerCase(),
      canonical.toLowerCase(),
    ));
test("bracketed aliases and partial names are separate from exact analysis", () => {
  assert.ok(findIngredient("Water (Aqua)", db));
  assert.ok(searchIngredients("grape seed", db).length);
  assert.equal(findIngredient("hyalur", db), undefined);
});
test("parenthetical commas are not treated as ingredient separators", () =>
  assert.deepEqual(parseInci("Aqua, Extract (leaf, stem), Glycerin"), [
    "Aqua",
    "Extract (leaf, stem)",
    "Glycerin",
  ]));
test("unknown ingredients never receive an invented numeric value", () => {
  const x = analyzeInci("Aqua, TotallyMadeUpIngredientZZZ", db);
  assert.equal(x.matched, 1);
  assert.equal(x.unknown, 1);
  assert.equal(x.rated, 0);
});
test("rating documents reject unsupported numeric scores and missing sources", () => {
  for (const score of [-1, 6, 2.5])
    assert.throws(() =>
      validateEvidence({
        version: 1,
        sources: {},
        ratings: [{ inci: "Aqua", score }],
      }),
    );
});
test("source-attributable test evidence is distinct from the name catalog", () => {
  const evidence = validateEvidence({
    version: 1,
    sources: {
      fixture: {
        url: "https://example.org/test-fixture",
        title: "TEST ONLY",
        citation: "Synthetic test evidence, not a published rating",
        reviewedAt: "2026-11-03",
      },
    },
    ratings: [
      {
        inci: "Aqua",
        score: 2,
        confidence: "low",
        model: "animal",
        method: "test fixture",
        concentration: "test only",
        sourceIds: ["fixture"],
      },
    ],
  });
  assert.equal(analyzeInci("Aqua", db, evidence).entries[0].rating.score, 2);
  assert.equal(analyzeInci("Aqua", db).entries[0].rating, null);
});
test("unknown prefixes and slash mixtures do not masquerade as a known ingredient", () => {
  assert.equal(findIngredient("Mystery (Aqua)", db), undefined);
  assert.equal(findIngredient("Mystery / Petrolatum", db), undefined);
  assert.ok(findIngredient("Aqua / Water / Eau", db));
});
test("chemical locant commas remain inside the INCI name", () =>
  assert.deepEqual(parseInci("Aqua, 1,2-Hexanediol, Glycerin"), [
    "Aqua",
    "1,2-Hexanediol",
    "Glycerin",
  ]));
test("unbalanced brackets are rejected instead of swallowing the remaining list", () =>
  assert.throws(
    () => parseInci("Aqua, Extract (leaf, Glycerin"),
    /parentheses/,
  ));
