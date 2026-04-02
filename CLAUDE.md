# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 1234
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests (vitest)
npm run test:watch   # Run tests in watch mode
```

## Architecture

Single Nuxt 4 repository — one Railway deployment covers the entire app (frontend + API). No Express, no monorepo.

**Key distinction:** `server/routes/v1/` (not `server/api/`) is intentional — it avoids the automatic `/api/` prefix, producing clean public URLs like `/v1/check`.

### Server layer (`server/`)

- `routes/v1/` — Public API endpoints: `check.get.ts`, `range.get.ts`, `next.get.ts`
- `middleware/` — `auth.ts` (validate `X-API-Key` header against `api_keys.key_hash`), `rateLimit.ts` (Redis-backed per-key monthly counters)
- `utils/db.ts` — Singleton PostgreSQL connection via `postgres` package; use `useDb()` in server routes
- `utils/redis.ts` — Redis client for rate limiting (not yet implemented)
- `api/dashboard/` — Internal routes for API key CRUD (generate, list, revoke)

### Frontend layer (`app/`)

- `pages/index.vue` — Landing page
- `pages/dashboard/` — API key management UI
- `content/docs/` — Markdown docs served via `@nuxt/content`

### Database schema

Two-table design: `calendar_years` (year-level metadata with `status: draft|verified|published`) and `calendar_entries` (day-level rows for special days only). **All API queries must JOIN `calendar_years` and filter `y.status = 'published'`** to prevent draft data leaking to the API.

`api_keys` table stores `key_hash` (SHA-256 of the raw key), `user_email`, `tier` (`free|pro`), and `requests_this_month`.

### Sparse storage pattern

Only special days (holiday, makeup, named weekends) are stored. The API infers any unmatched date as a normal working day (Mon–Fri) or plain weekend (Sat–Sun). This is the intended design — do not store regular working day rows.

### Day types

- `working` — not stored; inferred by the API
- `holiday` — official public holiday; always has `name_en` + `name_local`
- `makeup` — make-up workday (e.g. 春节调休上班); context is carried entirely in the name fields, no `makeup_for` date field
- `weekend` — stored only when it falls within a holiday period (to provide context); ordinary weekends are inferred

### Rate limiting tiers

- Free: 500 req/month
- Pro: 50,000 req/month — unlocked via Buy Me a Coffee webhook (no fixed recurring price)

Pro is granted by a BMAC webhook: on payment received, set the matching key's tier to `pro` and reset `requests_this_month` to 0. No business/unlimited tier for now.

### Data pipeline

Not part of this repo. n8n runs locally once a year, fetches TW/CN government sources, parses with AI, and upserts to the Railway PostgreSQL instance via the `draft → verified → published` lifecycle.

## Environment

Copy `.env.example` to `.env`. Required vars: `DATABASE_URL`, `REDIS_URL`.

Runtime config is in `nuxt.config.ts` — server-only secrets go under `runtimeConfig` (not `runtimeConfig.public`); access via `useRuntimeConfig()` in server utilities.
