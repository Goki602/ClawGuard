import type { PolicyDecision } from "@clawguard/core";
import { describe, expect, it } from "vitest";
import {
	buildHookOutput,
	mapToToolRequest,
	parseHookInput,
	shouldIntervene,
} from "../hook-handler.js";

describe("parseHookInput", () => {
	it("parses valid JSON", () => {
		const input = parseHookInput(
			JSON.stringify({
				session_id: "s1",
				cwd: "/tmp",
				permission_mode: "default",
				hook_event_name: "PreToolUse",
				tool_name: "Bash",
				tool_input: { command: "rm -rf /" },
			}),
		);
		expect(input.session_id).toBe("s1");
		expect(input.tool_name).toBe("Bash");
		expect(input.tool_input.command).toBe("rm -rf /");
	});

	it("throws on invalid JSON", () => {
		expect(() => parseHookInput("not json")).toThrow();
	});
});

describe("shouldIntervene", () => {
	it("returns true for default mode", () => {
		expect(shouldIntervene("default")).toBe(true);
	});

	it("returns true for unknown modes", () => {
		expect(shouldIntervene("anything")).toBe(true);
	});

	it("returns false for bypassPermissions", () => {
		expect(shouldIntervene("bypassPermissions")).toBe(false);
	});

	it("returns false for dontAsk", () => {
		expect(shouldIntervene("dontAsk")).toBe(false);
	});
});

describe("buildHookOutput", () => {
	it("returns null for allow", () => {
		const decision: PolicyDecision = {
			action: "allow",
			risk: "low",
			rule_id: "NO_MATCH",
			feed_version: "0.1.0",
		};
		expect(buildHookOutput(decision)).toBeNull();
	});

	it("returns null for log", () => {
		const decision: PolicyDecision = {
			action: "log",
			risk: "high",
			rule_id: "BASH.RM_RISK",
			feed_version: "0.1.0",
		};
		expect(buildHookOutput(decision)).toBeNull();
	});

	it("returns ask for confirm", () => {
		const decision: PolicyDecision = {
			action: "confirm",
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
		const output = buildHookOutput(decision);
		expect(output).not.toBeNull();
		expect(output?.hookSpecificOutput.permissionDecision).toBe("ask");
		expect(output?.hookSpecificOutput.permissionDecisionReason).toContain("大量削除");
	});

	it("returns deny for deny", () => {
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
		const output = buildHookOutput(decision);
		expect(output).not.toBeNull();
		expect(output?.hookSpecificOutput.permissionDecision).toBe("deny");
	});

	it("output has correct hookEventName", () => {
		const decision: PolicyDecision = {
			action: "confirm",
			risk: "high",
			rule_id: "T",
			feed_version: "0.1.0",
			explain: { title: "T", what: "W", why: [], check: [] },
		};
		const output = buildHookOutput(decision);
		expect(output).not.toBeNull();
		expect(output?.hookSpecificOutput.hookEventName).toBe("PreToolUse");
	});
});

describe("mapToToolRequest", () => {
	it("maps Bash tool correctly", () => {
		const req = mapToToolRequest({
			session_id: "s1",
			cwd: "/home/user",
			permission_mode: "default",
			hook_event_name: "PreToolUse",
			tool_name: "Bash",
			tool_input: { command: "ls -la" },
		});
		expect(req.tool).toBe("bash");
		expect(req.content).toBe("ls -la");
		expect(req.context.agent).toBe("claude-code");
		expect(req.context.working_dir).toBe("/home/user");
		expect(req.context.session_id).toBe("s1");
	});

	it("maps Write tool to file_write", () => {
		const req = mapToToolRequest({
			session_id: "s1",
			cwd: "/tmp",
			permission_mode: "default",
			hook_event_name: "PreToolUse",
			tool_name: "Write",
			tool_input: { file_path: "/tmp/test.ts", content: "hello" },
		});
		expect(req.tool).toBe("file_write");
	});

	it("maps Edit tool to file_write", () => {
		const req = mapToToolRequest({
			session_id: "s1",
			cwd: "/tmp",
			permission_mode: "default",
			hook_event_name: "PreToolUse",
			tool_name: "Edit",
			tool_input: { file_path: "/tmp/test.ts" },
		});
		expect(req.tool).toBe("file_write");
	});

	it("maps WebFetch to network", () => {
		const req = mapToToolRequest({
			session_id: "s1",
			cwd: "/tmp",
			permission_mode: "default",
			hook_event_name: "PreToolUse",
			tool_name: "WebFetch",
			tool_input: { url: "https://example.com" },
		});
		expect(req.tool).toBe("network");
	});

	it("maps unknown tool to unknown", () => {
		const req = mapToToolRequest({
			session_id: "s1",
			cwd: "/tmp",
			permission_mode: "default",
			hook_event_name: "PreToolUse",
			tool_name: "CustomTool",
			tool_input: {},
		});
		expect(req.tool).toBe("unknown");
	});
});
