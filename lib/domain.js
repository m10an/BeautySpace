/** Pure domain functions; dates represent local calendar days, never instants. */
export const normalize = (value) =>
  typeof value === "string"
    ? value
        .normalize("NFKC")
        .toLowerCase()
        .replace(/\./g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    y >= 1900 &&
    y <= 9999 &&
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseInci(value) {
  if (typeof value !== "string" || value.length > 20000)
    throw new Error("Use up to 20,000 characters.");
  const entries = value
    .replace(/^\s*ingredients\s*[:：]/i, "")
    .split(/[,;\n]+/)
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
  if (entries.length > 200) throw new Error("Use up to 200 ingredients.");
  return entries;
}
export function validateDatabase(db) {
  if (!Array.isArray(db) || !db.length)
    throw new Error("Empty ingredient reference");
  const names = new Set();
  for (const item of db) {
    const key = normalize(item.name);
    if (
      !key ||
      names.has(key) ||
      typeof item.category !== "string" ||
      typeof item.note !== "string" ||
      !Array.isArray(item.synonyms)
    )
      throw new Error("Invalid ingredient reference");
    names.add(key);
    const e = item.comedogenicity;
    if (
      !e ||
      e.rating !== null ||
      e.evidence !== "not-established" ||
      e.sourceIds.length
    )
      throw new Error("Unverified ratings must not be published");
  }
  return db;
}
export function findIngredient(name, db) {
  const key = normalize(name);
  return (
    db.find((item) => normalize(item.name) === key) ||
    db.find((item) => item.synonyms.some((s) => normalize(s) === key))
  );
}
export function searchIngredients(query, db) {
  const key = normalize(query);
  if (!key) return [];
  return db.filter((item) =>
    [item.name, ...item.synonyms].some((s) => normalize(s).includes(key)),
  );
}
export function analyzeInci(value, db) {
  const entries = parseInci(value).map((name) => ({
    name,
    ingredient: findIngredient(name, db) || null,
  }));
  const matched = entries.filter((e) => e.ingredient).length;
  return {
    entries,
    total: entries.length,
    matched,
    unknown: entries.length - matched,
    rated: 0,
    missingEvidence: entries.length,
  };
}
export function validateProcedure(item) {
  if (
    !item ||
    typeof item.name !== "string" ||
    !item.name.trim() ||
    item.name.length > 90 ||
    !["am", "pm"].includes(item.time)
  )
    throw new Error("Invalid procedure");
  if (
    !["daily", "weekdays", "once"].includes(item.mode) ||
    !Array.isArray(item.weekdays) ||
    item.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
  )
    throw new Error("Invalid schedule");
  if (
    (item.mode === "weekdays" && !item.weekdays.length) ||
    (item.mode === "once" && !validDate(item.once))
  )
    throw new Error("Select a date or weekday");
  if (
    !validDate(item.from) ||
    (item.until && (!validDate(item.until) || item.until < item.from))
  )
    throw new Error("Invalid date range");
  return item;
}
export function validateProduct(value) {
  if (
    !value ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 120
  )
    throw new Error("Enter a product name (up to 120 characters).");
  if (!["skin", "hair", "body", "other"].includes(value.category))
    throw new Error("Select a category.");
  if (
    typeof value.brand !== "string" ||
    value.brand.length > 120 ||
    typeof value.inci !== "string"
  )
    throw new Error("Invalid product details.");
  parseInci(value.inci);
  if (
    value.photo &&
    (typeof value.photo !== "string" ||
      value.photo.length > 2000000 ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value.photo))
  )
    throw new Error("Invalid product photo.");
  return value;
}
/** Allowlist imported fields; never merge arbitrary backup objects into app state. */
export function validateLegacyBackup(input, defaults) {
  const record = (x) => x && typeof x === "object" && !Array.isArray(x);
  if (!record(input) || !validDate(input.start) || !record(input.checks))
    throw new Error("Invalid backup");
  const result = { ...defaults, start: input.start };
  for (const k of ["nia", "bep", "dailyAz"])
    if (typeof input[k] === "boolean") result[k] = input[k];
  result.checks = Object.fromEntries(
    Object.entries(input.checks).filter(
      ([k, v]) =>
        /^\d{4}-\d{2}-\d{2}\|[\w-]+$/.test(k) && typeof v === "boolean",
    ),
  );
  result.customItems = Array.isArray(input.customItems)
    ? input.customItems.map((item) => {
        validateProcedure(item);
        if (typeof item.id !== "string" || !/^[\w-]+$/.test(item.id))
          throw new Error("Invalid procedure ID");
        return {
          id: item.id,
          name: item.name,
          time: item.time,
          mode: item.mode,
          weekdays: item.weekdays,
          once: item.once,
          from: item.from,
          until: item.until,
        };
      })
    : [];
  result.overrides = Object.fromEntries(
    Object.entries(input.overrides || {}).filter(
      ([date, ids]) =>
        validDate(date) &&
        Array.isArray(ids) &&
        ids.every((id) => ["adap", "azel", "nia", "bep"].includes(id)),
    ),
  );
  result.customOverrides = Object.fromEntries(
    Object.entries(input.customOverrides || {}).filter(
      ([date, ids]) =>
        validDate(date) &&
        Array.isArray(ids) &&
        ids.every((id) => typeof id === "string" && /^[\w-]+$/.test(id)),
    ),
  );
  result.moods = Object.fromEntries(
    Object.entries(input.moods || {})
      .filter(([date, m]) => validDate(date) && record(m))
      .map(([date, m]) => [
        date,
        {
          ...Object.fromEntries(
            ["inflamed", "comedones", "dryness", "irritation"].map((k) => [
              k,
              [0, 1, 2, 3].includes(m[k]) ? m[k] : 0,
            ]),
          ),
          note: typeof m.note === "string" ? m.note.slice(0, 2000) : "",
        },
      ]),
  );
  return result;
}

export function procedureApplies(item, date) {
  if (!validDate(date)) return false;
  if (item.mode === "once") return item.once === date;
  const weekday = (new Date(`${date}T12:00:00`).getDay() + 6) % 7;
  return (
    date >= item.from &&
    (!item.until || date <= item.until) &&
    (item.mode === "daily" ||
      (item.mode === "weekdays" && item.weekdays.includes(weekday)))
  );
}
