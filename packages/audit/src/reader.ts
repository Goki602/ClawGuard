import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getLogDir } from "@clawguard/core";
import type { OcsfEvent } from "./ocsf-logger.js";

export class AuditReader {
	private logDir: string;

	constructor(logDir?: string) {
		this.logDir = logDir ?? getLogDir();
	}

	readDate(dateStr: string): OcsfEvent[] {
		const filePath = join(this.logDir, `${dateStr}.jsonl`);
		if (!existsSync(filePath)) return [];

		const lines = readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
		const events: OcsfEvent[] = [];
		for (const line of lines) {
			try {
				events.push(JSON.parse(line) as OcsfEvent);
			} catch {
				// Skip malformed lines (e.g., truncated writes)
			}
		}
		return events;
	}

	readToday(): OcsfEvent[] {
		const d = new Date();
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return this.readDate(`${y}-${m}-${day}`);
	}

	listDates(): string[] {
		if (!existsSync(this.logDir)) return [];
		return readdirSync(this.logDir)
			.filter((f) => f.endsWith(".jsonl"))
			.map((f) => f.replace(".jsonl", ""))
			.sort();
	}
}
