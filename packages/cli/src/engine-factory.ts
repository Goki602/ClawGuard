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
import type { ReputationAggregator } from "@clawguard/reputation";

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
	store?: DecisionStore;
	enricher?: Enricher;
	reputation?: ReputationAggregator;
	license?: LicenseInfo;
	gate?: FeatureGate;
	feedClient?: FeedClient;
	passportGenerator?: PassportGenerator;
	sessionBuilder?: SessionBuilder;
	reportGenerator?: ReportGenerator;
	teamClient?: unknown;
	skillsScanner?: unknown;
	teamMemoryStore?: unknown;
}

export function createEngineContext(): EngineContext {
	const config = resolveConfig();
	const preset = getPreset(config.profile);

	// License
	const licenseManager = new LicenseManager();
	if (config.billing?.license_key) {
		licenseManager.saveLicense(config.billing.license_key);
	}
	const license = licenseManager.getCurrentLicense();
	const gate = new FeatureGate(license);

	// Core rules (always loaded)
	let rules = loadRulesFromDir(findRulesDir());

	// Phase 2 rules (pro/max only)
	if (gate.canLoadPhase2Rules()) {
		const phase2Dir = findPhase2RulesDir();
		if (phase2Dir) {
			rules = [...rules, ...loadRulesFromDir(phase2Dir)];
		}
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

	// Marketplace packs (pro/max only)
	if (gate.canUseMarketplace()) {
		const marketplace = new MarketplaceClient();
		rules = [...rules, ...marketplace.loadInstalledRules()];
	}

	// Free plan: only phase 0 rules
	if (!gate.canLoadPhase2Rules()) {
		rules = rules.filter((r) => (r.meta?.phase ?? 0) === 0);
	}

	const engine = new PolicyEngine(rules, preset, feedVersion, config.project_overrides);
	const writer = new AuditWriter();
	const store = new DecisionStore();

	return { engine, writer, rulesCount: rules.length, store, license, gate, feedClient };
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

	const event = createOcsfEvent(request, decision);
	ctx.writer.write(event);

	if (ctx.store) {
		ctx.store.record({
			rule_id: decision.rule_id,
			action: decision.action,
			content_hash: DecisionStore.hashContent(request.content),
			agent: request.context.agent,
			session_id: request.context.session_id,
		});
	}

	const output = buildHookOutput(decision);
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

	if (ctx.enricher && decision.action !== "allow") {
		try {
			decision = await ctx.enricher.enrich(decision, request);
		} catch {
			// Enrichment failure is non-fatal
		}
	}

	const event = createOcsfEvent(request, decision);
	ctx.writer.write(event);

	if (ctx.store) {
		ctx.store.record({
			rule_id: decision.rule_id,
			action: decision.action,
			content_hash: DecisionStore.hashContent(request.content),
			agent: request.context.agent,
			session_id: request.context.session_id,
		});
	}

	const output = buildHookOutput(decision);
	return { output, skipped: false };
}
