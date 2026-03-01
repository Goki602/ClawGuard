import { DecisionStore, FalsePositiveMonitor } from "@clawguard/memory";
import chalk from "chalk";

export async function monitorCommand(options: {
	alerts?: boolean;
	details?: boolean;
}): Promise<void> {
	const store = new DecisionStore();
	const monitor = new FalsePositiveMonitor(store);

	if (options.details) {
		const stats = monitor.getDetailedStats();
		if (stats.length === 0) {
			console.log(chalk.dim("No decision data yet."));
			store.close();
			return;
		}

		console.log(chalk.bold("Rule Override Rate Details\n"));
		const ruleIds = [...new Set(stats.map((s) => s.rule_id))];
		for (const ruleId of ruleIds) {
			console.log(`  ${chalk.cyan(ruleId)}`);
			const ruleStats = stats.filter((s) => s.rule_id === ruleId);
			for (const s of ruleStats) {
				const pct = (s.override_rate * 100).toFixed(1);
				const color =
					s.override_rate >= 0.5 ? chalk.red : s.override_rate >= 0.3 ? chalk.yellow : chalk.green;
				console.log(`    ${s.period.padEnd(4)} ${color(`${pct}%`)} (${s.total} decisions)`);
			}
		}
		store.close();
		return;
	}

	const alerts = monitor.analyze();
	if (alerts.length === 0) {
		console.log(chalk.green("✓ No false positive alerts. All rules are healthy."));
		store.close();
		return;
	}

	const critical = alerts.filter((a) => a.severity === "critical");
	const warning = alerts.filter((a) => a.severity === "warning");
	const info = alerts.filter((a) => a.severity === "info");

	console.log(chalk.bold("False Positive Monitor\n"));
	console.log(
		`  ${chalk.red(`${critical.length} critical`)}  ${chalk.yellow(`${warning.length} warning`)}  ${chalk.green(`${info.length} healthy`)}\n`,
	);

	const toShow = options.alerts ? alerts.filter((a) => a.severity !== "info") : alerts.slice(0, 10);

	for (const alert of toShow) {
		const icon =
			alert.severity === "critical"
				? chalk.red("✗")
				: alert.severity === "warning"
					? chalk.yellow("⚠")
					: chalk.green("✓");
		const pct = (alert.current_override_rate * 100).toFixed(0);
		console.log(
			`  ${icon} ${chalk.cyan(alert.rule_id)} — ${pct}% override (${alert.sample_size} samples)`,
		);
		console.log(`    ${chalk.dim(alert.reason)}`);
		console.log(`    Suggestion: ${chalk.bold(alert.suggestion)}`);
		console.log("");
	}

	store.close();
}
