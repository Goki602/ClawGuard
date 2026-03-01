import type { MarketplaceClient } from "./marketplace.js";
import type { CurationResult, CurationTask } from "./types.js";

export interface CurationStore {
	getStats(ruleId: string): { total: number; override_rate: number };
}

const THRESHOLDS = {
	PROMOTE_MAX_OVERRIDE_RATE: 0.2,
	DEPRECATE_MIN_OVERRIDE_RATE: 0.5,
	MIN_SAMPLE_SIZE: 100,
	MIN_RECOMMEND_DAYS: 14,
};

export class RuleCurator {
	constructor(
		private marketplace: MarketplaceClient,
		private store: CurationStore,
	) {}

	evaluate(): CurationResult {
		const packs = this.marketplace.listInstalled();
		const tasks: CurationTask[] = [];
		const promoted: string[] = [];
		const deprecated: string[] = [];
		const kept: string[] = [];

		for (const pack of packs) {
			for (const rule of pack.rules) {
				const status = rule.meta?.marketplace?.status;
				if (!status || status === "draft") continue;
				if (status === "deprecated") continue;

				const stats = this.store.getStats(rule.id);
				const installedAt = pack.installed_at ? new Date(pack.installed_at) : new Date();
				const daysSinceInstall = Math.floor(
					(Date.now() - installedAt.getTime()) / (1000 * 60 * 60 * 24),
				);

				let recommendedAction: CurationTask["recommended_action"] = "keep";
				let reason = "";

				if (stats.total < THRESHOLDS.MIN_SAMPLE_SIZE) {
					recommendedAction = "keep";
					reason = `Insufficient data: ${stats.total}/${THRESHOLDS.MIN_SAMPLE_SIZE} decisions`;
				} else if (stats.override_rate >= THRESHOLDS.DEPRECATE_MIN_OVERRIDE_RATE) {
					recommendedAction = "deprecate";
					reason = `Override rate ${(stats.override_rate * 100).toFixed(0)}% >= 50% — high false positive rate`;
					deprecated.push(rule.id);
				} else if (
					status === "recommend" &&
					stats.override_rate <= THRESHOLDS.PROMOTE_MAX_OVERRIDE_RATE &&
					daysSinceInstall >= THRESHOLDS.MIN_RECOMMEND_DAYS
				) {
					recommendedAction = "promote";
					reason = `Override rate ${(stats.override_rate * 100).toFixed(0)}% <= 20% after ${daysSinceInstall} days — ready for active`;
					promoted.push(rule.id);
				} else if (status === "recommend" && daysSinceInstall < THRESHOLDS.MIN_RECOMMEND_DAYS) {
					recommendedAction = "keep";
					reason = `Only ${daysSinceInstall}/${THRESHOLDS.MIN_RECOMMEND_DAYS} days in recommend — too early`;
				} else {
					recommendedAction = "keep";
					reason = `Override rate ${(stats.override_rate * 100).toFixed(0)}% within acceptable range`;
					kept.push(rule.id);
				}

				tasks.push({
					rule_id: rule.id,
					pack: pack.name,
					current_status: status,
					override_rate: stats.override_rate,
					sample_size: stats.total,
					days_in_current_status: daysSinceInstall,
					recommended_action: recommendedAction,
					reason,
				});
			}
		}

		return {
			evaluated_at: new Date().toISOString(),
			tasks,
			promoted,
			deprecated,
			kept,
		};
	}

	applyPromotions(result: CurationResult): number {
		let applied = 0;
		for (const task of result.tasks) {
			if (task.recommended_action === "promote") {
				if (this.marketplace.updateRuleStatus(task.pack, task.rule_id, "active")) {
					applied++;
				}
			} else if (task.recommended_action === "deprecate") {
				if (this.marketplace.updateRuleStatus(task.pack, task.rule_id, "deprecated")) {
					applied++;
				}
			}
		}
		return applied;
	}
}
