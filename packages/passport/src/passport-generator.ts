import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AuditReader } from "@clawguard/audit";
import type { SecurityPassport } from "@clawguard/core";

const PASSPORT_PATH_DEFAULT = join(
	process.env.HOME ?? process.env.USERPROFILE ?? ".",
	".clawguard",
	"passport.json",
);

export class PassportGenerator {
	private reader: AuditReader;
	private passportPath: string;

	constructor(reader: AuditReader, passportPath?: string) {
		this.reader = reader;
		this.passportPath = passportPath ?? PASSPORT_PATH_DEFAULT;
	}

	generate(options: {
		repository: string;
		feedVersion?: string;
	}): SecurityPassport {
		const dates = this.reader.listDates();

		let totalDecisions = 0;
		let allowed = 0;
		let confirmed = 0;
		let denied = 0;
		let incidents = 0;
		const agents = new Set<string>();

		for (const date of dates) {
			const events = this.reader.readDate(date);
			for (const event of events) {
				totalDecisions++;
				agents.add(event.actor.app_name);

				const action = event.enrichments.find((e) => e.name === "action")?.value ?? "allow";
				if (action === "allow" || action === "log") allowed++;
				else if (action === "confirm") confirmed++;
				else if (action === "deny") {
					denied++;
					// incident = deny + high severity (severity_id === 4)
					if (event.severity_id === 4) incidents++;
				}
			}
		}

		return {
			version: "1.0",
			repository: options.repository,
			monitoring_since: dates[0] ?? new Date().toISOString().split("T")[0],
			last_updated: new Date().toISOString(),
			summary: {
				total_decisions: totalDecisions,
				allowed,
				confirmed,
				denied,
				incidents,
			},
			agents_monitored: Array.from(agents).sort(),
			feed_version: options.feedVersion ?? "unknown",
		};
	}

	save(passport: SecurityPassport): void {
		const dir = dirname(this.passportPath);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
		writeFileSync(this.passportPath, JSON.stringify(passport, null, 2));

		// Try cosign signing if available
		// Note: execSync used here with static paths only (no user input)
		try {
			execSync("which cosign", { stdio: "ignore" });
			execSync(
				`cosign sign-blob --yes --output-signature ${this.passportPath}.sig ${this.passportPath}`,
				{ stdio: "ignore" },
			);
			passport.signature = `${this.passportPath}.sig`;
			writeFileSync(this.passportPath, JSON.stringify(passport, null, 2));
		} catch {
			// cosign not available, skip signing
		}
	}

	load(): SecurityPassport | null {
		if (!existsSync(this.passportPath)) return null;
		return JSON.parse(readFileSync(this.passportPath, "utf-8")) as SecurityPassport;
	}
}
