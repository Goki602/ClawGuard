import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadRulesFromDir } from "./rule-loader.js";
import type { CompiledRule, RulePack } from "./types.js";

const DEFAULT_API_URL = "https://api.clawguard-sec.com";

export class MarketplaceClient {
	private packsDir: string;
	private apiUrl: string;

	constructor(config?: { packsDir?: string; apiUrl?: string }) {
		this.packsDir = config?.packsDir ?? join(homedir(), ".clawguard", "packs");
		this.apiUrl = config?.apiUrl ?? DEFAULT_API_URL;
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

	async searchRemote(query?: string): Promise<
		Array<{
			name: string;
			description: string;
			author: string;
			version: string;
			rules_count: number;
			downloads: number;
		}>
	> {
		const params = new URLSearchParams();
		if (query) params.set("q", query);
		const res = await fetch(`${this.apiUrl}/api/marketplace/search?${params}`);
		if (!res.ok) return [];
		const data = (await res.json()) as {
			packs: Array<{
				name: string;
				description: string;
				author: string;
				version: string;
				rules_count: number;
				downloads: number;
			}>;
		};
		return data.packs;
	}

	async installFromRegistry(name: string): Promise<RulePack | null> {
		const res = await fetch(`${this.apiUrl}/api/marketplace/pack/${encodeURIComponent(name)}`);
		if (!res.ok) return null;
		const data = (await res.json()) as {
			name: string;
			description: string;
			author: string;
			version: string;
			pack_json: string;
		};

		if (!existsSync(this.packsDir)) mkdirSync(this.packsDir, { recursive: true });
		const destDir = join(this.packsDir, name);
		if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true });
		mkdirSync(destDir, { recursive: true });

		// Write pack data
		const packContent = data.pack_json ? JSON.parse(data.pack_json) : { rules: [] };
		const packMeta = {
			name: data.name,
			description: data.description ?? "",
			author: data.author ?? "community",
			version: data.version,
			source: "registry",
			installed_at: new Date().toISOString(),
		};
		writeFileSync(join(destDir, "pack.json"), JSON.stringify(packMeta, null, "\t"), "utf-8");

		// Write rules as YAML if available
		if (Array.isArray(packContent.rules)) {
			for (const rule of packContent.rules) {
				const yaml = JSON.stringify(rule);
				writeFileSync(join(destDir, `${rule.id ?? "rule"}.json`), yaml, "utf-8");
			}
		}

		const rules = loadRulesFromDir(destDir);
		return { ...packMeta, rules };
	}
}
