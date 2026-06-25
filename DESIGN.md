# TemplaFrontV2 — Design System

> Restaurant management frontend · Angular 21 · Tailwind v4 · Signals · Standalone

---

## Brand & Identity

| Property | Value |
|---|---|
| **Brand name** | Templa |
| **Tagline** | *"Where craft meets the kitchen."* |
| **Positioning** | Professional restaurant management platform — warm, organic, efficient. Not a generic dashboard; it evokes the craft of cooking and hospitality. |
| **Target audience** | Restaurant managers, chefs, waitstaff, and administrators who need a clean tool that doesn't get in the way. |
| **Voice** | Warm, direct, minimal. English-first UI labels. Professional without being cold. |

**Logo**: SVG wordmark "TEMPLA" with a highlighted `T` in the primary color. Displayed in the sidebar (desktop) and login left panel.

---

## Typography

Three distinct font families with clear role separation:

| Token | Family | Weight range | Used for |
|---|---|---|---|
| `--font-heading` | `'Lora', serif` | 400, 500, 600, 700 | Page titles, stats numbers, modal headings, brand wordmark |
| `--font-body` | `'DM Sans', sans-serif` | 400, 500, 600 | Body text, paragraphs, form inputs, table cells, labels, descriptions |
| `--font-nav` | `'Space Grotesk', sans-serif` | 400, 500, 600 | Navigation items, badges, buttons, uppercase labels, pagination, filter groups |

Loaded from Google Fonts in `index.html`:
```
https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap
```

### Typographic patterns

| Pattern | Font | Size | Weight | Tracking | Transform | Style |
|---|---|---|---|---|---|---|
| Page title | `font-heading` | `text-2xl` / `text-3xl` (md+) | Medium | — | — | Italic |
| Subtitle | `font-body` | `text-sm` | — | — | — | — |
| Section label | `font-nav` | `text-[10px]` / `text-[11px]` | Semibold | `tracking-[0.15em]` | Uppercase | — |
| Badge/pill | `font-nav` | `text-[10px]` | Semibold | `tracking-[0.1em]` | Uppercase | — |
| Nav item | `font-nav` | `text-[12px]` | Medium | `tracking-[0.2em]` | Uppercase | — |
| Button | `font-nav` | `text-[11px]` / `text-xs` | Semibold | `tracking-[0.15em]` | Uppercase | — |
| Table header | `font-nav` | `text-[11px]` | Semibold | `tracking-[0.15em]` | Uppercase | — |
| Table cell | `font-body` | `text-[14px]` | — | — | — | — |
| Large display | `font-heading` | `text-[28px]` / `text-[32px]` | Medium | — | — | — |

**Line heights**: Not explicitly tokenized. Patterns in use: `leading-tight` (nav items), `leading-relaxed` (paragraphs). The login uses a manual `leading-[1.2]` for headlines and `leading-[1.25]` for taglines.

---

## Color Palette

All tokens are defined in `styles.css` via Tailwind v4's `@theme` directive. Values are **not** OKLCH — they are raw hex. This is fine for Tailwind v4 but means color manipulation (lightness, chroma) must be done manually.

### Brand & Action

| Token | Hex | Purpose |
|---|---|---|
| `--color-primary` | `#C07A50` | Primary actions, active state, brand accent, bottom-border focus |
| `--color-primary-hover` | `#A86742` | Button hover, interactive element hover |
| `--color-accent` | `#2E5C40` | Success badges, active indicators, stat cards |

### Background & Surface

| Token | Hex | Purpose |
|---|---|---|
| `--color-bg` | `#F6F4F0` | Page/screen background — warm off-white |
| `--color-surface` | `#FFFFFF` | Cards, modals, table containers — pure white |

### Text & Structure

| Token | Hex | Purpose |
|---|---|---|
| `--color-deep` | `#1A2F24` | Primary text color, sidebar background, headings |
| `--color-muted` | `#828C85` | Secondary text, placeholders, borders, metadata |
| `--color-dark` | `#111111` | Near-black (reserved, not actively used in components) |

### Semantic / Feedback

| Token | Hex | Purpose |
|---|---|---|
| `--color-error` | `#D93838` | Error states, delete buttons, danger badges |
| `--color-signal` | `#ed6c21` | Notification dot, urgency indicators |
| `--color-info` | `#4A7F8E` | Info badges, client-type indicators |

### Opacity variants used throughout

- `muted/10`, `muted/20`, `muted/30`, `muted/40`, `muted/50`, `muted/60`, `muted/70` — borders, dividers, icons
- `deep/5`, `deep/10`, `deep/20`, `deep/50` — borders, overlays
- `primary/5`, `primary/10`, `primary/15`, `primary/30`, `primary/60` — hover backgrounds, subtle fills
- `accent/10`, `error/10`, `info/10` — stat card backgrounds
- `white/10`, `white/20`, `white/30`, `white/90` — sidebar elements, transparent cards
- `error/5`, `primary/5` — action button hover hints

### Color application rules

1. **Primary on dark**: Primary text/icons on the deep (#1A2F24) sidebar use `primary/60` → `hover:primary` pattern for logout.
2. **Badge system**: Each semantic color becomes a badge background with `text-white`. No light/dark pairing — `bg-primary text-white`, `bg-accent text-white`, etc.
3. **Stat cards**: Use 10% semantic backgrounds (`bg-accent/10`, `bg-error/10`) with a `border-l-2` in the corresponding semantic color and matching text color for the number.

---

## Spacing & Layout

### Grid

- **Tailwind's default 4px-based spacing scale** (p-4 = 16px, p-6 = 24px, etc.).
- Responsive padding pattern: `p-4 md:p-6 lg:p-8` on page containers.
- Login form constrained via `max-w-[380px]`.

### Layout structure

```
┌─────────────────────────────────────────────────┐
│  Sidebar (256px)  │  Navbar (sticky, h-16)     │
│                   │─────────────────────────────│
│  68px collapsed   │  Main content               │
│                   │  overflow-y: auto            │
│                   │  padding: 24px               │
│                   │                             │
│                   │  <router-outlet />           │
│                   │                             │
└─────────────────────────────────────────────────┘
```

- **Desktop**: Flex row — sidebar (fixed 256px) + main area (flex-1, min-width: 0).
- **Collapsed**: Sidebar narrows to 68px; nav text hidden; only icons remain.
- **Mobile (< 768px)**: Sidebar becomes a fixed overlay, hidden via `transform: translateX(-100%)`, shown via `translateX(0)`. A backdrop (blurred, z-45) overlays the rest of the page.
- **Main column**: Flex column — navbar (h-16, sticky top-0 z-40) + scrollable content area.
- **Breadcrumb**: Replaced by page title in the navbar, derived from the current route.

### Breakpoints

| Name | Tailwind | Width | Behavior |
|---|---|---|---|
| Mobile | `max-md` | `< 768px` | Overlay sidebar, responsive padding, stacked stats cards |
| Desktop | `md+` | `>= 768px` | Fixed sidebar, horizontal filter bars |

No tablet-specific breakpoint yet — `md` covers both tablet and desktop.

### Card / container pattern

Components use a "glassmorphism light" aesthetic:
- `bg-white/40 backdrop-blur-md border border-white/20 shadow-sm`
- Combined with `bg-surface` (solid white) for data-heavy components like the table.

---

## Component Patterns

### DataTable (`app-data-table`)

Generic, typed table component accepting `ColumnDef[]` and `T[]`. Supports:

- **Column types**: `text` (default), `badge`, `index`, `actions`
- **Badge maps**: `Record<string, Record<string, BadgeEntry>>` — maps column values to badge styles
- **Custom renderers**: `cellRenderers` and `cellPrefixes` per column
- **Skeleton loading**: 5-row skeleton with `animate-pulse`
- **Minimum loading time**: set via `[minLoadingMs]` (e.g. 850ms) to prevent flash-of-empty on fast responses
- **Pagination**: 0-indexed, with ellipsis-based page navigation, prev/next buttons
- **Empty state**: Icon + configurable message (supports HTML via `innerHTML`)
- **Row actions**: Content-projected `ng-template` with `let-persona` context

Styling: header row uses `bg-deep text-white`, body rows use `divide-y divide-muted/10` with `hover:bg-bg/40 transition-colors duration-150`.

### FilterGroup (`app-filter-group`)

Radio-button group styled as a segmented control:

- Horizontal flex container with `divide-x divide-muted/20`
- Active option: `bg-primary text-white`
- Inactive options: `text-muted hover:text-deep`
- Two-way binding via `model()`, secondary `selectionChange` output

### Modals

Overlay + centered panel pattern:

```
.fixed.inset-0.z-50.flex.items-center.justify-center.bg-deep/50.backdrop-blur-sm
  └── .relative.w-full.max-w-xl.bg-surface.mx-4
        ├── Header (border-b)
        ├── Body (space-y-8, sections with divider)
        └── Footer (border-t, Cancel + Submit buttons)
```

- Overlay click closes the modal (stopPropagation on the panel)
- Escape-key handling is **not yet implemented** — this is a gap
- Footer actions: secondary/outline + primary button pairing

### Sidebar

- Background: `--color-deep` (#1A2F24)
- Brand header: 68px height, `border-b border-white/10`
- Nav items: `text-white/60 hover:text-white` with `border-l-4 border-primary` active indicator
- Icons: 18px Lucide icons (individually imported per component)
- Logout: `text-primary/60 hover:text-primary`
- Scrollbar: thin (2px) custom track
- **Mobile**: fixed position, z-50, transform-driven reveal

### Navbar

- Background: `--color-bg` (#F6F4F0) at 80% opacity with `backdrop-blur-md`
- Sticky top-0, z-40
- Left: toggle button (ChevronFirst/ChevronLast) + page title
- Right: notification bell (with dropdown), shift badge, user avatar
- User avatar: primary-color circle with first-initial letter

### Form inputs — floating labels

The login page and persona modal use a floating-label pattern achieved with **Tailwind peer classes**:
- Input: `peer w-full bg-transparent pt-6 pb-2 ... placeholder-transparent`
- Label: positioned absolutely, uses `peer-placeholder-shown:` and `peer-focus:` to transition between resting and floated states
- Bottom border: a thin `border-b` that changes color on `focus-within:border-primary`

### Stats cards

Four-column grid with semantic borders:
- `border-l-2 border-l-deep/20` for total
- `border-l-accent` for active staff
- `border-l-info` for active clients
- `border-l-error` for inactive
- Backgrounds: corresponding semantic color at 10% opacity

### Buttons

| Type | Styles |
|---|---|
| **Primary** | `bg-primary hover:bg-primary-hover text-white font-nav text-xs/tracking-[0.15em]/uppercase h-12 px-8` |
| **Secondary/outline** | `bg-transparent border border-deep text-deep hover:bg-deep hover:text-white` |
| **Icon (text/action)** | `w-9 h-9 text-muted/60 hover:text-primary hover:bg-primary/5 transition-all` |
| **Ghost/back** | `bg-transparent border-none p-0 font-body text-[13px] text-muted underline hover:text-deep` |
| **Toggle** | `w-8 h-8 text-muted hover:text-deep transition-colors` |

---

## Motion

### Transition durations

| Duration | Usage |
|---|---|
| 150ms | Hover transitions (colors, backgrounds, buttons) |
| 220ms | Floating label transitions |
| 250ms | Mobile sidebar slide |
| 300ms | Desktop sidebar width, field line animation, focus bar, fill effects |
| 320ms | Screen entrance animation |

### Easing curves

| Curve | Used for |
|---|---|
| `cubic-bezier(0.4, 0, 0.2, 1)` | Sidebar width/transform, field line — standard Material ease |
| `ease` | Floating label transitions, button hover colors |
| `ease-out` | Fill effect (scale-y on new-person button), focus bar |

### Keyframe animations

| Name | Properties | Duration | Purpose |
|---|---|---|---|
| `fadeIn` | `opacity` + `translateX(14px → 0)` | 320ms | Screen entrance (login screens) |
| `iconUp` | `opacity` + `translateY(10px → 0)` | 500ms (100ms delay) | Icon reveal (inbox, success) |
| `dotPulse` | `opacity` + `scale(0.75→1)` | 1.2s infinite | Loading dots (buttons) |
| `drift1–5` | `translate` + `scale` | 16–25s infinite | Background bubble drift (login) |

### CSS transition anti-patterns

These are identified in the current codebase and should be avoided going forward:

| ❌ Anti-pattern | File | Why | ✅ Preferred |
|---|---|---|---|
| `transition: width 0.3s` on sidebar desktop | `sidebar.css:9` | `width` forces layout recalculation — 30–60× more expensive than `transform`. On every frame, the browser must recalculate layout, not just compositing. | `transform: translateX()` — keeps painting on the compositor thread. |
| `transition: width 0.3s` on field line | `login.css:29` | Same layout-thrashing cost for an underlining visual effect. | `transform: scaleX(0 → 1)` with `transform-origin: center`. |
| Multi-property label transition (4 properties: `top`, `font-size`, `color`, `letter-spacing`) | `login.css:10` | Animating `top` and `font-size` triggers layout for every frame. `letter-spacing` also triggers layout. | Use `transform: translateY()` for vertical shift, and animate `color` / `opacity` only. |

### ✅ Preferred motion approach

1. **Use `transform` and `opacity` only** for interactive animations. These run on the compositor thread and do not trigger layout or paint.
2. **Use `will-change: transform`** on elements that animate continuously (bubbles already do this).
3. Reserve `width`/`height` transitions only for elements that genuinely need layout-driven resizing, and even then, consider `clip-path` or `transform: scale()` alternatives.
4. Prefer the Material standard easing `cubic-bezier(0.4, 0, 0.2, 1)` — it's already established in the codebase.

---

## Accessibility

### Color contrast

| Pair | Ratio (approx) | Verdict |
|---|---|---|
| `#1A2F24` (deep) on `#F6F4F0` (bg) | ~9.5:1 | ✅ Passes WCAG AAA |
| `#C07A50` (primary) on `#FFFFFF` (white) | ~2.6:1 | ⚠️ **Fails** AA for body text. Only use for large/display text, decorative elements, or with backgrounds that boost contrast. |
| `#FFFFFF` on `#C07A50` (primary bg) | ~2.6:1 | ⚠️ Fails AA for body text. Fine for large buttons (15px semibold or larger). |
| `#828C85` (muted) on `#F6F4F0` (bg) | ~2.3:1 | ⚠️ Fails AA. Currently used for secondary text — needs a darker value for readability. |
| `#FFFFFF` on `#1A2F24` (deep bg) | ~9.7:1 | ✅ Passes WCAG AAA |
| `#FFFFFF` on `#D93838` (error) | ~4.1:1 | ✅ Passes AA (large text only) |

**Gaps identified**:
- Muted text (#828C85) on the warm background (#F6F4F0) does not meet AA minimum contrast.
- Primary (#C07A50) used for active nav items on white backgrounds may be hard to read at small sizes.
- These should be reviewed with actual monitors; hex→OKLCH conversion and contrast targeting should be added to the token pipeline.

### What's done well

- `sr-only` label on search input (persona list).
- `aria-label="Toggle sidebar"` on the sidebar toggle button.
- `aria-label="Notifications"` on the notification bell.
- `inputmode="numeric"` on the PIN code inputs (shows number keyboard on mobile).
- `autocomplete="one-time-code"` on the 2FA input (helps password managers).
- Focus-visible outlines are not explicitly removed — the `outline-none` from Tailwind may suppress them.

### What's missing

1. **No `prefers-reduced-motion`** media queries anywhere. The bubble drift animations (infinite, 16–25s) and the sidebar transition should respect reduced motion.
2. **No `:focus-visible` overrides** — `outline-none` is used without providing an alternative focus indicator.
3. **No keyboard trap handling** for modals — focus is not trapped inside the modal panel; pressing Tab past the last button reaches the background.
4. **No ESC key** handler for modals or notification dropdown.
5. **No `aria-expanded`** on the sidebar toggle or notification button.

### Reduced motion policy (recommended)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This should be added to `styles.css` as a global safe-guard.

---

## Build & Configuration

| Setting | Value |
|---|---|
| Build system | `@angular/build:application` (Angular 17+ esbuild-based) |
| Entry point | `src/main.ts` |
| Global styles | `src/styles.css` |
| Assets | `public/` directory |
| Production budgets | Initial: 500kB warning / 1MB error; anyComponentStyle: 4kB / 8kB |
| Output hashing | All (production only) |
| Source maps | Development only |
| Environment swap | `src/environments/environment.ts` ↔ `src/environments/environment.development.ts` |
| Package manager | npm |
| Code style | Prettier (100 char width, single quotes, Angular HTML parser) |

---

## File organization

```
src/
├── index.html                          # Font loading, <app-root>
├── styles.css                          # Tailwind v4 @theme + imports
├── app/
│   ├── app.css                         # (empty — reserved for app-level styles)
│   ├── core/
│   │   ├── layout/
│   │   │   ├── layout.ts / .css / .html
│   │   │   └── components/
│   │   │       ├── sidebar/            # Nav sidebar (collapsible)
│   │   │       └── navbar/             # Top bar (notifications, user, shift)
│   │   └── services/                   # AuthService, RoleAccessService, NotificationService
│   ├── features/
│   │   ├── login/                      # Multi-screen login flow
│   │   ├── dashboard/                  # Home/dashboard (empty CSS)
│   │   ├── personas/                   # Staff & clients CRUD
│   │   │   ├── components/
│   │   │   │   ├── persona-list/       # Table + filters + stats
│   │   │   │   └── persona-modal/      # Create/edit form modal
│   │   │   ├── services/               # PersonaService (HTTP + signals)
│   │   │   └── models/                 # Persona model
│   │   └── profile/                    # Simple placeholder
│   └── shared/
│       └── components/
│           ├── data-table/             # Generic typed table
│           └── filter-group/           # Segmented radio-button group
```

---

## Future considerations

1. **Color token modernization**: Consider converting hex values to OKLCH with Tailwind v4's `@theme` to get hue, chroma, and lightness manipulation for free.
2. **Reduced motion**: Add the global media query in `styles.css` as a project-wide guard.
3. **Focus management**: Implement focus trapping in modals and dropdowns. Add `:focus-visible` ring styles.
4. **Tablet layout**: The jump from mobile (<768px) to desktop (>=768px) lacks a tablet-optimized intermediate state. Consider `lg` (1024px) for desktop if tablet usage is significant.
5. **Shared color system**: Badge maps in each feature duplicate color assignments. Consider a global badge preset registry.
6. **Typography scale tokens**: Font sizes and tracking values are hardcoded as arbitrary values (`text-[11px]`, `tracking-[0.15em]`). Consider elevating these to `@theme` tokens once the scale stabilizes.
7. **Animation library**: Consider extracting reusable animation classes (`.screen-enter`, `.icon-reveal`, `.dot-pulse`) into a shared animations file to avoid duplication across features.
