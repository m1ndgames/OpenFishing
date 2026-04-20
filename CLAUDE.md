# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenFishing** is a self-hosted SvelteKit + SQLite web app for organizing fishing lures.

No in-app authentication — auth is delegated to the reverse proxy / load balancer (e.g. nginx or Traefik basic auth).

## Tech Stack

- **SvelteKit** — full-stack (UI + server routes, no separate backend)
- **TailwindCSS v4** — styling (no config file, imported via `@tailwindcss/vite`)
- **Drizzle ORM** — database via `better-sqlite3`
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

## Architecture

### Routes

| Route | Purpose |
|---|---|
| `/` | Lure grid with client-side filters and pagination |
| `/lures/new` | Add lure form |
| `/lures/[id]` | Lure detail view |
| `/lures/[id]/edit` | Edit / delete lure |
| `/qr` | Print QR labels for unlabeled lures |
| `/uploads/[filename]` | Serve uploaded photos from `UPLOAD_PATH` |
| `/api/lang` | POST — sets `lang` cookie for i18n |

### Data model

- `lure` — id (UUID), lureNumber (sequential int), name, brand, type, color, weight, size, notes, photoPath, species, runningDepth, waterType, weather, qrCoded, createdAt, updatedAt
- `tag` — id, lureId (FK → lure, cascade delete), name

Tags are stored in a separate `tag` table (one row per tag). Species is stored as a space-separated string in `lure.species`. Both use the `TagInput` chip component at `src/lib/components/TagInput.svelte`.

`lureNumber` is a sequential display number (shown as `#0001`). The primary key is a UUID used in URLs.

### i18n

Translations live in `src/lib/i18n/en.ts` and `src/lib/i18n/de.ts`. The layout server (`src/routes/+layout.server.ts`) reads the `lang` cookie (falling back to `Accept-Language` header) and returns `{ t, lang }`, which SvelteKit merges into every page's `data` prop automatically. Language is switched via a `<select>` that POSTs to `/api/lang`.

### File uploads

Photos are saved to `UPLOAD_PATH` (env var, defaults to `./uploads`) and served through the `/uploads/[filename]` server route. Images are auto-rotated and resized to max 1920×1920 JPEG via `sharp`. The filename stored in the DB is just the basename (UUID + `.jpg`). Must be a Docker volume in production.

### Filtering & pagination

The overview page (`/`) loads all lures once from the server and filters client-side using Svelte 5 `$derived`. Filters: text search, type, brand, color, water type, running depth, fish species. Pagination state (page, pageSize) is also client-side. Do not move filtering to the server.

### Auto-suggest

The new/edit lure forms load distinct existing values for `name`, `brand`, `type`, and `color` from the DB and wire them to `<datalist>` elements.

### QR labels

`/qr` shows all lures where `qrCoded = false`, with a server-side generated SVG QR code per lure. The print view uses `@media print` CSS to render a compact grid of 12.5mm×12.5mm QR codes with bordered frames. Marking a lure as labeled uses a SvelteKit form action with `enhance` (no page reload).

### Migrations

Drizzle migrations run automatically on startup in production (`NODE_ENV=production`). Multi-statement `.sql` migration files must use `-->statement-breakpoint` as a separator (required by `better-sqlite3`).

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `local.db` | Path to SQLite file |
| `UPLOAD_PATH` | `./uploads` | Directory for lure photos |
| `BASE_URL` | `http://localhost:5173` | Public base URL — used to generate QR code links |
| `BODY_SIZE_LIMIT` | `104857600` | Max upload size in bytes (set in Dockerfile) |
