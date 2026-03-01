import type { ToolRequest, ToolType } from "@clawguard/core";
import type { CodexApprovalInput } from "./types.js";

const TOOL_TYPE_MAP: Record<string, ToolType> = {
	bash: "bash",
	shell: "bash",
	write_file: "file_write",
	edit_file: "file_write",
	patch: "file_write",
	browser: "network",
	fetch_url: "network",
	web_search: "network",
};

function extractContent(input: CodexApprovalInput): string {
	const tool = input.tool;
	if (tool === "bash" || tool === "shell") {
		return input.command ?? "";
	}
	if (tool === "write_file" || tool === "edit_file" || tool === "patch") {
		return input.path ?? "";
	}
	if (tool === "browser" || tool === "fetch_url" || tool === "web_search") {
		return input.url ?? "";
	}
	return JSON.stringify({
		tool: input.tool,
		command: input.command,
		path: input.path,
		url: input.url,
		content: input.content,
	});
}

export function mapToToolRequest(input: CodexApprovalInput): ToolRequest {
	return {
		tool: TOOL_TYPE_MAP[input.tool] ?? "unknown",
		content: extractContent(input),
		context: {
			agent: "codex",
			working_dir: input.cwd,
			session_id: input.session_id,
		},
	};
}
