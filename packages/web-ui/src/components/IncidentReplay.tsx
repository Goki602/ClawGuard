import { useEffect, useState } from "react";
import type { SessionSummary, SessionTimeline } from "../types";

const API_BASE = "http://127.0.0.1:19280";

const ACTION_COLORS: Record<string, string> = {
	allow: "text-green-400",
	log: "text-gray-500",
	confirm: "text-yellow-400",
	deny: "text-red-400",
};

const RISK_BADGE: Record<string, string> = {
	low: "bg-green-900/30 text-green-400 border-green-800",
	medium: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
	high: "bg-red-900/30 text-red-400 border-red-800",
};

export function IncidentReplay() {
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [sessions, setSessions] = useState<SessionSummary[]>([]);
	const [selected, setSelected] = useState<SessionTimeline | null>(null);
	const [showCausal, setShowCausal] = useState(false);

	useEffect(() => {
		fetch(`${API_BASE}/api/replay/sessions?date=${date}`)
			.then((r) => r.json())
			.then((d) => setSessions(d.sessions ?? []))
			.catch(() => setSessions([]));
	}, [date]);

	const loadSession = (id: string) => {
		const endpoint = showCausal
			? `${API_BASE}/api/replay/session/${encodeURIComponent(id)}/causal`
			: `${API_BASE}/api/replay/session/${encodeURIComponent(id)}`;
		fetch(endpoint)
			.then((r) => r.json())
			.then((d) => setSelected(d))
			.catch(() => setSelected(null));
	};

	return (
		<div className="flex gap-6 h-[calc(100vh-200px)]">
			{/* Left panel: session list */}
			<div className="w-80 shrink-0 space-y-3">
				<input
					type="date"
					value={date}
					onChange={(e) => setDate(e.target.value)}
					className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 focus:outline-none focus:border-claw-500"
				/>
				<label className="flex items-center gap-2 text-xs text-gray-400">
					<input
						type="checkbox"
						checked={showCausal}
						onChange={(e) => setShowCausal(e.target.checked)}
						className="rounded bg-gray-800 border-gray-600"
					/>
					Show causal chains
				</label>
				<div className="space-y-1 overflow-y-auto">
					{sessions.length === 0 && (
						<p className="text-sm text-gray-500 py-4 text-center">No sessions for this date</p>
					)}
					{sessions.map((s) => (
						<button
							key={s.session_id}
							type="button"
							onClick={() => loadSession(s.session_id)}
							className={`w-full text-left px-3 py-2 rounded border transition-colors ${
								selected?.session_id === s.session_id
									? "bg-claw-900/30 border-claw-700"
									: "bg-gray-900 border-gray-800 hover:border-gray-700"
							}`}
						>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-300 font-mono truncate">
									{s.session_id.slice(0, 12)}...
								</span>
								{s.has_incidents && (
									<span className="text-xs px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800">
										incident
									</span>
								)}
							</div>
							<div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
								<span>{s.agent}</span>
								<span>{s.event_count} events</span>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Right panel: timeline */}
			<div className="flex-1 overflow-y-auto">
				{!selected ? (
					<div className="text-center py-16 text-gray-500">
						<p className="text-lg">Select a session</p>
						<p className="text-sm mt-2">Click a session to view its decision timeline</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-medium text-gray-200">
									Session:{" "}
									<span className="font-mono text-claw-500">
										{selected.session_id.slice(0, 16)}...
									</span>
								</h3>
								<p className="text-sm text-gray-500 mt-1">
									{selected.agent} | {selected.start_time} — {selected.end_time}
								</p>
							</div>
							<div className="text-right">
								<div className="text-2xl font-bold text-gray-200">{selected.risk_score}</div>
								<div className="text-xs text-gray-500">Risk Score</div>
							</div>
						</div>

						<div className="space-y-1">
							{selected.events.map((e, i) => (
								<div
									key={`${e.time}-${i}`}
									className={`flex items-center gap-3 px-3 py-2 rounded border ${
										e.flagged ? "bg-gray-900 border-yellow-800/50" : "bg-gray-900 border-gray-800"
									}`}
								>
									<span className="text-xs text-gray-600 w-6 shrink-0">{i}</span>
									<span className="text-xs text-gray-500 w-20 shrink-0">
										{new Date(e.time).toLocaleTimeString()}
									</span>
									<span
										className={`text-sm font-medium w-16 shrink-0 ${ACTION_COLORS[e.action] ?? "text-gray-400"}`}
									>
										{e.action}
									</span>
									<span
										className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${RISK_BADGE[e.risk] ?? RISK_BADGE.low}`}
									>
										{e.risk}
									</span>
									<span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded shrink-0">
										{e.tool}
									</span>
									<code className="text-xs text-gray-400 truncate flex-1 font-mono">
										{e.content}
									</code>
									{e.flagged && <span className="text-yellow-400 shrink-0">!</span>}
								</div>
							))}
						</div>

						{selected.causal_chains.length > 0 && (
							<div className="mt-4 space-y-2">
								<h4 className="text-sm font-medium text-gray-300">Causal Chains</h4>
								{selected.causal_chains.map((link) => (
									<div
										key={`chain-${link.from_index}-${link.to_index}`}
										className="px-3 py-2 bg-gray-900 rounded border border-dashed border-orange-800/50"
									>
										<div className="flex items-center gap-2 text-xs">
											<span className="text-orange-400 font-mono">[{link.from_index}]</span>
											<span className="text-gray-600">→</span>
											<span className="text-orange-400 font-mono">[{link.to_index}]</span>
										</div>
										<p className="text-xs text-gray-400 mt-1">{link.reason}</p>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
