import type { ToolRequest, ToolType } from "@clawguard/core";
import type { McpToolCallInput } from "./types.js";

const TOOL_TYPE_MAP: Record<string, ToolType> = {
	bash: "bash",
	shell: "bash",
	terminal: "bash",
	run_command: "bash",
	write_file: "file_write",
	edit_file: "file_write",
	create_file: "file_write",
	fetch: "network",
	browser: "network",
	web_search: "network",
	http_request: "network",
};

function stripNamespace(toolName: string): string {
	const slashIndex = toolName.lastIndexOf("/");
	return slashIndex === -1 ? toolName : toolName.slice(slashIndex + 1);
}

function resolveToolType(rawName: string): ToolType {
	const baseName = stripNamespace(rawName);
	return TOOL_TYPE_MAP[baseName] ?? "unknown";
}

function extractContent(input: McpToolCallInput): string {
	const args = input.params?.arguments;
	if (!args) return "";

	const toolType = resolveToolType(input.params?.name ?? "");

	switch (toolType) {
		case "bash":
			return (args.command as string) ?? (args.cmd as string) ?? "";
		case "file_write":
			return (args.path as string) ?? (args.file_path as string) ?? "";
		case "network":
			return (args.url as string) ?? "";
		default:
			return JSON.stringify(args);
	}
}

export function mapToToolRequest(input: McpToolCallInput): ToolRequest {
	return {
		tool: resolveToolType(input.params?.name ?? ""),
		content: extractContent(input),
		context: {
			agent: "mcp",
			working_dir: (input.params?.arguments?.cwd as string) ?? process.cwd(),
			session_id: String(input.id),
		},
	};
}
