# Approved design masterplan — implementation and QA

Feature branch: `feature/design-masterplan-editorial`, based on current main `4f28d2a` (after the PDF Inspirations PR was merged). No main commit, merge, paid-service deployment or Pages release is performed here.

## Review the work

- [Pre-implementation audit, every page](../../DESIGN-AUDIT.md)
- [Exact tokens, typography, components and states](../../DESIGN-SYSTEM.md)
- [Every-page completion and journey checklist](../../IMPLEMENTATION-CHECKLIST.md)
- [Before/after screenshot index, desktop and mobile](../previews/masterplan/README.md)
- [Masterplan and visual-board provenance](../MASTERPLAN-PROVENANCE.json)

Both uploaded masterplan PDFs are identical: 8 physical pages, SHA-256 `74b29fa8fd9da0402c38aa3dbf019cbd0265b8d07739851a4ecb4307ee6b457a`. All pages were read as extracted text and rendered pages, along with the entire board and all nine earlier reference images, before production edits. The existing ten short PDF excerpts are unchanged; their six-page source and SHA-256 remain recorded in the source audit.

## Implemented behavior

Home is now the entry screen and brand destination. It shares the exact daily reading with Inspirations and reads AM/PM completion, the next confirmed IPL session and the latest observation from the existing models. Calendar remains independent, with a compact month view plus read-only Week/List views over the same data, explicit date selection, care/IPL markers and access to the original editors. Desktop has a persistent section rail; mobile has five shortcuts plus the full frosted drawer. All 13 routes and Help remain reachable.

My Routine has AM/PM views and actual selected-day progress. Existing procedures, copy/presets and advanced editors are retained. Save/Resume/Discard builder drafts use a separately validated version-1 local UI record; they never add care. Confirmed Move earlier/later reorders added steps within AM/PM while keeping original IDs, dates, frequencies and checkmarks. Per-day override sequences and the original sample order remain unchanged. Drafts are local working copies, outside the confirmed-care backup format; no existing archive format changes.

Products now presents the real shelf first, with category/search filters, uploaded-photo presentation or an honest image-free state, original create/edit/delete and INCI reports. No board product names, stock photos, sample shelf data or numeric ingredient evidence are fabricated. Ingredient algorithms and licensed reference data are unchanged.

The free consultant has a dedicated landing page and five interview stages. Back preserves answers, validation reveals the relevant stage, one content container scrolls between fixed heading/progress/footer, and optional hosted tools are secondary. Validated proposals show a live AM/PM outline with weekdays/dates before the editable fields; secondary explanatory limits remain available in a disclosure. Changes to a proposed field or removal immediately refresh the outline. Proposals remain editable; Reject and Close do not write care. Only reviewed confirmation appends, with duplicate guards. Changing answers, copying calendar/product text or switching mode invalidates an old proposal; medical escalation remains visible across stages. Shipped hosted-AI configuration and server billing switches remain disabled.

IPL has a clearer device/session/area/history hierarchy with real counts and empty states; original manual preview/confirmation, edit/postpone/cancel, archives and calendar integration remain. No manufacturer-specific schedule is invented. Journal includes a read-only view/review action for existing observations; Hair, Insights, writing prompts, privacy, photo storage and backups retain their functionality in the same visual system. Help covers the real seven topics with arrows, counter/progress, Close/Skip and focus restoration.

All pages use the exact six reference colors, Poppins functional text, Cormorant Regular headings and limited Pinyon accents. Controls have contrast-aware boundaries and visible focus. Fine dividers/cards replace the inconsistent old hero treatments and oversized shadows; no synthetic grain, replacement AI photography or decorative gradients are introduced.

## Data and offline preservation

Original calendar/Hair/reflection/IPL keys, products/photos IndexedDB formats, backup validators and JSON plan schema are retained. The only new user-local record is the optional builder draft; no migration rewrites existing data. No data is saved by navigating Home or changing calendar views. Worker revision and all versioned app imports are coherent, with one calendar controller shared by IPL/consultant/shell. A regression check prevents a stale import from creating a second controller. Updated workers wait for old tabs to close; never clear browser data to upgrade.

Static Pages build includes the new presentation and draft modules; workflows, Ubuntu24.04 runner, dependencies, ingredient data, quote data and original supplied-test evidence remain intact. No mandatory check is disabled, weakened or assigned continue-on-error. The four already-skipped approved-PNG baseline checks are retained as before; runtime geometry/contrast/render-stability checks still run.

## Actual verification

Final run, 5 November 2026: `CI=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:all` completed successfully. Syntax/JSON/evidence checks passed, including hashes of all 14 untouched supplied files. Unit tests: **111 passed, 0 failed**. Production build: **38 allowlisted frontend files plus licensed assets/data copied successfully**. E2E: **128 passed, 4 pre-existing missing-baseline skips, 0 failed, 0 flaky**, 7.9 minutes with two workers. No retry was needed in this final run. The targeted stability/sentinel repeat run additionally passed **24/24 without retries**.

Prettier checks, `git diff --check`, local documentation links, both 34-image manifests and the absence of supplied-reference photo hashes from `dist/` also passed. The automated matrix covers 320, 375, 390, 430, 768, 1024 and 1440 px, both themes, keyboard/navigation, form errors, confirmations, persistence, source-only/offline quotes, PWA, INCI and IPL. This is automated evidence, not full WCAG certification or a physical-device test.

### Render-stability investigation

A full candidate run completed with 111 unit tests, 125 E2E passes, one retry-pass and four existing baseline skips. The flaky case was `supplied.spec.js` → `768px` → `repeat-render stability with fonts blocked`: the bounded readiness step could not find four byte-identical PNGs. Six retry-free reproductions yielded two failures.

Diagnostic captures showed identical DOM geometry across 16 frames, while 17 pixels at a rounded panel corner alternated by one channel level. That is within the already-established measured-pair contract (maximum channel delta 1, at most 0.01% of pixels); the readiness helper's separate byte-equality requirement was inconsistent with it. Readiness now applies that same existing contract over four consecutive captures, still bounded to 12. The actual comparison assertions/tolerances, retries, traces and missing-baseline policy are unchanged. The existing ongoing-geometry sentinel is retained; new tests distinguish sparse one-level rounding from whole-area palette drift. The affected case and three readiness controls, each repeated six times without retries, passed **24/24**. Final full-run results are recorded above after completion.

Local environment: managed Debian Linux, Node 24, Python 3.12, Playwright 1.58.2 with system Chromium. This is not claimed identical to the GitHub-hosted Ubuntu24.04/bundled Chromium runner. WebKit 26.0 installation was attempted: all download endpoints returned `403 Domain forbidden`. Real iPhone Safari, virtual keyboard, VoiceOver and physical touch behavior remain manual-device checks, not inferred from Chromium automation.

## Remaining gaps

- **Authentic photographic hero/crops:** the supplied material explicitly says its embedded/reference photographs require publication-rights verification. No author/license confirmation has been received. They remain internal references, outside the repository/build. No generated imitation, irrelevant stock photograph, logo or marketing percentage is substituted. The current Home uses a restrained editorial typographic composition. The photography portion of the approved design is therefore **not fully matched** and must remain open until appropriate licensed files are approved.
- Real iPhone Safari/VoiceOver and physical-device review remains pending because WebKit download is blocked in this environment. Device checks should include keyboard focus, safe areas, orientation and cropping once photos exist.
- Four reviewer-approved screenshot-baseline PNGs remain absent from the pre-existing test setup. No baselines are auto-approved in this work.
- Verified device-specific IPL automation and optional hosted LLM are unavailable by design without their separate setup/review; the free local guide and manual IPL tools work without either. No AI API key is required for delivered default functionality.

## Delivery

[Compare branch / create PR](https://github.com/m10an/BeautySpace/compare/main...feature/design-masterplan-editorial?expand=1). Actual push and PR-creation outcomes are reported in the task response. A merge/release is a separate owner decision; no automatic merge is performed.

## Changed files

- Application presentation/navigation: `index.html`, `style.css`, `shell.js`, `editorial.js`, `lib/editorial.js`, `help.js`, `inspiration.js`.
- Existing feature integration: `app.js`, `products.js`, `ai-client.js`, `forms.js`, `ipl.js`, `builder.js`, `lib/builder-draft.js`.
- Offline/build: `sw.js`, `scripts/build.js`; screenshot capture: `scripts/capture-design.mjs`.
- Tests: new `tests/unit/editorial.test.js`, `tests/unit/builder-draft.test.js`, `tests/e2e/masterplan.spec.js`; updated real-navigation helpers/journeys in `tests/e2e/navigation.js`, `editorial.spec.js`, `app.spec.js`, `free-ux.spec.js`, `ai.spec.js`, `ipl.spec.js`, and the unchanged font assertion's semantic-heading selector in `supplied.spec.js`; raster-readiness contract in `visual.js` with retained geometry and new sparse-rounding/palette sentinel coverage in `render-readiness.spec.js`.
- Documentation: root `DESIGN-AUDIT.md`, `DESIGN-SYSTEM.md`, `IMPLEMENTATION-CHECKLIST.md`, `README.md`; `assets/ASSETS.md`; `docs/MASTERPLAN-PROVENANCE.json`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/QA.md`, `docs/USER-JOURNEYS.md`, this report and `docs/previews/masterplan/` (68 before/after PNGs, two manifests, index).

All original source PDFs/reference photos stay outside the public build. The screenshot index identifies every page and each before-route exception.
