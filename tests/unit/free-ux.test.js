import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { freeRoutine } from "../../lib/free-consultant.js";
import { fieldError, duplicateSchedule } from "../../lib/form-rules.js";
import {
  dailyInspiration,
  validateInspirations,
} from "../../lib/inspiration.js";
const interview = {
  startDate: "2026-11-04",
  skinType: "dry",
  sensitivity: "high",
  goals: ["hydration"],
  currentProducts: "Retinol and glycolic acid",
  moisturizer: "My cream",
};
test("free guide returns a strictly validated basic-care plan, labeled rules, using entered names", () => {
  const plan = freeRoutine(interview);
  assert.match(plan.summary, /Free local/);
  assert.ok(plan.items.some((x) => x.name === "My cream"));
  assert.ok(plan.items.every((x) => x.step !== "treat"));
  assert.match(plan.concerns.join(" "), /irritation/);
  assert.match(plan.limitations.join(" "), /not a generative AI/);
});
test("free guide escalates medical symptoms without proposing treatment", () => {
  const p = freeRoutine({ ...interview, alarmSymptoms: true });
  assert.equal(p.recommendMedical, true);
  assert.deepEqual(p.items, []);
});
test("free guide rejects invalid dates, whitespace product names and long inputs", () => {
  for (const patch of [
    { startDate: "2026-02-30" },
    { moisturizer: "   " },
    { cleanser: "x".repeat(71) },
  ])
    assert.throws(() => freeRoutine({ ...interview, ...patch }));
});
test("field validation handles required, optional whitespace, lengths, dates and numbers", () => {
  assert.match(fieldError({ value: "  ", required: true }), /required/);
  assert.match(fieldError({ value: "  " }), /meaningful/);
  assert.match(fieldError({ value: "abc", maxLength: 2 }), /2/);
  assert.match(fieldError({ type: "date", value: "2026-02-30" }), /date/);
  assert.match(fieldError({ type: "number", value: "7", max: "5" }), /range/);
  assert.equal(fieldError({ value: "" }), "");
});
const schedule = {
  id: "a",
  name: "My cream",
  time: "pm",
  mode: "weekdays",
  weekdays: [0, 3],
  from: "2026-01-01",
  until: "2026-12-31",
  once: "",
};
test("calendar duplicate guard detects overlapping date ranges and daily/once equivalence", () => {
  assert.equal(
    duplicateSchedule([schedule], { ...schedule, from: "2026-03-01" }),
    true,
  );
  assert.equal(
    duplicateSchedule([schedule], {
      ...schedule,
      from: "2027-01-01",
      until: "",
    }),
    false,
  );
  assert.equal(
    duplicateSchedule([schedule], { ...schedule, time: "am" }),
    false,
  );
  assert.equal(
    duplicateSchedule([schedule], {
      ...schedule,
      mode: "once",
      once: "2026-11-05",
    }),
    true,
  );
  assert.equal(duplicateSchedule([schedule], schedule, "a"), false);
});
// Synthetic contract data only, never shipped as source quotations.
const source = {
  file: "Buddhism Quotes (2755 quotes).pdf",
  status: "reviewed",
  sha256: "a".repeat(64),
  pageCount: 2,
};
const fixture = {
  version: 1,
  source,
  quotes: [0, 1].map((i) => ({
    id: "fixture" + i,
    text: "Synthetic fixture " + i,
    attributedAuthor: "Test attribution",
    sourcePage: i + 1,
    sourceSha256: source.sha256,
    reviewed: true,
  })),
};
test("approved daily rotation is deterministic and avoids adjacent-day repeats", () => {
  const a = dailyInspiration(fixture, "2026-11-04");
  assert.equal(a, dailyInspiration(fixture, "2026-11-04"));
  assert.notEqual(a, dailyInspiration(fixture, "2026-11-05"));
  assert.ok(fixture.quotes.includes(a));
});
test("inspiration gate rejects unrelated sources, missing PDF hash, bad pages and unreviewed excerpts", () => {
  for (const patch of [
    { source: { ...source, file: "other.pdf" } },
    { source: { ...source, sha256: null } },
    { quotes: [{ ...fixture.quotes[0], sourcePage: 3 }] },
    { quotes: [{ ...fixture.quotes[0], reviewed: false }] },
  ])
    assert.throws(() => validateInspirations({ ...fixture, ...patch }));
});
test("live dataset publishes no invented PDF excerpts while the attachment is absent", () => {
  const data = JSON.parse(readFileSync("inspiration.json"));
  validateInspirations(data);
  assert.equal(data.source.status, "awaiting-user-pdf");
  assert.equal(dailyInspiration(data, "2026-11-04"), null);
});
test("hosted billing integration is explicitly disabled in shipped public configuration", () => {
  const config = JSON.parse(readFileSync("runtime-config.json"));
  assert.equal(config.enableHostedAI, false);
  assert.equal(config.aiEndpoint, "");
});

test("free guide never schedules named active treatments as daily basic care", () => {
  assert.throws(
    () => freeRoutine({ ...interview, moisturizer: "Retinol cream" }),
    /active treatment/,
  );
  const plan = freeRoutine({
    ...interview,
    calendarSummary: "Retinol: Mon, Tue, Wed, Thu, Fri",
  });
  assert.match(plan.concerns.join(" "), /five or more days/);
});
