import type { Lang, PolicyDecision } from "@clawguard/core";
import { formatExplainTerminal } from "@clawguard/core";
import { mapToToolRequest } from "./mapper.js";
import type { ClaudeHookInput, ClaudeHookOutput } from "./types.js";
import { shouldIntervene } from "./types.js";

export function parseHookInput(jsonStr: string): ClaudeHookInput {
	return JSON.parse(jsonStr) as ClaudeHookInput;
}

const ANTI_EVASION_HINT = {
	ja: "\n\n🚫 セキュリティチェックを回避するためにコマンドを変更しないでください。",
	en: "\n\n🚫 Do not modify the command to bypass this security check.",
} as const;

function decisionToClaudeAction(
	decision: PolicyDecision,
): "allow" | "deny" | "ask" {
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

	// observer mode (log): don't affect Claude's behavior — just observe
	if (decision.action === "log") {
		return null;
	}
	// Explicit allow: tell Claude to auto-approve (suppress permission dialog)
	if (claudeAction === "allow") {
		return {
			hookSpecificOutput: {
				hookEventName: "PreToolUse",
				permissionDecision: "allow",
			},
		};
	}

	let reason = buildReason(decision, lang);

	// Append anti-evasion instruction for deny/ask to prevent command modification bypass
	if (reason && (claudeAction === "deny" || claudeAction === "ask")) {
		reason += ANTI_EVASION_HINT[lang];
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
