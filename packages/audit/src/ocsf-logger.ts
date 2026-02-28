import type { PolicyDecision, ToolRequest } from "@clawguard/core";

const DISPOSITION_MAP: Record<string, { id: number; label: string }> = {
	allow: { id: 1, label: "Allowed" },
	log: { id: 1, label: "Allowed" },
	confirm: { id: 2, label: "Blocked" },
	deny: { id: 5, label: "Dropped" },
};

const SEVERITY_MAP: Record<string, number> = {
	low: 1,
	medium: 3,
	high: 4,
};

export interface OcsfEvent {
	class_uid: 6003;
	class_name: "API Activity";
	category_uid: 6;
	category_name: "Application Activity";
	severity_id: number;
	time: string;
	metadata: {
		product: { name: string; version: string; vendor_name: string };
		version: string;
		log_name: string;
	};
	actor: {
		session: { uid: string };
		app_name: string;
	};
	api: {
		operation: string;
		request: { data: { content: string } };
	};
	disposition_id: number;
	disposition: string;
	enrichments: Array<{ name: string; value: string }>;
	unmapped?: Record<string, unknown>;
}

export function createOcsfEvent(
	request: ToolRequest,
	decision: PolicyDecision,
	extra?: { user_response?: string; execution_status?: string; exit_code?: number },
): OcsfEvent {
	const disp = DISPOSITION_MAP[decision.action] ?? DISPOSITION_MAP.allow;

	const event: OcsfEvent = {
		class_uid: 6003,
		class_name: "API Activity",
		category_uid: 6,
		category_name: "Application Activity",
		severity_id: SEVERITY_MAP[decision.risk] ?? 1,
		time: new Date().toISOString(),
		metadata: {
			product: { name: "ClawGuard", version: "0.1.0", vendor_name: "ClawGuard" },
			version: "1.1.0",
			log_name: "policy_decision",
		},
		actor: {
			session: { uid: request.context.session_id },
			app_name: request.context.agent,
		},
		api: {
			operation: request.tool,
			request: { data: { content: request.content } },
		},
		disposition_id: disp.id,
		disposition: disp.label,
		enrichments: [
			{ name: "rule_id", value: decision.rule_id },
			{ name: "risk_level", value: decision.risk },
			{ name: "feed_version", value: decision.feed_version },
			{ name: "action", value: decision.action },
		],
	};

	if (decision.explain) {
		event.enrichments.push({ name: "explain_title", value: decision.explain.title });
	}

	if (extra) {
		event.unmapped = extra;
	}

	return event;
}
