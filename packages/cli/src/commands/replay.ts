import { AuditReader } from "@clawguard/audit";
import { CausalAnalyzer, SessionBuilder } from "@clawguard/replay";
import chalk from "chalk";
import { detectLocale } from "../locale.js";

const ACTION_COLORS: Record<string, (s: string) => string> = {
	allow: chalk.green,
	log: chalk.dim,
	confirm: chalk.yellow,
	deny: chalk.red,
};

const MSG = {
	ja: {
		noSessions: (date: string) => `${date} のセッションはありません。`,
		sessionsFor: (date: string) => `${date} のセッション`,
		events: "イベント",
		sessionNotFound: (id: string) => `セッション ${id} が見つかりません。`,
		session: (id: string) => `セッション: ${id}`,
		agent: (name: string) => `エージェント: ${name}`,
		riskScore: (score: number) => `リスクスコア: ${score}/100`,
		period: (start: string, end: string) => `期間: ${start} → ${end}`,
		eventCount: (n: number) => `イベント: ${n}`,
	},
	en: {
		noSessions: (date: string) => `No sessions found for ${date}.`,
		sessionsFor: (date: string) => `Sessions for ${date}`,
		events: "events",
		sessionNotFound: (id: string) => `Session ${id} not found.`,
		session: (id: string) => `Session: ${id}`,
		agent: (name: string) => `Agent: ${name}`,
		riskScore: (score: number) => `Risk Score: ${score}/100`,
		period: (start: string, end: string) => `Period: ${start} → ${end}`,
		eventCount: (n: number) => `Events: ${n}`,
	},
};

export async function replayCommand(
	sessionId: string | undefined,
	options: { list?: boolean; date?: string; causal?: boolean; export?: string },
): Promise<void> {
	const m = MSG[detectLocale()];
	const reader = new AuditReader();
	const builder = new SessionBuilder(reader);

	if (options.list || !sessionId) {
		const date = options.date ?? new Date().toISOString().split("T")[0];
		const sessions = builder.listSessions(date);
		if (sessions.length === 0) {
			console.log(chalk.dim(m.noSessions(date)));
			return;
		}
		console.log(chalk.bold(m.sessionsFor(date)));
		console.log("");
		for (const s of sessions) {
			const incident = s.has_incidents ? chalk.red(" [INCIDENT]") : "";
			console.log(
				`  ${chalk.cyan(s.session_id)} ${s.agent} (${s.event_count} ${m.events})${incident}`,
			);
			console.log(`    ${s.start_time} → ${s.end_time}`);
		}
		return;
	}

	const timeline = builder.buildForSession(sessionId, options.date);
	if (!timeline) {
		console.log(chalk.yellow(m.sessionNotFound(sessionId)));
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
	console.log(chalk.bold(m.session(timeline.session_id)));
	console.log(`  ${m.agent(timeline.agent)}`);
	console.log(`  ${m.riskScore(timeline.risk_score)}`);
	console.log(`  ${m.period(timeline.start_time, timeline.end_time)}`);
	console.log(`  ${m.eventCount(timeline.events.length)}`);
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
