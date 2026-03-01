import { describe, expect, it, vi } from "vitest";
import { SessionBuilder } from "../session-builder.js";

function makeEvent(overrides: Record<string, unknown> = {}) {
	return {
		class_uid: 6003 as const,
		class_name: "API Activity" as const,
		category_uid: 6 as const,
		category_name: "Application Activity" as const,
		severity_id: 1,
		time: "2026-03-01T10:00:00Z",
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
		api: { operation: "bash", request: { data: { content: "ls -la" } } },
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

function mockReader(events: ReturnType<typeof makeEvent>[] = []) {
	return {
		readDate: vi.fn().mockReturnValue(events),
		readToday: vi.fn().mockReturnValue(events),
		listDates: vi.fn().mockReturnValue(["2026-03-01"]),
	} as unknown as import("@clawguard/audit").AuditReader;
}

describe("SessionBuilder", () => {
	it("groups events by session ID", () => {
		const events = [
			makeEvent({
				actor: { session: { uid: "sess-1" }, app_name: "claude" },
			}),
			makeEvent({
				actor: { session: { uid: "sess-2" }, app_name: "codex" },
			}),
			makeEvent({
				actor: { session: { uid: "sess-1" }, app_name: "claude" },
			}),
		];
		const builder = new SessionBuilder(mockReader(events));
		const timelines = builder.buildForDate("2026-03-01");
		expect(timelines).toHaveLength(2);
		expect(timelines.find((t) => t.session_id === "sess-1")?.events).toHaveLength(2);
		expect(timelines.find((t) => t.session_id === "sess-2")?.events).toHaveLength(1);
	});

	it("converts OcsfEvent to ReplayEvent correctly", () => {
		const events = [makeEvent()];
		const builder = new SessionBuilder(mockReader(events));
		const timelines = builder.buildForDate("2026-03-01");
		const ev = timelines[0].events[0];
		expect(ev.action).toBe("allow");
		expect(ev.tool).toBe("bash");
		expect(ev.content).toBe("ls -la");
		expect(ev.rule_id).toBe("BASH.LS");
		expect(ev.risk).toBe("low");
		expect(ev.flagged).toBe(false);
	});

	it("flags confirm and deny events", () => {
		const events = [
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.RM" },
					{ name: "risk_level", value: "high" },
					{ name: "feed_version", value: "1.0.0" },
					{ name: "action", value: "deny" },
				],
			}),
		];
		const builder = new SessionBuilder(mockReader(events));
		const timelines = builder.buildForDate("2026-03-01");
		expect(timelines[0].events[0].flagged).toBe(true);
	});

	it("computes risk score correctly", () => {
		const events = [
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.RM" },
					{ name: "risk_level", value: "high" },
					{ name: "feed_version", value: "1.0.0" },
					{ name: "action", value: "deny" },
				],
			}),
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.CURL" },
					{ name: "risk_level", value: "medium" },
					{ name: "feed_version", value: "1.0.0" },
					{ name: "action", value: "confirm" },
				],
			}),
		];
		const builder = new SessionBuilder(mockReader(events));
		const timelines = builder.buildForDate("2026-03-01");
		// 100 - 1*15 - 1*5 = 80
		expect(timelines[0].risk_score).toBe(80);
	});

	it("clamps risk score to 0-100 range", () => {
		const events = Array.from({ length: 10 }, () =>
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.RM" },
					{ name: "risk_level", value: "high" },
					{ name: "feed_version", value: "1.0.0" },
					{ name: "action", value: "deny" },
				],
			}),
		);
		const builder = new SessionBuilder(mockReader(events));
		const timelines = builder.buildForDate("2026-03-01");
		// 100 - 10*15 = -50, clamped to 0
		expect(timelines[0].risk_score).toBe(0);
	});

	it("returns empty array for dates with no events", () => {
		const builder = new SessionBuilder(mockReader([]));
		const timelines = builder.buildForDate("2026-03-01");
		expect(timelines).toHaveLength(0);
	});

	it("listSessions returns correct summary", () => {
		const events = [
			makeEvent({ time: "2026-03-01T10:00:00Z" }),
			makeEvent({ time: "2026-03-01T10:05:00Z" }),
		];
		const builder = new SessionBuilder(mockReader(events));
		const sessions = builder.listSessions("2026-03-01");
		expect(sessions).toHaveLength(1);
		expect(sessions[0].event_count).toBe(2);
		expect(sessions[0].agent).toBe("claude");
		expect(sessions[0].has_incidents).toBe(false);
	});

	it("buildForSession finds specific session", () => {
		const events = [
			makeEvent({
				actor: { session: { uid: "sess-1" }, app_name: "claude" },
			}),
			makeEvent({
				actor: { session: { uid: "sess-2" }, app_name: "codex" },
			}),
		];
		const reader = mockReader(events);
		const builder = new SessionBuilder(reader);
		const timeline = builder.buildForSession("sess-2", "2026-03-01");
		expect(timeline).not.toBeNull();
		expect(timeline?.session_id).toBe("sess-2");
		expect(timeline?.agent).toBe("codex");
	});

	it("buildForSession returns null for unknown session", () => {
		const builder = new SessionBuilder(mockReader([]));
		const timeline = builder.buildForSession("nonexistent", "2026-03-01");
		expect(timeline).toBeNull();
	});
});
