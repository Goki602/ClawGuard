import { AuditReader } from "@clawguard/audit";
import { BadgeGenerator, PassportGenerator } from "@clawguard/passport";
import chalk from "chalk";

export async function passportCommand(options: {
	generate?: boolean;
	repo?: string;
	badge?: boolean;
}): Promise<void> {
	const reader = new AuditReader();
	const gen = new PassportGenerator(reader);

	if (options.generate) {
		const repo = options.repo ?? "unknown/repo";
		console.log("Generating security passport...");
		const passport = gen.generate({ repository: repo });
		gen.save(passport);
		console.log(`${chalk.green("✓")} Passport generated`);
		console.log(`  Repository: ${passport.repository}`);
		console.log(`  Monitoring since: ${passport.monitoring_since}`);
		console.log(`  Total decisions: ${passport.summary.total_decisions}`);
		console.log(`  Incidents: ${passport.summary.incidents}`);
		console.log(`  Agents: ${passport.agents_monitored.join(", ") || "none"}`);
		return;
	}

	if (options.badge) {
		const passport = gen.load();
		if (!passport) {
			console.log(chalk.yellow("No passport found. Run with --generate first."));
			return;
		}
		const badge = new BadgeGenerator();
		console.log(chalk.bold("Badge Markdown:"));
		console.log("");
		console.log(badge.generateMarkdown(passport));
		return;
	}

	// Default: show current passport
	const passport = gen.load();
	if (!passport) {
		console.log(chalk.dim("No passport found."));
		console.log(`Run ${chalk.cyan("claw-guard passport --generate --repo <repo>")} to create one.`);
		return;
	}

	console.log(chalk.bold("Security Passport"));
	console.log(`  Version: ${passport.version}`);
	console.log(`  Repository: ${passport.repository}`);
	console.log(`  Monitoring since: ${passport.monitoring_since}`);
	console.log(`  Last updated: ${passport.last_updated}`);
	console.log(`  Total decisions: ${passport.summary.total_decisions}`);
	console.log(`    Allowed: ${chalk.green(passport.summary.allowed)}`);
	console.log(`    Confirmed: ${chalk.yellow(passport.summary.confirmed)}`);
	console.log(`    Denied: ${chalk.red(passport.summary.denied)}`);
	console.log(
		`  Incidents: ${passport.summary.incidents === 0 ? chalk.green("0") : chalk.red(passport.summary.incidents)}`,
	);
	console.log(`  Agents: ${passport.agents_monitored.join(", ") || "none"}`);
	console.log(`  Signature: ${passport.signature ? chalk.green("signed") : chalk.dim("unsigned")}`);
}
