import { readdirSync } from "node:fs";
import { type IncomingMessage, type ServerResponse, createServer } from "node:http";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { AuditReader } from "@clawguard/audit";
import { MarketplaceClient, RuleCurator } from "@clawguard/core";
import { Enricher } from "@clawguard/enrichment";
import { FalsePositiveMonitor } from "@clawguard/memory";
import { BadgeGenerator, PassportGenerator } from "@clawguard/passport";
import { CausalAnalyzer, ReportGenerator, SessionBuilder } from "@clawguard/replay";
import { ManifestManager, SkillsScanner } from "@clawguard/skills-av";
import { MemberStore, TeamAuditStore, TeamMemoryStore } from "@clawguard/team";
import chalk from "chalk";
import { createEngineContext, evaluateHookRequestAsync } from "../engine-factory.js";
import { detectLocale } from "../locale.js";

const DEFAULT_PORT = 19280;

const MSG = {
	ja: {
		title: "ClawGuard HTTP Hook Server",
		rules: (n: number) => `ルール: ${n} 件`,
		preset: (name: string) => `プリセット: ${name}`,
		port: (p: number) => `ポート: ${p}`,
		memory: (on: boolean) => `記憶: ${on ? "有効" : "無効"}`,
		plan: (name: string) => `プラン: ${name}`,
		feed: (on: boolean) => `フィード: ${on ? "有効" : "無効"}`,
		enrichment: "エンリッチメント: 有効",
		listening: (url: string) => `リッスン中: ${url}`,
		stop: "Ctrl+C で停止",
		shutting: "シャットダウン中...",
		invalidPort: "無効なポート番号",
	},
	en: {
		title: "ClawGuard HTTP Hook Server",
		rules: (n: number) => `Rules: ${n} loaded`,
		preset: (name: string) => `Preset: ${name}`,
		port: (p: number) => `Port: ${p}`,
		memory: (on: boolean) => `Memory: ${on ? "enabled" : "disabled"}`,
		plan: (name: string) => `Plan: ${name}`,
		feed: (on: boolean) => `Feed: ${on ? "enabled" : "disabled"}`,
		enrichment: "Enrichment: enabled",
		listening: (url: string) => `Listening on ${url}`,
		stop: "Press Ctrl+C to stop",
		shutting: "Shutting down...",
		invalidPort: "Invalid port number",
	},
};

function corsHeaders(): Record<string, string> {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};
}

function jsonResponse(res: ServerResponse, status: number, data: unknown): void {
	res.writeHead(status, { "Content-Type": "application/json", ...corsHeaders() });
	res.end(JSON.stringify(data));
}

export async function serveCommand(options: { port?: string; host?: string }): Promise<void> {
	const m = MSG[detectLocale()];
	const port = options.port ? Number.parseInt(options.port, 10) : DEFAULT_PORT;
	if (Number.isNaN(port) || port < 1 || port > 65535) {
		console.error(m.invalidPort);
		process.exit(1);
	}
	const host = options.host ?? "127.0.0.1";

	const ctx = createEngineContext();
	const reader = new AuditReader();
	const enricher = new Enricher(ctx.store, ctx.reputation);
	ctx.enricher = enricher;
	const fpMonitor = ctx.store ? new FalsePositiveMonitor(ctx.store) : undefined;
	const sessionBuilder = new SessionBuilder(reader);
	const causalAnalyzer = new CausalAnalyzer();
	const reportGenerator = new ReportGenerator(reader, fpMonitor, ctx.rulesCount);
	const passportGenerator = new PassportGenerator(reader);
	const badgeGenerator = new BadgeGenerator();
	ctx.sessionBuilder = sessionBuilder;
	ctx.reportGenerator = reportGenerator;
	ctx.passportGenerator = passportGenerator;

	// Team stores (Max tier only, always initialized for API but gated)
	let teamMemberStore: MemberStore | undefined;
	let teamAuditStore: TeamAuditStore | undefined;
	let teamMemoryStore: TeamMemoryStore | undefined;
	const isMaxTier = ctx.gate?.canUseTeamAdmin();
	if (isMaxTier) {
		try {
			teamMemberStore = new MemberStore();
			teamAuditStore = new TeamAuditStore();
			teamMemoryStore = new TeamMemoryStore();
		} catch {
			// Team DB init failure is non-fatal
		}
	}

	// Telemetry auto-submission (every 6 hours)
	const TELEMETRY_INTERVAL = 6 * 60 * 60 * 1000;
	let telemetryTimer: ReturnType<typeof setInterval> | undefined;
	if (ctx.telemetryUploader?.isEnabled() && ctx.reputation && ctx.store) {
		const submitTelemetry = () => {
			try {
				const snapshot = ctx.reputation?.generateTelemetrySnapshot();
				if (snapshot && snapshot.entries.length > 0) {
					ctx.telemetryUploader?.submit(snapshot).catch(() => {});
				}
			} catch {
				// Telemetry failure is non-fatal
			}
		};
		telemetryTimer = setInterval(submitTelemetry, TELEMETRY_INTERVAL);
	}

	console.log(chalk.bold(m.title));
	console.log(`  ${m.rules(ctx.rulesCount)}`);
	console.log(`  ${m.preset(ctx.engine.getPreset().name)}`);
	console.log(`  ${m.port(port)}`);
	console.log(`  ${m.memory(Boolean(ctx.store))}`);
	console.log(`  ${m.plan(ctx.license?.plan ?? "free")}`);
	console.log(`  ${m.feed(Boolean(ctx.feedClient))}`);
	console.log(`  ${m.enrichment}`);
	console.log(`  Hook:      POST http://localhost:${port}/hook`);
	console.log(`  Dashboard: GET  http://localhost:${port}/api/logs/today`);
	console.log("");

	const server = createServer((req: IncomingMessage, res: ServerResponse) => {
		if (req.method === "OPTIONS") {
			res.writeHead(204, corsHeaders());
			res.end();
			return;
		}

		if (req.method === "GET" && req.url === "/health") {
			jsonResponse(res, 200, {
				status: "ok",
				rules: ctx.rulesCount,
				memory: Boolean(ctx.store),
				enrichment: true,
			});
			return;
		}

		if (req.method === "GET" && req.url === "/api/logs/today") {
			const entries = reader.readToday();
			jsonResponse(res, 200, { entries });
			return;
		}

		if (req.method === "GET" && req.url === "/api/rules") {
			const rules = ctx.engine.getRules().map((r) => ({
				id: r.id,
				tool: r.match.tool,
				regex: r.match.command_regex ?? "",
				risk: r.risk,
				title: r.explain?.title ?? "",
			}));
			jsonResponse(res, 200, { rules });
			return;
		}

		if (req.method === "GET" && req.url === "/api/stats") {
			if (!ctx.store) {
				jsonResponse(res, 200, { stats: [] });
				return;
			}
			const ruleIds = ctx.engine.getRules().map((r) => r.id);
			const store = ctx.store;
			const stats = ruleIds.map((id) => ({
				rule_id: id,
				...store?.getStats(id),
			}));
			jsonResponse(res, 200, { stats });
			return;
		}

		if (req.method === "GET" && req.url?.startsWith("/api/reputation/")) {
			const ruleId = decodeURIComponent(req.url.slice("/api/reputation/".length));
			if (ctx.reputation) {
				const rep = ctx.reputation.getReputation(ruleId);
				jsonResponse(res, 200, rep);
			} else {
				jsonResponse(res, 200, {
					rule_id: ruleId,
					community_total: 0,
					community_allowed: 0,
					community_denied: 0,
					community_override_rate: 0,
					last_updated: "",
				});
			}
			return;
		}

		if (req.method === "GET" && req.url === "/api/license") {
			jsonResponse(res, 200, { license: ctx.license ?? { plan: "free" } });
			return;
		}

		if (req.method === "GET" && req.url === "/api/feed/status") {
			if (ctx.feedClient) {
				const status = ctx.feedClient.getStatus();
				jsonResponse(res, 200, status);
			} else {
				jsonResponse(res, 200, { status: "none" });
			}
			return;
		}

		if (req.method === "POST" && req.url === "/api/feed/update") {
			if (ctx.feedClient) {
				ctx.feedClient
					.fetchLatest()
					.then((bundle) => {
						if (bundle) {
							jsonResponse(res, 200, { success: true, version: bundle.manifest.version });
						} else {
							jsonResponse(res, 200, { success: false, error: "Feed fetch failed" });
						}
					})
					.catch((err) => {
						jsonResponse(res, 500, { success: false, error: String(err) });
					});
			} else {
				jsonResponse(res, 200, { success: false, error: "Feed not configured" });
			}
			return;
		}

		if (req.method === "GET" && req.url === "/api/passport") {
			const passport = passportGenerator.load();
			if (passport) {
				jsonResponse(res, 200, passport);
			} else {
				jsonResponse(res, 200, { error: "No passport found" });
			}
			return;
		}

		if (req.method === "POST" && req.url === "/api/passport/generate") {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			req.on("end", () => {
				try {
					const opts = JSON.parse(body || "{}");
					const passport = passportGenerator.generate({
						repository: opts.repository ?? "unknown/repo",
						feedVersion: ctx.feedClient?.getStatus()?.version ?? undefined,
					});
					passportGenerator.save(passport);
					jsonResponse(res, 200, passport);
				} catch (err) {
					jsonResponse(res, 500, { error: String(err) });
				}
			});
			return;
		}

		if (req.method === "GET" && req.url === "/api/passport/badge") {
			const passport = passportGenerator.load();
			if (passport) {
				const svg = badgeGenerator.generateSvg(passport);
				res.writeHead(200, { "Content-Type": "image/svg+xml", ...corsHeaders() });
				res.end(svg);
			} else {
				jsonResponse(res, 404, { error: "No passport found" });
			}
			return;
		}

		if (req.method === "GET" && req.url?.startsWith("/api/replay/sessions")) {
			const urlObj = new URL(req.url, "http://localhost");
			const date = urlObj.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
			const sessions = sessionBuilder.listSessions(date);
			jsonResponse(res, 200, { sessions });
			return;
		}

		if (req.method === "GET" && req.url?.match(/^\/api\/replay\/session\/[^/]+\/causal$/)) {
			const id = decodeURIComponent(req.url.split("/")[4]);
			const timeline = sessionBuilder.buildForSession(id);
			if (timeline) {
				timeline.causal_chains = causalAnalyzer.analyze(timeline.events);
				jsonResponse(res, 200, timeline);
			} else {
				jsonResponse(res, 404, { error: "Session not found" });
			}
			return;
		}

		if (req.method === "GET" && req.url?.match(/^\/api\/replay\/session\/[^/]+$/)) {
			const id = decodeURIComponent(req.url.split("/")[4]);
			const timeline = sessionBuilder.buildForSession(id);
			if (timeline) {
				jsonResponse(res, 200, timeline);
			} else {
				jsonResponse(res, 404, { error: "Session not found" });
			}
			return;
		}

		if (req.method === "GET" && req.url?.startsWith("/api/report/weekly")) {
			const urlObj = new URL(req.url, "http://localhost");
			const offset = Number.parseInt(urlObj.searchParams.get("offset") ?? "0", 10);
			const report = reportGenerator.generateWeekly(Number.isNaN(offset) ? 0 : offset);
			jsonResponse(res, 200, report);
			return;
		}

		// --- Skills AV endpoints ---
		if (req.method === "GET" && req.url === "/api/skills/scan") {
			try {
				const skillsDir = resolve(homedir(), ".claude", "skills");
				const scanner = new SkillsScanner(skillsDir);
				const results = scanner.scanAllSkills(skillsDir);
				jsonResponse(res, 200, { results });
			} catch {
				jsonResponse(res, 200, { results: [] });
			}
			return;
		}

		if (req.method === "GET" && req.url === "/api/skills/manifest") {
			try {
				const manager = new ManifestManager(homedir());
				const manifest = manager.load();
				jsonResponse(res, 200, { manifest });
			} catch {
				jsonResponse(res, 200, { manifest: null });
			}
			return;
		}

		if (req.method === "POST" && req.url === "/api/skills/manifest/generate") {
			try {
				const skillsDir = resolve(homedir(), ".claude", "skills");
				const manager = new ManifestManager(skillsDir);
				const dirs = readdirSync(skillsDir, { withFileTypes: true })
					.filter((d) => d.isDirectory())
					.map((d) => resolve(skillsDir, d.name));
				const manifest = manager.buildManifest(dirs);
				manager.save(manifest);
				jsonResponse(res, 200, { success: true, manifest });
			} catch (err) {
				jsonResponse(res, 500, { success: false, error: String(err) });
			}
			return;
		}

		// --- Monitor endpoints ---
		if (req.method === "GET" && req.url === "/api/monitor/alerts") {
			if (fpMonitor) {
				const alerts = fpMonitor.analyze();
				jsonResponse(res, 200, { alerts });
			} else {
				jsonResponse(res, 200, { alerts: [] });
			}
			return;
		}

		if (req.method === "GET" && req.url === "/api/monitor/stats") {
			if (fpMonitor) {
				const stats = fpMonitor.getDetailedStats();
				jsonResponse(res, 200, { stats });
			} else {
				jsonResponse(res, 200, { stats: [] });
			}
			return;
		}

		// --- Public report endpoint ---
		if (req.method === "GET" && req.url?.startsWith("/api/report/public")) {
			const urlObj = new URL(req.url, "http://localhost");
			const offset = Number.parseInt(urlObj.searchParams.get("offset") ?? "0", 10);
			const publicReport = reportGenerator.generatePublic(Number.isNaN(offset) ? 0 : offset);
			jsonResponse(res, 200, publicReport);
			return;
		}

		// --- Curation endpoints ---
		if (req.method === "GET" && req.url === "/api/curation/status") {
			if (ctx.store) {
				const marketplace = new MarketplaceClient();
				const curator = new RuleCurator(marketplace, ctx.store);
				const result = curator.evaluate();
				jsonResponse(res, 200, result);
			} else {
				jsonResponse(res, 200, {
					evaluated_at: new Date().toISOString(),
					tasks: [],
					promoted: [],
					deprecated: [],
					kept: [],
				});
			}
			return;
		}

		if (req.method === "POST" && req.url === "/api/curation/apply") {
			if (ctx.store) {
				const marketplace = new MarketplaceClient();
				const curator = new RuleCurator(marketplace, ctx.store);
				const result = curator.evaluate();
				const applied = curator.applyPromotions(result);
				jsonResponse(res, 200, {
					applied,
					promoted: result.promoted,
					deprecated: result.deprecated,
				});
			} else {
				jsonResponse(res, 200, { applied: 0, promoted: [], deprecated: [] });
			}
			return;
		}

		// --- Team endpoints ---
		if (req.method === "GET" && req.url === "/api/team/status") {
			if (!teamMemberStore) {
				jsonResponse(res, 200, { connected: false });
				return;
			}
			const members = teamMemberStore.listMembers();
			jsonResponse(res, 200, {
				connected: true,
				member_count: members.length,
				policy: { profile: ctx.engine.getPreset().name, enforce: true },
			});
			return;
		}

		if (req.method === "GET" && req.url === "/api/team/members") {
			if (!teamMemberStore) {
				jsonResponse(res, 200, { members: [] });
				return;
			}
			const members = teamMemberStore.listMembers();
			jsonResponse(res, 200, { members });
			return;
		}

		if (req.method === "GET" && req.url === "/api/team/memory/stats") {
			if (!teamMemoryStore) {
				jsonResponse(res, 200, { stats: [] });
				return;
			}
			const stats = teamMemoryStore.getTeamStats();
			jsonResponse(res, 200, { stats });
			return;
		}

		if (req.method === "GET" && req.url?.startsWith("/api/team/audit/summary")) {
			if (!teamAuditStore) {
				jsonResponse(res, 200, { total: 0, by_rule: {}, by_member: {}, by_action: {} });
				return;
			}
			const urlObj = new URL(req.url, "http://localhost");
			const since = urlObj.searchParams.get("since") ?? undefined;
			const summary = teamAuditStore.getSummary(since);
			jsonResponse(res, 200, summary);
			return;
		}

		if (req.method === "POST" && req.url === "/hook") {
			let body = "";
			req.on("data", (chunk: Buffer) => {
				body += chunk.toString();
			});
			req.on("end", () => {
				evaluateHookRequestAsync(body, ctx)
					.then(({ output, skipped }) => {
						if (skipped || !output) {
							jsonResponse(res, 200, {});
						} else {
							jsonResponse(res, 200, output);
						}
					})
					.catch((err) => {
						console.error("Evaluation error:", err);
						jsonResponse(res, 200, {});
					});
			});
			return;
		}

		jsonResponse(res, 404, { error: "Not found" });
	});

	server.listen(port, host, () => {
		console.log(chalk.green(m.listening(`http://${host}:${port}`)));
		console.log(chalk.dim(m.stop));
	});

	const shutdown = () => {
		console.log(`\n${m.shutting}`);
		if (telemetryTimer) clearInterval(telemetryTimer);
		// Submit final telemetry on shutdown
		if (ctx.telemetryUploader?.isEnabled() && ctx.reputation) {
			try {
				const snapshot = ctx.reputation.generateTelemetrySnapshot();
				if (snapshot && snapshot.entries.length > 0) {
					ctx.telemetryUploader.submit(snapshot).catch(() => {});
				}
			} catch {
				// Non-fatal
			}
		}
		ctx.store?.close();
		teamMemberStore?.close();
		teamAuditStore?.close();
		teamMemoryStore?.close();
		server.close(() => process.exit(0));
		setTimeout(() => process.exit(0), 3000);
	};
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}
