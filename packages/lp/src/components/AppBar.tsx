import type { LPContent, Lang } from "../types";

interface Props {
	content: LPContent["nav"];
	lang: Lang;
	onToggleLang: () => void;
	onOpenDrawer: () => void;
}

export function AppBar({ content, lang, onToggleLang, onOpenDrawer }: Props) {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Left: Brand */}
					<a href="/" className="flex items-center gap-2 font-bold text-xl">
						<span className="text-claw-500">Claw</span>
						<span className="text-gray-100">Guard</span>
					</a>

					{/* Center: Nav links (desktop) */}
					<nav className="hidden md:flex items-center gap-8">
						{content.links.map((link) => (
							<a
								key={link}
								href={`#${link.toLowerCase()}`}
								className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
							>
								{link}
							</a>
						))}
					</nav>

					{/* Right: Lang toggle + CTA (desktop) + Hamburger (mobile) */}
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onToggleLang}
							className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-gray-500 hover:text-gray-100 transition-colors"
						>
							{lang === "en" ? "JP" : "EN"}
						</button>
						<a
							href="#pricing"
							className="hidden md:inline-flex items-center rounded-lg bg-claw-500 px-4 py-2 text-sm font-semibold text-white hover:bg-claw-600 transition-colors shadow-lg shadow-claw-500/20"
						>
							{content.cta}
						</a>
						<button
							type="button"
							onClick={onOpenDrawer}
							className="md:hidden rounded-md p-2 text-gray-400 hover:text-gray-100"
							aria-label="Open menu"
						>
							<svg
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								role="img"
								aria-label="Menu"
							>
								<title>Menu</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</header>
	);
}
