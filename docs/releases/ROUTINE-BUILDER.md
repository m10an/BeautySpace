# Simplified Routine Builder

Third stacked branch; base `feature/inci-v2`. A five-step tool guides skin care from saved/manual product, through care step, weekdays/start/end dates and morning/evening, to an editable review. Presets are explicitly manual templates, not AI advice. Recurring schedules can be copied into a draft; the original is retained. One-off routines and single-day overrides remain available in the advanced editor. The independent Hair calendar remains fully available with its existing editor.

Only the final “Add routine to calendar” action writes. The append helper requires an explicit confirmation flag, validates all additions and the current legacy record, and performs a single localStorage write. It retains existing procedures/checkmarks/mood records and unknown fields. A quota or parse failure leaves the prior record intact. The live app refreshes its in-memory routine state after a successful addition; no page reload or data migration is needed.

Existing advanced controls and test assertions are retained; tests open the native details control before using them. New unit/E2E checks cover no-write previews, confirmation, copy/cancel, quota failure, corrupt data and live calendar persistence. Native modal focus/scroll handling and reduced-motion styles are shared with the forthcoming consultant panel.
