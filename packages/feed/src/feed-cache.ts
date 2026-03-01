import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { FeedBundle, FeedManifest, ReputationData, Rule } from "@clawguard/core";

export class FeedCache {
	private cacheDir: string;

	constructor(cacheDir?: string) {
		this.cacheDir = cacheDir ?? join(homedir(), ".clawguard", "feed");
	}

	write(bundle: FeedBundle): void {
		if (!existsSync(this.cacheDir)) {
			mkdirSync(this.cacheDir, { recursive: true });
		}
		writeFileSync(join(this.cacheDir, "manifest.json"), JSON.stringify(bundle.manifest), "utf-8");
		writeFileSync(join(this.cacheDir, "rules.json"), JSON.stringify(bundle.rules), "utf-8");
		writeFileSync(
			join(this.cacheDir, "reputation.json"),
			JSON.stringify(bundle.reputation),
			"utf-8",
		);
	}

	read(): FeedBundle | null {
		try {
			const manifestPath = join(this.cacheDir, "manifest.json");
			const rulesPath = join(this.cacheDir, "rules.json");
			const reputationPath = join(this.cacheDir, "reputation.json");

			if (!existsSync(manifestPath) || !existsSync(rulesPath) || !existsSync(reputationPath)) {
				return null;
			}

			const manifest: FeedManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
			const rules: Rule[] = JSON.parse(readFileSync(rulesPath, "utf-8"));
			const reputation: ReputationData = JSON.parse(readFileSync(reputationPath, "utf-8"));

			return { manifest, rules, reputation };
		} catch {
			return null;
		}
	}

	getLastUpdated(): Date | null {
		try {
			const manifestPath = join(this.cacheDir, "manifest.json");
			if (!existsSync(manifestPath)) return null;
			const manifest: FeedManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
			return new Date(manifest.published_at);
		} catch {
			return null;
		}
	}
}
