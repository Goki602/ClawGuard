import type { PolicyDecision, ToolRequest } from "@clawguard/core";
import type { DecisionStore } from "@clawguard/memory";
import { lookupCves } from "./cve-lookup.js";
import { extractPackageName, lookupNpmPackage } from "./npm-registry.js";

export interface ReputationSource {
	getReputation(ruleId: string): {
		community_total: number;
		community_allowed: number;
		community_denied: number;
		community_override_rate: number;
	};
	formatForDialog(ruleId: string): string | null;
}

export class Enricher {
	private store?: DecisionStore;
	private reputation?: ReputationSource;

	constructor(store?: DecisionStore, reputation?: ReputationSource) {
		this.store = store;
		this.reputation = reputation;
	}

	async enrich(decision: PolicyDecision, request: ToolRequest): Promise<PolicyDecision> {
		const enriched = { ...decision };
		if (enriched.explain) {
			enriched.explain = { ...enriched.explain, data: { ...enriched.explain.data } };
		}

		if (decision.rule_id === "BASH.NPM_INSTALL") {
			await this.enrichNpmInstall(enriched, request);
		}

		if (this.reputation && enriched.explain) {
			const rep = this.reputation.getReputation(decision.rule_id);
			if (rep.community_total > 0) {
				if (!enriched.explain.data) enriched.explain.data = {};
				enriched.explain.data.community_allow_rate = rep.community_override_rate;
				enriched.explain.data.community_sample_size = rep.community_total;
			}
		} else if (this.store && enriched.explain?.data) {
			const stats = this.store.getStats(decision.rule_id);
			if (stats.total > 0) {
				enriched.explain.data.community_allow_rate = stats.override_rate;
				enriched.explain.data.community_sample_size = stats.total;
			}
		}

		return enriched;
	}

	private async enrichNpmInstall(decision: PolicyDecision, request: ToolRequest): Promise<void> {
		const pkgName = extractPackageName(request.content);
		if (!pkgName) return;

		const [npmInfo, cveInfo] = await Promise.all([
			lookupNpmPackage(pkgName),
			lookupCves("npm", pkgName),
		]);

		if (!decision.explain) return;
		if (!decision.explain.data) {
			decision.explain.data = {};
		}

		if (npmInfo) {
			decision.explain.data.package_downloads = npmInfo.downloads_last_week;
			decision.explain.data.has_postinstall = npmInfo.has_postinstall;
		}

		if (cveInfo.cve_count > 0) {
			decision.explain.data.cve_count = cveInfo.cve_count;
		}
	}
}
