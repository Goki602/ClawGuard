import type { PolicyDecision } from "@clawguard/core";
import { describe, expect, it } from "vitest";
import { buildOutput, mapToToolRequest, parseInput, shouldIntervene } from "../hook-handler.js";

describe("parseInput", () => {
	it("parses valid JSON", () => {
		const input = parseInput(
			JSON.stringify({
				type: "approval_needed",
				tool: "bash",
				command: "rm -rf /",
				session_id: "s1",
				cwd: "/tmp",
				sandbox_mode: "off",
			}),
		);
		expect(input.session_id).toBe("s1");
		expect(input.tool).toBe("bash");
		expect(input.command).toBe("rm -rf /");
	});
});

describe("buildOutput", () => {
	it("returns null for allow action", () => {
		const decision: PolicyDecision = {
			action: "allow",
			risk: "low",
			rule_id: "NO_MATCH",
			feed_version: "0.1.0",
		};
		expect(buildOutput(decision)).toBeNull();
	});

	it("returns null for log action", () => {
		const decision: PolicyDecision = {
			action: "log",
			risk: "high",
			rule_id: "BASH.RM_RISK",
			feed_version: "0.1.0",
		};
		expect(buildOutput(decision)).toBeNull();
	});

	it("returns ask for confirm action", () => {
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
		const output = buildOutput(decision);
		expect(output).not.toBeNull();
		expect(output?.action).toBe("ask");
	});

	it("returns reject for deny action", () => {
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
		const output = buildOutput(decision);
		expect(output).not.toBeNull();
		expect(output?.action).toBe("reject");
	});

	it("reason contains explain title", () => {
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
		const output = buildOutput(decision);
		expect(output?.reason).toContain("大量削除");
	});

	it("reason is undefined when no explain", () => {
		const decision: PolicyDecision = {
			action: "deny",
			risk: "high",
			rule_id: "BASH.RM_RISK",
			feed_version: "0.1.0",
		};
		const output = buildOutput(decision);
		expect(output?.reason).toBeUndefined();
	});
});
