import type { LicenseInfo } from "@clawguard/core";
import { describe, expect, it } from "vitest";
import { FeatureGate } from "../feature-gate.js";

function makeLicense(plan: "free" | "pro" | "max"): LicenseInfo {
	return {
		plan,
		features: {
			max_rules: Number.MAX_SAFE_INTEGER,
			feed_interval: "daily",
			reputation_network: true,
			marketplace: true,
			team: true,
			team_admin: true,
		},
	};
}

describe("FeatureGate (all features free)", () => {
	it("all plans unlock all features", () => {
		for (const plan of ["free", "pro", "max"] as const) {
			const gate = new FeatureGate(makeLicense(plan));
			expect(gate.canLoadPhase2Rules()).toBe(true);
			expect(gate.canUseFeed()).toBe(true);
			expect(gate.canUseDailyFeed()).toBe(true);
			expect(gate.canUseReputation()).toBe(true);
			expect(gate.canUseMarketplace()).toBe(true);
			expect(gate.getMaxRules()).toBe(Number.MAX_SAFE_INTEGER);
			expect(gate.canUsePassport()).toBe(true);
			expect(gate.canUseOrgPassport()).toBe(true);
			expect(gate.canUseFullReplay()).toBe(true);
			expect(gate.canUseCausalChain()).toBe(true);
			expect(gate.canExportReplay()).toBe(true);
			expect(gate.getReplayRetentionDays()).toBe(-1);
			expect(gate.canUseSkillsAV()).toBe(true);
			expect(gate.canUseTeam()).toBe(true);
			expect(gate.canUseTeamAdmin()).toBe(true);
			expect(gate.canUseCentralizedAudit()).toBe(true);
			expect(gate.canUseCrossTeamMemory()).toBe(true);
		}
	});

	it("getPlan returns free", () => {
		expect(new FeatureGate(makeLicense("free")).getPlan()).toBe("free");
	});
});
