# TODO: Single Nuxt 4 repo — app/ (frontend + content/docs), server/ (v1 API routes, dashboard API, middleware, db/redis utils). See isworkday-prd.md §6.

# isworkday

Single Nuxt 4 repository for isworkday.io (API + landing + docs + dashboard).

## Structure

- **app/** — Frontend: `pages/` (landing, dashboard), `content/docs/` (Markdown via @nuxt/content), `components/`
- **server/** — API: `routes/v1/` (check, range, next), `middleware/` (auth, rateLimit), `utils/` (db, redis), `api/dashboard/` (keys CRUD)

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and set `DATABASE_URL`, `REDIS_URL`, etc.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
