import { useEffect, useState } from "react";

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

export function RuleInspector() {
	const [rules, setRules] = useState<RuleInfo[]>([]);

	useEffect(() => {
		fetch(`${API_BASE}/api/rules`)
			.then((r) => r.json())
			.then((d) => setRules(d.rules ?? []))
			.catch(() => setRules([]));
	}, []);

	if (rules.length === 0) {
		return (
			<div className="text-center py-16 text-gray-500">
				<p className="text-lg">No rules loaded</p>
				<p className="text-sm mt-2">Start the ClawGuard engine to inspect loaded rules</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{rules.map((rule) => (
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
					</div>
					<p className="text-sm text-gray-400 mt-1">{rule.title}</p>
					<code className="text-xs text-gray-600 mt-1 block font-mono">/{rule.regex}/</code>
				</div>
			))}
		</div>
	);
}
