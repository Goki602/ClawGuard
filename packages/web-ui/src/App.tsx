import { useEffect, useState } from "react";
import { DecisionTimeline } from "./components/DecisionTimeline";
import { Header } from "./components/Header";
import { RuleInspector } from "./components/RuleInspector";
import { StatusBar } from "./components/StatusBar";
import type { AuditEntry, HealthStatus } from "./types";

const API_BASE = "http://127.0.0.1:19280";

export function App() {
	const [health, setHealth] = useState<HealthStatus | null>(null);
	const [entries, setEntries] = useState<AuditEntry[]>([]);
	const [tab, setTab] = useState<"timeline" | "rules">("timeline");

	useEffect(() => {
		fetch(`${API_BASE}/health`)
			.then((r) => r.json())
			.then((d) => setHealth(d))
			.catch(() => setHealth(null));
	}, []);

	useEffect(() => {
		fetch(`${API_BASE}/api/logs/today`)
			.then((r) => r.json())
			.then((d) => setEntries(d.entries ?? []))
			.catch(() => setEntries([]));
	}, []);

	return (
		<div className="min-h-screen bg-gray-950 text-gray-100">
			<Header />
			<StatusBar health={health} entryCount={entries.length} />

			<nav className="border-b border-gray-800 px-6">
				<div className="flex gap-4">
					<button
						type="button"
						className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "timeline" ? "border-claw-500 text-claw-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}
						onClick={() => setTab("timeline")}
					>
						Decision Timeline
					</button>
					<button
						type="button"
						className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "rules" ? "border-claw-500 text-claw-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}
						onClick={() => setTab("rules")}
					>
						Rule Inspector
					</button>
				</div>
			</nav>

			<main className="p-6">
				{tab === "timeline" ? <DecisionTimeline entries={entries} /> : <RuleInspector />}
			</main>
		</div>
	);
}
