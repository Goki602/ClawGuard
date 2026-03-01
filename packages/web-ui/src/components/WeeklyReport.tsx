import { useEffect, useState } from "react";
import type { WeeklyReportData } from "../types";

const API_BASE = "http://127.0.0.1:19280";

export function WeeklyReport() {
	const [report, setReport] = useState<WeeklyReportData | null>(null);
	const [offset, setOffset] = useState(0);

	useEffect(() => {
		fetch(`${API_BASE}/api/report/weekly?offset=${offset}`)
			.then((r) => r.json())
			.then((d) => setReport(d))
			.catch(() => setReport(null));
	}, [offset]);

	if (!report) {
		return (
			<div className="text-center py-16 text-gray-500">
				<p className="text-lg">Loading report...</p>
			</div>
		);
	}

	const scoreColor =
		report.safety_score >= 80
			? "text-green-400"
			: report.safety_score >= 50
				? "text-yellow-400"
				: "text-red-400";
	const scoreBg =
		report.safety_score >= 80
			? "stroke-green-400"
			: report.safety_score >= 50
				? "stroke-yellow-400"
				: "stroke-red-400";

	const circumference = 2 * Math.PI * 40;
	const strokeDashoffset = circumference - (report.safety_score / 100) * circumference;

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			{/* Header with week navigation */}
			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={() => setOffset(offset - 1)}
					className="px-3 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition-colors text-sm"
				>
					Previous
				</button>
				<h3 className="text-lg font-medium text-gray-200">
					{report.period.start} — {report.period.end}
				</h3>
				<button
					type="button"
					onClick={() => setOffset(offset + 1)}
					disabled={offset >= 0}
					className="px-3 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition-colors text-sm disabled:opacity-30"
				>
					Next
				</button>
			</div>

			{/* Safety Score Ring */}
			<div className="flex items-center justify-center gap-8">
				<div className="relative w-28 h-28">
					<svg
						className="w-full h-full -rotate-90"
						viewBox="0 0 100 100"
						role="img"
						aria-label={`Safety score: ${report.safety_score}`}
					>
						<title>{`Safety score: ${report.safety_score}`}</title>
						<circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
						<circle
							cx="50"
							cy="50"
							r="40"
							fill="none"
							className={scoreBg}
							strokeWidth="8"
							strokeLinecap="round"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
						/>
					</svg>
					<div className="absolute inset-0 flex items-center justify-center">
						<span className={`text-2xl font-bold ${scoreColor}`}>{report.safety_score}</span>
					</div>
				</div>
				<div className="text-sm text-gray-400">
					<p className={scoreColor}>
						{report.safety_score >= 80
							? "Excellent"
							: report.safety_score >= 50
								? "Needs attention"
								: "At risk"}
					</p>
					<p className="mt-1">{report.total_decisions} total decisions</p>
					<p>{report.sessions} sessions</p>
					<p>{report.incidents} incidents</p>
				</div>
			</div>

			{/* Decision Breakdown Bar */}
			<div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
				<h4 className="text-sm font-medium text-gray-300 mb-3">Decision Breakdown</h4>
				{report.total_decisions > 0 ? (
					<>
						<div className="flex h-4 rounded-full overflow-hidden bg-gray-800">
							{report.decision_breakdown.allowed > 0 && (
								<div
									className="bg-green-500 transition-all"
									style={{
										width: `${(report.decision_breakdown.allowed / report.total_decisions) * 100}%`,
									}}
								/>
							)}
							{report.decision_breakdown.confirmed > 0 && (
								<div
									className="bg-yellow-500 transition-all"
									style={{
										width: `${(report.decision_breakdown.confirmed / report.total_decisions) * 100}%`,
									}}
								/>
							)}
							{report.decision_breakdown.denied > 0 && (
								<div
									className="bg-red-500 transition-all"
									style={{
										width: `${(report.decision_breakdown.denied / report.total_decisions) * 100}%`,
									}}
								/>
							)}
						</div>
						<div className="flex justify-between mt-2 text-xs text-gray-500">
							<span className="text-green-400">{report.decision_breakdown.allowed} allowed</span>
							<span className="text-yellow-400">
								{report.decision_breakdown.confirmed} confirmed
							</span>
							<span className="text-red-400">{report.decision_breakdown.denied} denied</span>
						</div>
					</>
				) : (
					<p className="text-sm text-gray-500">No decisions this period</p>
				)}
			</div>

			{/* Top Rules */}
			{report.top_rules.length > 0 && (
				<div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
					<h4 className="text-sm font-medium text-gray-300 mb-3">Top Rules</h4>
					<div className="space-y-2">
						{report.top_rules.slice(0, 5).map((rule) => {
							const maxCount = report.top_rules[0]?.count ?? 1;
							return (
								<div key={rule.rule_id} className="flex items-center gap-3">
									<span className="text-xs text-gray-400 font-mono w-40 shrink-0 truncate">
										{rule.rule_id}
									</span>
									<div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
										<div
											className="h-full bg-claw-500 rounded-full transition-all"
											style={{ width: `${(rule.count / maxCount) * 100}%` }}
										/>
									</div>
									<span className="text-xs text-gray-500 w-10 text-right shrink-0">
										{rule.count}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Agents */}
			{report.agents.length > 0 && (
				<div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
					<h4 className="text-sm font-medium text-gray-300 mb-3">Agents</h4>
					<div className="flex gap-3">
						{report.agents.map((a) => (
							<div key={a.name} className="bg-gray-800 rounded px-3 py-2 text-center">
								<div className="text-sm text-gray-300">{a.name}</div>
								<div className="text-xs text-gray-500 mt-1">{a.decision_count} decisions</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Trends */}
			<div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
				<h4 className="text-sm font-medium text-gray-300 mb-3">Trends vs Previous Week</h4>
				<div className="flex gap-8 text-sm">
					<div>
						<span className="text-gray-500">Total decisions: </span>
						<span
							className={
								report.trends.vs_previous_week.total_diff >= 0 ? "text-gray-300" : "text-green-400"
							}
						>
							{report.trends.vs_previous_week.total_diff >= 0 ? "+" : ""}
							{report.trends.vs_previous_week.total_diff}
						</span>
					</div>
					<div>
						<span className="text-gray-500">Denied: </span>
						<span
							className={
								report.trends.vs_previous_week.deny_diff <= 0 ? "text-green-400" : "text-red-400"
							}
						>
							{report.trends.vs_previous_week.deny_diff >= 0 ? "+" : ""}
							{report.trends.vs_previous_week.deny_diff}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
