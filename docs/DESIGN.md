> Historical pre-masterplan design notes. The current approved tokens, typography, responsive shell and component states are documented in [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md); see [every-page status](../IMPLEMENTATION-CHECKLIST.md). Original notes below are retained for history.

# Design system and accessibility

The editorial concept remains: warm paper, quiet botanical accents, high-contrast serif headlines and original soft imagery. Dense grain overlays, shimmering decoration and conflicting historical theme layers were removed to keep content legible.

## Tokens

| Role                       | Light     | Dark      |
| -------------------------- | --------- | --------- |
| Canvas `--bg`              | `#efe9e1` | `#181512` |
| Paper `--paper`            | `#fffaf4` | `#241e1a` |
| Raised surface `--surface` | `#e8ded2` | `#352d26` |
| Text `--ink`               | `#30251e` | `#f4eade` |
| Secondary text `--muted`   | `#68594c` | `#c6b7a5` |
| Borders `--line`           | `#9c8b7c` | `#918273` |
| Action `--accent`          | `#4d5947` | `#ced8bd` |
| Action text `--on-accent`  | `#ffffff` | `#20261c` |
| Error `--danger`           | `#9c2736` | `#ffb5bb` |
| Focus `--focus`            | `#145fb5` | `#9ecaff` |

Headings, body and controls use self-hosted Poppins for functional UI, Cormorant Garamond Regular for editorial headings and quotes, and sparing Pinyon Script Regular for nonessential decorative words. SIL OFL files and licenses ship offline. The `--sans` and `--serif` tokens now map to Poppins and Cormorant Garamond respectively. Script is never used for labels, navigation or essential instructions. Active navigation labels use Poppins 600. The generated hero and artificial grain are no longer rendered; a quiet editorial layout stands in until approved photography is supplied. Reduced motion disables movement.

Spacing scale: 4, 8, 12, 16, 24 and 32 px. Cards use 12 px radii; inputs/buttons use 6 px. Content max width: 1280 px shell, 1140 px header/main including gutters. Gutter/card padding is 24 px, reducing to 16 px below 600 px. Grids use `minmax(0,1fr)`; product/form grids collapse to one column below 600 px. The calendar and selected day share two columns above 900 px and stack below that breakpoint. Seven calendar columns persist on mobile. Long strings wrap anywhere instead of widening the document.

## Component and state rules

- `.panel`, `.hair-card`, `.quote-paper`, `.prompt-card`: same border, padding and paper surface.
- `.primary`: solid accent action; `.subtle`/`.small`: outlined; `.danger`: destructive text and confirmation.
- Inputs use explicit visible labels, consistent padding and themed surfaces. Native browser validation handles required fields; application limits are also validated before writes.
- Buttons have minimum 44 px height, including month navigation. Date cells fit the seven-column grid; at 320 px their width is smaller than 44 px but above the 24 px WCAG 2.2 AA target minimum.
- Hover darkens the control; keyboard focus uses a 3 px ring and 3 px offset. Disabled analysis explicitly announces missing reference data. Status regions announce saves, failures and counts without stealing focus.
- Section buttons live inside the off-canvas modal, expose `aria-pressed` and `aria-current`, and retain their original `data-tab` identities. Native Tab/Enter/Space navigation applies, with explicit first/last focus cycling.
- Calendar buttons announce full dates and selected state. Checkboxes have visible names; completing a skincare step restores focus after rerender.
- Charts include captions, counts and a text alternative; color never carries the only meaning.
- `light`, `dark` and legacy `system` preferences are applied before first paint; `system` responds to OS preferences. A round sun/moon button switches to an explicit light/dark preference in the same storage key. Browser storage failure still permits session-only theme selection.
- Reduced motion disables all screen/drawer/theme transitions and zeroes scroll transforms. Otherwise two fixed ambient layers translate at different capped rates using one scroll-triggered animation frame, and the decorative image has a small depth transform. There is no continuous animation loop.
- The skip link leads to focusable main content. The compact sticky header contains only wordmark, menu and theme controls. Navigation is a native modal dialog with 22 px frosted glass, translucent paper, solid fallback, scrollable destinations and a dimmed/blurred backdrop. Close button, outside click and Escape restore trigger focus; selecting a section closes the panel and focuses main. Background scrolling is locked/restored; safe-area and dynamic-viewport units support notched phones and landscape.

## Verification boundary

Automated axe checks cover WCAG 2.0 A/AA, 2.1 AA and available 2.2 AA rules across all ten sections, at 390 and 1440 px in both themes. Layout tests traverse 320, 375, 390, 430, 768, 1024 and 1440 px in both themes. These tests do **not** establish complete WCAG conformance. Manual screen-reader reading order, cognitive usability, 400% zoom, native iOS controls, forced-colors and real-device touch testing remain release checks. See QA report.

The editorial redesign composition and verification scope are documented in [EDITORIAL-REDESIGN.md](EDITORIAL-REDESIGN.md).
