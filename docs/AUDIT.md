# Source and initial audit

Inspected 3 November 2026. Source: `https://github.com/happymarysan-dot/Beautycalendar`. Destination: `https://github.com/m10an/BeautySpace`. Source read access was verified using the existing HTTPS Git proxy. Both remote source HEAD and the destination's initial local HEAD were `8437a9eae0f5892fdba22808b2b4326fff355d6e`. Work uses the actual destination checkout on `feature/beautycalendar-v2`; no fabricated source or replacement repository was created. The destination repository already existed.

## Findings and changes

| Initial finding                                                                              | Result                                                                                     |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Successive V5–V12 CSS overrides, conflicting serif/sans/cursive rules and many `!important`s | Replaced with one token-based stylesheet and documented components                         |
| Google Fonts `@import` appeared after ordinary CSS rules and could be ignored                | Moved font loading/preconnect to HTML head, kept fallback stack                            |
| Low-contrast small text, nav text on conflicting translucent backgrounds                     | Solid themed surfaces, readable body type, focus and contrast checked by axe               |
| Long INCI names shared a nonwrapping header row                                              | Flexible wrapping headers and `minmax(0,1fr)` layout; tested long unknown names            |
| Care procedures could be added/deleted but not edited                                        | Edit/cancel flows retain IDs and historical completion keys                                |
| Date-range filter suppressed one-off procedures before recurring start date                  | Independent one-off scheduling with regression tests                                       |
| No structured cosmetic product collection                                                    | Separate IndexedDB collection, photos, search, CRUD and ingredient reports                 |
| Ingredients matched only exact strings and a small alias map                                 | Normalized exact/synonym lookup plus partial reference search                              |
| Original chart combined fragrances with historical laboratory signals                        | Coverage chart and separate sensitivity notes, no invented probability                     |
| Backup excluded independent hair/reflection stores                                           | Version 4 includes those stores and products, validates imports, retains version 3 support |
| User procedure name interpolated into routine HTML without escaping                          | All dynamic routine text encoded; product/search output uses text nodes                    |
| Imported arbitrary keys merged into live state                                               | Allowlisted validated skincare migration; safe IDs and image types                         |
| Cache activation deleted all origin cache names                                              | Deletes only app-owned prefixes; updates wait for old tabs                                 |
| CI only checked syntax and JSON                                                              | Unit, browser, axe, build and Pages artifact deployment jobs                               |

## Deliberately retained

Original skincare task IDs and custom procedure IDs, localStorage keys, photo database, separate hair journal, mood observations, routine settings, reflections/prompts, inspiration data, supplied icons and both editorial images. The UI language is consistently English; existing user-authored text is not translated. The sample routine is preserved and identified as an example, not personalized medical advice.

## Scope limits

The supplied task text ends at section 5, item 3. The three ZIP test archives were unavailable during the first implementation pass, then supplied in the follow-up. Their originals, compatibility failures and adapted executable coverage are now documented in [SUPPLIED-TESTS.md](SUPPLIED-TESTS.md).
