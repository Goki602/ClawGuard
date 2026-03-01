import { AuditReader } from "@clawguard/audit";
import { CausalAnalyzer, SessionBuilder } from "@clawguard/replay";
import chalk from "chalk";

const ACTION_COLORS: Record<string, (s: string) => string> = {
	allow: chalk.green,
	log: chalk.dim,
	confirm: chalk.yellow,
	deny: chalk.red,
};

export async function replayCommand(
	sessionId: string | undefined,
	options: { list?: boolean; date?: string; causal?: boolean; export?: string },
): Promise<void> {
	const reader = new AuditReader();
	const builder = new SessionBuilder(reader);

	if (options.list || !sessionId) {
		const date = options.date ?? new Date().toISOString().split("T")[0];
		const sessions = builder.listSessions(date);
		if (sessions.length === 0) {
			console.log(chalk.dim(`No sessions found for ${date}.`));
			return;
		}
		console.log(chalk.bold(`Sessions for ${date}`));
		console.log("");
		for (const s of sessions) {
			const incident = s.has_incidents ? chalk.red(" [INCIDENT]") : "";
			console.log(`  ${chalk.cyan(s.session_id)} ${s.agent} (${s.event_count} events)${incident}`);
			console.log(`    ${s.start_time} → ${s.end_time}`);
		}
		return;
	}

	const timeline = builder.buildForSession(sessionId, options.date);
	if (!timeline) {
		console.log(chalk.yellow(`Session ${sessionId} not found.`));
		return;
	}

	if (options.export === "json") {
		if (options.causal) {
			const analyzer = new CausalAnalyzer();
			timeline.causal_chains = analyzer.analyze(timeline.events);
		}
		console.log(JSON.stringify(timeline, null, 2));
		return;
	}

	if (options.export === "markdown") {
		console.log(`# Session: ${timeline.session_id}`);
		console.log(`**Agent**: ${timeline.agent} | **Risk Score**: ${timeline.risk_score}/100`);
		console.log(`**Period**: ${timeline.start_time} → ${timeline.end_time}`);
		console.log("");
		console.log("| Time | Tool | Action | Risk | Content |");
		console.log("|------|------|--------|------|---------|");
		for (const e of timeline.events) {
			console.log(
				`| ${e.time} | ${e.tool} | ${e.action} | ${e.risk} | ${e.content.slice(0, 40)} |`,
			);
		}
		return;
	}

	// Default: terminal timeline
	console.log(chalk.bold(`Session: ${timeline.session_id}`));
	console.log(`  Agent: ${timeline.agent}`);
	console.log(`  Risk Score: ${timeline.risk_score}/100`);
	console.log(`  Period: ${timeline.start_time} → ${timeline.end_time}`);
	console.log(`  Events: ${timeline.events.length}`);
	console.log("");

	for (let i = 0; i < timeline.events.length; i++) {
		const e = timeline.events[i];
		const colorFn = ACTION_COLORS[e.action] ?? chalk.white;
		const flag = e.flagged ? " ⚠" : "";
		console.log(
			`  [${i}] ${chalk.dim(e.time)} ${colorFn(e.action.padEnd(7))} ${e.tool}: ${e.content.slice(0, 60)}${flag}`,
		);
	}

	if (options.causal) {
		console.log("");
		const analyzer = new CausalAnalyzer();
		const links = analyzer.analyze(timeline.events);
		timeline.causal_chains = links;
		console.log(analyzer.formatChain(timeline.events, links));
	}
}
