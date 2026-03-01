import { LicenseManager } from "@clawguard/billing";
import chalk from "chalk";

export async function upgradeCommand(plan?: string, options?: { key?: string }): Promise<void> {
	const manager = new LicenseManager();

	if (options?.key) {
		const license = manager.saveLicense(options.key);
		if (license.plan === "free") {
			console.log(chalk.red("Invalid license key. Staying on free plan."));
		} else {
			console.log(
				`${chalk.green("✓")} License activated: ${chalk.bold(license.plan.toUpperCase())} plan`,
			);
			console.log(
				`  Daily feed: ${license.features.feed_interval === "daily" ? "enabled" : "disabled"}`,
			);
			console.log(
				`  Reputation network: ${license.features.reputation_network ? "enabled" : "disabled"}`,
			);
			console.log(`  Marketplace: ${license.features.marketplace ? "enabled" : "disabled"}`);
		}
		return;
	}

	const current = manager.getCurrentLicense();
	console.log(chalk.bold("ClawGuard Subscription"));
	console.log(`  Current plan: ${chalk.cyan(current.plan.toUpperCase())}`);
	console.log("");

	if (current.plan === "free") {
		console.log("Upgrade options:");
		console.log(
			`  ${chalk.green("Pro")}  $12/month — Daily feed, reputation network, marketplace, unlimited rules`,
		);
		console.log(
			`  ${chalk.blue("Max")}  $39/month — All Pro features + team management, cross-team memory`,
		);
		console.log("");
		console.log(`Activate: ${chalk.cyan("claw-guard upgrade --key <your-license-key>")}`);
	} else {
		console.log("Features:");
		console.log("  Rules: unlimited");
		console.log(`  Feed: ${current.features.feed_interval}`);
		console.log(`  Reputation: ${current.features.reputation_network ? "enabled" : "disabled"}`);
		console.log(`  Marketplace: ${current.features.marketplace ? "enabled" : "disabled"}`);
	}
}
