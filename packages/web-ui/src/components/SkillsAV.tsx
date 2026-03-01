import { useEffect, useState } from "react";
import type { SkillScanResultUI } from "../types";

const API_BASE = "http://127.0.0.1:19280";

export function SkillsAV() {
	const [results, setResults] = useState<SkillScanResultUI[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`${API_BASE}/api/skills/scan`)
			.then((r) => r.json())
			.then((d) => setResults(d.results ?? []))
			.catch(() => setResults([]))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return <div className="text-gray-400 text-center py-12">Scanning skills...</div>;
	}

	if (results.length === 0) {
		return (
			<div className="text-gray-400 text-center py-12">
				<p className="text-lg">No skills installed</p>
				<p className="text-sm mt-2">Skills will appear here when detected in ~/.claude/skills/</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{results.map((r) => (
				<div
					key={r.path}
					className={`bg-gray-900 rounded-lg p-4 border ${r.status === "clean" ? "border-green-900" : r.status === "revoked" ? "border-red-900" : "border-yellow-900"}`}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span
								className={`text-lg ${r.status === "clean" ? "text-green-400" : r.status === "revoked" ? "text-red-400" : "text-yellow-400"}`}
							>
								{r.status === "clean" ? "✓" : r.status === "revoked" ? "✗" : "⚠"}
							</span>
							<span className="font-medium">{r.name}</span>
						</div>
						<span
							className={`px-2 py-0.5 rounded text-xs ${r.status === "clean" ? "bg-green-900 text-green-300" : r.status === "revoked" ? "bg-red-900 text-red-300" : "bg-yellow-900 text-yellow-300"}`}
						>
							{r.status}
						</span>
					</div>
					{r.findings.length > 0 && (
						<div className="mt-2 space-y-1">
							{r.findings.map((f, i) => (
								<div key={`${f.type}-${i}`} className="text-sm text-gray-400 pl-7">
									<span className={f.severity === "high" ? "text-red-400" : "text-yellow-400"}>
										{f.severity}
									</span>
									{" — "}
									{f.detail}
								</div>
							))}
						</div>
					)}
				</div>
			))}
		</div>
	);
}
