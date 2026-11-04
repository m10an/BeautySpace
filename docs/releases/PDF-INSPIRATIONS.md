# Source-checked PDF readings and supplied editorial references

Branch `feature/pdf-inspirations-editorial-references`, based on current main `2f8feaf`, after PR #8 (including CI render fix `f2a6af3`) was merged and its old feature branch removed. No direct main commit or automatic merge is performed.

## Delivered

- The actual uploaded PDF was inspected as text and rendered pages. It has **6 physical pages and 15 visible quotation entries**, not 2,755 fully available quotations.
- **10 short verbatim excerpts**, 30–100 characters, are published locally with their printed attributed name, physical source page and the actual PDF SHA-256. Source spelling, including `Guatama Buddha`, is retained. Attributions are explicitly not presented as verified historical authorship.
- The Einstein item marked unsourced in the PDF is omitted; no missing quotes/teachers are invented and no long modern passages or full PDF are redistributed.
- Normal layout extraction mixed overlaid navigation into text. `scripts/curate-inspirations.py` now uses raw content-stream extraction; all selected texts and authors were matched against their stated pages, then visually checked. Actual-PDF negative probes rejected invented text, invented author and wrong/out-of-range pages before writing.
- One local-date reading is consistent on reload and offline. The collection rotates only within its ten approved items. A calendar-based timer refreshes at local midnight, respecting DST, and visibility restoration refreshes the current date. Source/load failure clears quotation and attribution instead of substituting generic content.
- Inspirations has a restrained ivory reading-sheet layout with existing olive accents, thin neutral framing, Cormorant Garamond quote text, Poppins attribution/controls and a short Pinyon Script heading accent. The exact source/page and limited collection are visible; attribution caveats are available in a disclosure.
- The user also supplied **9 JPEG references**. Their publication rights remain unconfirmed, so no reference image, branded claim or portrait is copied into the application. Their visual principles inform framing/color/spacing; no imitation photographs or artificial film overlay were generated. [Reference use](../EDITORIAL-REFERENCES.md).

## Provenance

PDF SHA-256: `5a52e15ff66cc10f4cd4069f3c0a60e0e1a4da7602241655109d0eaf373de804`.

[Source audit and reproduction](../INSPIRATIONS-SOURCE.md), [reviewed selection](../../data/inspiration-selection.json), [published dataset](../../inspiration.json), [reference inventory](../EDITORIAL-REFERENCE-PROVENANCE.json). The source PDF, rendered PDF pages and original JPEG references remain outside the repository/build. User journals, calendars, products, existing localStorage keys and IndexedDB formats are unchanged. The worker/asset revision is bumped for a compatible update; users should close old tabs normally, never clear browser data to upgrade.

## Actual verification

- Actual supplied-PDF import: **10/10 excerpts verified**, and four mismatch probes rejected (invented text, author, wrong page, out-of-range page).
- Final `npm test`: **104 passed**, zero failures/skips. The full gate initially ran the 103 then-current units; the additional DST test was subsequently added and all 104 rerun. No production logic changed between those runs.
- `CI=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:all`: syntax/JSON/evidence checks and 14 original supplied-file hashes passed; production build passed; **115 E2E passed**, zero failures/retries/flaky, **4 pre-existing missing-approved-PNG baseline skips** (119 discovered).
- New source suite separately: **5/5 E2E**, covering every daily reading/attribution/page in a full cycle, consistent reload, offline PWA reload, midnight rollover without network, unavailable source and foreign-source rejection.
- Longest actual excerpt checked at **320, 375, 390, 430, 768, 1024 and 1440 px**, both light/dark, without horizontal overflow.
- Formatting and `git diff --check` passed. Existing workflows, CI visual-readiness protection, free guide/backend defaults and calendar/data formats are retained.

Managed Linux / Node 24 / Python 3.12 / system Chromium through Playwright 1.58.2. Real iPhone Safari, VoiceOver and actual devices remain untested; the existing environment blocks WebKit downloads. No production deployment or live paid-AI request is claimed. Local logs: `/tmp/beauty-pdf-all.log`, `/tmp/beauty-pdf-unit-final.log`, `/tmp/beauty-pdf-target.log`.

## Screenshots

Disposable browser, clock set to 1 November 2026 to display the longest approved excerpt for layout review. No real user records are shown.

- [Mobile light](../previews/pdf-inspirations/reading-mobile-light.png)
- [Mobile dark, 320 px](../previews/pdf-inspirations/reading-mobile-dark.png)
- [Desktop](../previews/pdf-inspirations/reading-desktop.png)
- [Source details, desktop](../previews/pdf-inspirations/source-details-desktop.png)

## Main changed files

`inspiration.json`, `data/inspiration-selection.json`, `inspiration.js`, `lib/inspiration.js`, `scripts/curate-inspirations.py`, `index.html`, `style.css`, `sw.js`, source/asset/journey documentation, new unit/E2E tests and screenshots. Original reference photos/PDF are not added as product assets. Existing CI and package dependencies are unchanged.
