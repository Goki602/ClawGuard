import type { PolicyDecision } from "@clawguard/core";
import { buildErrorResponse } from "./hook-handler.js";
import { mapToToolRequest } from "./mapper.js";
import type { McpToolCallInput, McpToolCallOutput } from "./types.js";
import { isToolCall } from "./types.js";

export interface ProxyDecision {
	forward: boolean;
	response?: McpToolCallOutput;
}

export type EvaluateCallback = (
	tool: string,
	content: string,
	agent: string,
	sessionId: string,
	cwd: string,
) => { action: string; explain?: { title: string } };

export function evaluateMcpRequest(
	input: McpToolCallInput,
	evaluate: EvaluateCallback,
): ProxyDecision {
	if (!isToolCall(input)) {
		return { forward: true };
	}

	const req = mapToToolRequest(input);
	const result = evaluate(
		req.tool,
		req.content,
		req.context.agent,
		req.context.session_id,
		req.context.working_dir,
	);

	if (result.action === "allow" || result.action === "log") {
		return { forward: true };
	}

	// deny and confirm both block in non-interactive proxy mode
	const decision: PolicyDecision = {
		action: result.action as PolicyDecision["action"],
		risk: "high",
		rule_id: "",
		feed_version: "",
		explain: result.explain
			? { title: result.explain.title, what: "", why: [], check: [] }
			: undefined,
	};

	return {
		forward: false,
		response: buildErrorResponse(input, decision),
	};
}
