import type { AuditEntry } from "../types";

interface Props {
	entries: AuditEntry[];
}

const DISPOSITION_LABELS: Record<number, { label: string; color: string }> = {
	1: { label: "Allow", color: "text-green-400" },
	2: { label: "Confirm", color: "text-yellow-400" },
	5: { label: "Deny", color: "text-red-400" },
};

const RISK_COLORS: Record<string, string> = {
	low: "bg-green-900/30 text-green-400 border-green-800",
	medium: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
	high: "bg-red-900/30 text-red-400 border-red-800",
};

function getEnrichment(entry: AuditEntry, name: string): string | undefined {
	return entry.enrichments?.find((e) => e.name === name)?.value;
}

function formatDownloads(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
}

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
					label: entry.disposition ?? `D${entry.disposition_id}`,
					color: "text-gray-400",
				};
				const risk = getEnrichment(entry, "risk_level") ?? "low";
				const riskStyle = RISK_COLORS[risk] ?? RISK_COLORS.low;
				const ruleId = getEnrichment(entry, "rule_id") ?? "—";
				const content = entry.api?.request?.data?.content ?? entry.api?.operation ?? "—";
				const time = new Date(entry.time).toLocaleTimeString();

				const downloads = getEnrichment(entry, "package_downloads");
				const cveCount = getEnrichment(entry, "cve_count");
				const hasPostinstall = getEnrichment(entry, "has_postinstall");
				const communityRate = getEnrichment(entry, "community_allow_rate");
				const communitySize = getEnrichment(entry, "community_sample_size");

				return (
					<div
						key={`${entry.time}-${i}`}
						className="flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
					>
						<span className="text-xs text-gray-500 w-20 shrink-0">{time}</span>
						<span className={`text-sm font-medium w-16 shrink-0 ${disp.color}`}>{disp.label}</span>
						<span className={`text-xs px-2 py-0.5 rounded border ${riskStyle} shrink-0`}>
							{risk}
						</span>
						<code className="text-sm text-gray-300 truncate flex-1 font-mono">{content}</code>
						<div className="flex items-center gap-2 shrink-0">
							{downloads && (
								<span
									className="text-xs px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800"
									title="Weekly downloads"
								>
									{formatDownloads(Number(downloads))}
								</span>
							)}
							{cveCount && Number(cveCount) > 0 && (
								<span
									className="text-xs px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800"
									title="Known CVEs"
								>
									{cveCount} CVE
								</span>
							)}
							{hasPostinstall === "true" && (
								<span
									className="text-xs px-1.5 py-0.5 rounded bg-orange-900/30 text-orange-400 border border-orange-800"
									title="Has postinstall script"
								>
									postinstall
								</span>
							)}
							{communityRate && communitySize && Number(communitySize) >= 10 && (
								<span
									className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/30 text-indigo-400 border border-indigo-800"
									title={`Community: ${Math.round(Number(communityRate) * 100)}% allowed (${Number(communitySize).toLocaleString()} decisions)`}
								>
									{Math.round(Number(communityRate) * 100)}% allowed
								</span>
							)}
						</div>
						<span className="text-xs text-gray-600 shrink-0">{ruleId}</span>
					</div>
				);
			})}
		</div>
	);
}
