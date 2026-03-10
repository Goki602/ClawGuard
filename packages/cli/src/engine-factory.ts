import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { ClaudeHookOutput } from "@clawguard/adapter-claude";
import {
	buildHookOutput,
	mapToToolRequest,
	parseHookInput,
	shouldIntervene,
} from "@clawguard/adapter-claude";
import { AuditWriter, createOcsfEvent } from "@clawguard/audit";
import { FeatureGate, LicenseManager } from "@clawguard/billing";
import {
	type CompiledRule,
	type Lang,
	type LicenseInfo,
	MarketplaceClient,
	PolicyEngine,
	compileRule,
	getCoreRulesDir,
	getPreset,
	loadRulesFromDir,
	resolveConfig,
} from "@clawguard/core";
import type { Enricher } from "@clawguard/enrichment";
import { FeedClient } from "@clawguard/feed";
import { DecisionStore } from "@clawguard/memory";
import type { PassportGenerator } from "@clawguard/passport";
import type { ReportGenerator, SessionBuilder } from "@clawguard/replay";
import { ReputationAggregator, TelemetryUploader } from "@clawguard/reputation";

const RETRY_HINT = {
	ja: "\n\n🔄 上記のリスクをユーザーに説明し、実行してよいか確認してください。許可された場合のみ、コマンドを変更せずに再実行してください。",
	en: "\n\n🔄 Explain the above risks to the user and ask for permission. Only retry the command without modification if the user approves.",
} as const;

export function findRulesDir(): string {
	const coreBundled = getCoreRulesDir();
	const repoRoot = resolve(process.cwd(), "rules/core");
	const candidates = [coreBundled, repoRoot];
	for (const c of candidates) {
		try {
			if (readdirSync(c).length > 0) return c;
		} catch {
			// continue
		}
	}
	return candidates[0];
}

export function findPhase2RulesDir(): string | null {
	const bundled = resolve(getCoreRulesDir(), "..", "phase2");
	const cwdBased = resolve(process.cwd(), "rules/phase2");
	for (const dir of [bundled, cwdBased]) {
		try {
			if (readdirSync(dir).length > 0) return dir;
		} catch {
			// continue
		}
	}
	return null;
}

function mergeRules(base: CompiledRule[], overlay: CompiledRule[]): CompiledRule[] {
	const map = new Map<string, CompiledRule>();
	for (const r of base) map.set(r.id, r);
	for (const r of overlay) map.set(r.id, r);
	return Array.from(map.values());
}

export interface EngineContext {
	engine: PolicyEngine;
	writer: AuditWriter;
	rulesCount: number;
	lang: Lang;
	store?: DecisionStore;
	enricher?: Enricher;
	reputation?: ReputationAggregator;
	license?: LicenseInfo;
	gate?: FeatureGate;
	feedClient?: FeedClient;
	passportGenerator?: PassportGenerator;
	sessionBuilder?: SessionBuilder;
	reportGenerator?: ReportGenerator;
	telemetryUploader?: TelemetryUploader;
	teamClient?: unknown;
	skillsScanner?: unknown;
	teamMemoryStore?: unknown;
}

export function createEngineContext(overrideLang?: Lang): EngineContext {
	const config = resolveConfig();
	const preset = getPreset(config.profile);

	// License
	const licenseManager = new LicenseManager();
	if (config.billing?.license_key) {
		licenseManager.saveLicense(config.billing.license_key);
	}
	const license = licenseManager.getCurrentLicense();
	const gate = new FeatureGate(license);

	// Core rules
	let rules = loadRulesFromDir(findRulesDir());

	// Phase 2 rules
	const phase2Dir = findPhase2RulesDir();
	if (phase2Dir) {
		rules = [...rules, ...loadRulesFromDir(phase2Dir)];
	}

	// Feed rules (overlay)
	let feedVersion = "0.1.0";
	const feedClient = new FeedClient(config.feed);
	const feedBundle = feedClient.getCached();
	if (feedBundle && !feedClient.isDegraded()) {
		feedVersion = feedBundle.manifest.version;
		const feedCompiled = feedBundle.rules.map(compileRule);
		rules = mergeRules(rules, feedCompiled);
	}

	// Marketplace packs
	const marketplace = new MarketplaceClient();
	rules = [...rules, ...marketplace.loadInstalledRules()];

	const engine = new PolicyEngine(rules, preset, feedVersion, config.project_overrides);
	const writer = new AuditWriter();
	const store = new DecisionStore();
	try { store.cleanExpiredSessions(24); } catch { /* non-fatal */ }

	const reputation = new ReputationAggregator(store, feedBundle?.reputation);
	// Telemetry upload is always enabled (anonymous aggregate stats).
	// Community data *display* is gated by gate.canUseReputation() in enricher.
	const telemetryUploader = new TelemetryUploader({
		enabled: true,
	});

	const lang: Lang = overrideLang ?? (config.lang === "en" ? "en" : "ja");
	return {
		engine,
		writer,
		rulesCount: rules.length,
		lang,
		store,
		reputation,
		telemetryUploader,
		license,
		gate,
		feedClient,
	};
}

export interface EvalResult {
	output: ClaudeHookOutput | null;
	skipped: boolean;
}

export function evaluateHookRequest(rawInput: string, ctx: EngineContext): EvalResult {
	const hookInput = parseHookInput(rawInput);

	if (!shouldIntervene(hookInput.permission_mode)) {
		return { output: null, skipped: true };
	}

	const request = mapToToolRequest(hookInput);
	const decision = ctx.engine.evaluate(request);

	const contentHash = DecisionStore.hashContent(request.content);

	// Auto-allow: session allowlist only (same session, same content, same rule)
	if (decision.action === "confirm" && ctx.store) {
		if (ctx.store.isSessionAllowed(request.context.session_id, contentHash, decision.rule_id)) {
			decision.action = "allow";
		}
	}

	const output = buildHookOutput(decision, ctx.lang);

	const event = createOcsfEvent(request, decision);
	ctx.writer.write(event);

	if (ctx.store) {
		ctx.store.record({
			rule_id: decision.rule_id,
			action: decision.action,
			content_hash: contentHash,
			agent: request.context.agent,
			session_id: request.context.session_id,
		});
	}

	// Non-high confirm: pre-register session allowlist, return deny with retry hint
	// (deny reason is shown to Claude, who relays explanation to user then retries)
	if (decision.action === "confirm" && ctx.store && output) {
		ctx.store.recordSessionAllow(request.context.session_id, contentHash, decision.rule_id);
		const reason = output.hookSpecificOutput.permissionDecisionReason ?? "";
		return {
			output: {
				hookSpecificOutput: {
					hookEventName: "PreToolUse",
					permissionDecision: "deny",
					permissionDecisionReason: reason + RETRY_HINT[ctx.lang],
				},
			},
			skipped: false,
		};
	}

	return { output, skipped: false };
}

export async function evaluateHookRequestAsync(
	rawInput: string,
	ctx: EngineContext,
): Promise<EvalResult> {
	const hookInput = parseHookInput(rawInput);

	if (!shouldIntervene(hookInput.permission_mode)) {
		return { output: null, skipped: true };
	}

	const request = mapToToolRequest(hookInput);
	let decision = ctx.engine.evaluate(request);

	const contentHash = DecisionStore.hashContent(request.content);

	if (ctx.enricher && decision.action !== "allow") {
		try {
			decision = await ctx.enricher.enrich(decision, request);
		} catch {
			// Enrichment failure is non-fatal
		}
	}

	// Auto-allow: session allowlist only (same session, same content, same rule)
	if (decision.action === "confirm" && ctx.store) {
		if (ctx.store.isSessionAllowed(request.context.session_id, contentHash, decision.rule_id)) {
			decision.action = "allow";
		}
	}

	const output = buildHookOutput(decision, ctx.lang);

	const event = createOcsfEvent(request, decision);
	ctx.writer.write(event);

	if (ctx.store) {
		ctx.store.record({
			rule_id: decision.rule_id,
			action: decision.action,
			content_hash: contentHash,
			agent: request.context.agent,
			session_id: request.context.session_id,
		});
	}

	// Non-high confirm: pre-register session allowlist, return deny with retry hint
	if (decision.action === "confirm" && ctx.store && output) {
		ctx.store.recordSessionAllow(request.context.session_id, contentHash, decision.rule_id);
		const reason = output.hookSpecificOutput.permissionDecisionReason ?? "";
		return {
			output: {
				hookSpecificOutput: {
					hookEventName: "PreToolUse",
					permissionDecision: "deny",
					permissionDecisionReason: reason + RETRY_HINT[ctx.lang],
				},
			},
			skipped: false,
		};
	}

	return { output, skipped: false };
}
