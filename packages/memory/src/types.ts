export interface DecisionRecord {
	rule_id: string;
	action: string;
	content_hash: string;
	user_response?: string;
	agent?: string;
	session_id?: string;
	timestamp?: string;
}

export interface RuleStats {
	total: number;
	allowed: number;
	denied: number;
	confirmed: number;
	override_rate: number;
}
