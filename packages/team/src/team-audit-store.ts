import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

export interface AuditEvent {
	member_id: string;
	rule_id: string;
	action: string;
	timestamp: string;
	content_hash: string;
}

export interface AuditSummary {
	total: number;
	by_rule: Record<string, number>;
	by_member: Record<string, number>;
	by_action: Record<string, number>;
}

const DDL = [
	"CREATE TABLE IF NOT EXISTS team_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, rule_id TEXT NOT NULL, action TEXT NOT NULL, timestamp TEXT NOT NULL, content_hash TEXT NOT NULL)",
	"CREATE INDEX IF NOT EXISTS idx_team_audit_member ON team_audit(member_id)",
	"CREATE INDEX IF NOT EXISTS idx_team_audit_rule ON team_audit(rule_id)",
	"CREATE INDEX IF NOT EXISTS idx_team_audit_timestamp ON team_audit(timestamp)",
];

function initDb(db: Database.Database): void {
	for (const stmt of DDL) db.prepare(stmt).run();
}

export class TeamAuditStore {
	private db: Database.Database;

	constructor(dbPath?: string) {
		const path = dbPath ?? join(homedir(), ".clawguard", "team-audit.db");
		const dir = dirname(path);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		this.db = new Database(path);
		this.db.pragma("journal_mode = WAL");
		initDb(this.db);
	}

	submitBatch(events: AuditEvent[]): void {
		const stmt = this.db.prepare(
			"INSERT INTO team_audit (member_id, rule_id, action, timestamp, content_hash) VALUES (?, ?, ?, ?, ?)",
		);
		const tx = this.db.transaction((evts: AuditEvent[]) => {
			for (const evt of evts) {
				stmt.run(evt.member_id, evt.rule_id, evt.action, evt.timestamp, evt.content_hash);
			}
		});
		tx(events);
	}

	getSummary(since?: string): AuditSummary {
		const whereClause = since ? "WHERE timestamp >= ?" : "";
		const params = since ? [since] : [];

		const totalRow = this.db
			.prepare(`SELECT COUNT(*) as cnt FROM team_audit ${whereClause}`)
			.get(...params) as { cnt: number };

		const ruleRows = this.db
			.prepare(`SELECT rule_id, COUNT(*) as cnt FROM team_audit ${whereClause} GROUP BY rule_id`)
			.all(...params) as Array<{ rule_id: string; cnt: number }>;

		const memberRows = this.db
			.prepare(
				`SELECT member_id, COUNT(*) as cnt FROM team_audit ${whereClause} GROUP BY member_id`,
			)
			.all(...params) as Array<{ member_id: string; cnt: number }>;

		const actionRows = this.db
			.prepare(`SELECT action, COUNT(*) as cnt FROM team_audit ${whereClause} GROUP BY action`)
			.all(...params) as Array<{ action: string; cnt: number }>;

		const by_rule: Record<string, number> = {};
		for (const r of ruleRows) by_rule[r.rule_id] = r.cnt;

		const by_member: Record<string, number> = {};
		for (const r of memberRows) by_member[r.member_id] = r.cnt;

		const by_action: Record<string, number> = {};
		for (const r of actionRows) by_action[r.action] = r.cnt;

		return { total: totalRow.cnt, by_rule, by_member, by_action };
	}

	close(): void {
		this.db.close();
	}
}
