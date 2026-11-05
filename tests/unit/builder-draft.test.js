import test from "node:test";
import assert from "node:assert/strict";
import {
  validateBuilderDraft,
  readBuilderDraft,
  saveBuilderDraft,
  BUILDER_DRAFT_KEY,
} from "../../lib/builder-draft.js";
const draft = {
  version: 1,
  stage: 0,
  fields: {
    product: "",
    step: "hydrate",
    time: "pm",
    weekdays: [],
    from: "",
    until: "",
  },
};
test("incomplete versioned builder drafts can be saved without modifying calendar data", () => {
  const map = new Map([["girly-skincare-v1", "original-calendar"]]);
  const storage = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
  assert.equal(readBuilderDraft(storage), null);
  saveBuilderDraft(draft, storage);
  assert.deepEqual(readBuilderDraft(storage), draft);
  assert.equal(map.get("girly-skincare-v1"), "original-calendar");
  assert.deepEqual([...map.keys()], ["girly-skincare-v1", BUILDER_DRAFT_KEY]);
});
test("draft schema rejects bad versions, dates, weekday lists and whitespace without overwriting a valid record", () => {
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
  saveBuilderDraft(draft, storage);
  const before = map.get(BUILDER_DRAFT_KEY);
  const bad = [
    { ...draft, version: 2 },
    { ...draft, stage: 5 },
    ...["product", "step", "time", "weekdays", "from", "until"].map(
      (key, i) => ({
        ...draft,
        fields: {
          ...draft.fields,
          [key]: ["   ", "__proto__", "noon", [7], "2026-02-30", "invalid"][i],
        },
      }),
    ),
    { ...draft, fields: { ...draft.fields, weekdays: [1, 1] } },
    {
      ...draft,
      fields: { ...draft.fields, from: "2026-11-05", until: "2026-11-04" },
    },
  ];
  for (const value of bad)
    assert.throws(() => saveBuilderDraft(value, storage));
  assert.equal(map.get(BUILDER_DRAFT_KEY), before);
});
test("corrupt saved draft is reported and retained; extra fields never enter the canonical record", () => {
  const storage = { getItem: () => "{broken" };
  assert.throws(() => readBuilderDraft(storage));
  assert.deepEqual(
    validateBuilderDraft({
      ...draft,
      unexpected: "drop",
      fields: { ...draft.fields, unknown: "drop" },
    }),
    draft,
  );
});
