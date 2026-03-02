import { getActionLabel, getLabels } from "./i18n/explain-labels.js";
import { RULES_EN } from "./i18n/rules-en.js";
import type { Action, ExplainRisk, Lang } from "./types.js";

const RISK_ICONS: Record<string, string> = {
	high: "\u{1F6AB}",
	medium: "\u26A0\uFE0F",
	low: "\u2139\uFE0F",
};

export function formatExplainTerminal(
	explain: ExplainRisk,
	risk: string,
	action: Action,
	ruleId: string,
	lang: Lang = "ja",
): string {
	const icon = RISK_ICONS[risk] ?? "";
	const l = getLabels(lang);
	const e = lang === "en" ? (RULES_EN[ruleId] ?? explain) : explain;
	const lines: string[] = [];

	if (action === "deny") {
		lines.push(`${icon} ${l.highRisk}: ${e.title} — ${getActionLabel("deny", lang)}`);
	} else if (action === "confirm") {
		lines.push(`${icon} ${risk === "high" ? l.highRisk : l.mediumRisk}: ${e.title}`);
	} else {
		lines.push(`${icon} ${e.title}`);
	}

	lines.push("");
	lines.push(`${l.whatDoing}: ${e.what}`);

	if (action === "deny") {
		lines.push(`${l.whyBlocked}:`);
	} else {
		lines.push(`${l.whyWarning}:`);
	}
	for (const reason of e.why) {
		lines.push(`  - ${reason}`);
	}

	if (action !== "deny" && e.check.length > 0) {
		lines.push(`${l.checkPoints}:`);
		for (const c of e.check) {
			lines.push(`  - ${c}`);
		}
	}

	if (e.alternatives && e.alternatives.length > 0) {
		lines.push(`${l.alternatives}:`);
		for (const alt of e.alternatives) {
			lines.push(`  - ${alt}`);
		}
	}

	if (
		explain.data?.community_allow_rate != null &&
		explain.data?.community_sample_size != null &&
		explain.data.community_sample_size >= 10
	) {
		const pct = Math.round(explain.data.community_allow_rate * 100);
		const count = explain.data.community_sample_size.toLocaleString();
		lines.push(`\u{1F4CA} ${l.community}: ${l.communityFmt(pct, count)}`);
	}

	lines.push("");
	lines.push(`[${l.ruleId}: ${ruleId}]`);

	return lines.join("\n");
}
