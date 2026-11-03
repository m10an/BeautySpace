# Editorial home and navigation redesign

Branch: `feature/editorial-ui-redesign`, based on current `origin/main` (`29563a2`). The previously merged Beautycalendar 2.0 features and Ubuntu 24.04 CI configuration are retained.

## Composition

Calendar is the default screen on every launch/reload. A compact sticky masthead has only a left menu control, centered serif wordmark and round sun/moon theme control. The former large hero, category grid, version/storage label, skin/hair/self-care strapline and theme dropdown are removed. On desktop the month and selected day's care sit side by side; below 900 px they stack. The month remains seven columns even at 320 px. A small arch-shaped crop uses the original image, without introducing new imagery or licensing claims.

All ten destinations are available in the specified order through an off-canvas `dialog`: Calendar, Hair, Ritual, Journal, Insights, Inspiration, Journal Prompts, My Products, Ingredient Check and More. The panel uses translucent paper, 22 px backdrop blur, a soft edge/shadow and serif typography with quiet numeric indexes. It falls back to solid paper when backdrop filters are unsupported. Native modal semantics make the background inert; explicit first/last Tab cycling supplements browser behavior. The nav has independent scrolling for short landscape viewports. Closing by button, Escape or outside click restores focus and the prior scroll position. Selecting a destination focuses main and scrolls the new screen to the top.

Warm existing color tokens are retained in both themes. Two fixed gradient layers and a subtle static grain layer give depth without putting a texture over the text. The scroll controller reads only scroll position, schedules at most one animation frame at a time and caps movement; image movement is capped too. It does not run a persistent frame loop. Reduced-motion changes are handled live: transforms reset, layer promotion is removed, and drawer/section/theme transitions are disabled. CSS padding uses `env(safe-area-inset-*)`; the panel uses dynamic viewport height with a `vh` fallback.

## Compatibility

No browser data schema, storage key, database version or backup format changes. Existing sample/custom care schedules, checkmarks, observations/photos, reflections, product collection, ingredient search/analysis and backup handlers remain. The legacy navigation handler was extracted as `activateSection(id)` so the shell can close the modal without duplicating feature logic. It accepts only known section identities.

The existing theme key still accepts `system`, `light` and `dark`. An untouched legacy `system` preference follows OS changes; pressing the icon saves an explicit choice. Failed storage writes produce a session-only status message. The button's action label and pressed state are synchronized with the effective theme.

The worker cache is bumped to `beautycalendar-v2-editorial-1`. Changed shell scripts/styles use `?v=21` URLs; the shell's app import and product module's ingredient import use the same canonical URLs as the page. This prevents an old active worker from serving a cached pre-redesign shell to new HTML and prevents duplicate ingredient controllers. New workers retain the waiting-update policy. Close existing app tabs to activate an update; never clear user storage.

Both GitHub Actions workflows remain unchanged. Main-only Pages deployment, all quality gates, source archive hashes and tests remain in place. No merge or deployment is performed by this branch.

## Verification

The complete active command is `CHROMIUM_PATH=/usr/bin/chromium npm run test:all` (or use Playwright-managed Chromium after installation and omit the selector). It includes syntax/data/original-archive integrity, all unit tests, a production build and the full E2E suite. Reports, seven-width home/drawer PNGs, axe findings and failure traces are generated in ignored `test-results/` and `playwright-report/` and uploaded by existing CI.

New tests cover:

- 320, 375, 390, 430, 768, 1024 and 1440 px, both themes: Calendar first, hidden nav when closed, readable calendar above the fold, nonoverlapping 44 px header controls, drawer geometry, all destinations, Escape/button/outside close and screenshots.
- Focus cycling, selected destination state, all ten sections, default Calendar after reload and focus placement after selection.
- Axe audit with the modal open in light/dark, preserving incomplete findings for manual review.
- Theme persistence, old system preference, accessible action labels and denied-storage behavior.
- Different background scroll rates; live reduced-motion changes reset/disable transforms and transitions.
- Physical header click after scrolling: background lock and position restoration; short phone landscape navigation.

The earlier functional/backup/PWA/ingredient tests use the new navigation helpers; assertions remain. Full-screen layout coverage also includes the new 430 px width. The four historical screenshot-baseline comparisons remain explicitly skipped because no reviewer-approved PNGs were supplied; new screenshots are observations, not self-approved design baselines.

The first implementation exposed a keyboard edge: the browser could move from the first modal control into browser chrome. An explicit Tab/Shift+Tab loop fixes it. Coordinate-based outside-click tests wait for the panel's transform to settle, and the scroll-lock test uses physical mouse coordinates because Playwright's `scrollIntoView` on a sticky header can itself reset the page before a click. These changes preserve the actual user-facing assertions. The inherited geometry audit also caught a 15 px desktop shift from a permanently reserved scrollbar gutter; the gutter was removed and actual scrollbar compensation is now applied only while the modal locks the body. Full-page captures initially differed by one RGB level at a few antialiased edges as Chromium initialized compositor surfaces. The screenshot comparison now decodes pixels and requires identical dimensions, at most one RGB/alpha level of difference and at most 0.01% changed pixels. It retains both captures and attaches the measured differences. A synthetic regression proves that a one-pixel geometry shift and a one-level full-frame palette change are detected; sparse one-level rounding is the only allowed noise.

Final executed counts and scope are recorded in [QA.md](QA.md). Chromium mobile viewport/touch emulation does not prove real iPhone Safari or Android behavior. No physical-device, WebKit, real VoiceOver or performance trace run is claimed. The third design reference was not present in available attachments; the design follows the written direction rather than a claimed image comparison.

## Changed files

- Interface and navigation: `index.html`, `style.css`, `shell.js`, `motion.js`.
- Integration and offline assets: `app.js` (section activation only), `products.js` (canonical ingredient module URL), `sw.js` (versioned shell cache).
- Active tests: `tests/e2e/app.spec.js`, `tests/e2e/supplied.spec.js`, new `tests/e2e/navigation.js`, `tests/e2e/editorial.spec.js`, `tests/e2e/visual.js`.
- Documentation: `README.md`, `docs/DESIGN.md`, `docs/QA.md`, `docs/SUPPLIED-TESTS.md`, this report.

Production dependencies, dataset content, database schemas, backup implementation and both workflows are unchanged. All 14 supplied archive originals continue to match their SHA-256 manifest.

## Preview captures

Captured from fresh test profiles; these are review previews, not approved regression baselines:

- [Mobile Calendar, light](previews/calendar-mobile.png)
- [Mobile glass drawer, light](previews/drawer-mobile.png)
- [Desktop Calendar, dark](previews/calendar-desktop-dark.png)
