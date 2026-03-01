import { MarketplaceClient, RuleCurator } from "@clawguard/core";
import { DecisionStore } from "@clawguard/memory";
import chalk from "chalk";

export async function marketplaceCommand(action?: string, source?: string): Promise<void> {
	const client = new MarketplaceClient();

	switch (action) {
		case "installed": {
			const packs = client.listInstalled();
			if (packs.length === 0) {
				console.log(chalk.dim("No rule packs installed."));
				return;
			}
			console.log(chalk.bold("Installed Rule Packs"));
			for (const pack of packs) {
				console.log(`  ${chalk.cyan(pack.name)} v${pack.version} by ${pack.author}`);
				console.log(`    ${pack.rules.length} rules, installed ${pack.installed_at ?? "unknown"}`);
			}
			break;
		}

		case "install": {
			if (!source) {
				console.error(chalk.red("Usage: claw-guard marketplace install <source-dir>"));
				process.exit(1);
			}
			try {
				const name = source.split("/").pop() ?? source;
				const pack = client.installFromDir(source, name);
				console.log(
					`${chalk.green("✓")} Installed pack: ${pack.name} (${pack.rules.length} rules)`,
				);
				console.log(chalk.dim("  Rules start in recommend mode (log-only) for 2 weeks."));
			} catch (err) {
				console.error(
					chalk.red(`Install failed: ${err instanceof Error ? err.message : String(err)}`),
				);
				process.exit(1);
			}
			break;
		}

		case "remove": {
			if (!source) {
				console.error(chalk.red("Usage: claw-guard marketplace remove <name>"));
				process.exit(1);
			}
			if (client.uninstallPack(source)) {
				console.log(`${chalk.green("✓")} Removed pack: ${source}`);
			} else {
				console.log(chalk.yellow(`Pack not found: ${source}`));
			}
			break;
		}

		case "curate": {
			const store = new DecisionStore();
			const curator = new RuleCurator(client, store);
			const result = curator.evaluate();

			if (result.tasks.length === 0) {
				console.log(chalk.dim("No marketplace rules to curate."));
				store.close();
				return;
			}

			console.log(chalk.bold("Rule Curation Analysis\n"));
			console.log(
				`  ${chalk.green(`${result.promoted.length} promote`)}  ${chalk.red(`${result.deprecated.length} deprecate`)}  ${chalk.dim(`${result.kept.length} keep`)}\n`,
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
					`  ${icon} ${chalk.cyan(task.rule_id)} [${task.current_status}] — ${pct}% override (${task.sample_size} samples, ${task.days_in_current_status}d)`,
				);
				console.log(`    ${chalk.dim(task.reason)}`);
			}

			if (source === "--apply") {
				const applied = curator.applyPromotions(result);
				console.log(`\n${chalk.green("✓")} Applied ${applied} status changes.`);
			} else if (result.promoted.length > 0 || result.deprecated.length > 0) {
				console.log(
					chalk.dim(
						`\nDry run. Use ${chalk.cyan("claw-guard marketplace curate --apply")} to apply changes.`,
					),
				);
			}

			store.close();
			break;
		}

		default: {
			console.log(chalk.bold("ClawGuard Rule Marketplace"));
			console.log("");
			console.log("Commands:");
			console.log(`  ${chalk.cyan("claw-guard marketplace installed")}  — Show installed packs`);
			console.log(
				`  ${chalk.cyan("claw-guard marketplace install <dir>")} — Install from directory`,
			);
			console.log(`  ${chalk.cyan("claw-guard marketplace remove <name>")} — Remove a pack`);
			console.log(
				`  ${chalk.cyan("claw-guard marketplace curate")}     — Analyze rules for promotion/deprecation`,
			);
			break;
		}
	}
}
