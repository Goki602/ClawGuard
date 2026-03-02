import type { LPContent } from "../types";

interface Props {
	content: LPContent["securityBadge"];
}

export function SecurityBadge({ content }: Props) {
	return (
		<section className="py-20 sm:py-28 bg-gray-900/30">
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
				<h2 className="text-3xl sm:text-4xl font-bold mb-6">{content.title}</h2>
				<p className="text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
					{content.description}
				</p>

				{/* Badge visual */}
				<div className="inline-flex items-center gap-4 rounded-2xl border border-accent-500/30 bg-gray-900/80 px-8 py-6 shadow-xl shadow-accent-500/5">
					{/* Shield icon */}
					<div className="flex-shrink-0">
						<svg
							className="h-16 w-16 text-accent-500"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.2}
							stroke="currentColor"
							role="img"
							aria-label="Shield"
						>
							<title>Shield</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
							/>
						</svg>
					</div>
					<div className="text-left">
						<p className="text-lg font-semibold text-accent-500">{content.badgeText}</p>
						<p className="text-sm text-gray-500 mt-1">Verified &bull; Continuous Monitoring</p>
						<div className="flex items-center gap-2 mt-2">
							<span className="inline-block w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
							<span className="text-xs text-gray-500">Active</span>
						</div>
					</div>
				</div>

				{/* Embed code preview */}
				<div className="mt-8 mx-auto max-w-md rounded-lg border border-gray-800 bg-gray-950 p-4 font-mono text-xs text-left">
					<span className="text-gray-500">{"<!-- "}</span>
					<span className="text-gray-400">Add to README.md</span>
					<span className="text-gray-500">{" -->"}</span>
					<br />
					<span className="text-claw-500">
						![ClawGuard](https://clawguard-sec.com/badge/PROJECT_ID)
					</span>
				</div>
			</div>
		</section>
	);
}
