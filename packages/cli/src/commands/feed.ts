import { resolveConfig } from "@clawguard/core";
import { FeedClient } from "@clawguard/feed";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		fetching: "最新フィードを取得中...",
		updated: (version: string) => `Feed updated: v${version}`,
		rules: (count: number) => `  ルール: ${count}`,
		reputation: (count: number) => `  評判データ: ${count}`,
		fetchFailed: "フィード取得に失敗。キャッシュがあれば使用します。",
		statusTitle: "フィード状態",
		noCached: "キャッシュなし",
		runUpdate: (cmd: string) => `  ${cmd} で最新を取得できます。`,
		version: (v: string) => `  バージョン: ${v}`,
		age: (days: number) => `  経過: ${days}日`,
		status: (s: string) => `  状態: ${s}`,
	},
	en: {
		fetching: "Fetching latest feed...",
		updated: (version: string) => `Feed updated: v${version}`,
		rules: (count: number) => `  Rules: ${count}`,
		reputation: (count: number) => `  Reputation entries: ${count}`,
		fetchFailed: "Feed fetch failed. Using cached version if available.",
		statusTitle: "Feed Status",
		noCached: "no feed cached",
		runUpdate: (cmd: string) => `  Run ${cmd} to fetch the latest feed.`,
		version: (v: string) => `  Version: ${v}`,
		age: (days: number) => `  Age: ${days} days`,
		status: (s: string) => `  Status: ${s}`,
	},
};

export async function feedCommand(options: { update?: boolean; status?: boolean }): Promise<void> {
	const m = MSG[detectLocale()];
	const config = resolveConfig();
	const client = new FeedClient(config.feed);

	if (options.update) {
		console.log(m.fetching);
		const bundle = await client.fetchLatest();
		if (bundle) {
			console.log(`${chalk.green("✓")} ${m.updated(bundle.manifest.version)}`);
			console.log(m.rules(bundle.rules.length));
			console.log(m.reputation(bundle.reputation.entries.length));
		} else {
			console.log(chalk.yellow(m.fetchFailed));
		}
		return;
	}

	// Default: show status
	const status = client.getStatus();
	console.log(chalk.bold(m.statusTitle));
	if (status.status === "none") {
		console.log(m.status(chalk.dim(m.noCached)));
		console.log(m.runUpdate(chalk.cyan("claw-guard feed --update")));
	} else {
		const statusColor =
			status.status === "fresh"
				? chalk.green
				: status.status === "stale"
					? chalk.yellow
					: chalk.red;
		console.log(m.version(status.version));
		console.log(m.age(status.age));
		console.log(m.status(statusColor(status.status)));
	}
}
