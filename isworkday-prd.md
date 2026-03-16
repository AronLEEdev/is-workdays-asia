# isworkday.io — Product Requirements Document

**Version:** 0.1  
**Date:** 2026-03-16  
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

> *"Is this date a working day in [country]?"*

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

- Mobile app or dashboard UI (API-only at launch)
- Real-time government announcement tracking (manual annual refresh is acceptable)
- Coverage beyond TW and CN in v1
- Calendar integrations (Google Calendar, iCal export) — future roadmap

---

## 3. Data Sources

| Country | Source | Refresh Cadence |
|---|---|---|
| Taiwan (TW) | [data.gov.tw](https://data.gov.tw) — 中華民國政府資料開放平台, annual working day calendar | Annually (Oct–Nov each year) |
| China (CN) | State Council official announcements via gov.cn | Annually (Nov–Dec each year) |

**Data model for each date entry:**

```json
{
  "date": "2026-02-27",
  "country": "TW",
  "is_working_day": false,
  "day_type": "holiday",
  "name": "Peace Memorial Day",
  "name_local": "和平紀念日",
  "makeup_workday_for": null
}
```

**Day types:**
- `working` — normal working day
- `holiday` — official public holiday
- `makeup` — make-up workday (working Saturday to compensate for a holiday)
- `weekend` — regular Saturday/Sunday (non-working)

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

| Parameter | Type | Required | Description |
|---|---|---|---|
| `country` | string | ✅ | ISO 3166-1 alpha-2 code (`TW`, `CN`) |
| `date` | string | ✅ | Date in `YYYY-MM-DD` format |

**Example Request:**
```bash
curl "https://api.isworkday.io/v1/check?country=TW&date=2026-02-27" \
  -H "X-API-Key: your_api_key_here"
```

**Example Response:**
```json
{
  "date": "2026-02-27",
  "country": "TW",
  "is_working_day": false,
  "day_type": "holiday",
  "name": "Peace Memorial Day",
  "name_local": "和平紀念日",
  "makeup_workday_for": null
}
```

---

### 4.2 Endpoint: Check a Date Range

```
GET /range
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `country` | string | ✅ | ISO 3166-1 alpha-2 code |
| `from` | string | ✅ | Start date `YYYY-MM-DD` |
| `to` | string | ✅ | End date `YYYY-MM-DD` (max 366 days span) |

**Example Request:**
```bash
curl "https://api.isworkday.io/v1/range?country=TW&from=2026-02-01&to=2026-02-28" \
  -H "X-API-Key: your_api_key_here"
```

**Example Response:**
```json
{
  "country": "TW",
  "from": "2026-02-01",
  "to": "2026-02-28",
  "total_days": 28,
  "working_days": 18,
  "non_working_days": 10,
  "days": [
    {
      "date": "2026-02-01",
      "is_working_day": false,
      "day_type": "weekend"
    },
    {
      "date": "2026-02-02",
      "is_working_day": true,
      "day_type": "working"
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

| Parameter | Type | Required | Description |
|---|---|---|---|
| `country` | string | ✅ | ISO 3166-1 alpha-2 code |
| `date` | string | ✅ | Start date `YYYY-MM-DD` |
| `skip` | integer | ❌ | Number of working days to skip (default: `1`) |

**Example Request:**
```bash
curl "https://api.isworkday.io/v1/next?country=TW&date=2026-02-27&skip=1" \
  -H "X-API-Key: your_api_key_here"
```

**Example Response:**
```json
{
  "from": "2026-02-27",
  "next_working_day": "2026-03-02",
  "working_days_skipped": 1,
  "country": "TW"
}
```

---

## 5. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| API Backend | Node.js + Express | Developer's primary stack |
| Frontend / Docs | Nuxt 3 | SSR docs site + same repo deployment |
| Database | PostgreSQL | Structured calendar data, simple queries |
| Hosting | Railway (Singapore region) | Low latency for TW/CN, simple deployment |
| DNS / CDN | Cloudflare (free tier) | Performance, DDoS protection |
| Auth | Custom API key middleware | Simple to implement, easy to manage |
| Rate Limiting | Redis (Railway add-on) | Per-key rate limiting |
| Payments | Stripe | Subscription billing |
| Domain | Cloudflare Registrar | At-cost .io pricing, unified DNS management |

---

## 6. Monorepo Structure

```
isworkday/
├── apps/
│   ├── api/                  # Node.js + Express backend
│   │   ├── src/
│   │   │   ├── routes/       # /check, /range, /next
│   │   │   ├── middleware/   # auth, rate limiting, error handling
│   │   │   ├── services/     # business logic
│   │   │   └── db/           # PostgreSQL queries
│   │   └── package.json
│   └── web/                  # Nuxt 3 docs + landing site
│       ├── pages/
│       │   ├── index.vue     # Landing page
│       │   ├── docs/         # API documentation
│       │   └── dashboard/    # API key management
│       └── package.json
├── data/
│   ├── scripts/              # Data ingestion scripts
│   │   ├── fetch-tw.js       # Fetch Taiwan gov data
│   │   └── fetch-cn.js       # Fetch China gov data
│   └── seeds/                # Raw calendar data files
├── docker-compose.yml
└── README.md
```

---

## 7. Database Schema

```sql
-- Calendar entries
CREATE TABLE calendar_entries (
  id          SERIAL PRIMARY KEY,
  country     CHAR(2) NOT NULL,
  date        DATE NOT NULL,
  is_working  BOOLEAN NOT NULL,
  day_type    VARCHAR(10) NOT NULL CHECK (day_type IN ('working', 'holiday', 'makeup', 'weekend')),
  name_en     VARCHAR(255),
  name_local  VARCHAR(255),
  makeup_for  DATE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(country, date)
);

-- API keys
CREATE TABLE api_keys (
  id          SERIAL PRIMARY KEY,
  key_hash    VARCHAR(64) UNIQUE NOT NULL,
  user_email  VARCHAR(255) NOT NULL,
  tier        VARCHAR(20) NOT NULL DEFAULT 'free',
  requests_this_month INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  last_used   TIMESTAMP
);
```

---

## 8. Pricing Tiers

| Tier | Price | Requests/month | Countries | SLA |
|---|---|---|---|---|
| **Free** | $0 | 500 | TW + CN | None |
| **Pro** | $9/month | 50,000 | All countries | None |
| **Business** | $49/month | Unlimited | All countries | 99.9% uptime |

---

## 9. Build Phases

### Phase 1 — Data Pipeline (Week 1–2)
- [ ] Write scraper/parser for Taiwan government calendar (data.gov.tw)
- [ ] Write scraper/parser for China State Council announcements
- [ ] Build database seeding scripts
- [ ] Seed 2025 and 2026 data for TW + CN
- [ ] Write tests to validate data integrity

### Phase 2 — API Layer (Week 2–3)
- [ ] Set up Express app scaffolding
- [ ] Implement `/check`, `/range`, `/next` endpoints
- [ ] API key generation and validation middleware
- [ ] Rate limiting with Redis
- [ ] Error handling (invalid dates, unsupported countries, missing keys)
- [ ] Unit + integration tests

### Phase 3 — Auth & Billing (Week 3–4)
- [ ] API key management (generate, revoke, view usage)
- [ ] Stripe subscription integration
- [ ] Monthly request counter reset (cron job)
- [ ] Usage alerts (email at 80% of limit)

### Phase 4 — Docs Site & Launch (Week 4–5)
- [ ] Nuxt 3 landing page explaining the problem + solution
- [ ] Interactive API docs with copy-paste examples (curl, JS, Python)
- [ ] User dashboard (manage keys, view usage)
- [ ] Deploy to Railway (Singapore)
- [ ] Configure Cloudflare DNS + CDN
- [ ] Post on Hacker News (Show HN), Reddit r/webdev, Taiwan dev communities

---

## 10. Success Metrics (3 months post-launch)

| Metric | Target |
|---|---|
| Registered API keys | 100+ |
| Paying customers | 5+ |
| Monthly API calls | 10,000+ |
| Uptime | 99.5%+ |

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Government data format changes | Build flexible parsers with alerting when format breaks |
| Low traffic / no adoption | Post in developer communities, offer generous free tier |
| China accessibility issues | Host in Singapore/HK, monitor from CN-based tools |
| ICP license required for CN users | Host offshore first, pursue ICP only if CN revenue justifies it |
| Annual data not released on time | Maintain previous year's data as fallback |
