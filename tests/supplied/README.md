# Supplied test archives

`original/` contains the **unchanged bytes** of all 14 files from the user's three ZIP attachments. The workflow, package manifests, configuration, tests, fixtures and old reports are retained for review, not installed over the v2 project. They are not discovered by the active Playwright/unit test directories. Reports inside `original/` refer to the earlier application commit, not this implementation or current CI.

`archive-manifest.json` records SHA-256 hashes of each original ZIP and extracted file. `npm run check` fails if a preserved file changes. `.prettierignore` keeps formatting from rewriting them.

The adapted executable tests are `tests/unit/supplied.test.js` and `tests/e2e/supplied.spec.js`. See [mapping and compatibility results](../../docs/SUPPLIED-TESTS.md).

Commands from the old archive have convenience equivalents in the project: `npm run test:unit`, `npm run test:audit`, `npm run test:visual`, `npm run test:all`. All current audits are blocking when executed; only missing reviewer-approved visual baselines are explicitly skipped. No baseline is auto-approved.

For an **expected failing** compatibility diagnostic: `CHROMIUM_PATH=/usr/bin/chromium npm run test:legacy-probe`. This runs the original 24 unit tests and one selected original browser scenario against a temporary copy of the current build. It returns their nonzero status and saves logs/traces under `test-results/supplied-probe/`. It does not change the app or run the remaining original browser tests. It uses current pinned tool versions, disables video to permit system Chromium without Playwright ffmpeg, redirects reports and selects the installed executable. The test source itself is not transformed. Port 4173 must be free. Do not run this diagnostic concurrently with the main browser suite because both use `test-results/`.
