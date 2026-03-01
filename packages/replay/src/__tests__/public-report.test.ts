import { describe, expect, it, vi } from "vitest";
import { ReportGenerator } from "../report-generator.js";

function makeEvent(overrides: Record<string, unknown> = {}) {
	return {
		class_uid: 6003 as const,
		class_name: "API Activity" as const,
		category_uid: 6 as const,
		category_name: "Application Activity" as const,
		severity_id: 2,
		disposition_id: 1,
		disposition: "Allowed",
		time: new Date().toISOString(),
		actor: { session: { uid: "sess-1" }, app_name: "claude-code" },
		api: {
			operation: "PreToolUse",
			request: { data: { content: "ls" } },
		},
		metadata: {
			product: {
				name: "ClawGuard",
				version: "0.1.0",
				vendor_name: "ClawGuard",
			},
			version: "1.1.0",
			log_name: "audit",
		},
		enrichments: [
			{ name: "rule_id", value: "BASH.RM_RISK" },
			{ name: "action", value: "allow" },
			{ name: "risk_level", value: "high" },
			{ name: "feed_version", value: "1.0.0" },
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

function mockMonitor(alerts: Array<{ severity: string }> = []) {
	return {
		analyze: vi.fn().mockReturnValue(alerts),
	} as unknown as import("@clawguard/memory").FalsePositiveMonitor;
}

describe("Public Security Report", () => {
	it("generatePublic returns valid PublicSecurityReport structure", () => {
		const events = [
			makeEvent(),
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.RM" },
					{ name: "action", value: "deny" },
					{ name: "risk_level", value: "high" },
					{ name: "feed_version", value: "1.0.0" },
				],
				disposition_id: 5,
				severity_id: 4,
			}),
		];
		const gen = new ReportGenerator(mockReader(events), mockMonitor(), 10);
		const report = gen.generatePublic();

		expect(report).toHaveProperty("generated_at");
		expect(report).toHaveProperty("period");
		expect(report.period).toHaveProperty("start");
		expect(report.period).toHaveProperty("end");
		expect(report).toHaveProperty("highlights");
		expect(report).toHaveProperty("community_stats");
		expect(report.community_stats).toHaveProperty("total_decisions");
		expect(report.community_stats).toHaveProperty("total_rules_active");
		expect(report.community_stats).toHaveProperty("agents_supported");
		expect(report).toHaveProperty("rule_health");
		expect(report.rule_health).toHaveProperty("total_rules");
		expect(report.rule_health).toHaveProperty("healthy");
		expect(report.rule_health).toHaveProperty("needs_tuning");
		expect(report.rule_health).toHaveProperty("deprecated_this_period");
		expect(report.rule_health).toHaveProperty("promoted_this_period");
		expect(report).toHaveProperty("top_blocked");
		expect(report).toHaveProperty("feed_updates");
		expect(report.feed_updates).toHaveProperty("rules_added");
		expect(report.feed_updates).toHaveProperty("rules_updated");
	});

	it("highlights auto-generated from data (decisions > 0 contains 'decisions evaluated')", () => {
		const events = [makeEvent(), makeEvent()];
		const gen = new ReportGenerator(mockReader(events), mockMonitor(), 5);
		const report = gen.generatePublic();

		const hasDecisionsHighlight = report.highlights.some((h) => h.includes("decisions evaluated"));
		expect(hasDecisionsHighlight).toBe(true);
	});

	it("rule_health counts match (healthy = total - needsTuning)", () => {
		const events = [makeEvent()];
		const alerts = [
			{
				rule_id: "BASH.RM",
				current_override_rate: 0.6,
				baseline_override_rate: 0.5,
				sample_size: 20,
				severity: "critical",
				suggestion: "deprecate",
				reason: "too many overrides",
			},
			{
				rule_id: "BASH.CURL",
				current_override_rate: 0.35,
				baseline_override_rate: 0.3,
				sample_size: 15,
				severity: "warning",
				suggestion: "loosen",
				reason: "slightly aggressive",
			},
			{
				rule_id: "BASH.LS",
				current_override_rate: 0.1,
				baseline_override_rate: 0.1,
				sample_size: 50,
				severity: "info",
				suggestion: "keep",
				reason: "within range",
			},
		];
		const ruleCount = 8;
		const gen = new ReportGenerator(mockReader(events), mockMonitor(alerts), ruleCount);
		const report = gen.generatePublic();

		// 2 alerts with severity warning or critical
		expect(report.rule_health.needs_tuning).toBe(2);
		expect(report.rule_health.healthy).toBe(ruleCount - 2);
		expect(report.rule_health.total_rules).toBe(ruleCount);
	});

	it("top_blocked sorted by count descending", () => {
		const events = [
			// 3 deny events for BASH.RM
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.RM" },
					{ name: "action", value: "deny" },
					{ name: "risk_level", value: "high" },
					{ name: "feed_version", value: "1.0.0" },
				],
			}),
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.RM" },
					{ name: "action", value: "deny" },
					{ name: "risk_level", value: "high" },
					{ name: "feed_version", value: "1.0.0" },
				],
			}),
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.RM" },
					{ name: "action", value: "deny" },
					{ name: "risk_level", value: "high" },
					{ name: "feed_version", value: "1.0.0" },
				],
			}),
			// 1 confirm event for BASH.CURL
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.CURL" },
					{ name: "action", value: "confirm" },
					{ name: "risk_level", value: "medium" },
					{ name: "feed_version", value: "1.0.0" },
				],
			}),
		];
		const gen = new ReportGenerator(mockReader(events), mockMonitor(), 5);
		const report = gen.generatePublic();

		expect(report.top_blocked.length).toBe(2);
		expect(report.top_blocked[0].rule_id).toBe("BASH.RM");
		expect(report.top_blocked[0].count).toBe(3);
		expect(report.top_blocked[0].risk).toBe("high");
		expect(report.top_blocked[1].rule_id).toBe("BASH.CURL");
		expect(report.top_blocked[1].count).toBe(1);
		expect(report.top_blocked[1].risk).toBe("medium");
	});

	it("renderPublicMarkdown produces valid markdown with headers", () => {
		const events = [
			makeEvent(),
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.RM" },
					{ name: "action", value: "deny" },
					{ name: "risk_level", value: "high" },
					{ name: "feed_version", value: "1.0.0" },
				],
				disposition_id: 5,
				severity_id: 4,
			}),
		];
		const gen = new ReportGenerator(mockReader(events), mockMonitor(), 10);
		const report = gen.generatePublic();
		const md = gen.renderPublicMarkdown(report);

		expect(md).toContain("# ClawGuard Public Security Report");
		expect(md).toContain("## Highlights");
		expect(md).toContain("## Community Stats");
		expect(md).toContain("## Rule Health");
		expect(md).toContain("## Top Blocked Operations");
		expect(md).toContain("**Period**:");
		expect(md).toContain("**Generated**:");
		expect(md).toContain("ClawGuard");
		expect(md).toContain("| Metric | Value |");
		expect(md).toContain("| Rule | Count | Risk |");
	});

	it("empty events produce safe defaults (0 decisions, empty highlights)", () => {
		const gen = new ReportGenerator(mockReader([]), mockMonitor(), 0);
		const report = gen.generatePublic();

		expect(report.community_stats.total_decisions).toBe(0);
		expect(report.highlights).toEqual(["Safety score: 100/100 \u2014 excellent"]);
		expect(report.top_blocked).toEqual([]);
		expect(report.rule_health.total_rules).toBe(0);
		expect(report.rule_health.healthy).toBe(0);
		expect(report.rule_health.needs_tuning).toBe(0);
		expect(report.community_stats.agents_supported).toEqual([]);
	});
});
