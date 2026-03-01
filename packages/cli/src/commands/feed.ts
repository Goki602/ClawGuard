import { resolveConfig } from "@clawguard/core";
import { FeedClient } from "@clawguard/feed";
import chalk from "chalk";

export async function feedCommand(options: { update?: boolean; status?: boolean }): Promise<void> {
	const config = resolveConfig();
	const client = new FeedClient(config.feed);

	if (options.update) {
		console.log("Fetching latest feed...");
		const bundle = await client.fetchLatest();
		if (bundle) {
			console.log(`${chalk.green("✓")} Feed updated: v${bundle.manifest.version}`);
			console.log(`  Rules: ${bundle.rules.length}`);
			console.log(`  Reputation entries: ${bundle.reputation.entries.length}`);
		} else {
			console.log(chalk.yellow("Feed fetch failed. Using cached version if available."));
		}
		return;
	}

	// Default: show status
	const status = client.getStatus();
	console.log(chalk.bold("Feed Status"));
	if (status.status === "none") {
		console.log(`  Status: ${chalk.dim("no feed cached")}`);
		console.log(`  Run ${chalk.cyan("claw-guard feed --update")} to fetch the latest feed.`);
	} else {
		const statusColor =
			status.status === "fresh"
				? chalk.green
				: status.status === "stale"
					? chalk.yellow
					: chalk.red;
		console.log(`  Version: ${status.version}`);
		console.log(`  Age: ${status.age} days`);
		console.log(`  Status: ${statusColor(status.status)}`);
	}
}
