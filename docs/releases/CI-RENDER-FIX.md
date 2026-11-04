# PR #8 — repeat-render CI failure

Branch: `feature/free-consultant-editorial-ux`, starting at `ae214ca`. Failed public Actions run: [41827451285 / validate](https://github.com/m10an/BeautySpace/actions/runs/41827451285/job/126565716024). The Actions API returned `Forbidden`; the public job page exposed its failed status and exit-code annotation but required sign-in for complete logs. No claim is made that the protected remote logs were downloaded. The PR merge checkout and feature checkout had identical content.

## Reproduction before changes

`CI=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:all` reproduced exactly the reported summary: **105 passed, 4 failed, 4 skipped**, including failures on both original attempt and configured retry. Unit tests: **99 passed**. All four failures were in `tests/e2e/supplied.spec.js`, the `@audit repeat-render stability with fonts blocked` scenario at these widths:

| Width | First-attempt changed pixels | Maximum channel delta | Result                                                 |
| ----- | ---------------------------: | --------------------: | ------------------------------------------------------ |
| 320   |                           48 |                     2 | exceeds unchanged limit 1                              |
| 390   |                           60 |                     2 | exceeds limit 1; ratio 0.000105809 also exceeds 0.0001 |
| 768   |                           92 |                     2 | exceeds unchanged limit 1                              |
| 1440  |                           92 |                     2 | exceeds unchanged limit 1                              |

Image dimensions and geometry matched. Extracted PNG comparisons localized the differences to sparse antialiased rounded boundaries, not missing functionality or changed text. Repeated captures of the same resting page became byte-identical after capture/rasterization settled. Font readiness and two animation frames alone did not guarantee that the first full-page captures were stable. Simply disabling GPU/compositor threading did not fix the original tests; those diagnostic flags were not retained.

The defect was in screenshot capture lifecycle: comparing transient cold full-page renders as though the capture pipeline had settled, while the trace recorder was also collecting parallel screencast frames. Waiting for stable paint alone reduced failures but a full run still exposed one flaky first attempt. A diagnostic run without tracing passed 20/20. The final configuration keeps DOM/action/network/source traces and explicit failure PNGs while removing only the competing background filmstrip in this visual-test file. No pixel tolerance, baseline or feature assertion is relaxed.

## Fix and protection

`settleScreenshotPaint` in `tests/e2e/visual.js` waits for **four consecutive byte-identical PNG captures**, with two animation frames between samples and a hard **12-capture bound**. It throws if rendering does not settle. Only after that readiness step does the original scenario acquire a **new independent pair** and run its existing geometry, maximum-channel-delta **≤1** and changed-pixel-ratio **≤0.0001** assertions unchanged.

`tests/e2e/render-readiness.spec.js` supplies genuine continuously changing DOM geometry through `requestAnimationFrame`; readiness must reject it even with CSS animations disabled in screenshot options. This guards against hiding real motion or waiting indefinitely. The existing one-pixel-shift/palette-change comparator sentinel remains unchanged.

`tests/e2e/supplied.spec.js` uses file-level `trace: { mode: "retain-on-failure", screenshots: false, snapshots: true, sources: true }`: only automatic filmstrip collection is removed, not test screenshots, failure images, measured-pair attachments, DOM/network traces or any required checks. Other test files retain the global trace policy unchanged.

All four original failing tests remain enabled. No skips, assertions, comparison thresholds, retries, browser flags or workflows were weakened. Application modules, UI, free guide, forms, Help, navigation, IPL, localStorage/IndexedDB schemas and production assets are unchanged.

## Checks and environment limits

- Initial readiness-only focused repetition passed 25 cases, but its subsequent full run exposed one flaky case. This intermediate implementation was not shipped.
- Final capture-ownership stress run: four original cases plus the negative control, each repeated ten times, **50/50 passed** with `--retries=0`, zero failures/flakes.
- Fresh `npm ci --no-audit --no-fund`: passed, lockfile unchanged.
- Final fresh full CI-mode gate: **99 unit tests passed; 110 E2E tests passed; 4 original baseline skips; zero failures, retries or flaky cases** (114 browser cases discovered). Syntax/integrity checks and the production build passed. Formatting and `git diff --check` passed. The same gate was run with `CI=1`, two workers and the existing retry policy; no retry was actually used.

Environment: Node 24.19.0, Python 3.12.14, Playwright 1.58.2, Debian 13, system Chromium 154. Two workers, CI retry policy, fresh test HTTP server and disposable browser contexts match the workflow settings. This is **not** a claim of an identical Ubuntu/Chromium-145 local environment. Installation of the pinned Chromium 145 and the official `mcr.microsoft.com/playwright:v1.58.2-noble` Ubuntu 24.04 image was attempted; download/CDN requests were blocked with `403 Forbidden`. The necessary exact hosts were saved to the environment network draft for review/publish; saving did not apply them. The existing GitHub workflow remains Ubuntu 24.04 with its pinned Playwright install.

Before-change full log and screenshot evidence are retained locally under `/tmp/beauty-ci-repro.log` and `/tmp/beauty-ci-before/`; focused results are in `/tmp/beauty-paint-stable.log`. Final full log: `/tmp/beauty-ci-final.log`. The intermediate readiness-only full run is `/tmp/beauty-ci-fixed-full.log` (one flaky case, not the final implementation). Normal Playwright HTML/JSON/JUnit reports remain in their existing ignored output directories. The four original missing-approved-PNG baseline skips are unchanged and unrelated to the failure.

Independent final measured-pair metrics after readiness (not the priming captures):

| Width  | Maximum channel delta | Changed pixels |
| ------ | --------------------: | -------------: |
| 320px  |                     0 |              0 |
| 390px  |                     0 |              0 |
| 768px  |                     1 |             13 |
| 1440px |                     0 |              0 |
