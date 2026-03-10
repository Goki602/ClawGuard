import { createHash } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { RuleStatsWindowed } from "@clawguard/core";
import Database from "better-sqlite3";
import type { DecisionRecord, RuleStats } from "./types.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS decisions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	rule_id TEXT NOT NULL,
	action TEXT NOT NULL,
	content_hash TEXT NOT NULL,
	user_response TEXT,
	agent TEXT,
	session_id TEXT,
	timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_decisions_rule ON decisions(rule_id);
CREATE INDEX IF NOT EXISTS idx_decisions_hash ON decisions(content_hash);

CREATE TABLE IF NOT EXISTS session_allowlist (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	session_id TEXT NOT NULL,
	content_hash TEXT NOT NULL,
	rule_id TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE(session_id, content_hash, rule_id)
);
CREATE INDEX IF NOT EXISTS idx_sa_session ON session_allowlist(session_id);
`;

export class DecisionStore {
	private db: Database.Database;

	constructor(dbPath?: string) {
		const path = dbPath ?? join(homedir(), ".clawguard", "memory.db");
		const dir = dirname(path);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		this.db = new Database(path);
		this.db.pragma("journal_mode = WAL");
		this.db.exec(SCHEMA);
	}

	record(entry: DecisionRecord): void {
		const stmt = this.db.prepare(
			"INSERT INTO decisions (rule_id, action, content_hash, user_response, agent, session_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
		);
		stmt.run(
			entry.rule_id,
			entry.action,
			entry.content_hash,
			entry.user_response ?? null,
			entry.agent ?? null,
			entry.session_id ?? null,
			entry.timestamp ?? new Date().toISOString(),
		);
	}

	getStats(ruleId: string): RuleStats {
		const row = this.db
			.prepare(
				`SELECT
				COUNT(*) as total,
				SUM(CASE WHEN action = 'allow' OR action = 'log' THEN 1 ELSE 0 END) as allowed,
				SUM(CASE WHEN action = 'deny' THEN 1 ELSE 0 END) as denied,
				SUM(CASE WHEN action = 'confirm' THEN 1 ELSE 0 END) as confirmed
			FROM decisions WHERE rule_id = ?`,
			)
			.get(ruleId) as {
			total: number;
			allowed: number;
			denied: number;
			confirmed: number;
		};

		return {
			total: row.total,
			allowed: row.allowed,
			denied: row.denied,
			confirmed: row.confirmed,
			override_rate: row.total > 0 ? row.allowed / row.total : 0,
		};
	}

	getStatsWindowed(ruleId: string, days: number): RuleStatsWindowed {
		const row = this.db
			.prepare(
				`SELECT
				COUNT(*) as total,
				SUM(CASE WHEN action = 'allow' OR action = 'log' THEN 1 ELSE 0 END) as allowed,
				SUM(CASE WHEN action = 'deny' THEN 1 ELSE 0 END) as denied,
				SUM(CASE WHEN action = 'confirm' THEN 1 ELSE 0 END) as confirmed
			FROM decisions WHERE rule_id = ? AND timestamp >= datetime('now', ?)`,
			)
			.get(ruleId, `-${days} days`) as {
			total: number;
			allowed: number;
			denied: number;
			confirmed: number;
		};

		const period: RuleStatsWindowed["period"] = days <= 7 ? "7d" : days <= 30 ? "30d" : "all";

		return {
			rule_id: ruleId,
			period,
			total: row.total,
			allowed: row.allowed,
			denied: row.denied,
			confirmed: row.confirmed,
			override_rate: row.total > 0 ? row.allowed / row.total : 0,
		};
	}

	getAllRuleIds(): string[] {
		const rows = this.db.prepare("SELECT DISTINCT rule_id FROM decisions").all() as Array<{
			rule_id: string;
		}>;
		return rows.map((r) => r.rule_id);
	}

	getRecentByHash(contentHash: string, limit = 10): DecisionRecord[] {
		return this.db
			.prepare(
				"SELECT rule_id, action, content_hash, user_response, agent, session_id, timestamp FROM decisions WHERE content_hash = ? ORDER BY id DESC LIMIT ?",
			)
			.all(contentHash, limit) as DecisionRecord[];
	}

	getOverrideRate(ruleId: string): number {
		return this.getStats(ruleId).override_rate;
	}

	isHistoricallyAllowed(contentHash: string, ruleId: string, minCount = 2): boolean {
		const row = this.db
			.prepare("SELECT COUNT(*) as count FROM decisions WHERE content_hash = ? AND rule_id = ? AND action = 'confirm'")
			.get(contentHash, ruleId) as { count: number };
		return row.count >= minCount;
	}

	isSessionAllowed(sessionId: string, contentHash: string, ruleId: string): boolean {
		const row = this.db
			.prepare("SELECT 1 FROM session_allowlist WHERE session_id = ? AND content_hash = ? AND rule_id = ?")
			.get(sessionId, contentHash, ruleId);
		return row != null;
	}

	recordSessionAllow(sessionId: string, contentHash: string, ruleId: string): void {
		this.db
			.prepare("INSERT OR IGNORE INTO session_allowlist (session_id, content_hash, rule_id) VALUES (?, ?, ?)")
			.run(sessionId, contentHash, ruleId);
	}

	cleanExpiredSessions(maxAgeHours = 24): void {
		this.db
			.prepare("DELETE FROM session_allowlist WHERE created_at < datetime('now', ?)")
			.run(`-${maxAgeHours} hours`);
	}

	getAutoAllowCount(sessionId?: string): number {
		if (sessionId) {
			const row = this.db
				.prepare("SELECT COUNT(*) as count FROM session_allowlist WHERE session_id = ?")
				.get(sessionId) as { count: number };
			return row.count;
		}
		const row = this.db
			.prepare("SELECT COUNT(*) as count FROM session_allowlist")
			.get() as { count: number };
		return row.count;
	}

	getStatsSummary(): { total: number; allowed: number; denied: number; confirmed: number; autoAllowed: number; agents: number } {
		const decisions = this.db
			.prepare(
				`SELECT
				COUNT(*) as total,
				SUM(CASE WHEN action = 'allow' OR action = 'log' THEN 1 ELSE 0 END) as allowed,
				SUM(CASE WHEN action = 'deny' THEN 1 ELSE 0 END) as denied,
				SUM(CASE WHEN action = 'confirm' THEN 1 ELSE 0 END) as confirmed
			FROM decisions`,
			)
			.get() as { total: number; allowed: number; denied: number; confirmed: number };
		const autoAllowed = this.getAutoAllowCount();
		const agents = this.db
			.prepare("SELECT COUNT(DISTINCT agent) as count FROM decisions WHERE agent IS NOT NULL")
			.get() as { count: number };
		return { ...decisions, autoAllowed, agents: agents.count };
	}

	getTodayStats(): { total: number; allowed: number; denied: number; confirmed: number; autoAllowed: number } {
		const decisions = this.db
			.prepare(
				`SELECT
				COUNT(*) as total,
				SUM(CASE WHEN action = 'allow' OR action = 'log' THEN 1 ELSE 0 END) as allowed,
				SUM(CASE WHEN action = 'deny' THEN 1 ELSE 0 END) as denied,
				SUM(CASE WHEN action = 'confirm' THEN 1 ELSE 0 END) as confirmed
			FROM decisions WHERE timestamp >= date('now')`,
			)
			.get() as { total: number; allowed: number; denied: number; confirmed: number };
		const autoRow = this.db
			.prepare("SELECT COUNT(*) as count FROM session_allowlist WHERE created_at >= date('now')")
			.get() as { count: number };
		return { ...decisions, autoAllowed: autoRow.count };
	}

	close(): void {
		this.db.close();
	}

	static hashContent(content: string): string {
		return createHash("sha256").update(content).digest("hex").slice(0, 16);
	}
}
