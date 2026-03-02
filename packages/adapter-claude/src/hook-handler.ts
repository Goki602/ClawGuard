import type { Lang, PolicyDecision } from "@clawguard/core";
import { formatExplainTerminal } from "@clawguard/core";
import { mapToToolRequest } from "./mapper.js";
import type { ClaudeHookInput, ClaudeHookOutput } from "./types.js";
import { isVscodeEnvironment, shouldIntervene } from "./types.js";

export function parseHookInput(jsonStr: string): ClaudeHookInput {
	return JSON.parse(jsonStr) as ClaudeHookInput;
}

const POLICY_HINT = {
	ja: "\n\n⛔ この操作は高リスクのためブロックされました（その場での許可はできません）。\n許可するには:\n  - プリセットを `expert` に変更: `claw-guard init --profile expert`\n  - または clawguard.yaml にプロジェクト例外を追加",
	en: "\n\n⛔ This operation was blocked due to high risk (cannot be approved on the spot).\nTo allow it:\n  - Change preset to `expert`: `claw-guard init --profile expert`\n  - Or add a project override in clawguard.yaml",
} as const;

function decisionToClaudeAction(
	decision: PolicyDecision,
	forceBlock?: boolean,
): "allow" | "deny" | "ask" {
	switch (decision.action) {
		case "deny":
			return "deny";
		case "confirm":
			if (forceBlock && decision.risk === "high") return "deny";
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
		reason += POLICY_HINT[lang];
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
