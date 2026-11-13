---
name: OpenFishing
description: Self-hosted lure, spot and catch log. A numbered tackle box you can read at the water.
colors:
  # Ocean theme, dark mode (the default world). Source: src/routes/layout.css
  wake-cyan: "#22d3ee"
  wake-cyan-solid: "#06b6d4"
  wake-cyan-glint: "#67e8f9"
  wake-cyan-deep: "#0891b2"
  abyss: "#060d17"
  night-water: "#0b1a2c"
  raised-water: "#0f2238"
  water-hover: "#132841"
  rope-line-faint: "#172f4a"
  rope-line: "#243f5e"
  rope-line-strong: "#2d5270"
  foam-bright: "#e0eaf8"
  foam: "#c2dce8"
  mist: "#98c0d2"
  haze: "#84aabd"
  fog: "#6b9ebb"
  ink: "#030a12"
  hook-red: "#f87171"
  reed-green: "#4ade80"
  hook-amber: "#fbbf24"
  hook-amber-solid: "#f59e0b"
  # Ocean theme, light mode
  harbor-teal: "#0c627a"
  shallows: "#eaf3f8"
  paper: "#ffffff"
  paper-raised: "#f2f8fb"
  shore-line: "#aacad9"
  deep-ink: "#0a1e2e"
  slate-text: "#1a3448"
  slate-muted: "#325061"
  # Alternate theme accents (dark mode). Each theme redefines the full semantic set.
  forrest-accent: "#4ade80"
  sunset-accent: "#fb923c"
  dusk-accent: "#a78bfa"
  # Their light-mode counterparts, darkened to hold 4.5:1 on the pale grounds.
  forrest-accent-light: "#116932"
  sunset-accent-light: "#a0350a"
  dusk-accent-light: "#6624ce"
  # Fixed inks that sit on photographs, not on theme surfaces, so they never change
  # with theme or mode: scrims behind photo badges/controls, and the amount badge.
  photo-scrim: "rgba(0,0,0,0.5)"
  photo-scrim-strong: "rgba(0,0,0,0.6)"
  photo-scrim-badge: "rgba(0,0,0,0.7)"
  map-hint-scrim: "rgba(0,0,0,0.55)"
  badge-gold: "#fcd34d"
  badge-gold-ink: "#1a1204"
typography:
  figure:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  figure-sm:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0em"
  section:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 500
    lineHeight: 1.35
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
  numeral:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  xs: "4px"
  sm: "6px"
  control-sm: "8px"
  control: "9px"
  md: "10px"
  subpanel: "12px"
  lg: "14px"
  xl: "16px"
  pill: "20px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.wake-cyan-solid}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.wake-cyan}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.raised-water}"
    textColor: "{colors.mist}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.water-hover}"
    textColor: "{colors.foam}"
  input:
    backgroundColor: "{colors.raised-water}"
    textColor: "{colors.foam}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  chip-filter:
    backgroundColor: "transparent"
    textColor: "{colors.fog}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  chip-filter-include:
    textColor: "{colors.wake-cyan}"
  chip-filter-exclude:
    textColor: "{colors.hook-red}"
  card-lure:
    backgroundColor: "{colors.night-water}"
    rounded: "{rounded.lg}"
  panel:
    backgroundColor: "{colors.night-water}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  nav-link-active:
    backgroundColor: "{colors.raised-water}"
    textColor: "{colors.foam-bright}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  lure-number-plate:
    textColor: "{colors.wake-cyan}"
    typography: "{typography.numeral}"
    fontSize: "1rem"
---

# Design System: OpenFishing

## Overview

**Creative North Star: "The Tackle Box at Dusk"**

OpenFishing is a tackle box: dark, ordered compartments where every lure has its numbered slot and its record. The world is the water at dusk. Deep, cool surfaces step up in small tonal increments, and a single accent glints against them like a lure catching the last light. Nothing is decorative for its own sake. Photos of real lures and catches carry the color, and the interface around them stays quiet and in order.

The system is an **Operate** surface first: people log catches one-handed on a phone at the bank, then sort and review their collection at home. Density is moderate. Cards and forms are compact, but the lure number, the name and the primary action are always the strongest things on screen. Every theme (Ocean, Forrest, Sunset, Dusk) is the same tackle box under a different light. The structure, spacing and type never change; only the semantic color set does, in both dark and light mode.

**Direction: catalogued, built for outdoors.** The confirmed target for new and reworked screens combines two moods. *Precise, catalogued*: the lure is an inventory item with a numbered plate and a spec sheet in tabular mono. *Outdoorsy, practical*: everything that matters survives a phone held in direct sun or used in the dark. The tokens above describe what ships today. Where today's screens fall short of this direction (dim secondary text, roughly 26px chips), the rules below say which way to move. The reference mock is the mood study at https://claude.ai/artifact/7VT46ePe8cBpdnADtWwU6R ("Both" row).

**Key Characteristics:**
- Dark-first, tonal layering; light mode is a fully designed counterpart, not an inversion.
- One accent per theme, used for actions, active state and the lure number, never as decoration.
- DM Sans for everything readable; JetBrains Mono only for numbers that are catalogued (lure numbers, specs, measurements).
- Flat surfaces with 1px borders; shadows appear only on floating layers.
- Gently curved, consistent corners (9px controls, 14px cards).
- Built to be readable at the water: the glare test is a design requirement.

## Colors

Cool, desaturated water tones carry the surfaces, and one saturated accent per theme does all the signalling.

### Primary
- **Wake Cyan** (`wake-cyan`, solid `wake-cyan-solid`): the Ocean accent in dark mode. Solid fills primary buttons and the Add menu trigger with Ink text; the lighter tone is the text/icon color for links, active tabs and included filters, and the hover fill for primary buttons. The translucent accent family (`--of-accent-bg` 8%, `-bg-hover` 14%, `-border` 25%, `-glow` 10%) tints selected chips, focus rings and the card hover glow.
- **Wake Glint** (`wake-cyan-glint`): the lure-number badge text on photo cards in dark mode, the brightest accent step, so the number reads on any photo.
- **Harbor Teal** (`harbor-teal`): the Ocean accent in light mode. Darkened from cyan to hold AA contrast on white; also used as the solid button fill there.

### Secondary
- **Theme accents**: Forrest Reed (`forrest-accent`), Sunset Ember (`sunset-accent`), Dusk Violet (`dusk-accent`). Each replaces Wake Cyan with an identical role map, and each has a darkened light-mode counterpart (`*-accent-light`).

### Neutral
- **Abyss** (`abyss`): page background (`--of-bg-base`).
- **Night Water** (`night-water`): surfaces such as cards, panels and the nav bars (`--of-bg-surface`).
- **Raised Water** (`raised-water`): inputs, secondary buttons, dropdowns, the active nav pill (`--of-bg-elevated`).
- **Water Hover** (`water-hover`): hover fill on rows and secondary buttons.
- **Rope Line** faint / default / strong: dividers and card borders / input borders / emphasized borders.
- **Foam Bright → Fog** (`foam-bright`, `foam`, `mist`, `haze`, `fog`): the five-step text ramp, from headings and lure names (`--of-text-bright`) to body (`--of-text`), secondary (`--of-text-2`), labels (`--of-text-3`) and hints/inactive (`--of-text-4`).
- **Ink** (`ink`): text on solid accent fills. It flips to white in light mode.
- **Light mode** (`shallows`, `paper`, `paper-raised`, `shore-line`, `deep-ink`, `slate-text`, `slate-muted`): the same roles on a pale blue-white ground.

### Semantic
- **Hook Red** (`hook-red`): danger, delete, excluded filter chips, favourited hearts.
- **Reed Green** (`reed-green`): success, QR-labelled check, lure tag chips.
- **Hook Amber** (`hook-amber`, solid `hook-amber-solid`): warnings, demo mode, the LOST pill, amount badges.
- Bite-index ratings use a fixed scale: Excellent `#22d3ee`, Good `#4ade80`, Fair `#f59e0b`, Poor `#ef4444`.

### Named Rules
**The Single Glint Rule.** Each theme has exactly one accent hue. It marks what you can act on and what is selected, and nothing else. Semantic colors are not accents and are never used for decoration.

**The Token-Only Rule.** Components take every color from `--of-*` semantic tokens, never from literals. A literal hex in a component breaks the other three themes and light mode. (The lure-number badge's photo scrim, `rgba(0,0,0,0.62)`, is the one deliberate exception: it must be dark on every photo.)

**The Glare Rule (direction).** On screens used at the water (lure cards, catch and spot forms, spot detail), information a person needs to read uses `--of-text-2` or brighter. `--of-text-4` is for hints and inactive states only, never for values.

## Typography

**Display / Body Font:** DM Sans (with sans-serif)
**Label/Mono Font:** JetBrains Mono (with monospace)

**Character:** A friendly, slightly rounded grotesque for everything readable, paired with a mechanical mono that appears only where a number is catalogued: the inventory stencil on the tackle box.

### Hierarchy
- **Figure** (JetBrains Mono 600, `--of-fs-figure` 2rem, line-height 1): the one number a page is about: a catch's length and weight, the spot's bite index, the lure plate on its detail page. `--of-fs-figure-sm` (1.5rem) for stat tiles. Figures are `--of-text-bright`, not accent; accent is for the plate and the leading bar of a chart.
- **Headline** (500–600, `--of-fs-headline` 1.5rem, 1.2): page titles (`<h1>`). Every page has exactly one h1; list pages whose title is already the active nav item use a visually hidden one.
- **Section** (600, `--of-fs-section` 1rem): `<h2>` inside panels ("Catches" under a lure or spot) and empty-state headings. Replaces the old ad-hoc 1.1rem.
- **Title** (500, 0.95rem, 1.35): lure names on cards. Truncate with an ellipsis rather than wrap on cards.
- **Body** (400, 0.875rem, 1.5): inputs, buttons, menu items, paragraphs.
- **Label** (500, 0.8125rem, 1.4): form labels, secondary buttons, brand lines, nav links.
- **Caption** (500, 0.75rem, 1.5): chips, tags, filter row labels, tab-bar labels. This is the floor; nothing is smaller.
- **Numeral** (JetBrains Mono 600, 0.75rem–1rem, tabular): lure plates on cards (0.75rem badge on the photo) and list rows, amount badges (`×3`), catch counts, numeric filter inputs, and spec values (weight, size, amount on the lure page).

### Named Rules
**The Stencil Rule.** Mono type is reserved for catalogued numbers: lure numbers, weights, sizes, depths, counts, coordinates. Never for prose, labels or headings. Any column of digits uses `font-variant-numeric: tabular-nums` (`.of-num`).

**The Long-Word Rule.** Every label must survive German and Polish string lengths: allow wrapping in buttons and chips, and never set a fixed width on text-bearing controls.

## Layout

A single centered column (`max-w-6xl`, 1152px) with 16px side gutters. Content spacing follows a 4px grid (`--of-space-1` to `--of-space-8`). Common values are 4/6/8/10/12/16/20/24px gaps, and 20px between page sections.

- **Lure box**: compartments, 2 → 3 → 4 columns (base / 768px / 1280px; 10 / 14 / 16px gap), so a phone shows two lures across. Each card is a recessed 4:3 photo well (6px inset, 9px radius) over a label strip: name with the catch count at its right, then brand. The plate rides on the photo as a small badge. Tags hide at ≤ 480px. A Box / List switch (`.of-seg`) sits in the filter bar; List is a dense row per lure (thumb, plate, name, brand · type, count, heart). The choice is remembered per browser (`src/lib/lureView.ts`, guarded localStorage). On wide screens the wrapper reserves height per page size so pagination never jumps.
- **Detail pages** (lure, catch, spot): a header row with a back link (to the list) and a secondary Edit button. Phones: one column, the subject first (the fish photo, the lure well, or the spot's facts and conditions), map after. ≥ 960px: two columns (media | facts), max 1040px. History under a lure or spot is a list of link rows (`<a>` per catch, 44px min), never a click-handler table, so nothing scrolls sideways.
- **Catch form**: essentials first (photos, species, length + weight side by side via `.of-grid-pair`, lure tiles, location, time); combo, retrieve style, notes and C&R live in a `<details class="of-more">` disclosure that opens automatically on edit when any of them is set.
- **Forms**: one panel, fields in `.of-grid-2` (16px gap), `.of-grid-2-sm` (12px) or `.of-grid-3` (1fr / 1fr / 0.65fr). At ≤ 480px, two-column grids collapse to one and three-column to two.
- **Filter bars** wrap (`flex-wrap: wrap`) and never scroll sideways.
- **Navigation**: desktop top bar (56px) at `md` and up; below `md` a 48px top bar plus a fixed 64px bottom tab bar (with safe-area padding). Main content gets `pb-24` on mobile to clear it.
- **Maps** (Leaflet) sit in a bordered wrapper; the map element itself only ever has a static height.

**The Thumb Rule (direction).** On mobile, every tappable control on a field-use screen is at least 40px tall, and a form's primary action is full width and at least 48px.

## Elevation & Depth

Flat by default. Depth comes from three tonal steps (Abyss → Night Water → Raised Water) and 1px Rope Line borders, not from shadows. Shadows appear only when something genuinely floats above the page.

### Shadow Vocabulary
- **Floating menu** (`box-shadow: 0 8px 24px rgba(0,0,0,0.4)`): the Add dropdown and other popovers.
- **Toast** (`box-shadow: 0 8px 32px rgba(0,0,0,0.5)`): the demo-mode toast.
- **Modal** (`box-shadow: 0 20px 60px rgba(0,0,0,0.5)`): crop modal and dialogs.
- **Scrim** (`--of-scrim`): the backdrop behind modals, the bite-info popup and the phone chatbot panel. Derived from the active theme: its deepest surface at 80% in dark mode, its darkest ink at 55% in light mode, so a backdrop never carries another theme's hue. Scrims over photos and map tiles stay neutral black (`photo-scrim*`, `map-hint-scrim`), because their ink is fixed white.
- **Chat sheet** (`box-shadow: 0 -8px 40px rgba(0,0,0,0.5)`): the chatbot panel rising from the bottom.
- **Accent glow** (`box-shadow: 0 8px 32px var(--of-accent-glow)`): lure card hover only, paired with the border turning `--of-accent-border`.

### Named Rules
**The Flat-At-Rest Rule.** Cards and panels never carry a shadow at rest. A shadow means "this is floating" (menu, toast, modal) or "you are pointing at this" (card hover glow).

## Shapes

Gently curved, never pill-shaped except for small chips. Corners scale with the size of the object:

- **4–6px** (`xs`, `sm`): badges, lure-number plates, menu items, tag-input chips.
- **8px** (`--of-radius-control-sm`): compact secondary buttons (share, directions, pagination, date filters).
- **9px** (`control`): inputs, selects and buttons, the most common radius in the app. (`--of-radius-md` is 10px; 9px and 10px are both in use for controls. Treat them as one step and prefer the token for new code.)
- **12px** (`--of-radius-subpanel`): things nested in a page rather than standing as a card: the saved banner, dense list rows, weather tiles.
- **10px** (`md`): dropdown menus, the Add button, nav pills.
- **14px** (`lg`): cards and panels (filter bar, form panels, lure cards).
- **16px** (`xl`): modals and the chatbot panel.
- **20px** (`pill`): filter chips, tag chips, count badges.
- **50%**: footer icon buttons, the QR-check dot.

Borders are always 1px solid (dashed only for an "add a value" placeholder button). Photos are clipped by their card's radius (`overflow: hidden`) and use `object-fit: cover`.

## Components

### Buttons
Confident and compact; the primary action is unmistakable and there is only one per view.
- **Shape:** gently curved (9px)
- **Primary:** solid accent (`--of-accent-solid`) with Ink text, 600 weight, `10px 24px`. Used for Save, Add, Apply.
- **Hover / Focus:** fill shifts to `--of-accent` (lighter in dark mode) over 150ms on `--of-ease` (`cubic-bezier(0.22, 1, 0.36, 1)`).
- **Secondary:** Raised Water fill, 1px Rope Line border, `--of-text-2` text; hover moves to Water Hover and `--of-text`. Used for Cancel and back links.
- **Ghost:** transparent with a border, `--of-text-3` text; text-only accent links for Clear-type actions.
- **Danger:** danger text on `--of-danger-bg` with `--of-danger-border`.

### Chips
- **Filter chips (tri-state):** pill, caption size, `3px 10px`. Neutral: transparent with a faint border and `--of-text-4`. Include: accent tint and border, accent text. Exclude: danger tint and border, danger text with strikethrough. Each click cycles include → exclude → clear.
- **Tag chips:** pill, reed-green tint/border/text. On cards, at most two are shown plus a neutral `+N` overflow chip.
- **Toggle chips** (favourites, has-catch): same shape with an icon; favourites uses danger red, has-catch uses the accent.
- **Direction:** on field-use forms (species pickers, presentation chips), chips grow to at least 40px tall with 0.875rem text, a 1.5px border, and an 8px radius.

### Cards / Containers
- **Corner Style:** 14px
- **Background:** Night Water (`--of-bg-surface`); photo areas use `--of-bg-overlay`.
- **Shadow Strategy:** none at rest; accent glow plus accent border on hover (see Elevation).
- **Border:** 1px `--of-border-subtle`.
- **Internal Padding:** 14px on panels and card bodies, 12px on dense sub-panels.

### Inputs / Fields
- **Style:** Raised Water fill, 1px Rope Line border, 9px radius, `9px 12px` padding, body size. Labels sit above in label style, `--of-text-3`, with 6px spacing.
- **Focus:** border becomes `--of-accent-solid` with a 3px `--of-accent-bg-hover` ring (selects use a 2px `--of-accent-border` ring). Keyboard focus everywhere else is one global ring in `layout.css`: 2px `--of-accent-solid`, 2px offset on links/buttons/summaries, a 2px `--of-accent-border` outline on text fields. A "Skip to content" link is the first tab stop.
- **Placeholder:** `::placeholder` is `--of-text-4` at full opacity (≥ 4.5:1 on field surfaces in every theme); never rely on the UA grey.
- **Selects:** native appearance removed, theme-tinted SVG chevron (`--of-chevron`) at right 10px.
- **Range:** native slider with `accent-color: var(--of-accent-solid)`, the current value labelled in accent at the right of the label row.
- **Unset optional value:** a dashed-border ghost button ("＋ Light conditions") that turns into the control when clicked.

### Navigation
- **Desktop:** Night Water bar with a faint bottom border; the wordmark is in accent at 26px. Links use label style. Inactive links are `--of-text-3` with a transparent border; the active link is `--of-text-bright` on Raised Water with a Rope Line border (a pill, 10px radius). The Add dropdown sits at the right as the primary button.
- **Mobile:** 48px top bar (wordmark, a 44px Settings gear, Add) and a fixed 64px bottom tab bar with five icon-over-caption tabs (Lures, Spots, Catches, Stats, Tackle). Five, not six, so labels in every language fit at caption size; they wrap or hyphenate rather than clip. The active tab is accent-colored with an accent-tinted icon fill; inactive tabs are `--of-text-4`.
- **Field-use layer:** on touch screens and below 768px, the Thumb and Glare rules are enforced by opt-in classes in `layout.css` (`.of-actions` sticky save row, `.of-primary` full-width 48px action, `.of-touch`, `.of-chip`, `.of-linkbtn`, `.of-tap`). Form text is 16px there so iOS never zooms on focus.
- **Settings:** a secondary tab row inside the Settings section (Account and Admin live there; there is no user menu).

### Lure Number Plate (signature)
The `#0042` plate is the tackle box's stencil and the most recognizable element in the app. On cards it is a small scrim badge at the photo's top-left corner (JetBrains Mono 600, 0.75rem, `--of-badge-num-text`), with the amount badge beside it: present for matching a printed label, never louder than the lure. An accent 1rem plate in every card's label strip was tried and dropped: across a grid it formed a stripe of cyan numbers that out-shouted the photos. On the lure page it is a Figure (2rem) directly above the name, with the QR beside it (an orange dot plus a "Not labeled yet" link to `/settings/qr` when no label is printed). On the photo itself only scrim badges remain, at fixed positions: plate and amount (`#0042` `×3`) top-left, QR check top-right, LOST (amber pill) bottom-left, favourite heart bottom-right.

### Spec Tiles (direction)
Lure and catch specs (type, size, weight, depth, catches) are shown as small Raised Water tiles: caption-size label in `--of-text-3` above a mono 600 value in `--of-text-bright`, two per row. This replaces loose metadata lines on field-use cards.

## Do's and Don'ts

### Do:
- **Do** take every color from an `--of-*` token so all four themes and both modes work automatically.
- **Do** check every new screen in dark and light mode, and in at least one non-Ocean theme.
- **Do** keep one solid-accent primary action per view.
- **Do** use JetBrains Mono with tabular numerals for lure numbers, measurements and counts, and nowhere else.
- **Do** keep cards flat at rest (14px radius, 1px subtle border) and reserve shadows for floating layers.
- **Do** run the glare test on field-use screens: secondary info at `--of-text-2` or brighter, controls at least 40px, primary action at least 48px on mobile.
- **Do** keep the wordmark and mark SVGs as they are, colored by `currentColor` from the theme accent.

### Don't:
- **Don't** use `--of-text-4` for anything a person needs to read at the water; it is for hints and inactive states.
- **Don't** introduce a second accent hue within a theme, or use semantic red/green/amber decoratively.
- **Don't** add shadows to resting cards or panels.
- **Don't** set text below 0.75rem.
- **Don't** let filter bars or chip rows scroll horizontally; they wrap.
- **Don't** give text-bearing controls fixed widths; nine languages have to fit.
- **Don't** hardcode hex values in components, even for one theme.
