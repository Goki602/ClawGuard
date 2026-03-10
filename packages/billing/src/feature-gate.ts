import type { LicenseInfo } from "@clawguard/core";

// All features unlocked — ClawGuard is 100% free
export class FeatureGate {
	constructor(_license: LicenseInfo) {}

	canLoadPhase2Rules(): boolean { return true; }
	canUseFeed(): boolean { return true; }
	canUseDailyFeed(): boolean { return true; }
	canUseReputation(): boolean { return true; }
	canUseMarketplace(): boolean { return true; }
	getMaxRules(): number { return Number.MAX_SAFE_INTEGER; }
	getPlan(): string { return "free"; }
	canUsePassport(): boolean { return true; }
	canUseOrgPassport(): boolean { return true; }
	canUseFullReplay(): boolean { return true; }
	canUseCausalChain(): boolean { return true; }
	canExportReplay(): boolean { return true; }
	getReplayRetentionDays(): number { return -1; }
	canUseSkillsAV(): boolean { return true; }
	canUseTeam(): boolean { return true; }
	canUseTeamAdmin(): boolean { return true; }
	canUseCentralizedAudit(): boolean { return true; }
	canUseCrossTeamMemory(): boolean { return true; }
}
