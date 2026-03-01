import { describe, expect, it, vi } from "vitest";
import { ReportGenerator } from "../report-generator.js";

function makeEvent(overrides: Record<string, unknown> = {}) {
	return {
		class_uid: 6003 as const,
		class_name: "API Activity" as const,
		category_uid: 6 as const,
		category_name: "Application Activity" as const,
		severity_id: 1,
		time: new Date().toISOString(),
		metadata: {
			product: {
				name: "ClawGuard",
				version: "0.1.0",
				vendor_name: "ClawGuard",
			},
			version: "1.1.0",
			log_name: "policy_decision",
		},
		actor: { session: { uid: "sess-1" }, app_name: "claude" },
		api: { operation: "bash", request: { data: { content: "ls" } } },
		disposition_id: 1,
		disposition: "Allowed",
		enrichments: [
			{ name: "rule_id", value: "BASH.LS" },
			{ name: "risk_level", value: "low" },
			{ name: "feed_version", value: "1.0.0" },
			{ name: "action", value: "allow" },
		],
		...overrides,
	};
}

function today(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mockReader(events: ReturnType<typeof makeEvent>[] = [], dates: string[] = [today()]) {
	return {
		readDate: vi.fn().mockReturnValue(events),
		readToday: vi.fn().mockReturnValue(events),
		listDates: vi.fn().mockReturnValue(dates),
	} as unknown as import("@clawguard/audit").AuditReader;
}

describe("ReportGenerator", () => {
	it("generates weekly report with correct aggregation", () => {
		const events = [
			makeEvent(),
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.RM" },
					{ name: "risk_level", value: "high" },
					{ name: "feed_version", value: "1.0.0" },
					{ name: "action", value: "deny" },
				],
				disposition_id: 5,
				severity_id: 4,
			}),
		];
		const gen = new ReportGenerator(mockReader(events));
		const report = gen.generateWeekly();
		expect(report.total_decisions).toBe(2);
		expect(report.decision_breakdown.allowed).toBe(1);
		expect(report.decision_breakdown.denied).toBe(1);
		expect(report.incidents).toBe(1);
	});

	it("computes safety score with incident bonus", () => {
		const events = [makeEvent(), makeEvent()];
		const gen = new ReportGenerator(mockReader(events));
		const report = gen.generateWeekly();
		// 100 - 0 deny - 0 confirm + 5 zero-incident bonus = 100 (capped)
		expect(report.safety_score).toBe(100);
	});

	it("renders Markdown correctly", () => {
		const events = [makeEvent()];
		const gen = new ReportGenerator(mockReader(events));
		const report = gen.generateWeekly();
		const md = gen.renderMarkdown(report);
		expect(md).toContain("# ClawGuard Weekly Report");
		expect(md).toContain("Safety Score");
		expect(md).toContain("Decision Summary");
		expect(md).toContain("Top Rules");
	});
});
