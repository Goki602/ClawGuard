import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PassportGenerator } from "../passport-generator.js";

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

describe("PassportGenerator", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "passport-test-"));
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("generates passport from empty logs", () => {
		const reader = {
			readDate: vi.fn().mockReturnValue([]),
			readToday: vi.fn().mockReturnValue([]),
			listDates: vi.fn().mockReturnValue([]),
		} as unknown as import("@clawguard/audit").AuditReader;
		const gen = new PassportGenerator(reader, join(tmpDir, "passport.json"));
		const passport = gen.generate({ repository: "test/repo" });
		expect(passport.version).toBe("1.0");
		expect(passport.repository).toBe("test/repo");
		expect(passport.summary.total_decisions).toBe(0);
		expect(passport.agents_monitored).toEqual([]);
	});

	it("aggregates events across multiple dates", () => {
		const events1 = [makeEvent(), makeEvent()];
		const events2 = [
			makeEvent({
				actor: { session: { uid: "sess-2" }, app_name: "codex" },
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
		const reader = {
			readDate: vi
				.fn()
				.mockImplementation((date: string) => (date === "2026-03-01" ? events1 : events2)),
			readToday: vi.fn().mockReturnValue([]),
			listDates: vi.fn().mockReturnValue(["2026-03-01", "2026-03-02"]),
		} as unknown as import("@clawguard/audit").AuditReader;
		const gen = new PassportGenerator(reader, join(tmpDir, "passport.json"));
		const passport = gen.generate({ repository: "test/repo" });
		expect(passport.summary.total_decisions).toBe(3);
		expect(passport.summary.allowed).toBe(2);
		expect(passport.summary.denied).toBe(1);
		expect(passport.summary.incidents).toBe(1);
		expect(passport.monitoring_since).toBe("2026-03-01");
		expect(passport.agents_monitored).toEqual(["claude", "codex"]);
	});

	it("save and load round-trips", () => {
		const reader = {
			readDate: vi.fn().mockReturnValue([makeEvent()]),
			readToday: vi.fn().mockReturnValue([]),
			listDates: vi.fn().mockReturnValue(["2026-03-01"]),
		} as unknown as import("@clawguard/audit").AuditReader;
		const path = join(tmpDir, "passport.json");
		const gen = new PassportGenerator(reader, path);
		const passport = gen.generate({
			repository: "test/repo",
			feedVersion: "2.0.0",
		});
		gen.save(passport);
		expect(existsSync(path)).toBe(true);
		const loaded = gen.load();
		expect(loaded).not.toBeNull();
		expect(loaded?.repository).toBe("test/repo");
		expect(loaded?.feed_version).toBe("2.0.0");
	});

	it("load returns null when no passport exists", () => {
		const reader = {
			readDate: vi.fn(),
			readToday: vi.fn(),
			listDates: vi.fn().mockReturnValue([]),
		} as unknown as import("@clawguard/audit").AuditReader;
		const gen = new PassportGenerator(reader, join(tmpDir, "nonexistent.json"));
		expect(gen.load()).toBeNull();
	});

	it("counts incidents correctly (deny + high severity only)", () => {
		const events = [
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
			makeEvent({
				enrichments: [
					{ name: "rule_id", value: "BASH.ENV" },
					{ name: "risk_level", value: "medium" },
					{ name: "feed_version", value: "1.0.0" },
					{ name: "action", value: "deny" },
				],
				disposition_id: 5,
				severity_id: 3,
			}),
		];
		const reader = {
			readDate: vi.fn().mockReturnValue(events),
			readToday: vi.fn().mockReturnValue([]),
			listDates: vi.fn().mockReturnValue(["2026-03-01"]),
		} as unknown as import("@clawguard/audit").AuditReader;
		const gen = new PassportGenerator(reader, join(tmpDir, "passport.json"));
		const passport = gen.generate({ repository: "test/repo" });
		expect(passport.summary.denied).toBe(2);
		expect(passport.summary.incidents).toBe(1); // only the high severity one
	});
});
