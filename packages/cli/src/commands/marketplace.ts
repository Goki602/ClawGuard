import { MarketplaceClient, RuleCurator } from "@clawguard/core";
import { DecisionStore } from "@clawguard/memory";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		noPacksInstalled: "インストール済みのルールパックはありません。",
		installedTitle: "インストール済みルールパック",
		rulesInstalled: (count: number, date: string) => `${count} ルール, インストール日 ${date}`,
		usageInstall: "使い方: claw-guard marketplace install <ソースディレクトリ>",
		installedPack: (name: string, count: number) => `パック追加: ${name} (${count} ルール)`,
		recommendNote: "ルールは2週間 recommend モード（ログのみ）で開始します。",
		installFailed: "インストール失敗:",
		usageRemove: "使い方: claw-guard marketplace remove <名前>",
		removedPack: "パック削除:",
		packNotFound: "パックが見つかりません:",
		noCurate: "キュレーション対象のルールはありません。",
		curationTitle: "ルールキュレーション分析",
		promote: "昇格",
		deprecate: "非推奨",
		keep: "維持",
		override: "上書き",
		samples: "サンプル",
		appliedChanges: (n: number) => `${n}件のステータスを更新しました。`,
		dryRun: (cmd: string) => `ドライラン。${cmd} で適用できます。`,
		marketplaceTitle: "ClawGuard ルールマーケットプレイス",
		commands: "コマンド:",
		cmdInstalled: "インストール済みパックを表示",
		cmdInstall: "ディレクトリからインストール",
		cmdRemove: "パックを削除",
		cmdCurate: "ルールの昇格/非推奨を分析",
	},
	en: {
		noPacksInstalled: "No rule packs installed.",
		installedTitle: "Installed Rule Packs",
		rulesInstalled: (count: number, date: string) => `${count} rules, installed ${date}`,
		usageInstall: "Usage: claw-guard marketplace install <source-dir>",
		installedPack: (name: string, count: number) => `Installed pack: ${name} (${count} rules)`,
		recommendNote: "Rules start in recommend mode (log-only) for 2 weeks.",
		installFailed: "Install failed:",
		usageRemove: "Usage: claw-guard marketplace remove <name>",
		removedPack: "Removed pack:",
		packNotFound: "Pack not found:",
		noCurate: "No marketplace rules to curate.",
		curationTitle: "Rule Curation Analysis",
		promote: "promote",
		deprecate: "deprecate",
		keep: "keep",
		override: "override",
		samples: "samples",
		appliedChanges: (n: number) => `Applied ${n} status changes.`,
		dryRun: (cmd: string) => `Dry run. Use ${cmd} to apply changes.`,
		marketplaceTitle: "ClawGuard Rule Marketplace",
		commands: "Commands:",
		cmdInstalled: "Show installed packs",
		cmdInstall: "Install from directory",
		cmdRemove: "Remove a pack",
		cmdCurate: "Analyze rules for promotion/deprecation",
	},
};

export async function marketplaceCommand(action?: string, source?: string): Promise<void> {
	const m = MSG[detectLocale()];
	const client = new MarketplaceClient();

	switch (action) {
		case "installed": {
			const packs = client.listInstalled();
			if (packs.length === 0) {
				console.log(chalk.dim(m.noPacksInstalled));
				return;
			}
			console.log(chalk.bold(m.installedTitle));
			for (const pack of packs) {
				console.log(`  ${chalk.cyan(pack.name)} v${pack.version} by ${pack.author}`);
				console.log(`    ${m.rulesInstalled(pack.rules.length, pack.installed_at ?? "unknown")}`);
			}
			break;
		}

		case "install": {
			if (!source) {
				console.error(chalk.red(m.usageInstall));
				process.exit(1);
			}
			try {
				const name = source.split("/").pop() ?? source;
				const pack = client.installFromDir(source, name);
				console.log(`${chalk.green("✓")} ${m.installedPack(pack.name, pack.rules.length)}`);
				console.log(chalk.dim(`  ${m.recommendNote}`));
			} catch (err) {
				console.error(
					chalk.red(`${m.installFailed} ${err instanceof Error ? err.message : String(err)}`),
				);
				process.exit(1);
			}
			break;
		}

		case "remove": {
			if (!source) {
				console.error(chalk.red(m.usageRemove));
				process.exit(1);
			}
			if (client.uninstallPack(source)) {
				console.log(`${chalk.green("✓")} ${m.removedPack} ${source}`);
			} else {
				console.log(chalk.yellow(`${m.packNotFound} ${source}`));
			}
			break;
		}

		case "curate": {
			const store = new DecisionStore();
			const curator = new RuleCurator(client, store);
			const result = curator.evaluate();

			if (result.tasks.length === 0) {
				console.log(chalk.dim(m.noCurate));
				store.close();
				return;
			}

			console.log(chalk.bold(`${m.curationTitle}\n`));
			console.log(
				`  ${chalk.green(`${result.promoted.length} ${m.promote}`)}  ${chalk.red(`${result.deprecated.length} ${m.deprecate}`)}  ${chalk.dim(`${result.kept.length} ${m.keep}`)}\n`,
			);

			for (const task of result.tasks) {
				const icon =
					task.recommended_action === "promote"
						? chalk.green("↑")
						: task.recommended_action === "deprecate"
							? chalk.red("↓")
							: chalk.dim("—");
				const pct = (task.override_rate * 100).toFixed(0);
				console.log(
					`  ${icon} ${chalk.cyan(task.rule_id)} [${task.current_status}] — ${pct}% ${m.override} (${task.sample_size} ${m.samples}, ${task.days_in_current_status}d)`,
				);
				console.log(`    ${chalk.dim(task.reason)}`);
			}

			if (source === "--apply") {
				const applied = curator.applyPromotions(result);
				console.log(`\n${chalk.green("✓")} ${m.appliedChanges(applied)}`);
			} else if (result.promoted.length > 0 || result.deprecated.length > 0) {
				console.log(
					chalk.dim(`\n${m.dryRun(chalk.cyan("claw-guard marketplace curate --apply"))}`),
				);
			}

			store.close();
			break;
		}

		default: {
			console.log(chalk.bold(m.marketplaceTitle));
			console.log("");
			console.log(`${m.commands}`);
			console.log(`  ${chalk.cyan("claw-guard marketplace installed")}  — ${m.cmdInstalled}`);
			console.log(`  ${chalk.cyan("claw-guard marketplace install <dir>")} — ${m.cmdInstall}`);
			console.log(`  ${chalk.cyan("claw-guard marketplace remove <name>")} — ${m.cmdRemove}`);
			console.log(`  ${chalk.cyan("claw-guard marketplace curate")}     — ${m.cmdCurate}`);
			break;
		}
	}
}
