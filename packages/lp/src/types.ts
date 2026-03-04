export interface LPContent {
	nav: { brand: string; cta: string; links: Array<{ label: string; href: string }> };
	hero: {
		headline: string;
		subheadline: string;
		cta: string;
		secondaryCta: string;
		terminal: {
			ready: string;
			agentSession: string;
			command: string;
			confirmLabel: string;
			confirmDetail: string;
		};
	};
	features: {
		title: string;
		cards: Array<{ title: string; description: string; icon: string }>;
	};
	pricing: {
		title: string;
		earlyAccessNote?: string;
		cards: Array<{
			name: string;
			price: string;
			period: string;
			features: string[];
			cta: string;
			href?: string;
			highlighted?: boolean;
			highlightLabel?: string;
			comingSoon?: boolean;
			comingSoonLabel?: string;
		}>;
	};
	howItWorks: {
		title: string;
		steps: Array<{ step: string; title: string; description: string }>;
	};
	securityBadge: {
		title: string;
		description: string;
		badgeText: string;
		badgeSubtitle: string;
		badgeStatus: string;
		embedLabel: string;
		copyButton: string;
		copiedText: string;
		steps: Array<{ step: string; title: string; description: string; command?: string }>;
	};
	footer: {
		headings: { legal: string; devex: string; support: string; description: string };
		legal: Array<{ label: string; href: string }>;
		devex: Array<{ label: string; href: string }>;
		support: Array<{ label: string; href: string }>;
		copyright: string;
		github: string;
	};
}

export type Lang = "en" | "jp";
