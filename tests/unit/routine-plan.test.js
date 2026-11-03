import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRoutineItem,
  appendCalendarItems,
} from "../../lib/routine-plan.js";
const draft = {
  product: "My cream",
  step: "hydrate",
  weekdays: [3, 0, 3],
  time: "pm",
  from: "2026-11-03",
  until: "",
};
function memory() {
  let value = JSON.stringify({
    start: "2026-01-01",
    checks: { "2026-01-01|spf": true },
    moods: { "2026-01-01": { note: "Keep" } },
    customItems: [
      {
        id: "old",
        name: "Original",
        time: "am",
        mode: "daily",
        weekdays: [],
        from: "2026-01-01",
        until: "",
        once: "",
      },
    ],
    extraUserField: "preserve",
  });
  return { getItem: () => value, setItem: (_, v) => (value = v) };
}
test("builder validates and normalizes the proposed days without writing", () => {
  const item = buildRoutineItem(draft);
  assert.equal(item.name, "Moisturize · My cream");
  assert.deepEqual(item.weekdays, [0, 3]);
});
test("confirmation is mandatory before any calendar mutation", () => {
  const storage = memory(),
    before = storage.getItem();
  assert.throws(
    () => appendCalendarItems([buildRoutineItem(draft)], { storage }),
    /confirmation/,
  );
  assert.equal(storage.getItem(), before);
});
test("confirmed additions retain existing schedules, checkmarks, notes and unknown fields", () => {
  const storage = memory();
  appendCalendarItems([buildRoutineItem(draft)], {
    storage,
    confirmed: true,
    uuid: () => "new",
  });
  const state = JSON.parse(storage.getItem());
  assert.equal(state.customItems.length, 2);
  assert.equal(state.customItems[0].id, "old");
  assert.equal(state.checks["2026-01-01|spf"], true);
  assert.equal(state.moods["2026-01-01"].note, "Keep");
  assert.equal(state.extraUserField, "preserve");
});
test("quota failure leaves the previous serialized record intact", () => {
  const storage = memory(),
    before = storage.getItem();
  storage.setItem = () => {
    throw Error("Quota");
  };
  assert.throws(
    () =>
      appendCalendarItems([buildRoutineItem(draft)], {
        storage,
        confirmed: true,
      }),
    /Quota/,
  );
  assert.equal(storage.getItem(), before);
});
test("corrupt original data is never silently replaced by a new plan", () => {
  let writes = 0;
  assert.throws(() =>
    appendCalendarItems([buildRoutineItem(draft)], {
      confirmed: true,
      storage: { getItem: () => "{broken", setItem: () => writes++ },
    }),
  );
  assert.equal(writes, 0);
});
test("invalid weekdays, dates and long labels fail before preview", () => {
  for (const change of [
    { weekdays: [] },
    { weekdays: [7] },
    { from: "2026-02-30" },
    { until: "2020-01-01" },
    { product: "x".repeat(100) },
  ])
    assert.throws(() => buildRoutineItem({ ...draft, ...change }));
});
test("duplicate schedule entries are rejected before writing", () => {
  const storage = memory(),
    item = buildRoutineItem(draft);
  appendCalendarItems([item], { storage, confirmed: true });
  const before = storage.getItem();
  assert.throws(
    () => appendCalendarItems([item], { storage, confirmed: true }),
    /identical/,
  );
  assert.equal(storage.getItem(), before);
});
