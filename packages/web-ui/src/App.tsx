import { useEffect, useState } from "react";
import { DecisionTimeline } from "./components/DecisionTimeline";
import { Header } from "./components/Header";
import { IncidentReplay } from "./components/IncidentReplay";
import { RuleInspector } from "./components/RuleInspector";
import { SecurityPassport } from "./components/SecurityPassport";
import { SkillsAV } from "./components/SkillsAV";
import { StatusBar } from "./components/StatusBar";
import { TeamDashboard } from "./components/TeamDashboard";
import { WeeklyReport } from "./components/WeeklyReport";
import type { AuditEntry, FeedStatus, HealthStatus, LicenseStatus } from "./types";

type TabId = "timeline" | "rules" | "replay" | "passport" | "report" | "skills" | "team";

const API_BASE = "http://127.0.0.1:19280";

export function App() {
	const [health, setHealth] = useState<HealthStatus | null>(null);
	const [entries, setEntries] = useState<AuditEntry[]>([]);
	const [tab, setTab] = useState<TabId>("timeline");
	const [feed, setFeed] = useState<FeedStatus | null>(null);
	const [license, setLicense] = useState<LicenseStatus | null>(null);

	const isMaxTier = license?.license?.plan === "max";
	const isProOrMax = license?.license?.plan === "pro" || isMaxTier;

	useEffect(() => {
		fetch(`${API_BASE}/health`)
			.then((r) => r.json())
			.then((d) => setHealth(d))
			.catch(() => setHealth(null));
		fetch(`${API_BASE}/api/feed/status`)
			.then((r) => r.json())
			.then((d) => setFeed(d))
			.catch(() => setFeed(null));
		fetch(`${API_BASE}/api/license`)
			.then((r) => r.json())
			.then((d) => setLicense(d))
			.catch(() => setLicense(null));
	}, []);

	useEffect(() => {
		fetch(`${API_BASE}/api/logs/today`)
			.then((r) => r.json())
			.then((d) => setEntries(d.entries ?? []))
			.catch(() => setEntries([]));
	}, []);

	const tabs: Array<{ id: TabId; label: string; show: boolean }> = [
		{ id: "timeline", label: "Decision Timeline", show: true },
		{ id: "rules", label: "Rule Inspector", show: true },
		{ id: "replay", label: "Incident Replay", show: true },
		{ id: "passport", label: "Passport", show: true },
		{ id: "report", label: "Weekly Report", show: true },
		{ id: "skills", label: "Skills AV", show: isProOrMax },
		{ id: "team", label: "Team", show: isMaxTier },
	];

	return (
		<div className="min-h-screen bg-gray-950 text-gray-100">
			<Header />
			<StatusBar health={health} entryCount={entries.length} feed={feed} license={license} />

			<nav className="border-b border-gray-800 px-6">
				<div className="flex gap-4">
					{tabs
						.filter((t) => t.show)
						.map((t) => (
							<button
								key={t.id}
								type="button"
								className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-claw-500 text-claw-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}
								onClick={() => setTab(t.id)}
							>
								{t.label}
							</button>
						))}
				</div>
			</nav>

			<main className="p-6">
				{tab === "timeline" && <DecisionTimeline entries={entries} />}
				{tab === "rules" && <RuleInspector />}
				{tab === "replay" && <IncidentReplay />}
				{tab === "passport" && <SecurityPassport />}
				{tab === "report" && <WeeklyReport />}
				{tab === "skills" && <SkillsAV />}
				{tab === "team" && <TeamDashboard />}
			</main>
		</div>
	);
}
