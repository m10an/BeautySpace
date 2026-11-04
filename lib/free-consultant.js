import { validateAIPlan, reviewActives } from "./ai-plan.js";
import { validDate } from "./domain.js";
export function freeRoutine(input) {
  if (!input || !validDate(input.startDate))
    throw Error("Choose a valid plan start date.");
  const text = [
    "currentProducts",
    "actives",
    "morning",
    "evening",
    "constraints",
    "preferences",
  ]
    .map((k) => input[k] || "")
    .join(" ");
  const concerns = reviewActives(text);
  const frequent = (input.calendarSummary || "")
    .split("\n")
    .filter(
      (line) =>
        /retinol|retinal|adapalene|tretinoin|glycolic|salicylic|lactic|mandelic|benzoyl/i.test(
          line,
        ) &&
        (line.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/g) || []).length >= 5,
    );
  if (frequent.length)
    concerns.push(
      "The selected calendar week lists active treatment on five or more days. Review frequency and tolerance with the product label or clinician; prescribed use may differ. No stopping interval is suggested and existing events are unchanged.",
    );
  const limitations = [
    "Local rule-based guidance, not a generative AI response or medical advice. No data is sent and no API or billing is used.",
    "This tool cannot determine allergy, prescription suitability, formulation safety or all ingredient interactions. Follow product labels and clinician instructions.",
    "Existing calendar entries remain in place. Review the proposed basics alongside your current care to avoid repeating steps.",
  ];
  if (input.alarmSymptoms)
    return validateAIPlan({
      version: 1,
      summary:
        "Planning paused. Seek medical advice for severe or worsening symptoms; breathing trouble or sudden swelling needs urgent care.",
      limitations,
      concerns,
      recommendMedical: true,
      items: [],
    });
  const product = (key, fallback) => {
    const value = input[key];
    if (
      value !== undefined &&
      (typeof value !== "string" ||
        value.length > 70 ||
        (value && !value.trim()))
    )
      throw Error("Use a meaningful product name of at most 70 characters.");
    if (
      /\b(retinol|retinal|retinyl|adapalene|tretinoin|glycolic|salicylic|lactic|mandelic|benzoyl|AHA|BHA)\b/i.test(
        value || "",
      )
    ) {
      const error = Error(
        "This product name mentions an active treatment. The free guide only schedules basic care; use the manual builder and product/clinician instructions for active treatments.",
      );
      error.field = key;
      throw error;
    }
    return value?.trim() || fallback;
  };
  const cleanse = product("cleanser", "Gentle cleansing"),
    moisture = product("moisturizer", "Usual tolerated moisturizer"),
    spf = product("sunscreen", "Sunscreen according to its label");
  const item = (name, step, time, reason) => ({
    name,
    step,
    time,
    reason,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    from: input.startDate,
    until: null,
  });
  const items = [
    item(
      cleanse,
      "cleanse",
      "pm",
      "A simple evening cleansing step using a product you already tolerate; adjust to its label.",
    ),
    item(
      moisture,
      "hydrate",
      "am",
      "A basic moisture step; use your own tolerated product and edit the schedule to suit you.",
    ),
    item(
      moisture,
      "hydrate",
      "pm",
      "Review whether an evening moisture step is useful alongside your existing routine.",
    ),
    item(
      spf,
      "protect",
      "am",
      "Follow your sunscreen label, including reapplication guidance; this calendar entry is not a dosing instruction.",
    ),
  ];
  if (input.sensitivity === "high")
    concerns.push(
      "High sensitivity selected: no new active treatment is proposed. Persistent irritation warrants clinical advice.",
    );
  return validateAIPlan({
    version: 1,
    summary: `Free local routine draft. ${input.skinType === "unsure" ? "Skin type is uncertain, so this stays minimal." : "Skin type noted: " + input.skinType + "."} Goals: ${(input.goals || []).join(", ") || "simple daily care"}. Only basic care is proposed; no new acids, retinoids or IPL treatments are introduced.`,
    limitations,
    concerns,
    recommendMedical: false,
    items,
  });
}
