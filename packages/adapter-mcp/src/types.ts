export interface McpToolCallInput {
	jsonrpc: "2.0";
	id: string | number;
	method: string;
	params?: {
		name: string;
		arguments?: Record<string, unknown>;
	};
}

export interface McpToolCallOutput {
	jsonrpc: "2.0";
	id: string | number;
	result?: { content: Array<{ type: string; text: string }> };
	error?: { code: number; message: string };
}

export interface McpProxyConfig {
	upstreamUrl: string;
	port: number;
}

export function isToolCall(input: McpToolCallInput): boolean {
	return input.method === "tools/call" && input.params?.name !== undefined;
}
