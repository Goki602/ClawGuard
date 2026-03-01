import type { Action, ExplainRisk } from "./types.js";

const RISK_ICONS: Record<string, string> = {
	high: "\u{1F6AB}",
	medium: "\u26A0\uFE0F",
	low: "\u2139\uFE0F",
};

const ACTION_LABELS: Record<Action, string> = {
	deny: "ブロックしました",
	confirm: "確認が必要です",
	allow: "",
	log: "記録しました",
};

export function formatExplainTerminal(
	explain: ExplainRisk,
	risk: string,
	action: Action,
	ruleId: string,
): string {
	const icon = RISK_ICONS[risk] ?? "";
	const lines: string[] = [];

	if (action === "deny") {
		lines.push(`${icon} 高リスク: ${explain.title} — ${ACTION_LABELS.deny}`);
	} else if (action === "confirm") {
		lines.push(`${icon} ${risk === "high" ? "高" : "中"}リスク: ${explain.title}`);
	} else {
		lines.push(`${icon} ${explain.title}`);
	}

	lines.push("");
	lines.push(`何をする: ${explain.what}`);

	if (action === "deny") {
		lines.push("なぜ止めた:");
	} else {
		lines.push("なぜ注意:");
	}
	for (const reason of explain.why) {
		lines.push(`  - ${reason}`);
	}

	if (action !== "deny" && explain.check.length > 0) {
		lines.push("確認ポイント:");
		for (const c of explain.check) {
			lines.push(`  - ${c}`);
		}
	}

	if (explain.alternatives && explain.alternatives.length > 0) {
		lines.push("代替案:");
		for (const alt of explain.alternatives) {
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
		lines.push(`\u{1F4CA} コミュニティ: ${pct}%が許可 (${count}件中)`);
	}

	lines.push("");
	lines.push(`[ルールID: ${ruleId}]`);

	return lines.join("\n");
}
