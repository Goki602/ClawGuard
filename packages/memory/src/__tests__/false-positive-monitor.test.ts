import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DecisionStore } from "../decision-store.js";
import { FalsePositiveMonitor } from "../false-positive-monitor.js";

const TEST_DB = join(tmpdir(), `clawguard-fp-test-${Date.now()}.db`);

function cleanup() {
	if (existsSync(TEST_DB)) rmSync(TEST_DB);
	if (existsSync(`${TEST_DB}-wal`)) rmSync(`${TEST_DB}-wal`);
	if (existsSync(`${TEST_DB}-shm`)) rmSync(`${TEST_DB}-shm`);
}

describe("FalsePositiveMonitor", () => {
	let store: DecisionStore;
	let monitor: FalsePositiveMonitor;

	beforeEach(() => {
		cleanup();
		store = new DecisionStore(TEST_DB);
		monitor = new FalsePositiveMonitor(store);
	});

	afterEach(() => {
		store.close();
		cleanup();
	});

	it("override_rate >= 50% returns critical severity with deprecate suggestion", () => {
		for (let i = 0; i < 8; i++) {
			store.record({
				rule_id: "BASH.RM_RISK",
				action: "allow",
				content_hash: `h${i}`,
			});
		}
		for (let i = 0; i < 2; i++) {
			store.record({
				rule_id: "BASH.RM_RISK",
				action: "deny",
				content_hash: `d${i}`,
			});
		}

		const alerts = monitor.analyze();
		expect(alerts.length).toBe(1);
		expect(alerts[0].severity).toBe("critical");
		expect(alerts[0].suggestion).toBe("deprecate");
		expect(alerts[0].current_override_rate).toBeGreaterThanOrEqual(0.5);
		expect(alerts[0].reason).toContain("50%");
	});

	it("override_rate 30-49% returns warning severity with loosen suggestion", () => {
		for (let i = 0; i < 4; i++) {
			store.record({
				rule_id: "BASH.GIT_FORCE",
				action: "allow",
				content_hash: `h${i}`,
			});
		}
		for (let i = 0; i < 6; i++) {
			store.record({
				rule_id: "BASH.GIT_FORCE",
				action: "deny",
				content_hash: `d${i}`,
			});
		}

		const alerts = monitor.analyze();
		expect(alerts.length).toBe(1);
		expect(alerts[0].severity).toBe("warning");
		expect(alerts[0].suggestion).toBe("loosen");
		expect(alerts[0].current_override_rate).toBeGreaterThanOrEqual(0.3);
		expect(alerts[0].current_override_rate).toBeLessThan(0.5);
	});

	it("override_rate < 20% returns info severity with keep suggestion", () => {
		for (let i = 0; i < 1; i++) {
			store.record({
				rule_id: "BASH.CURL_PIPE",
				action: "allow",
				content_hash: `h${i}`,
			});
		}
		for (let i = 0; i < 9; i++) {
			store.record({
				rule_id: "BASH.CURL_PIPE",
				action: "deny",
				content_hash: `d${i}`,
			});
		}

		const alerts = monitor.analyze();
		expect(alerts.length).toBe(1);
		expect(alerts[0].severity).toBe("info");
		expect(alerts[0].suggestion).toBe("keep");
		expect(alerts[0].current_override_rate).toBeLessThan(0.2);
	});

	it("sample_size < 10 is skipped from results", () => {
		for (let i = 0; i < 9; i++) {
			store.record({
				rule_id: "BASH.SMALL_SAMPLE",
				action: "allow",
				content_hash: `h${i}`,
			});
		}

		const alerts = monitor.analyze();
		expect(alerts.length).toBe(0);
	});

	it("getAllRuleIds returns distinct rule IDs", () => {
		store.record({
			rule_id: "BASH.RM_RISK",
			action: "allow",
			content_hash: "a",
		});
		store.record({
			rule_id: "BASH.RM_RISK",
			action: "deny",
			content_hash: "b",
		});
		store.record({
			rule_id: "BASH.GIT_FORCE",
			action: "confirm",
			content_hash: "c",
		});
		store.record({
			rule_id: "NET.CURL_PIPE",
			action: "allow",
			content_hash: "d",
		});

		const ids = store.getAllRuleIds();
		expect(ids).toHaveLength(3);
		expect(ids).toContain("BASH.RM_RISK");
		expect(ids).toContain("BASH.GIT_FORCE");
		expect(ids).toContain("NET.CURL_PIPE");
	});

	it("getStatsWindowed returns time-filtered stats", () => {
		const now = new Date();
		const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
		const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
		const fiftyDaysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);

		store.record({
			rule_id: "BASH.TIME_TEST",
			action: "allow",
			content_hash: "recent",
			timestamp: fiveDaysAgo.toISOString(),
		});
		store.record({
			rule_id: "BASH.TIME_TEST",
			action: "deny",
			content_hash: "mid",
			timestamp: twentyDaysAgo.toISOString(),
		});
		store.record({
			rule_id: "BASH.TIME_TEST",
			action: "allow",
			content_hash: "old",
			timestamp: fiftyDaysAgo.toISOString(),
		});

		const stats7d = store.getStatsWindowed("BASH.TIME_TEST", 7);
		expect(stats7d.period).toBe("7d");
		expect(stats7d.total).toBe(1);
		expect(stats7d.allowed).toBe(1);

		const stats30d = store.getStatsWindowed("BASH.TIME_TEST", 30);
		expect(stats30d.period).toBe("30d");
		expect(stats30d.total).toBe(2);
		expect(stats30d.allowed).toBe(1);
		expect(stats30d.denied).toBe(1);

		const allStats = store.getStats("BASH.TIME_TEST");
		expect(allStats.total).toBe(3);
	});

	it("getDetailedStats returns all rules x 3 periods (7d, 30d, all)", () => {
		for (let i = 0; i < 5; i++) {
			store.record({
				rule_id: "BASH.RULE_A",
				action: "allow",
				content_hash: `a${i}`,
			});
		}
		for (let i = 0; i < 3; i++) {
			store.record({
				rule_id: "BASH.RULE_B",
				action: "deny",
				content_hash: `b${i}`,
			});
		}

		const detailed = monitor.getDetailedStats();
		expect(detailed.length).toBe(6);

		const ruleAStats = detailed.filter((s) => s.rule_id === "BASH.RULE_A");
		expect(ruleAStats).toHaveLength(3);
		const periods = ruleAStats.map((s) => s.period).sort();
		expect(periods).toEqual(["30d", "7d", "all"]);

		const ruleAAll = ruleAStats.find((s) => s.period === "all");
		expect(ruleAAll?.total).toBe(5);
		expect(ruleAAll?.allowed).toBe(5);
	});

	it("empty database returns empty alerts array", () => {
		const alerts = monitor.analyze();
		expect(alerts).toEqual([]);
	});
});
