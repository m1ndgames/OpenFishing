# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenFishing** is a self-hosted SvelteKit + SQLite web app for organizing fishing lures, marking fishing spots, and logging catches.

Optional built-in password auth via `AUTH_PASSWORD` env var. If unset, the app is fully open. When set, `src/hooks.server.ts` intercepts every request and redirects to `/login` if the `of_session` cookie is missing or invalid. The session token is an HMAC-SHA256 of the password — no DB storage, no server-side state. Changing the password invalidates all sessions immediately.

Share links allow individual lures, spots, and catches to be shared publicly even when auth is enabled. A `shareToken` UUID column on each entity controls access. The `/share/*` and `/uploads/*` paths are always bypassed by the auth hook. Share management UI (create/copy/revoke) is shown on detail pages only when `AUTH_PASSWORD` is set.

## Tech Stack

- **SvelteKit** — full-stack (UI + server routes, no separate backend)
- **TailwindCSS v4** — styling (no config file, imported via `@tailwindcss/vite`)
- **Drizzle ORM** — database via `better-sqlite3`
- **Leaflet.js** — interactive maps (dynamic import inside `onMount`)
- **Docker** — deployment; `ghcr.io/m1ndgames/openfishing:latest` built via GitHub Actions on push to `main`

## Commands

```bash
npm install            # Install dependencies
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run check          # Svelte type-check

npm run db:push        # Push schema changes to SQLite (dev, use --force in CI)
npm run db:generate    # Generate migration files
npm run db:migrate     # Run migrations
npm run db:studio      # Open Drizzle Studio (DB GUI)
```

## Schema changes — mandatory workflow

**Always** follow these steps when changing `schema.ts`. Skipping any step breaks production migrations.

1. Edit `src/lib/server/db/schema.ts`
2. Run `npm run db:generate` in a real terminal (requires TTY — cannot run via Claude Code's bash tool)
   - Drizzle will prompt about renames vs. drop+add — answer accordingly
   - This creates: `drizzle/NNNN_<name>.sql` + `drizzle/meta/NNNN_snapshot.json` + updates `drizzle/meta/_journal.json`
3. Commit **all three** generated/updated files together with the schema change
4. Update all server files that reference the old column name

**Never** manually write migration SQL files — the journal and snapshot won't be updated, and `migrate()` will silently skip the migration on prod startup.

## Architecture

### Routes

| Route | Purpose |
|---|---|
| `/` | Lure grid with client-side filters and pagination |
| `/lures/new` | Add lure form |
| `/lures/[id]` | Lure detail view |
| `/lures/[id]/edit` | Edit / delete lure |
| `/spots` | Spot list |
| `/spots/new` | Add spot form (map + GPS) |
| `/spots/[id]` | Spot detail view (map, photos, nearby catches table) |
| `/spots/[id]/edit` | Edit / delete spot |
| `/catches` | Catch list |
| `/catches/new` | Add catch form (map + GPS) |
| `/catches/[id]` | Catch detail view (map, photos, lure + spot links) |
| `/catches/[id]/edit` | Edit / delete catch |
| `/settings/qr` | Print QR labels for unlabeled lures |
| `/uploads/[filename]` | Serve uploaded photos from `UPLOAD_PATH` |
| `/api/lang` | POST — sets `lang` cookie for i18n |
| `/api/lures/[id]/favourite` | POST — toggles favourite state, returns `{ favourite: bool }` |
| `/api/lures/[id]/share` | POST — creates share token, DELETE — revokes it |
| `/api/spots/[id]/share` | POST — creates share token, DELETE — revokes it |
| `/api/catches/[id]/share` | POST — creates share token, DELETE — revokes it |
| `/share/lures/[token]` | Public read-only lure view (no auth required) |
| `/share/spots/[token]` | Public read-only spot view (no auth required) |
| `/share/catches/[token]` | Public read-only catch view (no auth required) |
| `/login` | Password login page (only shown when `AUTH_PASSWORD` is set) |

### Data model

- `lure` — id (UUID), lureNumber (sequential int), name, brand, type, color, weight, size, notes, photoPath, species, runningDepth, waterType, lightConditions (integer 0–10), amount (integer, default 1), favourite (boolean), qrCoded (boolean), lost (boolean), shareToken (nullable UUID), createdAt, updatedAt
- `tag` — id, lureId (FK → lure, cascade delete), name
- `spot` — id (UUID), name, lat, lng, notes, shareToken (nullable UUID), createdAt, updatedAt
- `spotTag` — id, spotId (FK → spot, cascade delete), name
- `spotPhoto` — id, spotId (FK → spot, cascade delete), filename, sortOrder
- `fishCatch` — id (UUID), caughtAt, species, weightG, lengthCm, lat (nullable), lng (nullable), notes, catchAndRelease, presentation, biteIndex (nullable real), lureId (FK → lure, set null on delete), shareToken (nullable UUID), createdAt, updatedAt
- `catchPhoto` — id, catchId (FK → fishCatch, cascade delete), filename, sortOrder

Tags are stored in separate tag tables (one row per tag). Species is stored as a space-separated string in `lure.species`. Both use the `TagInput` chip component at `src/lib/components/TagInput.svelte`. `TagInput` accepts a `suggest` prop (`string[]`) that wires a `<datalist>` for autocomplete.

`lureNumber` is a sequential display number (shown as `#0001`). The primary key is a UUID used in URLs.

`lightConditions` is an integer 0–10 (0 = Night, 10 = Clear). Displayed using translation keys `lightConditions_0` … `lightConditions_10`. Edited via a labeled range slider in the lure forms. Stored as `null` when not set.

### Spot ↔ Catch relationship

Spots and catches are **not** linked by a foreign key. Instead, the relationship is computed at query time using the Haversine formula:

- For each catch with lat/lng, find the nearest spot.
- If the nearest spot is **this** spot **and** the distance is < 100m, the catch is shown on the spot detail page.
- On the catch detail page, the nearest spot within 100m is shown as a link.

This approach avoids storing a redundant FK while still supporting the "no spot defined yet" case gracefully.

### Navigation

The layout (`src/routes/+layout.svelte`) renders the full nav chrome for all routes **except** `/login` and `/share/*`, which are detected via `$page.url.pathname` and render `{@render children()}` directly (share pages include their own minimal OpenFishing header). The nav has:
- **Desktop**: Logo + section links + "Add" dropdown + language switcher
- **Mobile**: Top bar (logo + Add dropdown + lang) + fixed bottom tab bar

The language switcher is a `<select>` with flag emoji in the options (`🇬🇧 EN` / `🇩🇪 DE`), posting to `/api/lang`.

### i18n

Translations live in `src/lib/i18n/en.ts` and `src/lib/i18n/de.ts`. The layout server (`src/routes/+layout.server.ts`) reads the `lang` cookie (falling back to `Accept-Language` header) and returns `{ t, lang }`, which SvelteKit merges into every page's `data` prop automatically.

### File uploads

Photos are saved to `UPLOAD_PATH` (env var, defaults to `./uploads`) and served through the `/uploads/[filename]` server route. Images are auto-rotated and resized to max 1920×1920 JPEG via `sharp`. The filename stored in the DB is just the basename (UUID + `.jpg`). Must be a Docker volume in production.

### Leaflet maps

Leaflet is always dynamically imported inside `onMount` (`const L = (await import('leaflet')).default`). The map element (`bind:this={mapEl}`) must have only a static `style="height:Xpx;"` — never reactive styles on the same element, as Svelte mutating the element Leaflet tracks causes tile offset corruption. Wrap it in a parent div if border/radius styling is needed.

Always call `requestAnimationFrame(() => mapInstance.invalidateSize())` after `setView` to fix tile rendering when the element was not visible at mount time.

### Select / dropdown styling

All `<select>` elements use `appearance: none` (with `-webkit-` and `-moz-` prefixes) defined globally in `src/routes/layout.css` with a custom SVG chevron via `background-image`. The `!important` flags are required because inline `background` shorthand on individual selects would otherwise reset `background-image` to none.

Filter selects (lures overview, catches page) must use the same visual style as form selects: `font-size:0.875rem`, `padding:7px 12px`, `border-radius:9px`, `background:#0f2238`. Active (filtered) state: `border:1px solid rgba(6,182,212,0.5); color:#22d3ee`. Inactive: `border:1px solid #243f5e; color:#c2dce8`.

Filter bars use `flex-wrap:wrap` (not `overflow-x:auto`) so they reflow to multiple rows on mobile instead of scrolling horizontally.

### Filtering & pagination

The overview page (`/`) loads all lures once from the server and filters client-side using Svelte 5 `$derived`. Filters use an include/exclude chip model (`ChipFilter = Record<string, 'include' | 'exclude'>`): clicking once includes (cyan), again excludes (red strikethrough), again clears. Active filters: type, running depth, light conditions, fish species, size range (min/max), weight range (min/max), favourites toggle, has-catch toggle. The filter panel is toggled via a pill button that turns cyan when filters are active. Pagination default is 12 per page. Do not move filtering to the server.

### Favourites

`lure.favourite` is a boolean (SQLite integer). Toggled via `POST /api/lures/[id]/favourite` which flips the value and returns `{ favourite: bool }`. The overview page tracks state in a local `Record<string, boolean>` initialized from server data and updated optimistically on click — the card heart icon and the favourites filter row both react to this local state.

### Lost lures

`lure.lost` is a boolean (SQLite integer, default false). Marking a lure as lost (via the `markLost` form action on the edit page) sets `lost = true` and clears `qrCoded = false` in a single DB update. A `markFound` action reverses only `lost`. Lost lures remain fully intact in the DB so all linked catch records and stats are preserved. The edit page shows "Mark as Lost" (amber) or "Mark as Found" (green) depending on current state, with a confirm dialog for marking lost. The detail page shows an amber "Lost" badge; the overview card shows an amber `LOST` pill overlay on the photo.

### Bite index

The bite index (0–10) is a weighted score: pressure trend × 0.5, light conditions × 0.3, temperature stability × 0.2. Scores: pressure falling > 1.5 hPa/3h = 10, stable = 7, rising = 2; dawn/dusk = 10, golden = 8, night/morning = 6, day = 2; temp delta < 3 °C = 10, ≥ 3 °C = 2. Data comes from the Open-Meteo API (5 s timeout, silently ignored on failure).

The shared utility lives in `src/lib/server/biteIndex.ts` and exports `fetchWeather(lat, lng)`. Both `spots/[id]/+page.server.ts` (live display) and `catches/new/+page.server.ts` (snapshot on insert) import from it. The snapshot is stored as `fishCatch.biteIndex` (nullable real) and displayed on the catch detail page with the same progress-bar + color + rating label (Poor/Fair/Good/Excellent) as the spot page. Thresholds: ≥ 8.5 Excellent (#22d3ee), ≥ 6.5 Good (#4ade80), ≥ 4 Fair (#f59e0b), < 4 Poor (#ef4444).

### Share links

Each of `lure`, `spot`, and `fishCatch` has a nullable `shareToken` column. When non-null, the token grants unauthenticated read-only access to `/share/[entity]/[token]`. The share management UI (create/copy URL/revoke) appears on detail pages only when `AUTH_PASSWORD` is set — if auth is disabled, everything is already public so the UI is hidden. The `/share/*` and `/uploads/*` paths are exempted from the auth hook so photos render correctly on share pages. Share tokens are standard UUIDs generated with `crypto.randomUUID()`.

### Auto-suggest

The new/edit lure forms load distinct existing values for `name`, `brand`, `type`, and `color` from the DB and wire them to `<datalist>` elements. Fish species suggestions are loaded by splitting all existing `lure.species` space-separated strings, deduplicating, and passing as `suggest` to the species `TagInput`.

### QR labels

`/settings/qr` shows all lures where `qrCoded = false`, with a server-side generated SVG QR code per lure. The print view uses `@media print` CSS to render a compact grid of 12.5mm×12.5mm QR codes with bordered frames. Marking a lure as labeled uses a SvelteKit form action with `enhance` (no page reload).

### Migrations

Drizzle migrations run automatically on startup in production (`NODE_ENV=production`). Multi-statement `.sql` migration files must use `-->statement-breakpoint` as a separator (required by `better-sqlite3`).

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `local.db` | Path to SQLite file |
| `UPLOAD_PATH` | `./uploads` | Directory for lure/spot/catch photos |
| `BASE_URL` | `http://localhost:5173` | Public base URL — used to generate QR code links |
| `AUTH_PASSWORD` | _(unset)_ | If set, enables password login. Leave unset for open access. |
| `DEMO_MODE` | _(unset)_ | If set to any value, enables read-only demo mode. All writes are blocked server-side; the UI shows a banner and a toast on submit attempts. Language switching still works. |
| `BODY_SIZE_LIMIT` | `104857600` | Max upload size in bytes (set in Dockerfile) |
