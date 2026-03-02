import { AuditReader } from "@clawguard/audit";
import { DecisionStore, FalsePositiveMonitor } from "@clawguard/memory";
import { ReportGenerator } from "@clawguard/replay";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		invalidWeek: "無効な週オフセット",
		title: "ClawGuard 週次レポート",
		period: (start: string, end: string) => `期間: ${start} — ${end}`,
		safetyScore: (score: string) => `安全スコア: ${score}`,
		decisions: "判定",
		total: (n: number) => `合計: ${n}`,
		allowed: (n: string) => `許可: ${n}`,
		confirmed: (n: string) => `確認: ${n}`,
		denied: (n: string) => `拒否: ${n}`,
		incidents: (n: string) => `インシデント: ${n}`,
		sessions: (n: number) => `セッション: ${n}`,
		topRules: "トップルール",
		hits: "件",
		agents: "エージェント",
		agentDecisions: "判定",
		trends: "トレンド（前週比）",
		trendsTotal: (arrow: string, n: number) => `合計: ${arrow} ${n}`,
		trendsDenied: (arrow: string, n: number) => `拒否: ${arrow} ${n}`,
	},
	en: {
		invalidWeek: "Invalid week offset",
		title: "ClawGuard Weekly Report",
		period: (start: string, end: string) => `Period: ${start} — ${end}`,
		safetyScore: (score: string) => `Safety Score: ${score}`,
		decisions: "Decisions",
		total: (n: number) => `Total: ${n}`,
		allowed: (n: string) => `Allowed: ${n}`,
		confirmed: (n: string) => `Confirmed: ${n}`,
		denied: (n: string) => `Denied: ${n}`,
		incidents: (n: string) => `Incidents: ${n}`,
		sessions: (n: number) => `Sessions: ${n}`,
		topRules: "Top Rules",
		hits: "hits",
		agents: "Agents",
		agentDecisions: "decisions",
		trends: "Trends (vs. previous week)",
		trendsTotal: (arrow: string, n: number) => `Total: ${arrow} ${n}`,
		trendsDenied: (arrow: string, n: number) => `Denied: ${arrow} ${n}`,
	},
};

export async function reportCommand(options: {
	week?: string;
	output?: string;
	public?: boolean;
}): Promise<void> {
	const m = MSG[detectLocale()];
	const reader = new AuditReader();
	const store = new DecisionStore();
	const monitor = new FalsePositiveMonitor(store);
	const gen = new ReportGenerator(reader, monitor);

	const weekOffset = options.week ? Number.parseInt(options.week, 10) : 0;
	if (Number.isNaN(weekOffset)) {
		console.error(m.invalidWeek);
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
	console.log(chalk.bold(m.title));
	console.log(`  ${m.period(report.period.start, report.period.end)}`);
	console.log("");

	const scoreColor =
		report.safety_score >= 80 ? chalk.green : report.safety_score >= 50 ? chalk.yellow : chalk.red;
	console.log(`  ${m.safetyScore(scoreColor(`${report.safety_score}/100`))}`);
	console.log("");

	console.log(chalk.bold(`  ${m.decisions}`));
	console.log(`    ${m.total(report.total_decisions)}`);
	console.log(`    ${m.allowed(chalk.green(report.decision_breakdown.allowed))}`);
	console.log(`    ${m.confirmed(chalk.yellow(report.decision_breakdown.confirmed))}`);
	console.log(`    ${m.denied(chalk.red(report.decision_breakdown.denied))}`);
	console.log(
		`    ${m.incidents(report.incidents === 0 ? chalk.green("0") : chalk.red(report.incidents))}`,
	);
	console.log(`    ${m.sessions(report.sessions)}`);
	console.log("");

	if (report.top_rules.length > 0) {
		console.log(chalk.bold(`  ${m.topRules}`));
		for (const rule of report.top_rules.slice(0, 5)) {
			console.log(`    ${rule.rule_id}: ${rule.count} ${m.hits}`);
		}
		console.log("");
	}

	if (report.agents.length > 0) {
		console.log(chalk.bold(`  ${m.agents}`));
		for (const agent of report.agents) {
			console.log(`    ${agent.name}: ${agent.decision_count} ${m.agentDecisions}`);
		}
		console.log("");
	}

	const totalArrow = report.trends.vs_previous_week.total_diff >= 0 ? "↑" : "↓";
	const denyArrow = report.trends.vs_previous_week.deny_diff >= 0 ? "↑" : "↓";
	console.log(chalk.bold(`  ${m.trends}`));
	console.log(
		`    ${m.trendsTotal(totalArrow, Math.abs(report.trends.vs_previous_week.total_diff))}`,
	);
	console.log(
		`    ${m.trendsDenied(denyArrow, Math.abs(report.trends.vs_previous_week.deny_diff))}`,
	);
	store.close();
}
