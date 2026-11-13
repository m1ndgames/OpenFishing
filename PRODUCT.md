# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hobby anglers, alone or in a small group, who keep their own fishing records. One person who is comfortable with tech self-hosts the instance (Docker). Most use happens in two places:

- **At the water**, on a phone at the bank or on a boat: logging a catch, marking a spot, checking the bite index, looking up which lure to try.
- **At home**: organizing the lure and tackle collection, printing QR labels, reviewing stats, backups.

When `ADMIN_PASSWORD` is set, the instance becomes multi-user. An admin manages accounts, and each angler's data stays private.

## Product Purpose

A self-hosted place to organize fishing lures and tackle, mark fishing spots, and log catches, so an angler builds a personal record of what works, where, and with which gear. Success means logging is quick enough to do on the spot, and the collection and history are easy to search later.

## Positioning

- **Self-hosted, you own the data.** SQLite + Docker, full backup/restore, no cloud account and no third-party service required. Optional multi-user. Open source (AGPL-3.0).
- **Built around lures.** Lures are the core entity: sequential numbers (`#0001`), printable QR labels, include/exclude filters, favourites, lost-lure tracking, and catch history per lure. Catch-log apps like Fishbrain don't offer this, and a spreadsheet doesn't do it well.

## Operating Context

- Phones used outdoors: bright sunlight, dusk/night, wet or cold hands, one-handed use, patchy connectivity.
- Photos come from the phone camera. EXIF GPS and capture time prefill the catch/spot forms when the photo still has them.
- Physical QR labels on lures link back to their record.
- Public share links for single lures, spots, and catches, so they can be shown to others without an account.

## Capabilities and Constraints

- Entities: lures (with tags and species), tackle (rods, reels, lines, combos, spool history), spots (map, photos, tags), catches (map, photos, lure, combo, presentation, bite-index snapshot), stats.
- Catches link to spots by proximity (Haversine, < 100 m), not by a stored foreign key.
- Bite index (0–10) built from Open-Meteo weather data.
- Optional AI features (enabled through env vars, bring your own model via LiteLLM): fish identification from a photo, lure identification from a photo, and a chatbot that can query the user's data. These are secondary capabilities, not part of the positioning. They are often turned off.
- Read-only REST API (`/api/v1`) with a per-user bearer token. Swagger UI at `/api-docs`.
- Demo mode (read-only) for the public demo.
- **Languages:** 9 languages (EN, DE, FR, ES, IT, NL, PL, PT, UK). All UI copy goes through i18n keys, and layouts must handle long strings (e.g. German).
- **Phone use outdoors:** the core logging flows must work one-handed on a phone in bright sun and low light. The mobile bottom tab bar stays.
- **Appearance:** per-user color mode (dark / light / system) and a theme system built on design tokens. Both must stay supported.
- Stack is fixed by the existing codebase (SvelteKit + Tailwind v4 + SQLite/Drizzle + Leaflet). See `CLAUDE.md`.

## Brand Commitments

- Name: **OpenFishing**.
- The wordmark (`src/lib/assets/openfishing-logo.svg`) and square mark (`src/lib/assets/openfishing-mark.svg`, `favicon.svg`) are fixed brand assets. Keep them. They take their color from the active theme accent (except the favicon, which has a fixed fill).

## Evidence on Hand

- Public website: https://openfishing.org. Live demo: https://demo.openfishing.org. Docs: https://openfishing.org/docs/.
- E2E seed data (`e2e/global-setup.ts`) gives realistic sample lures, spots, catches, and tackle for screenshots.
- No testimonials, user counts, or press exist. Don't make them up.

## Product Principles

1. **Your data, your server.** Never add a dependency on a hosted service for core features. Optional integrations stay optional.
2. **Fast at the water.** Logging a catch or spot on a phone outdoors is the moment that matters most. Reduce steps, prefill what can be prefilled, and keep it readable in harsh light.
3. **The lure is the center.** Most views and stats should answer "what worked, and with which lure/gear?"
4. **Works in every language and mode.** Every screen has to hold up in all 9 languages and in both dark and light.
5. **Optional complexity stays out of the way.** Multi-user, AI, sharing, and the API add nothing to the interface when they are disabled.
