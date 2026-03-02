import type { Action, Lang } from "../types.js";

const ACTION_LABELS: Record<Lang, Record<Action, string>> = {
	ja: { deny: "ブロックしました", confirm: "確認が必要です", allow: "", log: "記録しました" },
	en: { deny: "Blocked", confirm: "Needs Confirmation", allow: "", log: "Logged" },
};

const LABELS = {
	ja: {
		highRisk: "高リスク",
		mediumRisk: "中リスク",
		whatDoing: "何をする",
		whyBlocked: "なぜ止めた",
		whyWarning: "なぜ注意",
		checkPoints: "確認ポイント",
		alternatives: "代替案",
		community: "コミュニティ",
		communityFmt: (pct: number, count: string) => `${pct}%が許可 (${count}件中)`,
		ruleId: "ルールID",
	},
	en: {
		highRisk: "High Risk",
		mediumRisk: "Medium Risk",
		whatDoing: "What it does",
		whyBlocked: "Why blocked",
		whyWarning: "Why flagged",
		checkPoints: "Check points",
		alternatives: "Alternatives",
		community: "Community",
		communityFmt: (pct: number, count: string) => `${pct}% allowed (of ${count})`,
		ruleId: "Rule ID",
	},
} as const;

export function getActionLabel(action: Action, lang: Lang): string {
	return ACTION_LABELS[lang][action];
}

export function getLabels(lang: Lang) {
	return LABELS[lang];
}
