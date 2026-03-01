import { useEffect, useState } from "react";
import type { TeamMemberInfo, TeamStatus } from "../types";

const API_BASE = "http://127.0.0.1:19280";

export function TeamDashboard() {
	const [status, setStatus] = useState<TeamStatus | null>(null);
	const [members, setMembers] = useState<TeamMemberInfo[]>([]);

	useEffect(() => {
		fetch(`${API_BASE}/api/team/status`)
			.then((r) => r.json())
			.then((d) => setStatus(d))
			.catch(() => setStatus(null));
		fetch(`${API_BASE}/api/team/members`)
			.then((r) => r.json())
			.then((d) => setMembers(d.members ?? []))
			.catch(() => setMembers([]));
	}, []);

	if (!status) {
		return (
			<div className="text-gray-400 text-center py-12">
				<p className="text-lg">Team features not configured</p>
				<p className="text-sm mt-2">Set up team with: claw-guard team serve</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-3 gap-4">
				<div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
					<div className="text-sm text-gray-400">Status</div>
					<div
						className={`text-xl font-bold ${status.connected ? "text-green-400" : "text-red-400"}`}
					>
						{status.connected ? "Connected" : "Disconnected"}
					</div>
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

			{members.length > 0 && (
				<div className="bg-gray-900 rounded-lg border border-gray-800">
					<div className="px-4 py-3 border-b border-gray-800">
						<h3 className="text-sm font-medium text-gray-300">Team Members</h3>
					</div>
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
			)}
		</div>
	);
}
