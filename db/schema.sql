-- isworkday.io database schema
-- Run this against a fresh PostgreSQL database to set up all tables.

-- ---------------------------------------------------------------------------
-- calendar_years
-- One row per country per year. Controls publish status so draft data never
-- leaks to the API. All API queries must JOIN this table and filter by
-- status = 'published'.
-- ---------------------------------------------------------------------------
CREATE TABLE calendar_years (
  id          SERIAL PRIMARY KEY,
  country     CHAR(2)      NOT NULL,
  year        INT          NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'verified', 'published')),
  source_url  TEXT,
  note        TEXT,
  verified_at TIMESTAMP,
  created_at  TIMESTAMP    DEFAULT NOW(),
  UNIQUE (country, year)
);

-- ---------------------------------------------------------------------------
-- calendar_entries
-- One row per country per special date (holiday, makeup, or named weekend).
-- Normal working days are NOT stored — the API infers them.
--
-- day_type values:
--   holiday  — official public holiday; always has name_en + name_local
--   makeup   — make-up workday (e.g. 春节调休上班); name fields carry full context
--   weekend  — only stored when it falls within a holiday period
--   working  — NOT stored; inferred by API for any unmatched Mon–Fri date
-- ---------------------------------------------------------------------------
CREATE TABLE calendar_entries (
  id          SERIAL PRIMARY KEY,
  year_id     INT          NOT NULL REFERENCES calendar_years (id),
  country     CHAR(2)      NOT NULL,
  date        DATE         NOT NULL,
  is_working  BOOLEAN      NOT NULL,
  day_type    VARCHAR(10)  NOT NULL
              CHECK (day_type IN ('working', 'holiday', 'makeup', 'weekend')),
  name_en     VARCHAR(255),
  name_local  VARCHAR(255),
  created_at  TIMESTAMP    DEFAULT NOW(),
  UNIQUE (country, date)
);

CREATE INDEX idx_entries_country_date  ON calendar_entries (country, date);
CREATE INDEX idx_years_country_status  ON calendar_years   (country, status);

-- ---------------------------------------------------------------------------
-- api_keys
-- Stores hashed API keys. The raw key is never stored — only a SHA-256 hash.
-- Auth middleware looks up key_hash to validate incoming X-API-Key headers.
-- ---------------------------------------------------------------------------
CREATE TABLE api_keys (
  id                  SERIAL PRIMARY KEY,
  key_hash            VARCHAR(64)  UNIQUE NOT NULL,
  user_email          VARCHAR(255) NOT NULL,
  tier                VARCHAR(20)  NOT NULL DEFAULT 'free'
                      CHECK (tier IN ('free', 'pro', 'business')),
  requests_this_month INTEGER      DEFAULT 0,
  created_at          TIMESTAMP    DEFAULT NOW(),
  last_used           TIMESTAMP
);

CREATE INDEX idx_api_keys_hash ON api_keys (key_hash);
