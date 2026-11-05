# TheBeauty Journal design system

Implementation of the supplied eight-page Design Masterplan and full board. Source of truth: `style.css`; no frontend framework, new paid services or runtime font CDN. The original document uses system-font substitutes; the application uses the specified licensed fonts.

## Palette

| Token         | Exact value | Role                                               |
| ------------- | ----------- | -------------------------------------------------- |
| `--ivory`     | `#F8F8F3`   | Main paper background                              |
| `--blue-grey` | `#A7B4C2`   | Cool accent; distinct IPL marker                   |
| `--stone`     | `#AEACA6`   | Supporting neutral                                 |
| `--sand`      | `#D4D3C6`   | Quiet cover / selected navigation surface          |
| `--charcoal`  | `#595C64`   | Primary controls                                   |
| `--taupe`     | `#68635D`   | Secondary text on ivory, essential control borders |
| `--ink`       | `#383735`   | Accessible reading text, as specified in PDF p2    |

Use the exact reference colors as primitives, then semantic tokens (`--bg`, `--paper`, `--surface`, `--ink`, `--muted`, `--line`, `--accent`, `--on-accent`, `--focus`, `--danger`, `--control-line`). Fine decorative dividers may be softer than essential control boundaries. Text on sand uses dark ink: taupe-on-sand is only 3.95:1 and charcoal-on-sand 4.44:1, so neither is used for small functional text there. Ivory/ink is 11.16:1, ivory/taupe 5.58:1, white/charcoal 6.69:1. Dark theme uses neutral `#1D1E20` / `#232426` / `#353638` surfaces and ivory/sand foregrounds, retaining reference accents. System preference and existing persisted theme remain supported.

## Type

- Poppins 400 / 600: every functional label, button, navigation item, attribution and form control. Active navigation uses 600 and an additional surface/current indicator. No faux italic active navigation.
- Cormorant Garamond Regular 400: editorial page titles, quotes, selected card headings. Titles scale from 2.5rem to 4.1rem, section titles 2–2.8rem, card headings about 1.7rem. Calendar deliberately uses a smaller title to keep the grid visible. Line-height 1.12 for headings; quote text 1.25.
- Pinyon Script Regular 400: short nonessential Home signature and the single reading accent. Never labels, essential instructions or navigation.
- UI body 1rem/1.65; supporting text .8–.85rem/1.7; functional inputs at least 16px to avoid Safari zoom; letter-spaced nonessential kickers .65rem.
- Families are self-hosted WOFF2, `font-display: swap`, with system/Georgia/cursive fallbacks. Original SIL OFL licenses and font provenance are retained under assets. No Google Fonts import order or network dependency.

## Space, layout and components

4/8/12/16/24/32px spacing scale. Border 1px; card radius 14px (reference 12–18px), small controls 7px, icon controls circular. No oversized card shadows or background gradients; glass blur is limited to the navigation/header/modal backdrop. Reference photography must carry author/source/license metadata and cannot be replaced with generated stock photography.

Mobile content begins with 16px safe-area-aware gutters; functional layouts stack rather than scale. Product shelf uses two columns when readable, one at 320px; desktop three. The page shell max width is 1600px. From 1100px, a persistent 190px rail and 230px content offset keep desktop navigation visible. Below this breakpoint, a five-item shortcut bar provides Home/Calendar/Routine/Products/More; the full frosted drawer retains every legacy route. Header Help remains discoverable. Drawer links use Poppins and a bold current label. Buttons/links target at least 44px; narrow seven-column calendars retain their necessary proportional cells.

Page components: editorial heading, restrained cover, paper panel, section heading with action, segmented AM/PM/view/filter controls, date cell, actual progress ring, photo-first product card when an uploaded image exists, clear image-free product state, area/session cards, quotation figure/citation/disclosure. No fabricated default shelf items, images, percentage results, ingredient ratings or IPL intervals.

## States and dialogs

Visible label for each field; required asterisk plus `aria-required`; examples never replace labels. Errors appear on submit/contextual blur, preserve values and focus the first invalid control, including revealing its interview step. Buttons have visible keyboard focus, hover, active and disabled states. Empty shelves, no sessions/history and unreadable stores have truthful messages. Existing destructive actions and calendar previews keep explicit confirmation.

Consultant has five real stages: goals → skin → products → habits → plan. Header/progress/footer stay fixed inside the native dialog; only `.dialog-content` scrolls. `visualViewport`, safe areas and `100dvh` with fallback handle keyboard-sized viewports. Back preserves input. Close/reject does not write care. The final reviewed proposal is editable; only its confirmation writes. Hosted AI stays explicitly disabled by default.

## Motion, accessibility and content

Short 180–280ms functional transitions; no continuous animation, synthetic grain or decorative CSS stand-ins for photography. All transitions/section entrance motion/parallax disable for reduced motion. Scroll-driven offsets remain compatible with original tests and are used only if relevant visual layers exist. Keyboard focus is trapped only while a modal is open and restored on close. Forced-colors current selection remains visible.

Inspirations and Home share one source-checked date-based excerpt and printed attribution from the supplied Buddhism PDF. Source details are secondary, without quote-card copyright banners or claims of historical certainty. No rights are inferred from the design board. Original reference files remain references unless publication rights are established.

## Routine drafts and ordering

Save/Resume/Discard controls store only the builder fields/stage in `beautyjournal-builder-draft-v1`, with schema version 1. Incomplete drafts are allowed but cannot bypass the existing final routine validation/duplicate guard. Drafts never write the main care store and are not included in the journal backup; discard asks for confirmation. Reordering user-added AM/PM steps uses explicit Move earlier/later buttons and confirmation, preserving original IDs, dates, frequency and checkmarks. Per-day override sequences and original sample order are retained.
