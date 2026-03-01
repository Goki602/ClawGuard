import type { FalsePositiveAlert, RuleStatsWindowed } from "@clawguard/core";
import type { DecisionStore } from "./decision-store.js";

export class FalsePositiveMonitor {
	constructor(private store: DecisionStore) {}

	analyze(): FalsePositiveAlert[] {
		const ruleIds = this.store.getAllRuleIds();
		const alerts: FalsePositiveAlert[] = [];
		for (const ruleId of ruleIds) {
			const stats = this.store.getStats(ruleId);
			if (stats.total < 10) continue;

			const stats30d = this.store.getStatsWindowed(ruleId, 30);
			const baseline = stats.override_rate;
			const current = stats30d.total >= 5 ? stats30d.override_rate : baseline;

			let severity: FalsePositiveAlert["severity"];
			let suggestion: FalsePositiveAlert["suggestion"];
			let reason: string;

			if (current >= 0.5) {
				severity = "critical";
				suggestion = "deprecate";
				reason = `Override rate ${(current * 100).toFixed(0)}% exceeds 50% threshold — most users allow this rule, suggesting false positive`;
			} else if (current >= 0.3) {
				severity = "warning";
				suggestion = "loosen";
				reason = `Override rate ${(current * 100).toFixed(0)}% suggests rule may be too aggressive`;
			} else {
				severity = "info";
				suggestion = "keep";
				reason = `Override rate ${(current * 100).toFixed(0)}% within acceptable range`;
			}

			alerts.push({
				rule_id: ruleId,
				current_override_rate: current,
				baseline_override_rate: baseline,
				sample_size: stats.total,
				severity,
				suggestion,
				reason,
			});
		}
		return alerts.sort((a, b) => b.current_override_rate - a.current_override_rate);
	}

	getDetailedStats(): RuleStatsWindowed[] {
		const ruleIds = this.store.getAllRuleIds();
		const results: RuleStatsWindowed[] = [];
		for (const ruleId of ruleIds) {
			for (const days of [7, 30, 0]) {
				if (days === 0) {
					const s = this.store.getStats(ruleId);
					results.push({
						rule_id: ruleId,
						period: "all",
						total: s.total,
						allowed: s.allowed,
						denied: s.denied,
						confirmed: s.confirmed,
						override_rate: s.override_rate,
					});
				} else {
					results.push(this.store.getStatsWindowed(ruleId, days));
				}
			}
		}
		return results;
	}
}
