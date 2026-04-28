# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Worker (Cloudflare Worker)
cd worker
npm run dev        # local dev server via wrangler
npm run deploy     # deploy to Cloudflare
npx tsc --noEmit   # type check
bash test.sh       # integration test suite (requires npm run dev running)

# Frontend (Vite + React)
cd frontend
npm run dev        # dev server at localhost:5173
npm run build      # tsc + vite build → dist/
npm run preview    # preview production build
```

## Architecture

Two completely separate packages — `worker/` and `frontend/` — with no shared code. Types are duplicated intentionally.

### Worker (`worker/src/`)
Cloudflare Worker handling all backend logic:

- **`index.ts`** — entry point. Routes HTTP requests to handlers. Exposes `Env` interface (all secrets live here).
- **`webhook.ts`** — core logic. Handles all inbound WhatsApp messages from Twilio. Every message goes through `parseSectionTag()` first, then routes to command handlers (PING, HELP, TEST, VOICE:, DONE) or stores as a jotting. The `notify()` wrapper replaces direct `sendWhatsApp` calls — respects `SKIP_TWILIO=true` for local testing.
- **`claude.ts`** — all AI logic. `generateDraft()` builds a full journal from jottings. `applyEdit()` updates a specific section based on a natural-language reply. `buildWhatsAppPreview()` formats the status message sent at 7:30 PM. `CITY_CONTEXT` map provides location facts Claude uses to expand brief jottings.
- **`cron.ts`** — scheduled at 10:30 UTC (7:30 PM JST). Generates the draft and sends it via WhatsApp.
- **`kv.ts`** — KV read/write. Keys: `day:YYYY-MM-DD` for entries, `voice_profile` for the student's writing style.
- **`trip.ts`** — static itinerary data (14 days, May 11–24 2026). Source of truth for day numbers, dates, cities.

**Section tags**: jottings prefixed with `#tech`, `#culture`, `#lang`, `#reflect`, `#questions`, `#tomorrow`, `#activity` get a `sectionHint` stored alongside the cleaned text. Claude sees these hints and routes accordingly.

**Local testing**: set `SKIP_TWILIO=true` in `worker/.dev.vars` to bypass real Twilio calls (they log to console instead). Run `bash test.sh` against a live `npm run dev` instance.

### Frontend (`frontend/src/`)
React 18 + React Router v6 SPA, deployed to Cloudflare Pages at `journal.khoitrn.com`.

- **`App.tsx`** — wraps everything in `AuthProvider`. Shows `AuthGate` until logged in, then routes between `Feed` and `DayView`.
- **`pages/Feed.tsx`** — WhatsApp-style chat list. One card per trip day. Reads all entries from the worker API.
- **`pages/DayView.tsx`** — full journal editor for a single day. Editable sections with word count validation, photo upload, and PDF export.
- **`context/AuthContext.tsx`** — session auth via `sessionStorage`. Roles: `admin` (full edit) or `guest` (read-only). Token sent as `Authorization: Bearer` on all API calls.
- **`utils/api.ts`** — all worker API calls. Base URL from `VITE_WORKER_URL` env var (falls back to `localhost:8787`).
- **`utils/export.ts`** — PDF generation via browser print.
- **`data/trip.ts`** — mirrors `worker/src/trip.ts` (same itinerary, kept in sync manually).

**Styling**: Dracula color theme (`index.css` CSS vars). All styles are inline in components — no CSS modules or Tailwind. Design mimics WhatsApp UI (dark green header, chat bubbles).

**Fonts**: Inter (body), Raleway (headings) — loaded from Google Fonts in `index.html`.
