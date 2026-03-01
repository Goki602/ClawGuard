import type { LPContent } from "../types";

interface Props {
	content: LPContent["footer"];
}

export function FooterSection({ content }: Props) {
	return (
		<footer className="border-t border-gray-800 bg-gray-950 py-16">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
					{/* Brand column */}
					<div>
						<span className="font-bold text-lg">
							<span className="text-claw-500">Claw</span>
							<span className="text-gray-100">Guard</span>
						</span>
						<p className="mt-4 text-sm text-gray-500 leading-relaxed">AI Agent Security Platform</p>
						<a
							href={content.github}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 mt-4 text-sm text-gray-400 hover:text-gray-100 transition-colors"
						>
							<svg
								className="h-5 w-5"
								fill="currentColor"
								viewBox="0 0 24 24"
								role="img"
								aria-label="GitHub"
							>
								<title>GitHub</title>
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
							GitHub
						</a>
					</div>

					{/* Legal */}
					<div>
						<h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
							Legal
						</h4>
						<ul className="flex flex-col gap-3">
							{content.legal.map((item) => (
								<li key={item.label}>
									<a
										href={item.href}
										className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
									>
										{item.label}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* DevEx */}
					<div>
						<h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
							DevEx
						</h4>
						<ul className="flex flex-col gap-3">
							{content.devex.map((item) => (
								<li key={item.label}>
									<a
										href={item.href}
										className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
									>
										{item.label}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Support */}
					<div>
						<h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
							Support
						</h4>
						<ul className="flex flex-col gap-3">
							{content.support.map((item) => (
								<li key={item.label}>
									<a
										href={item.href}
										className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
									>
										{item.label}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Copyright */}
				<div className="mt-12 pt-8 border-t border-gray-800/50 text-center text-sm text-gray-600">
					{content.copyright}
				</div>
			</div>
		</footer>
	);
}
