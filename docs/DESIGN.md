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

Headings use `GFS Didot, Didot, Bodoni MT, Georgia, Times New Roman, serif`. Body and form controls use `system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`, 16 px base, 1.6 line height. Headings scale with `clamp`; ordinary labels are at least 14 px except calendar metadata/eyebrows at 12 px. Google Fonts links precede body rendering; the core application never depends on an external font response.

Spacing scale: 4, 8, 12, 16, 24 and 32 px. Cards use 12 px radii; inputs/buttons use 6 px. Content max width: 1120 px shell, 960 px main including gutters. Gutter/card padding is 24 px, reducing to 16 px below 600 px. Grids use `minmax(0,1fr)`; product/form grids collapse to one column below 600 px. Seven calendar columns persist on mobile. Long strings wrap anywhere instead of widening the document.

## Component and state rules

- `.panel`, `.hair-card`, `.quote-paper`, `.prompt-card`: same border, padding and paper surface.
- `.primary`: solid accent action; `.subtle`/`.small`: outlined; `.danger`: destructive text and confirmation.
- Inputs use explicit visible labels, consistent padding and themed surfaces. Native browser validation handles required fields; application limits are also validated before writes.
- Buttons have minimum 44 px height, including month navigation. Date cells fit the seven-column grid; at 320 px their width is smaller than 44 px but above the 24 px WCAG 2.2 AA target minimum.
- Hover darkens the control; keyboard focus uses a 3 px ring and 3 px offset. Disabled analysis explicitly announces missing reference data. Status regions announce saves, failures and counts without stealing focus.
- Section buttons expose `aria-pressed`; these are ordinary navigation buttons, not an incomplete ARIA tab widget. Native Tab/Enter/Space navigation applies.
- Calendar buttons announce full dates and selected state. Checkboxes have visible names; completing a skincare step restores focus after rerender.
- Charts include captions, counts and a text alternative; color never carries the only meaning.
- `light`, `dark` and `system` themes are applied before first paint; `system` responds to OS preferences. Browser storage failure still permits session-only theme selection.
- Reduced-motion preference disables transitions/animations. Existing motion controller respects reduced motion; new styles do not animate the playfield/content.
- The skip link leads to focusable main content. Mobile navigation wraps and is not sticky; desktop navigation remains sticky with scroll padding.

## Verification boundary

Automated axe checks cover WCAG 2.0 A/AA, 2.1 AA and available 2.2 AA rules across all ten sections, at 390 and 1440 px in both themes. Layout tests traverse 320, 375, 390, 768, 1024 and 1440 px in both themes. These tests do **not** establish complete WCAG conformance. Manual screen-reader reading order, cognitive usability, 400% zoom, native iOS controls, forced-colors and real-device touch testing remain release checks. See QA report.
