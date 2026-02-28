export interface HealthStatus {
	status: string;
	rules: number;
}

export interface AuditEntry {
	time: number;
	class_uid: number;
	activity_id: number;
	severity_id: number;
	status_id: number;
	disposition_id: number;
	api: {
		operation: string;
		request: {
			uid: string;
			data: Record<string, unknown>;
		};
	};
	actor: {
		session: { uid: string };
		process: { cmd_line: string };
	};
	metadata: {
		product: { name: string; version: string };
		profiles: string[];
	};
	unmapped: {
		rule_id: string;
		risk: string;
		content: string;
	};
}
