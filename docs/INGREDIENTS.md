# Current Ingredient Check v2

See [INCI v2 provenance and evidence contract](releases/INCI-V2.md). The live catalog contains 28,353 distinct MIT-licensed names plus retained legacy descriptions. Numeric evidence is stored separately and currently has no attributable ratings. The following audit records the original 107-entry source, not the current search catalog.

# Ingredient data and comedogenicity audit

## What is actually in the source

The original `ingredients-db.json` contains **107 entries**, each with `name`, `category` and a descriptive `note`. It contains **no numeric comedogenicity field, concentration, test method, bibliography, study identifier or evidence grade**. The legacy provenance is the inspected Beautycalendar commit recorded in [AUDIT.md](AUDIT.md). General descriptive notes were retained, not independently revalidated as medical facts.

The four legacy notes for Isopropyl Myristate, Isopropyl Palmitate, Myristyl Myristate and Ethylhexyl Palmitate mention historical laboratory tests/lists without identifying sources. Their cautions remain contextual, **not verified ratings**. Fragrances and fragrance allergens are flagged separately for possible sensitivity; they are not assigned acne/comedogenicity scores.

## Current schema

Every entry now has:

```json
{
  "name": "Aqua",
  "category": "Solvent",
  "note": "Water; common base for cosmetic formulations.",
  "synonyms": ["Water"],
  "comedogenicity": {
    "rating": null,
    "evidence": "not-established",
    "sourceIds": []
  },
  "cautions": []
}
```

`validateDatabase` rejects duplicate normalized names, malformed records and any numeric rating. This is a deliberate publication gate until a medically reviewed, attributable dataset exists. `null` means unknown, not zero. Common-name duplicate entries already present in the source are retained to avoid losing their notes; exact canonical name matches take precedence, followed by explicitly stored synonyms.

Search normalizes Unicode NFKC, case, spaces and periods. Reference search uses partial matches over names and synonyms. INCI analysis uses **exact normalized names/synonyms**, never partial matching, because matching “acid” to one arbitrary acid would be misleading. Commas, semicolons and line breaks delimit entries; at most 200 entries and 20,000 characters are accepted, with explicit errors rather than silent truncation. Marketing text, concentrations, parenthesized comma-containing mixtures and misspellings are not automatically interpreted. Duplicates are retained and count as separate submitted entries.

## Meaning of the chart

The chart shows matched/unrecognized names and the count with verified numeric ratings (currently 0). It never represents probability of acne, an aggregate safety score or a finished-formula rating. There are no synthetic 0–5 scores. Individual reaction, concentration, vehicle, processing, contact duration and the full formula are unknown. “Unrecognized” means absent from this limited reference, not unsafe or safe.

## Adding evidence later

Before enabling numeric levels, replace the current publication gate with a versioned schema covering study source IDs and URLs/DOIs, tested material and purity, concentration, vehicle, method/model, endpoint and scale, uncertainty, study date, and a review date/reviewer. Report human versus animal/laboratory evidence separately. Do not map a rabbit-ear result directly to human finished-product performance. Keep allergy/irritancy data separate. Add tests for null/missing/mixed evidence and accessible category charts. A clinician/data review and provenance/license check are prerequisites for that data release, not operations claimed completed here.

The external COSMILE Europe, EU CosIng and INCIDecoder links inherited in the interface are optional reference links, not integrations, evidence for a numeric score, or queried APIs.
