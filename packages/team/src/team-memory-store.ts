import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { TeamDecisionStats } from "@clawguard/core";
import Database from "better-sqlite3";

const DDL = [
	"CREATE TABLE IF NOT EXISTS team_memory (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, rule_id TEXT NOT NULL, total INTEGER NOT NULL, allowed INTEGER NOT NULL, denied INTEGER NOT NULL, override_rate REAL NOT NULL, updated_at TEXT NOT NULL)",
	"CREATE INDEX IF NOT EXISTS idx_team_memory_member ON team_memory(member_id)",
	"CREATE INDEX IF NOT EXISTS idx_team_memory_rule ON team_memory(rule_id)",
];

function initDb(db: Database.Database): void {
	for (const stmt of DDL) db.prepare(stmt).run();
}

export interface SnapshotEntry {
	rule_id: string;
	total: number;
	allowed: number;
	denied: number;
}

export class TeamMemoryStore {
	private db: Database.Database;

	constructor(dbPath?: string) {
		const path = dbPath ?? join(homedir(), ".clawguard", "team-memory.db");
		const dir = dirname(path);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		this.db = new Database(path);
		this.db.pragma("journal_mode = WAL");
		initDb(this.db);
	}

	submitSnapshot(member_id: string, stats: SnapshotEntry[]): void {
		const insert = this.db.prepare(
			"INSERT INTO team_memory (member_id, rule_id, total, allowed, denied, override_rate, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		);
		const deleteOld = this.db.prepare(
			"DELETE FROM team_memory WHERE member_id = ? AND rule_id = ?",
		);

		const tx = this.db.transaction((mid: string, entries: SnapshotEntry[]) => {
			const now = new Date().toISOString();
			for (const entry of entries) {
				deleteOld.run(mid, entry.rule_id);
				const override_rate = entry.total > 0 ? entry.allowed / entry.total : 0;
				insert.run(
					mid,
					entry.rule_id,
					entry.total,
					entry.allowed,
					entry.denied,
					override_rate,
					now,
				);
			}
		});
		tx(member_id, stats);
	}

	getTeamStats(): TeamDecisionStats[] {
		const rows = this.db
			.prepare(
				`SELECT
				rule_id,
				SUM(total) as team_total,
				SUM(allowed) as team_allowed,
				SUM(denied) as team_denied,
				COUNT(DISTINCT member_id) as member_count,
				MAX(updated_at) as updated_at
			FROM team_memory
			GROUP BY rule_id
			ORDER BY team_total DESC`,
			)
			.all() as Array<{
			rule_id: string;
			team_total: number;
			team_allowed: number;
			team_denied: number;
			member_count: number;
			updated_at: string;
		}>;

		return rows.map((row) => ({
			rule_id: row.rule_id,
			team_total: row.team_total,
			team_allowed: row.team_allowed,
			team_denied: row.team_denied,
			member_count: row.member_count,
			team_override_rate: row.team_total > 0 ? row.team_allowed / row.team_total : 0,
			updated_at: row.updated_at,
		}));
	}

	close(): void {
		this.db.close();
	}
}
