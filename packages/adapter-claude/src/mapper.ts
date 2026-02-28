import type { ToolRequest, ToolType } from "@clawguard/core";
import type { ClaudeHookInput } from "./types.js";

const TOOL_TYPE_MAP: Record<string, ToolType> = {
	Bash: "bash",
	Write: "file_write",
	Edit: "file_write",
	WebFetch: "network",
	WebSearch: "network",
};

function extractContent(input: ClaudeHookInput): string {
	if (input.tool_name === "Bash") {
		return (input.tool_input.command as string) ?? "";
	}
	return JSON.stringify(input.tool_input);
}

export function mapToToolRequest(input: ClaudeHookInput): ToolRequest {
	return {
		tool: TOOL_TYPE_MAP[input.tool_name] ?? "unknown",
		content: extractContent(input),
		context: {
			agent: "claude-code",
			working_dir: input.cwd,
			session_id: input.session_id,
		},
	};
}
