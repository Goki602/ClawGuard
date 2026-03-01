import type { TeamDecisionStats, TeamPolicy } from "@clawguard/core";
import type { AuditEvent } from "./team-audit-store.js";
import type { SnapshotEntry } from "./team-memory-store.js";
import type { TeamConfig } from "./types.js";

export class PolicyClient {
	private config: TeamConfig;

	constructor(config: TeamConfig) {
		this.config = config;
	}

	async fetchPolicy(): Promise<TeamPolicy | null> {
		try {
			const res = await fetch(`${this.config.server_url}/api/policy`, {
				headers: { Authorization: `Bearer ${this.config.api_key}` },
			});
			if (!res.ok) return null;
			return (await res.json()) as TeamPolicy;
		} catch {
			return null;
		}
	}

	async submitAudit(events: AuditEvent[]): Promise<void> {
		try {
			await fetch(`${this.config.server_url}/api/audit`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.config.api_key}`,
				},
				body: JSON.stringify({ events }),
			});
		} catch {
			// swallow errors silently
		}
	}

	async submitSnapshot(stats: SnapshotEntry[]): Promise<void> {
		try {
			await fetch(`${this.config.server_url}/api/memory/snapshot`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.config.api_key}`,
				},
				body: JSON.stringify({ stats }),
			});
		} catch {
			// swallow errors silently
		}
	}

	async getMemoryStats(): Promise<TeamDecisionStats[]> {
		try {
			const res = await fetch(`${this.config.server_url}/api/memory/stats`, {
				headers: { Authorization: `Bearer ${this.config.api_key}` },
			});
			if (!res.ok) return [];
			return (await res.json()) as TeamDecisionStats[];
		} catch {
			return [];
		}
	}
}
