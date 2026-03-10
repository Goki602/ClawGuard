import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { CompiledRule, Rule } from "./types.js";

export function compileRule(rule: Rule): CompiledRule {
	const compiled: CompiledRule = { ...rule };
	if (rule.match.command_regex) {
		try {
			compiled.compiledRegex = new RegExp(rule.match.command_regex);
		} catch {
			console.warn(`[ClawGuard] Invalid regex in rule ${rule.id}: ${rule.match.command_regex}`);
		}
	}
	return compiled;
}

export function loadRulesFromYaml(content: string): CompiledRule[] {
	const parsed = parse(content);
	if (!parsed) return [];
	const rules: Rule[] = Array.isArray(parsed) ? parsed : (parsed.rules ?? [parsed]);
	return rules.map(compileRule);
}

export function loadRulesFromDir(dirPath: string): CompiledRule[] {
	let entries: string[];
	try {
		entries = readdirSync(dirPath);
	} catch {
		return [];
	}

	const rules: CompiledRule[] = [];
	for (const entry of entries) {
		if (!entry.endsWith(".yaml") && !entry.endsWith(".yml")) continue;
		const content = readFileSync(join(dirPath, entry), "utf-8");
		rules.push(...loadRulesFromYaml(content));
	}
	return rules;
}

export function loadRulesFromPaths(paths: string[]): CompiledRule[] {
	const rules: CompiledRule[] = [];
	for (const p of paths) {
		rules.push(...loadRulesFromDir(p));
	}
	return rules;
}
