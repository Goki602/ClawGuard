export type ToolType = "bash" | "file_write" | "network" | "skill_install" | "unknown";
export type RiskLevel = "low" | "medium" | "high";
export type Action = "allow" | "confirm" | "deny" | "log";
export type PresetName = "observer" | "guardian" | "balanced" | "expert";
export type Lang = "ja" | "en";

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

// === Phase 2: Billing ===

export type BillingPlan = "free" | "pro" | "max";

export interface LicenseInfo {
	plan: BillingPlan;
	key?: string;
	valid_until?: string;
	features: {
		max_rules: number;
		feed_interval: "weekly" | "daily";
		reputation_network: boolean;
		marketplace: boolean;
		team: boolean;
		team_admin: boolean;
	};
}

// === Phase 2: Feed ===

export interface FeedManifest {
	version: string;
	published_at: string;
	rules_sha256: string;
	reputation_sha256: string;
	signature_url: string;
}

export interface FeedBundle {
	manifest: FeedManifest;
	rules: Rule[];
	reputation: ReputationData;
	revocations?: RevocationList;
}

// === Phase 2: Reputation ===

export interface ReputationEntry {
	rule_id: string;
	community_total: number;
	community_allowed: number;
	community_denied: number;
	community_override_rate: number;
	last_updated: string;
}

export interface ReputationData {
	version: string;
	entries: ReputationEntry[];
}

// === Phase 2: Marketplace ===

export interface RulePack {
	name: string;
	description: string;
	author: string;
	version: string;
	source: string;
	rules: Rule[];
	installed_at?: string;
}

export interface AnonymizedSnapshot {
	generated_at: string;
	entries: Array<{
		rule_id: string;
		total: number;
		allowed: number;
		denied: number;
	}>;
}

// === Config ===

export interface ClawGuardConfig {
	profile: PresetName;
	lang?: Lang;
	feed?: {
		url?: string;
		key?: string;
		auto_update?: boolean;
	};
	project_overrides?: ProjectOverride[];
	team?: {
		policy_server?: string;
		enforce?: boolean;
		api_key?: string;
		team_id?: string;
	};
	billing?: {
		license_key?: string;
	};
	reputation?: {
		opt_in?: boolean;
	};
	marketplace?: {
		packs?: string[];
	};
}

export interface ProjectOverride {
	path: string;
	rules?: string[];
	allow?: {
		network?: string[];
		exec?: string[];
	};
}

// === Phase 3: Security Passport ===

export interface PassportSummary {
	total_decisions: number;
	allowed: number;
	confirmed: number;
	denied: number;
	incidents: number;
}

export interface SecurityPassport {
	version: "1.0";
	repository: string;
	monitoring_since: string;
	last_updated: string;
	summary: PassportSummary;
	agents_monitored: string[];
	feed_version: string;
	signature?: string;
}

// === Phase 3: Incident Replay ===

export interface ReplayEvent {
	time: string;
	action: Action;
	tool: string;
	content: string;
	rule_id: string;
	risk: RiskLevel;
	user_response?: string;
	enrichments?: Array<{ name: string; value: string }>;
	flagged: boolean;
}

export interface CausalLink {
	from_index: number;
	to_index: number;
	reason: string;
}

export interface SessionTimeline {
	session_id: string;
	agent: string;
	start_time: string;
	end_time: string;
	events: ReplayEvent[];
	causal_chains: CausalLink[];
	risk_score: number;
}

// === Phase 3: Weekly Report ===

export interface WeeklyReportData {
	period: { start: string; end: string };
	total_decisions: number;
	decision_breakdown: { allowed: number; confirmed: number; denied: number };
	top_rules: Array<{
		rule_id: string;
		count: number;
		action_distribution: Record<Action, number>;
	}>;
	agents: Array<{ name: string; decision_count: number }>;
	sessions: number;
	safety_score: number;
	trends: { vs_previous_week: { total_diff: number; deny_diff: number } };
	incidents: number;
}

// === Phase 4: Skills AV ===

export interface SkillManifestEntry {
	name: string;
	path: string;
	hash: string;
	publisher?: string;
	files: number;
	has_exec: boolean;
	last_verified: string;
}

export interface SkillManifest {
	version: string;
	generated_at: string;
	skills: SkillManifestEntry[];
}

export interface RevocationEntry {
	hash: string;
	reason: string;
	revoked_at: string;
}

export interface RevocationList {
	version: string;
	entries: RevocationEntry[];
}

export interface SkillScanResult {
	name: string;
	path: string;
	status: "clean" | "warning" | "revoked" | "error";
	findings: Array<{
		type: "static_pattern" | "revoked_hash" | "hash_mismatch";
		severity: RiskLevel;
		detail: string;
	}>;
}

// === Phase 4: Team/Organization ===

export type MemberRole = "admin" | "member" | "readonly";

export interface TeamMember {
	id: string;
	email: string;
	role: MemberRole;
	api_key: string;
	added_at: string;
	last_seen?: string;
}

export interface TeamPolicy {
	version: string;
	profile: PresetName;
	project_overrides: ProjectOverride[];
	enforce: boolean;
	allowed_plans: BillingPlan[];
}

export interface TeamDecisionStats {
	rule_id: string;
	team_total: number;
	team_allowed: number;
	team_denied: number;
	member_count: number;
	team_override_rate: number;
	updated_at: string;
}

// === Ongoing: False Positive Monitoring ===

export interface RuleStatsWindowed {
	rule_id: string;
	period: "7d" | "30d" | "all";
	total: number;
	allowed: number;
	denied: number;
	confirmed: number;
	override_rate: number;
}

export interface FalsePositiveAlert {
	rule_id: string;
	current_override_rate: number;
	baseline_override_rate: number;
	sample_size: number;
	severity: "info" | "warning" | "critical";
	suggestion: "keep" | "loosen" | "deprecate";
	reason: string;
}

// === Ongoing: Public Security Report ===

export interface PublicSecurityReport {
	generated_at: string;
	period: { start: string; end: string };
	highlights: string[];
	community_stats: {
		total_decisions: number;
		total_rules_active: number;
		agents_supported: string[];
	};
	rule_health: {
		total_rules: number;
		healthy: number;
		needs_tuning: number;
		deprecated_this_period: number;
		promoted_this_period: number;
	};
	top_blocked: Array<{ rule_id: string; count: number; risk: string }>;
	feed_updates: {
		rules_added: number;
		rules_updated: number;
	};
}

// === Ongoing: Rule Curation ===

export interface CurationTask {
	rule_id: string;
	pack: string;
	current_status: "recommend" | "active" | "deprecated";
	override_rate: number;
	sample_size: number;
	days_in_current_status: number;
	recommended_action: "promote" | "deprecate" | "keep";
	reason: string;
}

export interface CurationResult {
	evaluated_at: string;
	tasks: CurationTask[];
	promoted: string[];
	deprecated: string[];
	kept: string[];
}
