import type { Lang, PolicyDecision } from "@clawguard/core";
import { formatExplainTerminal } from "@clawguard/core";
import { mapToToolRequest } from "./mapper.js";
import type { ClaudeHookInput, ClaudeHookOutput } from "./types.js";
import { isVscodeEnvironment, shouldIntervene } from "./types.js";

export function parseHookInput(jsonStr: string): ClaudeHookInput {
	return JSON.parse(jsonStr) as ClaudeHookInput;
}

const POLICY_HINT_HARD = {
	ja: "\n\n⛔ この操作は高リスクのためブロックされました（その場での許可はできません）。\n許可するには:\n  - プリセットを `expert` に変更: `claw-guard init --profile expert`\n  - または clawguard.yaml にプロジェクト例外を追加",
	en: "\n\n⛔ This operation was blocked due to high risk (cannot be approved on the spot).\nTo allow it:\n  - Change preset to `expert`: `claw-guard init --profile expert`\n  - Or add a project override in clawguard.yaml",
} as const;

const POLICY_HINT_SOFT = {
	ja: "\n\n⚠️ この操作にはリスクがあるためブロックしました。\n上記の内容を確認し、問題なければそのまま指示を続けてください（同じ操作は今回のセッション中は自動で許可されます）。",
	en: "\n\n⚠️ This operation was blocked due to risk.\nReview the details above. If it looks safe, just tell Claude to proceed (the same operation will be auto-allowed for this session).",
} as const;

function decisionToClaudeAction(
	decision: PolicyDecision,
	forceBlock?: boolean,
): "allow" | "deny" | "ask" {
	switch (decision.action) {
		case "deny":
			return "deny";
		case "confirm":
			if (forceBlock) return "deny";
			return "ask";
		case "allow":
		case "log":
			return "allow";
	}
}

function buildReason(decision: PolicyDecision, lang: Lang = "ja"): string | undefined {
	if (!decision.explain) return undefined;
	return formatExplainTerminal(
		decision.explain,
		decision.risk,
		decision.action,
		decision.rule_id,
		lang,
	);
}

export function buildHookOutput(
	decision: PolicyDecision,
	lang: Lang = "ja",
	vsCodeCompat?: boolean,
): ClaudeHookOutput | null {
	const forceBlock = vsCodeCompat ?? isVscodeEnvironment();
	const claudeAction = decisionToClaudeAction(decision, forceBlock);

	// For allow, return null (exit 0 with no stdout = proceed)
	if (claudeAction === "allow") {
		return null;
	}

	let reason = buildReason(decision, lang);

	// When confirm was force-blocked to deny (VSCode compat), append policy change hint
	if (decision.action === "confirm" && claudeAction === "deny" && reason) {
		reason += decision.risk === "high" ? POLICY_HINT_HARD[lang] : POLICY_HINT_SOFT[lang];
	}

	return {
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: claudeAction,
			permissionDecisionReason: reason,
		},
	};
}

export { shouldIntervene, mapToToolRequest };
