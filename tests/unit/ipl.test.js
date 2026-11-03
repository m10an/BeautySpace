import test from "node:test";
import assert from "node:assert/strict";
import {
  validateIPL,
  readIPL,
  saveIPL,
  sessionStatus,
  planIPL,
} from "../../lib/ipl.js";
const session = {
  id: "one",
  date: "2026-01-01",
  area: "Legs",
  settings: "Logged only",
  reaction: "None",
  notes: "Private",
  status: "planned",
};
const state = () => ({
  version: 1,
  device: { brand: "Example", model: "Exact model", instructions: "" },
  sessions: [{ ...session }],
});
test("IPL version validation and local roundtrip preserve session details", () => {
  let value = null;
  const storage = { getItem: () => value, setItem: (_, v) => (value = v) };
  assert.equal(readIPL(storage).version, 1);
  assert.throws(() => saveIPL(state(), { storage }), /confirmation/);
  saveIPL(state(), { storage, confirmed: true });
  assert.deepEqual(readIPL(storage), state());
});
test("IPL duplicates, impossible dates, versions and future completion rejected", () => {
  for (const bad of [
    { ...state(), version: 2 },
    {
      ...state(),
      sessions: [session, { ...session, id: "two", area: " legs " }],
    },
    { ...state(), sessions: [{ ...session, date: "2026-02-30" }] },
    {
      ...state(),
      sessions: [{ ...session, date: "2099-01-01", status: "completed" }],
    },
  ])
    assert.throws(() => validateIPL(bad));
});
test("missed is derived without overwriting recorded status", () => {
  assert.equal(sessionStatus(session, "2026-02-01"), "missed");
  assert.equal(session.status, "planned");
  assert.equal(sessionStatus({ ...session, status: "cancelled" }), "cancelled");
});
test("corrupt and quota-failed IPL data never report a successful save", () => {
  assert.throws(() => readIPL({ getItem: () => "{bad" }));
  assert.throws(
    () =>
      saveIPL(state(), {
        confirmed: true,
        storage: {
          setItem() {
            throw Error("Quota");
          },
        },
      }),
    /Quota/,
  );
});
test("unknown devices and unreviewed guidance cannot generate universal schedules", () => {
  assert.throws(
    () => planIPL({ brand: "Example", model: "Exact model" }),
    /unavailable/,
  );
  assert.throws(
    () =>
      planIPL({ brand: "Example", model: "Exact model" }, [
        {
          brand: "Example",
          model: "Exact model",
          reviewed: false,
          interval: 7,
        },
      ]),
    /unavailable/,
  );
});
test("contraindications and incomplete device implementations fail closed", () => {
  const catalog = [{ brand: "Example", model: "Exact model", reviewed: true }];
  assert.throws(
    () =>
      planIPL(
        { brand: "Example", model: "Exact model", tanning: true },
        catalog,
      ),
    /contraindications/,
  );
  assert.throws(
    () =>
      planIPL(
        {
          brand: "Example",
          model: "Exact model",
          tanning: false,
          irritation: false,
          photosensitivity: false,
          contraindicationsClear: true,
        },
        catalog,
      ),
    /not been implemented/,
  );
});
