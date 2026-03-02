export interface LPContent {
	nav: { brand: string; cta: string; links: Array<{ label: string; href: string }> };
	hero: {
		headline: string;
		subheadline: string;
		cta: string;
		secondaryCta: string;
	};
	features: {
		title: string;
		cards: Array<{ title: string; description: string; icon: string }>;
	};
	pricing: {
		title: string;
		cards: Array<{
			name: string;
			price: string;
			period: string;
			features: string[];
			cta: string;
			highlighted?: boolean;
		}>;
	};
	howItWorks: {
		title: string;
		steps: Array<{ step: string; title: string; description: string }>;
	};
	securityBadge: { title: string; description: string; badgeText: string };
	footer: {
		legal: Array<{ label: string; href: string }>;
		devex: Array<{ label: string; href: string }>;
		support: Array<{ label: string; href: string }>;
		copyright: string;
		github: string;
	};
}

export type Lang = "en" | "jp";
