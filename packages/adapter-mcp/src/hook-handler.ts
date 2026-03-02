import type { Lang, PolicyDecision } from "@clawguard/core";
import { mapToToolRequest } from "./mapper.js";
import type { McpToolCallInput, McpToolCallOutput } from "./types.js";
import { isToolCall } from "./types.js";

const BLOCKED_MSG = { ja: "ClawGuardによりブロック", en: "Blocked by ClawGuard" } as const;

export function parseInput(jsonStr: string): McpToolCallInput {
	return JSON.parse(jsonStr) as McpToolCallInput;
}

export function buildErrorResponse(
	input: McpToolCallInput,
	decision: PolicyDecision,
	lang: Lang = "ja",
): McpToolCallOutput {
	const title = decision.explain?.title ?? "Policy violation";
	return {
		jsonrpc: "2.0",
		id: input.id,
		error: {
			code: -32001,
			message: `${BLOCKED_MSG[lang]}: ${title}`,
		},
	};
}

export function buildAllowResponse(): null {
	return null;
}

export { isToolCall, mapToToolRequest };
