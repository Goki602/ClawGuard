import { useEffect, useState } from "react";
import type { PassportData } from "../types";

const API_BASE = "http://127.0.0.1:19280";

export function SecurityPassport() {
	const [passport, setPassport] = useState<PassportData | null>(null);
	const [badgeUrl, setBadgeUrl] = useState<string | null>(null);
	const [generating, setGenerating] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		fetch(`${API_BASE}/api/passport`)
			.then((r) => r.json())
			.then((d) => {
				if (d.version) {
					setPassport(d);
					setBadgeUrl(`${API_BASE}/api/passport/badge`);
				}
			})
			.catch(() => setPassport(null));
	}, []);

	const handleGenerate = () => {
		setGenerating(true);
		fetch(`${API_BASE}/api/passport/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ repository: "my/repo" }),
		})
			.then((r) => r.json())
			.then((d) => {
				setPassport(d);
				setBadgeUrl(`${API_BASE}/api/passport/badge`);
			})
			.catch(() => {})
			.finally(() => setGenerating(false));
	};

	const copyBadgeMarkdown = () => {
		if (!passport) return;
		const incidents = passport.summary.incidents;
		const color = incidents === 0 ? "brightgreen" : "yellow";
		const msg = incidents === 0 ? "monitored" : `${incidents} incidents`;
		const md = `[![ClawGuard](https://img.shields.io/badge/ClawGuard-${encodeURIComponent(msg)}-${color})](https://github.com/clawguard/clawguard)`;
		navigator.clipboard.writeText(md);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (!passport) {
		return (
			<div className="text-center py-16">
				<p className="text-lg text-gray-500">No security passport found</p>
				<p className="text-sm text-gray-600 mt-2">Generate one to prove continuous monitoring</p>
				<button
					type="button"
					onClick={handleGenerate}
					disabled={generating}
					className="mt-4 px-4 py-2 bg-claw-600 text-white rounded hover:bg-claw-500 transition-colors disabled:opacity-50"
				>
					{generating ? "Generating..." : "Generate Passport"}
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Passport Card */}
			<div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-200">Security Passport</h3>
					<span
						className={`text-xs px-2 py-1 rounded ${
							passport.signature
								? "bg-green-900/30 text-green-400 border border-green-800"
								: "bg-gray-800 text-gray-500"
						}`}
					>
						{passport.signature ? "Signed" : "Unsigned"}
					</span>
				</div>

				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span className="text-gray-500">Repository</span>
						<p className="text-gray-300 font-mono">{passport.repository}</p>
					</div>
					<div>
						<span className="text-gray-500">Monitoring since</span>
						<p className="text-gray-300">{passport.monitoring_since}</p>
					</div>
					<div>
						<span className="text-gray-500">Feed version</span>
						<p className="text-gray-300">{passport.feed_version}</p>
					</div>
					<div>
						<span className="text-gray-500">Last updated</span>
						<p className="text-gray-300">{new Date(passport.last_updated).toLocaleString()}</p>
					</div>
				</div>
			</div>

			{/* Summary Stats */}
			<div className="grid grid-cols-5 gap-3">
				{[
					{ label: "Total", value: passport.summary.total_decisions, color: "text-gray-200" },
					{ label: "Allowed", value: passport.summary.allowed, color: "text-green-400" },
					{ label: "Confirmed", value: passport.summary.confirmed, color: "text-yellow-400" },
					{ label: "Denied", value: passport.summary.denied, color: "text-red-400" },
					{
						label: "Incidents",
						value: passport.summary.incidents,
						color: passport.summary.incidents === 0 ? "text-green-400" : "text-red-400",
					},
				].map((stat) => (
					<div
						key={stat.label}
						className="bg-gray-900 rounded-lg border border-gray-800 p-3 text-center"
					>
						<div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
						<div className="text-xs text-gray-500 mt-1">{stat.label}</div>
					</div>
				))}
			</div>

			{/* Agents */}
			<div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
				<h4 className="text-sm font-medium text-gray-300 mb-2">Agents Monitored</h4>
				<div className="flex gap-2">
					{passport.agents_monitored.length === 0 ? (
						<span className="text-sm text-gray-500">No agents detected</span>
					) : (
						passport.agents_monitored.map((a) => (
							<span key={a} className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded">
								{a}
							</span>
						))
					)}
				</div>
			</div>

			{/* Badge */}
			<div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
				<div className="flex items-center justify-between mb-3">
					<h4 className="text-sm font-medium text-gray-300">Badge</h4>
					<button
						type="button"
						onClick={copyBadgeMarkdown}
						className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition-colors"
					>
						{copied ? "Copied!" : "Copy Markdown"}
					</button>
				</div>
				{badgeUrl && <img src={badgeUrl} alt="ClawGuard badge" className="h-5" />}
			</div>

			{/* Actions */}
			<div className="flex gap-3">
				<button
					type="button"
					onClick={handleGenerate}
					disabled={generating}
					className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
				>
					{generating ? "Regenerating..." : "Regenerate"}
				</button>
			</div>
		</div>
	);
}
