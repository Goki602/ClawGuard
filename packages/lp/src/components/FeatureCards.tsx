import type { LPContent } from "../types";

interface Props {
	content: LPContent["features"];
}

export function FeatureCards({ content }: Props) {
	return (
		<section id="features" className="py-20 sm:py-28">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">{content.title}</h2>
				<p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{content.cards.map((card) => (
						<div
							key={card.title}
							className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 hover:border-claw-500/50 hover:shadow-lg hover:shadow-claw-500/5 transition-all duration-300"
						>
							<div className="text-3xl mb-4">{card.icon}</div>
							<h3 className="text-lg font-semibold text-gray-100 mb-2">{card.title}</h3>
							<p className="text-sm text-gray-400 leading-relaxed">{card.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
