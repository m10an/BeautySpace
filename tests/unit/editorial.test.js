import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarDays,
  completion,
  upcomingSessions,
} from "../../lib/editorial.js";
test("calendar presentation ranges cross leap days/year boundaries without UTC date shifts", () => {
  assert.deepEqual(calendarDays("2028-02-28", 3), [
    "2028-02-28",
    "2028-02-29",
    "2028-03-01",
  ]);
  assert.deepEqual(calendarDays("2026-12-31", 2), ["2026-12-31", "2027-01-01"]);
  for (const args of [
    ["2026-02-30", 7],
    ["2026-11-04", 0],
    ["2026-11-04", 32],
    ["2026-11-04", 1.5],
  ])
    assert.throws(() => calendarDays(...args));
});
test("consistency reports only actual completed tasks and handles an empty day", () => {
  assert.deepEqual(completion({ am: [], pm: [] }), {
    done: 0,
    total: 0,
    percent: 0,
  });
  const data = { am: [{ done: true }, { done: false }], pm: [{ done: true }] };
  const original = structuredClone(data);
  assert.deepEqual(completion(data), { done: 2, total: 3, percent: 67 });
  assert.deepEqual(data, original);
});
test("upcoming IPL summary excludes missed, completed and cancelled sessions without changing history", () => {
  const sessions = [
    { date: "2026-11-06", area: "Legs", status: "planned" },
    { date: "2026-11-04", area: "Arms", status: "planned" },
    { date: "2026-11-03", area: "Face", status: "planned" },
    { date: "2026-11-05", area: "Legs", status: "cancelled" },
    { date: "2026-11-04", area: "Legs", status: "completed" },
  ];
  const original = structuredClone(sessions);
  assert.deepEqual(
    upcomingSessions(sessions, "2026-11-04").map((s) => s.area),
    ["Arms", "Legs"],
  );
  assert.deepEqual(sessions, original);
});

test("all frontend consumers share a single versioned calendar controller and the offline cache includes it", async () => {
  const { readFileSync } = await import("node:fs");
  const html = readFileSync("index.html", "utf8");
  const main = html.match(/src="(\.\/app\.js\?v=\d+)"/)[1];
  for (const file of ["shell.js", "ai-client.js", "ipl.js"]) {
    const imported = readFileSync(file, "utf8").match(
      /from "(\.\/app\.js\?v=\d+)"/,
    )[1];
    assert.equal(
      imported,
      main,
      `${file} must not create a second calendar state controller`,
    );
  }
  assert.ok(
    readFileSync("sw.js", "utf8").includes(`"${main}"`),
    "calendar controller must be cached for offline use",
  );
});
