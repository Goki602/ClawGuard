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
import {
	PolicyEngine,
	getCoreRulesDir,
	getPreset,
	loadRulesFromDir,
	loadRulesFromPaths,
	resolveConfig,
} from "@clawguard/core";

export function findRulesDir(): string {
	// 1. Core rules bundled with @clawguard/core package
	const coreBundled = getCoreRulesDir();
	// 2. Monorepo development: rules/core at repo root
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

export interface EngineContext {
	engine: PolicyEngine;
	writer: AuditWriter;
	rulesCount: number;
}

export function createEngineContext(): EngineContext {
	const config = resolveConfig();
	const preset = getPreset(config.profile);
	const rulesDir = findRulesDir();
	const rules = loadRulesFromDir(rulesDir);
	const engine = new PolicyEngine(rules, preset);
	const writer = new AuditWriter();
	return { engine, writer, rulesCount: rules.length };
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

	const output = buildHookOutput(decision);
	return { output, skipped: false };
}
