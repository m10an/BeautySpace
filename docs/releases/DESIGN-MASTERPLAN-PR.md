The approved masterplan now has a shared editorial implementation across Home, Calendar, Routine, Products/INCI, the free consultant, IPL, Help and the retained writing/privacy sections. Home replaces Calendar as the entry and brand destination; existing storage and scheduling remain authoritative.

- Exact six-color tokens, licensed self-hosted Poppins/Cormorant/Pinyon, consistent controls, desktop rail and mobile shortcuts/full glass drawer.
- Real-data Home and AM/PM progress, additional read-only calendar views, shelf filters, separately versioned builder drafts and confirmed step ordering.
- Five-stage free local interview, stable single-scroll dialog, live editable AM/PM proposal outline, invalidated stale proposals and explicit reviewed calendar append.
- Original quote/ingredient datasets, data formats, PWA/Pages and workflows preserved; no paid API or manufacturer schedule introduced.

Review: DESIGN-AUDIT.md, DESIGN-SYSTEM.md, IMPLEMENTATION-CHECKLIST.md, docs/releases/DESIGN-MASTERPLAN.md, and docs/previews/masterplan/README.md (68 before/after captures covering every route and principal dialog at desktop/mobile).

Validation: `CI=1 CHROMIUM_PATH=/usr/bin/chromium npm run test:all`: syntax/evidence checks passed (14 original supplied files intact), 111 unit passed, production build passed, 128 E2E passed with 4 existing missing-baseline skips, zero failures/flaky tests. Targeted repeat-render and negative controls: 24/24 without retries. Seven widths/both themes, axe/keyboard/forms, data persistence and offline scenarios passed. Local Linux Chromium only; no remote CI/deploy claim.

Open gaps: matching authentic hero photography awaits publication-rights confirmation; references are not republished and Home uses the documented typographic fallback. Real iPhone Safari/VoiceOver remains unverified because WebKit downloads return network-policy 403. This PR does not claim full photographic completion and must not be automatically merged.
