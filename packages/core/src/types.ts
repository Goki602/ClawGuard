export type ToolType = "bash" | "file_write" | "network" | "skill_install" | "unknown";
export type RiskLevel = "low" | "medium" | "high";
export type Action = "allow" | "confirm" | "deny" | "log";
export type PresetName = "observer" | "guardian" | "balanced" | "expert";

export interface ToolRequest {
	tool: ToolType;
	content: string;
	context: {
		agent: string;
		working_dir: string;
		session_id: string;
	};
}

export interface ExplainSimple {
	doing: string;
	safe_points: string[];
	warning_points: string[];
	one_check: string;
}

export interface ExplainData {
	package_downloads?: number;
	cve_count?: number;
	has_postinstall?: boolean;
	community_allow_rate?: number;
	community_sample_size?: number;
}

export interface ExplainRisk {
	title: string;
	what: string;
	why: string[];
	check: string[];
	alternatives?: string[];
	simple?: ExplainSimple;
	data?: ExplainData;
}

export interface RuleMeta {
	author: string;
	pack: string;
	version: string;
	tags: string[];
	phase: number;
	marketplace?: {
		status: "draft" | "recommend" | "active" | "deprecated";
		downloads: number;
		rating: number;
		override_rate: number;
	};
}

export interface RuleMatch {
	tool: string;
	command_regex?: string;
	trigger?: string;
}

export interface Rule {
	id: string;
	match: RuleMatch;
	risk: RiskLevel;
	explain: ExplainRisk;
	meta?: RuleMeta;
}

export interface CompiledRule extends Rule {
	compiledRegex?: RegExp;
}

export interface Preset {
	name: PresetName;
	mapping: Record<RiskLevel, Action>;
}

export interface PolicyDecision {
	action: Action;
	risk: RiskLevel;
	explain?: ExplainRisk;
	rule_id: string;
	feed_version: string;
}

export interface ClawGuardConfig {
	profile: PresetName;
	feed?: {
		url?: string;
		key?: string;
		auto_update?: boolean;
	};
	project_overrides?: ProjectOverride[];
	team?: {
		policy_server?: string;
		enforce?: boolean;
	};
}

export interface ProjectOverride {
	path: string;
	allow?: {
		network?: string[];
		exec?: string[];
	};
}
