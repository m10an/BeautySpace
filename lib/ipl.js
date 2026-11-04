import { validDate, localDate, normalize } from "./domain.js";
export const IPL_KEY = "beautyspace-ipl-v1";
export function validateIPL(value) {
  if (
    !value ||
    value.version !== 1 ||
    !value.device ||
    !Array.isArray(value.sessions) ||
    value.sessions.length > 5000
  )
    throw Error("Unsupported or invalid IPL archive.");
  for (const key of ["brand", "model", "instructions"])
    if (
      typeof value.device[key] !== "string" ||
      value.device[key].length > 1000
    )
      throw Error("Invalid device details.");
  const ids = new Set(),
    dates = new Set();
  for (const s of value.sessions) {
    if (
      !s ||
      typeof s.id !== "string" ||
      ids.has(s.id) ||
      !validDate(s.date) ||
      !["planned", "completed", "cancelled"].includes(s.status)
    )
      throw Error("Invalid IPL session.");
    ids.add(s.id);
    for (const key of ["area", "settings", "reaction", "notes"])
      if (typeof s[key] !== "string" || s[key].length > 2000)
        throw Error("Invalid session text.");
    if (!s.area.trim()) throw Error("Choose a treatment area.");
    const key = s.date + "|" + normalize(s.area);
    if (s.status !== "cancelled" && dates.has(key))
      throw Error("This area already has a session on that date.");
    if (s.status !== "cancelled") dates.add(key);
    if (s.status === "completed" && s.date > localDate())
      throw Error("A future session cannot be completed.");
  }
  return structuredClone(value);
}
export function readIPL(storage = localStorage) {
  const raw = storage.getItem(IPL_KEY);
  return raw
    ? validateIPL(JSON.parse(raw))
    : {
        version: 1,
        device: { brand: "", model: "", instructions: "" },
        sessions: [],
      };
}
export function saveIPL(
  value,
  { confirmed = false, storage = localStorage } = {},
) {
  if (!confirmed) throw Error("Explicit confirmation is required.");
  const next = validateIPL(value);
  storage.setItem(IPL_KEY, JSON.stringify(next));
  return next;
}
export function sessionStatus(s, today = localDate()) {
  return s.status === "planned" && s.date < today ? "missed" : s.status;
}
// Only release-reviewed, exact-model manufacturer guidance may enter this catalog.
// An uploaded URL or AI output is never treated as verified guidance.
export const manufacturerGuidance = Object.freeze([]);
export function planIPL(interview, catalog = manufacturerGuidance) {
  const guide = catalog.find(
    (g) =>
      g.reviewed === true &&
      g.brand === interview.brand &&
      g.model === interview.model,
  );
  if (!guide)
    throw Error(
      "Verified manufacturer-specific guidance is unavailable. Use manual logging; no treatment dates will be generated.",
    );
  if (
    interview.tanning !== false ||
    interview.irritation !== false ||
    interview.photosensitivity !== false ||
    interview.contraindicationsClear !== true
  )
    throw Error(
      "Potential contraindications need qualified review. No automated IPL recommendation.",
    );
  // Manufacturer restrictions require a model-specific implementation and review;
  // a generic interval field alone can never authorize treatment.
  throw Error(
    "This device schedule has not been implemented and reviewed. Use manual logging.",
  );
}
