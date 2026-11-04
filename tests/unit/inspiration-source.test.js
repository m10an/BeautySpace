import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  dailyInspiration,
  validateInspirations,
  nextReadingDelay,
} from "../../lib/inspiration.js";
const data = JSON.parse(readFileSync("inspiration.json"));
test("each date in a full reading cycle maps to exactly one approved excerpt with its printed attribution and page", () => {
  const seen = new Set();
  for (let day = 1; day <= data.quotes.length; day++) {
    const date = `2026-11-${String(day).padStart(2, "0")}`,
      quote = dailyInspiration(data, date);
    assert.ok(data.quotes.includes(quote));
    assert.ok(!seen.has(quote.id));
    seen.add(quote.id);
    assert.equal(dailyInspiration(data, date), quote);
    assert.ok(quote.sourcePage >= 2 && quote.sourcePage <= 5);
    assert.ok(quote.text.length <= 100);
  }
  assert.equal(seen.size, 10);
});
test("rotation wraps within the approved PDF collection without adjacent-day repetition", () => {
  const a = dailyInspiration(data, "2026-11-04");
  assert.equal(a, dailyInspiration(data, "2026-11-14"));
  assert.notEqual(a, dailyInspiration(data, "2026-11-05"));
  assert.ok(data.quotes.some((q) => q.attributedAuthor === "Guatama Buddha"));
  assert.ok(!data.quotes.some((q) => q.attributedAuthor === "Albert Einstein"));
});
test("empty reviewed-source recovery cannot substitute an unrelated quote", () => {
  const empty = {
    version: 1,
    source: {
      file: "Buddhism Quotes (2755 quotes).pdf",
      status: "awaiting-user-pdf",
    },
    quotes: [],
  };
  assert.equal(dailyInspiration(empty, "2026-11-04"), null);
  assert.throws(() =>
    validateInspirations({
      ...data,
      source: { ...data.source, file: "unrelated.pdf" },
    }),
  );
});
test("the next reading is scheduled at the next local midnight, including leap-day rollover", () => {
  assert.equal(nextReadingDelay(new Date(2026, 10, 4, 23, 59, 59)), 1000);
  assert.equal(nextReadingDelay(new Date(2024, 1, 29, 23, 59, 59, 500)), 500);
  assert.throws(() => nextReadingDelay(new Date("invalid")));
});
test("local midnight scheduling respects 23-hour and 25-hour daylight-saving days", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    assert.equal(
      nextReadingDelay(new Date(2026, 2, 8, 0, 0, 0)),
      23 * 60 * 60 * 1000,
    );
    assert.equal(
      nextReadingDelay(new Date(2026, 10, 1, 0, 0, 0)),
      25 * 60 * 60 * 1000,
    );
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
