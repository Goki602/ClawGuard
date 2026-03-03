import { useCallback, useState } from "react";
import type { LPContent } from "../types";

interface Props {
	content: LPContent["securityBadge"];
}

const BADGE_CODE = "![ClawGuard](https://api.clawguard-sec.com/badge/YOUR_PROJECT)";

export function SecurityBadge({ content }: Props) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(BADGE_CODE).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, []);

	return (
		<section className="py-20 sm:py-28 bg-gray-900/30">
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
				<h2 className="text-3xl sm:text-4xl font-bold mb-6">{content.title}</h2>
				<p className="text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
					{content.description}
				</p>

				{/* Badge visual */}
				<div className="inline-flex items-center gap-4 rounded-2xl border border-accent-500/30 bg-gray-900/80 px-8 py-6 shadow-xl shadow-accent-500/5">
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

				{/* Embed code */}
				<div className="mt-8 mx-auto max-w-lg">
					<p className="text-sm text-gray-500 mb-2">{content.embedLabel}</p>
					<div className="relative rounded-lg border border-gray-800 bg-gray-950 p-4 font-mono text-xs text-left">
						<code className="text-claw-500 break-all select-all">{BADGE_CODE}</code>
						<button
							type="button"
							onClick={handleCopy}
							className="absolute top-2 right-2 rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1 text-xs text-gray-400 hover:text-gray-100 hover:border-gray-600 transition-colors"
						>
							{copied ? content.copiedText : content.copyButton}
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}
