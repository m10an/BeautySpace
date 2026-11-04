# Beautycalendar 2.0 — The Beauty Journal

A private, offline-first skin, hair and self-care journal. Built from the real Beautycalendar source while preserving its editorial imagery, routines, progress photos, reflections and browser storage keys.

## Run locally

Use Node.js 24+ and Python 3. The offline app requires no backend or API keys. The optional AI consultant requires a separate server; see [server setup](server/README.md).

```sh
npm ci
npm run dev
```

The HTTP server binds to `127.0.0.1:8000`. Open it in a local browser. Serve over HTTPS for production PWA installation; do not open `index.html` as a file. Montserrat is self-hosted under SIL OFL; see [asset provenance](assets/ASSETS.md).

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

- Calendar opens first, with a compact header, frosted off-canvas navigation and a round theme control.
- Independent skin/hair calendars; create, edit, delete, schedule and complete care steps.
- Personal product shelf: name, brand, category, INCI, compressed photo, edit/delete and local search.
- Case-insensitive, whitespace-normalized partial INCI/synonym search in a pinned MIT-licensed catalog of 28,353 distinct ingredient/common names.
- INCI recognition and accessible reference-coverage charts. **No verified numeric comedogenicity ratings are present in the source data.** Unknown evidence is displayed explicitly, never as a zero score. Fragrance sensitivity is separate from comedogenicity.
- Device-local observations, progress photos, reflections, insights and a versioned backup covering all stores.
- Responsive light, dark and system themes, keyboard focus and reduced-motion support.
- Same-origin PWA shell and offline ingredient reference. Only explicitly consented AI interview text leaves the device. Photos and journal records are excluded.

The product search covers **your own collection**, not a global catalog. See [architecture](docs/ARCHITECTURE.md) for an external-catalog and Telegram Mini App integration plan and current limits.

## Data and upgrades

Export **everything, including photos** in **Menu → More → Backup & restore** before deploying an update or changing browser/origin. Version 4 exports include skin state, hair state, reflections, products and photos. Version 3 skincare/photo archives are still accepted. Missing stores in older archives are left unchanged. Restore validates before writing; included stores are replaced and progress photos merged by ID. Failed restore attempts rollback, with an explicit warning if rollback also fails. Avoid concurrent edits in other tabs while restoring.

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

Original skincare photography, one-input INCI analysis, five-step manual routine builder and an optional AI interview with strict server/client validation and editable confirmation. Numeric comedogenicity evidence is intentionally empty: ungraded ingredients show «Недостаточно данных». See [delivery](docs/releases/DELIVERY.md) and [AI configuration](server/README.md).
