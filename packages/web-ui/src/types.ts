export interface HealthStatus {
	status: string;
	rules: number;
	memory?: boolean;
	enrichment?: boolean;
}

export interface AuditEntry {
	time: string;
	class_uid: number;
	severity_id: number;
	disposition_id: number;
	disposition: string;
	api: {
		operation: string;
		request: {
			data: { content: string };
		};
	};
	actor: {
		session: { uid: string };
		app_name: string;
	};
	metadata: {
		product: { name: string; version: string; vendor_name: string };
		version: string;
		log_name: string;
	};
	enrichments: Array<{ name: string; value: string }>;
	unmapped?: Record<string, unknown>;
}

export interface RuleStats {
	rule_id: string;
	total: number;
	allowed: number;
	denied: number;
	confirmed: number;
	override_rate: number;
}

export interface FeedStatus {
	status: "fresh" | "stale" | "degraded" | "none";
	version?: string;
	age?: number;
}

export interface LicenseStatus {
	license: {
		plan: "free" | "pro" | "max";
	};
}

export interface SessionSummary {
	session_id: string;
	agent: string;
	event_count: number;
	start_time: string;
	end_time: string;
	has_incidents: boolean;
}

export interface ReplayEvent {
	time: string;
	action: string;
	tool: string;
	content: string;
	rule_id: string;
	risk: string;
	flagged: boolean;
	user_response?: string;
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

export interface PassportData {
	version: string;
	repository: string;
	monitoring_since: string;
	last_updated: string;
	summary: {
		total_decisions: number;
		allowed: number;
		confirmed: number;
		denied: number;
		incidents: number;
	};
	agents_monitored: string[];
	feed_version: string;
	signature?: string;
}

export interface WeeklyReportData {
	period: { start: string; end: string };
	total_decisions: number;
	decision_breakdown: { allowed: number; confirmed: number; denied: number };
	top_rules: Array<{ rule_id: string; count: number }>;
	agents: Array<{ name: string; decision_count: number }>;
	sessions: number;
	safety_score: number;
	trends: { vs_previous_week: { total_diff: number; deny_diff: number } };
	incidents: number;
}

export interface TeamMemberInfo {
	id: string;
	email: string;
	role: "admin" | "member" | "readonly";
	added_at: string;
	last_seen?: string;
}

export interface TeamStatus {
	connected: boolean;
	team_id?: string;
	member_count?: number;
	policy?: {
		profile: string;
		enforce: boolean;
	};
}

export interface FalsePositiveAlertUI {
	rule_id: string;
	current_override_rate: number;
	severity: "info" | "warning" | "critical";
	suggestion: string;
	reason: string;
	sample_size: number;
}

export interface CurationTaskUI {
	rule_id: string;
	pack: string;
	current_status: string;
	override_rate: number;
	recommended_action: string;
	reason: string;
}

export interface SkillScanResultUI {
	name: string;
	path: string;
	status: "clean" | "warning" | "revoked" | "error";
	findings: Array<{
		type: string;
		severity: string;
		detail: string;
	}>;
}

export interface TeamAuditSummary {
	total: number;
	by_rule: Record<string, number>;
	by_member: Record<string, number>;
	by_action: Record<string, number>;
}

export interface TeamMemoryStatsEntry {
	rule_id: string;
	team_total: number;
	team_allowed: number;
	team_denied: number;
	member_count: number;
	team_override_rate: number;
	updated_at: string;
}
