import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { MemberRole, TeamMember } from "@clawguard/core";
import Database from "better-sqlite3";

const DDL = [
	"CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, role TEXT NOT NULL, api_key_hash TEXT NOT NULL, added_at TEXT NOT NULL, last_seen TEXT)",
];

function generateApiKey(): string {
	return `cg_team_${randomBytes(16).toString("hex")}`;
}

function hashApiKey(key: string): string {
	return createHash("sha256").update(key).digest("hex");
}

function generateId(): string {
	return randomBytes(12).toString("hex");
}

function initDb(db: Database.Database): void {
	for (const stmt of DDL) db.prepare(stmt).run();
}

export class MemberStore {
	private db: Database.Database;

	constructor(dbPath?: string) {
		const path = dbPath ?? join(homedir(), ".clawguard", "team.db");
		const dir = dirname(path);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		this.db = new Database(path);
		this.db.pragma("journal_mode = WAL");
		initDb(this.db);
	}

	addMember(email: string, role: MemberRole): { member: TeamMember; api_key: string } {
		const id = generateId();
		const api_key = generateApiKey();
		const api_key_hash = hashApiKey(api_key);
		const added_at = new Date().toISOString();

		this.db
			.prepare(
				"INSERT INTO members (id, email, role, api_key_hash, added_at) VALUES (?, ?, ?, ?, ?)",
			)
			.run(id, email, role, api_key_hash, added_at);

		return {
			member: { id, email, role, api_key: "", added_at },
			api_key,
		};
	}

	removeMember(id: string): boolean {
		const result = this.db.prepare("DELETE FROM members WHERE id = ?").run(id);
		return result.changes > 0;
	}

	getMember(id: string): TeamMember | null {
		const row = this.db
			.prepare("SELECT id, email, role, added_at, last_seen FROM members WHERE id = ?")
			.get(id) as
			| { id: string; email: string; role: MemberRole; added_at: string; last_seen: string | null }
			| undefined;
		if (!row) return null;
		return {
			id: row.id,
			email: row.email,
			role: row.role,
			api_key: "",
			added_at: row.added_at,
			last_seen: row.last_seen ?? undefined,
		};
	}

	listMembers(): TeamMember[] {
		const rows = this.db
			.prepare("SELECT id, email, role, added_at, last_seen FROM members ORDER BY added_at")
			.all() as Array<{
			id: string;
			email: string;
			role: MemberRole;
			added_at: string;
			last_seen: string | null;
		}>;
		return rows.map((row) => ({
			id: row.id,
			email: row.email,
			role: row.role,
			api_key: "",
			added_at: row.added_at,
			last_seen: row.last_seen ?? undefined,
		}));
	}

	authenticate(api_key: string): TeamMember | null {
		const hash = hashApiKey(api_key);
		const row = this.db
			.prepare("SELECT id, email, role, added_at, last_seen FROM members WHERE api_key_hash = ?")
			.get(hash) as
			| { id: string; email: string; role: MemberRole; added_at: string; last_seen: string | null }
			| undefined;
		if (!row) return null;
		return {
			id: row.id,
			email: row.email,
			role: row.role,
			api_key: "",
			added_at: row.added_at,
			last_seen: row.last_seen ?? undefined,
		};
	}

	updateLastSeen(id: string): void {
		this.db
			.prepare("UPDATE members SET last_seen = ? WHERE id = ?")
			.run(new Date().toISOString(), id);
	}

	close(): void {
		this.db.close();
	}
}
