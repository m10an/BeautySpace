# Architecture and integration plan

## Current application

Static HTML, CSS and browser ES modules, without a bundler or runtime dependency. A small explicit-allowlist build copies allowlisted frontend files and the licensed assets/data directories to `dist/`, preserving relative paths so GitHub Pages repository subpaths work.

| Module                     | Responsibility                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `app.js`                   | Preserved skincare/hair schedules, observations, photos, inspiration and existing task identities; incremental legacy controller refactor |
| `lib/domain.js`            | Pure validation, local date representation, recurrence, safe encoding, ingredient lookup/analysis and backup migration                    |
| `lib/storage.js`           | Atomic product-collection writes in IndexedDB                                                                                             |
| `ingredients.js`           | Validated offline reference, search, analysis and accessible coverage visualization                                                       |
| `products.js`              | Product CRUD, compressed raster photos, local search and on-demand reports                                                                |
| `archive.js`               | Allowlisted version 3/4 import, all-store validation and rollback handling                                                                |
| `theme.js` / `shell.js`    | Prepaint theme, section state, optional Telegram-host hook                                                                                |
| `prompts.js` / `motion.js` | Retained reflection feature and reduced-motion-aware controller                                                                           |
| `sw.js`                    | Versioned same-origin shell cache, network-first document navigation, waiting updates                                                     |

Calendar days are `YYYY-MM-DD` strings; local noon is used for weekday/calendar operations and UTC day differences for elapsed intervals, avoiding UTC-midnight date shifts and 23/25-hour DST arithmetic. One-off care dates are independent of recurring start bounds. Procedure edits retain IDs and completion history. Deletes remove future schedule entries but retain historical checkmarks for backups. There is no timezone-based reminder delivery.

Products are stored as a single collection record in IndexedDB with compressed JPEG photos (maximum input 10 MB, longest side 1000 px). Progress photos remain in the original database, capped at 1400 px. Native storage errors are reported rather than claimed saved. Backups span localStorage and two IndexedDB databases; these cannot share a browser transaction. Imports validate first, write included stores, atomically merge photos within their store, and attempt rollback on error. A crash mid-import is not fully transactional; keep an exported backup. Multiple simultaneous tabs do not provide conflict resolution or cross-device synchronization.

On the same origin, old skincare keys/photos remain accessible. Storage belongs to the browser origin, not to GitHub. Changing origin, browser or Telegram WebView requires backup export/import. There is no analytics, account system, automatic data upload or remote image proxy.

## Global product catalog (not connected)

The current search is **only local personal products**. A future global catalog should use a separate provider interface, not silently expand personal search:

```ts
interface ProductCatalog {
  search(
    query: string,
    cursor?: string,
  ): Promise<{
    items: CatalogProduct[];
    nextCursor?: string;
    source: string;
    fetchedAt: string;
  }>;
}
```

A candidate is Open Beauty Facts (`https://world.openbeautyfacts.org/`), subject to verifying current API terms, database/image licenses, CORS, quotas and actual cosmetics coverage before integration. No live API response was used in this implementation. A hosted adapter should normalize barcode, INCI, brand, source URL and update date, attribute each response, cache with a TTL, rate-limit, enforce timeouts and handle missing/stale INCI. API keys, if required by a different provider, belong on a server. Catalog ingredients are untrusted input and must use the same validators and text rendering. The UI must label provider results, missing data and local user edits separately. Barcode/keyword matching does not establish product authenticity or formula currency.

## Telegram Mini App preparation (not launched)

The page uses relative assets, mobile viewport and responsive components. `shell.js` calls `ready()`/`expand()` only when the host exposes `window.Telegram.WebApp`; it does not trust user identity. No bot, bot token, SDK injection or Telegram deployment is configured.

A release as a Mini App needs an HTTPS URL configured in BotFather, an official SDK loaded before host-dependent features, WebView device tests, safe-area/viewport handling and a deliberate mapping of Telegram color settings. If accounts or cloud sync are introduced, validate signed `initData` on the server with the bot token, expiry and replay protections; never treat `initDataUnsafe` as authorization or ship the bot token to the client. PWA install/service-worker behavior varies by WebView; all primary features should work without installation. Browser-local private data must not be uploaded just because the app is opened in Telegram.

## Deployment and operations

`Quality` runs on branch pushes and pull requests. `Deploy Pages` runs all checks and creates an artifact, then deploys only `main` with minimal Pages/OIDC permissions. Enable GitHub Actions as the Pages source in repository settings. CI needs normal npm/Playwright/Ubuntu package-download access. No application secret is required. The remote Actions run and production URL must be checked after push; local tests alone are not a deployment result.

Montserrat is self-hosted; no external font request is required. No network policy change is necessary for core functionality. Keep TLS and artifact verification enabled. For rollback, redeploy a prior known-good commit; never clear browser data or downgrade/import backups blindly. Bump the service-worker cache name and asset query version together when shipping new shell files, then close all app tabs to activate the waiting worker.

## Optional AI backend

`server/` is excluded from the Pages build. See [server setup](../server/README.md). `runtime-config.json` contains public endpoint/site-key settings only. The shared `lib/ai-plan.js` schema rejects unknown keys and malformed schedules. Confirmed proposals append through `lib/routine-plan.js`, preserving old IDs and rejecting identical schedule entries. Existing data formats remain unchanged.
