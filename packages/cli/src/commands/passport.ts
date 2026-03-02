import { AuditReader } from "@clawguard/audit";
import { BadgeGenerator, PassportGenerator } from "@clawguard/passport";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const MSG = {
	ja: {
		generating: "セキュリティパスポートを生成中...",
		generated: "パスポートを生成しました",
		repository: "リポジトリ:",
		monitoringSince: "監視開始:",
		totalDecisions: "判定総数:",
		incidents: "インシデント:",
		agents: "エージェント:",
		none: "なし",
		noPassportGenerate: "パスポートが見つかりません。--generate で生成してください。",
		badgeMarkdown: "バッジ Markdown:",
		noPassport: "パスポートが見つかりません。",
		runGenerate: (cmd: string) => `${cmd} で作成できます。`,
		passportTitle: "セキュリティパスポート",
		version: "バージョン:",
		lastUpdated: "最終更新:",
		allowed: "許可:",
		confirmed: "確認:",
		denied: "拒否:",
		signature: "署名:",
		signed: "署名済み",
		unsigned: "未署名",
	},
	en: {
		generating: "Generating security passport...",
		generated: "Passport generated",
		repository: "Repository:",
		monitoringSince: "Monitoring since:",
		totalDecisions: "Total decisions:",
		incidents: "Incidents:",
		agents: "Agents:",
		none: "none",
		noPassportGenerate: "No passport found. Run with --generate first.",
		badgeMarkdown: "Badge Markdown:",
		noPassport: "No passport found.",
		runGenerate: (cmd: string) => `Run ${cmd} to create one.`,
		passportTitle: "Security Passport",
		version: "Version:",
		lastUpdated: "Last updated:",
		allowed: "Allowed:",
		confirmed: "Confirmed:",
		denied: "Denied:",
		signature: "Signature:",
		signed: "signed",
		unsigned: "unsigned",
	},
};

export async function passportCommand(options: {
	generate?: boolean;
	repo?: string;
	badge?: boolean;
}): Promise<void> {
	const m = MSG[detectLocale()];
	const reader = new AuditReader();
	const gen = new PassportGenerator(reader);

	if (options.generate) {
		const repo = options.repo ?? "unknown/repo";
		console.log(m.generating);
		const passport = gen.generate({ repository: repo });
		gen.save(passport);
		console.log(`${chalk.green("✓")} ${m.generated}`);
		console.log(`  ${m.repository} ${passport.repository}`);
		console.log(`  ${m.monitoringSince} ${passport.monitoring_since}`);
		console.log(`  ${m.totalDecisions} ${passport.summary.total_decisions}`);
		console.log(`  ${m.incidents} ${passport.summary.incidents}`);
		console.log(`  ${m.agents} ${passport.agents_monitored.join(", ") || m.none}`);
		return;
	}

	if (options.badge) {
		const passport = gen.load();
		if (!passport) {
			console.log(chalk.yellow(m.noPassportGenerate));
			return;
		}
		const badge = new BadgeGenerator();
		console.log(chalk.bold(m.badgeMarkdown));
		console.log("");
		console.log(badge.generateMarkdown(passport));
		return;
	}

	// Default: show current passport
	const passport = gen.load();
	if (!passport) {
		console.log(chalk.dim(m.noPassport));
		console.log(m.runGenerate(chalk.cyan("claw-guard passport --generate --repo <repo>")));
		return;
	}

	console.log(chalk.bold(m.passportTitle));
	console.log(`  ${m.version} ${passport.version}`);
	console.log(`  ${m.repository} ${passport.repository}`);
	console.log(`  ${m.monitoringSince} ${passport.monitoring_since}`);
	console.log(`  ${m.lastUpdated} ${passport.last_updated}`);
	console.log(`  ${m.totalDecisions} ${passport.summary.total_decisions}`);
	console.log(`    ${m.allowed} ${chalk.green(passport.summary.allowed)}`);
	console.log(`    ${m.confirmed} ${chalk.yellow(passport.summary.confirmed)}`);
	console.log(`    ${m.denied} ${chalk.red(passport.summary.denied)}`);
	console.log(
		`  ${m.incidents} ${passport.summary.incidents === 0 ? chalk.green("0") : chalk.red(passport.summary.incidents)}`,
	);
	console.log(`  ${m.agents} ${passport.agents_monitored.join(", ") || m.none}`);
	console.log(
		`  ${m.signature} ${passport.signature ? chalk.green(m.signed) : chalk.dim(m.unsigned)}`,
	);
}
