import type { LicenseInfo } from "@clawguard/core";
import { describe, expect, it } from "vitest";
import { FeatureGate } from "../feature-gate.js";

function makeLicense(plan: "free" | "pro" | "max"): LicenseInfo {
	const features = {
		free: {
			max_rules: 12,
			feed_interval: "weekly" as const,
			reputation_network: false,
			marketplace: false,
			team: false,
			team_admin: false,
		},
		pro: {
			max_rules: Number.MAX_SAFE_INTEGER,
			feed_interval: "daily" as const,
			reputation_network: true,
			marketplace: true,
			team: true,
			team_admin: false,
		},
		max: {
			max_rules: Number.MAX_SAFE_INTEGER,
			feed_interval: "daily" as const,
			reputation_network: true,
			marketplace: true,
			team: true,
			team_admin: true,
		},
	};
	return { plan, features: features[plan] };
}

describe("FeatureGate", () => {
	it("free plan: blocks phase2 rules, reputation, marketplace", () => {
		const gate = new FeatureGate(makeLicense("free"));
		expect(gate.canLoadPhase2Rules()).toBe(false);
		expect(gate.canUseReputation()).toBe(false);
		expect(gate.canUseMarketplace()).toBe(false);
		expect(gate.canUseFeed()).toBe(true);
		expect(gate.canUseDailyFeed()).toBe(false);
		expect(gate.getMaxRules()).toBe(12);
	});

	it("pro plan: allows all features", () => {
		const gate = new FeatureGate(makeLicense("pro"));
		expect(gate.canLoadPhase2Rules()).toBe(true);
		expect(gate.canUseReputation()).toBe(true);
		expect(gate.canUseMarketplace()).toBe(true);
		expect(gate.canUseFeed()).toBe(true);
		expect(gate.canUseDailyFeed()).toBe(true);
		expect(gate.getMaxRules()).toBe(Number.MAX_SAFE_INTEGER);
	});

	it("max plan: allows all features", () => {
		const gate = new FeatureGate(makeLicense("max"));
		expect(gate.canLoadPhase2Rules()).toBe(true);
		expect(gate.canUseReputation()).toBe(true);
		expect(gate.canUseMarketplace()).toBe(true);
		expect(gate.canUseDailyFeed()).toBe(true);
	});

	it("getPlan returns plan name", () => {
		expect(new FeatureGate(makeLicense("free")).getPlan()).toBe("free");
		expect(new FeatureGate(makeLicense("pro")).getPlan()).toBe("pro");
	});

	describe("Phase 3: Passport & Replay", () => {
		it("canUsePassport: free=false, pro=true, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canUsePassport()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canUsePassport()).toBe(true);
			expect(new FeatureGate(makeLicense("max")).canUsePassport()).toBe(true);
		});

		it("canUseOrgPassport: free=false, pro=false, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canUseOrgPassport()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canUseOrgPassport()).toBe(false);
			expect(new FeatureGate(makeLicense("max")).canUseOrgPassport()).toBe(true);
		});

		it("canUseFullReplay: free=false, pro=true, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canUseFullReplay()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canUseFullReplay()).toBe(true);
			expect(new FeatureGate(makeLicense("max")).canUseFullReplay()).toBe(true);
		});

		it("canUseCausalChain: free=false, pro=true, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canUseCausalChain()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canUseCausalChain()).toBe(true);
			expect(new FeatureGate(makeLicense("max")).canUseCausalChain()).toBe(true);
		});

		it("canExportReplay: free=false, pro=true, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canExportReplay()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canExportReplay()).toBe(true);
			expect(new FeatureGate(makeLicense("max")).canExportReplay()).toBe(true);
		});

		it("getReplayRetentionDays: free=1, pro=-1, max=-1", () => {
			expect(new FeatureGate(makeLicense("free")).getReplayRetentionDays()).toBe(1);
			expect(new FeatureGate(makeLicense("pro")).getReplayRetentionDays()).toBe(-1);
			expect(new FeatureGate(makeLicense("max")).getReplayRetentionDays()).toBe(-1);
		});
	});

	describe("Phase 4: Skills AV, Team, Cross-team Memory", () => {
		it("canUseSkillsAV: free=false, pro=true, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canUseSkillsAV()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canUseSkillsAV()).toBe(true);
			expect(new FeatureGate(makeLicense("max")).canUseSkillsAV()).toBe(true);
		});

		it("canUseTeam: free=false, pro=true, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canUseTeam()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canUseTeam()).toBe(true);
			expect(new FeatureGate(makeLicense("max")).canUseTeam()).toBe(true);
		});

		it("canUseTeamAdmin: free=false, pro=false, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canUseTeamAdmin()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canUseTeamAdmin()).toBe(false);
			expect(new FeatureGate(makeLicense("max")).canUseTeamAdmin()).toBe(true);
		});

		it("canUseCentralizedAudit: free=false, pro=false, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canUseCentralizedAudit()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canUseCentralizedAudit()).toBe(false);
			expect(new FeatureGate(makeLicense("max")).canUseCentralizedAudit()).toBe(true);
		});

		it("canUseCrossTeamMemory: free=false, pro=false, max=true", () => {
			expect(new FeatureGate(makeLicense("free")).canUseCrossTeamMemory()).toBe(false);
			expect(new FeatureGate(makeLicense("pro")).canUseCrossTeamMemory()).toBe(false);
			expect(new FeatureGate(makeLicense("max")).canUseCrossTeamMemory()).toBe(true);
		});
	});
});
