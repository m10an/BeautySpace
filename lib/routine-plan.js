import {
  validateProcedure,
  validateLegacyBackup,
  localDate,
} from "./domain.js";
import { duplicateSchedule } from "./form-rules.js";
export const careSteps = {
  cleanse: "Cleanse",
  tone: "Tone",
  hydrate: "Moisturize",
  treat: "Treatment",
  protect: "SPF",
  hair: "Hair care",
  other: "Care",
};
export function buildRoutineItem(draft) {
  if (
    !draft ||
    typeof draft.product !== "string" ||
    !draft.product.trim() ||
    !Object.hasOwn(careSteps, draft.step)
  )
    throw Error("Choose a product name and care step.");
  const name = `${careSteps[draft.step]} · ${draft.product.trim()}`;
  if (name.length > 90)
    throw Error(
      "Shorten the product name so the calendar label fits 90 characters.",
    );
  return validateProcedure({
    name,
    time: draft.time,
    mode: draft.mode || "weekdays",
    weekdays: [...new Set(draft.weekdays)].sort(),
    once: draft.once || "",
    from: draft.from,
    until: draft.until || "",
  });
}
export function appendCalendarItems(
  items,
  {
    confirmed = false,
    storage = globalThis.localStorage,
    today = localDate(),
    uuid = () => crypto.randomUUID(),
  } = {},
) {
  if (!confirmed) throw Error("Explicit confirmation is required.");
  if (!Array.isArray(items) || !items.length || items.length > 30)
    throw Error("Review between 1 and 30 care items.");
  const key = "girly-skincare-v1",
    raw = storage.getItem(key);
  const base = raw
    ? JSON.parse(raw)
    : {
        start: today,
        nia: true,
        bep: true,
        dailyAz: false,
        checks: {},
        overrides: {},
        moods: {},
        customItems: [],
        customOverrides: {},
      };
  validateLegacyBackup(base, { nia: true, bep: true, dailyAz: false });
  const additions = items.map((item) => {
    validateProcedure(item);
    return {
      id: uuid(),
      name: item.name,
      time: item.time,
      mode: item.mode,
      weekdays: [...item.weekdays],
      once: item.once || "",
      from: item.from,
      until: item.until || "",
    };
  });
  const reviewed = [...(base.customItems || [])];
  for (const item of additions) {
    if (duplicateSchedule(reviewed, item))
      throw Error(
        "An identical calendar entry already exists on an overlapping date. Review the proposal.",
      );
    reviewed.push(item);
  }
  const next = {
    ...base,
    customItems: [...(base.customItems || []), ...additions],
  };
  storage.setItem(key, JSON.stringify(next));
  return additions;
}
export function scheduleText(item) {
  return `${item.time === "am" ? "Morning" : "Evening"} · ${item.mode === "daily" ? "Every day" : item.mode === "once" ? item.once : item.weekdays.map((d) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d]).join(", ")} · from ${item.from}${item.until ? " until " + item.until : ""}`;
}
