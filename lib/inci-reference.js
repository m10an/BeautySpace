import { normalize } from "./domain.js";
export function validateNames(data) {
  if (
    !data ||
    data.version !== 1 ||
    !Array.isArray(data.entries) ||
    !data.source?.license ||
    !data.entries.length
  )
    throw Error("Invalid name catalog");
  const keys = new Set();
  for (const row of data.entries) {
    const key = normalize(row.name);
    if (
      !key ||
      keys.has(key) ||
      !/^\d+$/.test(row.cosingId) ||
      !Array.isArray(row.synonyms) ||
      row.synonyms.some((s) => typeof s !== "string")
    )
      throw Error("Invalid ingredient name");
    keys.add(key);
  }
  return data;
}
export function validateEvidence(data) {
  if (
    !data ||
    data.version !== 1 ||
    !data.sources ||
    !Array.isArray(data.ratings)
  )
    throw Error("Invalid evidence document");
  const seen = new Set();
  for (const row of data.ratings) {
    const key = normalize(row.inci);
    if (
      !key ||
      seen.has(key) ||
      !Number.isInteger(row.score) ||
      row.score < 0 ||
      row.score > 5 ||
      !["low", "moderate", "high"].includes(row.confidence) ||
      !["human", "animal", "in-vitro"].includes(row.model) ||
      typeof row.method !== "string" ||
      !row.method.trim() ||
      typeof row.concentration !== "string" ||
      !row.concentration.trim() ||
      !Array.isArray(row.sourceIds) ||
      !row.sourceIds.length
    )
      throw Error("Unsupported numeric rating");
    for (const id of row.sourceIds) {
      const s = data.sources[id];
      if (
        !s ||
        !/^https:\/\//.test(s.url) ||
        !s.title ||
        !s.citation ||
        !/^\d{4}-\d{2}-\d{2}$/.test(s.reviewedAt)
      )
        throw Error("Rating lacks attributable evidence");
    }
    seen.add(key);
  }
  return data;
}
export function combineReference(names, legacy) {
  validateNames(names);
  const map = new Map(
    legacy.map((row) => [normalize(row.name), structuredClone(row)]),
  );
  for (const row of names.entries) {
    const key = normalize(row.name);
    if (map.has(key)) {
      const item = map.get(key);
      item.synonyms = [...new Set([...item.synonyms, ...row.synonyms])];
      item.cosingId = row.cosingId;
      continue;
    }
    map.set(key, {
      name: row.name,
      category: "Reference name",
      note: "Name and identifiers supplied by the cited catalog. No clinical effect or approval is implied.",
      synonyms: row.synonyms,
      cosingId: row.cosingId,
      cautions: [],
      comedogenicity: {
        rating: null,
        evidence: "not-established",
        sourceIds: [],
      },
    });
  }
  const aliases = {
    Petrolatum: ["Vaseline", "Petroleum jelly", "White petrolatum"],
    "Olea Europaea Fruit Oil": ["Olive oil", "Olea europaea (olive) fruit oil"],
    "Vitis Vinifera Seed Oil": [
      "Grape seed oil",
      "Grapeseed oil",
      "Vitis vinifera (grape) seed oil",
    ],
  };
  for (const [name, list] of Object.entries(aliases)) {
    const row = map.get(normalize(name));
    if (row) row.synonyms = [...new Set([...row.synonyms, ...list])];
  }
  return [...map.values()];
}
