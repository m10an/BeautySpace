import { validDate } from "./domain.js";
import { careSteps } from "./routine-plan.js";
export const BUILDER_DRAFT_KEY = "beautyjournal-builder-draft-v1";
export function validateBuilderDraft(value) {
  if (
    !value ||
    value.version !== 1 ||
    !Number.isInteger(value.stage) ||
    value.stage < 0 ||
    value.stage > 4
  )
    throw Error("Unsupported routine draft.");
  const f = value.fields;
  if (
    !f ||
    typeof f.product !== "string" ||
    f.product.length > 70 ||
    (f.product && !f.product.trim()) ||
    !Object.hasOwn(careSteps, f.step) ||
    !["am", "pm"].includes(f.time)
  )
    throw Error("Invalid routine draft fields.");
  if (
    !Array.isArray(f.weekdays) ||
    f.weekdays.length > 7 ||
    new Set(f.weekdays).size !== f.weekdays.length ||
    f.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
  )
    throw Error("Invalid draft weekdays.");
  for (const key of ["from", "until"])
    if (typeof f[key] !== "string" || (f[key] && !validDate(f[key])))
      throw Error("Invalid draft date.");
  if (f.from && f.until && f.until < f.from)
    throw Error("The draft end date must follow its start.");
  return {
    version: 1,
    stage: value.stage,
    fields: {
      product: f.product,
      step: f.step,
      time: f.time,
      weekdays: [...f.weekdays],
      from: f.from,
      until: f.until,
    },
  };
}
export function readBuilderDraft(storage = localStorage) {
  const raw = storage.getItem(BUILDER_DRAFT_KEY);
  return raw === null ? null : validateBuilderDraft(JSON.parse(raw));
}
export function saveBuilderDraft(value, storage = localStorage) {
  const valid = validateBuilderDraft(value);
  storage.setItem(BUILDER_DRAFT_KEY, JSON.stringify(valid));
  return valid;
}
