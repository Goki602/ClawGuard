import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadRulesFromDir } from "./rule-loader.js";
import type { CompiledRule, RulePack } from "./types.js";

export class MarketplaceClient {
	private packsDir: string;

	constructor(config?: { packsDir?: string }) {
		this.packsDir = config?.packsDir ?? join(homedir(), ".clawguard", "packs");
	}

	listInstalled(): RulePack[] {
		if (!existsSync(this.packsDir)) return [];
		const packs: RulePack[] = [];
		for (const dir of readdirSync(this.packsDir, { withFileTypes: true })) {
			if (!dir.isDirectory()) continue;
			const packDir = join(this.packsDir, dir.name);
			const metaPath = join(packDir, "pack.json");
			if (!existsSync(metaPath)) continue;
			try {
				const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
				const rules = loadRulesFromDir(packDir);
				packs.push({
					name: meta.name ?? dir.name,
					description: meta.description ?? "",
					author: meta.author ?? "unknown",
					version: meta.version ?? "0.0.0",
					source: meta.source ?? "",
					rules,
					installed_at: meta.installed_at,
				});
			} catch {
				// Skip invalid packs
			}
		}
		return packs;
	}

	loadInstalledRules(): CompiledRule[] {
		const packs = this.listInstalled();
		const rules: CompiledRule[] = [];
		for (const pack of packs) {
			for (const rule of pack.rules) {
				// Force recommend status for marketplace rules
				const compiled = {
					...rule,
					meta: {
						...(rule.meta ?? {
							author: pack.author,
							pack: pack.name,
							version: pack.version,
							tags: [],
							phase: 2,
						}),
						marketplace: {
							status: "recommend" as const,
							downloads: 0,
							rating: 0,
							override_rate: 0,
							...(rule.meta?.marketplace ?? {}),
						},
					},
				};
				rules.push(compiled);
			}
		}
		return rules;
	}

	installFromDir(
		source: string,
		name: string,
		meta?: { description?: string; author?: string },
	): RulePack {
		if (!existsSync(this.packsDir)) mkdirSync(this.packsDir, { recursive: true });

		const destDir = join(this.packsDir, name);
		if (existsSync(destDir)) {
			rmSync(destDir, { recursive: true, force: true });
		}
		mkdirSync(destDir, { recursive: true });

		// Copy YAML files from source
		const files = readdirSync(source).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
		for (const file of files) {
			const content = readFileSync(join(source, file), "utf-8");
			writeFileSync(join(destDir, file), content, "utf-8");
		}

		const packMeta = {
			name,
			description: meta?.description ?? "",
			author: meta?.author ?? "community",
			version: "1.0.0",
			source,
			installed_at: new Date().toISOString(),
		};
		writeFileSync(join(destDir, "pack.json"), JSON.stringify(packMeta, null, "\t"), "utf-8");

		const rules = loadRulesFromDir(destDir);
		return { ...packMeta, rules };
	}

	updateRuleStatus(
		packName: string,
		ruleId: string,
		status: "draft" | "recommend" | "active" | "deprecated",
	): boolean {
		const packDir = join(this.packsDir, packName);
		if (!existsSync(packDir)) return false;

		const files = readdirSync(packDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
		for (const file of files) {
			const filePath = join(packDir, file);
			let content = readFileSync(filePath, "utf-8");
			if (content.includes(`id: ${ruleId}`) || content.includes(`id: "${ruleId}"`)) {
				content = content.replace(
					/(\bstatus:\s*)(["']?)(draft|recommend|active|deprecated)\2/,
					`$1"${status}"`,
				);
				writeFileSync(filePath, content, "utf-8");
				return true;
			}
		}
		return false;
	}

	uninstallPack(name: string): boolean {
		const packDir = join(this.packsDir, name);
		if (!existsSync(packDir)) return false;
		rmSync(packDir, { recursive: true, force: true });
		return true;
	}
}
