# isworkday.io — Product Requirements Document

**Version:** 0.4  
**Date:** 2026-03-18  
**Status:** Draft

---

## 1. Overview

### 1.1 Problem Statement

Existing public holiday APIs (Calendarific, Nager.Date, AbstractAPI) cover Taiwan and China superficially. They list public holidays but fail to model the actual working day reality in these markets:

- Taiwan's government-mandated **make-up workdays (補班)** — where a weekday holiday is compensated by working the adjacent Saturday — are not reflected in any existing API
- China's **Golden Week adjustments (黃金周)** follow a similar swap system that no API handles accurately
- Developers building scheduling, payroll, or logistics tools for these markets have no reliable "is this a working day?" source

### 1.2 Solution

**isworkday.io** is a developer-focused REST API that answers one question extremely well:

> _"Is this date a working day in [country]?"_

Data is sourced directly from official government publications and refreshed annually, making it the most accurate working-day API for Taiwan and China.

### 1.3 Target Users

- Developers building HR / payroll systems
- SaaS teams with users or employees in Taiwan / China
- Logistics and scheduling apps operating in East Asia
- Freelancers building internal tools for Taiwan/China-based companies

---

## 2. Goals & Non-Goals

### Goals

- Provide a fast, reliable REST API with accurate working day data for Taiwan (TW) and China (CN)
- Model both public holidays AND make-up workdays (not just holidays)
- Offer a developer-friendly experience: clean JSON, great docs, copy-pasteable examples
- Launch with a free tier to drive organic adoption

### Non-Goals (v1)

- Mobile app
- Real-time government announcement tracking (manual annual refresh is acceptable)
- Coverage beyond TW and CN in v1
- Calendar integrations (Google Calendar, iCal export) — future roadmap

---

## 3. Data Sources

| Country     | Source                                                                                     | Refresh Cadence              |
| ----------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| Taiwan (TW) | [data.gov.tw](https://data.gov.tw) — 中華民國政府資料開放平台, annual working day calendar | Annually (Oct–Nov each year) |
| China (CN)  | State Council official announcements via gov.cn                                            | Annually (Nov–Dec each year) |

**Data model for each date entry:**

```json
// makeup day
{
  "date": "2026-02-28",
  "country": "CN",
  "is_working": true,
  "day_type": "makeup",
  "name_en": "Makeup workday for Chinese New Year Holiday",
  "name_local": "春节调休上班"
}

// holiday
{
  "date": "2026-02-17",
  "country": "CN",
  "is_working": false,
  "day_type": "holiday",
  "name_en": "Chinese New Year's Day",
  "name_local": "春节"
}

// weekend within a holiday period
{
  "date": "2026-02-21",
  "country": "CN",
  "is_working": false,
  "day_type": "weekend",
  "name_en": "Chinese New Year Holiday Weekend",
  "name_local": "春节假期周末"
}

// ordinary weekend
{
  "date": "2026-03-07",
  "country": "CN",
  "is_working": false,
  "day_type": "weekend",
  "name_en": null,
  "name_local": null
}
```

**Day types:**

- `working` — normal working day; `name_en` / `name_local` are null. Not stored in DB — API infers this for any date with no matching entry
- `holiday` — official public holiday; always has `name_en` and `name_local`
- `makeup` — make-up workday; `name_local` carries full context e.g. `春节调休上班`
- `weekend` — Saturday or Sunday; `name_en` / `name_local` are **optional** — populated when the weekend falls within a public holiday period to provide context, null for ordinary weekends

> **Design note — no `makeup_for` field:** The `name_en` and `name_local` fields already carry complete context about which holiday a makeup day compensates for. Storing a separate date reference would introduce ambiguity since makeup days correspond to a holiday period, not a single date.

> **Design note — sparse storage:** Only special days (holiday, makeup, named weekends) are stored. The API treats any date with no matching entry as a working day if it falls on Mon–Fri, or a plain weekend if it falls on Sat–Sun. This keeps the database lean and avoids storing 365 rows of mostly-null working day entries per country per year.

---

## 4. API Specification

### Base URL

```
https://api.isworkday.io/v1
```

### Authentication

API key passed as a header:

```
X-API-Key: your_api_key_here
```

---

### 4.1 Endpoint: Check a Single Date

```
GET /check
```

**Query Parameters:**

| Parameter | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `country` | string | ✅       | ISO 3166-1 alpha-2 code (`TW`, `CN`) |
| `date`    | string | ✅       | Date in `YYYY-MM-DD` format          |

**Example Request:**

```bash
curl "https://api.isworkday.io/v1/check?country=CN&date=2026-02-28" \
  -H "X-API-Key: your_api_key_here"
```

**Example Response:**

```json
{
  "date": "2026-02-28",
  "country": "CN",
  "is_working": true,
  "day_type": "makeup",
  "name_en": "Makeup workday for Chinese New Year Holiday",
  "name_local": "春节调休上班"
}
```

---

### 4.2 Endpoint: Check a Date Range

```
GET /range
```

**Query Parameters:**

| Parameter | Type   | Required | Description                               |
| --------- | ------ | -------- | ----------------------------------------- |
| `country` | string | ✅       | ISO 3166-1 alpha-2 code                   |
| `from`    | string | ✅       | Start date `YYYY-MM-DD`                   |
| `to`      | string | ✅       | End date `YYYY-MM-DD` (max 366 days span) |

**Example Request:**

```bash
curl "https://api.isworkday.io/v1/range?country=CN&from=2026-02-01&to=2026-02-28" \
  -H "X-API-Key: your_api_key_here"
```

**Example Response:**

```json
{
  "country": "CN",
  "from": "2026-02-01",
  "to": "2026-02-28",
  "total_days": 28,
  "working_days": 18,
  "non_working_days": 10,
  "days": [
    {
      "date": "2026-02-14",
      "is_working": true,
      "day_type": "makeup",
      "name_en": "Makeup workday for Chinese New Year Holiday",
      "name_local": "春节调休上班"
    },
    {
      "date": "2026-02-17",
      "is_working": false,
      "day_type": "holiday",
      "name_en": "Chinese New Year's Day",
      "name_local": "春节"
    },
    {
      "date": "2026-02-21",
      "is_working": false,
      "day_type": "weekend",
      "name_en": null,
      "name_local": null
    }
    // ... rest of days
  ]
}
```

---

### 4.3 Endpoint: Next Working Day

```
GET /next
```

**Query Parameters:**

| Parameter | Type    | Required | Description                                   |
| --------- | ------- | -------- | --------------------------------------------- |
| `country` | string  | ✅       | ISO 3166-1 alpha-2 code                       |
| `date`    | string  | ✅       | Start date `YYYY-MM-DD`                       |
| `skip`    | integer | ❌       | Number of working days to skip (default: `1`) |

**Example Request:**

```bash
curl "https://api.isworkday.io/v1/next?country=CN&date=2026-02-16&skip=1" \
  -H "X-API-Key: your_api_key_here"
```

**Example Response:**

```json
{
  "from": "2026-02-16",
  "next_working_day": "2026-02-24",
  "working_days_skipped": 1,
  "country": "CN"
}
```

---

## 5. Tech Stack

| Layer                | Technology                                       | Rationale                                                                         |
| -------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Full-stack Framework | Nuxt 4                                           | Unified app — `server/` handles API routes, `app/` handles frontend               |
| API Routes           | Nuxt server routes (`server/routes/`)            | Built-in Node.js handlers, no Express needed                                      |
| Docs                 | `@nuxt/content`                                  | Markdown-driven docs inside the same Nuxt app                                     |
| Database             | PostgreSQL                                       | Structured calendar data, simple queries                                          |
| Hosting              | Railway (Singapore region)                       | Low latency for TW/CN, single Nuxt deployment                                     |
| DNS / CDN            | Cloudflare (free tier)                           | Performance, DDoS protection                                                      |
| Auth                 | Custom API key middleware (`server/middleware/`) | Simple to implement, easy to manage                                               |
| Rate Limiting        | Redis (Railway add-on)                           | Per-key rate limiting                                                             |
| Payments             | Stripe                                           | Subscription billing                                                              |
| Data Pipeline        | n8n (local, manual trigger)                      | Annual calendar refresh from TW/CN government sources — no hosted instance needed |
| Domain               | Cloudflare Registrar                             | At-cost .io pricing, unified DNS management                                       |

---

## 6. Project Structure

A single Nuxt 4 repository — no monorepo needed. Nuxt 4's `server/` directory handles all API logic while `app/` handles all frontend concerns.

```
isworkday/
├── app/                                  # Frontend (Nuxt 4 app directory)
│   ├── pages/
│   │   ├── index.vue                     # Landing page (animated, hero + live demo)
│   │   └── dashboard/
│   │       └── index.vue                 # API key management UI
│   ├── content/
│   │   └── docs/                         # Markdown docs via @nuxt/content
│   │       ├── getting-started.md
│   │       ├── endpoints/
│   │       │   ├── check.md
│   │       │   ├── range.md
│   │       │   └── next.md
│   │       └── countries/
│   │           ├── taiwan.md
│   │           └── china.md
│   └── components/
│       ├── landing/                      # Landing page components
│       └── docs/                         # Docs UI components
├── server/
│   ├── routes/
│   │   └── v1/
│   │       ├── check.get.ts              # GET /v1/check
│   │       ├── range.get.ts              # GET /v1/range
│   │       └── next.get.ts               # GET /v1/next
│   ├── middleware/
│   │   ├── auth.ts                       # API key validation
│   │   └── rateLimit.ts                  # Per-key rate limiting via Redis
│   ├── utils/
│   │   ├── db.ts                         # PostgreSQL connection
│   │   └── redis.ts                      # Redis connection
│   └── api/
│       └── dashboard/
│           ├── keys.post.ts              # Generate API key
│           ├── keys.get.ts               # List user's keys
│           └── keys.[id].delete.ts       # Revoke API key
├── nuxt.config.ts
├── package.json
└── .env.example
```

### Key architectural decisions

- **No Express** — Nuxt 4's server routes are full Node.js handlers, Express is not needed
- **`server/routes/v1/`** instead of `server/api/` — avoids the automatic `/api/` prefix, giving clean public URLs like `https://api.isworkday.io/v1/check`
- **Single deployment** — one Railway service runs the entire app (frontend + API)
- **n8n runs locally** — data pipeline is not part of this repo; n8n workflows run on the developer's machine once a year and write directly to the Railway PostgreSQL instance

---

## 7. Database Schema

Two-table design separating **year-level metadata** from **day-level entries**. This allows the n8n data pipeline to write draft data safely without affecting live API responses until a human manually publishes it.

### 7.1 Calendar Tables

```sql
-- Year-level metadata: one row per country per year
-- Controls publish status so draft data never leaks to the API
CREATE TABLE calendar_years (
  id          SERIAL PRIMARY KEY,
  country     CHAR(2) NOT NULL,
  year        INT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'verified', 'published')),
  source_url  TEXT,
  note        TEXT,
  verified_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(country, year)
);

-- Day-level entries: one row per country per date
-- year_id links back to calendar_years for status filtering
-- name_en / name_local carry full context for all day types including makeup days
-- e.g. name_local "春节调休上班" already implies which holiday is being compensated
-- makeup_for field is intentionally omitted — name fields are sufficient
CREATE TABLE calendar_entries (
  id          SERIAL PRIMARY KEY,
  year_id     INT NOT NULL REFERENCES calendar_years(id),
  country     CHAR(2) NOT NULL,
  date        DATE NOT NULL,
  is_working  BOOLEAN NOT NULL,
  day_type    VARCHAR(10) NOT NULL
              CHECK (day_type IN ('working', 'holiday', 'makeup', 'weekend')),
  name_en     VARCHAR(255),
  name_local  VARCHAR(255),
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(country, date)
);

-- Performance indexes
CREATE INDEX idx_entries_country_date
  ON calendar_entries(country, date);

CREATE INDEX idx_years_country_status
  ON calendar_years(country, status);
```

### 7.2 Status Lifecycle

```
draft → verified → published
```

- **draft** — written by n8n after AI parsing, not visible to API
- **verified** — human has reviewed the data, ready to publish
- **published** — live, returned by all API endpoints

All API queries filter by `y.status = 'published'` via a JOIN:

```sql
SELECT e.*
FROM calendar_entries e
JOIN calendar_years y ON y.id = e.year_id
WHERE e.country = 'CN'
  AND e.date = '2026-02-14'
  AND y.status = 'published'
```

### 7.3 API Keys Table

```sql
CREATE TABLE api_keys (
  id                    SERIAL PRIMARY KEY,
  key_hash              VARCHAR(64) UNIQUE NOT NULL,
  user_email            VARCHAR(255) NOT NULL,
  tier                  VARCHAR(20) NOT NULL DEFAULT 'free'
                        CHECK (tier IN ('free', 'pro', 'business')),
  requests_this_month   INTEGER DEFAULT 0,
  created_at            TIMESTAMP DEFAULT NOW(),
  last_used             TIMESTAMP
);
```

---

## 8. Pricing Tiers

| Tier         | Price     | Requests/month | Countries     | SLA          |
| ------------ | --------- | -------------- | ------------- | ------------ |
| **Free**     | $0        | 500            | TW + CN       | None         |
| **Pro**      | $9/month  | 50,000         | All countries | None         |
| **Business** | $49/month | Unlimited      | All countries | 99.9% uptime |

---

## 9. Build Phases

### Phase 1 — Data Pipeline via n8n (Week 1–2)

- [ ] Set up local n8n instance
- [ ] Build n8n workflow: fetch Taiwan calendar CSV from data.gov.tw → AI node normalizes to schema → human review step → upsert to PostgreSQL
- [ ] Build n8n workflow: fetch China State Council announcement → AI node parses dates and adjustments → human review step → upsert to PostgreSQL
- [ ] Seed 2025 and 2026 data for TW + CN
- [ ] Verify data integrity manually (spot check holidays and make-up days)

### Phase 2 — API Layer (Week 2–3)

- [ ] Scaffold Nuxt 4 project
- [ ] Set up PostgreSQL connection in `server/utils/db.ts`
- [ ] Implement `/v1/check`, `/v1/range`, `/v1/next` server routes
- [ ] API key validation middleware
- [ ] Rate limiting middleware with Redis
- [ ] Error handling (invalid dates, unsupported countries, missing/invalid keys)
- [ ] Unit + integration tests

### Phase 3 — Auth & Billing (Week 3–4)

- [ ] Dashboard API routes (generate, list, revoke keys)
- [ ] Stripe subscription integration
- [ ] Monthly request counter reset (Nuxt server cron or Railway cron job)
- [ ] Usage alerts (email at 80% of monthly limit)

### Phase 4 — Frontend & Launch (Week 4–5)

- [ ] Landing page (`app/pages/index.vue`) — animated hero, live API demo, pricing
- [ ] Docs site via `@nuxt/content` — getting started, endpoint references, country guides
- [ ] Dashboard UI — API key management, usage stats
- [ ] Deploy to Railway (Singapore region)
- [ ] Configure Cloudflare DNS + CDN
- [ ] Post on Hacker News (Show HN), Reddit r/webdev, Taiwan dev communities

---

## 10. Success Metrics (3 months post-launch)

| Metric              | Target  |
| ------------------- | ------- |
| Registered API keys | 100+    |
| Paying customers    | 5+      |
| Monthly API calls   | 10,000+ |
| Uptime              | 99.5%+  |

---

## 11. Risks & Mitigations

| Risk                                        | Mitigation                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Government data format changes year to year | n8n AI node is flexible — prompt it to handle format variations; manually verify output before seeding |
| n8n AI node misparses China announcement    | Always include human review step in n8n workflow before data hits production DB                        |
| Low traffic / no adoption                   | Post in developer communities, offer generous free tier                                                |
| China accessibility issues                  | Host in Singapore/HK, monitor from CN-based tools                                                      |
| ICP license required for CN users           | Host offshore first, pursue ICP only if CN revenue justifies it                                        |
| Annual data not released on time            | Maintain previous year's data as fallback, monitor gov.cn and data.gov.tw in Oct–Nov                   |
