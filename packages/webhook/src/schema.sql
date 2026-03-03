CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_event_id TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT NOT NULL,
  email TEXT NOT NULL,
  license_key TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL CHECK(plan IN ('pro', 'max')),
  amount_cents INTEGER NOT NULL,
  email_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
