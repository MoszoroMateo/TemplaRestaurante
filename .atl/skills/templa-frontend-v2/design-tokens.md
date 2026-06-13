# Design Tokens — Templa Frontend V2

Every token is mapped to Tailwind v4 theme variables. Do NOT hardcode colors or use raw hex codes in components. Use Tailwind classes directly.

## 1. Theme Color Palette
Tailwind v4 is configured in `src/styles.css` under `@theme`. Here are the classes you should use:

| Color Token | Tailwind Class | Hex Code | Usage |
|---|---|---|---|
| **Clay** (Primary) | `bg-primary`, `text-primary` | `#C07A50` | Buttons, active states, links, highlights |
| **Linen** (Bg) | `bg-bg`, `text-bg` | `#F6F4F0` | Light backgrounds, page container backgrounds |
| **Pure White** (Surface) | `bg-surface` | `#FFFFFF` | Form inputs, cards, tables, modal content |
| **Deep Forest** (Text) | `text-deep` | `#1A2F24` | Main headings, body text, dark buttons, brand logo |
| **Sage** (Muted) | `text-muted`, `border-muted` | `#828C85` | Placeholders, inactive borders, secondary meta text |
| **Leaf** (Accent) | `bg-accent`, `text-accent` | `#2E5C40` | Success states, highlights, success messages |
| **Onyx** (Dark) | `bg-dark`, `text-dark` | `#111111` | Dark panels, login background overlays |
| **Error** | `text-error`, `bg-error` | `#D93838` | Validation errors, error notifications |

## 2. Typography
Fonts are configured under `@theme` and mapped to utility classes:

- **Heading Font**: `font-heading` (`Lora`, serif) — Used for titles, page names, brand headings.
- **Body Font**: `font-body` (`DM Sans`, sans-serif) — Used for body copy, paragraphs, table values.
- **Nav Font**: `font-nav` (`Space Grotesk`, sans-serif) — Used for navigation items, uppercase labels, meta badges, buttons.

### Typography Scale Rule:
- Use `italic` on Lora headings (`font-heading`) to give it that "Editorial Craft" feel.
- Use uppercase with generous tracking (`tracking-[0.2em]`) on Space Grotesk (`font-nav`) for labels and navigation.

## 3. Radii & Shadows
- **Border Radius**: Must be `rounded-none` everywhere. No exceptions.
- **Box Shadows**: No `shadow` classes should be used unless explicitly required for accessibility/contrast overlays (e.g. mobile menus). Rely on borders (`border border-muted/20`) and background contrast instead.
