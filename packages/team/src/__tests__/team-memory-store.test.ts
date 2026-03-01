import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TeamMemoryStore } from "../team-memory-store.js";

describe("TeamMemoryStore", () => {
	let store: TeamMemoryStore;
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "clawguard-tmem-test-"));
		store = new TeamMemoryStore(join(tempDir, "team-memory.db"));
	});

	afterEach(() => {
		store.close();
		if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
	});

	it("returns empty stats initially", () => {
		const stats = store.getTeamStats();
		expect(stats).toEqual([]);
	});

	it("stores and retrieves a single member snapshot", () => {
		store.submitSnapshot("m1", [{ rule_id: "BASH.RM_RISK", total: 10, allowed: 7, denied: 3 }]);
		const stats = store.getTeamStats();
		expect(stats.length).toBe(1);
		expect(stats[0].rule_id).toBe("BASH.RM_RISK");
		expect(stats[0].team_total).toBe(10);
		expect(stats[0].team_allowed).toBe(7);
		expect(stats[0].team_denied).toBe(3);
		expect(stats[0].member_count).toBe(1);
		expect(stats[0].team_override_rate).toBeCloseTo(0.7);
	});

	it("aggregates snapshots from multiple members", () => {
		store.submitSnapshot("m1", [{ rule_id: "BASH.RM_RISK", total: 10, allowed: 8, denied: 2 }]);
		store.submitSnapshot("m2", [{ rule_id: "BASH.RM_RISK", total: 20, allowed: 10, denied: 10 }]);
		const stats = store.getTeamStats();
		expect(stats.length).toBe(1);
		expect(stats[0].team_total).toBe(30);
		expect(stats[0].team_allowed).toBe(18);
		expect(stats[0].team_denied).toBe(12);
		expect(stats[0].member_count).toBe(2);
		expect(stats[0].team_override_rate).toBeCloseTo(0.6);
	});

	it("replaces previous snapshot for same member+rule", () => {
		store.submitSnapshot("m1", [{ rule_id: "R1", total: 5, allowed: 5, denied: 0 }]);
		store.submitSnapshot("m1", [{ rule_id: "R1", total: 10, allowed: 3, denied: 7 }]);
		const stats = store.getTeamStats();
		expect(stats.length).toBe(1);
		expect(stats[0].team_total).toBe(10);
		expect(stats[0].team_allowed).toBe(3);
	});

	it("handles multiple rules in a single snapshot", () => {
		store.submitSnapshot("m1", [
			{ rule_id: "R1", total: 5, allowed: 3, denied: 2 },
			{ rule_id: "R2", total: 8, allowed: 8, denied: 0 },
		]);
		const stats = store.getTeamStats();
		expect(stats.length).toBe(2);
		const r1 = stats.find((s) => s.rule_id === "R1");
		const r2 = stats.find((s) => s.rule_id === "R2");
		expect(r1?.team_total).toBe(5);
		expect(r2?.team_total).toBe(8);
	});

	it("calculates override_rate as 0 for zero total", () => {
		store.submitSnapshot("m1", [{ rule_id: "R1", total: 0, allowed: 0, denied: 0 }]);
		const stats = store.getTeamStats();
		expect(stats[0].team_override_rate).toBe(0);
	});
});
