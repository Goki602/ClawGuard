import type { LPContent, Lang } from "../types";

interface Props {
	open: boolean;
	onClose: () => void;
	content: LPContent["nav"];
	lang: Lang;
	onToggleLang: () => void;
}

export function Drawer({ open, onClose, content, lang, onToggleLang }: Props) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[60]">
			{/* Overlay */}
			<button
				type="button"
				className="fixed inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				aria-label="Close menu"
			/>
			{/* Slide-in panel */}
			<div className="fixed inset-y-0 left-0 w-72 bg-gray-900 border-r border-gray-800 shadow-2xl p-6 flex flex-col">
				{/* Close button */}
				<div className="flex items-center justify-between mb-8">
					<span className="font-bold text-lg">
						<span className="text-claw-500">Claw</span>
						<span className="text-gray-100">Guard</span>
					</span>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1.5 text-gray-400 hover:text-gray-100"
						aria-label="Close menu"
					>
						<svg
							className="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							role="img"
							aria-label="Close"
						>
							<title>Close</title>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				{/* Nav links */}
				<nav className="flex flex-col gap-4 flex-1">
					{content.links.map((link) => (
						<a
							key={link.href}
							href={link.href}
							onClick={onClose}
							className="text-gray-300 hover:text-gray-100 text-lg transition-colors"
							{...(link.href.startsWith("http")
								? { target: "_blank", rel: "noopener noreferrer" }
								: {})}
						>
							{link.label}
						</a>
					))}
				</nav>
				{/* Bottom: lang toggle + CTA */}
				<div className="flex flex-col gap-3 pt-6 border-t border-gray-800">
					<button
						type="button"
						onClick={onToggleLang}
						className="rounded-md border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-gray-100 transition-colors"
					>
						{lang === "en" ? "\u{1F1EF}\u{1F1F5} Japanese" : "\u{1F1FA}\u{1F1F8} English"}
					</button>
					<button
						type="button"
						onClick={() => {
							onClose();
							document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
						}}
						className="inline-flex items-center justify-center rounded-lg bg-claw-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-claw-600 transition-colors shadow-lg shadow-claw-500/20"
					>
						{content.cta}
					</button>
				</div>
			</div>
		</div>
	);
}
