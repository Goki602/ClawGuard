import type { PolicyDecision } from "@clawguard/core";
import { describe, expect, it } from "vitest";
import { buildErrorResponse, isToolCall, parseInput } from "../hook-handler.js";
import type { McpToolCallInput } from "../types.js";

describe("parseInput", () => {
	it("parses valid JSON-RPC", () => {
		const input = parseInput(
			JSON.stringify({
				jsonrpc: "2.0",
				id: "req-1",
				method: "tools/call",
				params: {
					name: "bash",
					arguments: { command: "ls" },
				},
			}),
		);
		expect(input.jsonrpc).toBe("2.0");
		expect(input.id).toBe("req-1");
		expect(input.method).toBe("tools/call");
		expect(input.params?.name).toBe("bash");
	});
});

describe("buildErrorResponse", () => {
	it("returns correct error code -32001", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: "req-1",
			method: "tools/call",
			params: { name: "bash", arguments: { command: "rm -rf /" } },
		};
		const decision: PolicyDecision = {
			action: "deny",
			risk: "high",
			rule_id: "BASH.RM_RISK",
			feed_version: "0.1.0",
			explain: {
				title: "大量削除の可能性",
				what: "ファイルをまとめて削除",
				why: ["元に戻せません"],
				check: ["パスは正しい？"],
			},
		};
		const output = buildErrorResponse(input, decision);
		expect(output.error?.code).toBe(-32001);
	});

	it("includes explain title in message", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: 99,
			method: "tools/call",
			params: { name: "bash", arguments: { command: "rm -rf /" } },
		};
		const decision: PolicyDecision = {
			action: "deny",
			risk: "high",
			rule_id: "BASH.RM_RISK",
			feed_version: "0.1.0",
			explain: {
				title: "大量削除の可能性",
				what: "ファイルをまとめて削除",
				why: ["元に戻せません"],
				check: ["パスは正しい？"],
			},
		};
		const output = buildErrorResponse(input, decision);
		expect(output.error?.message).toContain("大量削除の可能性");
		expect(output.error?.message).toContain("ClawGuardによりブロック");
	});
});

describe("isToolCall", () => {
	it("returns false for tools/list", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: "req-list",
			method: "tools/list",
		};
		expect(isToolCall(input)).toBe(false);
	});

	it("returns true for tools/call with params.name", () => {
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: "req-call",
			method: "tools/call",
			params: { name: "bash", arguments: { command: "ls" } },
		};
		expect(isToolCall(input)).toBe(true);
	});

	it("returns forward=true semantics for non-tool-call methods", () => {
		// isToolCall is the gate; if false, proxy should forward
		const input: McpToolCallInput = {
			jsonrpc: "2.0",
			id: "req-init",
			method: "initialize",
		};
		expect(isToolCall(input)).toBe(false);
	});
});
