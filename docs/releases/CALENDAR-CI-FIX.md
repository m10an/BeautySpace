# Calendar first-viewport regression — CI repair

Branch: `feature/design-masterplan-editorial`, based on `f789403`; main and existing PR #10 are preserved.

## Failure and reproduction

Public GitHub Actions runs [Quality push #41](https://github.com/m10an/BeautySpace/actions/runs/42028931265) and [Quality PR #42](https://github.com/m10an/BeautySpace/actions/runs/42030300446) report failure. The authenticated Actions API returns `Forbidden`; public job pages require sign-in for full logs. Therefore the full assertion was reproduced locally rather than claiming access to those private logs.

The two reproduced failures are `tests/e2e/editorial.spec.js:30:5` → `editorial 320px light` and `editorial 320px dark`. Both fail the unchanged `expect(calendar.y).toBeLessThan(400)` assertion: expected **<400**, received **421.8125**. The other 12 width/theme combinations pass before the fix.

The toolbar's Month/Week/List group and Add/edit action are flex items. At 320px the usable width is 288px. On the older headless renderer the groups measure 165px and 120.797px; including the 8px gap requires 293.797px, causing a second row. The toolbar grows from 44px to 96px and pushes the calendar down 52px. On system Chromium 154 the widths are 160.516px and 118.625px, totaling 287.141px: it narrowly fits and concealed the defect in the earlier local checks. This is a real responsive regression; the original <400px assertion is correct.

The same 320px reproduction exposed a last-letter wrap in the bottom Calendar navigation label. Header controls themselves stayed at least 44px and did not overlap.

## Fix

- `style.css`: use the existing 4px spacing token for narrow toolbar button padding and an 8px text/arrow gap. Buttons keep their 44px minimum targets; labels/font sizes/colors and desktop composition are unchanged. The older renderer now needs 149 + 116 + 8 = 273px, fits one row, and places the grid at **369.8125px**. Remove unnecessary inline padding from mobile shortcuts and keep their labels on one line, without shrinking their font or touch targets.
- `tests/e2e/editorial.spec.js`: retain the exact <400px assertion and all prior navigation checks. Add nonoverlap/same-row checks for toolbar groups and one-line, contained, 44px-minimum shortcut checks. No tolerance, timeout, retry or artificial sleep is added.
- `index.html`, `sw.js`: stylesheet revision 30 and worker cache `beautycalendar-v2-masterplan-2` deliver the fix to installed PWAs without clearing local data. App/controller versions and all storage formats stay unchanged.
- [Before, 320px](../previews/ci-calendar/320-before.png) / [After, 320px](../previews/ci-calendar/320-after.png): disposable empty-data profile, older headless renderer, both captures on the same day. Original masterplan review screenshots are retained.

## Verification

A clean `npm ci --no-audit --no-fund` uses the unchanged lockfile and Playwright 1.58.2. The targeted 14-case width/theme suite passes on both Chromium 143 and system Chromium 154 after the fix. No retries were enabled for these targeted runs.

`CI=1 CHROMIUM_PATH=/tmp/chromium npm run test:all` completed successfully: syntax/JSON/evidence checks passed (all 14 original supplied files verified), **111 unit passed**, production build passed (**38 frontend files plus assets/data**), **128 E2E passed, 4 pre-existing missing-baseline skips, 0 failures, 0 flaky tests**, 7.0 minutes. No retry was needed. The full suite includes all responsive widths/themes, header/drawer controls, keyboard/focus, reduced motion, free consultant, routine and IPL confirmation/persistence, INCI, quote provenance and offline/PWA tests. Formatting and `git diff --check` also passed.

Local environment: Debian 13, Node 24.19.0, Python 3.12. Playwright's pinned Chromium 145 download was attempted and rejected with `403 Domain forbidden`; the Ubuntu 24.04 Playwright image pull was also rejected by network policy. Chromium 143.0.7499.0 was obtained from the published `@sparticuz/chromium@143.0.4` npm package in a temporary directory, outside the app and its dependencies. It reproduces the reported layout failures; it is not represented as the exact GitHub runner. The full local suite uses `CI=1`, the pinned test library, two workers and the repository configuration. Actual GitHub-hosted Ubuntu 24.04/Chromium 145 results for both push and PR checks must be verified separately after push; their final status is reported in the task response.

Calendar logic, user data, free local consultant, IPL, INCI, the approved design tokens/fonts, offline behavior and existing workflows are preserved. No new PR, merge or Pages deployment is performed by this fix.
