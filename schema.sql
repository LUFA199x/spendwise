-- ============================================================
-- BetterAuth required tables
-- ============================================================
CREATE TABLE IF NOT EXISTS "user" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT NOT NULL,
  "email"         TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image"         TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id"          TEXT PRIMARY KEY,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "token"       TEXT NOT NULL UNIQUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "userId"      TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "id"                      TEXT PRIMARY KEY,
  "accountId"               TEXT NOT NULL,
  "providerId"              TEXT NOT NULL,
  "userId"                  TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken"             TEXT,
  "refreshToken"            TEXT,
  "idToken"                 TEXT,
  "accessTokenExpiresAt"    TIMESTAMPTZ,
  "refreshTokenExpiresAt"   TIMESTAMPTZ,
  "scope"                   TEXT,
  "password"                TEXT,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id"          TEXT PRIMARY KEY,
  "identifier"  TEXT NOT NULL,
  "value"       TEXT NOT NULL,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "createdAt"   TIMESTAMPTZ,
  "updatedAt"   TIMESTAMPTZ
);

-- ============================================================
-- SpendWise app tables
-- ============================================================
CREATE TABLE IF NOT EXISTS "transactions" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "amount"      BIGINT NOT NULL,
  "category"    TEXT NOT NULL,
  "date"        TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "month"       INTEGER NOT NULL,
  "year"        INTEGER NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "earnings" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "amount"    BIGINT NOT NULL,
  "date"      TEXT NOT NULL,
  "note"      TEXT NOT NULL DEFAULT '',
  "month"     INTEGER NOT NULL,
  "year"      INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "budgets" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "category"  TEXT NOT NULL,
  "limit"     BIGINT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "category")
);

CREATE TABLE IF NOT EXISTS "goals" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name"      TEXT NOT NULL,
  "target"    BIGINT NOT NULL,
  "current"   BIGINT NOT NULL DEFAULT 0,
  "deadline"  TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user ON "transactions"("userId");
CREATE INDEX IF NOT EXISTS idx_earnings_user     ON "earnings"("userId");
CREATE INDEX IF NOT EXISTS idx_budgets_user      ON "budgets"("userId");
CREATE INDEX IF NOT EXISTS idx_goals_user        ON "goals"("userId");
CREATE INDEX IF NOT EXISTS idx_session_user      ON "session"("userId");
CREATE INDEX IF NOT EXISTS idx_session_token     ON "session"("token");
