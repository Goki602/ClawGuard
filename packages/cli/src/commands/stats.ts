import { DecisionStore } from "@clawguard/memory";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		title: "ClawGuard 判断サマリー",
		today: "今日",
		allTime: "全期間",
		autoAllowed: "自動許可（確認を節約）",
		totalDecisions: "判断総数",
		allowed: "許可",
		confirmed: "確認要求",
		denied: "拒否",
		agents: "エージェント数",
		noData: "まだ判断データがありません。claw-guard init を実行してAIエージェントを使い始めてください。",
	},
	en: {
		title: "ClawGuard Decision Summary",
		today: "Today",
		allTime: "All Time",
		autoAllowed: "Auto-allowed (confirmations saved)",
		totalDecisions: "Total decisions",
		allowed: "Allowed",
		confirmed: "Confirmations",
		denied: "Denied",
		agents: "Agents",
		noData: "No decision data yet. Run claw-guard init and start using your AI agent.",
	},
};

export async function statsCommand(): Promise<void> {
	const m = MSG[detectLocale()];
	const store = new DecisionStore();

	try {
		const all = store.getStatsSummary();
		if (all.total === 0 && all.autoAllowed === 0) {
			console.log(m.noData);
			return;
		}

		const today = store.getTodayStats();

		console.log(chalk.bold(`\n${m.title}\n`));

		console.log(chalk.underline(m.today));
		console.log(`  ${chalk.green(`${today.autoAllowed}`)} ${m.autoAllowed}`);
		console.log(`  ${today.total} ${m.totalDecisions}  |  ${chalk.green(today.allowed)} ${m.allowed}  |  ${chalk.yellow(today.confirmed)} ${m.confirmed}  |  ${chalk.red(today.denied)} ${m.denied}`);

		console.log(chalk.underline(`\n${m.allTime}`));
		console.log(`  ${chalk.green.bold(`${all.autoAllowed}`)} ${m.autoAllowed}`);
		console.log(`  ${all.total} ${m.totalDecisions}  |  ${chalk.green(all.allowed)} ${m.allowed}  |  ${chalk.yellow(all.confirmed)} ${m.confirmed}  |  ${chalk.red(all.denied)} ${m.denied}`);
		if (all.agents > 0) {
			console.log(`  ${all.agents} ${m.agents}`);
		}
		console.log();
	} finally {
		store.close();
	}
}
