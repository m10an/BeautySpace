import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateAIPlan, reviewActives } from "../../lib/ai-plan.js";
const fixture = JSON.parse(readFileSync("tests/fixtures/ai-plan.json"));
test("strict AI schema accepts the synthetic fixture without mutating it", () =>
  assert.deepEqual(validateAIPlan(fixture), fixture));
test("unknown plan fields, deletions and missing required properties are rejected", () => {
  assert.throws(() => validateAIPlan({ ...fixture, deleteExisting: true }));
  const x = structuredClone(fixture);
  delete x.limitations;
  assert.throws(() => validateAIPlan(x));
});
test("invalid schedules, duplicate weekdays, impossible dates and prescription additions fail", () => {
  for (const change of [
    { weekdays: [] },
    { weekdays: [1, 1] },
    { weekdays: [8] },
    { from: "2026-02-30" },
    { until: "2020-01-01" },
    { name: "Adapalene prescription" },
    { step: "treat", weekdays: [0, 1, 2, 3] },
  ]) {
    const plan = structuredClone(fixture);
    Object.assign(plan.items[0], change);
    assert.throws(() => validateAIPlan(plan));
  }
});
test("empty non-medical plans and duplicate steps are rejected", () => {
  assert.throws(() => validateAIPlan({ ...fixture, items: [] }));
  assert.throws(() =>
    validateAIPlan({ ...fixture, items: [fixture.items[0], fixture.items[0]] }),
  );
});
test("medical-review response may contain no calendar instructions", () =>
  assert.ok(validateAIPlan({ ...fixture, recommendMedical: true, items: [] })));
test("local overlap review is an explicit rule check, not a generated response", () => {
  assert.ok(
    reviewActives("Retinol, Glycolic Acid").some((s) =>
      s.includes("may increase irritation"),
    ),
  );
  assert.deepEqual(reviewActives("Aqua, Glycerin"), []);
  assert.ok(
    reviewActives("Retinol; Retinal").some((s) =>
      s.includes("Several retinoid"),
    ),
  );
});
