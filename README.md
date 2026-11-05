# Beautycalendar 2.0 — The Beauty Journal

A private, offline-first skin, hair and self-care journal. Built from the real Beautycalendar source while preserving its editorial imagery, routines, progress photos, reflections and browser storage keys.

## Run locally

Use Node.js 24+ and Python 3. The offline app requires no backend or API keys. The free consultant runs locally with explicit rules, without API keys, billing or data uploads. Generative AI is an optional disabled mode requiring a separate server; see [server setup](server/README.md).

```sh
npm ci
npm run dev
```

The HTTP server binds to `127.0.0.1:8000`. Open it in a local browser. Serve over HTTPS for production PWA installation; do not open `index.html` as a file. Poppins, Cormorant Garamond and Pinyon Script are self-hosted under SIL OFL; see [asset provenance](assets/ASSETS.md).

## Checks and production build

```sh
npm run check
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
```

For a preinstalled system Chromium: `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. The browser suite builds its production artifact first. Test results, screenshots, failure traces and JUnit XML are in ignored `test-results/` and `playwright-report/`. `dist/` contains only the deployable application.

Convenience commands: `npm run test:all` runs the complete current gate; `test:unit`, `test:supplied`, `test:audit` and `test:visual` select subsets. Four screenshot-baseline checks remain explicitly skipped until reviewer-approved PNGs are provided. The optional `test:legacy-probe` reproduces known failing compatibility checks for the untouched old tests; it is separate from the v2 gate.

## Features

- Home opens first with an editorial daily overview, approved reading and Open today action. Calendar remains a dedicated month/week/list destination. Desktop section rail, mobile shortcuts and the full frosted drawer share active states.
- Independent skin/hair calendars; create, edit, delete, schedule and complete care steps.
- My Routine has AM/PM views and actual completion progress using original checkmarks. Personal product shelf supports name, brand, category, INCI, uploaded photo, edit/delete, local search and category filters.
- Case-insensitive, whitespace-normalized partial INCI/synonym search in a pinned MIT-licensed catalog of 28,353 distinct ingredient/common names.
- INCI recognition and accessible reference-coverage charts. **No verified numeric comedogenicity ratings are present in the source data.** Unknown evidence is displayed explicitly, never as a zero score. Fragrance sensitivity is separate from comedogenicity.
- Device-local observations, progress photos, reflections, insights and a versioned backup covering all stores.
- Responsive light, dark and system themes, keyboard focus and reduced-motion support.
- Same-origin PWA shell and offline ingredient reference. The default free guide sends no data. Only explicitly consented optional hosted interview text leaves the device. Photos and journal records are excluded.

The product search covers **your own collection**, not a global catalog. See [architecture](docs/ARCHITECTURE.md) for an external-catalog and Telegram Mini App integration plan and current limits.

## Data and upgrades

Export **everything, including photos** in **Menu → Settings & Privacy → Backup & restore** before deploying an update or changing browser/origin. Version 4 exports include skin state, hair state, reflections, products and photos. Version 3 skincare/photo archives are still accepted. Missing stores in older archives are left unchanged. Restore validates before writing; included stores are replaced and progress photos merged by ID. Failed restore attempts rollback, with an explicit warning if rollback also fails. Avoid concurrent edits in other tabs while restoring.

Existing storage keys are retained: `girly-skincare-v1`, `beautycalendar-hair-v1`, `beautyjournal-private-prompts-v1`, and IndexedDB `beautycalendar-private-photos`. The new product collection uses separate IndexedDB `beautycalendar-v2`. Corrupt skincare state is not silently overwritten by routine edits. Browser storage is not encrypted or cloud synced; backups are sensitive, unencrypted JSON files. Moving between GitHub Pages origins, Telegram and browsers requires explicit backup transfer.

New service workers wait for old tabs to close. Close all existing app tabs after a deployment, reopen and verify the new version. Cache activation only removes caches belonging to this app, never browser storage. Never clear Safari data as an upgrade step.

## CI/CD

[Quality](.github/workflows/ci.yml) checks syntax, evidence schema, unit tests, production build and Chromium E2E/axe checks on pushes and pull requests, retaining QA artifacts. [Deploy Pages](.github/workflows/deploy.yml) repeats quality gates and deploys the static artifact from `main` only.

Repository settings must enable **Pages → Source → GitHub Actions**. Feature branches do not deploy. Merging is a separate release decision. No production deployment or hosted CI success is implied by local passing tests.

## Documentation

- [Source and design audit](docs/AUDIT.md)
- [Design tokens and accessibility](docs/DESIGN.md)
- [Editorial UI redesign and QA scope](docs/EDITORIAL-REDESIGN.md)
- [Architecture, catalog and Telegram plan](docs/ARCHITECTURE.md)
- [Ingredient evidence audit and limitations](docs/INGREDIENTS.md)
- [QA results and remaining checks](docs/QA.md)
- [Supplied test archives, compatibility results and migration](docs/SUPPLIED-TESTS.md)

No license was present in the inspected source; this change does not invent or grant new rights to the source, imagery or reference content.

## Current additions

One-input INCI analysis, five-step manual routine builder and an optional AI interview with strict server/client validation and editable confirmation. Numeric comedogenicity evidence is intentionally empty: ungraded ingredients show «Недостаточно данных». See [delivery](docs/releases/DELIVERY.md) and [AI configuration](server/README.md).

## Free guide, Help and editorial UX

The current visual direction is a restrained typographic layout while publication rights for the supplied photo references are unconfirmed; generated header imagery is no longer shown. Help explains the actual seven-part app structure. The consultant defaults to a working local rule-based guide, clearly distinguished from generative AI, with editable previews and explicit calendar confirmation. Both public and server paid-provider switches are off by default. Inspirations now rotates ten source-checked short excerpts from the six-page supplied Buddhism PDF, retaining printed attributions and physical page numbers. The daily reading survives offline reload and changes at local midnight; unavailable source data never produces an unrelated fallback. See [current UX delivery](docs/releases/FREE-GUIDE-UX.md), [journeys/field audit](docs/USER-JOURNEYS.md) and [PDF curation](docs/INSPIRATIONS-SOURCE.md).

The actual PDF curation and editorial-reference update is documented in [PDF Inspirations delivery](docs/releases/PDF-INSPIRATIONS.md).

## Approved design masterplan implementation

The current feature branch implements the supplied eight-page masterplan: exact reference palette, shared components, Home, a desktop rail/mobile shortcuts, original calendar with additional read-only views, AM/PM progress, saved builder drafts and confirmed added-step ordering, shelf filters, five-stage free consultant and cohesive IPL/Help/writing/privacy screens. Consultant answers changing after a preview invalidate the previous proposal; no calendar changes happen without reviewed confirmation.

- [Design audit](DESIGN-AUDIT.md)
- [Design system](DESIGN-SYSTEM.md)
- [Every-page checklist and remaining gaps](IMPLEMENTATION-CHECKLIST.md)
- [Actual QA and before/after screenshot index](docs/releases/DESIGN-MASTERPLAN.md)

Publication rights for the supplied photos remain unconfirmed. The masterplan itself requires verification, so they remain references; no generated imitation or unrelated stock image is substituted. The photographic hero remains a visible delivery gap pending a suitable licensed asset. This does not block working local care, INCI, the free guide or offline readings.
