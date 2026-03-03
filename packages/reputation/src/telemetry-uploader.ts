import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { AnonymizedSnapshot } from "@clawguard/core";

const DEFAULT_API_URL = "https://api.clawguard-sec.com";

export class TelemetryUploader {
	private enabled: boolean;
	private pendingPath: string;
	private apiUrl: string;

	constructor(config: { enabled: boolean; pendingPath?: string; apiUrl?: string }) {
		this.enabled = config.enabled;
		this.pendingPath =
			config.pendingPath ?? join(homedir(), ".clawguard", "telemetry-pending.json");
		this.apiUrl = config.apiUrl ?? DEFAULT_API_URL;
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	async submit(snapshot: AnonymizedSnapshot): Promise<boolean> {
		if (!this.enabled) return false;

		// Save locally as backup
		const dir = dirname(this.pendingPath);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
		writeFileSync(this.pendingPath, JSON.stringify(snapshot, null, "\t"), "utf-8");

		// Upload to API
		try {
			const res = await fetch(`${this.apiUrl}/api/telemetry`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(snapshot),
			});
			return res.ok;
		} catch {
			// API unreachable — local file saved, will retry next time
			return true;
		}
	}
}
