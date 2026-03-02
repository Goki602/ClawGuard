import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { BillingPlan, LicenseInfo } from "@clawguard/core";

const FREE_LICENSE: LicenseInfo = {
	plan: "free",
	features: {
		max_rules: 8,
		feed_interval: "weekly",
		reputation_network: false,
		marketplace: false,
		team: false,
		team_admin: false,
	},
};

const PLAN_FEATURES: Record<BillingPlan, LicenseInfo["features"]> = {
	free: FREE_LICENSE.features,
	pro: {
		max_rules: Number.MAX_SAFE_INTEGER,
		feed_interval: "daily",
		reputation_network: true,
		marketplace: true,
		team: true,
		team_admin: false,
	},
	max: {
		max_rules: Number.MAX_SAFE_INTEGER,
		feed_interval: "daily",
		reputation_network: true,
		marketplace: true,
		team: true,
		team_admin: true,
	},
};

const KEY_REGEX = /^cg_(free|pro|max)_([0-9a-f]{32})$/;

export function parseKey(key: string): { plan: BillingPlan; id: string } | null {
	const m = KEY_REGEX.exec(key);
	if (!m) return null;
	return { plan: m[1] as BillingPlan, id: m[2] };
}

export class LicenseManager {
	private configPath: string;

	constructor(configDir?: string) {
		const dir = configDir ?? join(homedir(), ".config", "clawguard");
		this.configPath = join(dir, "license.json");
	}

	getCurrentLicense(): LicenseInfo {
		if (!existsSync(this.configPath)) return { ...FREE_LICENSE };
		try {
			const data = JSON.parse(readFileSync(this.configPath, "utf-8"));
			const key: string = data.key ?? "";
			return this.validate(key);
		} catch {
			return { ...FREE_LICENSE };
		}
	}

	validate(key: string): LicenseInfo {
		const parsed = parseKey(key);
		if (!parsed) return { ...FREE_LICENSE };
		return {
			plan: parsed.plan,
			key,
			features: { ...PLAN_FEATURES[parsed.plan] },
		};
	}

	saveLicense(key: string): LicenseInfo {
		const license = this.validate(key);
		const dir = dirname(this.configPath);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
		writeFileSync(this.configPath, JSON.stringify({ key }, null, "\t"), "utf-8");
		return license;
	}

	removeLicense(): void {
		const dir = dirname(this.configPath);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
		writeFileSync(this.configPath, JSON.stringify({}, null, "\t"), "utf-8");
	}
}
