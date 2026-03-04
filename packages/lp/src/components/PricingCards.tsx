import type { LPContent } from "../types";

interface Props {
	content: LPContent["pricing"];
}

export function PricingCards({ content }: Props) {
	return (
		<section id="pricing" className="py-20 sm:py-28">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">{content.title}</h2>
				{content.earlyAccessNote && (
					<p className="text-center text-accent-500 font-medium mb-16 max-w-2xl mx-auto">
						{content.earlyAccessNote}
					</p>
				)}
				{!content.earlyAccessNote && <div className="mb-12" />}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
					{content.cards.map((card) => (
						<div
							key={card.name}
							className={`relative rounded-2xl border p-8 flex flex-col ${
								card.highlighted
									? "border-claw-500 bg-gray-900/80 shadow-2xl shadow-claw-500/10 scale-105 z-10"
									: "border-gray-800 bg-gray-900/50"
							}`}
						>
							{card.highlighted && card.highlightLabel && (
								<div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-claw-500 px-4 py-1 text-xs font-semibold text-white">
									{card.highlightLabel}
								</div>
							)}
							<h3 className="text-xl font-bold text-gray-100">{card.name}</h3>
							<div className="mt-4 flex items-baseline gap-2">
								{card.price !== "$0" && !card.comingSoon ? (
									<>
										<span className="text-2xl font-bold text-gray-500 line-through">
											{card.price}
										</span>
										<span className="text-4xl font-bold text-accent-500">$0</span>
									</>
								) : (
									<span className="text-4xl font-bold text-gray-100">{card.price}</span>
								)}
								<span className="text-sm text-gray-500">{card.period}</span>
							</div>
							<ul className="mt-8 flex flex-col gap-3 flex-1">
								{card.features.map((feature) => (
									<li key={feature} className="flex items-start gap-2 text-sm text-gray-400">
										<svg
											className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-500"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={2}
											stroke="currentColor"
											role="img"
											aria-hidden="true"
										>
											<title>Check</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M4.5 12.75l6 6 9-13.5"
											/>
										</svg>
										{feature}
									</li>
								))}
							</ul>
							{card.comingSoon ? (
								<span className="mt-8 block rounded-lg py-3 text-center text-sm font-semibold border border-gray-700 text-gray-500 opacity-50 cursor-not-allowed">
									{card.comingSoonLabel ?? card.cta}
								</span>
							) : (
								<a
									href={card.href ?? "#how-it-works"}
									{...(card.href?.startsWith("http")
										? { target: "_blank", rel: "noopener noreferrer" }
										: {})}
									className={`mt-8 block rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
										card.highlighted
											? "bg-claw-500 text-white hover:bg-claw-600 shadow-lg shadow-claw-500/20"
											: "border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-gray-100"
									}`}
								>
									{card.cta}
								</a>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
