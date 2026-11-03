# Supplied archives: execution and migration

Received and inspected on 3 November 2026 after the first Beautycalendar 2.0 handoff. The three ZIPs contain a workflow, pinned QA dependencies/configuration, and tests/reports designed for original commit `8437a9eae0f5892fdba22808b2b4326fff355d6e`. All 14 original files are preserved byte-for-byte in `tests/supplied/original/`; ZIP and file hashes are in `tests/supplied/archive-manifest.json`. Archived reports and PR instructions are historical material, not evidence of a new run or instructions to overwrite v2.

## What was actually run unchanged against v2

- **24 original unit tests: 0 passed, 24 failed**, exit code 1. In 23 cases the old `vm.runInNewContext` harness cannot parse the ES module imports in the current `ingredients.js`. The final schema assertion requires exactly three old keys and fails on the intentional expanded schema. These are harness/contract incompatibilities, not 24 independently established product bugs.
- **One original browser scenario**, desktop aliases/clear: failed in setup, exit code 1. The old fixture lacks `synonyms`, `comedogenicity` and `cautions`; current validation disables analysis, so the legacy beforeEach cannot proceed. The diagnostic used an 8-second timeout to bound this known setup mismatch. **The other original browser tests were not executed unchanged.**
- Toolchain: the project's current Playwright 1.58.2 and axe integration 4.11.1 with system Chromium. The old 1.57.0/4.10.2 manifests were preserved, not installed over the current lockfile. For the diagnostic only, the execution configuration selects the installed browser, disables video and redirects artifacts; test assertions remain untouched.

`npm run test:legacy-probe` reproduces this diagnostic in a temporary build copy. It deliberately returns failure if either original test command fails; reports/logs are written to `test-results/supplied-probe/`. The default v2 pipeline does not pretend these old tests pass.

## Scenario mapping for v2

| Archived check                                             | Current executable coverage and intentional difference                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flagged/recognized percentages and qualitative risk labels | Independent recognition counts, all-unknown, mixed known/unknown, duplicates, aliases, historical notes and zero verified ratings in `supplied.test.js`. In the browser, five coverage cases check text, CSS percentage and physical fill width within 1 px. Fragrance is not recast as comedogenicity. |
| 200/201 ingredients                                        | 200 accepted; 201 rejected with an explicit message and no partial report. Silent truncation is not retained.                                                                                                                                                                                           |
| Empty input, escaping and clear                            | Empty/delimiter/prefix-only values, literal malicious names, no injected elements, results hidden and input focused after clear. Existing v2 XSS browser check retained.                                                                                                                                |
| Empty/malformed/outage reference                           | Empty/malformed data fails validation; existing outage scenario remains; new delayed-response scenario proves the button cannot publish a premature zero-match report.                                                                                                                                  |
| Real database schema                                       | The descriptive name/category/note fields remain required; expanded evidence/synonym fields are validated rather than rejected. Existing real-reference E2E remains.                                                                                                                                    |
| Skin/hair/settings/reflections persistence                 | Existing CRUD/completion tests retained; added combined settings, mood, hair/reflection round-trip and exact unrelated-localStorage preservation.                                                                                                                                                       |
| IndexedDB photos                                           | Existing v2 real-raster upload, reload and full backup checks retained. The archived synthetic PNG is not used as a user's photo.                                                                                                                                                                       |
| Geometry                                                   | All ten v2 screens, both themes, 320/390/768/1440 px; centering, viewport bounds, pairwise control overlaps, seven columns. Existing six-width tests still run.                                                                                                                                         |
| Axe audit                                                  | Additional checks at four sizes with mobile touch emulation at 320/390; both violations and incomplete findings attached for review. Existing dark/light audits remain.                                                                                                                                 |
| Fonts and fixed old palette                                | Current documented system body/serif heading fallbacks plus Google stylesheet declared in HTML head. The old CSS `@import` requirement and old color values intentionally do not apply. Fonts are blocked in these scenarios to verify fallback behavior.                                               |
| Repeat-render stability                                    | Two screenshots of the same loaded state with a fixed Date, reduced motion, fonts blocked and images decoded, compared byte-for-byte at four sizes. Not an approved design baseline.                                                                                                                    |
| Approved screenshot baselines                              | Four explicit skips because no reviewer-approved PNGs were supplied. The tests do not create or accept baselines automatically.                                                                                                                                                                         |
| Workflow/package/config                                    | Existing current versions and complete CI/CD retained; original resource checks added to `npm run check`, JSON reports and original-file integrity checks enabled, unit logs uploaded. All active geometry/axe audits block CI; no `continue-on-error` is imported.                                     |

The CSS percentage assertion permits CSSOM's approximately six significant digits of serialization (for example `33.3333` for one third) while separately keeping the original one-pixel physical-width tolerance. The initial five-decimal assertion was corrected after observing browser serialization; no application algorithm or pixel tolerance was changed to make it pass.

## Running the integrated checks

```sh
npm ci
npm run check
npm run test:unit
CHROMIUM_PATH=/usr/bin/chromium npm run test:supplied
CHROMIUM_PATH=/usr/bin/chromium npm run test:all
```

Without system Chromium, run `npx playwright install --with-deps chromium` and omit `CHROMIUM_PATH`. `test:supplied` selects adapted browser scenarios; `npm test` includes both the earlier v2 and supplied unit suites. `test:all` executes the complete active syntax/integrity/unit/browser suite, including audits and explicit baseline skips. HTML, JSON and JUnit reports are generated in `playwright-report/` and `test-results/`. The optional legacy probe has a separate intentionally failing result and is not part of the v2 gate.

Current final pass/failure/skip totals are recorded in [QA.md](QA.md). Manual review of axe incomplete results, approved visual references, Safari/iOS and real Telegram testing remain outside the automated claims.
