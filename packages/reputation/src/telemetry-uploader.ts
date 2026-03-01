import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { AnonymizedSnapshot } from "@clawguard/core";

export class TelemetryUploader {
	private enabled: boolean;
	private pendingPath: string;

	constructor(config: { enabled: boolean; pendingPath?: string }) {
		this.enabled = config.enabled;
		this.pendingPath =
			config.pendingPath ?? join(homedir(), ".clawguard", "telemetry-pending.json");
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	async submit(snapshot: AnonymizedSnapshot): Promise<boolean> {
		if (!this.enabled) return false;

		// v0: Write to local file for future batch upload
		const dir = dirname(this.pendingPath);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
		writeFileSync(this.pendingPath, JSON.stringify(snapshot, null, "\t"), "utf-8");
		return true;
	}
}
