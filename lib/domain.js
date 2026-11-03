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
  const cleaned = value.replace(/^\s*(?:ingredients|inci|состав)\s*[:：]/i, "");
  let part = "";
  const stack = [],
    entries = [];
  const flush = () => {
    const text = part.replace(/^\s*\d+[.)]\s*/, "").trim();
    if (text) entries.push(text);
    part = "";
  };
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "(" || ch === "[") stack.push(ch);
    if (ch === ")" && !stack.length && /^\s*\d+$/.test(part)) {
      part += ch;
      continue;
    }
    if (ch === ")" || ch === "]") {
      if (stack.pop() !== (ch === ")" ? "(" : "["))
        throw Error("Check parentheses in the ingredient list.");
    }
    const locant =
      ch === "," &&
      /\d$/.test(part) &&
      /^\d+(?:,\d+)*-/.test(cleaned.slice(i + 1));
    if (!stack.length && /[,;\n]/.test(ch) && !locant) flush();
    else part += ch;
  }
  if (stack.length) throw Error("Check parentheses in the ingredient list.");
  flush();
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
const indexes = new WeakMap();
function indexFor(db) {
  if (indexes.has(db)) return indexes.get(db);
  const exact = new Map(),
    alias = new Map();
  for (const row of db) {
    exact.set(normalize(row.name), row);
    for (const key of row.synonyms)
      if (!alias.has(normalize(key))) alias.set(normalize(key), row);
  }
  const index = {
    exact,
    alias,
    search: db.map((row) => ({
      row,
      keys: [row.name, ...row.synonyms].map(normalize),
    })),
  };
  indexes.set(db, index);
  return index;
}
export function findIngredient(name, db) {
  const index = indexFor(db),
    key = normalize(name);
  const lookup = (key) => index.exact.get(key) || index.alias.get(key);
  const direct = lookup(key);
  if (direct) return direct;
  const base = key
    .replace(/\([^()]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (base) {
    const row = lookup(base);
    if (row) return row;
  }
  if (!base && /^\([^()]+\)$/.test(key)) return lookup(key.slice(1, -1));
  if (/^(aqua|water|eau)(\s*\/\s*(aqua|water|eau))+$/.test(key))
    return lookup("aqua") || lookup("water");
}
export function searchIngredients(query, db) {
  const key = normalize(query);
  if (!key) return [];
  return indexFor(db)
    .search.map((item) => ({
      item,
      rank: Math.min(
        ...item.keys.map((s) =>
          s === key
            ? 0
            : s.startsWith(key)
              ? 1
              : s.includes(" " + key)
                ? 2
                : s.includes(key)
                  ? 3
                  : 4,
        ),
      ),
    }))
    .filter((x) => x.rank < 4)
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.item.row);
}
export function analyzeInci(value, db, evidence = { ratings: [] }) {
  const ratings = new Map(evidence.ratings.map((r) => [normalize(r.inci), r]));
  const entries = parseInci(value).map((name) => {
    const ingredient = findIngredient(name, db) || null;
    return {
      name,
      ingredient,
      rating: ingredient
        ? [ingredient.name, ...ingredient.synonyms]
            .map(normalize)
            .map((k) => ratings.get(k))
            .find(Boolean) || null
        : null,
    };
  });
  const matched = entries.filter((e) => e.ingredient).length,
    rated = entries.filter((e) => e.rating).length;
  return {
    entries,
    total: entries.length,
    matched,
    unknown: entries.length - matched,
    rated,
    missingEvidence: entries.length - rated,
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
