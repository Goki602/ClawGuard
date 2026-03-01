import type { AnonymizedSnapshot, ReputationData, ReputationEntry } from "@clawguard/core";
import type { DecisionStore } from "@clawguard/memory";

const EMPTY_ENTRY: ReputationEntry = {
	rule_id: "",
	community_total: 0,
	community_allowed: 0,
	community_denied: 0,
	community_override_rate: 0,
	last_updated: "",
};

export class ReputationAggregator {
	private store: DecisionStore;
	private feedReputation?: ReputationData;
	private feedIndex: Map<string, ReputationEntry>;

	constructor(store: DecisionStore, feedReputation?: ReputationData) {
		this.store = store;
		this.feedReputation = feedReputation;
		this.feedIndex = new Map();
		if (feedReputation) {
			for (const e of feedReputation.entries) {
				this.feedIndex.set(e.rule_id, e);
			}
		}
	}

	getReputation(ruleId: string): ReputationEntry {
		const local = this.store.getStats(ruleId);
		const feed = this.feedIndex.get(ruleId);

		if (local.total === 0 && !feed) {
			return { ...EMPTY_ENTRY, rule_id: ruleId };
		}

		if (!feed) {
			return {
				rule_id: ruleId,
				community_total: local.total,
				community_allowed: local.allowed,
				community_denied: local.denied,
				community_override_rate: local.override_rate,
				last_updated: new Date().toISOString(),
			};
		}

		if (local.total === 0) {
			return { ...feed };
		}

		// Merge: feed weight 80% if sample > 100, else 50%
		const feedWeight = feed.community_total > 100 ? 0.8 : 0.5;
		const localWeight = 1 - feedWeight;

		const total = local.total + feed.community_total;
		const allowed = Math.round(local.allowed * localWeight + feed.community_allowed * feedWeight);
		const denied = Math.round(local.denied * localWeight + feed.community_denied * feedWeight);
		const overrideRate =
			total > 0 ? local.override_rate * localWeight + feed.community_override_rate * feedWeight : 0;

		return {
			rule_id: ruleId,
			community_total: total,
			community_allowed: allowed,
			community_denied: denied,
			community_override_rate: overrideRate,
			last_updated: new Date().toISOString(),
		};
	}

	formatForDialog(ruleId: string): string | null {
		const rep = this.getReputation(ruleId);
		if (rep.community_total < 10) return null;
		const pct = Math.round(rep.community_override_rate * 100);
		return `コミュニティの${pct}%がこの操作を許可しています（${rep.community_total.toLocaleString()}件中）`;
	}

	generateTelemetrySnapshot(): AnonymizedSnapshot {
		const ruleIds = new Set<string>();
		// Collect from feed reputation entries
		if (this.feedReputation) {
			for (const e of this.feedReputation.entries) {
				ruleIds.add(e.rule_id);
			}
		}

		const entries: AnonymizedSnapshot["entries"] = [];
		for (const ruleId of ruleIds) {
			const stats = this.store.getStats(ruleId);
			if (stats.total > 0) {
				entries.push({
					rule_id: ruleId,
					total: stats.total,
					allowed: stats.allowed,
					denied: stats.denied,
				});
			}
		}

		return {
			generated_at: new Date().toISOString(),
			entries,
		};
	}
}
