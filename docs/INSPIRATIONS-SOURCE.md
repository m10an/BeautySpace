# Inspirations — the supplied six-page PDF

The exclusive source is the user-supplied **Buddhism Quotes (2755 quotes).pdf** received on 4 November 2026. Its SHA-256 is `5a52e15ff66cc10f4cd4069f3c0a60e0e1a4da7602241655109d0eaf373de804`; the actual attachment is 188,654 bytes and has **six physical pages**. Its printed source is the Goodreads Buddhism-tag page. The title is not a count of available quotations: only **15 quotation entries** are visible, including one numbered list spanning two pages.

The local collection contains **10 short verbatim excerpts**, 30–100 characters each. Physical source pages are 2–5; pages 1 and 6 mostly contain site/navigation material. No missing Goodreads entries were reconstructed, no other quote API/website was queried, and no generic motivational fallback is included. The original PDF, page images and full extracted text are not redistributed in the public build.

## Curation and attribution

Each selected excerpt was checked against both the rendered PDF page and its raw extracted text. Normal layout extraction interleaves overlaid navigation words with some quotations, so the importer uses `pdftotext -raw`, preserving content-stream reading order. Only whitespace is normalized for membership verification; quote wording/punctuation and printed attributed names remain intact. `Guatama Buddha` is intentionally reproduced with the source's spelling. `reviewed` means checked against this supplied document, **not** verified historical authorship, canonical Buddhist teaching, clinical review or a blanket copyright license.

The selection excludes the Einstein quotation explicitly tagged `attributed-to-einstein-no-source`/`unsourced`, and avoids reproducing the long numbered list and longer modern passages. The published items are short excerpts, clearly labeled as such, with their printed attribution and physical PDF page. Shortness is not a general permission to reproduce entire books or collections; no broader rights claim is made.

| ID suffix        | Attribution as printed | PDF page |
| ---------------- | ---------------------- | -------: |
| earth-steps      | Thich Nhat Hanh        |        2 |
| walk-the-path    | Gautama Buddha         |        2 |
| seriousness      | Alan Wilson Watts      |        3 |
| life-touched     | Ray Bradbury           |        3 |
| clinging         | Guatama Buddha         |        3 |
| letting-go       | Thich Nhat Hanh        |        3 |
| aperture         | Alan Watts             |        4 |
| spiral-path      | Hermann Hesse          |        4 |
| open-hearts      | Pema Chodron           |        4 |
| conquer-yourself | Buddha                 |        5 |

`data/inspiration-selection.json` is the reviewed selection. `inspiration.json` is its derived publication dataset, adding the exact source hash to each row and recording source filename, hash, page count and review state. Unit tests bind the published dataset to that exact selection and PDF fingerprint. Runtime validation rejects unrelated source names, unreviewed rows, invalid pages/hashes, duplicate IDs/text and overlong excerpts. Build checks run the same schema gate.

## Reproduce verification

With the supplied PDF available locally and `pdftotext` installed:

```sh
python3 scripts/curate-inspirations.py /path/to/supplied.pdf data/inspiration-selection.json
npm run check
npm test
```

The importer verifies every selected text and author against its stated physical page, hashes the actual PDF bytes and writes only after all rows pass. It never fetches external content. Changing an excerpt, attribution or page to invented/mismatched values was tested against the actual attachment and rejected. Keep the PDF private/local; it is not needed in CI, where the approved selection/hash and UI provenance checks run.

## Daily and offline behavior

`dailyInspiration` uses the user's **current local calendar date**, not the calendar's selected care date, converted to an integer day index modulo the approved collection length. It uses no randomness, network time or browsing history. Refreshing and revisiting keep the same day's reading. The next local midnight is scheduled with calendar-date arithmetic, including DST boundaries; visibility restoration also refreshes the date. With ten distinct excerpts, adjacent days differ and the rotation repeats every ten days only within this collection.

The PWA caches the versioned collection/module. After a normal worker update (old tabs closed), offline reload preserves the excerpt, attribution and page. Missing or invalid source data produces a truthful empty/error state, never an unrelated quote. User storage keys, journal text and calendars are untouched.

The text uses Cormorant Garamond Regular; attribution/citation and controls use Poppins. Pinyon Script remains limited to a short decorative heading accent. The source-details disclosure explains the six-page limitation and uncertain attributions without repeating a long disclaimer inside the quotation.
