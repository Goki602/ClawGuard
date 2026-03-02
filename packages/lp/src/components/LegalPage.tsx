import type { Lang } from "../types";

interface Props {
	title: string;
	lang: Lang;
	children: React.ReactNode;
}

const BACK = { en: "Back to Home", jp: "トップに戻る" } as const;

export function LegalPage({ title, lang, children }: Props) {
	return (
		<section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
			<a
				href="#"
				className="inline-flex items-center gap-1 text-sm text-claw-500 hover:text-claw-400 transition-colors mb-8"
			>
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<title>Back</title>
					<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
				{BACK[lang]}
			</a>
			<h1 className="text-3xl font-bold text-gray-100 mb-10">{title}</h1>
			<div className="prose prose-invert prose-gray max-w-none text-gray-300 leading-relaxed">
				{children}
			</div>
		</section>
	);
}
