import type { PolicyDecision, ToolRequest } from "@clawguard/core";
import { describe, expect, it } from "vitest";
import { createOcsfEvent } from "../ocsf-logger.js";

function makeRequest(content = "rm -rf /"): ToolRequest {
	return {
		tool: "bash",
		content,
		context: { agent: "claude-code", working_dir: "/tmp", session_id: "sess-1" },
	};
}

function makeDecision(overrides: Partial<PolicyDecision> = {}): PolicyDecision {
	return {
		action: "confirm",
		risk: "high",
		rule_id: "BASH.RM_RISK",
		feed_version: "0.1.0",
		...overrides,
	};
}

describe("createOcsfEvent", () => {
	it("creates valid OCSF event", () => {
		const event = createOcsfEvent(makeRequest(), makeDecision());
		expect(event.class_uid).toBe(6003);
		expect(event.class_name).toBe("API Activity");
		expect(event.category_uid).toBe(6);
		expect(event.metadata.product.name).toBe("ClawGuard");
		expect(event.metadata.version).toBe("1.1.0");
	});

	it("maps disposition correctly", () => {
		const allow = createOcsfEvent(makeRequest(), makeDecision({ action: "allow" }));
		expect(allow.disposition_id).toBe(1);
		expect(allow.disposition).toBe("Allowed");

		const log = createOcsfEvent(makeRequest(), makeDecision({ action: "log" }));
		expect(log.disposition_id).toBe(1);
		expect(log.disposition).toBe("Allowed");

		const confirm = createOcsfEvent(makeRequest(), makeDecision({ action: "confirm" }));
		expect(confirm.disposition_id).toBe(2);
		expect(confirm.disposition).toBe("Blocked");

		const deny = createOcsfEvent(makeRequest(), makeDecision({ action: "deny" }));
		expect(deny.disposition_id).toBe(5);
		expect(deny.disposition).toBe("Dropped");
	});

	it("maps severity from risk level", () => {
		const low = createOcsfEvent(makeRequest(), makeDecision({ risk: "low" }));
		expect(low.severity_id).toBe(1);

		const med = createOcsfEvent(makeRequest(), makeDecision({ risk: "medium" }));
		expect(med.severity_id).toBe(3);

		const high = createOcsfEvent(makeRequest(), makeDecision({ risk: "high" }));
		expect(high.severity_id).toBe(4);
	});

	it("includes actor and session info", () => {
		const event = createOcsfEvent(makeRequest(), makeDecision());
		expect(event.actor.session.uid).toBe("sess-1");
		expect(event.actor.app_name).toBe("claude-code");
	});

	it("includes API operation and content", () => {
		const event = createOcsfEvent(makeRequest("git push --force"), makeDecision());
		expect(event.api.operation).toBe("bash");
		expect(event.api.request.data.content).toBe("git push --force");
	});

	it("includes enrichments", () => {
		const event = createOcsfEvent(makeRequest(), makeDecision());
		const enrichMap = Object.fromEntries(event.enrichments.map((e) => [e.name, e.value]));
		expect(enrichMap.rule_id).toBe("BASH.RM_RISK");
		expect(enrichMap.risk_level).toBe("high");
		expect(enrichMap.feed_version).toBe("0.1.0");
		expect(enrichMap.action).toBe("confirm");
	});

	it("includes explain_title when explain is present", () => {
		const decision = makeDecision({
			explain: { title: "大量削除", what: "test", why: [], check: [] },
		});
		const event = createOcsfEvent(makeRequest(), decision);
		const titleEnrich = event.enrichments.find((e) => e.name === "explain_title");
		expect(titleEnrich?.value).toBe("大量削除");
	});

	it("includes extra data in unmapped field", () => {
		const event = createOcsfEvent(makeRequest(), makeDecision(), {
			user_response: "approved",
			exit_code: 0,
		});
		expect(event.unmapped?.user_response).toBe("approved");
		expect(event.unmapped?.exit_code).toBe(0);
	});

	it("time is valid ISO string", () => {
		const event = createOcsfEvent(makeRequest(), makeDecision());
		expect(() => new Date(event.time)).not.toThrow();
		expect(new Date(event.time).getTime()).not.toBeNaN();
	});
});
