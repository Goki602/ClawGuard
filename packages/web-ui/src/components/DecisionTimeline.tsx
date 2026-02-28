import type { AuditEntry } from "../types";

interface Props {
	entries: AuditEntry[];
}

const DISPOSITION_LABELS: Record<number, { label: string; color: string }> = {
	1: { label: "Allow", color: "text-green-400" },
	2: { label: "Confirm", color: "text-yellow-400" },
	5: { label: "Deny", color: "text-red-400" },
	99: { label: "Log", color: "text-blue-400" },
};

const RISK_COLORS: Record<string, string> = {
	low: "bg-green-900/30 text-green-400 border-green-800",
	medium: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
	high: "bg-red-900/30 text-red-400 border-red-800",
};

export function DecisionTimeline({ entries }: Props) {
	if (entries.length === 0) {
		return (
			<div className="text-center py-16 text-gray-500">
				<p className="text-lg">No decisions recorded yet</p>
				<p className="text-sm mt-2">
					Decisions will appear here as ClawGuard evaluates tool requests
				</p>
			</div>
		);
	}

	const sorted = [...entries].reverse();

	return (
		<div className="space-y-2">
			{sorted.map((entry, i) => {
				const disp = DISPOSITION_LABELS[entry.disposition_id] ?? {
					label: `D${entry.disposition_id}`,
					color: "text-gray-400",
				};
				const risk = entry.unmapped?.risk ?? "low";
				const riskStyle = RISK_COLORS[risk] ?? RISK_COLORS.low;
				const time = new Date(entry.time).toLocaleTimeString();

				return (
					<div
						key={`${entry.time}-${i}`}
						className="flex items-center gap-4 px-4 py-3 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
					>
						<span className="text-xs text-gray-500 w-20 shrink-0">{time}</span>
						<span className={`text-sm font-medium w-16 shrink-0 ${disp.color}`}>{disp.label}</span>
						<span className={`text-xs px-2 py-0.5 rounded border ${riskStyle} shrink-0`}>
							{risk}
						</span>
						<code className="text-sm text-gray-300 truncate flex-1 font-mono">
							{entry.unmapped?.content ?? entry.api?.operation ?? "—"}
						</code>
						<span className="text-xs text-gray-600 shrink-0">{entry.unmapped?.rule_id ?? "—"}</span>
					</div>
				);
			})}
		</div>
	);
}
