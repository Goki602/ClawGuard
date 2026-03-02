import type { Lang, PolicyDecision } from "@clawguard/core";
import { formatExplainTerminal } from "@clawguard/core";
import { mapToToolRequest } from "./mapper.js";
import type { ClaudeHookInput, ClaudeHookOutput } from "./types.js";
import { shouldIntervene } from "./types.js";

export function parseHookInput(jsonStr: string): ClaudeHookInput {
	return JSON.parse(jsonStr) as ClaudeHookInput;
}

function decisionToClaudeAction(decision: PolicyDecision): "allow" | "deny" | "ask" {
	switch (decision.action) {
		case "deny":
			return "deny";
		case "confirm":
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
): ClaudeHookOutput | null {
	const claudeAction = decisionToClaudeAction(decision);

	// For allow, return null (exit 0 with no stdout = proceed)
	if (claudeAction === "allow") {
		return null;
	}

	return {
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: claudeAction,
			permissionDecisionReason: buildReason(decision, lang),
		},
	};
}

export { shouldIntervene, mapToToolRequest };
