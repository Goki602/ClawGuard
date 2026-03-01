import { useEffect, useState } from "react";
import type { FalsePositiveAlertUI } from "../types";

interface RuleInfo {
	id: string;
	tool: string;
	regex: string;
	risk: string;
	title: string;
}

const API_BASE = "http://127.0.0.1:19280";

const RISK_BADGE: Record<string, string> = {
	low: "bg-green-900/30 text-green-400 border-green-800",
	medium: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
	high: "bg-red-900/30 text-red-400 border-red-800",
};

const ALERT_BADGE: Record<string, string> = {
	critical: "bg-red-900 text-red-300",
	warning: "bg-yellow-900 text-yellow-300",
	info: "bg-green-900 text-green-300",
};

export function RuleInspector() {
	const [rules, setRules] = useState<RuleInfo[]>([]);
	const [alerts, setAlerts] = useState<FalsePositiveAlertUI[]>([]);
	const [filter, setFilter] = useState<"all" | "tuning">("all");

	useEffect(() => {
		fetch(`${API_BASE}/api/rules`)
			.then((r) => r.json())
			.then((d) => setRules(d.rules ?? []))
			.catch(() => setRules([]));
		fetch(`${API_BASE}/api/monitor/alerts`)
			.then((r) => r.json())
			.then((d) => setAlerts(d.alerts ?? []))
			.catch(() => setAlerts([]));
	}, []);

	const alertMap = new Map(alerts.map((a) => [a.rule_id, a]));
	const needsTuning = alerts.filter((a) => a.severity !== "info").length;

	const filteredRules =
		filter === "tuning"
			? rules.filter((r) => {
					const a = alertMap.get(r.id);
					return a && a.severity !== "info";
				})
			: rules;

	if (rules.length === 0) {
		return (
			<div className="text-center py-16 text-gray-500">
				<p className="text-lg">No rules loaded</p>
				<p className="text-sm mt-2">Start the ClawGuard engine to inspect loaded rules</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{needsTuning > 0 && (
				<div className="flex items-center gap-3 mb-4">
					<button
						type="button"
						className={`px-3 py-1 rounded text-sm ${filter === "all" ? "bg-gray-700 text-white" : "bg-gray-900 text-gray-400"}`}
						onClick={() => setFilter("all")}
					>
						All ({rules.length})
					</button>
					<button
						type="button"
						className={`px-3 py-1 rounded text-sm ${filter === "tuning" ? "bg-yellow-900 text-yellow-300" : "bg-gray-900 text-gray-400"}`}
						onClick={() => setFilter("tuning")}
					>
						Needs Tuning ({needsTuning})
					</button>
				</div>
			)}
			{filteredRules.map((rule) => {
				const alert = alertMap.get(rule.id);
				return (
					<div key={rule.id} className="px-4 py-3 bg-gray-900 rounded-lg border border-gray-800">
						<div className="flex items-center gap-3">
							<span className="font-mono text-sm text-claw-500 font-medium">{rule.id}</span>
							<span
								className={`text-xs px-2 py-0.5 rounded border ${RISK_BADGE[rule.risk] ?? RISK_BADGE.low}`}
							>
								{rule.risk}
							</span>
							<span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
								{rule.tool}
							</span>
							{alert && alert.severity !== "info" && (
								<span className={`text-xs px-2 py-0.5 rounded ${ALERT_BADGE[alert.severity]}`}>
									{alert.severity === "critical" ? "✗" : "⚠"}{" "}
									{(alert.current_override_rate * 100).toFixed(0)}% override
								</span>
							)}
						</div>
						<p className="text-sm text-gray-400 mt-1">{rule.title}</p>
						<code className="text-xs text-gray-600 mt-1 block font-mono">/{rule.regex}/</code>
						{alert && alert.severity !== "info" && (
							<p className="text-xs text-gray-500 mt-1">
								{alert.suggestion}: {alert.reason}
							</p>
						)}
					</div>
				);
			})}
		</div>
	);
}
