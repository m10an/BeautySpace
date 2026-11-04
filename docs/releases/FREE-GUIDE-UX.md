# TheBeauty Journal — free consultant and editorial UX

Feature branch `feature/free-consultant-editorial-ux`, based on actual `origin/main` `7789e98` (which already merged the previous visual/INCI/builder/AI/IPL work). No rebuild, storage migration, user-record deletion, direct main commit or merge was performed.

## Implemented

- Free local consultant is the default. It consumes optional interview fields and the selected calendar week locally, explains its small deterministic rule set and creates only editable basic-care drafts. It is **not labeled generative AI**. No API key, hosted account, network upload or billing is required. High sensitivity/active-overlap/frequent-calendar-use notices are cautious, not diagnoses. Named active treatments are not turned into daily basic-care schedules. Severe symptoms stop planning and escalate to medical care.
- Shared JSON plan validation, editable names/steps/days/dates, required-field/range checks, explicit review and calendar confirmation remain. Matching names/time with overlapping weekday/date ranges are rejected rather than appended twice. Existing procedures/checkmarks/photos/products and IPL records remain intact.
- OpenAI is retained only as an optional disabled adapter. Public `enableHostedAI:false` and server `AI_ENABLE_PAID_PROVIDER=false` both ship off; keys alone cannot enable paid calls. No hosted free-tier claim, paid activation, live model request or backend deployment was made. Existing per-request consent, verification, budgets and error handling remain behind explicit optional configuration.
- Mobile consultant uses a fixed heading plus one inner content scroller, safe-area margins, 16px fields, background scroll restoration and `visualViewport` height/top updates. Preview navigation scrolls content intentionally after the user requests it; keyboard focus does not add a second dialog scroller. Native keyboard/focus controls remain.
- Meaningful visible labels, example placeholders, required markers/notes and contextual inline errors are applied across forms; submitted values survive validation failures. Private reflection now has an explicit label. Date commits cannot trigger the legacy picker handlers with an invalid required date. Existing domain/file/backup validators remain in place.
- Help is always available in the compact header, with seven actual feature topics, Previous/Next, counter, Close, Skip and Escape. The brand is an accessible Home anchor, and the consultant has an internal Home control to respect modal background inertness. Active navigation labels use Poppins 600.
- Poppins functional UI, Cormorant Garamond Regular headings/quotes and sparing Pinyon Script accents are self-hosted under verified SIL OFL terms. WOFF2 web files total about 288 KB; original font bytes, licenses and hashes remain in `assets/`. Generated/legacy decorative photographs and artificial grain are no longer rendered. The absence of the three reference photographs leads to a quiet typographic editorial layout, not an imitation image or unlicensed stock substitution.

## Inspirations — blocked on missing attachment

The requested PDF and three photographs were not among accessible attachments. Only the three earlier test ZIPs were found, and the user was asked to provide the missing files. No actual PDF extraction/curation or reference-photo match is claimed completed.

The 1,000 unrelated generated reflections are removed from the live static dataset. `inspiration.json` now has an empty, source-specific versioned collection; the UI truthfully says no approved PDF excerpts are available. There are no fabricated quotes/authors or random fallbacks. A strict validation gate, deterministic local-day rotation, source-page/attribution display, offline behavior and a membership-checking import script are implemented for the actual PDF once supplied. [Source/import/copyright details](../INSPIRATIONS-SOURCE.md).

## Verification

A full `CHROMIUM_PATH=/usr/bin/chromium npm run test:all` run passed syntax/integrity checks, 98 then-current unit cases, the static production build, and **107 browser cases with zero failures, four pre-existing approved-baseline skips** (111 discovered, no local retries). The first run failed only a now-stale Montserrat assertion; the adapted test now asserts the requested Poppins/Cormorant fonts. Original supplied archive files remain byte-identical.

Final syntax/integrity checks passed again, including all 14 untouched supplied files. **99/99 unit cases passed** after the last safety guard. The final narrow browser run passed **44/44** with zero failures/skips, covering consultant/Help, required captions, header/navigation at all widths, dialogs, builder, duplicate confirmation and named-active refusal. The full 107-pass report remains in `playwright-report/` and `test-results/`; supplementary output is `/tmp/beauty-free-target.log`. Production build, formatting and `git diff --check` passed. The static per-field audit covers 115 controls with no missing labels.

Coverage: 320/375/390/430/768/1024/1440 px, light/dark, keyboard, touch contexts, overflow, axe rules, reduced motion, background scroll restoration, keyboard-sized viewport changes, free offline processing/no network calls, plan preview/confirmation/duplicate failure, medical escalation, Help, Home from every section, labels/length bounds, legacy CRUD/backup/PWA and approved-source-only Inspirations.

WebKit installation was attempted with `npx playwright install webkit` and failed with `403 Domain forbidden` at the configured download destinations. Real iPhone Safari, VoiceOver, physical Android and clinical/device safety remain unverified. Chromium viewport/keyboard-size emulation is not an actual iOS virtual keyboard test. No remote CI or Pages deployment success is claimed from local results.

## Review material

- [User journeys and complete form groups](../USER-JOURNEYS.md)
- [Per-field DOM audit, no values recorded](../FORM-AUDIT.json)
- [Font/asset licensing and provenance](../../assets/ASSETS.md)
- [Optional server configuration and explicit paid opt-in](../../server/README.md)
- [Mobile Home](../previews/free-guide/home-mobile.png), [Help](../previews/free-guide/help-mobile.png), [free interview](../previews/free-guide/consultant-mobile.png), [editable preview](../previews/free-guide/preview-mobile.png)
- [Desktop Home](../previews/free-guide/home-desktop.png), [desktop dark consultant](../previews/free-guide/consultant-desktop-dark.png), [missing-PDF state](../previews/free-guide/inspiration-source-pending.png)

The last cosmetic Help-border/preview-gap refinement also passed its focused 3/3 browser checks. [Complete changed-file list](FREE-GUIDE-CHANGED-FILES.txt).

Principal changed files: `ai-client.js`, `lib/free-consultant.js`, `lib/ai-plan.js` (reused), `lib/routine-plan.js`, `lib/form-rules.js`, `forms.js`, `help.js`, `lib/dialog.js`, `index.html`, `shell.js`, `style.css`, `app.js`, `inspiration.js`, `lib/inspiration.js`, `inspiration.json`, `scripts/curate-inspirations.py`, font/license files, server enable gate, build/SW asset revisions and unit/E2E tests. `package.json`, production dependencies, IndexedDB schemas, user storage keys and CI/CD workflows are unchanged.

## Publication

Code commit `c098695` was pushed to `feature/free-consultant-editorial-ux`. Creating the requested draft PR was actually attempted with `gh pr create`; GitHub returned `Post "https://api.github.com/graphql": Forbidden`. No PR is claimed created, and no merge or direct main change was made.

[Create the PR manually against main](https://github.com/m10an/BeautySpace/compare/main...feature/free-consultant-editorial-ux?expand=1). Suggested title: **Add free consultant, stable mobile dialogs and editorial UX**. Keep the missing source-PDF curation clearly marked as pending review; this branch does not contain fabricated quotations or a claim of completed PDF extraction.
