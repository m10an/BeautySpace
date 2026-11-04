# Exclusive inspiration source — pending attachment

The only permitted source is the user-supplied **Buddhism Quotes (2755 quotes).pdf**. It was not present among accessible attachments on 2026-11-04; only three earlier test ZIPs were available. No excerpts or authors have been invented. The live `inspiration.json` is a versioned empty collection with `status: awaiting-user-pdf`. The old 1,000 unrelated generated reflections and random/category UI are removed. Journal questions and private user answers are separate features and remain intact.

The filename is not a count of available content. Only visibly included pages may be curated; no attempt is made to recreate the remaining Goodreads collection or scrape it from elsewhere. While empty or invalid, the UI displays a source-specific message with no quotation, author, substitute teaching or unrelated motivation. Offline failure follows the same rule.

## Review/import procedure once the PDF arrives

1. Inspect the actual PDF and its copyright/provenance. Select only legally usable, short verbatim excerpts; do not reproduce long modern passages. The 240-character bound is a product guard, not a legal determination or automatic permission. Prefer clearly permitted/public-domain material and document the rights review.
2. Record physical PDF page, exact wording and author **as attributed on that page** in a reviewed selection JSON. Preserve uncertain/misattributed labels; do not turn Goodreads attribution into a verified historical fact. No paraphrases are silently presented as quotations.
3. Run `python3 scripts/curate-inspirations.py /path/source.pdf /path/reviewed-selection.json`. It requires `pdftotext`, verifies each excerpt and author text against its stated page, rejects duplicates/unreviewed/long entries, computes the PDF SHA-256 and writes only after all entries validate. Text extraction/line breaks may require manual inspection. The original PDF is not copied into the public application.
4. Review the dataset diff against the PDF, run `npm run check`, unit and E2E tests, and take fresh quote screenshots before publication. No actual user PDF extraction is claimed completed by this branch.

Selection format:

```json
[
  {
    "id": "reviewed-id",
    "text": "verbatim short excerpt from the supplied page",
    "attributedAuthor": "attribution as printed",
    "sourcePage": 1,
    "reviewed": true
  }
]
```

This is a schema example, **not a publishable quotation**. The live collection stores `text`, `attributedAuthor`, `sourcePage`, `sourceSha256` and a review flag. Source metadata records file, SHA-256 and visible page count. `validateInspirations` rejects other source filenames, missing source hashes, out-of-range pages, duplicates and unreviewed excerpts. Build checks apply this gate as well as UI validation.

## Daily/offline behavior

`dailyInspiration` selects by the user's local calendar date converted to an integer day index modulo the approved collection length. It never uses randomness, network time or mutable browsing history. All readings on a date use the same function/data; refreshing, revisiting and offline caching preserve that day's result. Adjacent days differ when there is more than one excerpt. A one-item collection necessarily repeats; exhaustion wraps only within the approved dataset. An empty collection never falls back to unrelated content. Date rollover and tab visibility refresh the reading without changing user storage.

Typography: Cormorant Garamond Regular for excerpt text; Poppins for attribution/UI; Pinyon Script only for nonessential short editorial accents. Each attribution explicitly points to the supplied PDF page and notes that it is not independently verified historical authorship.
