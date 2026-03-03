import { useEffect, useState } from "react";
import type { TeamAuditSummary, TeamMemberInfo, TeamMemoryStatsEntry, TeamStatus } from "../types";

const API_BASE = "http://127.0.0.1:19280";

type TeamTab = "members" | "audit" | "memory";

export function TeamDashboard() {
	const [status, setStatus] = useState<TeamStatus | null>(null);
	const [members, setMembers] = useState<TeamMemberInfo[]>([]);
	const [audit, setAudit] = useState<TeamAuditSummary | null>(null);
	const [memoryStats, setMemoryStats] = useState<TeamMemoryStatsEntry[]>([]);
	const [tab, setTab] = useState<TeamTab>("members");

	useEffect(() => {
		fetch(`${API_BASE}/api/team/status`)
			.then((r) => r.json())
			.then((d) => setStatus(d))
			.catch(() => setStatus(null));
		fetch(`${API_BASE}/api/team/members`)
			.then((r) => r.json())
			.then((d) => setMembers(d.members ?? []))
			.catch(() => setMembers([]));
		fetch(`${API_BASE}/api/team/audit/summary`)
			.then((r) => r.json())
			.then((d) => setAudit(d))
			.catch(() => setAudit(null));
		fetch(`${API_BASE}/api/team/memory/stats`)
			.then((r) => r.json())
			.then((d) => setMemoryStats(d.stats ?? []))
			.catch(() => setMemoryStats([]));
	}, []);

	if (!status?.connected) {
		return (
			<div className="text-gray-400 text-center py-12">
				<p className="text-lg">Team features not configured</p>
				<p className="text-sm mt-2">Set up team with: claw-guard team serve --admin-key YOUR_KEY</p>
			</div>
		);
	}

	const tabs: Array<{ id: TeamTab; label: string }> = [
		{ id: "members", label: "Members" },
		{ id: "audit", label: "Audit Summary" },
		{ id: "memory", label: "Memory Stats" },
	];

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-3 gap-4">
				<div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
					<div className="text-sm text-gray-400">Status</div>
					<div className="text-xl font-bold text-green-400">Connected</div>
				</div>
				<div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
					<div className="text-sm text-gray-400">Members</div>
					<div className="text-xl font-bold">{status.member_count ?? 0}</div>
				</div>
				<div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
					<div className="text-sm text-gray-400">Policy</div>
					<div className="text-xl font-bold">{status.policy?.profile ?? "—"}</div>
					<div className="text-xs text-gray-500">
						{status.policy?.enforce ? "Enforced" : "Advisory"}
					</div>
				</div>
			</div>

			<div className="flex gap-2 border-b border-gray-800 pb-0">
				{tabs.map((t) => (
					<button
						key={t.id}
						type="button"
						className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-claw-500 text-claw-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}
						onClick={() => setTab(t.id)}
					>
						{t.label}
					</button>
				))}
			</div>

			{tab === "members" && <MembersTab members={members} />}
			{tab === "audit" && <AuditTab audit={audit} />}
			{tab === "memory" && <MemoryTab stats={memoryStats} />}
		</div>
	);
}

function MembersTab({ members }: { members: TeamMemberInfo[] }) {
	if (members.length === 0) {
		return <div className="text-gray-400 text-center py-8">No members yet</div>;
	}
	return (
		<div className="bg-gray-900 rounded-lg border border-gray-800">
			<table className="w-full text-sm">
				<thead>
					<tr className="text-gray-400 text-left">
						<th className="px-4 py-2">Email</th>
						<th className="px-4 py-2">Role</th>
						<th className="px-4 py-2">Added</th>
						<th className="px-4 py-2">Last Seen</th>
					</tr>
				</thead>
				<tbody>
					{members.map((m) => (
						<tr key={m.id} className="border-t border-gray-800">
							<td className="px-4 py-2">{m.email}</td>
							<td className="px-4 py-2">
								<span
									className={`px-2 py-0.5 rounded text-xs ${m.role === "admin" ? "bg-purple-900 text-purple-300" : m.role === "member" ? "bg-blue-900 text-blue-300" : "bg-gray-800 text-gray-400"}`}
								>
									{m.role}
								</span>
							</td>
							<td className="px-4 py-2 text-gray-400">{m.added_at?.split("T")[0] ?? "—"}</td>
							<td className="px-4 py-2 text-gray-400">{m.last_seen?.split("T")[0] ?? "—"}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function AuditTab({ audit }: { audit: TeamAuditSummary | null }) {
	if (!audit || audit.total === 0) {
		return <div className="text-gray-400 text-center py-8">No audit data yet</div>;
	}
	return (
		<div className="space-y-4">
			<div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
				<div className="text-sm text-gray-400 mb-2">Total Decisions</div>
				<div className="text-3xl font-bold">{audit.total}</div>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<SummaryCard title="By Action" data={audit.by_action} colorFn={actionColor} />
				<SummaryCard title="Top Rules" data={audit.by_rule} />
				<SummaryCard title="By Member" data={audit.by_member} />
			</div>
		</div>
	);
}

function SummaryCard({
	title,
	data,
	colorFn,
}: {
	title: string;
	data: Record<string, number>;
	colorFn?: (key: string) => string;
}) {
	const entries = Object.entries(data)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10);
	return (
		<div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
			<div className="text-sm text-gray-400 mb-3">{title}</div>
			{entries.length === 0 ? (
				<div className="text-gray-500 text-xs">No data</div>
			) : (
				<div className="space-y-2">
					{entries.map(([key, count]) => (
						<div key={key} className="flex items-center justify-between text-xs">
							<span className={colorFn ? colorFn(key) : "text-gray-300"}>{key}</span>
							<span className="text-gray-400 font-mono">{count}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function actionColor(action: string): string {
	if (action === "allow" || action === "log") return "text-green-400";
	if (action === "confirm") return "text-yellow-400";
	if (action === "deny") return "text-red-400";
	return "text-gray-300";
}

function MemoryTab({ stats }: { stats: TeamMemoryStatsEntry[] }) {
	if (stats.length === 0) {
		return <div className="text-gray-400 text-center py-8">No cross-team memory data yet</div>;
	}
	return (
		<div className="bg-gray-900 rounded-lg border border-gray-800">
			<table className="w-full text-sm">
				<thead>
					<tr className="text-gray-400 text-left">
						<th className="px-4 py-2">Rule</th>
						<th className="px-4 py-2 text-right">Total</th>
						<th className="px-4 py-2 text-right">Allowed</th>
						<th className="px-4 py-2 text-right">Denied</th>
						<th className="px-4 py-2 text-right">Override Rate</th>
						<th className="px-4 py-2 text-right">Members</th>
					</tr>
				</thead>
				<tbody>
					{stats.map((s) => (
						<tr key={s.rule_id} className="border-t border-gray-800">
							<td className="px-4 py-2 font-mono text-xs">{s.rule_id}</td>
							<td className="px-4 py-2 text-right">{s.team_total}</td>
							<td className="px-4 py-2 text-right text-green-400">{s.team_allowed}</td>
							<td className="px-4 py-2 text-right text-red-400">{s.team_denied}</td>
							<td className="px-4 py-2 text-right">
								<span
									className={
										s.team_override_rate > 0.5
											? "text-red-400"
											: s.team_override_rate > 0.3
												? "text-yellow-400"
												: "text-green-400"
									}
								>
									{(s.team_override_rate * 100).toFixed(1)}%
								</span>
							</td>
							<td className="px-4 py-2 text-right text-gray-400">{s.member_count}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
