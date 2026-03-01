import { describe, expect, it, vi } from "vitest";
import type { MarketplaceClient } from "../marketplace.js";
import { RuleCurator } from "../rule-curator.js";
import type { CurationStore } from "../rule-curator.js";
import type { Rule, RulePack } from "../types.js";

function makeRule(id: string, status: "draft" | "recommend" | "active" | "deprecated"): Rule {
	return {
		id,
		match: { tool: "bash", command_regex: ".*" },
		risk: "medium",
		explain: {
			title: "Test",
			what: "test rule",
			why: ["test"],
			check: ["test?"],
		},
		meta: {
			author: "test",
			pack: "test-pack",
			version: "1.0.0",
			tags: ["test"],
			phase: 2,
			marketplace: {
				status,
				downloads: 0,
				rating: 0,
				override_rate: 0,
			},
		},
	};
}

function makePack(name: string, rules: Rule[], daysAgo: number): RulePack {
	return {
		name,
		description: "",
		author: "test",
		version: "1.0.0",
		source: "",
		rules,
		installed_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
	};
}

function createMockMarketplace(packs: RulePack[]): MarketplaceClient {
	return {
		listInstalled: () => packs,
		updateRuleStatus: vi.fn(() => true),
	} as unknown as MarketplaceClient;
}

function createMockStore(
	stats: Record<string, { total: number; override_rate: number }>,
): CurationStore {
	return {
		getStats: (ruleId: string) => stats[ruleId] ?? { total: 0, override_rate: 0 },
	};
}

describe("RuleCurator", () => {
	it("promotes recommend rule with low override rate after 14 days", () => {
		const rule = makeRule("COMMUNITY.GOOD_RULE", "recommend");
		const packs = [makePack("test-pack", [rule], 15)];
		const marketplace = createMockMarketplace(packs);
		const store = createMockStore({
			"COMMUNITY.GOOD_RULE": { total: 150, override_rate: 0.1 },
		});

		const curator = new RuleCurator(marketplace, store);
		const result = curator.evaluate();

		expect(result.tasks).toHaveLength(1);
		expect(result.tasks[0].recommended_action).toBe("promote");
		expect(result.promoted).toContain("COMMUNITY.GOOD_RULE");
		expect(result.deprecated).toHaveLength(0);
	});

	it("deprecates recommend rule with high override rate", () => {
		const rule = makeRule("COMMUNITY.BAD_RULE", "recommend");
		const packs = [makePack("test-pack", [rule], 20)];
		const marketplace = createMockMarketplace(packs);
		const store = createMockStore({
			"COMMUNITY.BAD_RULE": { total: 200, override_rate: 0.6 },
		});

		const curator = new RuleCurator(marketplace, store);
		const result = curator.evaluate();

		expect(result.tasks).toHaveLength(1);
		expect(result.tasks[0].recommended_action).toBe("deprecate");
		expect(result.deprecated).toContain("COMMUNITY.BAD_RULE");
		expect(result.promoted).toHaveLength(0);
	});

	it("keeps recommend rule with insufficient sample size", () => {
		const rule = makeRule("COMMUNITY.NEW_RULE", "recommend");
		const packs = [makePack("test-pack", [rule], 30)];
		const marketplace = createMockMarketplace(packs);
		const store = createMockStore({
			"COMMUNITY.NEW_RULE": { total: 50, override_rate: 0.05 },
		});

		const curator = new RuleCurator(marketplace, store);
		const result = curator.evaluate();

		expect(result.tasks).toHaveLength(1);
		expect(result.tasks[0].recommended_action).toBe("keep");
		expect(result.tasks[0].reason).toContain("Insufficient data");
		expect(result.promoted).toHaveLength(0);
		expect(result.deprecated).toHaveLength(0);
	});

	it("keeps recommend rule that is too early (< 14 days)", () => {
		const rule = makeRule("COMMUNITY.EARLY_RULE", "recommend");
		const packs = [makePack("test-pack", [rule], 7)];
		const marketplace = createMockMarketplace(packs);
		const store = createMockStore({
			"COMMUNITY.EARLY_RULE": { total: 200, override_rate: 0.1 },
		});

		const curator = new RuleCurator(marketplace, store);
		const result = curator.evaluate();

		expect(result.tasks).toHaveLength(1);
		expect(result.tasks[0].recommended_action).toBe("keep");
		expect(result.tasks[0].reason).toContain("too early");
		expect(result.promoted).toHaveLength(0);
	});

	it("deprecates active rule with high override rate", () => {
		const rule = makeRule("COMMUNITY.ACTIVE_BAD", "active");
		const packs = [makePack("test-pack", [rule], 30)];
		const marketplace = createMockMarketplace(packs);
		const store = createMockStore({
			"COMMUNITY.ACTIVE_BAD": { total: 300, override_rate: 0.55 },
		});

		const curator = new RuleCurator(marketplace, store);
		const result = curator.evaluate();

		expect(result.tasks).toHaveLength(1);
		expect(result.tasks[0].recommended_action).toBe("deprecate");
		expect(result.deprecated).toContain("COMMUNITY.ACTIVE_BAD");
	});

	it("skips already deprecated rules", () => {
		const rule = makeRule("COMMUNITY.OLD_RULE", "deprecated");
		const packs = [makePack("test-pack", [rule], 60)];
		const marketplace = createMockMarketplace(packs);
		const store = createMockStore({
			"COMMUNITY.OLD_RULE": { total: 500, override_rate: 0.8 },
		});

		const curator = new RuleCurator(marketplace, store);
		const result = curator.evaluate();

		expect(result.tasks).toHaveLength(0);
		expect(result.promoted).toHaveLength(0);
		expect(result.deprecated).toHaveLength(0);
	});

	it("applyPromotions calls updateRuleStatus correctly", () => {
		const rules = [
			makeRule("COMMUNITY.TO_PROMOTE", "recommend"),
			makeRule("COMMUNITY.TO_DEPRECATE", "recommend"),
		];
		const packs = [makePack("my-pack", rules, 20)];
		const marketplace = createMockMarketplace(packs);
		const store = createMockStore({
			"COMMUNITY.TO_PROMOTE": { total: 200, override_rate: 0.1 },
			"COMMUNITY.TO_DEPRECATE": { total: 200, override_rate: 0.6 },
		});

		const curator = new RuleCurator(marketplace, store);
		const result = curator.evaluate();
		const applied = curator.applyPromotions(result);

		expect(applied).toBe(2);
		expect(marketplace.updateRuleStatus).toHaveBeenCalledWith(
			"my-pack",
			"COMMUNITY.TO_PROMOTE",
			"active",
		);
		expect(marketplace.updateRuleStatus).toHaveBeenCalledWith(
			"my-pack",
			"COMMUNITY.TO_DEPRECATE",
			"deprecated",
		);
	});

	it("returns empty result for empty marketplace", () => {
		const marketplace = createMockMarketplace([]);
		const store = createMockStore({});

		const curator = new RuleCurator(marketplace, store);
		const result = curator.evaluate();

		expect(result.tasks).toHaveLength(0);
		expect(result.promoted).toHaveLength(0);
		expect(result.deprecated).toHaveLength(0);
		expect(result.kept).toHaveLength(0);
		expect(result.evaluated_at).toBeTruthy();
	});
});
