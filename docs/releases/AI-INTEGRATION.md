# AI routine consultant

Fourth stacked branch, based on `feature/routine-builder`. Adds a separate sparkle launcher and accessible glass interview, opt-in product/care summary copying, labeled local overlap notices, server availability checks, consent/Turnstile, a real OpenAI adapter, strict shared JSON validation and editable append-only confirmation. Missing configuration leaves AI explicitly unavailable while the manual builder remains usable. API keys stay server-side; the static build excludes `server/` and environment files.

See [deployment/privacy/limits](../../server/README.md). Live provider behavior, hosting, spend controls and actual iPhone Safari remain deployment checks, not completed operations. New unit/E2E fixtures are synthetic contract tests. The initial full run found accessibility/layout failures, which were fixed in production code without disabling tests. Final results are recorded in DELIVERY.md.
