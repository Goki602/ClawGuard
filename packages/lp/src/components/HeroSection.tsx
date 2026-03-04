import type { LPContent } from "../types";

interface Props {
	content: LPContent["hero"];
}

export function HeroSection({ content }: Props) {
	return (
		<section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
			{/* Background gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-claw-500/10 via-transparent to-transparent pointer-events-none" />
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-claw-500/5 rounded-full blur-3xl pointer-events-none" />

			<div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
				<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
					{content.headline}
				</h1>
				<p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
					{content.subheadline}
				</p>
				<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
					<a
						href="#how-it-works"
						className="inline-flex items-center rounded-lg bg-claw-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-claw-600 transition-colors shadow-xl shadow-claw-500/25"
					>
						{content.cta}
					</a>
					<a
						href="https://github.com/Goki602/ClawGuard"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center rounded-lg border border-gray-700 px-8 py-3.5 text-base font-semibold text-gray-300 hover:border-gray-500 hover:text-gray-100 transition-colors"
					>
						{content.secondaryCta}
					</a>
				</div>

				{/* Terminal preview */}
				<div className="mt-16 mx-auto max-w-xl rounded-xl border border-gray-800 bg-gray-900/80 shadow-2xl overflow-hidden">
					<div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
						<div className="w-3 h-3 rounded-full bg-red-500/80" />
						<div className="w-3 h-3 rounded-full bg-yellow-500/80" />
						<div className="w-3 h-3 rounded-full bg-green-500/80" />
						<span className="ml-2 text-xs text-gray-500">terminal</span>
					</div>
					<div className="p-4 font-mono text-sm text-left">
						<p className="text-gray-500">$</p>
						<p className="text-accent-500">claw-guard init</p>
						<p className="text-gray-400 mt-2">
							<span className="text-claw-500">{">"}</span> Profile:{" "}
							<span className="text-white">balanced</span> | Rules:{" "}
							<span className="text-white">12</span>
						</p>
						<p className="text-accent-500 mt-1">Ready.</p>
						<p className="text-gray-600 mt-4">--- AI agent session ---</p>
						<p className="text-gray-500 mt-2">$ rm -rf /tmp/project</p>
						<p className="text-red-400 mt-1">
							<span className="text-red-500 font-bold">{"⚠"} CONFIRM</span>{" "}
							<span className="text-gray-300">Bulk file deletion</span>
						</p>
						<p className="text-gray-500 text-xs mt-1">
							Wrong path could destroy your entire project.
						</p>
						<p className="text-gray-400 text-xs mt-1">
							[<span className="text-accent-500">allow</span>] [
							<span className="text-red-400">deny</span>] [
							<span className="text-claw-500">explain</span>]
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
