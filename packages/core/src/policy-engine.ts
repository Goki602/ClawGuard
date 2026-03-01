import { resolveAction } from "./preset-system.js";
import type {
	CompiledRule,
	PolicyDecision,
	Preset,
	ProjectOverride,
	ToolRequest,
} from "./types.js";

const NO_MATCH_DECISION: PolicyDecision = {
	action: "allow",
	risk: "low",
	rule_id: "NO_MATCH",
	feed_version: "0.1.0",
};

export class PolicyEngine {
	private rules: CompiledRule[];
	private preset: Preset;
	private feedVersion: string;
	private overrides: ProjectOverride[];

	constructor(
		rules: CompiledRule[],
		preset: Preset,
		feedVersion = "0.1.0",
		overrides: ProjectOverride[] = [],
	) {
		this.rules = rules;
		this.preset = preset;
		this.feedVersion = feedVersion;
		this.overrides = overrides;
	}

	evaluate(request: ToolRequest): PolicyDecision {
		const matchedRule = this.findMatchingRule(request);
		if (!matchedRule) {
			return { ...NO_MATCH_DECISION, feed_version: this.feedVersion };
		}

		if (this.isOverridden(matchedRule.id, request.context.working_dir)) {
			return {
				action: "allow",
				risk: matchedRule.risk,
				rule_id: matchedRule.id,
				feed_version: this.feedVersion,
			};
		}

		// Recommend mode: new marketplace rules log-only during trial period
		if (matchedRule.meta?.marketplace?.status === "recommend") {
			return {
				action: "log",
				risk: matchedRule.risk,
				rule_id: matchedRule.id,
				feed_version: this.feedVersion,
			};
		}

		const action = resolveAction(this.preset, matchedRule.risk);

		const decision: PolicyDecision = {
			action,
			risk: matchedRule.risk,
			rule_id: matchedRule.id,
			feed_version: this.feedVersion,
		};

		if (action === "confirm" || action === "deny") {
			decision.explain = matchedRule.explain;
		}

		return decision;
	}

	private isOverridden(ruleId: string, workingDir: string): boolean {
		for (const override of this.overrides) {
			if (workingDir.startsWith(override.path) && override.rules?.includes(ruleId)) {
				return true;
			}
		}
		return false;
	}

	private findMatchingRule(request: ToolRequest): CompiledRule | null {
		for (const rule of this.rules) {
			if (rule.match.tool !== request.tool) continue;

			if (rule.compiledRegex) {
				if (rule.compiledRegex.test(request.content)) {
					return rule;
				}
			} else if (rule.match.trigger) {
				if (request.content === rule.match.trigger) {
					return rule;
				}
			}
		}
		return null;
	}

	getRules(): readonly CompiledRule[] {
		return this.rules;
	}

	getPreset(): Preset {
		return this.preset;
	}

	setPreset(preset: Preset): void {
		this.preset = preset;
	}

	setRules(rules: CompiledRule[]): void {
		this.rules = rules;
	}
}
