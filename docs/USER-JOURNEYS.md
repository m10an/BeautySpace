# TheBeauty Journal — user journeys and field audit

The interface remains local first. Calendar is Home; the header brand returns there, and the consultant has an internal Home control because native modal backgrounds are inert. Help is available from every screen. All existing storage keys and schedule identities are retained. No migration or automatic deletion is introduced.

## A. First visit → Home → Help → Explore

Entry: Calendar, with the compact brand and Menu/Theme controls. No mandatory onboarding or account. Help opens a seven-step modal covering actual Calendar, Ritual/Hair, Products/INCI, Builder, free consultant, IPL and privacy/recovery. Previous/Next, step counter, Close, Skip and Escape are available. Close restores trigger focus and the previous page position; exploration uses the same menu. No user data is written by Help or Home.

## B. Product entry → INCI → Save → View/edit

Entry: Menu → My Products. Product name is required; brand, category selection, INCI and photo use their existing controls. A name cannot be blank/whitespace; existing 120-character name/brand and 20,000-character INCI bounds remain. Raster photo format/size limits and IndexedDB error handling remain. Inline errors preserve entered text and focus the first invalid field. Save writes only after validation; an empty shelf explains how to add, local search has a no-match state. INCI & analysis on a saved card uses the same reference as Ingredient Check; full analysis before saving is available in that section. No global product catalog or numerical safety score is claimed. Edit preloads existing values; Cancel discards the edit; Delete retains its explicit confirmation. Success remains on My Products with the saved card.

## C. Interview → Validation → Free guide → Preview → Confirmation → Calendar

Entry: floating sparkle button. Default mode is **Free local guide · rule-based**, with no API/key/billing and no network request for interview processing. Start date is required and prefilled. Skin type/sensitivity have unsure/moderate defaults; goals, current labels/INCI, active ingredients, habits, limitations/preferences and three familiar product names are optional. Empty product names become clearly generic editable basic-care steps; no new active treatment is introduced. Only the actual text and entered choices are interpreted by the documented small rule set, not by an LLM.

Date/length/whitespace validation precedes preview. Active-overlap warnings describe possible irritation without universal incompatibility or discontinuation intervals. Severe symptoms produce medical escalation and no saveable treatment plan. A proposal is validated using the shared JSON contract, remains editable, and writes nothing until the review checkbox and Add action. Editing a proposed step clears review. Blank names/start dates, reversed ranges, empty weekday selections and duplicate/overlapping schedules block saving and retain the draft. Remove affects only proposed steps. Close/reject writes nothing. Confirm appends to the existing calendar without deleting entries; reopening Calendar shows the saved care.

The optional hosted mode is separate and disabled by public `enableHostedAI:false` **and** server `AI_ENABLE_PAID_PROVIDER=false`. No free hosted provider is claimed or configured. Explicit owner configuration plus per-request data-sharing consent/verification is needed for the retained OpenAI adapter, which can incur fees. Hosted health/network/rate/output errors keep the free/manual routes available; no automatic retry or paid fallback occurs. Nothing is deployed or billed by this change.

## D. IPL device → Area/session → Review → Confirm → Calendar → Edit

Entry: Menu → IPL Tracker or the consultant's IPL link. Brand and exact model are required for registration; instruction URL/edition is optional and never considered verified automatically. Date and area are required per session; recorded settings, reactions and notes are optional. Completed dates cannot be future dates. Status is planned/completed/cancelled; missed is derived from a past planned date. Same-area/date duplicates are blocked. Preview performs validation without writing; Confirm & Add saves the reviewed record and calendar detail. Editing preserves session ID and requires a new preview/confirmation; postponing never generates or shortens an interval automatically. Cancellation is selected in the edited draft then explicitly confirmed. New session clears the form. Success remains in the tracker with per-area counts.

Manufacturer-specific automatic IPL scheduling remains unavailable. Unknown guidance/contraindications lead to manual logging, not invented intervals/settings or medication advice. The local interview is not sent to the skincare AI endpoint. IPL export/restore remains separate from the journal archive; replacement requires its existing confirmation.

## E. Return → Review → Update

Calendar opens without resetting records. Choose a day and review AM/PM tasks and any IPL records. Complete skincare/Hair steps using existing controls; use IPL → Edit to update session status/reaction. Existing completion/history, products and journal entries persist in their original stores. Theme preference remains device-local. Current daily Inspiration is derived from the local calendar date and the approved dataset, without random Next/category changes; the ten approved short PDF excerpts rotate daily, with a source-specific error state if the collection cannot be loaded.

## F. Errors, offline, recovery and cancellation

After PWA activation, offline manual features, references, free guide and approved local readings work without a server. Unavailable hosted service is clearly distinct from the functioning local guide. Broken IndexedDB, localStorage quota, malformed backup or corrupt saved state do not produce a false saved message. Form errors preserve values; storage errors keep previews available for retry/export. No interview or writing is uploaded automatically. More → Backup & restore covers existing journal stores; IPL needs its own export too. Restore/delete retain explicit confirmation. Cross-store crash atomicity and multi-tab conflict resolution remain existing limitations.

## Shared form audit

All 115 static input/select/textarea controls were checked for associated visible labels (including collapsed editors). The previously unlabelled private reflection textarea now has an explicit label. Dynamic product picks/weekday controls retain wrapping labels; editable proposal controls have explicit labels and required name/start-date markers.

| Group                   | Required and optional fields                                                                    | Validation / recovery                                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar / Ritual       | Day picker; advanced name; schedule-dependent once date or recurrence bounds; optional end date | Valid local dates, name ≤90, meaningful text, weekdays when selected, end ≥ start, overlapping duplicate protection; inline errors and focus; history retained |
| Routine Builder         | Product name, care step, weekdays, start, AM/PM; optional end / saved-product / copy / preset   | Five-step contextual validation, no-write preview, focus on invalid step, explicit final append; cancelled draft has no effect                                 |
| Hair                    | Day, name, AM/PM, schedule; weekdays if weekly                                                  | Name ≤90, weekday choice, duplicate recurring/one-off checks; existing edit/cancel and storage failure behavior retained                                       |
| Observations / settings | Valid observation date and routine start date; optional observation levels and note             | Existing 0–3 observation-level bounds and note ≤2,000 retained; inline date/whitespace/length checks before actions; no reset on failure                       |
| Private reflection      | Meaningful answer only when saving; optional prompt category                                    | Explicit label, ≤10,000, no empty save; earlier entries retained; cancellation/navigation never overwrites stored writing                                      |
| Products                | Name; optional brand, category/INCI/photo                                                       | Existing domain/photo validation plus contextual inline validation; no value clearing on failure; Cancel/Delete behaviors retained                             |
| INCI / local search     | Query/list required only when Analyze is requested                                              | Existing empty/200-entry/20k checks, safe text rendering, unknown-data state; source failure never becomes a zero rating                                       |
| Consultant              | Valid prefilled start; other interview fields optional; explicit review before save             | Per-field length/whitespace and shared JSON/schedule validation; medical gate; no billing/network in free mode; hosted consent remains opt-in                  |
| IPL                     | Device brand/model; session date/area; optional instructions/settings/reactions/notes           | Duplicate area/date, valid dates, no future completion, versioned archive validation; preview/confirmation; error retains records                              |
| Backups / photos        | File only when importing/uploading                                                              | Existing type/size/schema checks and explicit restore/destructive confirmations; sensitive data stays local                                                    |

Fields marked `*` have native required semantics, `aria-required`, visible markers and explanatory text. Placeholders offer examples where useful and never replace labels. Errors are associated with fields via `aria-describedby` and `aria-invalid`. Validation occurs on submission/step completion or date commit, not on every keystroke; correcting a previously invalid field can clear its error. Calendar dates stay `YYYY-MM-DD`; existing timezone handling is unchanged.

## Mobile modal boundary

The consultant has a fixed heading and one `.dialog-content` scroller, 16px form text to avoid Safari focus zoom, safe-area margins, background scroll locking/restoration, and height/top tracking through `visualViewport` when available. CSS has viewport fallbacks; reduced motion remains respected. Viewport/touch/keyboard emulation cannot establish real iPhone Safari or VoiceOver behavior. That release check must be reported separately from Linux Chromium/WebKit results.
