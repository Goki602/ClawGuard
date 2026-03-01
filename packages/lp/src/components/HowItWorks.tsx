import type { LPContent } from "../types";

interface Props {
	content: LPContent["howItWorks"];
}

export function HowItWorks({ content }: Props) {
	return (
		<section className="py-20 sm:py-28 bg-gray-900/30">
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
				<h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">{content.title}</h2>
				<div className="flex flex-col gap-12">
					{content.steps.map((step) => (
						<div key={step.step} className="flex items-start gap-6">
							{/* Step number circle */}
							<div className="flex-shrink-0 w-12 h-12 rounded-full bg-claw-500/20 border border-claw-500/40 flex items-center justify-center text-claw-500 font-bold text-lg">
								{step.step}
							</div>
							<div className="flex-1 pt-1">
								<h3 className="text-xl font-semibold text-gray-100 mb-2">{step.title}</h3>
								{/* Render step 1 as a terminal-style code block */}
								{step.step === "1" ? (
									<div className="rounded-lg border border-gray-800 bg-gray-950 p-4 font-mono text-sm">
										<span className="text-gray-500">$ </span>
										<span className="text-accent-500">{step.description}</span>
									</div>
								) : (
									<p className="text-gray-400 leading-relaxed">{step.description}</p>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
