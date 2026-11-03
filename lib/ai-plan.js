import { validDate, normalize } from "./domain.js";
export const aiSteps = ["cleanse", "hydrate", "protect", "treat", "other"];
const itemProperties = {
  name: { type: "string" },
  step: { type: "string", enum: aiSteps },
  time: { type: "string", enum: ["am", "pm"] },
  weekdays: {
    type: "array",
    items: { type: "integer", minimum: 0, maximum: 6 },
  },
  from: { type: "string" },
  until: { type: ["string", "null"] },
  reason: { type: "string" },
};
export const routineSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    version: { type: "integer", enum: [1] },
    summary: { type: "string" },
    limitations: { type: "array", items: { type: "string" } },
    concerns: { type: "array", items: { type: "string" } },
    recommendMedical: { type: "boolean" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: itemProperties,
        required: Object.keys(itemProperties),
      },
    },
  },
  required: [
    "version",
    "summary",
    "limitations",
    "concerns",
    "recommendMedical",
    "items",
  ],
};
function exact(value, keys) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    keys.some((k) => !Object.hasOwn(value, k))
  )
    throw Error("Plan does not match the required schema.");
}
function text(value, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw Error("Invalid plan text.");
  return value;
}
export function validateAIPlan(plan) {
  exact(plan, routineSchema.required);
  if (plan.version !== 1 || typeof plan.recommendMedical !== "boolean")
    throw Error("Unsupported AI plan version.");
  text(plan.summary, 1600);
  for (const key of ["limitations", "concerns"]) {
    if (!Array.isArray(plan[key]) || plan[key].length > 8)
      throw Error("Invalid plan notes.");
    plan[key].forEach((s) => text(s, 500));
  }
  if (
    !Array.isArray(plan.items) ||
    plan.items.length > 14 ||
    (!plan.recommendMedical && !plan.items.length)
  )
    throw Error("Plan needs between 1 and 14 care steps.");
  const duplicates = new Set();
  for (const item of plan.items) {
    exact(item, Object.keys(itemProperties));
    text(item.name, 70);
    text(item.reason, 500);
    if (
      !aiSteps.includes(item.step) ||
      !["am", "pm"].includes(item.time) ||
      !validDate(item.from) ||
      (item.until !== null &&
        (!validDate(item.until) || item.until < item.from))
    )
      throw Error("Invalid plan schedule.");
    if (
      !Array.isArray(item.weekdays) ||
      !item.weekdays.length ||
      item.weekdays.length > 7 ||
      new Set(item.weekdays).size !== item.weekdays.length ||
      item.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
    )
      throw Error("Invalid plan weekdays.");
    if (item.step === "treat" && item.weekdays.length > 3)
      throw Error(
        "AI treatment frequency exceeds the conservative limit. Use manual review.",
      );
    if (
      /\b(tretinoin|isotretinoin|adapalene|hydroquinone|antibiotic|corticosteroid)\b/i.test(
        item.name,
      )
    )
      throw Error("AI cannot add prescription treatment instructions.");
    const key = [
      normalize(item.name),
      item.time,
      ...[...item.weekdays].sort(),
      item.from,
    ].join("|");
    if (duplicates.has(key)) throw Error("Duplicate proposed care step.");
    duplicates.add(key);
  }
  return structuredClone(plan);
}
export function reviewActives(text) {
  const value = normalize(text),
    has = (terms) =>
      terms.some((t) =>
        new RegExp("(?:^|[^a-z])" + t + "(?:$|[^a-z])").test(value),
      );
  const retinoid = has([
    "retinol",
    "retinal",
    "adapalene",
    "tretinoin",
    "retinyl palmitate",
  ]);
  const acid = has([
    "glycolic acid",
    "salicylic acid",
    "lactic acid",
    "mandelic acid",
  ]);
  const warnings = [];
  if (retinoid && acid)
    warnings.push(
      "The supplied text mentions a retinoid and an exfoliating acid. Combining them may increase irritation; review frequency and any prescribed instructions.",
    );
  if (acid && has(["benzoyl peroxide"]))
    warnings.push(
      "The supplied text mentions an exfoliating acid and benzoyl peroxide. Review possible dryness or irritation before combining them.",
    );
  if (
    (value.match(/\b(retinol|retinal|adapalene|tretinoin)\b/g) || []).length > 1
  )
    warnings.push(
      "Several retinoid mentions were found. Check whether they represent separate products or repeated labels.",
    );
  return warnings;
}
