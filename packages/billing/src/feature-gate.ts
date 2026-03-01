import type { LicenseInfo } from "@clawguard/core";

export class FeatureGate {
	private license: LicenseInfo;

	constructor(license: LicenseInfo) {
		this.license = license;
	}

	canLoadPhase2Rules(): boolean {
		return this.license.plan === "pro" || this.license.plan === "max";
	}

	canUseFeed(): boolean {
		return true;
	}

	canUseDailyFeed(): boolean {
		return this.license.features.feed_interval === "daily";
	}

	canUseReputation(): boolean {
		return this.license.features.reputation_network;
	}

	canUseMarketplace(): boolean {
		return this.license.features.marketplace;
	}

	getMaxRules(): number {
		return this.license.features.max_rules;
	}

	getPlan(): string {
		return this.license.plan;
	}

	canUsePassport(): boolean {
		return this.license.plan === "pro" || this.license.plan === "max";
	}

	canUseOrgPassport(): boolean {
		return this.license.plan === "max";
	}

	canUseFullReplay(): boolean {
		return this.license.plan === "pro" || this.license.plan === "max";
	}

	canUseCausalChain(): boolean {
		return this.license.plan === "pro" || this.license.plan === "max";
	}

	canExportReplay(): boolean {
		return this.license.plan === "pro" || this.license.plan === "max";
	}

	getReplayRetentionDays(): number {
		return this.license.plan === "free" ? 1 : -1;
	}

	canUseSkillsAV(): boolean {
		return this.license.features.team || this.license.plan === "pro" || this.license.plan === "max";
	}

	canUseTeam(): boolean {
		return this.license.features.team;
	}

	canUseTeamAdmin(): boolean {
		return this.license.features.team_admin;
	}

	canUseCentralizedAudit(): boolean {
		return this.license.plan === "max";
	}

	canUseCrossTeamMemory(): boolean {
		return this.license.plan === "max";
	}
}
