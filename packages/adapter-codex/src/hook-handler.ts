import type { Lang, PolicyDecision } from "@clawguard/core";
import { formatExplainTerminal } from "@clawguard/core";
import { mapToToolRequest } from "./mapper.js";
import type { CodexApprovalInput, CodexApprovalOutput } from "./types.js";
import { shouldIntervene } from "./types.js";

export function parseInput(jsonStr: string): CodexApprovalInput {
	return JSON.parse(jsonStr) as CodexApprovalInput;
}

function decisionToCodexAction(decision: PolicyDecision): "approve" | "reject" | "ask" {
	switch (decision.action) {
		case "deny":
			return "reject";
		case "confirm":
			return "ask";
		case "allow":
		case "log":
			return "approve";
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

export function buildOutput(
	decision: PolicyDecision,
	lang: Lang = "ja",
): CodexApprovalOutput | null {
	const codexAction = decisionToCodexAction(decision);

	if (codexAction === "approve") {
		return null;
	}

	return {
		action: codexAction,
		reason: buildReason(decision, lang),
	};
}

export { shouldIntervene, mapToToolRequest };
