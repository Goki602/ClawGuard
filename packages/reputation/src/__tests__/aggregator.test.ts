import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ReputationData } from "@clawguard/core";
import { DecisionStore } from "@clawguard/memory";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ReputationAggregator } from "../reputation-aggregator.js";

describe("ReputationAggregator", () => {
	let tmpDir: string;
	let store: DecisionStore;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "cg-rep-"));
		store = new DecisionStore(join(tmpDir, "test.db"));
	});

	afterEach(() => {
		store.close();
		rmSync(tmpDir, { recursive: true, force: true });
	});

	it("returns empty entry when no data", () => {
		const agg = new ReputationAggregator(store);
		const rep = agg.getReputation("BASH.RM_RISK");
		expect(rep.rule_id).toBe("BASH.RM_RISK");
		expect(rep.community_total).toBe(0);
	});

	it("returns local-only stats", () => {
		store.record({ rule_id: "BASH.RM_RISK", action: "allow", content_hash: "abc" });
		store.record({ rule_id: "BASH.RM_RISK", action: "deny", content_hash: "def" });
		store.record({ rule_id: "BASH.RM_RISK", action: "allow", content_hash: "ghi" });

		const agg = new ReputationAggregator(store);
		const rep = agg.getReputation("BASH.RM_RISK");
		expect(rep.community_total).toBe(3);
		expect(rep.community_allowed).toBe(2);
		expect(rep.community_denied).toBe(1);
	});

	it("returns feed-only stats when no local data", () => {
		const feedData: ReputationData = {
			version: "1.0",
			entries: [
				{
					rule_id: "BASH.RM_RISK",
					community_total: 500,
					community_allowed: 400,
					community_denied: 100,
					community_override_rate: 0.8,
					last_updated: "2026-03-01T00:00:00Z",
				},
			],
		};

		const agg = new ReputationAggregator(store, feedData);
		const rep = agg.getReputation("BASH.RM_RISK");
		expect(rep.community_total).toBe(500);
		expect(rep.community_override_rate).toBe(0.8);
	});

	it("merges local and feed data with feed weight 80% for large samples", () => {
		store.record({ rule_id: "BASH.RM_RISK", action: "allow", content_hash: "a" });
		store.record({ rule_id: "BASH.RM_RISK", action: "deny", content_hash: "b" });

		const feedData: ReputationData = {
			version: "1.0",
			entries: [
				{
					rule_id: "BASH.RM_RISK",
					community_total: 200,
					community_allowed: 160,
					community_denied: 40,
					community_override_rate: 0.8,
					last_updated: "2026-03-01T00:00:00Z",
				},
			],
		};

		const agg = new ReputationAggregator(store, feedData);
		const rep = agg.getReputation("BASH.RM_RISK");
		expect(rep.community_total).toBe(202);
		// Feed weight 80% because sample > 100
		expect(rep.community_override_rate).toBeCloseTo(0.5 * 0.2 + 0.8 * 0.8, 2);
	});

	it("formatForDialog returns null when insufficient data", () => {
		const agg = new ReputationAggregator(store);
		expect(agg.formatForDialog("BASH.RM_RISK")).toBeNull();
	});

	it("formatForDialog returns formatted string with sufficient data", () => {
		const feedData: ReputationData = {
			version: "1.0",
			entries: [
				{
					rule_id: "BASH.RM_RISK",
					community_total: 1000,
					community_allowed: 870,
					community_denied: 130,
					community_override_rate: 0.87,
					last_updated: "2026-03-01T00:00:00Z",
				},
			],
		};

		const agg = new ReputationAggregator(store, feedData);
		const msg = agg.formatForDialog("BASH.RM_RISK");
		expect(msg).toContain("87%");
		expect(msg).toContain("1,000");
	});

	it("generateTelemetrySnapshot only includes local data", () => {
		const feedData: ReputationData = {
			version: "1.0",
			entries: [
				{
					rule_id: "BASH.RM_RISK",
					community_total: 100,
					community_allowed: 80,
					community_denied: 20,
					community_override_rate: 0.8,
					last_updated: "2026-03-01T00:00:00Z",
				},
			],
		};

		store.record({ rule_id: "BASH.RM_RISK", action: "allow", content_hash: "x" });

		const agg = new ReputationAggregator(store, feedData);
		const snapshot = agg.generateTelemetrySnapshot();

		expect(snapshot.entries).toHaveLength(1);
		expect(snapshot.entries[0].rule_id).toBe("BASH.RM_RISK");
		expect(snapshot.entries[0].total).toBe(1);
		expect(snapshot.generated_at).toBeTruthy();
	});
});
