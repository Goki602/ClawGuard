-- ClawGuard API D1 Schema

-- Telemetry: anonymized decision snapshots from opt-in users
CREATE TABLE IF NOT EXISTS telemetry_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  snapshot_json TEXT NOT NULL
);

-- Reputation: aggregated community decision stats per rule
CREATE TABLE IF NOT EXISTS reputation_stats (
  rule_id TEXT PRIMARY KEY,
  community_total INTEGER NOT NULL DEFAULT 0,
  community_allowed INTEGER NOT NULL DEFAULT 0,
  community_denied INTEGER NOT NULL DEFAULT 0,
  override_rate REAL NOT NULL DEFAULT 0.0,
  last_updated TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Passports: published security passports
CREATE TABLE IF NOT EXISTS passports (
  project_id TEXT PRIMARY KEY,
  repository TEXT,
  passport_json TEXT NOT NULL,
  license_key TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Marketplace: rule packs
CREATE TABLE IF NOT EXISTS marketplace_packs (
  name TEXT PRIMARY KEY,
  description TEXT,
  author TEXT,
  version TEXT NOT NULL,
  rules_count INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  pack_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL DEFAULT (datetime('now'))
);
