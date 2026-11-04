# Current PDF-readings verification

See [PDF-INSPIRATIONS.md](releases/PDF-INSPIRATIONS.md) for the supplied source PDF, 10 reviewed excerpts, daily/offline behavior, reference-image status and actual checks. Reports below describe earlier stages and are retained as history.

# Current UX/free-guide verification

See [FREE-GUIDE-UX.md](releases/FREE-GUIDE-UX.md) for this feature branch. The reports below are retained as historical runs, not current counts or visual direction.

# Current release verification

See [the current delivery report](releases/DELIVERY.md) for the luxury/INCI/builder/AI/IPL changes and actual results. The following report is retained as the historical editorial-redesign run. Its counts and original imagery description do not describe the current build.

# QA report — 3 November 2026

## Environment and commands

Managed Linux cloud environment, Python 3.12.14, Node.js 24.19.0, npm 11.9.0, system Chromium through Playwright 1.58.2, axe-core integration 4.11.1. Two browser workers; isolated browser contexts with disposable test data. Tests do not use a real user's profile or upload data.

```sh
npm run check
npm test
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
npm run build
npm audit --json
```

## Recorded results

- Syntax, JSON and ingredient evidence contract: passed.
- Unit tests: **42 passed, 0 failed, 0 skipped**.
- Completed browser suite: **82 passed, 0 failed, 4 skipped**, 0 flaky (86 discovered, no local retries). The full editorial redesign run includes all existing tests, 23 new navigation/theme/motion/visual scenarios and the additional 430 px layout cases. Four approved-baseline comparisons remain skipped because no approved PNGs exist.
- Production build: **20 explicit static assets**; served under `/dist/` as a repository-subpath simulation and reloaded offline successfully.
- `npm audit`: **0 reported vulnerabilities**, including development dependencies, at the time of this run. This is not a guarantee against undisclosed issues.
- `git diff --check`: passed.

The final redesign run used `CHROMIUM_PATH=/usr/bin/chromium npm run test:all`; syntax/integrity, unit tests, the 20-asset production build and browser tests completed successfully. Both existing workflows remain unchanged with Playwright jobs pinned to Ubuntu 24.04. Prettier checks on changed source files and `git diff --check` passed. See [EDITORIAL-REDESIGN.md](EDITORIAL-REDESIGN.md) for changed files and review screenshots.

## Browser coverage

| Area                    | Executed checks                                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsive layouts      | All ten sections at 320, 375, 390, 430, 768, 1024 and 1440 px in both themes; document overflow assertions; long unknown INCI string; screenshot artifacts                             |
| Automated accessibility | Axe WCAG A/AA rule tags over every section at 390/1440 px, light/dark; no violations reported                                                                                          |
| Keyboard                | Skip link/main focus, routine completion focus retention, native navigation/buttons                                                                                                    |
| Skincare                | Add/edit/delete, malicious procedure name treated as text, selected-date completion and reload, one-off date before recurring start                                                    |
| Hair                    | Add/edit/delete, completion and reload                                                                                                                                                 |
| Products                | Name/brand/INCI/photo save, edit and photo removal, delete, local normalized search, analysis, persistence                                                                             |
| Ingredients             | Full/synonym/partial search, unknown result, XSS payload, matched counts, explicit unavailable-reference state                                                                         |
| Migration               | Original skin, hair and reflection keys preseeded; schedule, reflection and historical checkmarks retained                                                                             |
| Backups                 | Version 4 includes products/hair/reflections; product restore; invalid-date rejection; progress photo persists and appears in export                                                   |
| Dates                   | Leap years, invalid dates, inclusive recurring boundaries; browser local-day behavior in Pacific/Kiritimati and America/Los_Angeles; unit UTC/local and DST cases                      |
| PWA                     | Worker activation, shell/modules/data available offline, offline product save, production subpath                                                                                      |
| Failure handling        | Reference download failure; IndexedDB quota exception does not report a successful product save; corrupt legacy stores are retained; failed routine write restores the unchecked state |

The supplied archives add pairwise control-overlap, viewport-centering and seven-column checks at four sizes in both themes; CSS and physical chart-width checks; 200/201-entry behavior; delayed-reference behavior; unrelated-storage persistence; and repeat-render stability. Axe incomplete results are retained as JSON attachments for manual review. All executed geometry/axe audits are required checks; they are not marked `continue-on-error`.

The HTML report, JSON (`test-results/results.json`), JUnit XML (`test-results/results.xml`), layout PNGs and any failure traces are generated by the suite and intentionally ignored by Git. CI uploads these directories as QA artifacts. Screenshots were visually inspected for representative narrow/light and desktop/dark layouts; the same original abstract imagery was retained. Automated screenshots are observational artifacts, not approved pixel-reference baselines.

## Limits and remaining release checks

- This run used Chromium on Linux only. Safari/iOS, Firefox, physical Android devices, Telegram WebViews, real PWA install/update prompts and cross-browser storage quotas have not been validated.
- Automated axe success is not full WCAG 2.2 AA certification. Manual screen-reader, forced-colors, 400% zoom, text spacing, touch and usability review remain.
- No global cosmetic product API is integrated. No numeric comedogenicity grades are verified in the provided dataset; the UI explicitly shows unknown evidence.
- The supplied archives were received in the follow-up. Unmodified compatibility probes fail (24 unit tests and one selected browser scenario); these are reported separately from adapted v2 tests. See [SUPPLIED-TESTS.md](SUPPLIED-TESTS.md) for the complete mapping and the original tests not executed.
- Cross-store restore cannot be fully crash-atomic. Rollback is attempted and failures are disclosed; export a current archive before import.
- No production Pages deploy, Telegram launch or remote Actions success is established by these local results. Repository publication status is recorded separately in the handoff.

## Editorial-specific coverage

Calendar is the initial screen; all other sections remain available only through the glass drawer. The seven-width/two-theme matrix checks default state, 44 px nonoverlapping header controls, menu visibility, Escape/button/outside closure and viewport bounds. Additional tests cover keyboard focus cycling, every destination, reload defaults, denied theme storage, legacy system preferences, scroll restoration, short landscape viewports, live reduced-motion changes and different layer scroll rates. Both open-drawer themes pass axe checks; incomplete findings remain attached for manual review.

The first full redesign run identified two issues: permanently reserved scrollbar space shifted desktop centering, and raw PNG equality was unstable at sparse antialiased edges. Centering was corrected in production CSS/scroll-lock logic. The visual test now decodes pixels, requires identical dimensions, permits at most one channel level of rounding in at most 0.01% of pixels, and attaches the measured differences. A synthetic sentinel rejects a one-pixel geometry shift and a full-frame palette change. No current test is disabled to hide a failure; the archive originals remain byte-identical and the four existing missing-baseline skips are unchanged.

Visual previews in `docs/previews/` were copied from the passing final run's fresh profiles. WebKit and Firefox executables were unavailable in this environment; no real iPhone Safari, VoiceOver or physical Android validation is claimed. The stylesheet includes safe-area, dynamic-viewport and backdrop-filter fallbacks, but device review remains a release check.
