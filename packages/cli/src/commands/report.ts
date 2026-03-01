import { AuditReader } from "@clawguard/audit";
import { DecisionStore, FalsePositiveMonitor } from "@clawguard/memory";
import { ReportGenerator } from "@clawguard/replay";
import chalk from "chalk";

export async function reportCommand(options: {
	week?: string;
	output?: string;
	public?: boolean;
}): Promise<void> {
	const reader = new AuditReader();
	const store = new DecisionStore();
	const monitor = new FalsePositiveMonitor(store);
	const gen = new ReportGenerator(reader, monitor);

	const weekOffset = options.week ? Number.parseInt(options.week, 10) : 0;
	if (Number.isNaN(weekOffset)) {
		console.error("Invalid week offset");
		process.exit(1);
	}

	if (options.public) {
		const publicReport = gen.generatePublic(weekOffset);
		if (options.output === "json") {
			console.log(JSON.stringify(publicReport, null, 2));
		} else {
			console.log(gen.renderPublicMarkdown(publicReport));
		}
		store.close();
		return;
	}

	const report = gen.generateWeekly(weekOffset);

	if (options.output === "json") {
		console.log(JSON.stringify(report, null, 2));
		return;
	}

	if (options.output === "markdown") {
		console.log(gen.renderMarkdown(report));
		return;
	}

	// Default: terminal output
	console.log(chalk.bold("ClawGuard Weekly Report"));
	console.log(`  Period: ${report.period.start} — ${report.period.end}`);
	console.log("");

	const scoreColor =
		report.safety_score >= 80 ? chalk.green : report.safety_score >= 50 ? chalk.yellow : chalk.red;
	console.log(`  Safety Score: ${scoreColor(`${report.safety_score}/100`)}`);
	console.log("");

	console.log(chalk.bold("  Decisions"));
	console.log(`    Total: ${report.total_decisions}`);
	console.log(`    Allowed: ${chalk.green(report.decision_breakdown.allowed)}`);
	console.log(`    Confirmed: ${chalk.yellow(report.decision_breakdown.confirmed)}`);
	console.log(`    Denied: ${chalk.red(report.decision_breakdown.denied)}`);
	console.log(
		`    Incidents: ${report.incidents === 0 ? chalk.green("0") : chalk.red(report.incidents)}`,
	);
	console.log(`    Sessions: ${report.sessions}`);
	console.log("");

	if (report.top_rules.length > 0) {
		console.log(chalk.bold("  Top Rules"));
		for (const rule of report.top_rules.slice(0, 5)) {
			console.log(`    ${rule.rule_id}: ${rule.count} hits`);
		}
		console.log("");
	}

	if (report.agents.length > 0) {
		console.log(chalk.bold("  Agents"));
		for (const agent of report.agents) {
			console.log(`    ${agent.name}: ${agent.decision_count} decisions`);
		}
		console.log("");
	}

	const totalArrow = report.trends.vs_previous_week.total_diff >= 0 ? "↑" : "↓";
	const denyArrow = report.trends.vs_previous_week.deny_diff >= 0 ? "↑" : "↓";
	console.log(chalk.bold("  Trends (vs. previous week)"));
	console.log(`    Total: ${totalArrow} ${Math.abs(report.trends.vs_previous_week.total_diff)}`);
	console.log(`    Denied: ${denyArrow} ${Math.abs(report.trends.vs_previous_week.deny_diff)}`);
	store.close();
}
