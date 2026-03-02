import { DecisionStore, FalsePositiveMonitor } from "@clawguard/memory";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		noData: "判定データがまだありません。",
		detailsTitle: "ルール上書き率の詳細",
		decisions: "判定",
		allHealthy: "誤検知アラートなし。全ルール正常です。",
		monitorTitle: "誤検知モニター",
		critical: "重大",
		warning: "警告",
		healthy: "正常",
		override: "上書き",
		samples: "サンプル",
		suggestion: "提案:",
	},
	en: {
		noData: "No decision data yet.",
		detailsTitle: "Rule Override Rate Details",
		decisions: "decisions",
		allHealthy: "No false positive alerts. All rules are healthy.",
		monitorTitle: "False Positive Monitor",
		critical: "critical",
		warning: "warning",
		healthy: "healthy",
		override: "override",
		samples: "samples",
		suggestion: "Suggestion:",
	},
};

export async function monitorCommand(options: {
	alerts?: boolean;
	details?: boolean;
}): Promise<void> {
	const m = MSG[detectLocale()];
	const store = new DecisionStore();
	const monitor = new FalsePositiveMonitor(store);

	if (options.details) {
		const stats = monitor.getDetailedStats();
		if (stats.length === 0) {
			console.log(chalk.dim(m.noData));
			store.close();
			return;
		}

		console.log(chalk.bold(`${m.detailsTitle}\n`));
		const ruleIds = [...new Set(stats.map((s) => s.rule_id))];
		for (const ruleId of ruleIds) {
			console.log(`  ${chalk.cyan(ruleId)}`);
			const ruleStats = stats.filter((s) => s.rule_id === ruleId);
			for (const s of ruleStats) {
				const pct = (s.override_rate * 100).toFixed(1);
				const color =
					s.override_rate >= 0.5 ? chalk.red : s.override_rate >= 0.3 ? chalk.yellow : chalk.green;
				console.log(`    ${s.period.padEnd(4)} ${color(`${pct}%`)} (${s.total} ${m.decisions})`);
			}
		}
		store.close();
		return;
	}

	const alerts = monitor.analyze();
	if (alerts.length === 0) {
		console.log(chalk.green(`✓ ${m.allHealthy}`));
		store.close();
		return;
	}

	const critical = alerts.filter((a) => a.severity === "critical");
	const warning = alerts.filter((a) => a.severity === "warning");
	const info = alerts.filter((a) => a.severity === "info");

	console.log(chalk.bold(`${m.monitorTitle}\n`));
	console.log(
		`  ${chalk.red(`${critical.length} ${m.critical}`)}  ${chalk.yellow(`${warning.length} ${m.warning}`)}  ${chalk.green(`${info.length} ${m.healthy}`)}\n`,
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
			`  ${icon} ${chalk.cyan(alert.rule_id)} — ${pct}% ${m.override} (${alert.sample_size} ${m.samples})`,
		);
		console.log(`    ${chalk.dim(alert.reason)}`);
		console.log(`    ${m.suggestion} ${chalk.bold(alert.suggestion)}`);
		console.log("");
	}

	store.close();
}
