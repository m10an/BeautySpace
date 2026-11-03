# BeautySpace delivery — 3 November 2026

Based on `origin/main` at `febd312`. Existing source, calendars, storage formats, IndexedDB, supplied archive originals, Pages and workflows are retained. No commit was made to main and no PR was merged.

## Review branches and manual PR links

GitHub API PR creation was attempted with `gh pr create`; it returned `Post "https://api.github.com/graphql": Forbidden`. No PR is claimed created. Use these stacked comparisons so each review contains its own scope. Merge only after review, in order; retarget later PR bases as needed.

| Scope                | Base                          | Manual creation                                                                                                               |
| -------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Luxury visual polish | main                          | [Create visual PR](https://github.com/m10an/BeautySpace/compare/main...feature/luxury-visual-polish?expand=1)                 |
| INCI database/search | feature/luxury-visual-polish  | [Create INCI PR](https://github.com/m10an/BeautySpace/compare/feature/luxury-visual-polish...feature/inci-v2?expand=1)        |
| Routine builder      | feature/inci-v2               | [Create builder PR](https://github.com/m10an/BeautySpace/compare/feature/inci-v2...feature/routine-builder?expand=1)          |
| AI integration       | feature/routine-builder       | [Create AI PR](https://github.com/m10an/BeautySpace/compare/feature/routine-builder...feature/ai-routine-consultant?expand=1) |
| IPL tracker          | feature/ai-routine-consultant | [Create IPL PR](https://github.com/m10an/BeautySpace/compare/feature/ai-routine-consultant...feature/ipl-tracker?expand=1)    |

## Working functionality and limits

- Original generated skincare still life, licensed self-hosted Montserrat, warm glass UI, mobile alignment and reduced-motion-aware depth. No people or new stock photographs. Provenance is in `assets/ASSETS.md`.
- One-input INCI analysis and indexed alias lookup over 28,353 distinct MIT-licensed catalog names, with retained legacy descriptions. Petrolatum/Vaseline, Olive Oil and Grape Seed Oil aliases are covered. The source is pinned and checksummed; publisher-supplied CosIng identifiers are not independently reverified official data. Numeric evidence is separate and currently empty: the app says «Недостаточно данных», never invents 0–5 or a finished-product safety verdict.
- Manual five-step builder, presets, schedule copy, preview, confirmed append and duplicate rejection. Existing advanced/Hair editors and user data remain available.
- AI interview, explicit opt-in sharing, local rule-based overlap notices, real OpenAI backend adapter, server/client strict JSON validation and editable confirmed append. No provider secrets are in the static build. **No live model request or server deployment was performed** because credentials/configuration are absent. Default UI truthfully reports AI unavailable. See [server deployment and privacy](../../server/README.md).
- Local IPL device/session tracking, per-area counts, completed/upcoming/missed/cancelled status, edit/postpone, explicit preview/confirmation, duplicate rejection, selected-date calendar display and separate versioned archive. **Automated device-specific IPL scheduling is unavailable:** no verified exact-model guidance exists in the catalog. The AI entry offers a local interview and manual fallback; it never fabricates intervals, settings or product-discontinuation windows. See [IPL scope and prerequisites](IPL-TRACKER.md).

## Verification

`CHROMIUM_PATH=/usr/bin/chromium npm run test:all` completed successfully: syntax/integrity checks passed; **88 unit tests passed**, zero failures/skips; **98 browser tests passed**, zero failures, four pre-existing baseline skips (102 discovered), no local retries; production build passed. A final targeted IPL rerun covers the subsequently added offline/corrupt-record guard; its result is recorded below. Production build excludes `server/` and environment files. Existing workflows remain unchanged; Playwright jobs remain Ubuntu 24.04. Four pre-existing approved-screenshot-baseline skips remain because approved PNGs were not supplied; no required check was disabled.

The initial full run exposed an invalid ARIA attribute, above-fold desktop placement and collapsed-editor geometry. These were corrected in production code and distributed into their corresponding branches. An initial IPL run exposed the new menu item's missing shared markup; this was fixed before the final full run. No test assertion was weakened to hide these problems.

Coverage includes 320, 375, 390, 430, 768, 1024 and 1440 px; both themes; overflow; axe audits; reduced motion; CRUD; migration; confirmation; no-write previews; local persistence; malformed/provider-rate-limited AI responses; server origin/consent/challenge gates; paid-request race limits; offline shell and Pages subpath. AI responses in tests are explicitly synthetic contract fixtures, not evidence of a functioning hosted model.

Real iPhone Safari, VoiceOver, physical IPL devices, clinical suitability, remote Actions success and production deployment have not been verified. Linux Chromium viewport emulation is not an iOS test. Provider/Turnstile access, billing/spend caps, public HTTPS server, origin/hostname configuration and a consented real request are required before enabling AI.

## Screenshots

Fresh disposable profiles; no real user records. Screenshots are observations, not approved pixel baselines.

- [Calendar, mobile](../previews/current/calendar-mobile.png)
- [AI unavailable state, mobile](../previews/current/ai-mobile.png)
- [IPL tracker, mobile](../previews/current/ipl-mobile.png)
- [Calendar, desktop dark](../previews/current/calendar-desktop-dark.png)

## Changed files

See `CHANGED-FILES.txt` beside this report for the complete list relative to main. Main implementation groups: `index.html`, `style.css`, `app.js`, `shell.js`, `sw.js`; original image/fonts in `assets/`; licensed catalogs in `data/`; `ingredients.js`, `lib/domain.js`, `lib/inci-reference.js`, `products.js`; `builder.js`, `lib/routine-plan.js`, `lib/dialog.js`; `ai-client.js`, `lib/ai-plan.js`, `runtime-config.json`, `server/`; `ipl.js`, `lib/ipl.js`; build/check/import/serve scripts, unit/E2E tests and release documentation. Workflows and original supplied test files are unchanged.
