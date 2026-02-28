import { appendFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { getLogDir } from "@clawguard/core";
import type { OcsfEvent } from "./ocsf-logger.js";

function todayFileName(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}.jsonl`;
}

export class AuditWriter {
	private logDir: string;

	constructor(logDir?: string) {
		this.logDir = logDir ?? getLogDir();
		if (!existsSync(this.logDir)) {
			mkdirSync(this.logDir, { recursive: true });
		}
	}

	write(event: OcsfEvent): void {
		const filePath = join(this.logDir, todayFileName());
		appendFileSync(filePath, `${JSON.stringify(event)}\n`, "utf-8");
	}

	getLogPath(): string {
		return this.logDir;
	}

	pruneOlderThan(days: number): number {
		const cutoff = Date.now() - days * 86_400_000;
		let removed = 0;

		for (const file of readdirSync(this.logDir)) {
			if (!file.endsWith(".jsonl")) continue;
			const dateStr = file.replace(".jsonl", "");
			const fileDate = new Date(dateStr).getTime();
			if (Number.isNaN(fileDate)) continue;
			if (fileDate < cutoff) {
				unlinkSync(join(this.logDir, file));
				removed++;
			}
		}
		return removed;
	}
}
